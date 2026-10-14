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
def test_client(db_session):
    from app.main import app
    from fastapi.testclient import TestClient
    from app.core.database import get_db
    
    # Override the get_db dependency with our test session
    def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    client = TestClient(app)
    yield client
    
    # Clear overrides after the test
    app.dependency_overrides.clear()


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
        "name": "RBIE",
        "url_oai_pmh": "http://journals-sol.sbc.org.br/index.php/rbie/oai",
        "description": "Brazilian Journal of Computers in Education",
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
def mock_celery_tasks():
    """Mock Celery tasks to avoid Redis/Broker connection errors"""
    with patch('app.api.admin.sync_magazine') as mock_sync_mag, \
         patch('app.api.admin.sync_all_magazines') as mock_sync_all:
        
        # Setup delay method for both mocks
        mock_sync_mag.delay = MagicMock(return_value=None)
        mock_sync_all.delay = MagicMock(return_value=None)
        
        yield {
            'sync_magazine': mock_sync_mag,
            'sync_all_magazines': mock_sync_all
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


@pytest.fixture(autouse=True)
def reset_login_limits():
    from app.core import ratelimit
    ratelimit.clear_all()
    yield
    ratelimit.clear_all()


@pytest.fixture
def admin_headers(test_client, db_session, monkeypatch):
    """Cabecalho de uma conta administradora (ADMIN_EMAILS aponta para ela)."""
    from app.core.config import settings
    from app.core.database import User
    monkeypatch.setattr(settings, "ADMIN_EMAILS", "admin@exemplo.br")
    res = test_client.post("/api/v1/auth/register", json={
        "name": "Admin Teste", "email": "admin@exemplo.br", "password": "senha-segura-1", "accept_terms": True,
    })
    assert res.status_code == 201, res.text
    yield {"Authorization": f"Bearer {res.json()['access_token']}"}
    db_session.query(User).filter(User.email == "admin@exemplo.br").delete()
    db_session.commit()
