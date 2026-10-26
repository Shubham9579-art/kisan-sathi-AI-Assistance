from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.field import Field, Observation
from app.schemas.field import FieldCreate, FieldUpdate, ObservationCreate

class FieldRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, owner_id: Optional[int] = None) -> List[Field]:
        query = self.db.query(Field)
        query = query.filter(Field.owner_id == owner_id) if owner_id else query.filter(Field.is_demo.is_(True))
        return query.order_by(Field.id.desc()).all()

    def get_by_id(self, field_id: int, owner_id: Optional[int] = None) -> Optional[Field]:
        query = self.db.query(Field).filter(Field.id == field_id)
        query = query.filter(Field.owner_id == owner_id) if owner_id else query.filter(Field.is_demo.is_(True))
        return query.first()

    def create(self, field_data: FieldCreate, owner_id: int) -> Field:
        field = Field(**field_data.model_dump(), owner_id=owner_id, is_demo=False)
        self.db.add(field)
        self.db.commit()
        self.db.refresh(field)
        return field

    def update(self, field_id: int, field_data: FieldUpdate, owner_id: int) -> Optional[Field]:
        field = self.get_by_id(field_id, owner_id)
        if not field:
            return None
        
        update_data = field_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(field, key, value)
            
        self.db.commit()
        self.db.refresh(field)
        return field

    def delete(self, field_id: int, owner_id: int) -> bool:
        field = self.get_by_id(field_id, owner_id)
        if not field:
            return False
        self.db.delete(field)
        self.db.commit()
        return True

    def add_observation(self, field_id: int, obs_data: ObservationCreate, owner_id: Optional[int] = None) -> Optional[Observation]:
        field = self.get_by_id(field_id, owner_id)
        if not field:
            return None
        
        obs = Observation(
            field_id=field_id,
            date=obs_data.date,
            growth_stage=obs_data.growth_stage or field.growth_stage,
            notes=obs_data.notes,
            photo_url=obs_data.photo_url
        )
        self.db.add(obs)
        self.db.commit()
        self.db.refresh(obs)
        return obs

    def get_observations(self, field_id: int, owner_id: Optional[int] = None) -> List[Observation]:
        if not self.get_by_id(field_id, owner_id):
            return []
        return self.db.query(Observation).filter(Observation.field_id == field_id).order_by(Observation.created_at.desc()).all()
