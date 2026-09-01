from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Experiment
from app.services.report_pdf import build_research_pdf

router = APIRouter(tags=["reports"])


@router.get("/experiments/{experiment_id}/report.pdf")
def download_report(experiment_id: int, db: Session = Depends(get_db)):
    exp = db.scalar(
        select(Experiment)
        .where(Experiment.id == experiment_id)
        .options(selectinload(Experiment.personas))
    )
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    try:
        pdf_bytes = build_research_pdf(db, exp)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=500, detail=f"PDF generation failed: {exc}"
        ) from exc

    filename = f"research-report-{experiment_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
