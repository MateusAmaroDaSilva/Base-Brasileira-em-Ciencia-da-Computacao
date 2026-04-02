# Exemplos Praticos - Codigo Real

Exemplos práticos de CADA arquivo/pasta comentados e explicados.

---

## 1. conftest.py - Compartilhar Setup

### Problema: Repeticao de Codigo

```python
# RUIM: Repetido em 10 testes
def test_article_creation():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    # ... resto do teste

def test_article_update():
    engine = create_engine("sqlite:///:memory:")  # REPETIDO!
    Base.metadata.create_all(engine)              # REPETIDO!
    SessionLocal = sessionmaker(bind=engine)      # REPETIDO!
    session = SessionLocal()
    # ... resto do teste
```

### Solucao: conftest.py

```python
# BOM: Escrever UMA VEZ em conftest.py

@pytest.fixture(scope="session")
def test_db_engine():
    """BD criado UMA VEZ para toda sessão"""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    from app.models import Base
    Base.metadata.create_all(engine)
    return engine

@pytest.fixture
def db_session(test_db_engine):
    """novo BD para CADA teste"""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_db_engine)
    session = SessionLocal()
    from app.models import Base
    Base.metadata.create_all(test_db_engine)
    yield session
    session.rollback()
    session.close()

# Agora nos testes:
def test_article_creation(db_session):  # ✅ Fixture injetada!
    # db_session já pronto e limpo
    article = Article(title="Test")
    db_session.add(article)
    db_session.commit()
    assert article.id is not None

def test_article_update(db_session):    # ✅ Fixture injetada!
    # Mesmo setup, sem repetição!
    article = Article(title="Test")
    db_session.add(article)
    db_session.commit()
    assert article.title == "Test"
```

**Benefício:** Menos código, mais manutenível!

---

## 2. pytest.ini - Configuracao Centralizada

### Sem pytest.ini (Confuso)

```bash
# Digita tudo na linha de comando:
pytest tests/unit/ -v --strict-markers --tb=short --color=yes \
  --cov=app --cov-report=html --cov-report=term-missing -m "not slow"

# Impossível lembrar!
```

### Com pytest.ini (Simples)

**Arquivo: pytest.ini**
```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*

addopts = 
    -v
    --strict-markers
    --tb=short
    --color=yes
    --cov=app
    --cov-report=html
    --cov-report=term-missing
    -m "not slow"

markers =
    unit: Testes de unidade
    integration: Testes de integração
    e2e: End-to-end
    slow: Lento
```

**Resultado:**
```bash
# ✅ Digita só:
pytest

# Roda com TODAS as config salvas! 🎉
```

---

## 3. requirements-dev.txt - Ferramentas

```txt
pytest==7.4.3          # Engine de testes
pytest-cov==4.1.0      # Cobertura de código
pytest-mock==3.12.0    # Mocks fáceis
faker==21.0.0          # Dados fake
```

### Como Usar

```bash
# Instalar tudo
pip install -r tests/requirements-dev.txt

# Agora pode rodar:
pytest               # ✅ Funciona!
pytest --cov=app     # ✅ Com cobertura!
```

---

## 4. utils.py - TestDataBuilder

### Problema: Criar Dados Fake é Repetitivo

```python
# ❌ RUIM: Repetido em cada teste
def test_search_articles():
    articles = [
        {
            "id": 1,
            "title": "Machine Learning Basics",
            "abstract": "A comprehensive intro to ML",
            "authors": ["Dr. Silva", "Dr. Santos"],
            "keywords": ["ML", "AI", "neural networks"],
            "magazine_id": 1,
            "oai_identifier": "oai:test:1",
            "publication_date": "2026-01-15",
        },
        {
            "id": 2,
            "title": "Deep Learning Advanced",
            # ... MESMA COISA NOVAMENTE!
        }
    ]

def test_create_article():
    article = {
        # ... REPETIDO NOVAMENTE!
    }
```

### Solução: TestDataBuilder

