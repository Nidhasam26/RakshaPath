import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from shapely.geometry import shape, mapping
from geoalchemy2.shape import from_shape, to_shape
from sqlalchemy.orm import Session
from sqlalchemy import text, func

from app.models.hazard import Hazard, HazardSourceLog
from app.schemas.hazard import HazardCreate, HazardResponse, GeoJSONGeometry, IngestSummaryResponse
from app.connectors.sample_seed import SampleSeedConnector
from app.connectors.tomtom import TomTomConnector
from app.connectors.open_meteo import OpenMeteoConnector
from app.core.config import settings

logger = logging.getLogger(__name__)


class HazardIngestionService:
    """Core domain service for orchestrating hazard ingestion, spatial deduplication, persistence and expiry."""

    def __init__(self):
        self.connectors = {
            "seed": SampleSeedConnector(),
            "tomtom": TomTomConnector(),
            "open_meteo": OpenMeteoConnector(),
        }

    def log_source_run(
        self,
        db: Session,
        source: str,
        status: str,
        records_count: int = 0,
        error: Optional[str] = None,
    ) -> HazardSourceLog:
        """Records the outcome of an external data ingestion run."""
        log_entry = HazardSourceLog(
            id=uuid.uuid4(),
            source=source,
            fetched_at=datetime.now(timezone.utc),
            status=status,
            records_count=records_count,
            error=error,
        )

        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry

    def deduplicate_and_persist(self, db: Session, hazards: List[HazardCreate]) -> int:
        """
        Spatially deduplicates incoming hazards against active records in the database.
        Merges duplicates within 50m distance of matching hazard type, otherwise creates a new record.
        """
        persisted_count = 0
        proximity_meters = settings.HAZARD_DEDUPLICATION_DISTANCE_METERS

        for h in hazards:
            geom_obj = shape(h.geometry.model_dump())
            geo_element = from_shape(geom_obj, srid=4326)
            geom_wkt = geom_obj.wkt

            # 1. Exact ID match check
            existing = None
            if h.id:
                existing = db.query(Hazard).filter(
                    Hazard.id == h.id,
                    Hazard.archived_at.is_(None),
                ).first()

            # 2. Spatial proximity check for active hazards of same type if no exact ID match
            if not existing:
                spatial_query = text("""
                    SELECT id FROM hazards
                    WHERE type = :htype
                      AND archived_at IS NULL
                      AND ST_DWithin(geometry::geography, ST_GeomFromText(:wkt, 4326)::geography, :distance_m)
                    LIMIT 1;
                """)
                match = db.execute(
                    spatial_query,
                    {
                        "htype": h.type,
                        "wkt": geom_wkt,
                        "distance_m": proximity_meters,
                    }
                ).fetchone()

                if match:
                    existing = db.query(Hazard).filter(Hazard.id == match[0]).first()

            if existing:
                # Merge into existing record
                existing.severity = max(existing.severity, h.severity)
                existing.confidence = max(existing.confidence, h.confidence)
                existing.expires_at = max(existing.expires_at, h.expires_at)
                if h.description and h.description not in (existing.description or ""):
                    existing.description = f"{existing.description}; {h.description}" if existing.description else h.description
            else:
                hazard_id = h.id or f"haz-{uuid.uuid4().hex[:12]}"
                new_hazard = Hazard(
                    id=hazard_id,
                    type=h.type,
                    geometry=geo_element,
                    severity=h.severity,
                    confidence=h.confidence,
                    source=h.source,
                    description=h.description,
                    created_at=h.created_at or datetime.now(timezone.utc),
                    expires_at=h.expires_at,
                )
                db.add(new_hazard)

            persisted_count += 1

        db.commit()
        return persisted_count

    def archive_expired_hazards(self, db: Session) -> int:
        """Marks hazards past their expiry timestamp as archived."""
        now_utc = datetime.now(timezone.utc)
        expired_hazards = db.query(Hazard).filter(
            Hazard.expires_at <= now_utc,
            Hazard.archived_at.is_(None),
        ).all()

        archived_count = len(expired_hazards)
        for haz in expired_hazards:
            haz.archived_at = now_utc

        if archived_count > 0:
            db.commit()
            logger.info(f"Archived {archived_count} expired hazards.")

        return archived_count

    def ingest_source(self, db: Session, source_name: str, bbox: Optional[str] = None) -> int:
        """Fetches from a single connector and stores hazards."""
        if source_name not in self.connectors:
            raise ValueError(f"Unknown connector source: '{source_name}'. Available: {list(self.connectors.keys())}")

        connector = self.connectors[source_name]
        try:
            hazards = connector.fetch_hazards(bbox=bbox)
            count = self.deduplicate_and_persist(db, hazards)
            self.log_source_run(db, source=source_name, status="success", records_count=count)
            return count
        except Exception as e:
            logger.error(f"Ingestion failed for source '{source_name}': {e}")
            self.log_source_run(db, source=source_name, status="failed", records_count=0, error=str(e))
            raise

    def ingest_all(
        self,
        db: Session,
        bbox: Optional[str] = None,
        sources: Optional[List[str]] = None,
    ) -> IngestSummaryResponse:
        """Orchestrates ingestion from all active connectors, deduplicates and archives expired records."""
        target_sources = sources or (["seed", "tomtom", "open_meteo"] if settings.DEMO_MODE else ["tomtom", "open_meteo"])
        total_ingested = 0
        run_logs: List[Dict[str, Any]] = []

        for src in target_sources:
            if src not in self.connectors:
                continue
            connector = self.connectors[src]
            try:
                hazards = connector.fetch_hazards(bbox=bbox)
                count = self.deduplicate_and_persist(db, hazards)
                total_ingested += count
                log_entry = self.log_source_run(db, source=src, status="success", records_count=count)
                run_logs.append({
                    "source": src,
                    "status": "success",
                    "records_count": count,
                    "fetched_at": log_entry.fetched_at.isoformat(),
                })
            except Exception as e:
                logger.warning(f"Failed to ingest from source '{src}': {e}")
                log_entry = self.log_source_run(db, source=src, status="failed", records_count=0, error=str(e))
                run_logs.append({
                    "source": src,
                    "status": "failed",
                    "error": str(e),
                    "fetched_at": log_entry.fetched_at.isoformat(),
                })

        archived = self.archive_expired_hazards(db)

        return IngestSummaryResponse(
            status="completed",
            sources_processed=target_sources,
            hazards_ingested=total_ingested,
            hazards_archived=archived,
            logs=run_logs,
        )

    def get_active_hazards(
        self,
        db: Session,
        bbox: Optional[str] = None,
        hazard_type: Optional[str] = None,
        min_severity: Optional[int] = None,
    ) -> List[HazardResponse]:
        """Queries active (non-archived, non-expired) hazards with optional bbox and filters."""
        now_utc = datetime.now(timezone.utc)
        query = db.query(Hazard).filter(
            Hazard.archived_at.is_(None),
            Hazard.expires_at > now_utc,
        )


        if hazard_type:
            query = query.filter(Hazard.type == hazard_type)

        if min_severity:
            query = query.filter(Hazard.severity >= min_severity)

        if bbox:
            # Parse bbox [min_lon, min_lat, max_lon, max_lat]
            try:
                parts = [float(x.strip()) for x in bbox.split(",")]
                if len(parts) == 4:
                    min_lon, min_lat, max_lon, max_lat = parts
                    query = query.filter(
                        func.ST_Intersects(
                            Hazard.geometry,
                            func.ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326),
                        )
                    )
            except Exception as e:
                logger.warning(f"Error parsing bbox filter '{bbox}': {e}")

        hazards = query.all()
        results: List[HazardResponse] = []

        for h in hazards:
            geom_shapely = to_shape(h.geometry)
            geom_geojson = mapping(geom_shapely)
            results.append(
                HazardResponse(
                    id=h.id,
                    type=h.type,
                    severity=h.severity,
                    confidence=h.confidence,
                    source=h.source,
                    description=h.description,
                    geometry=GeoJSONGeometry(**geom_geojson),
                    created_at=h.created_at,
                    expires_at=h.expires_at,
                    archived_at=h.archived_at,
                )
            )

        return results

    def get_ingestion_logs(self, db: Session, limit: int = 20) -> List[HazardSourceLog]:
        return db.query(HazardSourceLog).order_by(HazardSourceLog.fetched_at.desc()).limit(limit).all()


hazard_service = HazardIngestionService()
