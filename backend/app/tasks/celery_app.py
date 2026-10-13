from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

celery_app = Celery("base_computacao", broker=settings.CELERY_BROKER_URL, backend=settings.CELERY_RESULT_BACKEND)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Sao_Paulo",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,
    include=["app.tasks.sync_tasks"],
    # Sincronizacao periodica de todas as revistas ativas (horario de America/Sao_Paulo)
    beat_schedule={
        "sync-all-magazines": {
            "task": "app.tasks.sync_tasks.sync_all_magazines",
            "schedule": crontab(hour=settings.SYNC_SCHEDULE_HOUR, minute=settings.SYNC_SCHEDULE_MINUTE),
        },
    },
)
