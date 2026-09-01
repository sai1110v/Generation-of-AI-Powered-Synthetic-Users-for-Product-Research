"""Opt-in end-to-end smoke test that makes live Groq API calls."""

from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path


def main() -> None:
    backend_dir = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(backend_dir))

    handle, db_name = tempfile.mkstemp(prefix="synthetic-user-groq-", suffix=".db")
    os.close(handle)
    db_path = Path(db_name)
    db_path.unlink(missing_ok=True)
    os.environ["DATABASE_URL"] = f"sqlite:///{db_path.as_posix()}"

    try:
        from fastapi.testclient import TestClient

        from app.database import engine
        from app.main import app

        with TestClient(app) as client:
            health = client.get("/health")
            health.raise_for_status()
            health_data = health.json()
            assert health_data["llm_provider"] == "groq"
            assert health_data["llm_ready"] is True
            print("PASS health and Groq configuration")

            generated = client.post(
                "/generate-personas",
                json={
                    "product_name": "FocusFlow",
                    "product_description": "A distraction-reduction study planner",
                    "target_audience": "University students aged 18 to 25",
                    "research_objective": "Validate whether students would use the planner",
                    "persona_count": 2,
                },
            )
            generated.raise_for_status()
            generated_data = generated.json()
            assert len(generated_data["personas"]) == 2
            experiment_id = generated_data["experiment_id"]
            persona_id = generated_data["personas"][0]["id"]
            print("PASS live persona generation")

            survey = client.post(
                f"/experiments/{experiment_id}/survey",
                json={"question": "Would you use this product every week, and why?"},
            )
            survey.raise_for_status()
            assert len(survey.json()["responses"]) == 2
            print("PASS live multi-persona survey")

            interview = client.post(
                f"/experiments/{experiment_id}/personas/{persona_id}/chat",
                json={"message": "What would stop you from using it consistently?"},
            )
            interview.raise_for_status()
            assert interview.json()["reply"].strip()
            print("PASS live persona interview and memory persistence")

            insights = client.post(f"/experiments/{experiment_id}/insights")
            insights.raise_for_status()
            insight_data = insights.json()
            assert 0 <= insight_data["product_validation_score"] <= 100
            assert isinstance(insight_data["themes"], list)
            print("PASS live insight extraction")

            dashboard = client.get(f"/experiments/{experiment_id}/dashboard")
            dashboard.raise_for_status()
            assert dashboard.json()["survey_count"] == 1
            assert dashboard.json()["latest_insights"] is not None
            print("PASS dashboard aggregation")

            report = client.get(f"/experiments/{experiment_id}/report.pdf")
            report.raise_for_status()
            assert report.content.startswith(b"%PDF")
            print("PASS PDF report generation")
    finally:
        if "engine" in locals():
            engine.dispose()
        db_path.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
