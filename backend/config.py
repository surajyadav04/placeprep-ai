import os
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(BASE_DIR, "placeprep.db").replace("\\", "/")

class Settings(BaseSettings):
    gemini_api_key: str | None = None
    openrouter_api_key: str | None = None
    resend_api_key: str | None = None
    resend_from_email: str | None = "noreply@placeprep.ai"
    
    database_url: str = f"sqlite+aiosqlite:///{db_path}"
    secret_key: str = "super_secret_key_change_in_production"
    
    mentor_access_code: str = "PLACEMENT2026"
    registration_disabled: bool = True

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
