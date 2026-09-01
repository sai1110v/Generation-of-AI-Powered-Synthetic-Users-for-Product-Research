from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Experiment(Base):
    __tablename__ = "experiments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    product_description: Mapped[str] = mapped_column(Text, nullable=False)
    target_audience: Mapped[str] = mapped_column(Text, nullable=False)
    research_objective: Mapped[str] = mapped_column(Text, nullable=False)
    persona_count: Mapped[int] = mapped_column(Integer, default=5)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    personas: Mapped[list["Persona"]] = relationship(
        back_populates="experiment", cascade="all, delete-orphan"
    )
    survey_questions: Mapped[list["SurveyQuestion"]] = relationship(
        back_populates="experiment", cascade="all, delete-orphan"
    )
    interview_messages: Mapped[list["InterviewMessage"]] = relationship(
        back_populates="experiment", cascade="all, delete-orphan"
    )
    insight_reports: Mapped[list["InsightReport"]] = relationship(
        back_populates="experiment", cascade="all, delete-orphan"
    )


class Persona(Base):
    __tablename__ = "personas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    experiment_id: Mapped[int] = mapped_column(ForeignKey("experiments.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    gender: Mapped[str] = mapped_column(String(80), default="")
    occupation: Mapped[str] = mapped_column(String(255), nullable=False)
    location: Mapped[str] = mapped_column(String(255), default="")
    goals: Mapped[str] = mapped_column(Text, default="")  # JSON array string
    pain_points: Mapped[str] = mapped_column(Text, default="")  # JSON array string
    traits: Mapped[str] = mapped_column(Text, default="")  # JSON array string
    behaviour_patterns: Mapped[str] = mapped_column(Text, default="")  # JSON array string
    psychological_profile: Mapped[str] = mapped_column(Text, default="")
    memory_notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    experiment: Mapped["Experiment"] = relationship(back_populates="personas")
    survey_responses: Mapped[list["SurveyResponse"]] = relationship(
        back_populates="persona", cascade="all, delete-orphan"
    )
    interview_messages: Mapped[list["InterviewMessage"]] = relationship(
        back_populates="persona", cascade="all, delete-orphan"
    )


class SurveyQuestion(Base):
    __tablename__ = "survey_questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    experiment_id: Mapped[int] = mapped_column(ForeignKey("experiments.id"), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    experiment: Mapped["Experiment"] = relationship(back_populates="survey_questions")
    responses: Mapped[list["SurveyResponse"]] = relationship(
        back_populates="question", cascade="all, delete-orphan"
    )


class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("survey_questions.id"), nullable=False)
    persona_id: Mapped[int] = mapped_column(ForeignKey("personas.id"), nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    sentiment: Mapped[str] = mapped_column(String(40), default="neutral")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    question: Mapped["SurveyQuestion"] = relationship(back_populates="responses")
    persona: Mapped["Persona"] = relationship(back_populates="survey_responses")


class InterviewMessage(Base):
    __tablename__ = "interview_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    experiment_id: Mapped[int] = mapped_column(ForeignKey("experiments.id"), nullable=False)
    persona_id: Mapped[int] = mapped_column(ForeignKey("personas.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # user | assistant
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    experiment: Mapped["Experiment"] = relationship(back_populates="interview_messages")
    persona: Mapped["Persona"] = relationship(back_populates="interview_messages")


class InsightReport(Base):
    __tablename__ = "insight_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    experiment_id: Mapped[int] = mapped_column(ForeignKey("experiments.id"), nullable=False)
    themes: Mapped[str] = mapped_column(Text, default="")  # JSON array
    sentiment_summary: Mapped[str] = mapped_column(Text, default="")
    agreement_disagreement: Mapped[str] = mapped_column(Text, default="")
    behaviour_trends: Mapped[str] = mapped_column(Text, default="")
    product_validation_score: Mapped[float] = mapped_column(Float, default=0.0)
    raw_json: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    experiment: Mapped["Experiment"] = relationship(back_populates="insight_reports")
