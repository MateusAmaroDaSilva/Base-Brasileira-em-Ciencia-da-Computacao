# CI/CD Pipeline - Base Brasileira em Ciência da Computação

## 📋 Visão Geral

Este projeto implementa um CI/CD pipeline completo usando GitHub Actions com:
- ✅ Testes automatizados (pytest)
- ✅ Cobertura de código (codecov)
- ✅ Linting e formatação (flake8, black, isort)
- ✅ Type checking (mypy)
- ✅ Segurança (bandit, dependency-check, trivy)
- ✅ Build e push de Docker
- ✅ Validação OAI-PMH

## 🔄 Workflows

### 1. **tests.yml** - Testes & Coverage (Executa em: push, PR)

**Triggers**: `push` para main/develop, `pull_request` para main/develop

**Jobs**:
- **test**: Roda em Ubuntu Latest
  - Setup Python 3.11 com cache pip
  - Inicia serviços (PostgreSQL, Redis, Elasticsearch)
  - Lint com flake8
  - Testes unitários com pytest + coverage
  - Testes de integração
  - Validação OAI-PMH (rápida)
  - Upload coverage para Codecov
  - Arquivo artifacts (htmlcov/)

- **security**: Análise de segurança
  - Bandit scanner
  - Verificação de vulnerabilidades do Dockerfile

**Artifacts**:
- `coverage-report/`: Relatório HTML de cobertura (30 dias retenção)

**Outputs**:
- Resumo no GitHub Actions
- Badge codecov no README

---

### 2. **build.yml** - Build & Push Docker (Executa em: push main, tags, manual)

**Triggers**: 
- `push` para main
- Tags `v*`
- `workflow_dispatch` (manual)

**Jobs**:
- **build**: Roda em Ubuntu Latest
  - Setup Docker Buildx
  - Login no GitHub Container Registry (ghcr.io)
  - Build Multi-stage
  - Push para GHCR
  - Scan com Trivy (vulnerabilidades)
  - Upload SARIF para Code Scanning

**Outputs**:
- Imagen Docker em: `ghcr.io/username/repo:latest`

---

### 3. **quality.yml** - Code Quality (Executa em: push, PR)

**Triggers**: `push` para main/develop, `pull_request` para main/develop

**Checks**:
- **Format**: Black (Python formatter)
- **Imports**: isort (import organizer)
- **Lint**: flake8 (code style)
- **Types**: mypy (type hints)
- **Security**: 
  - Bandit (security vulnerabilities)
  - OWASP Dependency-Check (dependências)

**Modo**: `continue-on-error: true` - Não bloqueia PR

---

## 💾 Configuração Necessária

### Secrets do GitHub

Nenhum secret obrigatório por enquanto (usa GITHUB_TOKEN padrão).

**Opcional**: Para notificações:
- `SLACK_WEBHOOK_URL` - Webhook do Slack
- `CODECOV_TOKEN` - Token do codecov.io

### Branch Protection

Recomendado habilitar em `main`:
```
✅ Require status checks to pass before merging:
  - tests / test
  - quality / quality
  - build / build
```

---

## 📊 Métricas & Badges

### Badges para README

```markdown
![Tests](https://github.com/username/repo/workflows/Tests%20&%20Coverage/badge.svg)
![Code Quality](https://github.com/username/repo/workflows/Code%20Quality/badge.svg)
![Build](https://github.com/username/repo/workflows/Build%20&%20Push%20Docker/badge.svg)
[![codecov](https://codecov.io/gh/username/repo/branch/main/graph/badge.svg)](https://codecov.io/gh/username/repo)
```

---

## 🚀 Fluxo de Trabalho

### Desenvolvimento

```
1. Developer cria branch de feature/bugfix
2. Faz commit para feature branch
3. Abre Pull Request para main/develop
   ↓
4. GitHub Actions automaticamente:
   - Roda testes
   - Lint & format
   - Análise de segurança
   - Gera relatório de cobertura
5. Reviewer vê resultados nos checks do PR
6. Se tudo passou, faz merge (ou usa auto-merge)
```

### Deploy

```
1. Merge para main
2. Git tag (v1.0.0)
   ↓
3. GitHub Actions automaticamente:
   - Testa código
   - Build Docker
   - Push para GHCR
   - Scan vulnerabilidades
4. Imagem Docker pronta para deploy
```

---

## 📈 Cobertura de Código

### Meta: 80%+

**Atual** (14/05/2026):
- Elasticsearch client: 69%
- Database models: 92%
- Sync tasks: 74%
- **Total**: 58% → Target: 80%

**Ação**: 
- Adicionar testes em `app/api/`
- Testes de integração completos
- E2E scenarios

---

## 🔧 Troubleshooting

### "Tests failed but I need to merge"
1. Fixar o código localmente
2. Verificar testes localmente: `pytest tests/unit/ -v`
3. Push novamente - CI/CD roda automaticamente
4. Quando passar, fazer merge

### "Codecov token not found"
- Optional: Adicionar `CODECOV_TOKEN` em Settings → Secrets
- Sem token: Codecov ainda funciona mas com limite de uploads

### "Docker build slow"
- Cache de layers está ativo (`cache-from: type=gha`)
- Primeira build é lenta, subsequentes são rápidas
- Otimizar Dockerfile se necessário

---

## 📝 Próximas Melhorias

- [ ] Adicionar testes de performance
- [ ] Deploy automático para staging/prod
- [ ] Notificações Slack/Email de falhas
- [ ] GitHub Pages com relatório de cobertura
- [ ] SonarQube para análise estática
- [ ] Testes E2E com Playwright/Cypress
- [ ] Dependency updates automáticas (Dependabot)

---

## 🎯 Status dos Workflows

| Workflow | Status | Teste? | Build? | Security? |
|----------|--------|--------|--------|-----------|
| tests.yml | ✅ Ativo | Sim | Não | Sim |
| build.yml | ✅ Ativo | Não | Sim | Sim |
| quality.yml | ✅ Ativo | Não | Não | Sim |

---

**Última atualização**: 14 de Maio de 2026
**Versão CI/CD**: v1.0.0
**Status**: Production Ready ✅
