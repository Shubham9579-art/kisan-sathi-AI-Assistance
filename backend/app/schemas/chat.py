from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ChatStructuredAdvice(BaseModel):
    what_might_be_happening: str
    what_to_do_now: List[str]
    what_to_monitor: List[str]
    when_to_consult_expert: str

class ChatSource(BaseModel):
    title: str
    organization: str
    url: Optional[str] = None
    note: Optional[str] = None

class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str = Field(..., min_length=1, max_length=2000)
    language: str = "mr"  # mr, hi, en
    crop_context: Optional[str] = None
    growth_stage_context: Optional[str] = None
    location_context: Optional[str] = None
    field_id: Optional[int] = None

class ChatMessageOut(BaseModel):
    id: int
    session_id: str
    sender: str
    content: str
    language: str
    is_demo: bool
    sources: List[ChatSource] = []
    structured_advice: Optional[ChatStructuredAdvice] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ChatResponse(BaseModel):
    session_id: str
    message: ChatMessageOut
    suggested_follow_ups: List[str] = []
    provider: str
