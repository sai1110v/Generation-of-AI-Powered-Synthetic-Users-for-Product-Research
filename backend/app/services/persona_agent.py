from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models import Experiment, Persona
from app.prompts.persona import build_persona_prompt
from app.schemas import PersonaLLMList
from app.services.llm import extract_json, invoke_json
from app.services.memory import dumps_list, persona_to_public_dict


def normalize_persona_llm_payload(raw: Any) -> PersonaLLMList:
    """Accept common LLM shapes: {personas:[...]}, bare [...], or nested wrappers."""
    data = raw
    if isinstance(data, str):
        data = extract_json(data)

    # Bare list of persona objects
    if isinstance(data, list):
        data = {"personas": data}

    if not isinstance(data, dict):
        raise ValueError(f"Unexpected persona payload type: {type(data).__name__}")

    # Common alternate keys
    if "personas" not in data:
        for key in ("data", "results", "items", "users", "synthetic_personas"):
            if key in data and isinstance(data[key], list):
                data = {"personas": data[key]}
                break
        else:
            # Single persona object at top level
            if "name" in data and "occupation" in data:
                data = {"personas": [data]}

    return PersonaLLMList.model_validate(data)


def generate_and_store_personas(
    db: Session,
    experiment: Experiment,
    *,
    replace: bool = True,
) -> list[Persona]:
    prompt = build_persona_prompt(
        product_name=experiment.product_name,
        product_description=experiment.product_description,
        target_audience=experiment.target_audience,
        research_objective=experiment.research_objective,
        persona_count=experiment.persona_count,
    )
    raw = invoke_json(prompt)
    parsed = normalize_persona_llm_payload(raw)

    if replace and experiment.personas:
        for p in list(experiment.personas):
            db.delete(p)
        db.flush()

    stored: list[Persona] = []
    for item in parsed.personas[: experiment.persona_count]:
        persona = Persona(
            experiment_id=experiment.id,
            name=item.name,
            age=item.age,
            gender=item.gender or "",
            occupation=item.occupation,
            location=item.location or "",
            goals=dumps_list(item.goals),
            pain_points=dumps_list(item.pain_points),
            traits=dumps_list(item.traits),
            behaviour_patterns=dumps_list(item.behaviour_patterns),
            psychological_profile=item.psychological_profile or "",
            memory_notes="",
        )
        db.add(persona)
        stored.append(persona)

    db.commit()
    for p in stored:
        db.refresh(p)
    return stored


def personas_as_dicts(personas: list[Persona]) -> list[dict]:
    return [persona_to_public_dict(p) for p in personas]
