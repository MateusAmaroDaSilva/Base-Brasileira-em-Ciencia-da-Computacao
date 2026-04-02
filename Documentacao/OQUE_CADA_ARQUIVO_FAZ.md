# O Que Cada Arquivo Faz - Backend

Detalhamento completo de CADA arquivo e pasta do backend.

---

## Estrutura Completa

```
backend/
├── app/                 # Código-fonte (Python)
│   ├── main.py          # Inicia a aplicação FastAPI
│   ├── __init__.py      # Marca pasta como package
│   │
│   ├── api/             # Endpoints HTTP
│   │   ├── magazines.py  # CRUD de revistas
│   │   ├── articles.py   # CRUD de artigos
│   │   ├── admin.py      # Endpoints admin (sync, logs)
│   │   └── __init__.py
│   │
│   ├── core/            # Configuracao e BD
│   │   ├── config.py             # Variáveis de ambiente
│   │   ├── database.py           # Modelos SQLAlchemy + conexão
│   │   ├── elasticsearch_client.py # Cliente Elasticsearch
│   │   ├── init_db.py            # Script setup inicial
│   │   └── __init__.py
│   │
│   ├── models/          # Modelos SQLAlchemy
│   │   └── __init__.py   # (vazio, models em app/core/database.py)
│   │
│   ├── schemas/         # Schemas Pydantic (validação)
│   │   ├── schemas.py           # DTO (Data Transfer Objects)
│   │   └── __init__.py
│   │
│   ├── extractors/      # Extratores de dados
│   │   ├── oai_pmh.py  # Extrator OAI-PMH (busca revistas)
│   │   └── __init__.py
│   │
│   ├── tasks/           # Celery (tarefas assincronizadas)
│   │   ├── celery_app.py  # Config do Celery
│   │   ├── sync_tasks.py  # Tasks de sincronização
│   │   └── __init__.py
│   │
│   └── __pycache__/     # Cache compiled (auto-gerado)
│
├── tests/               # Suite de testes
│   ├── unit/           # Testes rápidos
│   ├── integration/    # Testes integrados
│   ├── e2e/           # Testes end-to-end
│   ├── conftest.py    # Fixtures compartilhadas
│   ├── utils.py       # TestDataBuilder
│   └── ... (resto em tests/docs/)
│
├── Documentacao/        # Esta documentacao!
│   ├── COMO_FUNCIONAM.md
│   ├── EXEMPLOS_PRATICOS.md
│   ├── OQUE_CADA_ARQUIVO_FAZ.md      ← Você está aqui
│   ├── README_COMPLETO_BACKEND.md
│   ├── ESTRUTURA_BACKEND.md
│   ├── DIAGRAMAS.md
│   └── INDEX.md
│
├── requirements.txt     # Dependências (produção)
├── Dockerfile          # Containerização
├── Dockerfile.dev      # Desenvolvimento
├── README.md           # README geral
├── .gitignore          # Arquivos ignorados
├── .env.example        # Template de variáveis
└── .pytest_cache/      # Cache pytest (auto-gerado)
```

---

## app/main.py

### O que faz?
**Inicializar e configurar a aplicação FastAPI.**

### Conteúdo Típico
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.api import magazines, articles, admin

# Criar tabelas no BD
Base.metadata.create_all(bind=engine)

# Criar app FastAPI
app = FastAPI(
    title="Base Brasileira em Ciência da Computação",
    description="API para gerenciar artigos acadêmicos",
    version="1.0.0"
)

