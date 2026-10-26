import json
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.services.agriculture.knowledge_service import knowledge_service
from app.services.ai.assistant_service import AssistantService

client = TestClient(app)

def test_chat_query_marathi_soybean():
    client.cookies.clear()
    payload = {
        "message": "सोयाबीन पानांवर पिवळे चट्टे दिसत आहेत काय करावे?",
        "language": "mr",
        "crop_context": "Soybean"
    }
    response = client.post("/api/v1/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert "message" in data
    assert data["message"]["is_demo"] is True
    assert "structured_advice" in data["message"]
    # Check that structured advice has required four sections
    advice = data["message"]["structured_advice"]
    assert "what_might_be_happening" in advice
    assert len(advice["what_to_do_now"]) > 0
    assert len(advice["what_to_monitor"]) > 0
    assert "when_to_consult_expert" in advice
    assert client.get(
        f"/api/v1/chat/history?session_id={data['session_id']}"
    ).status_code == 401

def test_chat_history():
    client.cookies.clear()
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Chat Test Farmer",
            "email": f"chat-test-{uuid.uuid4().hex}@example.test",
            "password": "chat-test-password-123",
        },
    )
    assert register_response.status_code == 201
    # 1. Post a message
    payload = {
        "session_id": "test-history-session",
        "message": "Hello, need advice for sugarcane red rot",
        "language": "en"
    }
    res1 = client.post("/api/v1/chat", json=payload)
    assert res1.status_code == 200
    session_id = res1.json()["session_id"]

    # 2. Fetch history
    res2 = client.get(f"/api/v1/chat/history?session_id={session_id}")
    assert res2.status_code == 200
    msgs = res2.json()
    assert len(msgs) >= 2  # At least user + assistant


def test_knowledge_search_requires_symptom_match():
    assert knowledge_service.search("Soybean", crop="Soybean") == []

    matches = knowledge_service.search(
        "सोयाबीन पानांवर पिवळे चट्टे दिसत आहेत",
        crop="Soybean",
    )
    assert matches
    assert matches[0]["id"] == "soybean-yellow-mosaic"


def test_knowledge_search_respects_selected_crop():
    matches = knowledge_service.search(
        "cotton pink bollworm rosette flowers",
        crop="Soybean",
    )
    assert matches == []


def test_knowledge_search_matches_crop_with_variety_details():
    matches = knowledge_service.search(
        "soybean yellow mosaic whitefly",
        crop="Soybean (सोयाबीन - JS 335)",
    )
    assert matches
    assert matches[0]["id"] == "soybean-yellow-mosaic"


def test_curated_crop_guidance_avoids_unverified_doses_and_thresholds():
    forbidden_patterns = (
        "@",
        "g/liter",
        "g/L",
        "ml/liter",
        "ppm",
        "per acre",
        "moths/trap",
        "whiteflies per plant",
        "quarantine-grade",
    )

    for record in knowledge_service.records:
        guidance = " ".join(
            [
                *record.get("immediate_actions", []),
                *record.get("monitoring_points", []),
                record.get("escalation_advice", ""),
            ]
        ).lower()
        assert not any(pattern.lower() in guidance for pattern in forbidden_patterns)


def test_local_disease_match_is_not_presented_as_verified_diagnosis():
    service = AssistantService()
    summary = service.generate_response(
        "soybean yellow mosaic whitefly",
        language="en",
        crop_context="Soybean",
    )[0]

    assert "preliminary possibility" in summary
    assert "not a confirmed diagnosis" in summary
    assert "have not been checked" in summary


def test_local_disease_response_uses_provided_crop_stage_and_location():
    service = AssistantService()
    summary = service.generate_response(
        "soybean yellow mosaic whitefly",
        language="en",
        crop_context="Soybean",
        growth_stage_context="Flowering",
        location_context="Akola",
    )[0]

    assert "Flowering" in summary
    assert "Akola" in summary


def test_gemini_uses_retrieved_crop_guidance_and_trusted_sources(monkeypatch):
    service = AssistantService()
    service.gemini_key = "test-key"
    captured = {}
    response_content = {
        "summary": "Possible soybean yellow mosaic; confirm symptoms in the field.",
        "what_might_be_happening": "The symptoms may match yellow mosaic.",
        "what_to_do_now": ["Inspect affected plants and avoid unverified sprays."],
        "what_to_monitor": ["Check the underside of leaves for whiteflies."],
        "when_to_consult_expert": "Contact the local agriculture officer if symptoms spread.",
    }

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {
                "candidates": [{
                    "content": {"parts": [{"text": json.dumps(response_content)}]}
                }]
            }

    class FakeClient:
        def __init__(self, timeout):
            assert timeout == 10.0

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc_value, traceback):
            return False

        def post(self, url, json):
            captured["payload"] = json
            return FakeResponse()

    monkeypatch.setattr("app.services.ai.assistant_service.httpx.Client", FakeClient)
    result = service.generate_response(
        "soybean yellow mosaic whitefly",
        language="en",
        crop_context="Soybean (सोयाबीन - JS 335)",
        growth_stage_context="Flowering",
        location_context="Akola",
    )

    prompt = captured["payload"]["contents"][0]["parts"][0]["text"]
    assert "soybean-yellow-mosaic" not in prompt
    assert "Yellow Mosaic Virus & Whitefly Vector" in prompt
    assert "Flowering" in prompt
    assert "Akola" in prompt
    assert "do not provide a dose" in prompt
    assert "have not been independently verified" in prompt
    assert "Do not claim that a source was accessed or verified" in prompt
    assert "warm, calm, respectful, and reassuring conversational tone" in prompt
    assert captured["payload"]["generationConfig"]["temperature"] == 0.2
    assert result[2][0].title == "ICAR-Indian Institute of Soybean Research Advisory Bulletin"
    assert result[4].startswith("Google Gemini")
    assert result[5] is False


def test_invalid_gemini_output_falls_back_to_curated_response(monkeypatch):
    service = AssistantService()
    service.gemini_key = "test-key"

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"candidates": [{"content": {"parts": [{"text": "{}"}]}}]}

    class FakeClient:
        def __init__(self, timeout):
            pass

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc_value, traceback):
            return False

        def post(self, url, json):
            return FakeResponse()

    monkeypatch.setattr("app.services.ai.assistant_service.httpx.Client", FakeClient)
    result = service.generate_response(
        "soybean yellow mosaic whitefly",
        language="en",
        crop_context="Soybean",
    )

    assert result[1] is not None
    assert result[4] == "KisanSathi Curated Agricultural Knowledge Base"
    assert result[5] is True
