from datetime import datetime
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, Text, DateTime
from sqlalchemy.orm import relationship
from app.db.session import Base

class Field(Base):
    __tablename__ = "fields"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    is_demo = Column(Boolean, nullable=False, default=False, index=True)
    name = Column(String(100), nullable=False)
    location = Column(String(150), nullable=False)
    crop = Column(String(100), nullable=False)
    planting_date = Column(String(50), nullable=True)
    area = Column(Float, nullable=False, default=1.0)
    area_unit = Column(String(30), nullable=False, default="Acres")  # Acres, Gunthas, Hectares
    growth_stage = Column(String(50), nullable=False, default="Vegetative")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    observations = relationship("Observation", back_populates="field", cascade="all, delete-orphan", order_by="desc(Observation.created_at)")

class Observation(Base):
    __tablename__ = "observations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    field_id = Column(Integer, ForeignKey("fields.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(String(50), nullable=False)
    growth_stage = Column(String(50), nullable=True)
    notes = Column(Text, nullable=False)
    photo_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    field = relationship("Field", back_populates="observations")
