import pytest

from app.core.security import (
    MIN_SECRET_LENGTH,
    check_secret_key,
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)

GOOD = "x" * MIN_SECRET_LENGTH


@pytest.mark.unit
class TestSecretKeyGuard:
    @pytest.mark.parametrize("secret", ["", "curta", "dev-only-insecure-secret-change-me", "x" * (MIN_SECRET_LENGTH - 1)])
    def test_production_refuses_missing_default_or_short_keys(self, secret):
        with pytest.raises(RuntimeError):
            check_secret_key(secret, "production")

    def test_production_accepts_a_long_key(self):
        check_secret_key(GOOD, "production")

    def test_development_accepts_the_default_key(self):
        check_secret_key("dev-only-insecure-secret-change-me", "development")


@pytest.mark.unit
class TestPasswordsAndTokens:
    def test_password_roundtrip(self):
        hashed = hash_password("uma-senha-longa")
        assert verify_password("uma-senha-longa", hashed)
        assert not verify_password("outra", hashed)
        assert not verify_password("x", "isto-nao-e-um-hash")

    def test_token_roundtrip_and_tampering(self):
        token = create_access_token(7)
        assert decode_access_token(token) == 7
        assert decode_access_token(token[:-2] + "xx") is None
        assert decode_access_token("lixo") is None