**Em utils.py:**
```python
class TestDataBuilder:
    @staticmethod
    def build_article(title="Test Article", magazine_id=1, **kwargs):
        """Cria um article fake com valores default"""
        return {
            "id": kwargs.get("id", 1),
            "title": title,
            "abstract": kwargs.get("abstract", "Test abstract"),
            "authors": kwargs.get("authors", ["Author 1"]),
            "keywords": kwargs.get("keywords", ["test", "article"]),
            "magazine_id": magazine_id,
            "oai_identifier": kwargs.get("oai_identifier", f"oai:test:{kwargs.get('id', 1)}"),
            "publication_date": kwargs.get("publication_date", "2026-01-01"),
        }
    
    @staticmethod
    def build_articles(count=5):
        """Cria múltiplos articles"""
        return [
            TestDataBuilder.build_article(
                title=f"Article {i}",
                id=i,
                oai_identifier=f"oai:test:{i}"
            )
            for i in range(1, count + 1)
        ]
```

**Nos testes:**
```python
# ✅ BOM: Simples e reutilizável
from utils import TestDataBuilder

def test_search_articles():
    articles = TestDataBuilder.build_articles(count=5)
    # 5 articles prontos!

def test_create_article():
    article = TestDataBuilder.build_article(
        title="Custom Title",
        magazine_id=2
    )
    # Article com valores customizados!

def test_update_article():
    article = TestDataBuilder.build_article(id=99)
    # Rápido e sem repetição!
```

---

## 5. unit/ - Teste Rápido e Isolado

### Exemplo: test_elasticsearch_client.py

```python
import pytest
from unittest.mock import MagicMock
from app.core.elasticsearch_client import ElasticsearchClient

@pytest.mark.unit  # Marcar como unit
class TestElasticsearchClient:
    
    @pytest.fixture
    def es_client(self):
        """Setup: Criar cliente para cada teste"""
        es_client = ElasticsearchClient()
        es_client.es = MagicMock()  # Mock (não precisa ES real!)
        return es_client
    
    def test_init(self, es_client):
        """✅ PASSOU: Cliente inicializa com índice certo"""
        # ASSERT
        assert es_client.index_name == 'articles'
        # ⏱️ 3ms
    
    def test_bulk_index_articles_success(self, es_client):
        """✅ PASSOU: Bulk indexing funciona"""
        # ARRANGE
        articles = [
            {"id": 1, "title": "Test Article", ...},
            {"id": 2, "title": "Test Article 2", ...},
        ]
        
        # ACT
        es_client.bulk_index_articles(articles)
        
        # ASSERT
        assert es_client.es.index.called
        # ⏱️ 5ms
    
    def test_search_articles_found(self, es_client):
        """✅ PASSOU: Busca encontra resultados"""
        # ARRANGE
        es_client.es.search.return_value = {
            "hits": {
                "hits": [
                    {"_source": {"title": "Machine Learning"}}
                ]
            }
        }
        
        # ACT
        results = es_client.search("machine learning")
        
        # ASSERT
        assert len(results) == 1
        assert "machine learning" in results[0]["title"].lower()
        # ⏱️ 8ms

# Total unit tests: ~50ms ⚡⚡⚡
```

---

## 6. integration/ - Múltiplos Componentes

### Exemplo: test_workflows.py

```python
@pytest.mark.integration
class TestMagazineSyncWorkflow:
    
    def test_full_sync_workflow(self, test_client, db_session, mock_elasticsearch):
        """✅ PASSOU: Workflow completo de sincronização"""
        
        # ARRANGE: Criar dados
        magazine_data = {
            "name": "RBIE",
            "url": "http://journals-sol.sbc.org.br/oai",
            "description": "Brazilian Journal of Computers in Education"
        }
        
        # ACT 1: Criar magazine via API
        response = test_client.post(
            "/api/v1/magazines",
            json=magazine_data
        )
        assert response.status_code == 201
        magazine = response.json()
        magazine_id = magazine["id"]
        
        # ACT 2: Sincronizar
        response = test_client.post(
            "/api/v1/admin/sync",
            json={"magazine_id": magazine_id}
        )
        assert response.status_code == 202
        
        # ASSERT 1: Verificar BD
        from app.models import Article
        articles_in_db = db_session.query(Article).filter_by(
            magazine_id=magazine_id
        ).all()
        assert len(articles_in_db) > 0, "Nenhum artigo no BD!"
        
        # ASSERT 2: Verificar Elasticsearch
        es_indexed = mock_elasticsearch.index.call_count
        assert es_indexed > 0, "Nada indexado no ES!"
        
        # ⏱️ 250ms (mais lento, mas testa integração real)
```

