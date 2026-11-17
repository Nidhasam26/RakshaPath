import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, CheckConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geometry

from app.db.session import Base


class Hazard(Base):
    __tablename__ = "hazards"

    id = Column(String(64), primary_key=True)  # supports deterministic string IDs (e.g. haz-sample-001) or UUIDs
    type = Column(String(64), nullable=False, index=True)
    geometry = Column(Geometry(geometry_type="GEOMETRY", srid=4326, spatial_index=True), nullable=False)
    severity = Column(Integer, nullable=False)
    confidence = Column(Float, nullable=False)
    source = Column(String(64), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)
    archived_at = Column(DateTime, nullable=True, index=True)

    __table_args__ = (
        CheckConstraint("severity >= 1 AND severity <= 4", name="check_hazard_severity_range"),
        CheckConstraint("confidence >= 0.0 AND confidence <= 1.0", name="check_hazard_confidence_range"),
        Index("idx_hazards_type", "type"),
        Index("idx_hazards_expires_at", "expires_at"),
        Index("idx_hazards_archived_at", "archived_at"),
    )


class HazardSourceLog(Base):
    __tablename__ = "hazard_sources_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source = Column(String(64), nullable=False)
    fetched_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String(32), nullable=False)
    records_count = Column(Integer, default=0, nullable=False)
    error = Column(Text, nullable=True)
