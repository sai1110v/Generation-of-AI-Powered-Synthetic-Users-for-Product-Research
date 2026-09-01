from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# ----- Experiments -----


class ExperimentCreate(BaseModel):
    product_name: str = Field(..., min_length=1, max_length=255)
    product_description: str = Field(..., min_length=1)
    target_audience: str = Field(..., min_length=1)
    research_objective: str = Field(..., min_length=1)
    persona_count: int = Field(default=5, ge=1, le=15)


class ExperimentOut(BaseModel):
    id: int
    product_name: str
    product_description: str
    target_audience: str
    research_objective: str
    persona_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ----- Personas -----


class GeneratePersonasRequest(BaseModel):
    """Guide contract for POST /generate-personas."""

    product_name: str
    product_description: str
    target_audience: str
    research_objective: str
    persona_count: int = Field(default=5, ge=1, le=15)


class PersonaOut(BaseModel):
    id: int
    name: str
    age: int
    gender: str = ""
    occupation: str
    location: str = ""
    goals: list[str] = []
    pain_points: list[str] = []
    traits: list[str] = []
    behaviour_patterns: list[str] = []
    psychological_profile: str = ""
    memory_notes: str = ""

    model_config = {"from_attributes": True}


class GeneratePersonasResponse(BaseModel):
    personas: list[PersonaOut]
    experiment_id: int | None = None


class PersonaLLMItem(BaseModel):
    """Schema the LLM must return for each persona."""

    name: str
    age: int
    gender: str = ""
    occupation: str
    location: str = ""
    goals: list[str] = []
    pain_points: list[str] = []
    traits: list[str] = []
    behaviour_patterns: list[str] = []
    psychological_profile: str = ""


class PersonaLLMList(BaseModel):
    personas: list[PersonaLLMItem]


# ----- Survey -----


class SurveyRequest(BaseModel):
    question: str = Field(..., min_length=1)


class SurveyResponseItem(BaseModel):
    persona_id: int
    persona_name: str
    answer: str
    sentiment: str = "neutral"


class SurveyOut(BaseModel):
    question_id: int
    question: str
    responses: list[SurveyResponseItem]


class SurveyAnswerLLM(BaseModel):
    answer: str
    sentiment: str = Field(default="neutral", description="positive | neutral | negative")


# ----- Interview -----


class InterviewRequest(BaseModel):
    message: str = Field(..., min_length=1)


class InterviewMessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class InterviewChatOut(BaseModel):
    reply: str
    history: list[InterviewMessageOut]


# ----- Insights -----


class InsightsOut(BaseModel):
    id: int
    themes: list[str]
    sentiment_summary: str
    agreement_disagreement: str
    behaviour_trends: str
    product_validation_score: float
    created_at: datetime


class InsightsLLM(BaseModel):
    themes: list[str] = []
    sentiment_summary: str = ""
    agreement_disagreement: str = ""
    behaviour_trends: str = ""
    product_validation_score: float = Field(default=50.0, ge=0, le=100)


# ----- Health / misc -----


class HealthOut(BaseModel):
    status: str
    llm_provider: str
    llm_ready: bool
    detail: str = ""


class DashboardOut(BaseModel):
    experiment: ExperimentOut
    personas: list[PersonaOut]
    survey_count: int
    interview_message_count: int
    latest_insights: InsightsOut | None
    occupation_distribution: dict[str, int]
    age_buckets: dict[str, int]
    sentiment_counts: dict[str, int]
    themes: list[str]


class ErrorDetail(BaseModel):
    detail: str
    extra: dict[str, Any] | None = None
