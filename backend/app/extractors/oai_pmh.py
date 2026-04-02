import requests
from lxml import etree
from datetime import datetime
from typing import Tuple, List, Dict
from urllib.parse import urljoin
import logging
import time

logger = logging.getLogger(__name__)


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
                response = self.session.get(
                    self.base_url,
                    params=params,
                    timeout=self.timeout
                )
                response.raise_for_status()
                return response
            except requests.RequestException as e:
                if attempt < self.max_retries - 1:
                    wait_time = 5 ** attempt  
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
            
            dc = metadata.find(f"{{{self.DC_NAMESPACE}}}dc", namespaces={
                "dc": self.DC_NAMESPACE,
                "dcterms": self.DCTERMS_NAMESPACE
            })
            
            if dc is None:
                dc = metadata[0]
            
            article = {
                "oai_identifier": oai_identifier,
                "title": self._extract_text(dc, "title"),
                "authors": self._extract_list(dc, "creator"),
                "abstract": self._extract_text(dc, "description"),
                "keywords": self._extract_list(dc, "subject"),
                "publication_date": self._parse_date(self._extract_text(dc, "issued")),
                "url": self._extract_text(dc, "identifier"),
                "doi": self._extract_doi(dc),
                "issn": self._extract_text(dc, "isPartOf"),
                "language": self._extract_text(dc, "language", default="pt"),
                "raw_metadata": {
                    "oai_identifier": oai_identifier,
                    "harvested_at": datetime.utcnow().isoformat()
                }
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
    
    def _extract_doi(self, element) -> str:
        identifiers = self._extract_list(element, "identifier")
        for identifier in identifiers:
            if identifier.startswith("http") and "doi" in identifier.lower():
                return identifier
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
