from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field

class SchemeItem(BaseModel):
    id: str
    name: str
    name_mr: Optional[str] = None
    name_hi: Optional[str] = None
    category: str
    description: str
    description_mr: Optional[str] = None
    description_hi: Optional[str] = None
    benefits_mr: Optional[str] = None
    benefits_hi: Optional[str] = None
    target_beneficiaries: str
    eligibility_criteria: List[str]
    required_documents: List[str]
    benefits: str
    application_steps: List[str]
    official_portal_url: str
    last_verified: str
    status: Literal["Verified", "Needs Verification"]

class SchemeEligibilityRequest(BaseModel):
    scheme_id: Optional[str] = None
    land_holding_acres: float = Field(..., ge=0)
    category: str = "General"  # Small/Marginal, SC/ST, General, Women Farmer
    state: str = ""
    district: Optional[str] = None
    has_aadhaar_linked_bank: Optional[bool] = None
    has_7_12_extract: Optional[bool] = None
    has_irrigation: Optional[bool] = None
    has_active_pm_kisan: Optional[bool] = None
    pm_kisan_exclusion_applies: Optional[bool] = None
    cultivates_notified_crop: Optional[bool] = None
    received_same_survey_micro_irrigation_subsidy: Optional[bool] = None

class EligibilityCriterionResult(BaseModel):
    criterion: str
    met: Optional[bool]
    explanation: str

class SchemeEligibilityEvaluation(BaseModel):
    scheme_id: str
    scheme_name: str
    assessment_status: Literal["possible_match", "gaps_found"]
    summary_verdict: str
    criteria_results: List[EligibilityCriterionResult]
    next_steps: List[str]
    required_documents: List[str]
    official_portal_url: str
    legal_disclaimer: str

class SchemeEligibilityResponse(BaseModel):
    evaluated_at: str
    farmer_profile_summary: Dict[str, Any]
    evaluations: List[SchemeEligibilityEvaluation]
