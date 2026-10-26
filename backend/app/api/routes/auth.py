import hmac
import secrets
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.api.dependencies.auth import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.field import Field, Observation
from app.models.user import User
from app.schemas.auth import DemoLoginRequest, LoginRequest, RegisterRequest, UserOut
from app.services.auth.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Accounts"])
_COOKIE_NAME = "kisansathi_session"
_DEMO_EMAIL = "hackathon-demo@kisansathi.local"


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.APP_ENV == "production",
        samesite="lax",
        max_age=14 * 24 * 60 * 60,
        path="/",
    )


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    if payload.email == _DEMO_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email is reserved for the hackathon demo account.",
        )
    try:
        user = auth_service.register(db, payload)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        ) from exc
    _set_session_cookie(response, auth_service.create_session(db, user))
    return user


@router.post("/demo-login", response_model=UserOut)
def demo_login(
    payload: DemoLoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    if not settings.DEMO_LOGIN_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demo sign-in is not available.",
        )
    if not hmac.compare_digest(payload.otp, settings.DEMO_LOGIN_OTP):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The demo code is incorrect. Please check the code and try again.",
        )

    user = db.query(User).filter(User.email == _DEMO_EMAIL).first()
    if user is None:
        user = auth_service.register(
            db,
            RegisterRequest(
                name="Hackathon Demo Farmer",
                email=_DEMO_EMAIL,
                password=secrets.token_urlsafe(32),
            ),
        )

    existing_demo_fields = (
        db.query(Field)
        .filter(Field.owner_id == user.id)
        .count()
    )
    if existing_demo_fields == 0:
        source_fields = (
            db.query(Field)
            .filter(Field.is_demo.is_(True), Field.owner_id.is_(None))
            .all()
        )
        for source in source_fields:
            demo_field = Field(
                owner_id=user.id,
                is_demo=False,
                name=source.name,
                location=source.location,
                crop=source.crop,
                planting_date=source.planting_date,
                area=source.area,
                area_unit=source.area_unit,
                growth_stage=source.growth_stage,
                notes=source.notes,
            )
            db.add(demo_field)
            db.flush()
            db.add_all([
                Observation(
                    field_id=demo_field.id,
                    date=observation.date,
                    growth_stage=observation.growth_stage,
                    notes=observation.notes,
                    photo_url=observation.photo_url,
                    created_at=observation.created_at,
                )
                for observation in source.observations
            ])
        db.commit()

    _set_session_cookie(response, auth_service.create_session(db, user))
    return user


@router.post("/login", response_model=UserOut)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    user = auth_service.authenticate(db, payload.email, payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email or password is incorrect.",
        )
    _set_session_cookie(response, auth_service.create_session(db, user))
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    raw_token = request.cookies.get(_COOKIE_NAME)
    if raw_token:
        auth_service.revoke_session(db, raw_token)
    response.delete_cookie(
        key=_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=settings.APP_ENV == "production",
        samesite="lax",
    )
    response.status_code = status.HTTP_204_NO_CONTENT
    return None


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
