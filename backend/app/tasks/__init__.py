# Importar o app aqui o registra como app Celery atual em qualquer processo que use as tasks
# (API inclusive). Sem isso, o .delay() da API usaria o app padrao, com broker amqp://localhost.
from app.tasks.celery_app import celery_app

__all__ = ["celery_app"]
