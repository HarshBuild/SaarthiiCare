import json
import os
from pathlib import Path
from typing import Annotated, List, Optional, Union

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


def default_env_file_path() -> Path:
    """Return the backend-root .env path (backend/.env).

    ``app/core/config.py`` -> parents[0]=core, [1]=app, [2]=backend.
    """
    return Path(__file__).resolve().parents[2] / ".env"


def _strip_quotes(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
        return value[1:-1]
    return value


def read_env_file(env_path: Optional[Union[str, Path]] = None) -> None:
    """Load a simple KEY=VALUE .env file into os.environ.

    Real environment variables always win over file values, so deploying with
    injected secrets is never overridden by a stale local file.
    """
    path = Path(env_path) if env_path is not None else default_env_file_path()
    if not path.is_file():
        return

    with path.open("r", encoding="utf-8-sig") as handle:
        for raw_line in handle:
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            if line.startswith("export "):
                line = line[len("export "):].lstrip()
            key, value = line.split("=", 1)
            key = key.strip()
            if not key:
                continue
            os.environ.setdefault(key, _strip_quotes(value))


read_env_file()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=True, extra="ignore")

    PROJECT_NAME: str = "SAARTHII"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    APP_ENV: str = "development"
    # NoDecode disables pydantic-settings' JSON-only parsing so both
    # comma-separated and JSON array values are accepted.
    CORS_ORIGINS: Annotated[List[str], NoDecode] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    SECRET_KEY: str = "super-secret-key-saarthii-hackathon-2026"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        if isinstance(value, str):
            text = value.strip()
            if not text:
                return []
            if text.startswith("["):
                try:
                    parsed = json.loads(text)
                except json.JSONDecodeError as exc:
                    raise ValueError("CORS_ORIGINS must be valid JSON or CSV") from exc
                if not isinstance(parsed, list):
                    raise ValueError("CORS_ORIGINS JSON value must be a list")
                return [str(item).strip() for item in parsed if str(item).strip()]
            return [item.strip() for item in text.split(",") if item.strip()]
        return value

    # Supabase configuration. These values are server-only. The service-role
    # key and database URL must never be exposed through VITE_* variables.
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_PUBLISHABLE_KEY: str = ""
    SUPABASE_DB_URL: str = ""
    SUPABASE_JWKS_URL: str = ""
    SUPABASE_JWT_AUD: str = "authenticated"
    SUPABASE_STORAGE_BUCKET: str = "referral-documents"
    SUPABASE_REQUEST_TIMEOUT_SECONDS: float = 5.0
    # When true, the API verifies Supabase JWTs and reads profiles from the
    # database. When false, the legacy in-memory mock users are used instead,
    # which keeps the app running before Supabase is reachable.
    SUPABASE_AUTH_ENABLED: bool = True


settings = Settings()
