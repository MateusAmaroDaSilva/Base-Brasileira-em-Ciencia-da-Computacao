import pytest

from app.core.database import Alert, Article, SavedArticle, SearchHistory, User

REGISTER = {
    "name": "Maria Souza",
    "email": "Maria@Exemplo.br",
    "institution": "UNIMAR",
    "areas": ["Inteligência Artificial"],
    "password": "senha-segura-1",
    "accept_terms": True,
}


@pytest.fixture(autouse=True)
def clean_account_tables(db_session):
    yield
    for model in (SavedArticle, SearchHistory, Alert, User, Article):
        db_session.query(model).delete()
    db_session.commit()


def register(client, **overrides):
    return client.post("/api/v1/auth/register", json={**REGISTER, **overrides})


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def new_user(client, email="maria@exemplo.br"):
    res = register(client, email=email)
    assert res.status_code == 201, res.text
    return res.json()["access_token"]


@pytest.fixture
def article(db_session):
    a = Article(oai_identifier="oai:teste:1", magazine_id=1, title="Um artigo", authors=[], keywords=[])
    db_session.add(a)
    db_session.commit()
    return a


class TestAuth:
    def test_register_returns_token_and_user(self, test_client):
        res = register(test_client)
        assert res.status_code == 201
        body = res.json()
        assert body["user"]["email"] == "maria@exemplo.br"  # normalizado
        assert body["user"]["areas"] == ["Inteligência Artificial"]
        assert "password" not in body["user"] and "password_hash" not in body["user"]

    def test_password_is_not_stored_in_clear(self, test_client, db_session):
        register(test_client)
        user = db_session.query(User).one()
        assert user.password_hash != REGISTER["password"]
        assert user.password_hash.startswith("$2")

    def test_duplicate_email_conflicts_regardless_of_case(self, test_client):
        register(test_client)
        assert register(test_client, email="MARIA@exemplo.br").status_code == 409

    @pytest.mark.parametrize(
        "overrides",
        [
            {"password": "curta"},
            {"email": "sem-arroba"},
            {"name": " "},
            {"accept_terms": False},
        ],
    )
    def test_register_validation(self, test_client, overrides):
        assert register(test_client, **overrides).status_code == 422

    def test_login(self, test_client):
        register(test_client)
        ok = test_client.post("/api/v1/auth/login", json={"email": " MARIA@exemplo.br ", "password": REGISTER["password"]})
        assert ok.status_code == 200
        assert ok.json()["access_token"]

    def test_login_failures_are_indistinguishable(self, test_client):
        register(test_client)
        wrong = test_client.post("/api/v1/auth/login", json={"email": "maria@exemplo.br", "password": "errada-errada"})
        unknown = test_client.post("/api/v1/auth/login", json={"email": "ninguem@exemplo.br", "password": "errada-errada"})
        assert wrong.status_code == unknown.status_code == 401
        assert wrong.json() == unknown.json()

    def test_me_requires_a_valid_token(self, test_client):
        assert test_client.get("/api/v1/me").status_code == 401
        assert test_client.get("/api/v1/me", headers=auth("lixo")).status_code == 401

    def test_me_and_update(self, test_client):
        token = new_user(test_client)
        assert test_client.get("/api/v1/me", headers=auth(token)).json()["name"] == "Maria Souza"
        res = test_client.patch("/api/v1/me", headers=auth(token), json={"name": "Maria S.", "areas": ["Redes", "Redes"]})
        assert res.json()["name"] == "Maria S."
        assert res.json()["areas"] == ["Redes"]


