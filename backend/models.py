from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from backend.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Machine(Base):
    __tablename__ = "machines"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(120), nullable=False)
    line = Column(String(100), default="Main Production Line")
    location = Column(String(100), default="Floor 1")
    status = Column(String(30), default="OPERATIONAL")  # OPERATIONAL, DOWN, MAINTENANCE
    planned_hours_per_day = Column(Float, default=24.0)
    created_at = Column(DateTime, default=utcnow)

    events = relationship("DowntimeEvent", back_populates="machine", cascade="all, delete-orphan")
    alerts = relationship("RepeatAlert", back_populates="machine", cascade="all, delete-orphan")


class ReasonCode(Base):
    __tablename__ = "reason_codes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(120), nullable=False)
    category = Column(String(50), default="Mechanical")  # Mechanical, Electrical, Operational, Material, Tooling
    description = Column(Text, default="")
    is_active = Column(Boolean, default=True)
    color = Column(String(20), default="#3B82F6")
    created_at = Column(DateTime, default=utcnow)

    events = relationship("DowntimeEvent", back_populates="reason_code")
    alerts = relationship("RepeatAlert", back_populates="reason_code")


class DowntimeEvent(Base):
    __tablename__ = "downtime_events"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=False, index=True)
    reason_code_id = Column(Integer, ForeignKey("reason_codes.id"), nullable=False, index=True)
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False, index=True)
    duration_minutes = Column(Float, nullable=False)
    comment = Column(Text, default="")
    operator_name = Column(String(100), default="Operator")
    shift = Column(String(30), default="Day")
    created_at = Column(DateTime, default=utcnow)

    machine = relationship("Machine", back_populates="events")
    reason_code = relationship("ReasonCode", back_populates="events")


class RepeatAlert(Base):
    __tablename__ = "repeat_alerts"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=False, index=True)
    reason_code_id = Column(Integer, ForeignKey("reason_codes.id"), nullable=False, index=True)
    incident_count = Column(Integer, nullable=False)
    window_start = Column(DateTime, nullable=False)
    window_end = Column(DateTime, nullable=False)
    status = Column(String(30), default="ACTIVE")  # ACTIVE, ACKNOWLEDGED, RESOLVED
    severity = Column(String(20), default="CRITICAL")  # CRITICAL, WARNING, INFO
    recommended_action = Column(Text, default="")
    updated_at = Column(DateTime, default=utcnow)

    machine = relationship("Machine", back_populates="alerts")
    reason_code = relationship("ReasonCode", back_populates="alerts")
