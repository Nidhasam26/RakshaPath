import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry

from app.db.session import Base


class Trip(Base):
    __tablename__ = "trips"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    route = Column(Geometry(geometry_type="LINESTRING", srid=4326, spatial_index=True), nullable=False)
    status = Column(String(32), default="active", nullable=False, index=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    last_seen_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_lat = Column(Float, nullable=True)
    last_lng = Column(Float, nullable=True)

    __table_args__ = (
        CheckConstraint("status IN ('active', 'completed', 'cancelled')", name="check_trip_status"),
    )

    user = relationship("User", back_populates="trips")
    locations = relationship("TripLocation", back_populates="trip", cascade="all, delete-orphan")
    notifications = relationship("NotificationSent", back_populates="trip", cascade="all, delete-orphan")
    sos_alerts = relationship("SOSAlert", back_populates="trip")


class TripLocation(Base):
    __tablename__ = "trip_locations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    speed_mps = Column(Float, nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    trip = relationship("Trip", back_populates="locations")
