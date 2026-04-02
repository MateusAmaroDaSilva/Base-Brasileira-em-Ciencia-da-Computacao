# Diagramas - Fluxos Visuais

Todos os diagramas de arquitetura, fluxos e relacionamentos.

---

## Diagrama 1: Fluxo Completo de Dados

```
OAI-PMH SOURCE              
(journals-sol.sbc.org.br)
         │
         ↓  HTTP requests
   extractors/
   oai_pmh.py
    (extrai XML)
         │
         ↓  parsed articles
   tasks/
   sync_tasks.py
  (transforma dados)
         │
         ├─────────────────┬─────────────────┐
         ↓                 ↓                 ↓
    PostgreSQL        Elasticsearch      Redis Cache
    (storage)         (full-text)        (sessions)
    Magazine          Index: articles    (optional)
    Article           search query
    SyncLog
         │
         └──────────────────┬──────────────────┐
                            ↓                  ↓
                      api/articles.py    api/magazines.py
                    (GET /articles)    (GET /magazines)
                            │                  │
                            └──────────┬───────┘
                                       ↓
                             FastAPI REST API
                          http://localhost:8000
                                       │
                                       ↓
                             Frontend (React/Vue)
                          Browser (client side)
```

---

## Diagrama 2: Arquitetura em Camadas

```
PRESENTATION LAYER
├── Swagger UI (/docs)
├── ReDoc (/redoc)
└── REST Endpoints

         ↑ JSON
         │
API LAYER
├── app/api/magazines.py
├── app/api/articles.py
└── app/api/admin.py

         ↑ Models
         │
BUSINESS LOGIC LAYER
├── app/extractors/oai_pmh.py (OAI-PMH parsing)
├── app/tasks/sync_tasks.py    (Sync orchestration)
├── app/core/elasticsearch_client.py (Search)
└── app/schemas/ (Validation)

         ↑ SQL
         │
DATA ACCESS LAYER
├── app/core/database.py (SQLAlchemy ORM)
└── ConnectionPool

         ↑
DATABASE LAYER
├── PostgreSQL (production)
├── SQLite (dev/test)
├── Elasticsearch (full-text)
└── Redis (cache/queue)
```

---

## Diagrama 3: Ciclo de Sincronizacao

```
scheduler (24h ou manual)
         │
         ↓ trigger
POST /api/v1/admin/sync
         │
         ↓ async
tasks/sync_tasks.py
sync_magazine(id=1)
         │
    ┌────┴────┐
    ↓         ↓
1. Extract  2. Transform
   OAI-PMH      Parse XML
   Query        Extract metadata
         │
         ├─────────────┐
         ↓             ↓
    3. Load      4. Index
    BD insert    ES bulk
    Dedup by     index
    oai_id
         │
         ├─────────────┐
         ↓             ↓
  sync_log     Update magazine
  .last_sync   .last_sync = now
  Save
  errors
         │
         ↓
    ✅ DONE
   (or ❌ ERROR logged)
```

---

## Diagrama 4: Estrutura de Testes

```
pytest (engine)
│
├─ Lê pytest.ini (rules)
│
├─ Carrega conftest.py
│  ├─ test_db_engine (fixture)
│  ├─ db_session (fixture)
│  ├─ test_client (fixture)
│  ├─ mock_elasticsearch (fixture)
│  └─ sample_data (fixtures)
│
├─ Procura em tests/
│
├─ UNIT tests/ (fast, mocked)
│  ├─ test_elasticsearch_client.py (11 tests) ✅
│  ├─ test_api_endpoints.py (25 tests) ⚠️
│  └─ test_sync_tasks.py (8 tests) ⚠️
│
├─ INTEGRATION tests/ (medium, integrated)
│  └─ test_workflows.py (2 tests)
│
├─ E2E tests/ (slow, realistic)
│  └─ test_user_scenarios.py (5+ tests)
│
├─ Para cada teste:
│  ├─ 1. SETUP (prepare)
│  ├─ 2. RUN (execute code)
│  ├─ 3. VERIFY (check result)
│  ├─ 4. CLEANUP (rollback)
│  └─ Result: ✅ PASSED / ❌ FAILED
│
└─ REPORT
   ├─ Terminal output
   ├─ coverage/htmlcov/index.html
   └─ coverage.xml
```

