from typing import List
import json
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.dependencies.auth import get_current_user, get_optional_user
from app.db.session import get_db
from app.models.user import User
from app.repositories.chat_repository import ChatRepository
from app.repositories.field_repository import FieldRepository
from app.services.ai.assistant_service import assistant_service
from app.schemas.chat import ChatRequest, ChatResponse, ChatMessageOut

router = APIRouter(tags=["AI Farming Assistant"])

@router.post("/chat", response_model=ChatResponse)
def post_chat_message(
    request: ChatRequest,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    chat_repo = ChatRepository(db)
    field_repo = FieldRepository(db)

    # Resolve field context if field_id provided
    crop_ctx = request.crop_context
    growth_stage_ctx = request.growth_stage_context
    location_ctx = request.location_context

    if request.field_id:
        f = field_repo.get_by_id(
            request.field_id,
            owner_id=user.id if user else None,
        )
        if not f:
            raise HTTPException(status_code=404, detail="Field not found.")
        crop_ctx = crop_ctx or f.crop
        growth_stage_ctx = growth_stage_ctx or f.growth_stage
        location_ctx = location_ctx or f.location

    session = None
    if user:
        session = chat_repo.get_or_create_session(
            session_id=request.session_id,
            language=request.language,
            title=request.message[:40] + ("..." if len(request.message) > 40 else ""),
            owner_id=user.id,
        )

        chat_repo.add_message(
            session_id=session.id,
            sender="user",
            content=request.message,
            language=request.language,
            is_demo=False
        )

    # 2. Generate assistant response
    summary, advice, sources, follow_ups, provider_label, is_demo = assistant_service.generate_response(
        user_message=request.message,
        language=request.language,
        crop_context=crop_ctx,
        growth_stage_context=growth_stage_ctx,
        location_context=location_ctx
    )

    # 3. Save assistant message to database
    session_id = session.id if session else f"demo_{uuid.uuid4().hex}"
    asst_msg = (
        chat_repo.add_message(
            session_id=session.id,
            sender="assistant",
            content=summary,
            language=request.language,
            is_demo=is_demo,
            sources=sources,
            structured_advice=advice
        )
        if session
        else None
    )

    msg_out = ChatMessageOut(
        id=asst_msg.id if asst_msg else int(uuid.uuid4().hex[:12], 16),
        session_id=session_id,
        sender=asst_msg.sender if asst_msg else "assistant",
        content=asst_msg.content if asst_msg else summary,
        language=asst_msg.language if asst_msg else request.language,
        is_demo=asst_msg.is_demo if asst_msg else is_demo,
        sources=sources,
        structured_advice=advice,
        created_at=asst_msg.created_at if asst_msg else datetime.now(timezone.utc)
    )

    return ChatResponse(
        session_id=session_id,
        message=msg_out,
        suggested_follow_ups=follow_ups,
        provider=provider_label
    )

@router.get("/chat/history", response_model=List[ChatMessageOut])
def get_chat_history(
    session_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    chat_repo = ChatRepository(db)
    messages = chat_repo.get_session_messages(session_id, owner_id=user.id)
    
    out: List[ChatMessageOut] = []
    for m in messages:
        sources = json.loads(m.sources_json) if m.sources_json else []
        structured = json.loads(m.structured_json) if m.structured_json else None
        out.append(ChatMessageOut(
            id=m.id,
            session_id=m.session_id,
            sender=m.sender,
            content=m.content,
            language=m.language,
            is_demo=m.is_demo,
            sources=sources,
            structured_advice=structured,
            created_at=m.created_at
        ))
    return out
