import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime
from lxml import etree


OAI_NS = "http://www.openarchives.org/OAI/2.0/"
DC_NS = "http://purl.org/dc/elements/1.1/"


def _make_oai_response(records_xml: str, resumption_token: str = None) -> bytes:
    token_xml = ""
    if resumption_token:
        token_xml = f"<resumptionToken xmlns='{OAI_NS}'>{resumption_token}</resumptionToken>"

    return f"""<?xml version="1.0" encoding="UTF-8"?>
<OAI-PMH xmlns="{OAI_NS}">
  <ListRecords>
    {records_xml}
    {token_xml}
  </ListRecords>
</OAI-PMH>""".encode("utf-8")


def _make_record(oai_id: str, title: str, author: str = "Author A",
                 abstract: str = "Abstract text", date: str = "2026-01-15",
                 keywords: list = None) -> str:
    keywords = keywords or ["kw1", "kw2"]
    subjects = "".join(f"<dc:subject xmlns:dc='{DC_NS}'>{k}</dc:subject>" for k in keywords)
    return f"""
<record xmlns="{OAI_NS}">
  <header>
    <identifier>{oai_id}</identifier>
    <datestamp>2026-01-15</datestamp>
  </header>
  <metadata>
    <oai_dc:dc xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/"
               xmlns:dc="{DC_NS}">
      <dc:title xmlns:dc="{DC_NS}">{title}</dc:title>
      <dc:creator xmlns:dc="{DC_NS}">{author}</dc:creator>
      <dc:description xmlns:dc="{DC_NS}">{abstract}</dc:description>
      <dc:date xmlns:dc="{DC_NS}">{date}</dc:date>
      {subjects}
      <dc:identifier xmlns:dc="{DC_NS}">https://example.com/article/1</dc:identifier>
      <dc:language xmlns:dc="{DC_NS}">pt</dc:language>
    </oai_dc:dc>
  </metadata>
</record>"""


def _make_identify_response() -> bytes:
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<OAI-PMH xmlns="{OAI_NS}">
  <Identify>
    <repositoryName>Test Repo</repositoryName>
    <baseURL>http://test.com/oai</baseURL>
  </Identify>
