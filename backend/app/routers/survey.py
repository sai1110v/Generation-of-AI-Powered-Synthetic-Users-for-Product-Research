from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Experiment, SurveyQuestion, SurveyResponse
from app.schemas import SurveyOut, SurveyRequest, SurveyResponseItem
from app.services.llm import LLMNotReadyError
from app.services.survey_agent import run_survey

router = APIRouter(tags=["survey"])


def _question_to_out(q: SurveyQuestion) -> SurveyOut:
    responses = []
    for r in q.responses:
        responses.append(
            SurveyResponseItem(
                persona_id=r.persona_id,
                persona_name=r.persona.name if r.persona else f"#{r.persona_id}",
                answer=r.answer,
                sentiment=r.sentiment,
            )
        )
    return SurveyOut(question_id=q.id, question=q.question, responses=responses)


@router.post("/experiments/{experiment_id}/survey", response_model=SurveyOut)
def create_survey(
    experiment_id: int,
    payload: SurveyRequest,
    db: Session = Depends(get_db),
):
    exp = db.scalar(
        select(Experiment)
        .where(Experiment.id == experiment_id)
        .options(selectinload(Experiment.personas))
    )
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    if not exp.personas:
        raise HTTPException(
            status_code=400, detail="Generate personas before running a survey"
        )

    try:
        q = run_survey(db, exp, list(exp.personas), payload.question)
    except LLMNotReadyError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Survey failed: {exc}") from exc

    q = db.scalar(
        select(SurveyQuestion)
        .where(SurveyQuestion.id == q.id)
        .options(
            selectinload(SurveyQuestion.responses).selectinload(SurveyResponse.persona)
        )
    )
    return _question_to_out(q)


@router.get("/experiments/{experiment_id}/surveys", response_model=list[SurveyOut])
def list_surveys(experiment_id: int, db: Session = Depends(get_db)):
    exp = db.get(Experiment, experiment_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    questions = db.scalars(
        select(SurveyQuestion)
        .where(SurveyQuestion.experiment_id == experiment_id)
        .options(
            selectinload(SurveyQuestion.responses).selectinload(SurveyResponse.persona)
        )
        .order_by(SurveyQuestion.id.asc())
    ).all()
    return [_question_to_out(q) for q in questions]
