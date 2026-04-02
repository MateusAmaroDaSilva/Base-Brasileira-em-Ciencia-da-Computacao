# Como Funcionam os Testes

Uma explicação **completa e profunda** de todo o sistema de testes do backend.

---

## Visão Geral Rápida

Você tem **46 testes** que validam automaticamente:
- Requisições HTTP (API REST)
- Operações de banco de dados
- Elasticsearch (busca full-text)
- Celery (tarefas assincronizadas)

**Status atual:** 38 passando (82.6%) | 62% cobertura de código

---

## Como Funciona (Fluxo Alto Nível)

```
1. Você roda: pytest
              ↓
2. pytest lê arquivo: tests/pytest.ini (regras)
              ↓
3. pytest carrega: tests/conftest.py (configuração global)
              ↓
4. pytest procura: tests/test_*.py, tests/unit/test_*.py, etc
              ↓
5. Para CADA arquivo:
   - Importa e valida
   - Lê marcadores (@pytest.mark)
   - Injeta fixtures
              ↓
6. Para CADA test_função():
   - SETUP: Arruma dados fake
   - RUN: Executa código testado
   - ASSERT: Verifica resultado
   - CLEANUP: Limpa (rollback do BD)
              ↓
7. Resultado:
   ✅ PASSED  /  ❌ FAILED  /  ⏭️ SKIPPED
              ↓
8. Gera relatório:
   - Terminal (colorido)
   - coverage/htmlcov/index.html
   - coverage.xml (para CI/CD)
```

---

## Estrutura Completa de Testes

```
backend/tests/
├── conftest.py                 #  Configuração global
├── utils.py                    #  Helpers (TestDataBuilder)
├── pytest.ini                  #  Regras de execução
├── requirements-dev.txt        #  Dependências
├── test_extractors.py          #  Teste isolado
├── INDEX.md                    #  Índice rápido
├── README.md                   #  Referência
│
├── unit/                       #  44 testes rápidos
│   ├── test_elasticsearch_client.py    11 testes 100%
│   ├── test_api_endpoints.py           25 testes 92%
│   ├── test_sync_tasks.py               8 testes 62%
│   └── __init__.py
│
├── integration/                # Testes integrados
│   ├── test_workflows.py
│   └── __init__.py
│
├── e2e/                        # Cenários end-to-end
│   ├── test_user_scenarios.py
│   └── __init__.py
│
├── scripts/                    # Executores prontos
│   ├── run_tests.ps1          # Windows PowerShell
│   └── run_tests.sh           # Mac/Linux Bash
│
├── coverage/                   # Relatórios
│   ├── htmlcov/               # Abrir index.html no browser
│   ├── coverage.xml           # Para CI/CD
│   └── .coverage              # Dados brutos
│
├── docs/                       # Documentação
│   ├── README.md
│   ├── SETUP.md
│   ├── SUMMARY.md
│   └── REPORT_20260326.md
│
└── __pycache__/               # Cache (auto-gerado)
```

---

## conftest.py - O Maestro

### O Que É?

Arquivo de **configuração global** que:
- Define fixtures (serviços compartilhados)
- Faz setup único para todos os testes
- Limpa dados após cada teste

### Estrutura

```python
@pytest.fixture(scope="session")
def test_db_engine():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    return engine

@pytest.fixture
def db_session(test_db_engine):
    session = SessionLocal(bind=test_db_engine)
    yield session
    session.rollback()  

@pytest.fixture
def test_client():
    from app.main import app
    return TestClient(app)

@pytest.fixture
def mock_elasticsearch():
    with patch('app.core.elasticsearch_client.Elasticsearch'):
        return MagicMock()

@pytest.fixture
def mock_redis():
    with patch('redis.Redis'):
        return MagicMock()


@pytest.fixture
def mock_celery_task():
    with patch('app.tasks.sync_tasks.sync_magazine.apply_async'):
        return MagicMock()

@pytest.fixture
def sample_magazine():
    """Magazine fake pronto"""
    return {"id": 1, "name": "RBIE", "url": "http://..."}

@pytest.fixture
def sample_article():
    return {"id": 1, "title": "Machine Learning", ...}
```

