from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import Experiment, Persona, SurveyQuestion, SurveyResponse
from app.prompts.survey import build_survey_prompt
from app.schemas import SurveyAnswerLLM
from app.services.llm import extract_json, invoke_json, invoke_text
from app.services.memory import format_persona_block


def _normalize_sentiment(value: str | None) -> str:
    s = (value or "neutral").strip().lower()
    if "positive" in s or s in {"yes", "good", "favorable"}:
        return "positive"
    if "negative" in s or s in {"no", "bad", "unfavorable"}:
        return "negative"
    if s in {"positive", "neutral", "negative"}:
        return s
    return "neutral"


def _parse_survey_payload(raw: object) -> tuple[str, str]:
    """Accept dict/list/str model output and return (answer, sentiment)."""
    data = raw
    if isinstance(data, str):
        try:
            data = extract_json(data)
        except ValueError:
            return data.strip() or "(No answer)", "neutral"

    if isinstance(data, list) and data:
        data = data[0]

    if isinstance(data, dict):
        # Nested shapes occasionally returned by smaller models
        if "answer" in data and isinstance(data["answer"], dict):
            data = data["answer"]
        parsed = SurveyAnswerLLM.model_validate(
            {
                "answer": data.get("answer") or data.get("response") or data.get("text") or "",
                "sentiment": data.get("sentiment") or data.get("tone") or "neutral",
            }
        )
        answer = str(parsed.answer).strip()
        # If answer itself is JSON, unwrap once
        if answer.startswith("{") and '"answer"' in answer:
            try:
                inner = extract_json(answer)
                if isinstance(inner, dict) and inner.get("answer"):
                    return str(inner["answer"]).strip(), _normalize_sentiment(
                        inner.get("sentiment")
                    )
            except ValueError:
                pass
        return answer or "(No answer)", _normalize_sentiment(parsed.sentiment)

    return str(data).strip() or "(No answer)", "neutral"


def run_survey(
    db: Session,
    experiment: Experiment,
    personas: list[Persona],
    question_text: str,
) -> SurveyQuestion:
    q = SurveyQuestion(experiment_id=experiment.id, question=question_text)
    db.add(q)
    db.flush()

    for persona in personas:
        prompt = build_survey_prompt(
            product_name=experiment.product_name,
            product_description=experiment.product_description,
            research_objective=experiment.research_objective,
            persona_block=format_persona_block(persona),
            question=question_text,
        )
        try:
            raw = invoke_json(prompt)
            answer, sentiment = _parse_survey_payload(raw)
        except Exception:  # noqa: BLE001
            try:
                text = invoke_text(prompt)
                answer, sentiment = _parse_survey_payload(text)
            except Exception as exc:  # noqa: BLE001
                answer = f"(Could not generate answer: {exc})"
                sentiment = "neutral"

        db.add(
            SurveyResponse(
                question_id=q.id,
                persona_id=persona.id,
                answer=answer,
                sentiment=sentiment,
            )
        )

    db.commit()
    db.refresh(q)
    return q
