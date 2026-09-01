from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Experiment
from app.schemas import GeneratePersonasRequest, GeneratePersonasResponse
from app.services.llm import LLMNotReadyError
from app.services.memory import persona_to_public_dict
from app.services.persona_agent import generate_and_store_personas

router = APIRouter(tags=["personas"])


@router.post("/generate-personas", response_model=GeneratePersonasResponse)
def generate_personas_guide_contract(
    payload: GeneratePersonasRequest,
    db: Session = Depends(get_db),
):
    """Guide §8 contract: create experiment + generate personas in one call."""
    exp = Experiment(
        product_name=payload.product_name,
        product_description=payload.product_description,
        target_audience=payload.target_audience,
        research_objective=payload.research_objective,
        persona_count=payload.persona_count,
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)

    try:
        personas = generate_and_store_personas(db, exp, replace=True)
    except LLMNotReadyError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=502, detail=f"Persona generation failed: {exc}"
        ) from exc

    return {
        "personas": [persona_to_public_dict(p) for p in personas],
        "experiment_id": exp.id,
    }


@router.post(
    "/experiments/{experiment_id}/generate-personas",
    response_model=GeneratePersonasResponse,
)
def generate_personas_for_experiment(
    experiment_id: int,
    db: Session = Depends(get_db),
):
    exp = db.scalar(
        select(Experiment)
        .where(Experiment.id == experiment_id)
        .options(selectinload(Experiment.personas))
    )
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    try:
        personas = generate_and_store_personas(db, exp, replace=True)
    except LLMNotReadyError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=502, detail=f"Persona generation failed: {exc}"
        ) from exc

    return {
        "personas": [persona_to_public_dict(p) for p in personas],
        "experiment_id": exp.id,
    }


@router.get("/experiments/{experiment_id}/personas")
def list_personas(experiment_id: int, db: Session = Depends(get_db)):
    exp = db.scalar(
        select(Experiment)
        .where(Experiment.id == experiment_id)
        .options(selectinload(Experiment.personas))
    )
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return [persona_to_public_dict(p) for p in exp.personas]
