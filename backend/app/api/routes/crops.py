from typing import Optional
from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies.auth import get_optional_user
from app.models.user import User
from app.repositories.assessment_repository import AssessmentRepository
from app.services.agriculture.assessment_service import crop_assessment_service
from app.schemas.crop_assessment import CropAssessmentResult

router = APIRouter(tags=["Crop Health Checker"])

@router.post("/crop-assessments", response_model=CropAssessmentResult)
async def create_crop_assessment(
    crop_type: str = Form(..., min_length=2, max_length=100),
    symptoms: str = Form(..., min_length=3, max_length=1500),
    growth_stage: Optional[str] = Form(None),
    language: str = Form("mr"),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    image_bytes = None
    image_ct = None
    filename = None

    if image and image.filename:
        filename = image.filename
        image_ct = image.content_type
        image_bytes = await image.read()

    try:
        result = crop_assessment_service.assess_crop(
            crop_type=crop_type,
            symptoms=symptoms,
            growth_stage=growth_stage,
            image_bytes=image_bytes,
            image_content_type=image_ct,
            filename=filename,
            language=language
        )
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )

    if user:
        assessment_repo = AssessmentRepository(db)
        assessment_repo.save(result, owner_id=user.id, image_filename=filename)

    return result
