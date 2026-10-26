from fastapi import APIRouter, Depends
from typing import Optional
from sqlalchemy.orm import Session
from app.api.dependencies.auth import get_optional_user
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.repositories.field_repository import FieldRepository
from app.repositories.chat_repository import ChatRepository
from app.services.weather.weather_service import weather_service
from app.schemas.dashboard import DashboardResponse, FarmerProfile, DashboardTask, DashboardSummary
from app.schemas.field import FieldOut
from app.schemas.chat import ChatMessageOut
import json

router = APIRouter(tags=["Dashboard"])

@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    location: Optional[str] = None,
    district: Optional[str] = None,
    state: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    field_repo = FieldRepository(db)
    chat_repo = ChatRepository(db)

    fields = field_repo.get_all(owner_id=user.id if user else None)
    fields_out = [FieldOut.model_validate(f) for f in fields]
    total_observations = sum(len(f.observations) for f in fields)

    location = location or (fields[0].location if user and fields else "Baramati, Pune")
    district = district or (location.split(",")[0].strip() if user else "Pune")
    state = state or "Maharashtra"
    weather = weather_service.get_weather(location=location, district=district, state=state)
    risk = weather.risk_summary if hasattr(weather, "risk_summary") else None
    if risk is None:
        irrigation_risk = 58
        spraying_risk = 61
        disease_risk = 64
        harvesting_risk = 45
    else:
        irrigation_risk = getattr(risk, "irrigation", 58)
        spraying_risk = getattr(risk, "spraying", 61)
        disease_risk = getattr(risk, "disease", 64)
        harvesting_risk = getattr(risk, "harvesting", 45)

    avg_risk = int((irrigation_risk + spraying_risk + disease_risk + harvesting_risk) / 4)
    field_health_score = max(55, min(97, 100 - int(avg_risk * 0.35)))

    if weather.is_demo:
        next_action = (
            "Demo weather is illustrative. Check live local weather and field conditions "
            "before irrigation, spraying, or harvest."
        )
        monitoring_priority = "Medium"
    elif weather.rainfall_prob_pct >= 60 or spraying_risk >= 70:
        next_action = "Check the live local forecast and product label before considering any spray; inspect field drainage."
        monitoring_priority = "High"
    elif weather.temperature_celsius > 32:
        next_action = "Check root-zone soil moisture and the rain forecast before deciding whether to irrigate."
        monitoring_priority = "Medium"
    else:
        next_action = "Continue daily scouting and keep field records updated for the next advisory cycle."
        monitoring_priority = "Low"

    pest_pressure = "Moderate" if disease_risk >= 55 else "Low"
    irrigation_window = "Early morning (06:00-08:30)" if weather.temperature_celsius >= 30 else "Late evening"

    recent_db_msgs = chat_repo.get_recent_messages(
        limit=5,
        owner_id=user.id if user else None,
    )
    recent_msgs = []
    for m in recent_db_msgs:
        sources = json.loads(m.sources_json) if m.sources_json else []
        structured = json.loads(m.structured_json) if m.structured_json else None
        recent_msgs.append(ChatMessageOut(
            id=m.id,
            session_id=m.session_id,
            sender=m.sender,
            content=m.content,
            language=m.language,
            is_demo=m.is_demo,
            sources=sources,
            structured_advice=structured,
            created_at=m.created_at
        ))

    profile = FarmerProfile(
        name=user.name if user else "Guest farmer",
        location=location,
        district=district,
        state=state,
        is_demo_profile=user is None and settings.DEMO_DATA_ENABLED
    )

    demo_tasks = [
        DashboardTask(
            id="t1",
            title="Inspect Soybean for Whitefly & Yellowing",
            category="Pest Scouting",
            urgency="High",
            description="Check underside of leaves in Gat No. 42 for whitefly counts following morning dew.",
            action_route="/crops"
        ),
        DashboardTask(
            id="t2",
            title="Review local weather before field operations",
            category="Irrigation & Spraying",
            urgency="Medium",
            description="Demo weather is illustrative. Check a live local forecast and product label before spraying or irrigating.",
            action_route="/weather"
        ),
        DashboardTask(
            id="t3",
            title="Verify Namo Shetkari Installment Status",
            category="Government Schemes",
            urgency="Low",
            description="Check e-KYC status and Aadhaar-NPCI bank seeding on the portal.",
            action_route="/schemes"
        )
    ]
    tasks = demo_tasks if user is None and settings.DEMO_DATA_ENABLED else [
        DashboardTask(
            id="t1",
            title="Review your latest field conditions",
            category="Field Monitoring",
            urgency="Medium",
            description=(
                f"Check soil moisture and inspect your {fields[0].crop} field."
                if fields
                else "Add a field to receive crop- and location-aware farming guidance."
            ),
            action_route="/fields"
        )
    ]

    quick_tips = [
        "Check root-zone soil moisture and the current local rain forecast before deciding whether to irrigate.",
        "Inspect plants across several parts of the field; use traps as monitoring tools, not as a diagnosis.",
        "Follow local university guidance and product labels for crop treatments and seed preparation.",
    ]

    return DashboardResponse(
        profile=profile,
        weather_summary=weather,
        fields_count=len(fields),
        fields=fields_out,
        recent_observations_count=total_observations,
        recent_conversations=recent_msgs,
        tasks=tasks,
        quick_tips=quick_tips,
        system_status={
            "database": "SQLite",
            "ai_mode": (
                "Gemini"
                if settings.GEMINI_API_KEY
                else "Curated Agricultural Knowledge Base"
            ),
            "offline_ready": True,
            "field_health_score": field_health_score,
            "weather_alert_level": monitoring_priority,
            "next_action": next_action,
        },
        dashboard_summary=DashboardSummary(
            field_health_score=field_health_score,
            irrigation_window=irrigation_window,
            risk_index=avg_risk,
            pest_pressure=pest_pressure,
            next_action=next_action,
            monitoring_priority=monitoring_priority,
        )
    )
