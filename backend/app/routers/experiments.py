from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Experiment
from app.schemas import ExperimentCreate, ExperimentOut
from app.services.memory import persona_to_public_dict

router = APIRouter(prefix="/experiments", tags=["experiments"])


@router.post("", response_model=ExperimentOut)
def create_experiment(payload: ExperimentCreate, db: Session = Depends(get_db)):
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
    return exp


@router.get("", response_model=list[ExperimentOut])
def list_experiments(db: Session = Depends(get_db)):
    rows = db.scalars(select(Experiment).order_by(Experiment.id.desc())).all()
    return list(rows)


@router.get("/{experiment_id}")
def get_experiment(experiment_id: int, db: Session = Depends(get_db)):
    exp = db.scalar(
        select(Experiment)
        .where(Experiment.id == experiment_id)
        .options(selectinload(Experiment.personas))
    )
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return {
        "id": exp.id,
        "product_name": exp.product_name,
        "product_description": exp.product_description,
        "target_audience": exp.target_audience,
        "research_objective": exp.research_objective,
        "persona_count": exp.persona_count,
        "created_at": exp.created_at,
        "personas": [persona_to_public_dict(p) for p in exp.personas],
    }


@router.delete("/{experiment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experiment(experiment_id: int, db: Session = Depends(get_db)):
    exp = db.get(Experiment, experiment_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    db.delete(exp)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
