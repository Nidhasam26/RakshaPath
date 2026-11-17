import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Text, DateTime, Boolean, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


class SOSAlert(Base):
    __tablename__ = "sos_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="SET NULL"), nullable=True, index=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    channel = Column(String(32), default="online", nullable=False)
    status = Column(String(32), default="new", nullable=False, index=True)
    acknowledged_by = Column(String(255), nullable=True)
    closed_at = Column(DateTime, nullable=True)
    note = Column(Text, nullable=True)

    __table_args__ = (
        CheckConstraint("channel IN ('online', 'sms')", name="check_sos_channel"),
        CheckConstraint("status IN ('new', 'acknowledged', 'closed')", name="check_sos_status"),
    )

    user = relationship("User", back_populates="sos_alerts")
    trip = relationship("Trip", back_populates="sos_alerts")


class NotificationSent(Base):
    __tablename__ = "notifications_sent"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    hazard_id = Column(String(64), ForeignKey("hazards.id", ondelete="CASCADE"), nullable=False, index=True)
    channel = Column(String(32), default="push", nullable=False)
    sent_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    delivered = Column(Boolean, default=False, nullable=False)

    trip = relationship("Trip", back_populates="notifications")
    hazard = relationship("Hazard")
