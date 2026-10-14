from datetime import datetime, timedelta

import pytest

from app.api import insights
from app.core.database import Article, Magazine, SearchHistory, User
from app.core.people import fold, institution_key, institution_keys, person_key
from app.extractors.oai_pmh import OAIPMHExtractor


@pytest.fixture(autouse=True)
def clean(db_session):
    insights._stats_cache.update(at=0.0, value=None)
    yield
    for model in (SearchHistory, User, Article, Magazine):
        db_session.query(model).delete()
    db_session.commit()


def make_users(db, n):
    users = [User(name=f"U{i}", email=f"u{i}@x.br", password_hash="x") for i in range(n)]
    db.add_all(users)
    db.commit()
    return users


def search(db, user, text, days_ago=0):
    db.add(SearchHistory(user_id=user.id, query=text, created_at=datetime.utcnow() - timedelta(days=days_ago)))
    db.commit()


@pytest.mark.unit
class TestNormalization:
    def test_fold(self):
        assert fold("  Aprendizado  de MÁQUINA! ") == "aprendizado de maquina"

    def test_person_key_prefers_orcid_and_unifies_name_orders(self):
        assert person_key("Silva, João", "0000-0002-0442-3735") == "orcid:0000-0002-0442-3735"
        assert person_key("Silva, João") == person_key("João Silva") == person_key("silva, joao")

    def test_institution_key_collapses_campuses(self):
        a = institution_key("Instituto Federal Farroupilha - Campus São Borja")
        b = institution_key("Instituto Federal Farroupilha - Campus Frederico Westphalen")
        assert a == b == "instituto federal farroupilha"
        assert institution_key("UDESC") != institution_key("USP")

    def test_same_institution_written_different_ways_counts_once(self):
        keys = institution_keys(
            [
                "Universidade de São Paulo",
                "Universidade de São Paulo (USP)",
                "USP",
                "UNIRIO",
                "Universidade Federal do Estado do Rio de Janeiro (UNIRIO)",
                "UFRJ - Universidade Federal do Rio de Janeiro",
                "Universidade Federal do Rio de Janeiro - (UFRJ)",
            ]
        )
        assert keys == {"usp", "unirio", "ufrj"}

    def test_messy_affiliations_are_cleaned(self):
        assert institution_key("Professor Adjunto IV da Universidade Federal de Ouro Preto") == "universidade federal de ouro preto"
        assert institution_key("Universidade FUMEC, Belo Horizonte, MG, Brasil.") == "universidade fumec"
        # varias linhas: fica a que parece instituicao, nao o programa de pos-graduacao
        assert institution_key("Programa de Pós-Graduação em Informática\nUniversidade Federal do Paraná") == "universidade federal do parana"


@pytest.mark.unit
class TestTrending:
    def test_without_real_searches_shows_the_default_themes(self, test_client):
        data = test_client.get("/api/v1/searches/trending").json()
        assert [d["query"] for d in data] == insights.DEFAULT_TRENDING
        assert all(d["users"] is None for d in data)

    def test_a_search_by_one_user_never_appears(self, test_client, db_session):
        (u,) = make_users(db_session, 1)
        for _ in range(5):
            search(db_session, u, "segredo de uma pessoa")
        assert "segredo de uma pessoa" not in [d["query"] for d in test_client.get("/api/v1/searches/trending").json()]

    def test_more_distinct_users_rank_first_and_spelling_is_merged(self, test_client, db_session):
        u = make_users(db_session, 5)
        for user in u[:4]:
            search(db_session, user, "Inteligência Artificial")
        search(db_session, u[4], "inteligencia artificial")
        for user in u[:2]:
            search(db_session, user, "blockchain")
        data = test_client.get("/api/v1/searches/trending", params={"limit": 4}).json()
        assert data[0] == {"query": "inteligência artificial", "users": 5}
        assert data[1] == {"query": "blockchain", "users": 2}
        assert data[2]["users"] is None  # o resto completa com os temas de exemplo

    def test_repeating_by_the_same_user_counts_once(self, test_client, db_session):
        u = make_users(db_session, 2)
        for _ in range(10):
            search(db_session, u[0], "redes")
        search(db_session, u[1], "redes")
        assert test_client.get("/api/v1/searches/trending").json()[0] == {"query": "redes", "users": 2}

    def test_old_searches_are_ignored(self, test_client, db_session):
        u = make_users(db_session, 2)
        for user in u:
            search(db_session, user, "tema antigo", days_ago=90)
        assert "tema antigo" not in [d["query"] for d in test_client.get("/api/v1/searches/trending").json()]


@pytest.mark.unit
class TestStats:
    def test_counts_distinct_authors_and_institutions(self, test_client, db_session):
        db_session.add(Magazine(name="RBIE", url_oai_pmh="http://x/oai"))
        db_session.add_all(
            [
                Article(
                    oai_identifier="a1", magazine_id=1, title="A", authors=["Silva, João"],
                    author_details=[
                        {"name": "Silva, João", "affiliation": "UDESC", "orcid": None},
                        {"name": "Souza, Ana", "affiliation": "IF Farroupilha - Campus A", "orcid": "0000-0001-0000-0001"},
                    ],
                ),
                Article(
                    oai_identifier="a2", magazine_id=1, title="B", authors=["João Silva"],
                    author_details=[
                        {"name": "João Silva", "affiliation": "UDESC", "orcid": None},
                        {"name": "Ana S.", "affiliation": "IF Farroupilha - Campus B", "orcid": "0000-0001-0000-0001"},
                    ],
                ),
                Article(oai_identifier="a3", magazine_id=1, title="C", authors=["Lima, Rui"]),
            ]
        )
        db_session.commit()
        s = test_client.get("/api/v1/stats").json()
        assert s["articles"] == 3 and s["magazines"] == 1
        assert s["authors"] == 3  # Joao (nome em duas ordens), Ana (mesmo ORCID), Rui
        assert s["institutions"] == 2  # UDESC e IF Farroupilha (dois campi viram um)

    def test_institutions_is_null_without_any_affiliation(self, test_client, db_session):
        db_session.add(Article(oai_identifier="a1", magazine_id=1, title="A", authors=["X, Y"]))
        db_session.commit()
        s = test_client.get("/api/v1/stats").json()
        assert s["authors"] == 1 and s["institutions"] is None


MARC = """<root xmlns="http://www.openarchives.org/OAI/2.0/"><ListRecords>
<record><header><identifier>oai:x:1</identifier></header><metadata>
<record xmlns="http://www.loc.gov/MARC21/slim">
  <datafield tag="022"><subfield code="$a">2317-6121</subfield></datafield>
  <datafield tag="720"><subfield code="a">Vahldick, Adilson</subfield><subfield code="u">UDESC</subfield>
    <subfield code="0">https://orcid.org/0000-0002-0442-3735</subfield></datafield>
  <datafield tag="720"><subfield code="a">Sem Afiliacao, Fulano</subfield></datafield>
</record></metadata></record>
</ListRecords></root>"""


@pytest.mark.unit
class TestMarcAuthors:
    def test_parses_affiliation_and_orcid(self, mocker):
        extractor = OAIPMHExtractor("http://x/oai")
        mocker.patch.object(extractor, "_make_request", return_value=mocker.Mock(content=MARC.encode()))
        details = extractor.fetch_author_details()
        assert details["oai:x:1"] == [
            {"name": "Vahldick, Adilson", "affiliation": "UDESC", "orcid": "0000-0002-0442-3735"},
            {"name": "Sem Afiliacao, Fulano", "affiliation": None, "orcid": None},
        ]
