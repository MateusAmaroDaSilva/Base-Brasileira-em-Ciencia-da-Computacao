import requests
from lxml import etree
from datetime import datetime
from typing import Optional, Tuple, List, Dict
import logging
import re
import time

logger = logging.getLogger(__name__)


_DATE_ONLY = re.compile(r"^\d{4}(-\d{2}(-\d{2})?)?$")
_BARE_DOI = re.compile(r"^10\.\d{4,9}/\S+$")
_ISSN = re.compile(r"^\d{4}-\d{3}[\dXx]$")
_VOLUME = re.compile(r"\b(?:vol(?:ume)?\.?|v\.)\s*(\d+)", re.IGNORECASE)
_ISSUE = re.compile(r"\b(?:n[ºo°]?\.?|num(?:ero)?\.?|no\.?)\s*(\d+)", re.IGNORECASE)
_PAGES = re.compile(r";\s*([A-Za-z]?\d+(?:\s*[-–]\s*[A-Za-z]?\d+)?)\s*$")

# dc:type no padrao do OpenAIRE (info:eu-repo/semantics/...) para os tipos de publicacao do site
_TYPE_MAP = [
    ("conferenceobject", "artigo_conferencia"),
    ("conferencepaper", "artigo_conferencia"),
    ("masterthesis", "dissertacao"),
    ("doctoralthesis", "tese"),
    ("bookpart", "capitulo_livro"),
    ("article", "artigo"),
]


