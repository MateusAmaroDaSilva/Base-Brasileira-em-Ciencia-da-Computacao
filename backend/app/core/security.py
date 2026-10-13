import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt

from app.core.config import settings

logger = logging.getLogger(__name__)

_INSECURE_DEFAULT = "dev-only-insecure-secret-change-me"
ALGORITHM = "HS256"


MIN_SECRET_LENGTH = 32


def check_secret_key(secret: str | None = None, environment: str | None = None) -> None:
    """Em producao a chave precisa existir, ser longa e diferente da de desenvolvimento.

    Uma variavel nao definida no painel chega vazia (""), e uma chave vazia ou curta deixaria
    qualquer pessoa forjar tokens de login: por isso a API recusa subir em vez de aceitar.
    """
    secret = settings.SECRET_KEY if secret is None else secret
    environment = settings.ENVIRONMENT if environment is None else environment

    if environment == "production":
        if secret == _INSECURE_DEFAULT or len(secret) < MIN_SECRET_LENGTH:
            raise RuntimeError(
                f"SECRET_KEY ausente ou fraca: em producao defina uma chave aleatoria de pelo menos "
                f"{MIN_SECRET_LENGTH} caracteres no ambiente da stack."
            )
    elif secret == _INSECURE_DEFAULT:
        logger.warning("SECRET_KEY padrao em uso: aceitavel apenas em desenvolvimento.")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


# Hash de uma senha qualquer: o login compara contra ele quando o e-mail nao existe,
# para que a resposta leve o mesmo tempo e nao revele quais e-mails tem conta.
DUMMY_HASH = hash_password("senha-que-ninguem-usa")


def create_access_token(user_id: int, remember: bool = False) -> str:
    lifetime = (
        timedelta(days=settings.ACCESS_TOKEN_REMEMBER_DAYS)
        if remember
        else timedelta(hours=settings.ACCESS_TOKEN_EXPIRE_HOURS)
    )
    payload = {"sub": str(user_id), "exp": datetime.now(timezone.utc) + lifetime}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[int]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None
