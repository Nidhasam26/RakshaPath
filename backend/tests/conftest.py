import pytest
from sqlalchemy import text
from app.db.session import SessionLocal, engine


def check_db():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            return True
    except Exception:
        return False


DB_AVAILABLE = check_db()


@pytest.fixture(scope="module")
def db():
    if not DB_AVAILABLE:
        pytest.skip("PostgreSQL/PostGIS database is not reachable.")
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
