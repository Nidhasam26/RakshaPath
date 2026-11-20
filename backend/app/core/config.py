import json
import os
import sys
from pathlib import Path
from typing import Any, List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from dotenv import load_dotenv

# Resolve paths to automatically search for .env files in /backend and the repo root
BASE_DIR = Path(__file__).resolve().parent.parent.parent  # /backend directory
ROOT_DIR = BASE_DIR.parent                               # / (repo root)

_env_candidates = [
    BASE_DIR / ".env",
    ROOT_DIR / ".env",
    Path(".env"),
]

for _env_file in _env_candidates:
    if _env_file.is_file():
        load_dotenv(dotenv_path=_env_file, override=False)


DEFAULT_CORS_ORIGINS: List[str] = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://10.0.2.2:8000",
]


def parse_cors_origins_value(v: Any) -> List[str]:
    """Parse CORS origins from comma-separated string, JSON list, empty string, or list."""
    if v is None:
        return list(DEFAULT_CORS_ORIGINS)
    if isinstance(v, list):
        cleaned = [str(item).strip() for item in v if str(item).strip()]
        return cleaned if cleaned else list(DEFAULT_CORS_ORIGINS)
    if isinstance(v, str):
        v = v.strip()
        if not v:
            return list(DEFAULT_CORS_ORIGINS)
        # Check for JSON list format: ["http://localhost:5173"]
        if v.startswith("[") and v.endswith("]"):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    cleaned = [str(item).strip() for item in parsed if str(item).strip()]
                    return cleaned if cleaned else list(DEFAULT_CORS_ORIGINS)
            except Exception:
                pass
        # Comma-separated format: http://localhost:5173,http://localhost:3000
        cleaned = [item.strip() for item in v.split(",") if item.strip()]
        return cleaned if cleaned else list(DEFAULT_CORS_ORIGINS)
    return list(DEFAULT_CORS_ORIGINS)


def normalize_database_url(url: str) -> str:
    """Normalize database URLs from cloud providers (Neon, Supabase, etc.) to use the psycopg driver."""
    if not url:
        return ""
    cleaned = url.strip()
    if cleaned.startswith("postgres://"):
        cleaned = "postgresql+psycopg://" + cleaned[len("postgres://"):]
    elif cleaned.startswith("postgresql://") and not cleaned.startswith("postgresql+"):
        cleaned = "postgresql+psycopg://" + cleaned[len("postgresql://"):]
    elif cleaned.startswith("postgresql+psycopg2://"):
        cleaned = "postgresql+psycopg://" + cleaned[len("postgresql+psycopg2://"):]
    return cleaned


def mask_database_url(url: str) -> str:
    """Mask the password in a database URL for safe logging/printing."""
    if not url:
        return ""
    try:
        from urllib.parse import urlparse, urlunparse
        parsed = urlparse(url)
        if parsed.password:
            netloc = f"{parsed.username}:*****@{parsed.hostname}"
            if parsed.port:
                netloc += f":{parsed.port}"
            return urlunparse(parsed._replace(netloc=netloc))
        return url
    except Exception:
        return "<configured-database-url>"


class Settings(BaseSettings):
    APP_NAME: str = "RakshaPath"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    SECRET_KEY: str = "rakshapath-default-insecure-secret-key-change-in-prod"
    JWT_SECRET: str = "rakshapath-secret-jwt-key-minimum-32-chars-long!"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # CORS_ORIGINS accepts: comma-separated string, JSON list, empty value, or missing (uses defaults).
    # The field_validator below handles all formats before pydantic type-checks the value.
    CORS_ORIGINS: Union[str, List[str]] = DEFAULT_CORS_ORIGINS

    # Database: must be provided via DATABASE_URL in .env. No default host 'db'.
    DATABASE_URL: str = ""

    # Redis: optional for caching and live pubsub. In-memory fallback if omitted.
    REDIS_URL: str = ""

    # External APIs & Connectors (all optional; report 'not configured' if omitted)
    TOMTOM_API_KEY: str = ""
    OPENROUTESERVICE_API_KEY: str = ""
    OPEN_METEO_API_URL: str = "https://api.open-meteo.com/v1/forecast"
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""

    # Ingestion & Matching Config
    DEFAULT_INGESTION_BBOX: str = "77.50,12.85,77.75,13.05"
    HAZARD_DEDUPLICATION_DISTANCE_METERS: int = 50

    # Demo & Thresholds
    DEMO_MODE: bool = True
    ROUTE_HAZARD_BUFFER_METERS: int = 200
    PUSH_ALERT_RADIUS_METERS: int = 5000
    SOS_CANCEL_WINDOW_SECONDS: int = 5
    MISSED_UPDATE_THRESHOLD_SECONDS: int = 180

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def validate_cors_origins(cls, v: Any) -> List[str]:
        return parse_cors_origins_value(v)

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def format_database_url(cls, v: Union[str, None]) -> str:
        if not v:
            return ""
        return normalize_database_url(v)

    model_config = SettingsConfigDict(
        env_file=[str(candidate) for candidate in _env_candidates],
        env_file_encoding="utf-8",
        extra="ignore",
    )


def load_settings() -> Settings:
    """Instantiate application settings with human-friendly error reporting."""
    try:
        return Settings()
    except Exception as exc:
        err_str = str(exc)
        print("\n" + "=" * 75, file=sys.stderr)
        print("SETTINGS CONFIGURATION ERROR", file=sys.stderr)
        print("-" * 75, file=sys.stderr)
        if "CORS_ORIGINS" in err_str:
            print("Invalid setting: CORS_ORIGINS in backend/.env", file=sys.stderr)
            print("Accepted formats:", file=sys.stderr)
            print("  1. Comma-separated: CORS_ORIGINS=http://localhost:5173,http://localhost:3000", file=sys.stderr)
            print('  2. JSON array:      CORS_ORIGINS=["http://localhost:5173"]', file=sys.stderr)
            print("  3. Empty/omitted:   uses safe defaults (http://localhost:5173, http://localhost:3000, http://10.0.2.2:8000)", file=sys.stderr)
        elif "DATABASE_URL" in err_str:
            print("Invalid setting: DATABASE_URL in backend/.env", file=sys.stderr)
            print("Accepted format:   DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require", file=sys.stderr)
        else:
            print(f"Error detail: {err_str}", file=sys.stderr)
            print("Please check your backend/.env file format.", file=sys.stderr)
        print("=" * 75 + "\n", file=sys.stderr)
        sys.exit(1)


settings = load_settings()
