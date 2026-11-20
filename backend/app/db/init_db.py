import os
import sys
import logging
from sqlalchemy import text
from alembic.config import Config
from alembic import command

from app.db.session import engine
from app.core.config import settings, mask_database_url

logger = logging.getLogger(__name__)


def init_db() -> None:
    """Validate database connectivity, enable PostGIS extension, and run Alembic migrations."""
    # When executing unit tests, skip connecting to live PostgreSQL database
    if os.getenv("TESTING", "").lower() in ("1", "true", "yes"):
        logger.info("TESTING mode enabled; skipping automatic database startup initialization.")
        return

    # 1. Ensure DATABASE_URL is configured
    if not settings.DATABASE_URL or settings.DATABASE_URL.strip() == "":
        print("\n" + "=" * 75, file=sys.stderr)
        print("DATABASE_URL IS NOT CONFIGURED!", file=sys.stderr)
        print("-" * 75, file=sys.stderr)
        print("RakshaPath requires a PostgreSQL database with PostGIS enabled.", file=sys.stderr)
        print("Docker is not required: you can use a free cloud database (Neon, Supabase, etc.).\n", file=sys.stderr)
        print("To configure your database:", file=sys.stderr)
        print("  1. Create a free PostgreSQL database at https://neon.tech or https://supabase.com", file=sys.stderr)
        print("  2. Open or create backend/.env", file=sys.stderr)
        print("  3. Set your connection string:", file=sys.stderr)
        print("     DATABASE_URL=postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require", file=sys.stderr)
        print("=" * 75 + "\n", file=sys.stderr)
        sys.exit(1)

    logger.info("Connecting to database...")
    # 2. Check connection & enable PostGIS
    try:
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
            conn.commit()
            logger.info("Database connection and PostGIS extension verified.")
    except Exception as exc:
        err_str = str(exc)
        print("\n" + "=" * 75, file=sys.stderr)
        print("DATABASE CONNECTION FAILED", file=sys.stderr)
        print("-" * 75, file=sys.stderr)
        print(f"Connection URL: {mask_database_url(settings.DATABASE_URL)}", file=sys.stderr)
        
        if "failed to resolve host" in err_str or "could not translate host name" in err_str:
            if "'db'" in err_str or "@db:" in settings.DATABASE_URL or "@db/" in settings.DATABASE_URL:
                print("\nWhat failed: Could not resolve hostname 'db'.", file=sys.stderr)
                print("Likely fix:  The hostname 'db' only exists inside a Docker container network.", file=sys.stderr)
                print("             Since Docker is not running, put your cloud database URL in backend/.env:", file=sys.stderr)
                print("             DATABASE_URL=postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require", file=sys.stderr)
            elif "ep-xyz" in settings.DATABASE_URL:
                print("\nWhat failed: 'ep-xyz.neon.tech' is an example placeholder URL.", file=sys.stderr)
                print("Likely fix:  Replace the placeholder in backend/.env with your actual Neon/Supabase DATABASE_URL.", file=sys.stderr)
            else:
                print("\nWhat failed: Could not resolve database hostname.", file=sys.stderr)
                print("Likely fix:  Check your internet connection or verify the database hostname spelling in backend/.env.", file=sys.stderr)
        elif "password authentication failed" in err_str:
            print("\nWhat failed: Database authentication failed.", file=sys.stderr)
            print("Likely fix:  Check the username and password in your DATABASE_URL inside backend/.env.", file=sys.stderr)
        elif "Connection refused" in err_str or "connection to server at" in err_str:
            print("\nWhat failed: Database connection was refused or timed out.", file=sys.stderr)
            print("Likely fix:  Ensure your database server is running, or verify your cloud PostgreSQL endpoint.", file=sys.stderr)
        else:
            print(f"\nWhat failed: {err_str}", file=sys.stderr)
            print("Likely fix:  Check your DATABASE_URL in backend/.env.", file=sys.stderr)

        print("=" * 75 + "\n", file=sys.stderr)
        sys.exit(1)

    # 3. Run Alembic migrations automatically
    try:
        logger.info("Running automatic Alembic migrations to head...")
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        ini_path = os.path.join(backend_dir, "alembic.ini")
        alembic_cfg = Config(ini_path)
        alembic_cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
        command.upgrade(alembic_cfg, "head")
        logger.info("Database migrations completed successfully.")
    except Exception as exc:
        print("\n" + "=" * 75, file=sys.stderr)
        print("DATABASE MIGRATION FAILED", file=sys.stderr)
        print(f"Details: {exc}", file=sys.stderr)
        print("=" * 75 + "\n", file=sys.stderr)
        sys.exit(1)
