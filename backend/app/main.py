from contextlib import asynccontextmanager
import logging
from typing import Any, Dict

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import redis
from sqlalchemy import text

from app.core.config import settings
from app.db.session import engine
from app.api.endpoints.hazards import router as hazards_router
from app.api.endpoints.auth import router as auth_router

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.db.init_db import init_db
    init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="RakshaPath Safe-Travel Backend API",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(hazards_router)



@app.get("/")
def read_root() -> Dict[str, str]:
    return {
        "app": settings.APP_NAME,
        "status": "online",
        "version": "1.0.0",
    }


@app.get("/health", status_code=status.HTTP_200_OK)
def health_check() -> Any:
    health_status: Dict[str, Any] = {
        "status": "ok",
        "app": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "services": {
            "database": "unknown",
            "postgis": "unknown",
            "redis": "unknown",
        },
    }
    db_ok = False

    # 1. Check Database & PostGIS
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            health_status["services"]["database"] = "ok"
            db_ok = True

            # Check PostGIS extension
            try:
                res = conn.execute(text("SELECT PostGIS_Version();")).scalar()
                health_status["services"]["postgis"] = f"ok ({res})"
            except Exception:
                health_status["services"]["postgis"] = "down"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        health_status["services"]["database"] = "down"
        health_status["services"]["postgis"] = "down"
        db_ok = False

    # 2. Check Redis (optional: ok / not_configured / down)
    if not settings.REDIS_URL or settings.REDIS_URL.strip() == "":
        health_status["services"]["redis"] = "not_configured"
    else:
        try:
            r = redis.from_url(settings.REDIS_URL, socket_timeout=1.0)
            if r.ping():
                health_status["services"]["redis"] = "ok"
            else:
                health_status["services"]["redis"] = "down"
        except Exception:
            health_status["services"]["redis"] = "down"

    # Return HTTP 200 as long as the database works
    if not db_ok:
        health_status["status"] = "degraded"
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=health_status,
        )

    return health_status