# Middleware (CORS para frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers (endpoints)
app.include_router(magazines.router)
app.include_router(articles.router)
app.include_router(admin.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Como é Usado?
```bash
python app/main.py         # Dev (hot reload OFF)
uvicorn app.main:app       # Produção
# ↓
# http://localhost:8000/docs  ← Swagger
# http://localhost:8000/redoc ← ReDoc
```

---

## api/magazines.py

### O que faz?
**Endpoints para gerenciar revistas (CRUD).**

### Arquivos Relacionados
- Route: `/api/v1/magazines`
- Modelo: `Magazine` (em `app/core/database.py`)
- Schema: `MagazineCreate`, `MagazineRead` (em `app/schemas/schemas.py`)

### Endpoints Típicos
```python
# GET /api/v1/magazines
# Listar todas as revistas

# POST /api/v1/magazines
# Criar nova revista

# GET /api/v1/magazines/{id}
# Detalhes de uma revista

# PUT /api/v1/magazines/{id}
# Atualizar revista

# DELETE /api/v1/magazines/{id}
# Deletar revista
```

### Exemplo de Uso
```bash
# Listar
curl http://localhost:8000/api/v1/magazines

# Criar
curl -X POST http://localhost:8000/api/v1/magazines \
  -H "Content-Type: application/json" \
  -d '{
    "name": "RBIE",
    "url": "http://journals-sol.sbc.org.br/oai",
    "description": "..."
  }'
```

---

## 📄 api/articles.py

### O que faz?
**Endpoints para gerenciar artigos (CRUD + busca).**

### Arquivos Relacionados
- Route: `/api/v1/articles`
- Modelo: `Article` (em `app/core/database.py`)
- Schema: `ArticleCreate`, `ArticleRead` (em `app/schemas/schemas.py`)
- Search: Via Elasticsearch

### Endpoints Típicos
```python
# GET /api/v1/articles
# Listar artigos (paginado)

# GET /api/v1/articles?q=machine%20learning
# Buscar artigos (full-text search)

# POST /api/v1/articles
# Criar artigo manualmente

# GET /api/v1/articles/{id}
# Detalhes de um artigo

# PUT /api/v1/articles/{id}
# Atualizar artigo

# DELETE /api/v1/articles/{id}
# Deletar artigo
```

### Exemplo de Uso
```bash
# Listar primeiros 10
curl "http://localhost:8000/api/v1/articles?limit=10&offset=0"

# Buscar "machine learning"
curl "http://localhost:8000/api/v1/articles?q=machine%20learning"

# Buscar de uma revista específica
curl "http://localhost:8000/api/v1/articles?magazine_id=1"
```

---

## api/admin.py

### O que faz?
**Endpoints administrativos (synchronização, logs).**

### Arquivos Relacionados
- Route: `/api/v1/admin`
- Tasks: `app/tasks/sync_tasks.py`
- Modelo: `SyncLog` (auditoria)

### Endpoints Típicos
```python
# POST /api/v1/admin/sync
# Sincronizar manualmente (trigger sync_magazine task)

# POST /api/v1/admin/sync-all
# Sincronizar TODAS as revistas

# GET /api/v1/admin/logs
# Ver histórico de sincronizações

# GET /api/v1/admin/stats
# Estatísticas (articles count, last sync, etc)
```

### Exemplo de Uso
```bash
# Sincronizar revista específica
curl -X POST http://localhost:8000/api/v1/admin/sync \
  -H "Content-Type: application/json" \
  -d '{"magazine_id": 1}'

# Ver logs
curl http://localhost:8000/api/v1/admin/logs

# Sincronizar tudo
curl -X POST http://localhost:8000/api/v1/admin/sync-all
```

---

## ⚙️ core/config.py

### O que faz?
**Variáveis de ambiente e configurações globais.**

### Conteúdo Típico
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./sql_app.db"
    
    # Elasticsearch
    ELASTICSEARCH_HOST: str = "localhost"
    ELASTICSEARCH_PORT: int = 9200
    ELASTICSEARCH_INDEX: str = "articles"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    
    # App
    APP_NAME: str = "Base Brasileira"
    DEBUG: bool = False
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### Usado Em
```python
# Em qualquer arquivo:
from app.core.config import settings

database_url = settings.DATABASE_URL
es_host = settings.ELASTICSEARCH_HOST
# Valores vêm de .env ou defaults
```

---

## 📊 core/database.py

### O que faz?
**Define os modelos SQLAlchemy (Magazine, Article, SyncLog) e engine do BD.**

### Modelos Definidos

#### 1. Magazine
```python
class Magazine(Base):
    __tablename__ = "magazines"
    
    id: int                    # PK
    name: str                  # "RBIE"
    url_oai_pmh: str          # "http://journals-sol.sbc.org.br/oai"
    description: str
    is_active: bool           # True/False
    last_sync: datetime       # Quando sincronizou
    created_at: datetime
    updated_at: datetime
    extra_metadata: dict      # JSON
    
    articles = relationship("Article")  # Reverse FK
```

#### 2. Article
```python
class Article(Base):
    __tablename__ = "articles"
    
    id: int                    # PK
    oai_identifier: str        # UNIQUE (chave de deduplicação)
    magazine_id: int           # FK → Magazine
    title: str
    abstract: str
    authors: List[str]        # JSON
    keywords: List[str]       # JSON
    publication_date: str
    url: str
    doi: str
    volume: str
    issue: str
    pages: str
    language: str
    is_indexed: bool          # Indexado no ES?
    raw_metadata: dict        # JSON (armazena tudo)
    created_at: datetime
    updated_at: datetime
```

#### 3. SyncLog
```python
class SyncLog(Base):
    __tablename__ = "sync_logs"
    
    id: int
    magazine_id: int           # FK
    status: str               # "success" / "failed"
    articles_new: int
    articles_updated: int
    articles_failed: int
    errors: dict              # JSON (erros ocorridos)
    duration_seconds: float
    message: str
    created_at: datetime
```

### Engine & Session
```python
# Engine
engine = create_engine(DATABASE_URL, ...)

# Session (para consultas)
SessionLocal = sessionmaker(bind=engine)

# Uso em endpoints:
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## core/elasticsearch_client.py

### O que faz?
**Cliente Elasticsearch para buscar artigos full-text.**

### Métodos Principais
```python
class ElasticsearchClient:
    def __init__(self):
        # Conecta ao ES (localhost:9200)
        self.es = Elasticsearch(...)
        self.index_name = "articles"
    
    def bulk_index_articles(self, articles):
        # Indexa múltiplos articles no ES
        # Rápido (usa bulk API)
    
    def search(self, query: str, limit: int = 10):
        # Busca full-text em "machine learning"
        # Retorna: [{"title": "...", "abstract": "..."}, ...]
    
    def recreate_index(self):
        # Deleta e recriad índice
        # Usado em sync completa
```

### Usado Em
```python
# Em api/articles.py:
GET /api/v1/articles?q=machine%20learning
# ↓
# Chama elasticsearch_client.search("machine learning")
# ↓
# Retorna 10 artigos encontrados
```

---

## 🚀 core/init_db.py

### O que faz?
**Script para inicializar BD com dados iniciais (as 5 revistas).**

### Conteúdo Típico
```python
def init_db():
    from app.core.database import SessionLocal, Base, engine
    from app.models import Magazine
    
    # Criar tabelas
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Criar as 5 revistas iniciais
    magazines = [
        Magazine(
            name="RBIE",
            url_oai_pmh="http://journals-sol.sbc.org.br/...",
            description="Brazilian Journal of Computers in Education"
        ),
        # ... 4 mais
    ]
    
    db.add_all(magazines)
    db.commit()
    db.close()
    
    print("✅ BD inicializado com sucesso!")

if __name__ == "__main__":
    init_db()
```

### Como Usar
```bash
# Rodar via Docker
docker-compose exec backend python -c "from app.core.init_db import init_db; init_db()"

# Ou direto
python app/core/init_db.py
```

---

## 📋 schemas/schemas.py

### O que faz?
**Pydantic models (DTOs) para validação de input/output.**

### Modelos Típicos
```python
from pydantic import BaseModel
from typing import List, Optional

# REQUEST (input)
class MagazineCreate(BaseModel):
    name: str
    url_oai_pmh: str
    description: str

class ArticleCreate(BaseModel):
    title: str
    abstract: str
    authors: List[str]
    keywords: List[str]

# RESPONSE (output)
class MagazineRead(BaseModel):
    id: int
    name: str
    url_oai_pmh: str
    last_sync: Optional[datetime]
    
    class Config:
        from_attributes = True  # ORM mode

class ArticleRead(BaseModel):
    id: int
    title: str
    abstract: str
    authors: List[str]
    publication_date: str
```

### Usado Em
```python
# Em api/magazines.py:

@router.post("/magazines", response_model=MagazineRead)
def create_magazine(magazine: MagazineCreate, db: Session = Depends(get_db)):
    #                          ↑ Valida input
    #                                           ↑ Serializa output
    db_magazine = Magazine(**magazine.dict())
    db.add(db_magazine)
    db.commit()
    db.refresh(db_magazine)
    return db_magazine  # ← Retorna como MagazineRead
```

---

## 📥 extractors/oai_pmh.py

### O que faz?
**Extrator OAI-PMH: busca artigos das revistas via protocolo OAI-PMH.**

### Funcionalidades
```python
class OAIPMHExtractor:
    def __init__(self, magazine_url: str):
        self.magazine_url = magazine_url
    
    def extract(self) -> List[dict]:
        # 1. ListRecords via OAI-PMH
        # 2. Parse Dublin Core (XML)
        # 3. Desduplicar (oai_identifier)
        # 4. Retornar [{"title": "...", "authors": [...], ...}]
    
    def handle_resumption_token(self, token):
        # OAI-PMH pagina com resumption tokens
        # Continua de onde parou
```

### Usado Em
```python
# Em tasks/sync_tasks.py:

def sync_magazine(magazine_id: int):
    magazine = db.query(Magazine).filter_by(id=magazine_id).first()
    extractor = OAIPMHExtractor(magazine.url_oai_pmh)
    
    articles = extractor.extract()  # ← Chama aqui
    
    # Salva no BD + Elasticsearch
```

---

## ⏹️ tasks/celery_app.py

### O que faz?
**Configurar Celery (fila de tarefas assincronizadas).**

### Conteúdo
```python
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "bb_app",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
)
```

### Usado Em
```python
# Em tasks/sync_tasks.py:
from app.tasks.celery_app import celery_app

