from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException, status
from app.services.schemes.schemes_service import schemes_service
from app.schemas.scheme import SchemeItem, SchemeEligibilityRequest, SchemeEligibilityResponse

router = APIRouter(tags=["Government Schemes"])

@router.get("/schemes", response_model=List[SchemeItem])
def list_schemes(
    category: Optional[str] = Query(None, description="Filter category"),
    search: Optional[str] = Query(None, description="Search term in scheme names or details")
):
    return schemes_service.list_schemes(category=category, search=search)

@router.get("/schemes/{scheme_id}", response_model=SchemeItem)
def get_scheme(scheme_id: str):
    scheme = schemes_service.get_by_id(scheme_id)
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scheme with ID '{scheme_id}' was not found."
        )
    return scheme

@router.post("/schemes/eligibility", response_model=SchemeEligibilityResponse)
def check_eligibility(req: SchemeEligibilityRequest):
    try:
        return schemes_service.evaluate_eligibility(req)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
