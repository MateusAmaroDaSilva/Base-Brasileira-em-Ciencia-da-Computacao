import os
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
    
    # OAI-PMH
    OAI_PMH_TIMEOUT: int = 30
    OAI_PMH_MAX_RETRIES: int = 3
    OAI_PMH_RETRY_DELAY: int = 5


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
