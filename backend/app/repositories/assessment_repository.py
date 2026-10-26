import json
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.crop_assessment import CropAssessment
from app.schemas.crop_assessment import CropAssessmentResult

class AssessmentRepository:
    def __init__(self, db: Session):
        self.db = db

    def save(
        self,
        result: CropAssessmentResult,
        owner_id: int,
        image_filename: Optional[str] = None,
    ) -> CropAssessment:
        assessment = CropAssessment(
            id=result.assessment_id,
            owner_id=owner_id,
            crop_type=result.crop_type,
            symptoms=result.symptoms_analyzed,
            growth_stage=result.growth_stage,
            image_filename=image_filename,
            is_demo=result.is_demo,
            result_json=result.model_dump_json()
        )
        self.db.add(assessment)
        self.db.commit()
        self.db.refresh(assessment)
        return assessment

    def get_by_id(self, assessment_id: str) -> Optional[CropAssessment]:
        return self.db.query(CropAssessment).filter(CropAssessment.id == assessment_id).first()