@celery_app.task
def sync_magazine(magazine_id: int):
    # Task que roda assincronizadamente
    # Pode estar rodando em outro processo/servidor
```

---

## ⚙️ tasks/sync_tasks.py

### O que faz?
**Tarefas Celery para sincronizar revistas.**

### Tasks Principais
```python
@celery_app.task
def sync_magazine(magazine_id: int):
    """Sincronizar UMA revista"""
    # 1. Buscar revista do BD
    # 2. Chamar OAIPMHExtractor
    # 3. Salvar artigos no BD
    # 4. Indexar no Elasticsearch
    # 5. Logar sucesso/erro em SyncLog

@celery_app.task
def sync_all_magazines():
    """Sincronizar TODAS as revistas"""
    magazines = db.query(Magazine).filter_by(is_active=True).all()
    for magazine in magazines:
        sync_magazine.delay(magazine.id)  # Async

@celery_app.on_after_finalize
def setup(sender, **kwargs):
    """Agendar sync automática a cada 24 horas"""
    sender.add_periodic_task(
        86400.0,  # 24 horas em segundos
        sync_all_magazines.s(),
        name="sync-all-magazines-daily"
    )
```

### Usado Em
```python
# Via API:
POST /api/v1/admin/sync?magazine_id=1
# ↓
# Chama sync_magazine.delay(1)
# ↓ (assincronizadamente)
# Roda em background (worker Celery)
```

---

## 🧪 Estrutura de Testes

Veja [COMO_FUNCIONAM.md](COMO_FUNCIONAM.md) para detalhes.

Sumário:
- `conftest.py` → Fixtures compartilhadas
- `pytest.ini` → Configuração
- `utils.py` → TestDataBuilder
- `unit/` → 44 testes rápidos
- `integration/` → 2 testes integrados
- `e2e/` → Cenários reais

---

## 📦 requirements.txt

### Dependências de Produção

```txt
fastapi==0.104.1          # Web framework
uvicorn==0.24.0          # ASGI server
sqlalchemy==2.0.23       # ORM
psycopg2==2.9.9          # PostgreSQL driver
elasticsearch==8.11.0    # Search engine client
redis==5.0.0             # Cache/broker
celery==5.3.4            # Task queue
pydantic==2.5.0          # Validation
pydantic-settings==2.1.0 # Config from .env
requests==2.31.0         # HTTP client
lxml==4.9.3              # XML parser (OAI-PMH)
python-dotenv==1.0.0     # .env support
```

### Instalar
```bash
pip install -r requirements.txt
```

---

## 🐳 Dockerfile

### O que faz?
**Containerizar a aplicação para produçã.**

### Conteúdo Típico
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instalar dependências
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copiar código
COPY . .

# Expor porta
EXPOSE 8000

# Comando padrão
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Usar
```bash
# Build
docker build -t bb-app .