### Como as Fixtures Funcionam

```python
def test_create_article(test_client, db_session):
    #                    ↑ fixture  ↑ fixture

    # pytest AUTOMATICAMENTE:
    # 1. Vê que você pediu test_client
    # 2. Procura no conftest.py
    # 3. Executa a fixture
    # 4. Passa o resultado
    # 5. Após teste, limpa automaticamente

    response = test_client.post("/articles", json={...})
    assert response.status_code == 201
```

---

## pytest.ini - Regras

### O Que É?

Arquivo de **configuração** que define:
- Onde procurar por testes
- Como rodar (verbose, cobertura, etc)
- Marcadores (categories)

### Conteúdo

```ini
[pytest]
testpaths = tests              
python_files = test_*.py       
python_functions = test_*      
python_classes = Test*         

addopts = 
    -v                    
    --strict-markers      
    --tb=short          
    --color=yes        
    --cov=app            
    --cov-report=html     
    --cov-report=term-missing  
    --cov-report=xml      
    -m "not slow"         

markers =
    unit: Testes de unidade
    integration: Testes de integração
    e2e: Testes end-to-end
    slow: Testes lentos (>5s)
    elasticsearch: Usa Elasticsearch
    database: Usa banco de dados
```

### Resultado Prático

```bash
pytest tests/unit/ -v --strict-markers --tb=short --color=yes \
  --cov=app --cov-report=html --cov-report=term-missing

pytest
# Roda com TODAS as configurações salvas
```

---

## 📦 requirements-dev.txt - Ferramentas

### Dependências Instaladas

```
pytest==7.4.3                # Motor de testes
pytest-cov==4.1.0            # Cobertura
pytest-asyncio==0.21.1       # Async/await
pytest-mock==3.12.0          # Mocks
pytest-xdist==3.5.0          # Paralela
pytest-timeout==2.2.0        # Timeout

coverage==7.3.2              # Analisa cobertura
responses==0.14.0            # Mock HTTP
faker==21.0.0                # Dados fake
hypothesis==6.90.0           # Property-based testing
```

### Como Usar

```bash
pip install -r tests/requirements-dev.txt

# Pronto Agora pode rodar pytest
pytest
```

---

## 🛠️ utils.py - Builders (Sem Repetição)

### Problema: Dados Fake Repetidos

```python
def test_1():
    article = {
        "id": 1, "title": "Test", "abstract": "...",
        "authors": ["..."], "keywords": ["..."],
        "publication_date": "2026-01-01", ...
    }

def test_2():
    article = {  
        "id": 2, "title": "Test", "abstract": "...",
        ...
    }
```

### Solução: TestDataBuilder

```python
from utils import TestDataBuilder

def test_1():
    article = TestDataBuilder.build_article(id=1, title="Custom")

def test_2():
    articles = TestDataBuilder.build_articles(count=5)

def test_3():
    magazine = TestDataBuilder.build_magazine(name="RBIE")
```

### Builders Disponíveis

```python

TestDataBuilder.build_article(title="...", magazine_id=1, **kwargs)

TestDataBuilder.build_magazine(name="...", **kwargs)

TestDataBuilder.build_articles(count=5)

TestDataBuilder.build_search_query(query="test", limit=10)

TestAssertions.assert_valid_article(article)
TestAssertions.assert_valid_search_response(response)
```

---

## unit/ - Testes de Unidade

### O Que São?

Testes **rápidos e isolados** que testam UM componente de cada vez.

### Características

- **Rápido:** 10-50ms cada
- **Mockados:** Sem dependências externas
- **Isolado:** Uma coisa por teste
- **Determinístico:** Resultado sempre igual

### Estrutura

```python
import pytest
from unittest.mock import MagicMock

@pytest.mark.unit  
class TestElasticsearchClient:
    
    @pytest.fixture
    def es_client(self):
        return ElasticsearchClient()
    
    def test_init(self, es_client):
        # ARRANGE
        # ACT
        # ASSERT
        assert es_client.index_name == 'articles'
```

