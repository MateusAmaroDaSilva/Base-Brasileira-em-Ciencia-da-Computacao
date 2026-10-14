import pytest

from app.core import ratelimit
from app.core.config import settings
from app.core.database import User

from tests.unit.test_account import REGISTER, auth, new_user, register  # noqa: F401
from tests.unit.test_account import clean_account_tables  # noqa: F401

PROTECTED = [
    ("get", "/api/v1/admin/logs"),
    ("post", "/api/v1/admin/sync"),
    ("post", "/api/v1/magazines/"),
    ("put", "/api/v1/magazines/1"),
    ("delete", "/api/v1/magazines/1"),
    ("post", "/api/v1/articles/elasticsearch/reindex"),
]


class TestAdminAccess:
    @pytest.mark.parametrize("method,path", PROTECTED)
    def test_anonymous_gets_401(self, test_client, method, path):
        assert getattr(test_client, method)(path).status_code == 401

    @pytest.mark.parametrize("method,path", PROTECTED)
    def test_regular_user_gets_403(self, test_client, method, path):
        token = new_user(test_client)
        assert getattr(test_client, method)(path, headers=auth(token)).status_code == 403

    def test_no_admins_configured_means_nobody_is_admin(self, test_client, monkeypatch):
        monkeypatch.setattr(settings, "ADMIN_EMAILS", "")
        token = new_user(test_client, email="a@b.br")
        assert test_client.get("/api/v1/admin/logs", headers=auth(token)).status_code == 403

    def test_admin_email_match_ignores_case_and_spaces(self, test_client, monkeypatch):
        monkeypatch.setattr(settings, "ADMIN_EMAILS", " Chefe@Unimar.br , outro@x.br")
        token = new_user(test_client, email="chefe@unimar.br")
        assert test_client.get("/api/v1/admin/logs", headers=auth(token)).status_code == 200
        assert test_client.get("/api/v1/me", headers=auth(token)).json()["is_admin"] is True

    def test_regular_user_is_not_flagged_admin(self, test_client):
        token = new_user(test_client)
        assert test_client.get("/api/v1/me", headers=auth(token)).json()["is_admin"] is False

    def test_health_and_public_reads_stay_open(self, test_client):
        assert test_client.get("/api/v1/admin/health").status_code == 200
        assert test_client.get("/api/v1/magazines").status_code == 200


class TestLoginRateLimit:
    def login(self, client, password):
        return client.post("/api/v1/auth/login", json={"email": REGISTER["email"], "password": password})

    def test_blocks_after_repeated_failures(self, test_client):
        register(test_client)
        for _ in range(ratelimit.MAX_FAILS_PER_EMAIL):
            assert self.login(test_client, "errada-errada").status_code == 401
        blocked = self.login(test_client, "errada-errada")
        assert blocked.status_code == 429
        assert int(blocked.headers["Retry-After"]) > 0
        # mesmo a senha certa espera a janela passar
        assert self.login(test_client, REGISTER["password"]).status_code == 429

    def test_success_resets_counter(self, test_client):
        register(test_client)
        for _ in range(ratelimit.MAX_FAILS_PER_EMAIL - 1):
            self.login(test_client, "errada-errada")
        assert self.login(test_client, REGISTER["password"]).status_code == 200
        for _ in range(ratelimit.MAX_FAILS_PER_EMAIL - 1):
            assert self.login(test_client, "errada-errada").status_code == 401

    def test_window_expires(self, test_client, monkeypatch):
        register(test_client)
        for _ in range(ratelimit.MAX_FAILS_PER_EMAIL):
            self.login(test_client, "errada-errada")
        monkeypatch.setattr(ratelimit, "WINDOW_SECONDS", -1)
        assert self.login(test_client, REGISTER["password"]).status_code == 200
