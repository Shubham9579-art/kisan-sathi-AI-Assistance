from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class CropAssessmentRequest(BaseModel):
    crop_type: str = Field(..., min_length=2, max_length=100)
    symptoms: str = Field(..., min_length=5, max_length=1500)
    growth_stage: Optional[str] = None
    field_id: Optional[int] = None
    language: str = "mr"

class PossibleCause(BaseModel):
    name: str
    confidence_level: str  # High, Moderate, Low, or Indicative
    description: str

class CropAssessmentResult(BaseModel):
    assessment_id: str
    crop_type: str
    growth_stage: Optional[str]
    symptoms_analyzed: str
    is_demo: bool
    vision_processed: bool
    possible_causes: List[PossibleCause]
    immediate_actions: List[str]
    monitoring_points: List[str]
    escalation_advice: str
    safety_disclaimer: str
    sources: List[Dict[str, str]]
    created_at: datetime
