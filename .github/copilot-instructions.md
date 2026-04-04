# Base Brasileira em Ciência da Computação

## Project Overview

Sistema centralizado de artigos científicos brasileiros com:
- **Backend**: FastAPI + PostgreSQL + Redis + Elasticsearch + Celery
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Extrator**: OAI-PMH com sincronização automática 24h
- **Search**: Elasticsearch indexing para busca full-text

## Quick Commands

```bash
# Backend
cd backend && pip install -r requirements.txt
python -c "from app.core.init_db import init_db; init_db()"

# Frontend
cd frontend && npm install && npm run dev

# Docker 
docker-compose up -d
```

## Key Features

Busca avançada de artigos com Elasticsearch
Sincronização automática via OAI-PMH (24h)
Filtro por revista, autor, ano
API RESTful com Swagger/ReDoc
UI responsiva com React

## Architecture

```
backend/app/
├── api/         → Endpoints REST (magazines, articles, admin)
├── core/        → Database, ES client, init
├── extractors/  → OAI-PMH protocol handler
├── models/      → SQLAlchemy models
├── schemas/     → Pydantic validators
├── tasks/       → Celery async tasks

frontend/src/
├── components/  → React componentes
├── pages/       → Views principais
├── main.tsx     → Entry point
```

## Development Checklist

- [x] Backend FastAPI completo
- [x] OAI-PMH extrator funcional
- [x] PostgreSQL + Redis + Elasticsearch
- [x] Celery Beat automation
- [x] Docker Compose orchestration
- [x] Frontend React + TypeScript
- [x] CI/CD workflows

## Testing

```bash
# Backend tests
cd backend && pytest tests/ -v --cov=app

# Frontend build
cd frontend && npm run build
```

## API Endpoints

- `GET /api/v1/magazines` - List magazines
- `GET /api/v1/articles` - List articles with search
- `GET /api/v1/articles?q=query` - Search
- `POST /api/v1/admin/sync` - Manual sync trigger
- `GET /api/v1/admin/logs` - Sync history

## Deployment

Docker Compose handles all 6 containers automatically.
Access: http://localhost:8000 (API) | http://localhost:3000 (Frontend)
