from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Experiment, Persona
from app.schemas import InterviewChatOut, InterviewMessageOut, InterviewRequest
from app.services.interview_agent import chat_with_persona, get_history
from app.services.llm import LLMNotReadyError

router = APIRouter(tags=["interview"])


@router.get(
    "/experiments/{experiment_id}/personas/{persona_id}/chat",
    response_model=list[InterviewMessageOut],
)
def get_chat_history(
    experiment_id: int,
    persona_id: int,
    db: Session = Depends(get_db),
):
    exp = db.get(Experiment, experiment_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    persona = db.scalar(
        select(Persona).where(
            Persona.id == persona_id, Persona.experiment_id == experiment_id
        )
    )
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    return get_history(db, experiment_id, persona_id)


@router.post(
    "/experiments/{experiment_id}/personas/{persona_id}/chat",
    response_model=InterviewChatOut,
)
def chat(
    experiment_id: int,
    persona_id: int,
    payload: InterviewRequest,
    db: Session = Depends(get_db),
):
    exp = db.get(Experiment, experiment_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    persona = db.scalar(
        select(Persona).where(
            Persona.id == persona_id, Persona.experiment_id == experiment_id
        )
    )
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")

    try:
        reply, history = chat_with_persona(db, exp, persona, payload.message)
    except LLMNotReadyError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Interview failed: {exc}") from exc

    return InterviewChatOut(reply=reply, history=history)
