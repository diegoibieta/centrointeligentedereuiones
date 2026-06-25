from celery import Celery
from ..core.config import get_settings
settings = get_settings()
celery_app = Celery(
    "reuniones",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks.process_meeting"],
)
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="America/Mexico_City",
    enable_utc=True,
)