</OAI-PMH>""".encode("utf-8")


@pytest.mark.unit
class TestOAIPMHExtractorInit:

    def test_init_stores_base_url(self):
        from app.extractors.oai_pmh import OAIPMHExtractor
        extractor = OAIPMHExtractor("http://test.com/oai")
        assert extractor.base_url == "http://test.com/oai"

    def test_init_default_timeout(self):
        from app.extractors.oai_pmh import OAIPMHExtractor
        extractor = OAIPMHExtractor("http://test.com/oai")
        assert extractor.timeout == 30

    def test_init_custom_timeout(self):
        from app.extractors.oai_pmh import OAIPMHExtractor
        extractor = OAIPMHExtractor("http://test.com/oai", timeout=60)
        assert extractor.timeout == 60

    def test_init_custom_max_retries(self):
        from app.extractors.oai_pmh import OAIPMHExtractor
        extractor = OAIPMHExtractor("http://test.com/oai", max_retries=5)
        assert extractor.max_retries == 5


@pytest.mark.unit
class TestOAIPMHValidateRepository:

    def test_validate_repository_success(self):
        from app.extractors.oai_pmh import OAIPMHExtractor

        mock_response = MagicMock()
        mock_response.content = _make_identify_response()

        extractor = OAIPMHExtractor("http://test.com/oai")
        with patch.object(extractor, "_make_request", return_value=mock_response):
            result = extractor.validate_repository()

        assert result is True

    def test_validate_repository_failure(self):
        from app.extractors.oai_pmh import OAIPMHExtractor

        extractor = OAIPMHExtractor("http://test.com/oai")
        with patch.object(extractor, "_make_request", side_effect=Exception("Network error")):
            result = extractor.validate_repository()

        assert result is False

    def test_validate_repository_invalid_xml(self):
        from app.extractors.oai_pmh import OAIPMHExtractor

        mock_response = MagicMock()
        mock_response.content = b"<invalid xml"

        extractor = OAIPMHExtractor("http://test.com/oai")
        with patch.object(extractor, "_make_request", return_value=mock_response):
            result = extractor.validate_repository()

        assert result is False


@pytest.mark.unit
class TestOAIPMHMakeRequest:

    def test_make_request_success_on_first_try(self):
        from app.extractors.oai_pmh import OAIPMHExtractor

        mock_response = MagicMock()
        mock_response.status_code = 200

        extractor = OAIPMHExtractor("http://test.com/oai")
        with patch.object(extractor.session, "get", return_value=mock_response) as mock_get:
            response = extractor._make_request({"verb": "Identify"})

        assert response is mock_response
        assert mock_get.call_count == 1

    def test_make_request_retries_on_failure(self):
        from app.extractors.oai_pmh import OAIPMHExtractor
        import requests

        mock_response = MagicMock()
        extractor = OAIPMHExtractor("http://test.com/oai", max_retries=3)

        call_count = 0
        def side_effect(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise requests.RequestException("timeout")
            return mock_response

        with patch.object(extractor.session, "get", side_effect=side_effect):
            with patch("time.sleep"):
                response = extractor._make_request({"verb": "Identify"})

        assert response is mock_response
        assert call_count == 3

    def test_make_request_raises_after_max_retries(self):
        from app.extractors.oai_pmh import OAIPMHExtractor
        import requests

        extractor = OAIPMHExtractor("http://test.com/oai", max_retries=2)

        with patch.object(extractor.session, "get", side_effect=requests.RequestException("fail")):
            with patch("time.sleep"):
                with pytest.raises(requests.RequestException):
                    extractor._make_request({"verb": "Identify"})


@pytest.mark.unit
class TestOAIPMHFetchArticles:

    def test_fetch_articles_single_page(self):
        from app.extractors.oai_pmh import OAIPMHExtractor

        record_xml = _make_record("oai:test:1", "Article One")
        response_body = _make_oai_response(record_xml)

        mock_response = MagicMock()
        mock_response.content = response_body

        extractor = OAIPMHExtractor("http://test.com/oai")
        with patch.object(extractor, "_make_request", return_value=mock_response):
            new_articles, updated, errors = extractor.fetch_articles()

        assert len(new_articles) == 1
        assert new_articles[0]["title"] == "Article One"
        assert new_articles[0]["oai_identifier"] == "oai:test:1"
        assert errors == []

    def test_fetch_articles_multiple_records(self):
        from app.extractors.oai_pmh import OAIPMHExtractor

        records = _make_record("oai:test:1", "Article 1") + _make_record("oai:test:2", "Article 2")
        response_body = _make_oai_response(records)

        mock_response = MagicMock()
        mock_response.content = response_body

        extractor = OAIPMHExtractor("http://test.com/oai")
        with patch.object(extractor, "_make_request", return_value=mock_response):
            new_articles, _, errors = extractor.fetch_articles()

        assert len(new_articles) == 2

    def test_fetch_articles_with_resumption_token(self):
        from app.extractors.oai_pmh import OAIPMHExtractor

        page1_body = _make_oai_response(_make_record("oai:test:1", "Article 1"), resumption_token="tok123")
        page2_body = _make_oai_response(_make_record("oai:test:2", "Article 2"))

        mock_resp1 = MagicMock()
        mock_resp1.content = page1_body
        mock_resp2 = MagicMock()
        mock_resp2.content = page2_body

        extractor = OAIPMHExtractor("http://test.com/oai")
        with patch.object(extractor, "_make_request", side_effect=[mock_resp1, mock_resp2]):
            new_articles, _, errors = extractor.fetch_articles()

        assert len(new_articles) == 2

    def test_fetch_articles_network_error_returns_errors(self):
        from app.extractors.oai_pmh import OAIPMHExtractor

        extractor = OAIPMHExtractor("http://test.com/oai")
        with patch.object(extractor, "_make_request", side_effect=Exception("network down")):
            new_articles, _, errors = extractor.fetch_articles()

        assert new_articles == []
        assert len(errors) > 0

    def test_fetch_articles_with_from_date(self):
        from app.extractors.oai_pmh import OAIPMHExtractor

        mock_response = MagicMock()
        mock_response.content = _make_oai_response("")

        extractor = OAIPMHExtractor("http://test.com/oai")
        with patch.object(extractor, "_make_request", return_value=mock_response) as mock_req:
            extractor.fetch_articles(from_date="2026-01-01")

        call_params = mock_req.call_args[0][0]
        assert "from" in call_params
        assert call_params["from"] == "2026-01-01"


@pytest.mark.unit
class TestOAIPMHParseRecord:

    def _get_extractor(self):
        from app.extractors.oai_pmh import OAIPMHExtractor
        return OAIPMHExtractor("http://test.com/oai")

    def _parse_xml_record(self, record_xml: str):
        doc = etree.fromstring(f"<root xmlns='{OAI_NS}'>{record_xml}</root>")
        return doc.find(f"{{{OAI_NS}}}record")

    def test_parse_record_extracts_title(self):
        extractor = self._get_extractor()
        record_elem = self._parse_xml_record(_make_record("oai:1", "My Title"))
        result = extractor._parse_record(record_elem)
        assert result is not None
        assert result["title"] == "My Title"

    def test_parse_record_extracts_oai_identifier(self):
        extractor = self._get_extractor()
        record_elem = self._parse_xml_record(_make_record("oai:test:999", "Title"))
        result = extractor._parse_record(record_elem)
        assert result["oai_identifier"] == "oai:test:999"

    def test_parse_record_extracts_authors(self):
        extractor = self._get_extractor()
        record_elem = self._parse_xml_record(_make_record("oai:1", "Title", author="Dr. Silva"))
        result = extractor._parse_record(record_elem)
        assert "Dr. Silva" in result["authors"]

    def test_parse_record_extracts_keywords(self):
        extractor = self._get_extractor()
        record_elem = self._parse_xml_record(_make_record("oai:1", "Title", keywords=["ML", "AI"]))
        result = extractor._parse_record(record_elem)
        assert "ML" in result["keywords"]
        assert "AI" in result["keywords"]

    def test_parse_record_returns_none_without_metadata(self):
        extractor = self._get_extractor()
        record_without_metadata = f"""
