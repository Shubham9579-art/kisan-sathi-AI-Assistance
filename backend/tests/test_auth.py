from fastapi.testclient import TestClient
from app.db.session import SessionLocal
from app.core.config import settings
from app.models.crop_assessment import CropAssessment
from app.services.weather.weather_service import WeatherService
import uuid
import pytest
from app.main import app


def test_public_demo_is_read_only_and_excludes_legacy_private_fields():
    client = TestClient(app)

    fields_response = client.get("/api/v1/fields")
    assert fields_response.status_code == 200
    assert fields_response.json()
    assert all(field["name"] for field in fields_response.json())
    dashboard = client.get("/api/v1/dashboard")
    assert dashboard.status_code == 200
    assert dashboard.json()["profile"]["is_demo_profile"] is True
    assert dashboard.json()["fields_count"] == len(fields_response.json())

    create_response = client.post(
        "/api/v1/fields",
        json={
            "name": "Guest plot",
            "location": "Akola",
            "crop": "Cotton",
            "area": 1,
            "area_unit": "Acres",
            "growth_stage": "Flowering",
        },
    )
    assert create_response.status_code == 401


def test_production_guests_do_not_see_sample_farm_records(monkeypatch):
    monkeypatch.setattr(settings, "DEMO_DATA_ENABLED", False)
    monkeypatch.setattr(
        "app.api.routes.dashboard.weather_service.get_weather",
        lambda **kwargs: WeatherService()._get_demo_weather(
            kwargs.get("location", "Pune"),
            kwargs.get("district", "Pune"),
            kwargs.get("state", "Maharashtra"),
            "Soybean",
            "Flowering",
        ),
    )
    client = TestClient(app)

    fields_response = client.get("/api/v1/fields")
    dashboard = client.get("/api/v1/dashboard")

    assert fields_response.status_code == 200
    assert fields_response.json() == []
    assert dashboard.status_code == 200
    data = dashboard.json()
    assert data["profile"]["name"] == "Guest farmer"
    assert data["profile"]["is_demo_profile"] is False
    assert data["fields"] == []
    assert all("Gat No. 42" not in task["description"] for task in data["tasks"])


