# Base Brasileira em Ciência da Computação

Repositório de artigos científicos brasileiros com busca avançada e filtros inteligentes. Agrega conteúdo de múltiplas revistas em um único acervo, sincronizado automaticamente. Interface intuitiva facilita consultas para pesquisadores, estudantes e professores. Democratiza o acesso ao conhecimento científico de forma organizada e eficiente.

## 🎯 Features

- ✅ **Busca Avançada**: Pesquise artigos por título, autor, keywords
- ✅ **Filtros Inteligentes**: Filtre por revista, ano, período
- ✅ **Sincronização Automática**: Coleta artigos via OAI-PMH a cada 24h
- ✅ **Indexação Elasticsearch**: Busca rápida em milhares de artigos
- ✅ **Interface Intuitiva**: Frontend React responsivo e moderno
- ✅ **API RESTful**: Documentação automática com Swagger/ReDoc

## 🚀 Tech Stack

### Backend
- **FastAPI** 3.11+ - Framework web moderno e rápido
- **PostgreSQL 15** - Banco de dados relacional
- **Elasticsearch 8.11** - Engine de busca
- **Redis 7** - Cache e task queue
- **Celery** - Task scheduler para sincronização

### Frontend
- **React 18** - Interface de usuário
- **TypeScript** - Type safety
- **Tailwind CSS** - Estilos modernos
- **Vite** - Build tool rápido

### DevOps
- **Docker & Docker Compose** - Containerização
- **GitHub Actions** - CI/CD pipeline
- **Docker Container Registry** - Armazenamento de imagens

## 📦 Revistas Suportadas

1. **RBIE** - ~330 artigos
2. **Reviews** - ~6 artigos
3. **ISYS** - ~380 artigos
4. **RITA** - ~427 artigos
5. **Ciência & Inovação** - ~116 artigos

**Total**: ~1,259 artigos iniciais

## 🛠️ Setup Rápido

### Pré-requisitos
- Docker & Docker Compose
- Git

### Instalação

```bash
# Clone o repositório
git clone https://github.com/MateusAmaroDaSilva/Base-Brasileira-em-Ciencia-da-Computacao.git
cd Base-Brasileira-em-Ciencia-da-Computacao

# Inicie com Docker Compose
docker-compose up -d

# Inicialize o banco de dados
docker-compose exec backend python -c "from app.core.init_db import init_db; init_db()"

# Acesse a aplicação
# Frontend: http://localhost:5173
# API: http://localhost:8000
# Documentação: http://localhost:8000/docs
```

## 📖 API Endpoints

- `GET/POST /api/v1/magazines` - Gerenciar revistas
- `GET/POST /api/v1/articles` - Buscar e gerenciar artigos
- `GET /api/v1/admin/logs` - Ver histórico de sincronizações
- `POST /api/v1/admin/sync` - Disparar sincronização manual

## 🧪 Testes

```bash
# Rodar testes do backend
cd backend/tests
pytest -v

# Com cobertura
pytest --cov=app --cov-report=html
```

## 📊 CI/CD

Este projeto usa GitHub Actions para:
- ✅ Executar testes automaticamente
- ✅ Build de imagens Docker
- ✅ Deploy para GitHub Container Registry

Acesse: `https://github.com/MateusAmaroDaSilva/Base-Brasileira-em-Ciencia-da-Computacao/actions`

## 📄 Licença

Este projeto está licenciado sob a [MIT License](LICENSE)

## 👨‍💼 Autor

[Mateus Amaro](https://github.com/MateusAmaroDaSilva) - Iniciação Científica 2026
