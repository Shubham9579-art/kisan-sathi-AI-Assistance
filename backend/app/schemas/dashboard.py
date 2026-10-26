from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from .field import FieldOut
from .weather import WeatherResponse
from .chat import ChatMessageOut

class FarmerProfile(BaseModel):
    name: str
    location: str
    district: str
    state: str
    is_demo_profile: bool

class DashboardTask(BaseModel):
    id: str
    title: str
    category: str
    urgency: str  # High, Medium, Low
    description: str
    action_route: str

class DashboardSummary(BaseModel):
    field_health_score: int
    irrigation_window: str
    risk_index: int
    pest_pressure: str
    next_action: str
    monitoring_priority: str

class DashboardResponse(BaseModel):
    profile: FarmerProfile
    weather_summary: WeatherResponse
    fields_count: int
    fields: List[FieldOut]
    recent_observations_count: int
    recent_conversations: List[ChatMessageOut]
    tasks: List[DashboardTask]
    quick_tips: List[str]
    system_status: Dict[str, Any]
    dashboard_summary: DashboardSummary
