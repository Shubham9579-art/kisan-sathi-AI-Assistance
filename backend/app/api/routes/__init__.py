from .health import router as health_router
from .auth import router as auth_router
from .dashboard import router as dashboard_router
from .chat import router as chat_router
from .crops import router as crops_router
from .weather import router as weather_router
from .schemes import router as schemes_router
from .fields import router as fields_router

__all__ = [
    "health_router",
    "auth_router",
    "dashboard_router",
    "chat_router",
    "crops_router",
    "weather_router",
    "schemes_router",
    "fields_router"
]
