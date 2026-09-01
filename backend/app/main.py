from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.routers import experiments, insights, interview, personas, reports, survey
from app.schemas import HealthOut
from app.services.llm import check_llm_ready


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


settings = get_settings()

app = FastAPI(
    title="Synthetic User Generation Platform",
    description="Free-stack AI synthetic user research platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(experiments.router)
app.include_router(personas.router)
app.include_router(survey.router)
app.include_router(interview.router)
app.include_router(insights.router)
app.include_router(reports.router)


@app.get("/health", response_model=HealthOut)
def health():
    ready, detail = check_llm_ready()
    return HealthOut(
        status="ok" if ready else "degraded",
        llm_provider=settings.llm_provider,
        llm_ready=ready,
        detail=detail,
    )


@app.get("/")
def root():
    return {
        "name": "Synthetic User Generation Platform",
        "docs": "/docs",
        "health": "/health",
    }
