from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class WeatherForecastDay(BaseModel):
    day: str
    date: str
    temp_max: float
    temp_min: float
    condition: str
    icon: str
    rain_probability_pct: int

class WeatherAlert(BaseModel):
    severity: str  # Warning, Advisory, Normal
    headline: str
    description: str
    suggested_action: str

class FarmingGuidance(BaseModel):
    irrigation_advice: str
    spraying_advice: str
    harvesting_advice: str
    soil_work_advice: str

class RiskAssessment(BaseModel):
    irrigation: int
    spraying: int
    disease: int
    harvesting: int

class CropAdvisory(BaseModel):
    crop: str
    growth_stage: str
    recommendation: str
    risk_level: str
    action: str

class WeatherResponse(BaseModel):
    location: str
    district: str
    state: str
    temperature_celsius: float
    feels_like_celsius: float
    condition: str
    humidity_pct: int
    rainfall_prob_pct: int
    wind_speed_kmh: float
    updated_at: str
    is_demo: bool
    data_source_label: str
    guidance: FarmingGuidance
    forecast: List[WeatherForecastDay]
    alerts: List[WeatherAlert]
    risk_summary: RiskAssessment
    recommended_actions: List[str]
    crop_advisories: List[CropAdvisory]
    advisory_summary: str
