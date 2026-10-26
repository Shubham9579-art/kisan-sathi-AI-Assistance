from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(tags=["Health & Config"])

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.APP_ENV
    }

@router.get("/config")
def get_config():
    config = {
        "project_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "ai_provider": "gemini" if settings.GEMINI_API_KEY else "curated",
        "weather_provider": "openweather" if settings.OPENWEATHER_API_KEY else "open-meteo",
        "is_demo_mode": settings.DEMO_DATA_ENABLED,
        "supported_languages": ["mr", "hi", "en"],
        "max_upload_size_mb": settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)
    }
    config["demo_login_enabled"] = settings.DEMO_LOGIN_ENABLED
    if settings.DEMO_LOGIN_ENABLED:
        config["demo_login_otp"] = settings.DEMO_LOGIN_OTP
    return config
