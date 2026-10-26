from datetime import datetime, timezone
import hashlib
from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.auth_session import AuthSession
from app.models.user import User


def get_optional_user(
    request: Request,
    db: Session = Depends(get_db),
) -> Optional[User]:
    raw_token = request.cookies.get("kisansathi_session")
    if not raw_token:
        return None

    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    session = (
        db.query(AuthSession)
        .filter(
            AuthSession.token_hash == token_hash,
            AuthSession.expires_at > datetime.now(timezone.utc).replace(tzinfo=None),
        )
        .first()
    )
    return session.user if session else None


def get_current_user(user: Optional[User] = Depends(get_optional_user)) -> User:
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign in to access private farm data.",
        )
    return user
