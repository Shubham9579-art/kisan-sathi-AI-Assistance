import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.auth_session import AuthSession
from app.models.user import User
from app.schemas.auth import RegisterRequest

_PBKDF2_ITERATIONS = 600_000
SESSION_LIFETIME = timedelta(days=14)
_DUMMY_SALT = bytes(32)


class AuthService:
    def register(self, db: Session, data: RegisterRequest) -> User:
        salt = secrets.token_bytes(32)
        password_hash = hashlib.pbkdf2_hmac(
            "sha256",
            data.password.encode("utf-8"),
            salt,
            _PBKDF2_ITERATIONS,
        )
        user = User(
            name=data.name,
            email=data.email,
            password_hash=password_hash.hex(),
            password_salt=salt.hex(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def authenticate(self, db: Session, email: str, password: str) -> User | None:
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            hashlib.pbkdf2_hmac(
                "sha256",
                password.encode("utf-8"),
                _DUMMY_SALT,
                _PBKDF2_ITERATIONS,
            )
            return None
        candidate_hash = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            bytes.fromhex(user.password_salt),
            _PBKDF2_ITERATIONS,
        ).hex()
        return user if hmac.compare_digest(candidate_hash, user.password_hash) else None

    def create_session(self, db: Session, user: User) -> str:
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        db.query(AuthSession).filter(AuthSession.expires_at <= now).delete(
            synchronize_session=False
        )
        db.add(
            AuthSession(
                token_hash=token_hash,
                user_id=user.id,
                expires_at=now + SESSION_LIFETIME,
            )
        )
        db.commit()
        return raw_token

    def revoke_session(self, db: Session, raw_token: str) -> None:
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        session = db.query(AuthSession).filter(AuthSession.token_hash == token_hash).first()
        if session:
            db.delete(session)
            db.commit()


auth_service = AuthService()
