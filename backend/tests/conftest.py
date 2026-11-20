import os
os.environ["TESTING"] = "1"

import pytest
from sqlalchemy import text
from app.core.config import settings
from app.db.session import SessionLocal, engine


def check_db():
    if not settings.DATABASE_URL:
        return False
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            return True
    except Exception:
        return False


DB_AVAILABLE = check_db()


@pytest.fixture(scope="module")
def db():
    if not settings.DATABASE_URL:
        pytest.skip("DATABASE_URL is not set. Skipping tests requiring a live database.")
    if not DB_AVAILABLE:
        pytest.skip("Configured PostgreSQL/PostGIS database is currently unreachable.")
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