# Run
docker run -p 8000:8000 bb-app
```

---

## 📖 README.md

### O que faz?
**Documentação principal do backend.**

Deve conter:
- Descrição do projeto
- Como instalar
- Como rodar
- Endpoints principais
- Contribuindo
- Licença

---

## .gitignore

### O que faz?
**Ignorar arquivos que não devem ir pro Git.**

### Conteúdo Típico
```
# Python
__pycache__/
*.pyc
*.pyo
*.egg-info/
.pytest_cache/
.mypy_cache/
.coverage

# Ambiente
.env
.venv
venv/

# IDE
.vscode/
.idea/
*.swp
*.swo

# Banco de dados
*.db
*.sqlite
*.sqlite3

# Cache
.DS_Store
Thumbs.db
```

---

## .env.example

### O que faz?
**Template de variáveis de ambiente.**

### Conteúdo
```env
# .env.example (commit ao Git)
DATABASE_URL=sqlite:///./sql_app.db
ELASTICSEARCH_HOST=localhost
ELASTICSEARCH_PORT=9200
REDIS_URL=redis://localhost:6379
CELERY_BROKER_URL=redis://localhost:6379/0
DEBUG=False
```

### Usar
```bash
# Copiar
cp .env.example .env

# Editar
nano .env  # Sua config local

# NÃO commitar! (no .gitignore)
```

---

## 🎯 Resumo: Responsabilidades

| Arquivo | Responsabilidade |
|---------|-----------------|
| `main.py` | Iniciar FastAPI |
| `api/*.py` | Endpoints HTTP |
| `core/config.py` | Variáveis globais |
| `core/database.py` | Modelos + BD |
| `core/elasticsearch_client.py` | Busca full-text |
| `core/init_db.py` | Setup inicial |
| `schemas/` | Validação (Pydantic) |
| `extractors/oai_pmh.py` | Buscar dados OAI-PMH |
| `tasks/` | Celery async |
| `tests/` | Qualidade assurance |
| `Documentacao/` | Esta documentação! |
| `requirements.txt` | Dependências |
| `Dockerfile` | Containerização |

---

**Próximo:** Leia [README_COMPLETO_BACKEND.md](README_COMPLETO_BACKEND.md) para visão geral!