### Testes Disponíveis

```
test_elasticsearch_client.py    11 testes 100% pass
├── test_init
├── test_create_index
├── test_bulk_index
├── test_search
└── ... (7 mais)

test_api_endpoints.py           25 testes 92% pass
├── test_get_articles
├── test_create_article
├── test_search_articles
└── ... (22 mais)

test_sync_tasks.py               8 testes 62% pass
├── test_sync_magazine
├── test_sync_all_magazines
└── ... (6 mais)
```

---

## integration/ - Testes de Integração

### O Que São?

Testes que validam **múltiplos componentes juntos**.

### Características

- **Médio:** 100-500ms cada
- **Integrado:** Vários componentes
- **Realista:** Fluxo mais próximo do real

### Exemplo

```python
@pytest.mark.integration
def test_magazine_sync_workflow(test_client, db_session):
    response = test_client.post("/api/v1/magazines", json={...})
    magazine = response.json()
    
    response = test_client.post("/api/v1/admin/sync")
    
    articles = db_session.query(Article).all()
    assert len(articles) > 0
    
    es_result = mock_elasticsearch.search()
    assert len(es_result) > 0
```

---

## e2e/ - Testes End-to-End

### O Que São?

Testes que simulam **cenários reais de usuário**.

### Características

- **Lento:** 500ms-5s cada
- **Realista:** Como usuário faria
- **Opcional:** Rodados com `-m slow`

### Exemplo

```python
@pytest.mark.e2e
@pytest.mark.slow
def test_user_searches_articles(test_client):
    response = test_client.get("/api/v1/docs")
    assert response.status_code == 200
    
    response = test_client.get("/api/v1/magazines")
    magazines = response.json()["magazines"]
    assert len(magazines) > 0
    
    response = test_client.get("/api/v1/articles?q=artificial%20intelligence")
    articles = response.json()["articles"]
    assert len(articles) > 0
    
    assert any("AI" in a["title"] for a in articles)
```

---

## scripts/ - Executores

### run_tests.ps1 (Windows)

```powershell
.\scripts\run_tests.ps1 -Mode quick

.\scripts\run_tests.ps1 -Mode all

.\scripts\run_tests.ps1 -Mode coverage

```

### run_tests.sh (Mac/Linux)

```bash
./scripts/run_tests.sh --mode quick
./scripts/run_tests.sh --mode all
./scripts/run_tests.sh --mode coverage
```

---

## coverage/ - Relatórios

### Arquivos Gerados

```
coverage/
├── htmlcov/              # Relatório visual
│   ├── index.html       # ← ABRIR NO BROWSER
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── extractors/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── tasks/
│   └── status.json
├── coverage.xml         # Para CI/CD (GitHub Actions, Jenkins)
└── .coverage            # Dados brutos (não abra)
```

### Como Interpretar

```
Verde   = Linha foi testada (covered)
Vermelho = Linha NÃO foi testada (not covered)
Amarelo  = Linha parcialmente testada

Exemplo:
def sync_magazine():       # Testado
    if error:              # Só sucesso testado
        log_error()        # Erro não testado
    return result          # Testado
```

### Status Atual

```
62% cobertura total
├── app/core/elasticsearch_client.py    100% 
├── app/core/config.py                  100% 
├── app/schemas/schemas.py              100% 
├── app/api/articles.py                  85% 
└── app/tasks/sync_tasks.py              70% 
```

---

## Estrutura AAA (Arrange, Act, Assert)

**Padrão padrão de testes profissionais:**

```python
def test_bulk_index_articles_success(self, es_client):
    
    articles = [
        {"id": 1, "title": "AI in Education", ...},
        {"id": 2, "title": "ML Basics", ...},
    ]
    
    es_client.bulk_index_articles(articles)
    
    assert es_client.es.index.call_count == 2  
    assert es_client.es.index.called_with(...)
```

---

## Ciclo de Vida Completo

