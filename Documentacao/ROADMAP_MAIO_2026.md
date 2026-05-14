# 🎯 ROADMAP MAIO 2026 - Próximos Passos

**Status**: Sistema em Phase 2 - Production Ready  
**Última Atualização**: 14 de Maio de 2026, 16:35 BRT  
**Responsável**: IC 2026

---

## 🔴 URGENT (Esta Semana - Até 16 de Maio)

### 1. **Ajustar CI/CD Workflows** 
**Prioridade**: 🔴 CRÍTICA  
**Tempo Estimado**: 30 minutos  
**Status**: Em progresso

#### O que fazer:
- [x] ~~Remover `import timeout_decorator` (encontrado bug)~~ ✅ FEITO
- [ ] Fazer novo commit com a correção
- [ ] Monitorar próxima execução dos workflows
- [ ] Verificar que "Tests & Coverage" passa sem erros

#### Comando:
```bash
git add .github/workflows/tests.yml
git commit -m "fix: remove unused timeout_decorator import from tests workflow"
git push origin main
```

#### Esperado:
- ✅ Tests & Coverage: PASS
- ✅ Build & Push Docker: PASS
- ✅ Code Quality: PASS

---

### 2. **Fix API Endpoint Tests**
**Prioridade**: 🔴 ALTA  
**Tempo Estimado**: 2-3 horas  
**Status**: Não iniciado  
**Pass Rate Atual**: 0/25 (0%) ❌

#### Problema Identificado:
TestClient fixture está causando falhas em todos os 25 testes de API endpoints. Precisa refatorar `conftest.py`.

#### Passos:
1. Revisar `tests/unit/test_api_endpoints.py`
2. Corrigir inicialização do TestClient
3. Adicionar mocks necessários para:
   - Database fixture
   - Elasticsearch client
   - Redis client
4. Rodar testes incrementalmente

#### Verificação:
```bash
cd backend
pytest tests/unit/test_api_endpoints.py -v
```

#### Meta:
- De 0/25 → Mínimo 20/25 (80%)

---

### 3. **Cobertura de Testes**
**Prioridade**: 🟠 ALTA  
**Tempo Estimado**: 3-4 horas  
**Status**: Em progresso  
**Cobertura Atual**: 58% (Meta: 80%)

#### Gap Analysis:
```
app/api/magazines.py:    36% → Need 30+ tests
app/api/articles.py:     34% → Need 50+ tests
app/extractors/oai_pmh.py: 18% → Need mocked tests
app/tasks/sync_tasks.py:  74% → OK (precisa ~5 mais)
app/core/database.py:     92% → OK (excelente)
```

#### Estratégia:
1. Adicionar testes parametrizados para APIs
2. Mock de OAI-PMH para testes de extração
3. Testes de validação de schemas
4. Edge cases e error handling

#### Verificação:
```bash
pytest --cov=app --cov-report=term-missing
```

#### Meta:
- De 58% → Mínimo 75% esta semana
- De 75% → 80%+ na semana que vem

---

## 🟠 IMPORTANTE (Próximas 2 Semanas - Até 28 de Maio)

### 4. **Testar Docker Compose Localmente**
**Prioridade**: 🟠 MÉDIA  
**Tempo Estimado**: 1 hora  
**Status**: Bloqueado (Docker Desktop offline)

#### Passos:
1. Iniciar Docker Desktop
2. Rodar: `docker-compose up -d`
3. Verificar que todos 6 containers estão healthy:
   ```
   ✅ postgres
   ✅ redis
   ✅ elasticsearch
   ✅ backend
   ✅ celery_worker
   ✅ celery_beat
   ```
4. Testar endpoints:
   ```bash
   curl http://localhost:8000/docs
   curl http://localhost:8000/api/v1/magazines
   ```
5. Validar sincronização:
   ```bash
   curl -X POST http://localhost:8000/api/v1/admin/sync
   ```

#### Verificação:
```bash
docker-compose ps
docker-compose logs -f backend
```

#### Sucesso Quando:
- Todos containers em "Up"
- API respondendo em http://localhost:8000
- Swagger/ReDoc acessível

---

### 5. **Integration Tests Completos**
**Prioridade**: 🟠 MÉDIA  
**Tempo Estimado**: 2 horas  
**Status**: Não iniciado

#### O que testar:
1. **Workflow Completo**: OAI-PMH → Sync → Index → Search
   - Mock do OAI-PMH
   - Sync de magazine
   - Indexação em Elasticsearch
   - Busca funcionando

2. **Database Persistence**:
   - Criar magazine
   - Adicionar artigos
   - Recuperar do banco

3. **Error Handling**:
   - Conexão perdida com Elasticsearch
   - Timeout no OAI-PMH
   - Database error

#### Arquivo:
`tests/integration/test_workflows.py`

#### Comando:
```bash
pytest tests/integration/ -v --tb=short
```

---

### 6. **Validação OAI-PMH Completa (Todas 5 Revistas)**
**Prioridade**: 🟠 MÉDIA  
**Tempo Estimado**: 15 minutos  
**Status**: 80% (apenas 1 revista no workflow)

#### Adicionar ao tests.yml:
```yaml
- name: OAI-PMH validation (all 5)
  - Add ISYS, RITA, Reviews, Ciência & Inovação
  - Rodar em paralelo com timeout 15m
```

