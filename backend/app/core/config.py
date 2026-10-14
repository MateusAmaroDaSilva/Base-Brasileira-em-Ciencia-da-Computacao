from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/base_computacao"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Elasticsearch
    ELASTICSEARCH_HOST: str = "localhost"
    ELASTICSEARCH_PORT: int = 9200

    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Base Brasileira em Ciência da Computação"
    DEBUG: bool = False

    # Environment
    ENVIRONMENT: str = "development"

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # Contas: SECRET_KEY assina os tokens de login. Em producao e obrigatoria (ver app/core/security.py).
    SECRET_KEY: str = "dev-only-insecure-secret-change-me"
    # E-mails (separados por virgula) das contas que administram a base. Sem lista, ninguem e admin.
    ADMIN_EMAILS: str = ""
    ACCESS_TOKEN_EXPIRE_HOURS: int = 12
    ACCESS_TOKEN_REMEMBER_DAYS: int = 30

    # OAI-PMH
    OAI_PMH_TIMEOUT: int = 30
    OAI_PMH_MAX_RETRIES: int = 3
    OAI_PMH_RETRY_DELAY: int = 5

    # Sincronizacao agendada (Celery beat), horario de America/Sao_Paulo
    SYNC_SCHEDULE_HOUR: int = 3
    SYNC_SCHEDULE_MINUTE: int = 0


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
