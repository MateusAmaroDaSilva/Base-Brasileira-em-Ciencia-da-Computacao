from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db, SyncLog
from app.schemas.schemas import SyncLogResponse
from app.tasks.sync_tasks import sync_magazine, sync_all_magazines
from typing import List

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/logs", response_model=List[SyncLogResponse])
def get_sync_logs(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    logs = db.query(SyncLog)\
        .order_by(desc(SyncLog.started_at))\
        .limit(limit)\
        .all()
    
    return logs


@router.post("/sync")
def manual_sync(magazine_id: int = None):
    if magazine_id:
        sync_magazine.delay(magazine_id)
        return {"status": "OK", "message": f"Sincronização da revista {magazine_id} enfileirada"}
    else:
        sync_all_magazines.delay()
        return {"status": "OK", "message": "Sincronização de todas as revistas enfileirada"}


@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Base Brasileira em Ciência da Computação"
    }