---

## 7. e2e/ - Cenários Reais

### Exemplo: test_user_scenarios.py

```python
@pytest.mark.e2e
@pytest.mark.slow
class TestUserScenarios:
    
    def test_user_searches_articles_workflow(self, test_client):
        """Simula: Usuário real buscando artigos"""
        
        # Step 1: Usuário acessa a documentação
        response = test_client.get("/api/v1/docs")
        assert response.status_code == 200
        assert "swagger" in response.text.lower()
        print("✅ Documentação acessível")
        
        # Step 2: Usuário lista as revistas
        response = test_client.get("/api/v1/magazines")
        assert response.status_code == 200
        magazines = response.json()["magazines"]
        assert len(magazines) > 0
        print(f"✅ {len(magazines)} revistas disponíveis")
        
        # Step 3: Usuário busca por artigos sobre "machine learning"
        response = test_client.get(
            "/api/v1/articles?q=machine%20learning&limit=10"
        )
        assert response.status_code == 200
        articles = response.json()["articles"]
        print(f"✅ Encontrou {len(articles)} artigos")
        
        # Step 4: Usuário verifica os campos do artigo
        if articles:
            article = articles[0]
            required_fields = ["id", "title", "abstract", "authors", "publication_date"]
            for field in required_fields:
                assert field in article, f"Campo {field} faltando!"
            print(f"✅ Artigo tem todos os campos: {list(article.keys())}")
        
        # ⏱️ 500ms (lento, mas realistic!)
```

---

## 8. Marcadores (@pytest.mark)

### Como Usar Marcadores

```python
# Arquivo: tests/unit/test_elasticsearch_client.py

import pytest
from app.core.elasticsearch_client import ElasticsearchClient

@pytest.mark.unit  # ← Marca como unit
@pytest.mark.elasticsearch  # ← Marca como ES
class TestElasticsearchClient:
    
    @pytest.mark.unit
    def test_init(self, es_client):
        """Teste rápido"""
        assert es_client.index_name == 'articles'
    
    @pytest.mark.unit
    @pytest.mark.slow  # Este é lento!
    def test_bulk_index_large_dataset(self, es_client):
        """Este teste é lento (~2s)"""
        articles = [...]  # 10000 articles
        es_client.bulk_index_articles(articles)
```

### Rodando com Marcadores

```bash
# Rodar TODOS os testes
pytest

# Rodar APENAS unit tests
pytest -m unit

# Rodar APENAS Elasticsearch tests
pytest -m elasticsearch

# Rodar TUDO MENOS lentos (padrão do pytest.ini)
pytest -m "not slow"

# Combinações
pytest -m "unit and elasticsearch"
pytest -m "integration or e2e"
```

---

## 9. Fixtures com Escopo

### Diferença entre Escopos

```python
# Scope: function (padrão)
# Criado: PARA CADA TESTE
# Limpeza: APÓS CADA TESTE
@pytest.fixture
def db_session(test_db_engine):
    session = SessionLocal()
    yield session
    session.rollback()  # Limpo!

# Resultado:
def test_1(db_session):
    # db_session novo (vazio)

def test_2(db_session):
    # db_session novo (vazio) - dados do test_1 foram limpos!

def test_3(db_session):
    # db_session novo (vazio)
```