```
Sessão de Testes
│
├─ 1. SETUP (configuração)
│  ├─ Lê pytest.ini
│  └─ Carrega conftest.py
│
├─ 2. Para cada teste:
│  │
│  ├─ SETUP (arranjar)
│  │  ├─ Injeta fixtures
│  │  ├─ Cria BD vazio
│  │  └─ Cria dados fake
│  │
│  ├─ EXECUTE (rodar)
│  │  └─ Executa test_função()
│  │
│  ├─ VERIFY (verificar)
│  │  ├─ Rodas assertions
│  │  ├─ PASSED
│  │  ├─ FAILED
│  │  └─ SKIPPED
│  │
│  └─ CLEANUP (limpar)
│     ├─ Rollback do BD
│     ├─ Fecha conexões
│     └─ Remove dados fake
│
└─ 3. REPORT (relato final)
   ├─ Terminal (colorido)
   ├── coverage/htmlcov/index.html
   └─ coverage.xml
```

---

## Estatísticas

### Tempo de Execução

```
unit tests          ~50ms  
integration tests   ~400ms 
e2e tests          ~1500ms
─────────────────────────
TOTAL (quick)       ~5s   Desenvolvimento
TOTAL (all)        ~30s   CI/CD
```

### Cobertura

```
Módulo                  Coverage   Quality
───────────────────    ──────────  ──────────
elasticsearch_client    100%        Excelente
config.py               100%        Excelente
schemas.py              100%        Excelente
api/articles.py         85%         Bom
tasks/sync_tasks.py     70%         OK (Celery difícil)
───────────────────────────────────────────
TOTAL                   62%         Aceitável (target: 70%)
```

---

## Como Começar

### Instalação

```bash
cd backend/tests

# Instalar dependências
pip install -r requirements-dev.txt
```

### Rodar Testes

```bash
# Todos (com configurações do pytest.ini)
pytest

# Apenas unit (rápido)
pytest unit/ -v

# Um arquivo específico
pytest unit/test_elasticsearch_client.py -v

# Um teste específico
pytest unit/test_elasticsearch_client.py::TestElasticsearchClient::test_init -v

# Com debug (para em erro)
pytest --pdb

# Paralelo (4 workers)
pytest -n 4

# Pula testes lentos
pytest -m "not slow"

# Apenas elasticsearch
pytest -m elasticsearch
```

### Gerar Cobertura

```bash
pytest --cov=app --cov-report=html

# Abrir no browser
open coverage/htmlcov/index.html
```

---

## Dicas Profissionais

### 1. Mock vs Real
```python
# ERRADO: Conecta ao Elasticsearch REAL
es_result = elasticsearch_client.search()

# CORRETO: Usa mock
es_mock = MagicMock()
es_mock.search.return_value = {"hits": []}
```

### 2. Testes Parametrizados
```python
@pytest.mark.parametrize("input,expected", [
    ("test", True),
    ("", False),
    ("123", True),
])
def test_validate(input, expected):
    assert validate(input) == expected
    # Roda 3x automaticamente!
```

### 3. Fixture com Escopo
```python
# scope="function" (padrão) = novo para cada teste
@pytest.fixture
def db_session():  # Novo + limpo cada vez
    ...

# scope="session" = criado UMA VEZ
@pytest.fixture(scope="session")
def test_db_engine():  # Reutilizado em todos
    ...
```

### 4. Markers Customizados
```python
@pytest.mark.unit          # Categoria
@pytest.mark.elasticsearch # Subcategoria
@pytest.mark.slow          # Lento
class TestAlgo:
    ...

# Rodar:
pytest -m elasticsearch    # Só ES
pytest -m "not slow"       # Pula lentos
```

---

## Próximas Leituras

- [EXEMPLOS_PRATICOS.md](EXEMPLOS_PRATICOS.md) - Veja código real
- [OQUE_CADA_ARQUIVO_FAZ.md](OQUE_CADA_ARQUIVO_FAZ.md) - Detalhes de cada arquivo
- [../tests/INDEX.md](../tests/INDEX.md) - Índice rápido

---

**Dúvidas? Veja os arquivos de documentação ou rode os testes você mesmo!**