---

## Diagrama 5: Fluxo de um Endpoint HTTP

```
Browser/Client
   │
   ↓ GET /api/v1/articles?q=machine%20learning
   │
FastAPI Router
api/articles.py
   │
   ├─ Validate query params (Pydantic)
   │
   ├─ Parse request
   │  └─ query: str = "machine learning"
   │     limit: int = 10
   │     offset: int = 0
   │
   ├─ Call business logic
   │  └─ elasticsearch_client.search(
   │      query="machine learning",
   │      limit=10,
   │      offset=0
   │    )
   │
   ├─ Access database
   │  └─ db.query(Article)
   │      .filter(...)
   │      .limit(10)
   │      .offset(0)
   │      .all()
   │
   ├─ Serialize response
   │  └─ [ArticleRead, ArticleRead, ...]
   │     (Pydantic schema)
   │
   ├─ Return JSON
   │  └─ {
   │      "total": 42,
   │      "articles": [
   │        {"id": 1, "title": "...", ...},
   │        {"id": 2, "title": "...", ...}
   │      ]
   │    }
   │
   ↓ 200 OK + JSON
Browser/Client
```

---

## Diagrama 6: Modelo de Dados

```
┌──────────────────┐
│    Magazine      │
├──────────────────┤
│ id (PK)          │---┐
│ name             │   │
│ url_oai_pmh      │   │ 1:N
│ description      │   │
│ is_active        │   │
│ last_sync        │   │
│ created_at       │   │
│ updated_at       │   │
└──────────────────┘   │
                       │
                       │
┌──────────────────────┴──────────┐
│         Article                 │
├─────────────────────────────────┤
│ id (PK)                         │
│ magazine_id (FK) ←──────────────┘
│ oai_identifier (UNIQUE)         │
│ title                           │
│ abstract                        │
│ authors (JSON array)            │
│ keywords (JSON array)           │
│ publication_date                │
│ url                             │
│ doi                             │
│ volume, issue, pages            │
│ language                        │
│ is_indexed (bool)               │
│ raw_metadata (JSON)             │
│ created_at                      │
│ updated_at                      │
└─────────────────────────────────┘

┌──────────────────┐
│    SyncLog       │
├──────────────────┤
│ id (PK)          │
│ magazine_id (FK) │
│ status           │
│ articles_new     │
│ articles_updated │
│ articles_failed  │
│ errors (JSON)    │
│ duration_sec     │
│ created_at       │
└──────────────────┘
```

---

## Diagrama 7: Seguranca & Authentication (Future)

```
Frontend          Backend        Database
  │                 │               │
  │─ POST /auth/login              │
  │─────────────────→              │
  │        validate credentials    │
  │─────────────────────────────→ query user
  │        ← user found            │
  │ ← JWT token                    │
  │                                │
  │─ GET /api/articles             │
  │  + Header: Authorization: Bearer <token>
  │─────────────────→              │
  │        verify JWT              │
  │        ✅ valid                │
  │ ← articles (200)               │
  │                                │
  │─ GET /api/articles             │
  │  + Header: Authorization: Bearer <expired>
  │─────────────────→              │
  │        verify JWT              │
  │        ❌ expired              │
  │ ← 401 Unauthorized             │

(To be implemented in Phase 3)
```

---

## Diagrama 8: Docker Compose Stack

```
docker-compose.yml

SERVICE 1          SERVICE 2         SERVICE 3
PostgreSQL         Elasticsearch    Redis
localhost:5432     localhost:9200   localhost:6379
   │                   │               │
   └───────────────────┼───────────────┘
                       │
              SERVICE 4 (Backend API)
              FastAPI / Uvicorn
              localhost:8000
                   │
              SERVICE 5
              Celery Worker
              (background tasks)
                   │
              SERVICE 6
              Celery Beat
              (scheduler)

All connected via Docker network!
```

---

## Diagrama 9: Escalabilidade Horizontal

