import time
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import Article, Magazine, SearchHistory, get_db
from app.core.people import fold, institution_keys, person_key

router = APIRouter(tags=["insights"])

# Temas mostrados enquanto ainda nao ha buscas suficientes de usuarios diferentes
DEFAULT_TRENDING = [
    "aprendizado de máquina",
    "engenharia de requisitos",
    "redes 5G",
    "ensino de programação",
]
# Uma busca so vira "mais buscada" quando pelo menos este numero de usuarios diferentes a fez:
# assim a pesquisa de uma unica pessoa nunca aparece para os demais.
MIN_USERS = 2


class SiteStats(BaseModel):
    articles: int
    magazines: int
    authors: int
    # None enquanto nenhuma revista informa afiliacao
    institutions: Optional[int] = None
    last_sync: Optional[datetime] = None


class TrendingSearch(BaseModel):
    query: str
    # None nos temas de exemplo; numero de usuarios diferentes nas buscas reais
    users: Optional[int] = None


_STATS_TTL = 600
_stats_cache: Dict[str, object] = {"at": 0.0, "value": None}


def compute_stats(db: Session) -> SiteStats:
    people = set()
    affiliations = []
    for authors, details in db.query(Article.authors, Article.author_details).all():
        if details:
            for person in details:
                people.add(person_key(person.get("name", ""), person.get("orcid")))
                if person.get("affiliation"):
                    affiliations.append(person["affiliation"])
        else:
            for name in authors or []:
                people.add(person_key(name))
    people.discard("name:")

    institutions = institution_keys(affiliations)
    last_sync = db.query(func.max(Magazine.last_sync)).scalar()
    return SiteStats(
        articles=db.query(func.count(Article.id)).scalar() or 0,
        magazines=db.query(func.count(Magazine.id)).filter(Magazine.is_active.is_(True)).scalar() or 0,
        authors=len(people),
        institutions=len(institutions) or None,
        last_sync=last_sync,
    )


@router.get("/stats", response_model=SiteStats)
def site_stats(db: Session = Depends(get_db)):
    """Numeros da base. Contar autores exige varrer os artigos, entao o resultado fica em cache por 10 minutos."""
    now = time.monotonic()
    if _stats_cache["value"] is None or now - float(_stats_cache["at"]) > _STATS_TTL:
        _stats_cache["value"] = compute_stats(db)
        _stats_cache["at"] = now
    return _stats_cache["value"]


def compute_trending(db: Session, limit: int, days: int, min_users: int = MIN_USERS) -> List[TrendingSearch]:
    since = datetime.utcnow() - timedelta(days=days)
    rows = (
        db.query(SearchHistory.user_id, SearchHistory.query)
        .filter(SearchHistory.created_at >= since, SearchHistory.kind == "publicacoes")
        .distinct()
        .limit(50000)
        .all()
    )
    users_by_term: Dict[str, set] = defaultdict(set)
    spellings: Dict[str, Counter] = defaultdict(Counter)
    for user_id, query in rows:
        key = fold(query)
        if len(key) < 3:
            continue
        users_by_term[key].add(user_id)
        spellings[key][query.strip().lower()] += 1

    ranked = sorted(
        ((len(users), key) for key, users in users_by_term.items() if len(users) >= min_users),
        key=lambda item: (-item[0], item[1]),
    )
    result = [TrendingSearch(query=spellings[key].most_common(1)[0][0], users=count) for count, key in ranked[:limit]]

    # Completa com os temas de exemplo ate chegar em `limit`
    taken = {fold(r.query) for r in result}
    for theme in DEFAULT_TRENDING:
        if len(result) >= limit:
            break
        if fold(theme) not in taken:
            result.append(TrendingSearch(query=theme))
    return result


@router.get("/searches/trending", response_model=List[TrendingSearch])
def trending_searches(
    limit: int = Query(default=4, ge=1, le=12),
    days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    return compute_trending(db, limit, days)
