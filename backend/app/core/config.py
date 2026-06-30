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
    # Google Calendar integration (optional)
    google_service_account_file: str = ""
    google_service_account_json: str = ""
    google_token_file: str = "token.json"
    google_credentials_file: str = "credentials.json"
    google_calendar_id: str = "primary"
    class Config:
        env_file = ".env"
@lru_cache
def get_settings() -> Settings:
    return Settings()
