from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.services.hazard_service import hazard_service
from app.schemas.hazard import (
    HazardResponse,
    HazardSourceLogResponse,
    IngestSummaryResponse,
)

router = APIRouter(prefix="/hazards", tags=["Hazards"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("", response_model=List[HazardResponse], status_code=status.HTTP_200_OK)

def get_hazards(
    bbox: Optional[str] = Query(None, description="Bounding box filter in format: min_lon,min_lat,max_lon,max_lat"),
    type: Optional[str] = Query(None, description="Filter by hazard type (e.g., water_logging, flood, accident)"),
    min_severity: Optional[int] = Query(None, ge=1, le=4, description="Minimum severity level (1-4)"),
    db: Session = Depends(get_db),
):
    """Retrieve active hazards inside an optional bounding box or matching filters."""
    return hazard_service.get_active_hazards(
        db=db,
        bbox=bbox,
        hazard_type=type,
        min_severity=min_severity,
    )


@router.post("/ingest", response_model=IngestSummaryResponse, status_code=status.HTTP_200_OK)
def trigger_ingest(
    bbox: Optional[str] = Query(None, description="Optional bounding box to ingest hazards for"),
    source: Optional[str] = Query(None, description="Optional single source to ingest (tomtom, open_meteo, seed)"),
    db: Session = Depends(get_db),
):
    """Triggers hazard ingestion across external connectors, deduplicates and persists active hazards."""
    sources = [source] if source else None
    summary = hazard_service.ingest_all(db=db, bbox=bbox, sources=sources)
    return summary


@router.get("/sources/log", response_model=List[HazardSourceLogResponse], status_code=status.HTTP_200_OK)
def get_ingestion_logs(
    limit: int = Query(20, ge=1, le=100, description="Max number of logs to return"),
    db: Session = Depends(get_db),
):
    """Retrieve history of external ingestion connector runs and health logs."""
    logs = hazard_service.get_ingestion_logs(db=db, limit=limit)
    return [
        HazardSourceLogResponse(
            id=str(log.id),
            source=log.source,
            fetched_at=log.fetched_at,
            status=log.status,
            records_count=log.records_count,
            error=log.error,
        )
        for log in logs
    ]
