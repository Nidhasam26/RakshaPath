import pytest
from app.core.config import Settings, DEFAULT_CORS_ORIGINS


def test_cors_origins_comma_separated_string():
    """Format 1: comma-separated string (e.g. from .env file)."""
    settings = Settings(CORS_ORIGINS="http://localhost:5173,http://localhost:3000")
    assert settings.CORS_ORIGINS == ["http://localhost:5173", "http://localhost:3000"]


def test_cors_origins_json_list_string():
    """Format 2: JSON array string (e.g. from JSON-formatted .env)."""
    settings = Settings(CORS_ORIGINS='["http://localhost:5173"]')
    assert settings.CORS_ORIGINS == ["http://localhost:5173"]


def test_cors_origins_empty_string():
    """Format 3: empty string in .env (CORS_ORIGINS=) falls back to safe defaults."""
    settings = Settings(CORS_ORIGINS="")
    assert settings.CORS_ORIGINS == DEFAULT_CORS_ORIGINS
    assert "http://localhost:5173" in settings.CORS_ORIGINS
    assert "http://localhost:3000" in settings.CORS_ORIGINS
    assert "http://10.0.2.2:8000" in settings.CORS_ORIGINS


def test_cors_origins_missing():
    """Format 4: missing / omitted from .env uses safe defaults."""
    settings = Settings(CORS_ORIGINS=None)
    assert settings.CORS_ORIGINS == DEFAULT_CORS_ORIGINS
    assert "http://localhost:5173" in settings.CORS_ORIGINS
    assert "http://localhost:3000" in settings.CORS_ORIGINS
    assert "http://10.0.2.2:8000" in settings.CORS_ORIGINS

