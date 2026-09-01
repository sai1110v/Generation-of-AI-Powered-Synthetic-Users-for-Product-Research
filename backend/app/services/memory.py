"""Persona memory helpers — keep identity consistent across sessions."""

from __future__ import annotations

import json

from app.models import Persona


def _parse_list(raw: str) -> list[str]:
    if not raw:
        return []
    try:
        data = json.loads(raw)
        if isinstance(data, list):
            return [str(x) for x in data]
    except json.JSONDecodeError:
        pass
    return [line.strip() for line in raw.split(",") if line.strip()]


def list_field(persona: Persona, field: str) -> list[str]:
    return _parse_list(getattr(persona, field, "") or "")


def persona_to_public_dict(persona: Persona) -> dict:
    return {
        "id": persona.id,
        "name": persona.name,
        "age": persona.age,
        "gender": persona.gender or "",
        "occupation": persona.occupation,
        "location": persona.location or "",
        "goals": list_field(persona, "goals"),
        "pain_points": list_field(persona, "pain_points"),
        "traits": list_field(persona, "traits"),
        "behaviour_patterns": list_field(persona, "behaviour_patterns"),
        "psychological_profile": persona.psychological_profile or "",
        "memory_notes": persona.memory_notes or "",
    }


def format_persona_block(persona: Persona) -> str:
    data = persona_to_public_dict(persona)
    lines = [
        f"Name: {data['name']}",
        f"Age: {data['age']}",
        f"Gender: {data['gender']}",
        f"Occupation: {data['occupation']}",
        f"Location: {data['location']}",
        f"Goals: {', '.join(data['goals'])}",
        f"Pain points: {', '.join(data['pain_points'])}",
        f"Traits: {', '.join(data['traits'])}",
        f"Behaviour patterns: {', '.join(data['behaviour_patterns'])}",
        f"Psychological profile: {data['psychological_profile']}",
    ]
    if data["memory_notes"]:
        lines.append(f"Memory notes (stay consistent): {data['memory_notes']}")
    return "\n".join(lines)


def dumps_list(items: list[str] | None) -> str:
    return json.dumps(items or [], ensure_ascii=False)
