from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies.auth import get_current_user, get_optional_user
from app.models.user import User
from app.repositories.field_repository import FieldRepository
from app.schemas.field import (
    FieldCreate,
    FieldUpdate,
    FieldOut,
    ObservationCreate,
    ObservationOut
)

router = APIRouter(tags=["My Fields & Farmer Diary"])

@router.get("/fields", response_model=List[FieldOut])
def get_fields(
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    repo = FieldRepository(db)
    fields = repo.get_all(owner_id=user.id if user else None)
    return [FieldOut.model_validate(f) for f in fields]

@router.post("/fields", response_model=FieldOut, status_code=status.HTTP_201_CREATED)
def create_field(
    field_in: FieldCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    repo = FieldRepository(db)
    field = repo.create(field_in, owner_id=user.id)
    return FieldOut.model_validate(field)

@router.get("/fields/{field_id}", response_model=FieldOut)
def get_field(
    field_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    repo = FieldRepository(db)
    field = repo.get_by_id(field_id, owner_id=user.id if user else None)
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Field with ID {field_id} not found."
        )
    return FieldOut.model_validate(field)

@router.patch("/fields/{field_id}", response_model=FieldOut)
def update_field(
    field_id: int,
    field_in: FieldUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    repo = FieldRepository(db)
    field = repo.update(field_id, field_in, owner_id=user.id)
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Field with ID {field_id} not found."
        )
    return FieldOut.model_validate(field)

@router.delete("/fields/{field_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_field(
    field_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    repo = FieldRepository(db)
    success = repo.delete(field_id, owner_id=user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Field with ID {field_id} not found."
        )
    return None

@router.post("/fields/{field_id}/observations", response_model=ObservationOut, status_code=status.HTTP_201_CREATED)
def add_observation(
    field_id: int,
    obs_in: ObservationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    repo = FieldRepository(db)
    obs = repo.add_observation(field_id, obs_in, owner_id=user.id)
    if not obs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Field with ID {field_id} not found."
        )
    return ObservationOut.model_validate(obs)

@router.get("/fields/{field_id}/observations", response_model=List[ObservationOut])
def get_observations(
    field_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    repo = FieldRepository(db)
    observations = repo.get_observations(field_id, owner_id=user.id if user else None)
    return [ObservationOut.model_validate(o) for o in observations]
