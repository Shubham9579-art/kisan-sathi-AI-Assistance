from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field as PField

class ObservationBase(BaseModel):
    date: str
    growth_stage: Optional[str] = None
    notes: str
    photo_url: Optional[str] = None

class ObservationCreate(ObservationBase):
    pass

class ObservationOut(ObservationBase):
    id: int
    field_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class FieldBase(BaseModel):
    name: str = PField(..., min_length=2, max_length=100)
    location: str = PField(..., min_length=2, max_length=150)
    crop: str = PField(..., min_length=2, max_length=100)
    planting_date: Optional[str] = None
    area: float = PField(gt=0, default=1.0)
    area_unit: str = "Acres"
    growth_stage: str = "Vegetative"
    notes: Optional[str] = None

class FieldCreate(FieldBase):
    pass

class FieldUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    crop: Optional[str] = None
    planting_date: Optional[str] = None
    area: Optional[float] = None
    area_unit: Optional[str] = None
    growth_stage: Optional[str] = None
    notes: Optional[str] = None

class FieldOut(FieldBase):
    id: int
    created_at: datetime
    updated_at: datetime
    observations: List[ObservationOut] = []

    class Config:
        from_attributes = True
