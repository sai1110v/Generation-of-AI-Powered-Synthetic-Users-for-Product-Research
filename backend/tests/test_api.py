import json
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import (
    Experiment,
    InsightReport,
    InterviewMessage,
    Persona,
    SurveyQuestion,
    SurveyResponse,
)
from app.config import Settings
from app.services.llm import invoke_text
from app.services.memory import dumps_list


@pytest.fixture()
def client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c, TestingSessionLocal
    app.dependency_overrides.clear()


def test_health(client):
    c, _ = client
    resp = c.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert "llm_provider" in data
    assert "llm_ready" in data


def test_create_experiment(client):
    c, _ = client
    resp = c.post(
        "/experiments",
        json={
            "product_name": "AI Study Planner",
            "product_description": "Plans study schedules",
            "target_audience": "College students",
            "research_objective": "Validate MVP",
            "persona_count": 3,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["product_name"] == "AI Study Planner"
    assert data["id"] >= 1


def test_list_and_get_experiment(client):
    c, Session = client
    resp = c.post(
        "/experiments",
        json={
            "product_name": "App",
            "product_description": "Desc",
            "target_audience": "Users",
            "research_objective": "Learn",
            "persona_count": 2,
        },
    )
    exp_id = resp.json()["id"]
    listed = c.get("/experiments")
    assert listed.status_code == 200
    assert any(e["id"] == exp_id for e in listed.json())

    got = c.get(f"/experiments/{exp_id}")
    assert got.status_code == 200
    assert got.json()["personas"] == []


def test_delete_experiment_cascades_related_research(client):
    c, Session = client
    db = Session()
    exp = Experiment(
        product_name="Disposable experiment",
        product_description="Delete all related records",
        target_audience="Test users",
        research_objective="Verify cascading deletion",
        persona_count=1,
    )
    persona = Persona(
        experiment=exp,
        name="Test Persona",
        age=30,
        occupation="Tester",
        goals="[]",
        pain_points="[]",
        traits="[]",
        behaviour_patterns="[]",
    )
    question = SurveyQuestion(experiment=exp, question="Delete me?")
    question.responses.append(
        SurveyResponse(persona=persona, answer="Yes", sentiment="positive")
    )
    exp.interview_messages.append(
        InterviewMessage(persona=persona, role="user", content="Test message")
    )
    exp.insight_reports.append(
        InsightReport(themes="[]", product_validation_score=50)
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    experiment_id = exp.id
    db.close()

    deleted = c.delete(f"/experiments/{experiment_id}")
    assert deleted.status_code == 204
    assert deleted.content == b""
    assert c.get(f"/experiments/{experiment_id}").status_code == 404

    db = Session()
    for model in (
        Experiment,
        Persona,
        SurveyQuestion,
        SurveyResponse,
        InterviewMessage,
        InsightReport,
    ):
        count = db.scalar(select(func.count()).select_from(model))
        assert count == 0
    db.close()

    missing = c.delete(f"/experiments/{experiment_id}")
    assert missing.status_code == 404


def test_generate_personas_mocked(client):
    c, _ = client
    fake = {
        "personas": [
            {
                "name": "Rahul",
                "age": 21,
                "gender": "male",
                "occupation": "Engineering Student",
                "location": "Mumbai, India",
                "goals": ["Pass exams"],
                "pain_points": ["Poor time management"],
                "traits": ["Budget conscious", "Tech savvy"],
                "behaviour_patterns": ["Studies at night"],
                "psychological_profile": "Motivated but anxious about deadlines.",
            }
        ]
    }
    with patch("app.services.persona_agent.invoke_json", return_value=fake):
        resp = c.post(
            "/generate-personas",
            json={
                "product_name": "AI Study Planner",
                "product_description": "AI assistant for planning study schedules",
                "target_audience": "College students",
                "research_objective": "Validate MVP",
                "persona_count": 1,
            },
        )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["personas"]) == 1
    assert data["personas"][0]["name"] == "Rahul"
    assert "Budget conscious" in data["personas"][0]["traits"]
    assert data["experiment_id"] is not None


def test_generate_personas_accepts_bare_list(client):
    """Ollama often returns a JSON array instead of {personas: [...]}."""
    c, _ = client
    fake_list = [
        {
            "name": "Leila Patel",
            "age": 21,
            "gender": "female",
            "occupation": "Student",
            "location": "Mumbai",
            "goals": ["Graduate"],
            "pain_points": ["Time"],
            "traits": ["Focused"],
            "behaviour_patterns": ["Night owl"],
            "psychological_profile": "Driven.",
        }
    ]
    with patch("app.services.persona_agent.invoke_json", return_value=fake_list):
        resp = c.post(
            "/generate-personas",
            json={
                "product_name": "App",
                "product_description": "Desc",
                "target_audience": "Students",
                "research_objective": "Test",
                "persona_count": 1,
            },
        )
    assert resp.status_code == 200
    assert resp.json()["personas"][0]["name"] == "Leila Patel"


def test_pdf_report(client):
    c, Session = client
    db = Session()
    exp = Experiment(
        product_name="Test Product",
        product_description="A test",
        target_audience="Students",
        research_objective="Validate",
        persona_count=1,
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    db.add(
        Persona(
            experiment_id=exp.id,
            name="Asha",
            age=22,
            gender="female",
            occupation="Student",
            location="Delhi",
            goals=dumps_list(["Learn faster"]),
            pain_points=dumps_list(["Distractions"]),
            traits=dumps_list(["Curious"]),
            behaviour_patterns=dumps_list(["Uses phone apps"]),
            psychological_profile="Optimistic learner.",
        )
    )
    db.commit()
    exp_id = exp.id
    db.close()

    resp = c.get(f"/experiments/{exp_id}/report.pdf")
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("application/pdf")
    assert resp.content[:4] == b"%PDF"


def test_groq_cloud_provider():
    settings = Settings(
        _env_file=None,
        llm_provider="groq",
        groq_api_key="test-key",
        groq_model="openai/gpt-oss-20b",
    )
    fake_response = patch("app.services.llm.httpx.Client").start()
    try:
        response = fake_response.return_value.__enter__.return_value.post.return_value
        response.raise_for_status.return_value = None
        response.json.return_value = {
            "choices": [{"message": {"content": "Cloud response"}}]
        }

        assert invoke_text("Hello", settings=settings) == "Cloud response"
        _, kwargs = fake_response.return_value.__enter__.return_value.post.call_args
        assert kwargs["json"]["model"] == "openai/gpt-oss-20b"
        assert kwargs["headers"]["Authorization"] == "Bearer test-key"
    finally:
        patch.stopall()
