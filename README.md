# Base Brasileira em Ciência da Computação

**Iniciação Científica - 2026**

## Índice

1. [Visão Geral](#visão-geral)
2. [Sobre o Projeto](#sobre-o-projeto)
3. [Equipe](#equipe)
4. [Tecnologias Utilizadas](#tecnologias-utilizadas)
5. [Arquitetura do Sistema](#arquitetura-do-sistema)
6. [Estrutura de Arquivos](#estrutura-de-arquivos)
7. [Como Funciona](#como-funciona)
8. [Pré-requisitos](#pré-requisitos)
9. [Instalação e Setup](#instalação-e-setup)
10. [Uso](#uso)
11. [API Endpoints](#api-endpoints)
12. [Testes](#testes)
13. [CI/CD Pipeline](#cicd-pipeline)
14. [Licença](#licença)

---

## Visão Geral

A **Base Brasileira em Ciência da Computação** é um repositório digital centralizado que agrega artigos científicos brasileiros de múltiplas revistas acadêmicas. O sistema oferece buscas avançadas, filtros inteligentes e sincronização automática de conteúdo, democratizando o acesso ao conhecimento científico nacional de forma organizada, eficiente e acessível.

O projeto implementa uma arquitetura moderna de microserviços com backend em FastAPI, frontend em React, integração com protocolo OAI-PMH para coleta automatizada de artigos, e indexação via Elasticsearch para buscas performáticas em tempo real.

---

## Sobre o Projeto

### Motivação

A fragmentação de repositórios acadêmicos brasileiros dificulta o acesso centralizado a pesquisas científicas de qualidade. Este projeto propõe uma solução integrada que:

- Centraliza artigos de revistas científicas com credibilidade acadêmica
- Oferece buscas semânticas e filtros avançados para pesquisadores
- Automiza a coleta de novos artigos via protocolo OAI-PMH
- Mantém dados sempre atualizados através de sincronização programada
- Fornece uma interface intuitiva para consultas rápidas e eficientes

### Características Principais

- **Busca Avançada**: Pesquise artigos por título, autor, palavras-chave e conteúdo
- **Filtros Inteligentes**: Filtre por revista, ano de publicação, período específico
- **Sincronização Automática**: Coleta automática de artigos via protocolo OAI-PMH a cada 24 horas
- **Indexação Full-Text**: Mecanismo de busca rápido em milhares de artigos utilizando Elasticsearch
- **Interface Responsive**: Frontend moderno e responsivo desenvolvido com React e TypeScript
- **API RESTful Completa**: Endpoints com documentação automática via Swagger/ReDoc
- **Escalabilidade**: Arquitetura preparada para crescimento em volume de dados e requisições
- **CI/CD Automatizado**: Pipeline contínuo de testes, build e deploy

---

## Equipe

| Papel | Nome |
|-------|------|
| Desenvolvedor Principal | Mateus Amaro da Silva |
| Desenvolvedor | Marcos |
| Orientador | Rafael Castanha |

---

## Tecnologias Utilizadas

### Backend

- **FastAPI 3.11+**: Framework web moderno e de alta performance para construção de APIs RESTful
- **PostgreSQL 15**: Sistema gerenciador de banco de dados relacional robusto e confiável
- **Elasticsearch 8.11**: Engine de busca e análise full-text para consultas performáticas
- **Redis 7**: Cache em memória e message broker para fila de tarefas
- **Celery**: Processador de tarefas assincronizado para automação de coleta de artigos
- **Celery Beat**: Scheduler para execução programada de sincronizações
- **Python 3.11+**: Linguagem de programação principal

### Frontend

- **React 18**: Biblioteca JavaScript para construção de interfaces de usuário
- **TypeScript**: Superset tipado de JavaScript para maior segurança e manutenibilidade
- **Tailwind CSS**: Framework utilitário para estilização responsiva
- **Vite**: Ferramenta de build moderna e rápida
- **Node.js 18+**: Runtime JavaScript

### Infraestrutura e DevOps

- **Docker**: Containerização de serviços
- **Docker Compose**: Orquestração de containers locais
- **GitHub Actions**: Pipeline de integração e entrega contínua (CI/CD)
- **GitHub Container Registry**: Repositório de imagens Docker

### Protocolos e Padrões

- **OAI-PMH**: Protocolo aberto para coleta de metadados de repositórios acadêmicos
- **Dublin Core**: Padrão de metadados para recursos digitais
- **REST**: Arquitetura para design de APIs escaláveis
- **Conventional Commits**: Padrão para mensagens de commit descritivas

---

## Arquitetura do Sistema

### Diagrama Geral

```
┌─────────────────────────────────────────────────────────────┐
│                     Cliente / Navegador                      │
└────────────────────────┬──────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
    ┌─────▼────┐    ┌───▼────┐   ┌────▼────┐
    │ Frontend  │    │  API   │   │   Docs  │
    │  (React)  │    │ (Port  │   │(Swagger)│
    │ Port 5173 │    │ 8000)  │   │         │
    └─────┬────┘    └───┬────┘   └────┬────┘
          │              │             │
          └──────────────┼─────────────┘
                         │
          ┌──────────────▼──────────────┐
          │     Backend (FastAPI)       │
          │      Aplicação Python       │
          └──────────────┬──────────────┘
          │              │              │
    ┌─────▼────┐   ┌────▼────┐  ┌─────▼────┐
    │PostgreSQL│   │Elasticsearch  │ Redis   │
    │   Base   │   │    Busca      │ Cache & │
    │  Dados   │   │  Full-Text    │  Tasks  │
    └──────────┘   └───────────┘  └─────────┘
          │              │              │
          └──────────────┼──────────────┘
                         │
          ┌──────────────▼──────────────┐
          │  Celery + Beat Scheduler    │
          │   (Sincronização Automática)│
          └──────────────┬──────────────┘
                         │
          ┌──────────────▼──────────────┐
          │     OAI-PMH Extractor       │
          │  (Coleta de Revistas)       │
          └─────────────────────────────┘
```

### Fluxo de Sincronização

1. **Agendamento**: Celery Beat dispara sincronização a cada 24 horas
2. **Extração**: OAI-PMH Extractor conecta às revistas via protocolo padrão
3. **Parse**: Metadados (Dublin Core) são extraídos e normalizados
4. **Persistência**: Dados salvos em PostgreSQL
5. **Indexação**: Elasticsearch indexa conteúdo para busca rápida
6. **Cache**: Redis armazena queries recentes para performance

---

## Estrutura de Arquivos

```
Base-Brasileira-em-Ciencia-da-Computacao/
│
├── backend/                           # Aplicação Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   # Ponto de entrada FastAPI
│   │   │
│   │   ├── api/                      # Endpoints da API
│   │   │   ├── __init__.py
│   │   │   ├── magazines.py          # CRUD de revistas
│   │   │   ├── articles.py           # CRUD e busca de artigos
│   │   │   └── admin.py              # Endpoints administrativos
│   │   │
│   │   ├── core/                     # Configurações centrais
│   │   │   ├── __init__.py
│   │   │   ├── config.py             # Variáveis de ambiente
│   │   │   ├── database.py           # Conexão com PostgreSQL
│   │   │   ├── elasticsearch_client.py  # Cliente Elasticsearch
│   │   │   └── init_db.py            # Inicialização do banco
│   │   │
│   │   ├── models/                   # Modelos de banco de dados
│   │   │   └── __init__.py
│   │   │
│   │   ├── schemas/                  # Schemas Pydantic
│   │   │   ├── __init__.py
│   │   │   └── schemas.py            # DTOs para requisições/respostas
│   │   │
│   │   ├── extractors/               # Extratores de dados
│   │   │   ├── __init__.py
│   │   │   └── oai_pmh.py            # Implementação OAI-PMH
│   │   │
│   │   └── tasks/                    # Tarefas assincronizadas
│   │       ├── __init__.py
│   │       ├── celery_app.py         # Configuração Celery
│   │       └── sync_tasks.py         # Tarefas de sincronização
│   │
│   ├── tests/                        # Suite de testes
│   │   ├── conftest.py               # Fixtures pytest
│   │   ├── pytest.ini                # Configuração pytest
│   │   ├── requirements-dev.txt      # Dependências dev
│   │   ├── test_extractors.py        # Testes do extrator
│   │   │
│   │   ├── unit/                     # Testes unitários
│   │   │   ├── test_api_endpoints.py
│   │   │   ├── test_elasticsearch_client.py
│   │   │   └── test_sync_tasks.py
│   │   │
│   │   ├── integration/              # Testes de integração
│   │   │   └── test_workflows.py
│   │   │
│   │   └── e2e/                      # Testes end-to-end
│   │       └── test_user_scenarios.py
│   │
│   ├── Dockerfile                    # Imagem Docker Backend
│   └── requirements.txt              # Dependências Python
│
├── frontend/                         # Aplicação Frontend
│   ├── src/
│   │   ├── main.tsx                 # Ponto de entrada React
│   │   ├── App.tsx                  # Componente raiz
│   │   ├── index.css                # Estilos globais
│   │   │
│   │   ├── components/              # Componentes reutilizáveis
│   │   │   ├── SearchBar.tsx        # Barra de pesquisa
│   │   │   ├── Filters.tsx          # Painel de filtros
│   │   │   ├── MagazineSelector.tsx # Seletor de revistas
│   │   │   └── ArticleList.tsx      # Lista de artigos
│   │   │
│   │   └── pages/                   # Páginas da aplicação
│   │       ├── SearchPage.tsx       # Página de busca principal
│   │       └── ArticleDetail.tsx    # Detalhes de artigo
│   │
│   ├── index.html                   # HTML template
│   ├── package.json                 # Dependências Node.js
│   ├── tsconfig.json                # Configuração TypeScript
│   ├── vite.config.ts               # Configuração Vite
│   └── tailwind.config.js           # Configuração Tailwind CSS
│
├── Documentacao/                    # Documentação do projeto
│   ├── INDEX.md                     # Índice de docs
│   ├── COMO_FUNCIONAM.md            # Explicação de fluxos
│   ├── ESTRUTURA_BACKEND.md         # Detalhes arquitetura backend
│   ├── OQUE_CADA_ARQUIVO_FAZ.md     # Descrição de cada arquivo
│   ├── EXEMPLOS_PRATICOS.md         # Exemplos de uso
│   ├── DIAGRAMAS.md                 # Diagramas visuais
│   └── README_COMPLETO_BACKEND.md   # Documentação detalhada
│
├── .github/
│   └── workflows/                   # GitHub Actions workflows
│       ├── ci-cd.yml                # Pipeline principal CI/CD
│       ├── ci-backend.yml           # Testes backend específicos
│       ├── ci-frontend.yml          # Build frontend
│       ├── backend-tests.yml        # Testes unitários
│       ├── docker-build.yml         # Build de imagens Docker
│       ├── frontend-ci.yml          # CI Frontend
│       └── security.yml             # Verificações de segurança
│
├── scripts/                         # Scripts auxiliares
│   ├── run_tests.sh                 # Linux/Mac
│   └── run_tests.ps1                # Windows PowerShell
│
├── docker-compose.yml               # Orquestração containers
├── docker-compose-template.yml      # Template para referência
├── .env.example                     # Exemplo de variáveis env
├── .gitignore                       # Padrões git ignore
├── LICENSE                          # Licença MIT
└── README.md                        # Este arquivo

```

---

## Como Funciona

### 1. Coleta de Artigos (OAI-PMH)

O sistema utiliza o protocolo OAI-PMH (Open Archives Initiative - Protocol for Metadata Harvesting) para coletar artigos automaticamente das revistas suportadas:

```
Revistas Suportadas:
- RBIE (Revista Brasileira de Informática na Educação)
- Reviews (Revisão Sistemática)
- ISYS (Revista de Informática Teórica e Aplicada)
- RITA (Revista de Tecnologia da Informação e da Aventura)
- Ciência & Inovação (Revista Interdisciplinar)
```

### 2. Processamento e Normalização

Os metadados coletados em formato Dublin Core são:
- Validados e normalizados
- Persistidos no PostgreSQL
- Indexados no Elasticsearch
- Cacheados em Redis

### 3. Sincronização Agendada

Usando Celery Beat, o sistema sincroniza revistas automaticamente:
- Verificação inicial: 24 horas após inicialização
- Frequência: A cada 24 horas
- Pode ser disparada manualmente via API

### 4. Busca Full-Text

Quando um usuário realiza busca:
1. Consulta é processada pelo Elasticsearch
2. Resultados são classificados por relevância
3. Paginação eficiente de grandes conjuntos de dados
4. Filtros aplicados (revista, ano, etc.)

### 5. Apresentação no Frontend

Interface React carrega resultados:
- Renderização eficiente com TypeScript
- Filtros interativos
- Detalhes completos de cada artigo
- Navegação responsiva

---

## Pré-requisitos

- Docker 20.10+
- Docker Compose 1.29+
- Git 2.30+
- Node.js 18+ (para desenvolvimento local frontend)
- Python 3.11+ (para desenvolvimento local backend)

---

## Instalação e Setup

### Passo 1: Clonar Repositório

```bash
git clone https://github.com/MateusAmaroDaSilva/Base-Brasileira-em-Ciencia-da-Computacao.git
cd Base-Brasileira-em-Ciencia-da-Computacao
```

### Passo 2: Configurar Variáveis de Ambiente

```bash
# Copiar arquivo example
cp .env.example .env

# Editar .env com suas configurações (se necessário)
```

### Passo 3: Iniciar Containers

```bash
# Iniciar todos os serviços em background
docker-compose up -d

# Visualizar logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

### Passo 4: Inicializar Banco de Dados

```bash
# Executar migrations e seed
docker-compose exec backend python -c "from app.core.init_db import init_db; init_db()"
```

### Passo 5: Acessar Aplicação

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Documentação Swagger: http://localhost:8000/docs
- Documentação ReDoc: http://localhost:8000/redoc
- PostgreSQL: localhost:5432
- Elasticsearch: http://localhost:9200
- Redis: localhost:6379

---

## Uso

### Buscar Artigos

```bash
# Via Frontend
# Acesse http://localhost:5173 e utilize a barra de pesquisa

# Via API
curl -X GET "http://localhost:8000/api/v1/articles?search=computacao&limit=10"
```

### Filtrar por Revista

```bash
curl -X GET "http://localhost:8000/api/v1/articles?magazine=RBIE&limit=20"
```

### Sincronização Manual

```bash
curl -X POST "http://localhost:8000/api/v1/admin/sync"
```

### Visualizar Logs de Sincronização

```bash
curl -X GET "http://localhost:8000/api/v1/admin/logs"
```

---

## API Endpoints

### Revistas (Magazines)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/magazines` | Listar todas as revistas |
| POST | `/api/v1/magazines` | Criar nova revista |
| GET | `/api/v1/magazines/{id}` | Detalhes de um revista |
| PUT | `/api/v1/magazines/{id}` | Atualizar revista |
| DELETE | `/api/v1/magazines/{id}` | Deletar revista |

### Artigos (Articles)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/articles` | Listar artigos com filtros |
| POST | `/api/v1/articles` | Criar novo artigo |
| GET | `/api/v1/articles/{id}` | Detalhes de artigo |
| PUT | `/api/v1/articles/{id}` | Atualizar artigo |
| DELETE | `/api/v1/articles/{id}` | Deletar artigo |
| GET | `/api/v1/articles/search` | Busca avançada com full-text |

### Administração (Admin)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/v1/admin/sync` | Disparar sincronização manual |
| GET | `/api/v1/admin/logs` | Visualizar logs de sincronização |
| GET | `/api/v1/admin/status` | Status do sistema |

### Documentação Interativa

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI: `http://localhost:8000/openapi.json`

---

## Testes

### Executar Todos os Testes

```bash
cd backend/tests
pytest -v
```

### Testes com Cobertura

```bash
cd backend/tests
pytest --cov=app --cov-report=html
# Abrir: htmlcov/index.html
```

### Testes por Categoria

```bash
# Apenas testes unitários
pytest unit/ -v

# Apenas testes de integração
pytest integration/ -v

# Apenas testes end-to-end
pytest e2e/ -v

# Um arquivo específico
pytest test_extractors.py -v
```

### Testes do Extrator OAI-PMH

```bash
pytest test_extractors.py -v
```

---

## CI/CD Pipeline

### GitHub Actions Workflows

O projeto inclui automação completa com GitHub Actions:

#### 1. CI/CD Principal (ci-cd.yml)
- Executa testes unitários, integração e E2E
- Build automático de imagem Docker
- Push para GitHub Container Registry
- Executado em todo push para main

#### 2. Testes Backend (backend-tests.yml)
- Suite completa de testes Python
- Análise de cobertura
- Integração com PostgreSQL, Redis, Elasticsearch

#### 3. Build Frontend (ci-frontend.yml)
- Build otimizado com Vite
- Verificação de tipagem TypeScript
- Validação de linting

#### 4. Segurança (security.yml)
- Verificação de vulnerabilidades
- Análise de dependências

### Acompanhamento

Acesse: https://github.com/MateusAmaroDaSilva/Base-Brasileira-em-Ciencia-da-Computacao/actions

Status dos workflows aparece em tempo real após cada push.

---

## Licença

Este projeto está licenciado sob a MIT License. Consulte [LICENSE](LICENSE) para detalhes completos.

---

## Informações Adicionais

Para documentação mais detalhada, consulte a pasta [Documentacao/](Documentacao/):
- [Índice Completo](Documentacao/INDEX.md)
- [Como Funciona Detalhado](Documentacao/COMO_FUNCIONAM.md)
- [Estrutura Backend](Documentacao/ESTRUTURA_BACKEND.md)
- [Exemplos Práticos](Documentacao/EXEMPLOS_PRATICOS.md)
- [Diagramas](Documentacao/DIAGRAMAS.md)
- [Arquivos e Responsabilidades](Documentacao/OQUE_CADA_ARQUIVO_FAZ.md)
