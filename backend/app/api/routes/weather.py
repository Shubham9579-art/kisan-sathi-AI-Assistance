from fastapi import APIRouter, Query
from app.services.weather.weather_service import weather_service
from app.schemas.weather import WeatherResponse

router = APIRouter(tags=["Weather & Farming Guidance"])

@router.get("/weather", response_model=WeatherResponse)
def get_weather(
    location: str = Query("Baramati, Pune", description="Location name"),
    district: str = Query("Pune", description="District name"),
    state: str = Query("Maharashtra", description="State name"),
    crop_context: str = Query("Soybean", description="Primary crop context for advisory"),
    growth_stage_context: str = Query("Flowering", description="Crop growth stage for advisory")
):
    return weather_service.get_weather(
        location=location,
        district=district,
        state=state,
        crop_context=crop_context,
        growth_stage_context=growth_stage_context,
    )
