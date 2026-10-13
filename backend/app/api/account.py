from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import Alert, Article, SavedArticle, SearchHistory, User, get_db
from app.schemas.account import (
    AlertCreate,
    AlertResponse,
    HistoryCreate,
    HistoryResponse,
    SavedArticleResponse,
    TopSearch,
)

router = APIRouter(prefix="/me", tags=["account"])

MAX_HISTORY = 500
# Mesma busca repetida em poucos segundos (duplo clique, recarga) conta uma vez so
DEDUP_WINDOW = timedelta(seconds=60)


# ---------- Historico de buscas ----------


@router.get("/history", response_model=List[HistoryResponse])
def list_history(
    days: Optional[int] = Query(default=None, ge=1, le=3650),
    q: Optional[str] = Query(default=None, max_length=200),
    limit: int = Query(default=200, ge=1, le=MAX_HISTORY),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(SearchHistory).filter(SearchHistory.user_id == user.id)
    if days:
        query = query.filter(SearchHistory.created_at >= datetime.utcnow() - timedelta(days=days))
    if q:
        query = query.filter(func.lower(SearchHistory.query).contains(q.strip().lower()))
    return query.order_by(SearchHistory.created_at.desc(), SearchHistory.id.desc()).limit(limit).all()


@router.post("/history", response_model=Optional[HistoryResponse], status_code=status.HTTP_201_CREATED)
def add_history(
    data: HistoryCreate,
    response: Response,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not user.save_history:
        # Historico desligado: aceita o pedido mas nao guarda nada
        response.status_code = status.HTTP_202_ACCEPTED
        return None

    text = data.query.strip()
    last = (
        db.query(SearchHistory)
        .filter(SearchHistory.user_id == user.id)
        .order_by(SearchHistory.created_at.desc(), SearchHistory.id.desc())
        .first()
    )
    if last and last.query == text and datetime.utcnow() - last.created_at < DEDUP_WINDOW:
        last.result_count = data.result_count if data.result_count is not None else last.result_count
        db.commit()
        db.refresh(last)
        return last

    entry = SearchHistory(
        user_id=user.id, query=text, kind=data.kind, area=data.area, result_count=data.result_count
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    # Mantem so as buscas mais recentes
    old_ids = (
        db.query(SearchHistory.id)
        .filter(SearchHistory.user_id == user.id)
        .order_by(SearchHistory.created_at.desc(), SearchHistory.id.desc())
        .offset(MAX_HISTORY)
        .all()
    )
    if old_ids:
        db.query(SearchHistory).filter(SearchHistory.id.in_([i for (i,) in old_ids])).delete(synchronize_session=False)
        db.commit()
    return entry


@router.get("/history/top", response_model=List[TopSearch])
def top_searches(
    limit: int = Query(default=4, ge=1, le=20),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    key = func.lower(SearchHistory.query)
    rows = (
        db.query(func.min(SearchHistory.query), func.count(SearchHistory.id).label("n"))
        .filter(SearchHistory.user_id == user.id)
        .group_by(key)
        .order_by(func.count(SearchHistory.id).desc(), func.max(SearchHistory.created_at).desc())
        .limit(limit)
        .all()
    )
    return [TopSearch(query=query, count=count) for query, count in rows]


@router.delete("/history/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_history_entry(entry_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    deleted = (
        db.query(SearchHistory)
        .filter(SearchHistory.id == entry_id, SearchHistory.user_id == user.id)
        .delete(synchronize_session=False)
    )
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Busca não encontrada")
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/history", status_code=status.HTTP_204_NO_CONTENT)
def clear_history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(SearchHistory).filter(SearchHistory.user_id == user.id).delete(synchronize_session=False)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Artigos salvos ----------


@router.get("/saved", response_model=List[SavedArticleResponse])
def list_saved(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(SavedArticle, Article)
        .join(Article, Article.id == SavedArticle.article_id)
        .filter(SavedArticle.user_id == user.id)
        .order_by(SavedArticle.created_at.desc(), SavedArticle.id.desc())
        .all()
    )
    return [SavedArticleResponse(saved_at=saved.created_at, article=article) for saved, article in rows]


@router.get("/saved/ids", response_model=List[int])
def saved_ids(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return [i for (i,) in db.query(SavedArticle.article_id).filter(SavedArticle.user_id == user.id).all()]


@router.put("/saved/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
def save_article(article_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not db.query(Article.id).filter(Article.id == article_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artigo não encontrado")
    exists = (
        db.query(SavedArticle.id)
        .filter(SavedArticle.user_id == user.id, SavedArticle.article_id == article_id)
        .first()
    )
    if not exists:
        db.add(SavedArticle(user_id=user.id, article_id=article_id))
        db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/saved/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsave_article(article_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(SavedArticle).filter(
        SavedArticle.user_id == user.id, SavedArticle.article_id == article_id
    ).delete(synchronize_session=False)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Alertas ----------


@router.get("/alerts", response_model=List[AlertResponse])
def list_alerts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Alert).filter(Alert.user_id == user.id).order_by(Alert.created_at.desc(), Alert.id.desc()).all()


@router.post("/alerts", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
def create_alert(data: AlertCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    text = data.query.strip()
    existing = (
        db.query(Alert).filter(Alert.user_id == user.id, func.lower(Alert.query) == text.lower()).first()
    )
    if existing:
        return existing
    alert = Alert(user_id=user.id, query=text)
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.delete("/alerts/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert(alert_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    deleted = (
        db.query(Alert).filter(Alert.id == alert_id, Alert.user_id == user.id).delete(synchronize_session=False)
    )
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alerta não encontrado")
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
