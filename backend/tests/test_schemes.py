from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_schemes_list_and_get():
    resp = client.get("/api/v1/schemes")
    assert resp.status_code == 200
    schemes = resp.json()
    assert len(schemes) >= 3
    assert all(scheme["description_hi"] for scheme in schemes)
    assert all(scheme["benefits_mr"] and scheme["benefits_hi"] for scheme in schemes)
    assert all(scheme["status"] == "Needs Verification" for scheme in schemes)

    # Fetch individual
    first_id = schemes[0]["id"]
    get_resp = client.get(f"/api/v1/schemes/{first_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == first_id


def test_scheme_search_includes_localized_descriptions_and_application_steps():
    response = client.get("/api/v1/schemes", params={"search": "सिंचाई"})
    assert response.status_code == 200
    assert any(scheme["id"] == "mahadbt-micro-irrigation" for scheme in response.json())

def test_scheme_eligibility_evaluation():
    payload = {
        "scheme_id": "pm-kisan",
        "land_holding_acres": 2.5,
        "category": "Small/Marginal",
        "state": "Maharashtra",
        "has_aadhaar_linked_bank": True,
        "has_7_12_extract": True,
        "pm_kisan_exclusion_applies": False,
    }
    resp = client.post("/api/v1/schemes/eligibility", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["evaluations"]) == 1
    eval_item = data["evaluations"][0]
    assert eval_item["assessment_status"] == "possible_match"
    assert "not an eligibility determination" in eval_item["legal_disclaimer"]
    assert any(item["met"] is None for item in eval_item["criteria_results"])


def test_scheme_unknown_answers_remain_unverified_and_missing_details_are_not_assumed():
    response = client.post(
        "/api/v1/schemes/eligibility",
        json={
            "scheme_id": "pm-kisan",
            "land_holding_acres": 1.0,
            "state": "Maharashtra",
        },
    )
    assert response.status_code == 200
    result = response.json()["evaluations"][0]
    assert result["assessment_status"] == "possible_match"
    assert all(item["met"] is None for item in result["criteria_results"][:2])


def test_scheme_reports_known_gaps_without_a_fake_eligibility_score():
    response = client.post(
        "/api/v1/schemes/eligibility",
        json={
            "scheme_id": "namo-shetkari",
            "land_holding_acres": 1.0,
            "state": "Gujarat",
            "has_active_pm_kisan": False,
            "has_7_12_extract": False,
            "has_aadhaar_linked_bank": False,
        },
    )
    assert response.status_code == 200
    result = response.json()["evaluations"][0]
    assert result["assessment_status"] == "gaps_found"
    assert "eligibility_score_pct" not in result
    assert all(item["met"] is False for item in result["criteria_results"][:3])


def test_unknown_scheme_id_returns_not_found():
    response = client.post(
        "/api/v1/schemes/eligibility",
        json={"scheme_id": "not-a-scheme", "land_holding_acres": 1.0},
    )
    assert response.status_code == 404


def test_pm_fby_does_not_assume_notified_crop_or_current_enrollment():
    response = client.post(
        "/api/v1/schemes/eligibility",
        json={
            "scheme_id": "pmfby-crop-insurance",
            "land_holding_acres": 2.0,
            "state": "Maharashtra",
            "cultivates_notified_crop": None,
        },
    )
    assert response.status_code == 200
    result = response.json()["evaluations"][0]
    assert result["assessment_status"] == "possible_match"
    assert result["criteria_results"][1]["met"] is None
    assert result["criteria_results"][2]["met"] is None


def test_missing_state_is_unknown_not_a_regional_scheme_failure():
    response = client.post(
        "/api/v1/schemes/eligibility",
        json={
            "scheme_id": "namo-shetkari",
            "land_holding_acres": 1.0,
        },
    )
    assert response.status_code == 200
    result = response.json()["evaluations"][0]
    assert result["assessment_status"] == "possible_match"
    assert result["criteria_results"][0]["met"] is None
