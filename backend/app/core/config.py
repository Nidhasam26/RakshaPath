from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "RakshaPath"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    SECRET_KEY: str = "rakshapath-default-insecure-secret-key-change-in-prod"

    # PostgreSQL / PostGIS
    DATABASE_URL: str = "postgresql://rakshapath:rakshapath_secret_pw@localhost:5432/rakshapath_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # External APIs & Connectors
    TOMTOM_API_KEY: str = ""
    OPENROUTESERVICE_API_KEY: str = ""
    OPEN_METEO_API_URL: str = "https://api.open-meteo.com/v1/forecast"

    # Ingestion & Matching Config
    DEFAULT_INGESTION_BBOX: str = "77.50,12.85,77.75,13.05"
    HAZARD_DEDUPLICATION_DISTANCE_METERS: int = 50

    # Demo & Thresholds
    DEMO_MODE: bool = True
    ROUTE_HAZARD_BUFFER_METERS: int = 200
    PUSH_ALERT_RADIUS_METERS: int = 5000
    SOS_CANCEL_WINDOW_SECONDS: int = 5
    MISSED_UPDATE_THRESHOLD_SECONDS: int = 180

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

