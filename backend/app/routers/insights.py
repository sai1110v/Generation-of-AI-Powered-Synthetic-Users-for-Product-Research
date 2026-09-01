from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Experiment, InsightReport, InterviewMessage, SurveyQuestion
from app.schemas import DashboardOut, ExperimentOut, InsightsOut, PersonaOut
from app.services.insight_agent import generate_insights, report_to_dict
from app.services.llm import LLMNotReadyError
from app.services.memory import persona_to_public_dict

router = APIRouter(tags=["insights"])


def _insights_out(report: InsightReport) -> InsightsOut:
    d = report_to_dict(report)
    return InsightsOut(**d)


@router.post("/experiments/{experiment_id}/insights", response_model=InsightsOut)
def create_insights(experiment_id: int, db: Session = Depends(get_db)):
    exp = db.scalar(
        select(Experiment)
        .where(Experiment.id == experiment_id)
        .options(selectinload(Experiment.personas))
    )
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    try:
        report = generate_insights(db, exp)
    except LLMNotReadyError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=502, detail=f"Insight extraction failed: {exc}"
        ) from exc

    return _insights_out(report)


@router.get("/experiments/{experiment_id}/insights", response_model=InsightsOut | None)
def get_latest_insights(experiment_id: int, db: Session = Depends(get_db)):
    exp = db.get(Experiment, experiment_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    report = db.scalars(
        select(InsightReport)
        .where(InsightReport.experiment_id == experiment_id)
        .order_by(InsightReport.id.desc())
    ).first()
    if not report:
        return None
    return _insights_out(report)


@router.get("/experiments/{experiment_id}/dashboard", response_model=DashboardOut)
def dashboard(experiment_id: int, db: Session = Depends(get_db)):
    exp = db.scalar(
        select(Experiment)
        .where(Experiment.id == experiment_id)
        .options(selectinload(Experiment.personas))
    )
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    personas = list(exp.personas)
    occupation_distribution: dict[str, int] = {}
    age_buckets = {"18-24": 0, "25-34": 0, "35-44": 0, "45-54": 0, "55+": 0}
    for p in personas:
        occupation_distribution[p.occupation] = (
            occupation_distribution.get(p.occupation, 0) + 1
        )
        if p.age < 25:
            age_buckets["18-24"] += 1
        elif p.age < 35:
            age_buckets["25-34"] += 1
        elif p.age < 45:
            age_buckets["35-44"] += 1
        elif p.age < 55:
            age_buckets["45-54"] += 1
        else:
            age_buckets["55+"] += 1

    questions = db.scalars(
        select(SurveyQuestion)
        .where(SurveyQuestion.experiment_id == experiment_id)
        .options(selectinload(SurveyQuestion.responses))
    ).all()
    sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0}
    for q in questions:
        for r in q.responses:
            key = (r.sentiment or "neutral").lower()
            if key not in sentiment_counts:
                key = "neutral"
            sentiment_counts[key] += 1

    interview_count = (
        db.scalar(
            select(func.count())
            .select_from(InterviewMessage)
            .where(InterviewMessage.experiment_id == experiment_id)
        )
        or 0
    )

    report = db.scalars(
        select(InsightReport)
        .where(InsightReport.experiment_id == experiment_id)
        .order_by(InsightReport.id.desc())
    ).first()
    latest = _insights_out(report) if report else None
    themes = latest.themes if latest else []

    persona_outs = [PersonaOut(**persona_to_public_dict(p)) for p in personas]

    return DashboardOut(
        experiment=ExperimentOut.model_validate(exp),
        personas=persona_outs,
        survey_count=len(questions),
        interview_message_count=int(interview_count),
        latest_insights=latest,
        occupation_distribution=occupation_distribution,
        age_buckets=age_buckets,
        sentiment_counts=sentiment_counts,
        themes=themes,
    )
