import os
import pytest
from unittest.mock import MagicMock, patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

os.environ["ENVIRONMENT"] = "testing"
os.environ["ELASTICSEARCH_HOST"] = "localhost"
os.environ["ELASTICSEARCH_PORT"] = "9200"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Initialize test database with all tables before running tests"""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    
    # Import Base which registers all models
    from app.core.database import Base
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="session")
def test_db_engine():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    from app.core.database import Base
    Base.metadata.create_all(engine)
    return engine


@pytest.fixture(scope="function")
def db_session(test_db_engine):
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_db_engine)
    session = SessionLocal()
    
    from app.core.database import Base
    Base.metadata.create_all(test_db_engine)
    
    yield session
    
    session.rollback()
    session.close()


@pytest.fixture
def test_client():
    from app.main import app
    return TestClient(app)


@pytest.fixture
def mock_elasticsearch():
    with patch('app.core.elasticsearch_client.Elasticsearch') as mock_es:
        with patch('app.core.elasticsearch_client.settings'):
            es_instance = MagicMock()
            mock_es.return_value = es_instance
            return es_instance


@pytest.fixture
def mock_redis():
    with patch('redis.Redis') as mock_redis:
        return mock_redis


@pytest.fixture
def mock_celery_task():
    with patch('app.tasks.sync_tasks.sync_magazine.apply_async') as mock_task:
        return mock_task

@pytest.fixture
def sample_magazine():
    return {
        "id": 1,
        "name": "RBIE",
        "url": "http://journals-sol.sbc.org.br/index.php/rbie/oai",
        "description": "Brazilian Journal of Computers in Education",
        "active": True,
    }


@pytest.fixture
def sample_article():
    return {
        "id": 1,
        "title": "Machine Learning in Education",
        "abstract": "A comprehensive study on machine learning applications",
        "authors": ["Dr. Silva", "Dr. Santos"],
        "keywords": ["machine learning", "education", "AI"],
        "publication_date": "2026-01-15",
        "magazine_id": 1,
        "oai_identifier": "oai:test:12345",
    }


@pytest.fixture
def sample_search_query():
    return {
        "query": "machine learning",
        "limit": 10,
        "offset": 0,
    }


@pytest.fixture
def mock_oai_response():
    return {
        "articles": [
            {
                "title": "Test Article 1",
                "abstract": "Test abstract",
                "authors": ["Author 1"],
                "keywords": ["test"],
                "publication_date": "2026-01-01",
                "oai_identifier": "oai:test:1",
            }
        ],
        "resumption_token": None,
        "total": 1,
    }

def pytest_configure(config):
    config.addinivalue_line("markers", "unit: mark test as a unit test")
    config.addinivalue_line("markers", "integration: mark test as an integration test")
    config.addinivalue_line("markers", "e2e: mark test as an end-to-end test")
    config.addinivalue_line("markers", "slow: mark test as slow")
    config.addinivalue_line("markers", "elasticsearch: requires Elasticsearch")
    config.addinivalue_line("markers", "database: requires Database")