```python
# Scope: session
# Criado: UMA VEZ por sessão de testes
# Limpeza: Ao final
@pytest.fixture(scope="session")
def test_db_engine():
    engine = create_engine(...)
    Base.metadata.create_all(engine)
    return engine  # REUTILIZADO por todos os testes!

# Resultado:
def test_1():
    # test_db_engine já criado

def test_2():
    # MESMO engine (reutilizado!)

def test_3():
    # MESMO engine (reutilizado!)

# ⚡ MAIS RÁPIDO: engine criado 1x, não 100x
```

---

## 10. Mock vs Real

### Exemplo: Elasticsearch

```python
# ❌ ERRADO: Tenta conectar ES REAL
def test_search_real():
    es = Elasticsearch(hosts=["http://localhost:9200"])
    result = es.search(index="articles", query={...})
    # Problema: Precisa de ES rodando! 😫

# ✅ CORRETO: Usa mock
def test_search_mock(mock_elasticsearch):
    mock_elasticsearch.search.return_value = {
        "hits": {"hits": [{"_source": {"title": "Test"}}]}
    }
    
    result = mock_elasticsearch.search(...)
    assert len(result) == 1
    # Nenhuma dependência! ⚡
```

---

## 11. Parametrized Tests

### Teste Múltiplos Inputs Automaticamente

```python
import pytest

@pytest.mark.parametrize("input,expected", [
    ("test", True),      # Roda 1x
    ("", False),         # Roda 2x
    ("123", True),       # Roda 3x
    ("TEST", True),      # Roda 4x
])
def test_validate_input(input, expected):
    result = validate(input)
    assert result == expected

# Resultado:
# test_validate_input[test-True] PASSED      ✅
# test_validate_input[-False] PASSED         ✅
# test_validate_input[123-True] PASSED       ✅
# test_validate_input[TEST-True] PASSED      ✅
# 4 testes com 1 função! 🎉
```

---

## 12. Getting Coverage

### Gerar Relatório

```bash
cd backend/tests

# Gerar cobertura
pytest --cov=app --cov-report=html

# Resultado:
# coverage/htmlcov/index.html ← Abrir no browser!

# Output no terminal:
# app/core/elasticsearch_client.py    100%    ✅
# app/core/config.py                  100%    ✅
# app/api/articles.py                  85%    ⚠️
# app/tasks/sync_tasks.py              70%    ⚠️
# ─────────────────────────────────────
# TOTAL                                62%    ⚠️ (target: 70%)
```

### Interpretar HTML Report

```html
<!-- coverage/htmlcov/index.html -->

🟢 Verde   = Linha foi testada (✅ coberta)
🔴 Vermelho = Ninguém testou (❌ não coberta)
🟡 Amarelo  = Parte testada (⚠️ parcial)

Exemplo:
┌────────────────────────────┐
│ def sync_magazine():       │ 🟢 Testado
│     if error:              │ 🟡 Só sucesso, erro não testado
│         log_error()        │ 🔴 Nunca foi testado
│     return result          │ 🟢 Testado
└────────────────────────────┘

Cobertura desta função: 75% (3 de 4 linhas)
```

---

## 13. Debug com pdb

### Parar em Erro

```bash
# Rodar com --pdb (para em erro)
pytest unit/test_elasticsearch_client.py::TestElasticsearchClient::test_init --pdb

# Abre pdb:
(Pdb) p es_client          # Print variável
(Pdb) p es_client.es       # Print atributo
(Pdb) c                    # Continue
(Pdb) n                    # Next line
(Pdb) s                    # Step into function
(Pdb) h                    # Help
```

---

## 14. Quick vs All

### Scripts Predefinidos

```bash
# Windows
.\scripts\run_tests.ps1 -Mode quick      # ~5s (unit/ só)
.\scripts\run_tests.ps1 -Mode all        # ~30s (tudo)
.\scripts\run_tests.ps1 -Mode coverage   # ~35s (com HTML)

# Mac/Linux
./scripts/run_tests.sh --mode quick
./scripts/run_tests.sh --mode all
./scripts/run_tests.sh --mode coverage
```

---

**Próximo:** Leia [OQUE_CADA_ARQUIVO_FAZ.md](OQUE_CADA_ARQUIVO_FAZ.md) para detalhes de cada arquivo!
