def build_insights_prompt(
    product_name: str,
    product_description: str,
    target_audience: str,
    research_objective: str,
    evidence_block: str,
) -> str:
    return f"""You are a senior UX researcher writing insights from synthetic user research.

Product: {product_name}
Description: {product_description}
Target audience: {target_audience}
Research objective: {research_objective}

Evidence from personas (survey answers and/or interviews):
{evidence_block}

Produce a concise research synthesis.

Return ONLY valid JSON (no markdown fences):
{{
  "themes": ["theme1", "theme2", "theme3"],
  "sentiment_summary": "overall sentiment paragraph",
  "agreement_disagreement": "where personas agree and disagree",
  "behaviour_trends": "notable behaviour and usage patterns",
  "product_validation_score": 72.5
}}

Rules:
- themes: 3-7 short labels grounded in the evidence.
- product_validation_score: 0-100 float (higher = stronger early validation for the research objective).
- Be balanced and specific; do not invent quotes that did not appear.
"""
