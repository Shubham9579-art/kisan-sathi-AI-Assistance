from fastapi.testclient import TestClient
from app.core.config import settings
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "service" in data

def test_config():
    response = client.get("/api/v1/config")
    assert response.status_code == 200
    data = response.json()
    assert "is_demo_mode" in data
    assert "supported_languages" in data
    assert "mr" in data["supported_languages"]
    assert data["demo_login_enabled"] is settings.DEMO_LOGIN_ENABLED
    if settings.DEMO_LOGIN_ENABLED:
        assert data["demo_login_otp"] == settings.DEMO_LOGIN_OTP