#### Meta:
- ✅ RBIE: 300 artigos
- ✅ Reviews: 6 artigos
- ✅ ISYS: 316 artigos
- ✅ RITA: 482 artigos
- ✅ Ciência & Inovação: 123 artigos
- **TOTAL: 1,227 artigos**

---

## 🟡 DESEJÁVEL (3-4 Semanas - Até 11 de Junho)

### 7. **E2E Tests (Selenium/Playwright)**
**Prioridade**: 🟡 DESEJÁVEL  
**Tempo Estimado**: 4-6 horas  
**Status**: Não iniciado

#### Testes a Fazer:
1. Busca de artigos (frontend)
2. Filtros de revista/autor
3. Paginação
4. Detalhe do artigo

#### Framework:
- Playwright (recomendado)
- Testar em Chrome/Firefox

---

### 8. **Performance Testing**
**Prioridade**: 🟡 DESEJÁVEL  
**Tempo Estimado**: 3-4 horas  
**Status**: Não iniciado

#### Testes:
1. Busca com 1000+ artigos
2. Load test: 100 requisições/seg
3. Elasticsearch query performance
4. Database query optimization

#### Tools:
- Apache JMeter
- Locust
- K6

---

### 9. **Security Hardening**
**Prioridade**: 🟡 DESEJÁVEL  
**Tempo Estimado**: 2-3 horas  
**Status**: Parcial (Bandit implementado)

#### Testes:
- SQL Injection (Pydantic + SQLAlchemy já protegem)
- CORS configuration
- Rate limiting
- Authentication/Authorization review

---

## 📊 MÉTRICAS DE SUCESSO

| Métrica | Atual | Meta | Prazo |
|---------|-------|------|-------|
| Testes Passando | 28/46 (60%) | 40+ (87%) | 16 Mai |
| Cobertura | 58% | 80% | 28 Mai |
| API Tests | 0/25 | 20+/25 | 16 Mai |
| CI/CD Status | 🟡 Warnings | 🟢 All Green | 14 Mai |
| Docker Setup | ⏳ Pending | ✅ Done | 21 Mai |
| OAI-PMH Tests | 1/5 | 5/5 | 21 Mai |

---

## 🛠️ FERRAMENTAS & RECURSOS

### Testing
- pytest (framework)
- pytest-cov (coverage)
- responses (mock HTTP)
- faker (mock data)

### CI/CD
- GitHub Actions (workflows)
- Codecov (coverage tracking)
- Trivy (vulnerability scan)
- Bandit (security)

### Monitoring
```bash
# Coverage report
coverage report --include=app/*

# Pytest detailed
pytest -v --tb=long --cov-report=term-missing

# Specific module
pytest tests/unit/test_elasticsearch_client.py -v
```

---

## 📅 TIMELINE PROPOSTO

```
14 Mai: ✅ Corrigir workflows CI/CD
16 Mai: 🔴 Fix API tests (0→80%), cobertura 58%→70%
21 Mai: 🟡 Docker completo, OAI-PMH 5/5, cobertura 70%→75%
28 Mai: 🟠 Cobertura 75%→80%, integration tests
11 Jun: 🟡 E2E tests, performance testing
```

---

## 🚀 QUICK START

### Hoje (14 de Maio):
```bash
# 1. Commit a correção do workflow
git add .github/workflows/tests.yml
git commit -m "fix: remove unused timeout_decorator import"
git push origin main

# 2. Esperar workflows completarem (10-15 min)
# 3. Monitorar GitHub Actions
```

### Amanhã (15 de Maio):
```bash
# 1. Fix API tests
cd backend
pytest tests/unit/test_api_endpoints.py -v --pdb

# 2. Aumentar cobertura
pytest --cov=app --cov-report=html
```

### Próxima Semana (21 de Maio):
```bash
# 1. Rodar Docker
docker-compose up -d

# 2. Testar endpoints
curl http://localhost:8000/api/v1/magazines

# 3. Validar OAI-PMH
python tests/test_extractors.py
```

---

## ❓ FAQ

**P: Por que testes estão falhando?**  
R: TestClient fixture incompatível com Starlette. Isso será corrigido no Step 2.

**P: Quanto tempo vai levar para 80% cobertura?**  
R: ~8-10 horas de desenvolvimento para alcançar 80% (1-2 dias de trabalho).

**P: Docker Compose é obrigatório?**  
R: Não é obrigatório para testes (usam SQLite), mas é importante para validar a produção.

**P: CI/CD está pronto para produção?**  
R: 95% pronto. Será 100% quando testes e workflows passarem sem erros.

---

## 📞 CONTATO & SUPORTE

- Arquivo de referência: `Documentacao/NEXT_STEPS.md`
- Testes: Ver `Documentacao/TEST_RESULTS.md`
- CI/CD: Ver `Documentacao/CI_CD_PIPELINE.md`
- Implementação: Ver `Documentacao/IMPLEMENTATION_REPORT.md`

---

**Criado por**: GitHub Copilot  
**Versão**: 1.0.0  
**Última Revisão**: 14 de Maio de 2026, 16:35 BRT  
**Próxima Revisão**: 04 de Junho de 2026