```
CURRENT (Single Instance)
┌─────────────────────────┐
│ Backend Instance 1      │
│ FastAPI / Uvicorn (1)   │
└─────────────────────────┘

FUTURE (Scalable)
┌─────────────────────────┐
│ Load Balancer (Nginx)   │
└──┬──────────────────┬───┘
   │                  │
   ↓                  ↓
┌─────────────┐  ┌─────────────┐
│ Backend 1   │  │ Backend 2   │
│ API Server  │  │ API Server  │
└─────────────┘  └─────────────┘
   │                  │
   └──────────┬───────┘
              ↓
    ┌─────────────────┐
    │ PostgreSQL (+   │
    │ Replication)    │
    └─────────────────┘

+ Multiple Celery Workers for task processing
+ Redis Cluster for cache/messaging
+ Elasticsearch Cluster for search scaling
```

---

## Diagrama 10: CI/CD Pipeline (Future)

```
Developer pushes code
        │
        ↓
GitHub Actions trigger
        │
        ├────────────────────────────┐
        ↓                            ↓
    Run Tests              Build Docker Image
    pytest (46 tests)      docker build
        │                            │
        ├─ FAILED? → Block merge      │
        │                            │
        └─ OK? ─────┐                │
                    │                ↓
                    └─→ Push to Registry
                        registr.ex/bb-app:latest
                               │
                               ↓
                        Deploy to Staging
                        (validate)
                               │
                               ↓
                        Manual Approval
                               │
                               ↓
                        Deploy to Production
                        (Kubernetes/Swarm)
                               │
                               ↓
                        Smoke Tests
                               │
                               ↓
                        Monitor Logs & Health
```

---

## Diagrama 11: Responsabilidades por Modulo

```
app/
├── PRESENTATION
│   └── api/
│       ├── magazines.py    - HTTP handlers
│       ├── articles.py     - HTTP handlers
│       └── admin.py        - HTTP handlers
│
├── BUSINESS LOGIC
│   ├── extractors/         - OAI-PMH extraction
│   ├── tasks/              - Celery async jobs
│   └── core/               - Config & ES client
│
└── DATA ACCESS
    └── core/
        ├── database.py     - SQLAlchemy ORM
        └── config.py       - Connection strings

tests/
├── UNIT TESTS             - Test individual functions (mocked)
├── INTEGRATION TESTS      - Test module interactions
└── E2E TESTS             - Test complete workflows

Documentacao/
└── KNOWLEDGE BASE         - Guides & diagrams
```

---

## Diagrama 12: Metricas & Monitoramento (Future)

```
Application Metrics
├── Response Times
│   └─ P50, P95, P99 latency
├── Throughput
│   └─ Requests/sec
├── Error Rate
│   └─ 4xx, 5xx %
├── Database
│   └─ Query time, connections
└── Search (Elasticsearch)
    └─ Index size, query time

Monitoring Stack (Future)
├── Prometheus (metrics collection)
├── Grafana (dashboards)
├── ELK Stack (logs)
└── Sentry (error tracking)

Infrastructure
├── CPU/Memory usage
├── Disk I/O
├── Network bandwidth
└── Health checks
```

---

## Diagrama 13: Estado de um Teste

```
Fixture Setup
     │
     ├─ Create DB in memory
     ├─ Mock Elasticsearch
     ├─ Mock Redis
     └─ Mock Celery
     │
     ↓
TEST EXECUTION
     │
     ├─ ARRANGE
     │  └─ Prepare test data
     │
     ├─ ACT
     │  └─ Execute code
     │
     ├─ ASSERT
     │  ├─ Check result 1
     │  ├─ Check result 2
     │  └─ Check result N
     │
     ↓
RESULT
├─ ✅ PASSED
│  └─ Fixture cleanup
│
├─ ❌ FAILED
│  ├─ Exception caught
│  ├─ Traceback printed
│  └─ Fixture cleanup
│
└─ ⏭️ SKIPPED
   └─ Test marked skip
```

---

## Diagrama 14: Fluxo Completo (Usuario até BD)

