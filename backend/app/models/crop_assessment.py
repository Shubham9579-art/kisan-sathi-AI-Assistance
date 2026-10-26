from datetime import datetime
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, DateTime
from app.db.session import Base

class CropAssessment(Base):
    __tablename__ = "crop_assessments"

    id = Column(String(64), primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    crop_type = Column(String(100), nullable=False)
    symptoms = Column(Text, nullable=False)
    growth_stage = Column(String(50), nullable=True)
    image_filename = Column(String(255), nullable=True)
    is_demo = Column(Boolean, default=True)
    result_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
