import json
import os
from datetime import datetime, timezone
from typing import List, Optional
from app.schemas.scheme import (
    SchemeItem,
    SchemeEligibilityRequest,
    SchemeEligibilityResponse,
    SchemeEligibilityEvaluation,
    EligibilityCriterionResult
)

class SchemesService:
    def __init__(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        data_path = os.path.join(current_dir, "..", "..", "data", "schemes", "schemes.json")
        try:
            with open(data_path, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
                self.schemes = [SchemeItem(**item) for item in raw_data]
        except Exception as e:
            self.schemes = []
            print(f"Warning: could not load schemes.json: {e}")

    def list_schemes(self, category: Optional[str] = None, search: Optional[str] = None) -> List[SchemeItem]:
        results = self.schemes
        if category and category != "All":
            results = [s for s in results if category.lower() in s.category.lower()]
        if search:
            search_terms = search.casefold().split()
            results = [
                s for s in results
                if all(
                    term in " ".join(
                        value
                        for value in [
                            s.name,
                            s.name_mr or "",
                            s.name_hi or "",
                            s.category,
                            s.description,
                            s.description_mr or "",
                            s.description_hi or "",
                            s.target_beneficiaries,
                            s.benefits,
                            s.benefits_mr or "",
                            s.benefits_hi or "",
                            *s.eligibility_criteria,
                            *s.required_documents,
                            *s.application_steps,
                        ]
                    ).casefold()
                    for term in search_terms
                )
            ]
        return results

    def get_by_id(self, scheme_id: str) -> Optional[SchemeItem]:
        for s in self.schemes:
            if s.id == scheme_id:
                return s
        return None

    def evaluate_eligibility(self, req: SchemeEligibilityRequest) -> SchemeEligibilityResponse:
        evaluations: List[SchemeEligibilityEvaluation] = []
        if req.scheme_id:
            scheme = self.get_by_id(req.scheme_id)
            if scheme is None:
                raise ValueError(f"Scheme with ID '{req.scheme_id}' was not found.")
            target_schemes = [scheme]
        else:
            target_schemes = self.schemes

        for s in target_schemes:
            criteria_results: List[EligibilityCriterionResult] = []

            def add_check(criterion: str, met: Optional[bool], explanation: str) -> None:
                criteria_results.append(
                    EligibilityCriterionResult(
                        criterion=criterion,
                        met=met,
                        explanation=explanation,
                    )
                )

            state_is_maharashtra = (
                req.state.strip().casefold() == "maharashtra"
                if req.state.strip()
                else None
            )

            if s.id == "pm-kisan":
                add_check(
                    "Cultivable land and land record",
                    False if req.land_holding_acres <= 0 else req.has_7_12_extract,
                    "The questionnaire records land area and whether you have a 7/12 extract; the authority must verify land records and applicable rules.",
                )
                add_check(
                    "Aadhaar-linked bank account and e-KYC",
                    req.has_aadhaar_linked_bank,
                    "Confirm the current bank-linking and e-KYC status on the official PM-KISAN portal.",
                )
                add_check(
                    "PM-KISAN exclusion categories",
                    None if req.pm_kisan_exclusion_applies is None else not req.pm_kisan_exclusion_applies,
                    "Answer whether any exclusion category applies; final exclusion checks are made by the government.",
                )
                add_check(
                    "Current beneficiary and land-record verification",
                    None,
                    "The app does not connect to PM-KISAN beneficiary records or verify your land documents.",
                )

            elif s.id == "namo-shetkari":
                add_check(
                    "Maharashtra residency / land jurisdiction",
                    state_is_maharashtra,
                    "The scheme is listed as Maharashtra-specific; confirm the applicable land and residence rules in the current state notice.",
                )
                add_check(
                    "Active PM-KISAN beneficiary status",
                    req.has_active_pm_kisan,
                    "This status must be checked on the official PM-KISAN portal; documents alone do not prove active beneficiary status.",
                )
                add_check(
                    "Land record and Aadhaar-linked bank",
                    None if req.has_7_12_extract is None or req.has_aadhaar_linked_bank is None
                    else req.has_7_12_extract and req.has_aadhaar_linked_bank,
                    "Confirm the current land-record, bank mapping, and e-KYC requirements with the state portal.",
                )
                add_check(
                    "Current state beneficiary / installment status",
                    None,
                    "The app cannot access state beneficiary records or confirm whether an installment is due.",
                )

            elif s.id == "pmfby-crop-insurance":
                add_check(
                    "Cultivated area",
                    req.land_holding_acres > 0,
                    "The calculator records area only; it does not verify cultivation or land records.",
                )
                add_check(
                    "Crop and area notified for this season",
                    req.cultivates_notified_crop,
                    "Notification varies by state, district, crop, and season and must be checked on the official portal.",
                )
                add_check(
                    "Current enrollment window and premium",
                    None,
                    "The app does not retrieve current seasonal deadlines, premium rates, or enrollment availability.",
                )
                add_check(
                    "Land / sowing documents and policy conditions",
                    None,
                    "Required documents and coverage depend on the farmer's case and current season notification.",
                )

            elif s.id == "mahadbt-micro-irrigation":
                add_check(
                    "Maharashtra jurisdiction",
                    state_is_maharashtra,
                    "This listing is for a Maharashtra portal; confirm that the component is currently open for your district.",
                )
                add_check(
                    "Assured water source",
                    req.has_irrigation,
                    "Confirm the accepted water-source proof in the current component guidelines.",
                )
                add_check(
                    "Previous subsidy on the same survey number",
                    None if req.received_same_survey_micro_irrigation_subsidy is None
                    else not req.received_same_survey_micro_irrigation_subsidy,
                    "Prior subsidy restrictions are component-specific and must be checked against current rules.",
                )
                add_check(
                    "Land-size threshold, category rate, and component availability",
                    None,
                    "The calculator does not verify current thresholds, subsidy percentages, category rates, lottery, or district availability.",
                )

            elif s.id == "magel-tyala-shettale":
                add_check(
                    "Maharashtra jurisdiction",
                    state_is_maharashtra,
                    "This listing is for a Maharashtra scheme; check current implementation in your district.",
                )
                add_check(
                    "Land record",
                    req.has_7_12_extract,
                    "The portal or implementing office must verify the land record and applicant details.",
                )
                add_check(
                    "Site feasibility and current land threshold",
                    None,
                    "Technical site suitability and current land thresholds are not assessed by this questionnaire.",
                )
                add_check(
                    "Current scheme availability and subsidy amount",
                    None,
                    "Availability, application window, and assistance amount must be confirmed in the current official notice.",
                )

            has_gaps = any(result.met is False for result in criteria_results)
            assessment_status = "gaps_found" if has_gaps else "possible_match"
            summary_verdict = (
                "One or more checked items may not meet the listed conditions. This is not an official rejection; verify the current rules and your documents."
                if has_gaps else
                "No gap was found in the items you answered. This is only a possible match; unresolved items and current official rules still need verification."
            )

            evaluations.append(
                SchemeEligibilityEvaluation(
                    scheme_id=s.id,
                    scheme_name=s.name,
                    assessment_status=assessment_status,
                    summary_verdict=summary_verdict,
                    criteria_results=criteria_results,
                    next_steps=s.application_steps,
                    required_documents=s.required_documents,
                    official_portal_url=s.official_portal_url,
                    legal_disclaimer="This tool is an informational checklist, not an eligibility determination. It does not access government records and does not verify current notices, deadlines, funds, or documents. Confirm every condition with the official portal or implementing office; only the competent authority can determine eligibility."
                )
            )

        return SchemeEligibilityResponse(
            evaluated_at=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
            farmer_profile_summary={
                "land_holding_acres": req.land_holding_acres,
                "category": req.category,
                "state": req.state,
                "district": req.district,
                "has_7_12_extract": req.has_7_12_extract,
                "has_aadhaar_linked_bank": req.has_aadhaar_linked_bank,
                "has_active_pm_kisan": req.has_active_pm_kisan,
                "pm_kisan_exclusion_applies": req.pm_kisan_exclusion_applies,
                "cultivates_notified_crop": req.cultivates_notified_crop,
                "received_same_survey_micro_irrigation_subsidy": req.received_same_survey_micro_irrigation_subsidy,
            },
            evaluations=evaluations
        )

schemes_service = SchemesService()
