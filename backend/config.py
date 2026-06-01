import os
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(BASE_DIR, "placeprep.db").replace("\\", "/")

class Settings(BaseSettings):
    gemini_api_key: str | None = None
    openrouter_api_key: str | None = None
    
    # Bulletproof dynamic absolute path (3 slashes for Windows SQLAlchemy)
    database_url: str = f"sqlite+aiosqlite:///{db_path}"
    
    secret_key: str = "super_secret_key_change_in_production"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