<record xmlns="{OAI_NS}">
  <header>
    <identifier>oai:test:1</identifier>
  </header>
</record>"""
        doc = etree.fromstring(f"<root xmlns='{OAI_NS}'>{record_without_metadata}</root>")
        record_elem = doc.find(f"{{{OAI_NS}}}record")
        result = extractor._parse_record(record_elem)
        assert result is None


@pytest.mark.unit
class TestOAIPMHHelpers:

    def _get_extractor(self):
        from app.extractors.oai_pmh import OAIPMHExtractor
        return OAIPMHExtractor("http://test.com/oai")

    def _make_dc_element(self, fields: dict) -> etree.Element:
        dc = etree.Element("dc")
        for tag, values in fields.items():
            if isinstance(values, str):
                values = [values]
            for v in values:
                child = etree.SubElement(dc, f"{{{DC_NS}}}{tag}")
                child.text = v
        return dc

    def test_extract_text_returns_first(self):
        extractor = self._get_extractor()
        dc = self._make_dc_element({"title": ["First", "Second"]})
        result = extractor._extract_text(dc, "title")
        assert result == "First"

    def test_extract_text_returns_default_when_missing(self):
        extractor = self._get_extractor()
        dc = self._make_dc_element({})
        result = extractor._extract_text(dc, "title", default="N/A")
        assert result == "N/A"

    def test_extract_list_returns_all(self):
        extractor = self._get_extractor()
        dc = self._make_dc_element({"creator": ["Author A", "Author B"]})
        result = extractor._extract_list(dc, "creator")
        assert result == ["Author A", "Author B"]

    def test_extract_list_returns_empty_when_missing(self):
        extractor = self._get_extractor()
        dc = self._make_dc_element({})
        result = extractor._extract_list(dc, "creator")
        assert result == []

    def test_extract_doi_finds_doi_url(self):
        extractor = self._get_extractor()
        dc = self._make_dc_element({"identifier": ["https://doi.org/10.1234/test"]})
        result = extractor._extract_doi(dc)
        assert result == "https://doi.org/10.1234/test"

    def test_extract_doi_returns_none_without_doi(self):
        extractor = self._get_extractor()
        dc = self._make_dc_element({"identifier": ["https://example.com/article"]})
        result = extractor._extract_doi(dc)
        assert result is None

    def test_parse_date_iso_format(self):
        extractor = self._get_extractor()
        result = extractor._parse_date("2026-01-15")
        assert isinstance(result, datetime)
        assert result.year == 2026
        assert result.month == 1
        assert result.day == 15

    def test_parse_date_year_only(self):
        extractor = self._get_extractor()
        result = extractor._parse_date("2026")
        assert isinstance(result, datetime)
        assert result.year == 2026

    def test_parse_date_year_month(self):
        extractor = self._get_extractor()
        result = extractor._parse_date("2026-03")
        assert isinstance(result, datetime)
        assert result.year == 2026

    def test_parse_date_returns_none_for_empty(self):
        extractor = self._get_extractor()
        assert extractor._parse_date(None) is None
        assert extractor._parse_date("") is None

    def test_parse_date_returns_none_for_invalid(self):
        extractor = self._get_extractor()
        result = extractor._parse_date("not-a-date")
        assert result is None

    def test_parse_date_br_format(self):
        extractor = self._get_extractor()
        result = extractor._parse_date("15/01/2026")
        assert isinstance(result, datetime)
        assert result.year == 2026