class TestHistory:
    def test_add_list_delete(self, test_client):
        token = new_user(test_client)
        h = auth(token)
        created = test_client.post("/api/v1/me/history", headers=h, json={"query": "aprendizado de máquina", "result_count": 42})
        assert created.status_code == 201
        listing = test_client.get("/api/v1/me/history", headers=h).json()
        assert [i["query"] for i in listing] == ["aprendizado de máquina"]
        assert test_client.delete(f"/api/v1/me/history/{listing[0]['id']}", headers=h).status_code == 204
        assert test_client.get("/api/v1/me/history", headers=h).json() == []

    def test_repeated_search_in_a_row_is_stored_once(self, test_client):
        h = auth(new_user(test_client))
        for _ in range(3):
            test_client.post("/api/v1/me/history", headers=h, json={"query": "redes 5G"})
        assert len(test_client.get("/api/v1/me/history", headers=h).json()) == 1

    def test_filter_by_text_and_top(self, test_client, db_session):
        h = auth(new_user(test_client))
        for q in ["redes 5G", "malware", "Redes 5G"]:
            db_session.add(SearchHistory(user_id=db_session.query(User).one().id, query=q))
        db_session.commit()
        found = test_client.get("/api/v1/me/history", headers=h, params={"q": "MALW"}).json()
        assert [i["query"] for i in found] == ["malware"]
        top = test_client.get("/api/v1/me/history/top", headers=h).json()
        assert top[0]["count"] == 2 and top[0]["query"].lower() == "redes 5g"

    def test_turning_history_off_clears_and_stops_saving(self, test_client):
        h = auth(new_user(test_client))
        test_client.post("/api/v1/me/history", headers=h, json={"query": "algo"})
        test_client.patch("/api/v1/me", headers=h, json={"save_history": False})
        assert test_client.get("/api/v1/me/history", headers=h).json() == []
        assert test_client.post("/api/v1/me/history", headers=h, json={"query": "outra"}).status_code == 202
        assert test_client.get("/api/v1/me/history", headers=h).json() == []

    def test_clear_history(self, test_client):
        h = auth(new_user(test_client))
        test_client.post("/api/v1/me/history", headers=h, json={"query": "a"})
        test_client.post("/api/v1/me/history", headers=h, json={"query": "b"})
        assert test_client.delete("/api/v1/me/history", headers=h).status_code == 204
        assert test_client.get("/api/v1/me/history", headers=h).json() == []

    def test_users_cannot_see_or_delete_each_others_history(self, test_client):
        a = auth(new_user(test_client, "a@exemplo.br"))
        b = auth(new_user(test_client, "b@exemplo.br"))
        entry = test_client.post("/api/v1/me/history", headers=a, json={"query": "segredo"}).json()
        assert test_client.get("/api/v1/me/history", headers=b).json() == []
        assert test_client.delete(f"/api/v1/me/history/{entry['id']}", headers=b).status_code == 404
        assert len(test_client.get("/api/v1/me/history", headers=a).json()) == 1


class TestSaved:
    def test_save_is_idempotent_and_counted(self, test_client, article):
        h = auth(new_user(test_client))
        for _ in range(2):
            assert test_client.put(f"/api/v1/me/saved/{article.id}", headers=h).status_code == 204
        assert test_client.get("/api/v1/me/saved/ids", headers=h).json() == [article.id]
        assert test_client.get("/api/v1/me", headers=h).json()["saved_count"] == 1
        assert test_client.get("/api/v1/me/saved", headers=h).json()[0]["article"]["title"] == "Um artigo"
        assert test_client.delete(f"/api/v1/me/saved/{article.id}", headers=h).status_code == 204
        assert test_client.get("/api/v1/me/saved/ids", headers=h).json() == []

    def test_save_unknown_article(self, test_client):
        h = auth(new_user(test_client))
        assert test_client.put("/api/v1/me/saved/9999", headers=h).status_code == 404

    def test_requires_login(self, test_client, article):
        assert test_client.put(f"/api/v1/me/saved/{article.id}").status_code == 401


class TestAlerts:
    def test_create_list_delete(self, test_client):
        h = auth(new_user(test_client))
        first = test_client.post("/api/v1/me/alerts", headers=h, json={"query": "malware"}).json()
        again = test_client.post("/api/v1/me/alerts", headers=h, json={"query": "MALWARE"}).json()
        assert first["id"] == again["id"]
        assert len(test_client.get("/api/v1/me/alerts", headers=h).json()) == 1
        assert test_client.delete(f"/api/v1/me/alerts/{first['id']}", headers=h).status_code == 204
        assert test_client.delete(f"/api/v1/me/alerts/{first['id']}", headers=h).status_code == 404


JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 64
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64


class TestAvatar:
    def test_upload_and_remove(self, test_client):
        h = auth(new_user(test_client))
        assert test_client.get("/api/v1/me", headers=h).json()["avatar_url"] is None
        res = test_client.put("/api/v1/me/avatar", headers=h, content=JPEG)
        assert res.status_code == 200
        assert res.json()["avatar_url"].startswith("data:image/jpeg;base64,")
        assert test_client.get("/api/v1/me", headers=h).json()["avatar_url"].startswith("data:image/jpeg")
        assert test_client.put("/api/v1/me/avatar", headers=h, content=PNG).json()["avatar_url"].startswith("data:image/png")
        assert test_client.delete("/api/v1/me/avatar", headers=h).status_code == 204
        assert test_client.get("/api/v1/me", headers=h).json()["avatar_url"] is None

    def test_type_is_decided_by_content_not_by_header(self, test_client):
        h = auth(new_user(test_client))
        html = b"<script>alert(1)</script>"
        res = test_client.put("/api/v1/me/avatar", headers={**h, "content-type": "image/png"}, content=html)
        assert res.status_code == 415
        svg = b"<svg xmlns='http://www.w3.org/2000/svg'><script>1</script></svg>"
        assert test_client.put("/api/v1/me/avatar", headers={**h, "content-type": "image/svg+xml"}, content=svg).status_code == 415

    def test_too_large(self, test_client):
        h = auth(new_user(test_client))
        big = JPEG + b"\x00" * (200 * 1024)
        assert test_client.put("/api/v1/me/avatar", headers=h, content=big).status_code == 413

    def test_requires_login(self, test_client):
        assert test_client.put("/api/v1/me/avatar", content=JPEG).status_code == 401
