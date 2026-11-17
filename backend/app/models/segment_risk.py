import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geometry

from app.db.session import Base


class SegmentRisk(Base):
    __tablename__ = "segment_risk"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    segment_id = Column(String(128), unique=True, nullable=False, index=True)
    geometry = Column(Geometry(geometry_type="GEOMETRY", srid=4326, spatial_index=True), nullable=False)
    risk_score = Column(Float, nullable=False)
    model_version = Column(String(64), nullable=False)
    computed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