def test_accounts_only_read_and_change_their_own_fields():
    first_client = TestClient(app)
    unique_id = uuid.uuid4().hex
    first_register = first_client.post(
        "/api/v1/auth/register",
        json={
            "name": "First Farmer",
            "email": f"first-farmer-{unique_id}@example.test",
            "password": "first-farmer-password-123",
        },
    )
    assert first_register.status_code == 201
    assert first_register.cookies
    assert "httponly" in first_register.headers["set-cookie"].lower()
    assert "password" not in first_register.json()
    assert first_client.get("/api/v1/auth/me").json()["id"] == first_register.json()["id"]

    create_response = first_client.post(
        "/api/v1/fields",
        json={
            "name": "First farmer field",
            "location": "Akola",
            "crop": "Cotton",
            "area": 1.5,
            "area_unit": "Acres",
            "growth_stage": "Flowering",
        },
    )
    assert create_response.status_code == 201
    field_id = create_response.json()["id"]
    assert first_client.get("/api/v1/fields").json()[0]["id"] == field_id
    first_dashboard = first_client.get("/api/v1/dashboard").json()
    assert first_dashboard["profile"]["is_demo_profile"] is False
    assert first_dashboard["fields_count"] == 1

    second_client = TestClient(app)
    second_register = second_client.post(
        "/api/v1/auth/register",
        json={
            "name": "Second Farmer",
            "email": f"second-farmer-{unique_id}@example.test",
            "password": "second-farmer-password-123",
        },
    )
    assert second_register.status_code == 201
    assert second_client.get("/api/v1/fields").json() == []
    assert second_client.get("/api/v1/dashboard").json()["fields_count"] == 0
    assert second_client.get(f"/api/v1/fields/{field_id}").status_code == 404
    assert second_client.patch(
        f"/api/v1/fields/{field_id}",
        json={"name": "Stolen field"},
    ).status_code == 404
    assert field_id not in [
        field["id"] for field in TestClient(app).get("/api/v1/fields").json()
    ]

    first_chat = first_client.post(
        "/api/v1/chat",
        json={"message": "How should I monitor my cotton field?", "language": "en"},
    )
    assert first_chat.status_code == 200
    chat_session_id = first_chat.json()["session_id"]
    assert len(first_client.get(
        f"/api/v1/chat/history?session_id={chat_session_id}"
    ).json()) == 2
    assert second_client.get(
        f"/api/v1/chat/history?session_id={chat_session_id}"
    ).json() == []
    assert TestClient(app).get(
        f"/api/v1/chat/history?session_id={chat_session_id}"
    ).status_code == 401

    assessment_response = first_client.post(
        "/api/v1/crop-assessments",
        data={
            "crop_type": "Cotton",
            "symptoms": "Leaves show irregular spots and visible insects",
            "language": "en",
        },
    )
    assert assessment_response.status_code == 200
    with SessionLocal() as db:
        stored_assessment = (
            db.query(CropAssessment)
            .filter(CropAssessment.id == assessment_response.json()["assessment_id"])
            .first()
        )
        assert stored_assessment is not None
        assert stored_assessment.owner_id == first_register.json()["id"]

    assert first_client.post("/api/v1/auth/logout").status_code == 204
    assert first_client.get("/api/v1/auth/me").status_code == 401
    login_response = first_client.post(
        "/api/v1/auth/login",
        json={
            "email": first_register.json()["email"],
            "password": "first-farmer-password-123",
        },
    )
    assert login_response.status_code == 200
    assert first_client.get("/api/v1/auth/me").status_code == 200


def test_duplicate_registration_and_invalid_login_are_rejected():
    client = TestClient(app)
    unique_id = uuid.uuid4().hex
    payload = {
        "name": "Auth Test Farmer",
        "email": f"auth-test-{unique_id}@example.test",
        "password": "auth-test-password-123",
    }
    assert client.post("/api/v1/auth/register", json=payload).status_code == 201
    assert client.post("/api/v1/auth/register", json=payload).status_code == 409
    client.cookies.clear()
    assert client.post(
        "/api/v1/auth/login",
        json={"email": payload["email"], "password": "wrong-password"},
    ).status_code == 401


def test_demo_otp_sign_in_clones_demo_fields_into_editable_demo_account():
    if not settings.DEMO_LOGIN_ENABLED:
        pytest.skip("Demo sign-in is disabled.")

    client = TestClient(app)
    wrong_code = client.post("/api/v1/auth/demo-login", json={"otp": "000000"})
    assert wrong_code.status_code == 401

    response = client.post(
        "/api/v1/auth/demo-login",
        json={"otp": settings.DEMO_LOGIN_OTP},
    )
    assert response.status_code == 200
    assert response.cookies
    assert response.json()["name"] == "Hackathon Demo Farmer"
    assert client.get("/api/v1/auth/me").json()["id"] == response.json()["id"]

    fields = client.get("/api/v1/fields").json()
    assert len(fields) >= 3
    assert any(field["observations"] for field in fields)

    observation = client.post(
        f"/api/v1/fields/{fields[0]['id']}/observations",
        json={"date": "2026-10-26", "notes": "Demo OTP diary check"},
    )
    assert observation.status_code == 201
    assert client.post("/api/v1/auth/logout").status_code == 204


def test_demo_otp_sign_in_is_disabled_when_feature_flag_is_off(monkeypatch):
    monkeypatch.setattr(settings, "DEMO_LOGIN_ENABLED", False)
    response = TestClient(app).post(
        "/api/v1/auth/demo-login",
        json={"otp": settings.DEMO_LOGIN_OTP},
    )
    assert response.status_code == 404