class OAIPMHExtractor:
    OAI_NAMESPACE = "http://www.openarchives.org/OAI/2.0/"
    DC_NAMESPACE = "http://purl.org/dc/elements/1.1/"
    DCTERMS_NAMESPACE = "http://purl.org/dc/terms/"

    def __init__(self, base_url: str, timeout: int = 30, max_retries: int = 3):
        self.base_url = base_url
        self.timeout = timeout
        self.max_retries = max_retries
        self.session = requests.Session()

    def _make_request(self, params: Dict) -> requests.Response:
        for attempt in range(self.max_retries):
            try:
                response = self.session.get(self.base_url, params=params, timeout=self.timeout)
                response.raise_for_status()
                return response
            except requests.RequestException:
                if attempt < self.max_retries - 1:
                    wait_time = 5**attempt
                    logger.warning(f"Tentativa {attempt + 1} falhou, aguardando {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    raise

    def validate_repository(self) -> bool:
        try:
            params = {"verb": "Identify"}
            response = self._make_request(params)

            root = etree.fromstring(response.content)

            identify = root.find(f"{{{self.OAI_NAMESPACE}}}Identify")
            return identify is not None
        except Exception as e:
            logger.error(f"Falha ao validar repositório {self.base_url}: {e}")
            return False

    def fetch_articles(self, from_date: str = None) -> Tuple[List[Dict], Dict, List[str]]:
        new_articles = []
        updated_articles = {}
        errors = []
        resumption_token = None

        try:
            while True:
                params = {"verb": "ListRecords", "metadataPrefix": "oai_dc"}

                if from_date:
                    params["from"] = from_date

                if resumption_token:
                    params["resumptionToken"] = resumption_token
                    params.pop("verb")
                    params.pop("metadataPrefix", None)
                    params.pop("from", None)
                    params["verb"] = "ListRecords"

                logger.info(f"Requisitando com params: {params}")
                response = self._make_request(params)

                root = etree.fromstring(response.content)

                # Processar registros
                records = root.findall(f".//{{{self.OAI_NAMESPACE}}}record")

                for record in records:
                    try:
                        article = self._parse_record(record)
                        if article:
                            new_articles.append(article)
                    except Exception as e:
                        error_msg = f"Erro ao processar registro: {e}"
                        logger.error(error_msg)
                        errors.append(error_msg)

                # Verificar resumption token
                resumption_elem = root.find(f".//{{{self.OAI_NAMESPACE}}}resumptionToken")
                if resumption_elem is not None and resumption_elem.text:
                    resumption_token = resumption_elem.text
                else:
                    break

        except Exception as e:
            error_msg = f"Erro na extração: {e}"
            logger.error(error_msg)
            errors.append(error_msg)

        return new_articles, updated_articles, errors

    def _parse_record(self, record_elem) -> Dict:
        try:
            header = record_elem.find(f"{{{self.OAI_NAMESPACE}}}header")
            oai_id = header.find(f"{{{self.OAI_NAMESPACE}}}identifier")
            oai_identifier = oai_id.text if oai_id is not None else None

            metadata = record_elem.find(f"{{{self.OAI_NAMESPACE}}}metadata")
            if metadata is None:
                return None

            dc = metadata.find(
                f"{{{self.DC_NAMESPACE}}}dc", namespaces={"dc": self.DC_NAMESPACE, "dcterms": self.DCTERMS_NAMESPACE}
            )

            if dc is None:
                dc = metadata[0]

            identifiers = self._extract_list(dc, "identifier")
            sources = self._extract_list(dc, "source")
            rights = self._extract_list(dc, "rights")
            volume, issue, pages = self._parse_source(sources)

            article = {
                "oai_identifier": oai_identifier,
                "title": self._extract_text(dc, "title"),
                "authors": self._unique(self._extract_list(dc, "creator")),
                "abstract": self._extract_text(dc, "description"),
                # as revistas repetem os assuntos em cada idioma do registro
                "keywords": self._unique(self._extract_list(dc, "subject")),
                "publication_date": self._extract_publication_date(dc),
                "url": self._extract_url(identifiers),
                "doi": self._extract_doi(dc),
                "issn": self._extract_issn(sources) or self._extract_text(dc, "isPartOf"),
                "volume": volume,
                "issue": issue,
                "pages": pages,
                "language": self._extract_text(dc, "language", default="pt"),
                "article_type": self._extract_type(self._extract_list(dc, "type")),
                "publisher": self._extract_text(dc, "publisher"),
                "license": self._extract_license(rights),
                "open_access": self._is_open_access(rights, self._extract_list(dc, "type")),
                "raw_metadata": {"oai_identifier": oai_identifier, "harvested_at": datetime.utcnow().isoformat()},
            }

            return article

        except Exception as e:
            logger.error(f"Erro ao fazer parse do registro: {e}")
            return None

    def _extract_text(self, element, tag_name: str, default: str = None) -> str:
        elements = element.findall(f".//{{{self.DC_NAMESPACE}}}{tag_name}")
        if elements:
            return elements[0].text
        return default

    def _extract_list(self, element, tag_name: str, default: List = None) -> List[str]:
        elements = element.findall(f".//{{{self.DC_NAMESPACE}}}{tag_name}")
        return [e.text for e in elements if e.text] if elements else (default or [])

    def _extract_doi(self, element) -> Optional[str]:
        identifiers = self._extract_list(element, "identifier")
        for identifier in identifiers:
            if identifier.startswith("http") and "doi" in identifier.lower():
                return identifier
        # Muitas revistas mandam o DOI "puro", sem o endereco: 10.5753/rbie.2021.2069
        for identifier in identifiers:
            candidate = identifier.strip()
            if candidate.lower().startswith("doi:"):
                candidate = candidate[4:].strip()
            if _BARE_DOI.match(candidate):
                return candidate
        return None

    @staticmethod
    def _unique(values: List[str]) -> List[str]:
        """Remove repeticoes (sem diferenciar maiusculas), mantendo a ordem."""
        seen = set()
        result = []
        for value in values:
            key = value.strip().casefold()
            if key and key not in seen:
                seen.add(key)
                result.append(value.strip())
        return result

    def _extract_publication_date(self, dc) -> Optional[datetime]:
        """Data de publicacao: dcterms:issued, ou o dc:date so com dia (o outro dc:date e a data de registro)."""
        issued = self._parse_date(self._extract_text(dc, "issued"))
        if issued:
            return issued
        dates = self._extract_list(dc, "date")
        for value in dates:
            if _DATE_ONLY.match(value.strip()):
                return self._parse_date(value)
        for value in dates:
            parsed = self._parse_date(value.strip()[:10])
            if parsed:
                return parsed
        return None

    @staticmethod
    def _extract_url(identifiers: List[str]) -> Optional[str]:
        """Endereco da pagina do artigo: o primeiro link que nao seja o do DOI."""
        links = [i.strip() for i in identifiers if i.strip().startswith("http")]
        for link in links:
            if "doi.org" not in link.lower():
                return link
        return links[0] if links else (identifiers[0] if identifiers else None)

    @staticmethod
    def _extract_issn(sources: List[str]) -> Optional[str]:
        for source in sources:
            if _ISSN.match(source.strip()):
                return source.strip().upper()
        return None

    @staticmethod
    def _parse_source(sources: List[str]) -> Tuple[Optional[str], Optional[str], Optional[str]]:
        """Volume, numero e paginas a partir de 'Revista; Vol. 29 No. 2 (2021); 1337-1355'."""
        for source in sources:
            if _ISSN.match(source.strip()) or not (_VOLUME.search(source) or _ISSUE.search(source)):
                continue
            volume = _VOLUME.search(source)
            issue = _ISSUE.search(source)
            pages = _PAGES.search(source)
            return (
                volume.group(1) if volume else None,
                issue.group(1) if issue else None,
                re.sub(r"\s*[–]\s*|\s+", "-", pages.group(1).strip()) if pages else None,
            )
        return None, None, None

    @staticmethod
    def _extract_type(types: List[str]) -> str:
        """Tipo de publicacao a partir de dc:type; sem informacao conhecida, e um artigo."""
        lowered = [t.lower() for t in types]
        for needle, mapped in _TYPE_MAP:
            if any(needle in t for t in lowered):
                return mapped
        return "artigo"

    @staticmethod
    def _extract_license(rights: List[str]) -> Optional[str]:
        for value in rights:
            if value.strip().startswith("http"):
                return value.strip()[:300]
        return None

    @staticmethod
    def _is_open_access(rights: List[str], types: List[str]) -> Optional[bool]:
        """So afirma acesso aberto quando o registro traz prova (licenca Creative Commons ou
        info:eu-repo/semantics/openAccess); sem prova, fica desconhecido (None)."""
        evidence = [v.lower() for v in rights + types]
        if any("creativecommons.org" in v or "openaccess" in v for v in evidence):
            return True
        return None

    def _parse_date(self, date_str: str) -> datetime:
        if not date_str:
            return None

        for fmt in ["%Y-%m-%d", "%Y-%m", "%Y", "%d/%m/%Y"]:
            try:
                return datetime.strptime(date_str.strip(), fmt)
            except ValueError:
                continue

        return None
