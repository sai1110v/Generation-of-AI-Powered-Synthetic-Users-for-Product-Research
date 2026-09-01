def build_persona_prompt(
    product_name: str,
    product_description: str,
    target_audience: str,
    research_objective: str,
    persona_count: int,
) -> str:
    return f"""You are an expert user researcher creating synthetic research personas.

Product name: {product_name}
Product description: {product_description}
Target audience: {target_audience}
Research objective: {research_objective}

Generate exactly {persona_count} diverse, realistic personas that fit the target audience.
Personas must differ in demographics, motivations, tech comfort, and opinions about products like this.

Return ONLY valid JSON (no markdown fences) with this shape:
{{
  "personas": [
    {{
      "name": "string",
      "age": 21,
      "gender": "string",
      "occupation": "string",
      "location": "city, country",
      "goals": ["goal1", "goal2"],
      "pain_points": ["pain1", "pain2"],
      "traits": ["trait1", "trait2"],
      "behaviour_patterns": ["pattern1", "pattern2"],
      "psychological_profile": "2-4 sentence personality and decision style"
    }}
  ]
}}

Rules:
- Use realistic names from varied cultures when appropriate for the audience.
- ages must be integers.
- Each list should have 2-5 short items.
- Do not invent the product features beyond the description; ground pains/goals in real user needs.
"""
