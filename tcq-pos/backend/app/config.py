"""
TCQ POS — Application Configuration
Loads settings from environment variables with sensible defaults.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://tcq_user:tcq_password@localhost:5432/tcq_pos"
    DATABASE_URL_SYNC: str = "postgresql://tcq_user:tcq_password@localhost:5432/tcq_pos"
    USE_SQLITE: bool = False

    # JWT Auth
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours (one shift)

    # Mercado Pago
    MP_ACCESS_TOKEN: str = ""
    MP_WEBHOOK_SECRET: str = ""

    # App Settings
    APP_NAME: str = "TCQ POS"
    BONUS_AMOUNT: float = 1000.00
    DEBUG: bool = True

    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "ignore",
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()
