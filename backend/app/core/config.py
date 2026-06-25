from pydantic_settings import BaseSettings
from functools import lru_cache
class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://admin:secret@localhost:5432/reuniones"
    sync_database_url: str = "postgresql://admin:secret@localhost:5432/reuniones"
    redis_url: str = "redis://localhost:6379/0"
    anthropic_api_key: str = ""
    upload_dir: str = "/data/uploads"
    whisper_model: str = "base"
    max_upload_mb: int = 500
    class Config:
        env_file = ".env"
@lru_cache
def get_settings() -> Settings:
    return Settings()
