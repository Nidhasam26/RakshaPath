import logging
from typing import Any, Dict

from fastapi import FastAPI, status
from fastapi.responses import JSONResponse
import redis
from sqlalchemy import text

from app.core.config import settings
from app.db.session import engine
from app.api.endpoints.hazards import router as hazards_router

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    description="RakshaPath Safe-Travel Backend API",
    version="1.0.0",
)

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
            "redis": "unknown",
            "postgis": "unknown",
        },
    }
    is_healthy = True

    # 1. Check Database & PostGIS
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            health_status["services"]["database"] = "healthy"

            # Check PostGIS extension
            try:
                res = conn.execute(text("SELECT PostGIS_Version();")).scalar()
                health_status["services"]["postgis"] = f"healthy ({res})"
            except Exception as e:
                health_status["services"]["postgis"] = f"unavailable ({str(e)})"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        health_status["services"]["database"] = f"unhealthy: {str(e)}"
        is_healthy = False

    # 2. Check Redis
    try:
        r = redis.from_url(settings.REDIS_URL, socket_timeout=2.0)
        if r.ping():
            health_status["services"]["redis"] = "healthy"
        else:
            health_status["services"]["redis"] = "unhealthy (ping failed)"
            is_healthy = False
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        health_status["services"]["redis"] = f"unhealthy: {str(e)}"
        is_healthy = False

    if not is_healthy:
        health_status["status"] = "degraded"
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=health_status,
        )

    return health_status
