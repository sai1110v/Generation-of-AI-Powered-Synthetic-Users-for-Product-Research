from __future__ import annotations

import json

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import (
    Experiment,
    InsightReport,
    InterviewMessage,
    SurveyQuestion,
    SurveyResponse,
)
from app.prompts.insights import build_insights_prompt
from app.schemas import InsightsLLM
from app.services.llm import invoke_json


def _collect_evidence(db: Session, experiment: Experiment) -> str:
    parts: list[str] = []

    questions = db.scalars(
        select(SurveyQuestion)
        .where(SurveyQuestion.experiment_id == experiment.id)
        .options(
            selectinload(SurveyQuestion.responses).selectinload(SurveyResponse.persona)
        )
        .order_by(SurveyQuestion.id.asc())
    ).all()

    for q in questions:
        parts.append(f"SURVEY Q: {q.question}")
        for r in q.responses:
            persona_name = r.persona.name if r.persona else f"persona#{r.persona_id}"
            parts.append(f"  - {persona_name} [{r.sentiment}]: {r.answer}")

    messages = db.scalars(
        select(InterviewMessage)
        .where(InterviewMessage.experiment_id == experiment.id)
        .order_by(InterviewMessage.id.asc())
    ).all()
    if messages:
        parts.append("INTERVIEW EXCERPTS:")
        for m in messages[:80]:
            who = "Researcher" if m.role == "user" else f"Persona#{m.persona_id}"
            parts.append(f"  {who}: {m.content}")

    if not parts:
        parts.append("No survey or interview data yet.")
    return "\n".join(parts)


def generate_insights(db: Session, experiment: Experiment) -> InsightReport:
    evidence = _collect_evidence(db, experiment)
    prompt = build_insights_prompt(
        product_name=experiment.product_name,
        product_description=experiment.product_description,
        target_audience=experiment.target_audience,
        research_objective=experiment.research_objective,
        evidence_block=evidence,
    )
    raw = invoke_json(prompt)
    parsed = InsightsLLM.model_validate(raw)
    score = float(parsed.product_validation_score)
    score = max(0.0, min(100.0, score))

    report = InsightReport(
        experiment_id=experiment.id,
        themes=json.dumps(parsed.themes, ensure_ascii=False),
        sentiment_summary=parsed.sentiment_summary,
        agreement_disagreement=parsed.agreement_disagreement,
        behaviour_trends=parsed.behaviour_trends,
        product_validation_score=score,
        raw_json=json.dumps(raw, ensure_ascii=False) if not isinstance(raw, str) else raw,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def report_to_dict(report: InsightReport) -> dict:
    try:
        themes = json.loads(report.themes or "[]")
        if not isinstance(themes, list):
            themes = []
    except json.JSONDecodeError:
        themes = []
    return {
        "id": report.id,
        "themes": [str(t) for t in themes],
        "sentiment_summary": report.sentiment_summary,
        "agreement_disagreement": report.agreement_disagreement,
        "behaviour_trends": report.behaviour_trends,
        "product_validation_score": report.product_validation_score,
        "created_at": report.created_at,
    }
