import uuid
import json
from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.chat import ChatSession, ChatMessage
from app.schemas.chat import ChatStructuredAdvice, ChatSource

class ChatRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_or_create_session(
        self,
        session_id: Optional[str] = None,
        language: str = "mr",
        title: Optional[str] = None,
        owner_id: Optional[int] = None,
    ) -> ChatSession:
        if session_id:
            session = (
                self.db.query(ChatSession)
                .filter(ChatSession.id == session_id, ChatSession.owner_id == owner_id)
                .first()
            )
            if session:
                return session

        new_id = f"session_{uuid.uuid4().hex[:12]}"
        session = ChatSession(
            id=new_id,
            title=title or "New Farming Query",
            language=language,
            owner_id=owner_id,
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def add_message(
        self,
        session_id: str,
        sender: str,
        content: str,
        language: str = "mr",
        is_demo: bool = True,
        sources: Optional[List[ChatSource]] = None,
        structured_advice: Optional[ChatStructuredAdvice] = None
    ) -> ChatMessage:
        sources_json = json.dumps([s.model_dump() for s in sources], ensure_ascii=False) if sources else None
        structured_json = json.dumps(structured_advice.model_dump(), ensure_ascii=False) if structured_advice else None

        msg = ChatMessage(
            session_id=session_id,
            sender=sender,
            content=content,
            language=language,
            is_demo=is_demo,
            sources_json=sources_json,
            structured_json=structured_json
        )
        self.db.add(msg)
        self.db.commit()
        self.db.refresh(msg)
        return msg

    def get_session_messages(self, session_id: str, owner_id: int) -> List[ChatMessage]:
        session = (
            self.db.query(ChatSession)
            .filter(ChatSession.id == session_id, ChatSession.owner_id == owner_id)
            .first()
        )
        if not session:
            return []
        return self.db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()).all()

    def get_recent_messages(self, limit: int = 10, owner_id: Optional[int] = None) -> List[ChatMessage]:
        query = self.db.query(ChatMessage).join(ChatSession).filter(ChatMessage.sender == "assistant")
        if owner_id:
            query = query.filter(ChatSession.owner_id == owner_id)
        elif settings.DEMO_DATA_ENABLED:
            query = query.filter(ChatSession.is_demo.is_(True))
        else:
            return []
        return query.order_by(ChatMessage.created_at.desc()).limit(limit).all()
