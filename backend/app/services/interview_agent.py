from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Experiment, InterviewMessage, Persona
from app.prompts.interview import build_interview_system
from app.services.llm import invoke_text
from app.services.memory import format_persona_block


def get_history(
    db: Session,
    experiment_id: int,
    persona_id: int,
    *,
    limit: int = 40,
) -> list[InterviewMessage]:
    stmt = (
        select(InterviewMessage)
        .where(
            InterviewMessage.experiment_id == experiment_id,
            InterviewMessage.persona_id == persona_id,
        )
        .order_by(InterviewMessage.id.asc())
    )
    rows = list(db.scalars(stmt).all())
    if limit and len(rows) > limit:
        return rows[-limit:]
    return rows


def chat_with_persona(
    db: Session,
    experiment: Experiment,
    persona: Persona,
    user_message: str,
) -> tuple[str, list[InterviewMessage]]:
    history = get_history(db, experiment.id, persona.id)

    user_msg = InterviewMessage(
        experiment_id=experiment.id,
        persona_id=persona.id,
        role="user",
        content=user_message,
    )
    db.add(user_msg)
    db.flush()

    system = build_interview_system(
        product_name=experiment.product_name,
        product_description=experiment.product_description,
        research_objective=experiment.research_objective,
        persona_block=format_persona_block(persona),
    )

    # Build a single transcript prompt for models that work best with one human turn
    transcript_lines = []
    for m in history:
        label = "Researcher" if m.role == "user" else persona.name
        transcript_lines.append(f"{label}: {m.content}")
    transcript_lines.append(f"Researcher: {user_message}")
    transcript_lines.append(f"{persona.name}:")
    prompt = (
        "Continue the interview. Reply with only the persona's next message "
        "(no speaker label).\n\nTranscript:\n" + "\n".join(transcript_lines)
    )

    reply = invoke_text(prompt, system=system).strip()
    # Strip accidental speaker labels
    for prefix in (f"{persona.name}:", "Assistant:", "AI:"):
        if reply.startswith(prefix):
            reply = reply[len(prefix) :].strip()

    assistant_msg = InterviewMessage(
        experiment_id=experiment.id,
        persona_id=persona.id,
        role="assistant",
        content=reply,
    )
    db.add(assistant_msg)

    # Lightweight memory: append last exchange summary
    note = f"Q: {user_message[:120]} | A: {reply[:160]}"
    existing = (persona.memory_notes or "").strip()
    if existing:
        # keep last ~1500 chars
        persona.memory_notes = (existing + "\n" + note)[-1500:]
    else:
        persona.memory_notes = note

    db.commit()

    full = get_history(db, experiment.id, persona.id)
    return reply, full
