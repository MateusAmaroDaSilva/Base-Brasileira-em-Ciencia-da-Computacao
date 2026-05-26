# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Base Brasileira em Ciência da Computação** — an academic article aggregation system for Brazilian Computer Science journals. It harvests metadata from 5 journals via OAI-PMH protocol, stores in PostgreSQL, indexes in Elasticsearch, and exposes a REST API consumed by a React frontend.

---

## Backend Commands

All commands run from `backend/`:

```bash
# Install dependencies
pip install -r requirements.txt
pip install -r tests/requirements-dev.txt

# Run backend (dev)
python app/main.py
# or: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Initialize DB with the 5 default magazines
python -c "from app.core.init_db import init_db; init_db()"

# Run all tests (slow tests excluded by default via pytest.ini)
pytest

# Run a specific test file
pytest tests/unit/test_api_endpoints.py -v

# Run a single test
pytest tests/unit/test_api_endpoints.py::TestMagazinesEndpoints::test_get_magazines -v

# Run only unit tests
pytest tests/unit/

# Run integration tests
pytest tests/integration/ -v

# Run with coverage report
pytest --cov=app --cov-report=html

# Validate OAI-PMH sources (makes real HTTP requests)
python tests/test_extractors.py
```

## Frontend Commands

All commands run from `frontend/`:

```bash
npm install
npm run dev       # Dev server on http://localhost:5173
npm run build     # TypeScript check + Vite build
npm run preview   # Preview production build
```

## Docker

```bash
# Start all services (PostgreSQL, Redis, Elasticsearch, backend, Celery)
docker-compose up -d

# View backend logs
docker-compose logs backend -f

# Stop and remove volumes
docker-compose down -v
```

---

## Architecture

### Data Flow

```
OAI-PMH endpoints (5 journals)
        ↓ HTTP/XML  (OAIPMHExtractor)
    Celery task     (sync_magazine)
        ↓
   PostgreSQL       (Article, Magazine, SyncLog models)
        ↓
  Elasticsearch     (bulk_index_articles)
        ↓
   FastAPI REST API (:8000)
        ↓
  React frontend    (:5173)
```

### Backend Structure (`backend/app/`)

- **`api/`** — FastAPI routers. `magazines.py` (CRUD), `articles.py` (list, search, ES search/suggest/reindex), `admin.py` (sync trigger, logs, health).
- **`core/database.py`** — SQLAlchemy models (`Magazine`, `Article`, `SyncLog`) and `get_db()` dependency. Engine is created at module import time using `settings.DATABASE_URL`.
- **`core/elasticsearch_client.py`** — `ElasticsearchClient` class wrapping ES operations. Accessed as a **singleton** via `get_elasticsearch_client()` (module-level `_es_client` global). All ES errors are caught and logged — the client never raises to callers.
- **`core/config.py`** — Pydantic `Settings` with `@lru_cache`. Settings are frozen at first import. `conftest.py` must set `os.environ` values **before** any `app.*` import to override them in tests.
- **`extractors/oai_pmh.py`** — `OAIPMHExtractor`. `fetch_articles()` returns `(new_articles: list, updated_articles: dict, errors: list)`. Note: `updated_articles` is always `{}` (empty dict) — the extractor puts everything in `new_articles`. The sync task handles upsert logic itself.
- **`tasks/sync_tasks.py`** — Celery `@shared_task`. `sync_magazine(magazine_id)` can be called directly (not via `.delay()`) in tests — it runs synchronously. `sync_all_magazines()` just enqueues `sync_magazine` for each active magazine.

### Frontend Structure (`frontend/src/`)

- **`pages/SearchPage.tsx`** — Main page: search bar, filters, paginated article list. Calls `POST /api/v1/articles/search` (non-ES SQL search). `API_BASE_URL` is hardcoded to `http://localhost:8000/api/v1`.
- **`pages/ArticleDetail.tsx`** — Article detail view at `/article/:id`.
- **`components/`** — `SearchBar`, `ArticleList`, `Filters`, `MagazineSelector`.

---

## Test Architecture

`pytest.ini` lives in `backend/tests/` — pytest must be invoked from `backend/`.

**Key behaviors:**
- `@pytest.mark.slow` tests are excluded by default (`addopts = -m "not slow"`).
- `conftest.py` sets `os.environ["DATABASE_URL"] = "sqlite:///:memory:"` at module level — this overrides any environment DATABASE_URL before app modules are imported.
- `test_client` fixture uses FastAPI's `dependency_overrides` to inject the test SQLite session into `get_db()`.
- The `ElasticsearchClient` singleton (`_es_client`) persists across tests. Patch at `app.core.elasticsearch_client.Elasticsearch`, not at the instance level.
- `tests/test_extractors.py` is a **utility script** (runs real OAI-PMH HTTP requests). Any function in it must **not** be named `test_*` or pytest will try to collect it and fail (it requires arguments).

**Mocking Celery tasks in tests:**
Patch at the module where the name is used: `patch('app.api.admin.sync_magazine')`, not at `app.tasks.sync_tasks.sync_magazine`. Use `mock_celery_tasks` fixture from `conftest.py` for admin endpoint tests.

**Test markers:** `unit`, `integration`, `e2e`, `slow`, `elasticsearch`, `database`.

---

## CI/CD Workflows (`.github/workflows/`)

| File | Name | Trigger | What it does |
|---|---|---|---|
| `tests.yml` | Tests & Coverage | push/PR to main/develop | `pytest tests/unit/` + coverage upload to Codecov |
| `backend.yml` | Backend Tests & Build | push/PR affecting `backend/**` | `pytest tests/` with PostgreSQL service |
| `quality.yml` | Code Quality | push/PR | flake8, black, isort, mypy, bandit |
| `build.yml` | Build & Push Docker | push to main, tags | Docker build → push to GHCR → Trivy scan |
| `security.yml` | Security Checks | push/PR | bandit + Dockerfile checks |
| `frontend.yml` | Frontend Build | push/PR affecting `frontend/**` | `npm ci && npm run build` |

---

## Key Constraints

- **Python 3.11+** required. Pydantic v2 (`model_config`, not `class Config`).
- **httpx must stay at `0.24.1`** — newer versions are incompatible with Starlette 0.27.0's `TestClient`.
- The `SyncLog` model fields are `started_at`/`ended_at` (not `created_at`/`updated_at`). `SyncLogResponse` schema must match exactly.
- The `fetch_articles()` return type declares `Dict` for `updated_articles` but always returns `{}`. The sync task iterates over it with `for article_data in updated_articles:` — treat it as a list, not a dict.
- Elasticsearch search returns `{"total": int, "articles": list, "limit": int, "offset": int}` — not `{"hits": ...}`.
