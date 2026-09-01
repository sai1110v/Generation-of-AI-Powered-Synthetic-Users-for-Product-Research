from __future__ import annotations

import io
import json
from datetime import datetime, timezone

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import (
    Experiment,
    InsightReport,
    InterviewMessage,
    SurveyQuestion,
    SurveyResponse,
)
from app.services.memory import persona_to_public_dict


def _p(text: str, style: ParagraphStyle) -> Paragraph:
    safe = (text or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return Paragraph(safe.replace("\n", "<br/>"), style)


def build_research_pdf(db: Session, experiment: Experiment) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
        title=f"Research Report — {experiment.product_name}",
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "TitleCustom",
        parent=styles["Heading1"],
        fontSize=18,
        spaceAfter=12,
        textColor=colors.HexColor("#0f172a"),
    )
    h2 = ParagraphStyle(
        "H2Custom",
        parent=styles["Heading2"],
        fontSize=13,
        spaceBefore=14,
        spaceAfter=8,
        textColor=colors.HexColor("#1e293b"),
    )
    body = ParagraphStyle(
        "BodyCustom",
        parent=styles["BodyText"],
        fontSize=10,
        leading=14,
        spaceAfter=6,
    )
    small = ParagraphStyle(
        "SmallCustom",
        parent=styles["BodyText"],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#334155"),
    )

    story: list = []
    generated = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    story.append(_p("Synthetic User Research Report", title_style))
    story.append(_p(f"Product: {experiment.product_name}", body))
    story.append(_p(f"Generated: {generated}", small))
    story.append(Spacer(1, 8))

    story.append(_p("Experiment Overview", h2))
    story.append(_p(f"<b>Description:</b> {experiment.product_description}", body))
    story.append(_p(f"<b>Target audience:</b> {experiment.target_audience}", body))
    story.append(_p(f"<b>Research objective:</b> {experiment.research_objective}", body))

    # Personas
    story.append(_p("Personas", h2))
    for persona in experiment.personas:
        d = persona_to_public_dict(persona)
        story.append(
            _p(
                f"<b>{d['name']}</b> — {d['age']}, {d['occupation']} ({d['location']})",
                body,
            )
        )
        story.append(_p(f"Traits: {', '.join(d['traits'])}", small))
        story.append(_p(f"Goals: {', '.join(d['goals'])}", small))
        story.append(_p(f"Pain points: {', '.join(d['pain_points'])}", small))
        if d["psychological_profile"]:
            story.append(_p(d["psychological_profile"], small))
        story.append(Spacer(1, 4))

    # Survey
    questions = db.scalars(
        select(SurveyQuestion)
        .where(SurveyQuestion.experiment_id == experiment.id)
        .options(
            selectinload(SurveyQuestion.responses).selectinload(SurveyResponse.persona)
        )
        .order_by(SurveyQuestion.id.asc())
    ).all()
    if questions:
        story.append(_p("Survey Responses", h2))
        for q in questions:
            story.append(_p(f"<b>Q:</b> {q.question}", body))
            for r in q.responses:
                name = r.persona.name if r.persona else f"#{r.persona_id}"
                story.append(_p(f"<b>{name}</b> [{r.sentiment}]: {r.answer}", small))
            story.append(Spacer(1, 6))

    # Interviews summary
    messages = db.scalars(
        select(InterviewMessage)
        .where(InterviewMessage.experiment_id == experiment.id)
        .order_by(InterviewMessage.id.asc())
    ).all()
    if messages:
        story.append(_p("Interview Highlights", h2))
        for m in messages[:40]:
            who = "Researcher" if m.role == "user" else f"Persona #{m.persona_id}"
            story.append(_p(f"<b>{who}:</b> {m.content}", small))

    # Insights
    report = db.scalars(
        select(InsightReport)
        .where(InsightReport.experiment_id == experiment.id)
        .order_by(InsightReport.id.desc())
    ).first()
    if report:
        story.append(_p("Insights", h2))
        try:
            themes = json.loads(report.themes or "[]")
        except json.JSONDecodeError:
            themes = []
        story.append(
            _p(
                f"<b>Product validation score:</b> {report.product_validation_score:.1f} / 100",
                body,
            )
        )
        if themes:
            story.append(_p(f"<b>Themes:</b> {', '.join(str(t) for t in themes)}", body))
        story.append(_p(f"<b>Sentiment:</b> {report.sentiment_summary}", body))
        story.append(
            _p(f"<b>Agreement / disagreement:</b> {report.agreement_disagreement}", body)
        )
        story.append(_p(f"<b>Behaviour trends:</b> {report.behaviour_trends}", body))

        data = [
            ["Metric", "Value"],
            ["Validation score", f"{report.product_validation_score:.1f}"],
            ["Personas", str(len(experiment.personas))],
            ["Survey questions", str(len(questions))],
        ]
        table = Table(data, colWidths=[2.5 * inch, 3.5 * inch])
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#94a3b8")),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("PADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        story.append(Spacer(1, 10))
        story.append(table)

    story.append(Spacer(1, 16))
    story.append(
        _p(
            "Generated by Synthetic User Generation Platform (local / free stack).",
            small,
        )
    )

    doc.build(story)
    return buffer.getvalue()