```
USER ACTION
│
├─ Browser: GET /articles?q=AI
│
v──────────→ Frontend (React/Vue)
│            ├─ Parse URL
│            ├─ Make HTTP request
│            └─ Show loading spinner
│
v──────────→ Network
│            └─ HTTP request sent
│
v──────────→ FastAPI Server
│            ├─ Route to api/articles.py
│            ├─ Validate params
│            └─ Call handler function
│
v──────────→ Business Logic
│            ├─ Prepare query
│            └─ Call ES client
│
v──────────→ Elasticsearch
│            ├─ Parse query
│            ├─ Search index
│            └─ Return results
│
v──────────→ Database (PostgreSQL)
│            ├─ Query Article table
│            ├─ Filter + pagination
│            └─ Return rows
│
v──────────→ Serialization
│            ├─ Convert to ArticleRead (Pydantic)
│            └─ JSON encode
│
v──────────→ HTTP Response
│            └─ 200 OK + JSON body
│
v──────────→ Network
│            └─ JSON transmitted
│
v──────────→ Frontend
│            ├─ Parse JSON
│            ├─ Update state
│            └─ Re-render articles list
│
v──────────→ Browser
│            └─ Display results
│
✅ DONE!
```

---

## Diagrama 15: Versionamento (Gitflow)

```
main (production)
  ↑
  │ (merge PR)
  │
  ├──────────────────────────────→ release/1.0
  │                                    ↑
  │                                    │ (hotfix)
  │                                    ├─ v1.0.1 tag
  │
develop (staging)
  ↑
  │ (merge PR)
  │
  ├────────────────┬────────────────┬──────────────────┐
  │                │                │                  │
feature/login  feature/search  feature/export    feature/api-v2
  │                │                │                  │
  └─ PR ──────────┘                └─────────────────┘
     (review)

main → version 1.0.0 (stable)
develop → version 1.1.0-dev (unstable)
feature/* → experimental code
```

---

## Diagrama 16: Learning Path

```
START HERE
     │
     ├─ Read COMO_FUNCIONAM.md
     │  └─ 15 min understanding
     │     │
     │     ├─ Read EXEMPLOS_PRATICOS.md
     │     │  └─ 20 min code examples
     │     │     │
     │     │     ├─ Read OQUE_CADA_ARQUIVO_FAZ.md
     │     │     │  └─ 15 min details
     │     │     │     │
     │     │     │     ├─ Explore Source Code
     │     │     │     │  └─ app/ (1-2 hours)
     │     │     │     │     │
     │     │     │     │     ├─ Run Tests
     │     │     │     │     │  └─ pytest -v
     │     │     │     │     │     │
     │     │     │     │     ├─ Write Your Own Test
     │     │     │     │     │  └─ tests/unit/test_my_code.py
     │     │     │     │     │     │
     │     │     │     │     ├─ Modify Code
     │     │     │     │     │  └─ Add feature/fix bug
     │     │     │     │     │     │
     │     │     │     │     └─ Make PR
     │     │     │     │        (Code Review)
     │     │
     │     └─ Read README_COMPLETO_BACKEND.md
     │        └─ 10 min overview
     │
     ├─ Read ESTRUTURA_BACKEND.md
     │  └─ 5 min file tree
     │
     └─ View DIAGRAMAS.md
        └─ 10 min (this file!)

TOTAL: ~ 2 hours to deep understanding! 🎉
```

---

## Summary: Diagrams Included

| # | Diagram | Purpose |
|---|---------|---------|
| 1 | Data Flow | End-to-end data journey |
| 2 | Layered Architecture | Component organization |
| 3 | Sync Cycle | OAI-PMH synchronization |
| 4 | Test Structure | Pytest organization |
| 5 | Endpoint Flow | HTTP request lifecycle |
| 6 | Data Models | Database schema |
| 7 | Security | Authentication (future) |
| 8 | Docker Stack | Container services |
| 9 | Scalability | Horizontal scaling |
| 10 | CI/CD Pipeline | Deployment workflow |
| 11 | Module Responsibilities | Who does what |
| 12 | Monitoring | Metrics & observability |
| 13 | Test Lifecycle | Test state machine |
| 14 | Complete Flow | User to DB |
| 15 | Git Workflow | Version control |
| 16 | Learning Path | How to learn |

**Total: 16 diagrams explaining the entire system! 🎨**

---

**Next:** Read [README_COMPLETO_BACKEND.md](README_COMPLETO_BACKEND.md) for complete overview!
