from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.crop_assessment import CropAssessment
from app.core.config import settings
from app.services.agriculture.assessment_service import CropAssessmentService

client = TestClient(app)

def test_crop_assessment_text():
    form_data = {
        "crop_type": "Soybean",
        "symptoms": "Yellow mosaic patches on leaves, whiteflies observed underneath",
        "growth_stage": "Flowering",
        "language": "mr"
    }
    resp = client.post("/api/v1/crop-assessments", data=form_data)
    assert resp.status_code == 200
    data = resp.json()
    assert "assessment_id" in data
    assert data["crop_type"] == "Soybean"
    assert data["is_demo"] is True
    assert data["vision_processed"] is False
    assert len(data["possible_causes"]) > 0
    assert "safety_disclaimer" in data
    with SessionLocal() as db:
        assert db.query(CropAssessment).filter(CropAssessment.id == data["assessment_id"]).first() is None

def test_crop_assessment_validation():
    # Test short symptoms (min_length=3)
    form_data = {
        "crop_type": "Soybean",
        "symptoms": "a",
        "language": "en"
    }
    resp = client.post("/api/v1/crop-assessments", data=form_data)
    assert resp.status_code == 422


def test_crop_photo_uses_configured_gemini_vision(monkeypatch):
    response_data = {
        "candidates": [{
            "content": {
                "parts": [{
                    "text": (
                        '{"possible_causes":[{"name":"Visible leaf stress",'
                        '"confidence_level":"Low","description":"A visual sign only."}],'
                        '"immediate_actions":["Inspect several plants in the field."],'
                        '"monitoring_points":["Check whether new leaves are affected."],'
                        '"escalation_advice":"Ask a local agriculture officer if symptoms spread."}'
                    )
                }]
            }
        }]
    }
    captured_payload = {}

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return response_data

    class FakeClient:
        def __init__(self, timeout):
            assert timeout == 20.0

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def post(self, url, json):
            captured_payload.update(json)
            assert "generateContent" in url
            return FakeResponse()

    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-api-key")
    monkeypatch.setattr("app.services.agriculture.assessment_service.httpx.Client", FakeClient)

    result = CropAssessmentService().assess_crop(
        crop_type="Soybean",
        symptoms="Some leaves appear curled.",
        growth_stage="Flowering",
        image_bytes=b"field photo bytes",
        image_content_type="image/jpeg",
        language="en",
    )

    assert result.vision_processed is True
    assert result.is_demo is False
    assert result.possible_causes[0].name == "Visible leaf stress"
    image_part = captured_payload["contents"][0]["parts"][1]["inline_data"]
    assert image_part["mime_type"] == "image/jpeg"
    assert image_part["data"]
