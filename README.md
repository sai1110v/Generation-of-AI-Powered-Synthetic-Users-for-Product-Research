<div align="center">

<img src="frontend/src/assets/research-lens.webp" alt="Abstract visualization of multiple synthetic user perspectives" width="100%" />

# Generation of AI Powered Synthetic Users for Product Research

### Grounded, multi-agent product research—without keeping a local LLM running

[![Live App](https://img.shields.io/badge/Live_App-Open-7c3aed?style=for-the-badge&logo=cloudflarepages&logoColor=white)](https://synthetic-user-generator.pages.dev)
[![React](https://img.shields.io/badge/React_19-20232a?style=for-the-badge&logo=react&logoColor=61dafb)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-111827?style=for-the-badge)](https://langchain-ai.github.io/langgraph/)
[![Groq](https://img.shields.io/badge/Groq-gpt--oss--20b-f55036?style=for-the-badge)](https://groq.com/)

Create research experiments, generate synthetic personas, run surveys and
interviews, ground agent responses in uploaded evidence, synthesize insights,
and export a research report from one workspace.

[Live application](https://synthetic-user-generator.pages.dev) ·
[Quick start](#quick-start) ·
[Architecture](#architecture) ·
[API](#api-surface) ·
[Deployment](#free-cloud-deployment)

</div>

> [!NOTE]
> The hosted application uses free service tiers. The first request after an
> idle period can take longer, and provider rate limits may apply.

## What this project does

Traditional user research is valuable but can be slow to organize during the
earliest stages of product discovery. This platform gives product teams a
structured way to explore assumptions with AI-generated research participants
before—and alongside—research with real people.

It is designed as a complete research workflow rather than a standalone persona
generator:

1. Define a product, target audience, and research objective.
2. Upload source research to an experiment-scoped knowledge base.
3. Generate diverse synthetic personas with consistent memories.
4. Run surveys or conduct persona-by-persona interviews.
5. Route grounded tasks through specialized LangGraph agents.
6. Synthesize themes, sentiment, and validation signals.
7. Review the dashboard and download a PDF report.

> [!IMPORTANT]
> Synthetic users accelerate hypothesis exploration; they do not replace
> research with real users for consequential product decisions.

## Highlights

| Capability | What it provides |
|---|---|
| Experiment workspaces | Product context, audience, objective, status, and deletion controls |
| Synthetic personas | Rich profiles, motivations, frustrations, goals, behaviours, and persistent memory |
| Survey research | Ask one question across every persona and compare responses |
| Interview research | Chat with individual personas while retaining conversation history |
| Voice experience | Browser-native text-to-speech and a live speaking visualizer—no paid voice API |
| Multi-agent workflows | LangGraph supervisor routing to persona, survey, and insight specialists |
| Grounded generation | Experiment-scoped RAG over TXT, Markdown, PDF, and DOCX research sources |
| Research synthesis | Themes, sentiment, evidence-backed findings, and a validation score |
| Reporting | Dashboard visualizations plus downloadable PDF research reports |
| Durable cloud state | PostgreSQL, pgvector retrieval, and persisted LangGraph checkpoints |

## Architecture

```mermaid
flowchart LR
    U["Product researcher"] --> UI["React + Vite UI (Cloudflare Pages)"]
    UI -- "HTTPS / JSON" --> API["FastAPI service (FastAPI Cloud)"]

    API --> EXP["Experiment services"]
    API --> GRAPH["LangGraph supervisor"]
    API --> RAG["RAG pipeline"]
    API --> REPORT["ReportLab PDF"]

    GRAPH --> PA["Persona agent"]
    GRAPH --> SA["Survey agent"]
    GRAPH --> IA["Insight agent"]

    PA --> LLM["Groq API (openai/gpt-oss-20b)"]
    SA --> LLM
    IA --> LLM

    RAG --> DB[(Supabase PostgreSQL + pgvector)]
    EXP --> DB
    GRAPH --> DB
    REPORT --> DB
```

### What serves what

| Layer | Technology | Responsibility |
|---|---|---|
| Web client | React 19, Vite, Tailwind CSS, Axios, Recharts | Research workflow, persona interactions, charts, voice controls |
| API | FastAPI, Pydantic, SQLAlchemy | Validation, REST endpoints, business logic, persistence |
| Agent orchestration | LangGraph | Supervisor routing, shared workflow state, durable checkpoints |
| LLM | Groq + `openai/gpt-oss-20b` | Persona generation, responses, and synthesis |
| Retrieval | Feature-hashed vectors + pgvector | Local, no-key embedding and experiment-scoped similarity search |
| Database | SQLite locally; Supabase PostgreSQL in production | Experiments, personas, messages, documents, vectors, and workflow state |
| Reports | ReportLab | Downloadable PDF research reports |
| Hosting | Cloudflare Pages + FastAPI Cloud | Static frontend CDN and managed Python API |

## Multi-agent workflow

Every workflow starts with retrieval. Relevant document chunks are added to the
shared state before the supervisor selects a specialist.

```mermaid
flowchart TD
    Q["Research task"] --> K["Retrieve experiment evidence"]
    K --> S{"LangGraph supervisor"}
    S -- "persona" --> P["Persona agent"]
    S -- "survey" --> V["Survey agent"]
    S -- "insight" --> I["Insight agent"]
    P --> O["Grounded result"]
    V --> O
    I --> O
    O --> C["Persist result, sources, status, and checkpoints"]
```

- **Persona agent** generates or refines research participants using the brief
  and retrieved evidence.
- **Survey agent** produces and analyzes responses across the persona cohort.
- **Insight agent** synthesizes findings, sentiment, recurring themes, and
  supporting evidence.
- **Supervisor** chooses exactly one specialist for the requested workflow and
  maintains a traceable shared state.

## RAG design

Documents are isolated by experiment so evidence from one research project
cannot leak into another.

```text
TXT / MD / PDF / DOCX
        ↓
text extraction and normalization
        ↓
overlapping chunks
        ↓
deterministic 384-dimensional feature hashing
        ↓
SQLite vectors (local) or PostgreSQL pgvector (hosted)
        ↓
top-k experiment-scoped retrieval
        ↓
source metadata + grounded agent context
```

The embedding implementation runs inside the backend, requires no embedding API
key, and does not send uploaded source documents to a third-party embedding
service. Synthetic answers are not indexed as factual evidence, which prevents
the system from recursively treating generated claims as source truth.

## Quick start

### Prerequisites

- Python 3.12+
- Node.js 20+
- npm
- A free [Groq API key](https://console.groq.com/keys), or a supported local
  fallback

### 1. Clone and configure

```bash
git clone https://github.com/saipraneethpb1/synthetic-user-generator.git
cd synthetic-user-generator
python -m venv .venv
```

Activate the virtual environment:

```powershell
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
Copy-Item .env.example .env
```

```bash
# macOS / Linux
source .venv/bin/activate
cp .env.example .env
```

Add your Groq key to `.env`:

```env
LLM_PROVIDER=groq
GROQ_API_KEY=your_key_here
GROQ_MODEL=openai/gpt-oss-20b
```

> [!CAUTION]
> Never commit `.env`, database passwords, or API keys. Configure hosted values
> through the provider's secret environment-variable interface.

### 2. Start the API

```bash
pip install -r backend/requirements.txt
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API documentation: <http://localhost:8000/docs>
- Health check: <http://localhost:8000/health>

### 3. Start the web client

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

The frontend defaults to `http://localhost:8000`. To override it, create
`frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

## LLM providers

| Provider | Use case | Required configuration |
|---|---|---|
| Groq | Recommended cloud default; no laptop-hosted model | `LLM_PROVIDER=groq`, `GROQ_API_KEY`, `GROQ_MODEL` |
| Ollama | Fully local fallback | `LLM_PROVIDER=ollama`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL` |
| Gemini | Optional cloud fallback | `LLM_PROVIDER=gemini`, `GOOGLE_API_KEY`, `GEMINI_MODEL` |

Groq free-tier requests stop with a provider rate-limit error when the allowance
is exhausted. No paid OpenAI or Anthropic API is required.

## Configuration

Copy `.env.example` to `.env` at the repository root. The backend also accepts
an environment file inside `backend/`.

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./app.db` | Local or hosted database connection |
| `DATABASE_POOL_SIZE` | `5` | Persistent PostgreSQL pool size |
| `DATABASE_MAX_OVERFLOW` | `5` | Temporary PostgreSQL connections above the pool |
| `DATABASE_POOL_RECYCLE` | `300` | Connection recycle interval in seconds |
| `LLM_PROVIDER` | `groq` | `groq`, `ollama`, or `gemini` |
| `GROQ_API_KEY` | — | Groq credential; always store as a secret |
| `GROQ_MODEL` | `openai/gpt-oss-20b` | Groq-hosted open-weight model |
| `GROQ_BASE_URL` | Groq OpenAI-compatible endpoint | Groq API base URL |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Local Ollama server |
| `OLLAMA_MODEL` | `llama3.2` | Local Ollama model |
| `GOOGLE_API_KEY` | — | Optional Gemini credential |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Optional Gemini model |
| `CORS_ORIGINS` | Local Vite origins | Comma-separated trusted frontend origins |
| `RAG_CHUNK_SIZE` | `900` | Characters per document chunk |
| `RAG_CHUNK_OVERLAP` | `150` | Context overlap between chunks |
| `RAG_EMBEDDING_DIMENSIONS` | `384` | Feature-hashed vector dimensions |
| `RAG_DEFAULT_TOP_K` | `5` | Retrieved chunks per workflow |

## API surface

Interactive OpenAPI documentation is available at `/docs` on any running
backend.

<details>
<summary><strong>Experiments and personas</strong></summary>

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/experiments` | List research experiments |
| `POST` | `/experiments` | Create an experiment |
| `GET` | `/experiments/{experiment_id}` | Get an experiment |
| `DELETE` | `/experiments/{experiment_id}` | Delete an experiment and its dependent data |
| `POST` | `/generate-personas` | Create an experiment and personas from the guide contract |
| `POST` | `/experiments/{experiment_id}/generate-personas` | Generate personas for an experiment |
| `GET` | `/experiments/{experiment_id}/personas` | List experiment personas |

</details>

<details>
<summary><strong>Survey, interview, and insights</strong></summary>

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/experiments/{experiment_id}/survey` | Run a survey across personas |
| `GET` | `/experiments/{experiment_id}/surveys` | List survey runs |
| `POST` | `/experiments/{experiment_id}/personas/{persona_id}/chat` | Interview a persona |
| `GET` | `/experiments/{experiment_id}/personas/{persona_id}/chat` | Read interview history |
| `POST` | `/experiments/{experiment_id}/insights` | Generate research synthesis |
| `GET` | `/experiments/{experiment_id}/insights` | Get the latest synthesis |
| `GET` | `/experiments/{experiment_id}/dashboard` | Retrieve dashboard data |
| `GET` | `/experiments/{experiment_id}/report.pdf` | Download the PDF report |

</details>

<details>
<summary><strong>Knowledge and agent workflows</strong></summary>

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/experiments/{experiment_id}/documents` | Upload TXT, MD, PDF, or DOCX research |
| `GET` | `/experiments/{experiment_id}/documents` | List indexed sources |
| `DELETE` | `/experiments/{experiment_id}/documents/{document_id}` | Delete a source and its chunks |
| `POST` | `/experiments/{experiment_id}/rag/search` | Test experiment-scoped retrieval |
| `POST` | `/experiments/{experiment_id}/workflows` | Run the LangGraph supervisor |
| `GET` | `/experiments/{experiment_id}/workflows` | List persisted workflows |
| `GET` | `/experiments/{experiment_id}/workflows/{thread_id}` | Inspect workflow state and sources |

</details>

## Free cloud deployment

The deployed architecture does not depend on a developer laptop:

| Component | Free service | Production setting |
|---|---|---|
| Frontend | Cloudflare Pages | Root `frontend`, build `npm run build`, output `dist` |
| Backend | FastAPI Cloud Hobby | Root `backend`, Python 3.12 |
| Database | Supabase | PostgreSQL session pooler with `sslmode=require` |
| Vector search | Supabase | `vector` extension / pgvector |
| LLM | Groq | `openai/gpt-oss-20b` |

### Backend environment variables

Mark `DATABASE_URL` and `GROQ_API_KEY` as secrets:

```env
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@POOLER_HOST:5432/postgres?sslmode=require
LLM_PROVIDER=groq
GROQ_API_KEY=your_key
GROQ_MODEL=openai/gpt-oss-20b
GROQ_BASE_URL=https://api.groq.com/openai/v1
CORS_ORIGINS=https://synthetic-user-generator.pages.dev
```

### Frontend build variable

```env
VITE_API_URL=https://YOUR_BACKEND.fastapicloud.dev
```

The backend creates application tables and the pgvector column during startup.
The first agent workflow initializes durable LangGraph checkpoint tables.
`frontend/public/_redirects` provides the single-page application fallback for
direct navigation to nested routes.

## Validation checklist

After deployment:

- [ ] `/health` reports `status: ok`, `llm_ready: true`, and
      `database_ready: true`.
- [ ] A new experiment persists after a backend redeployment.
- [ ] Persona generation returns a diverse cohort.
- [ ] A TXT, Markdown, PDF, or DOCX file can be indexed.
- [ ] RAG search returns a phrase and source from the uploaded document.
- [ ] A LangGraph workflow records its result and retrieved sources.
- [ ] Survey, interview, synthesis, dashboard, and PDF export complete.
- [ ] An experiment can be deleted from the interface.

## Tests

```bash
cd backend
pytest -q
```

The backend test suite mocks LLM calls, so CI and local tests do not require a
live Groq, Gemini, or Ollama connection.

Frontend checks:

```bash
cd frontend
npm run lint
npm run build
```

## Project structure

```text
synthetic-user-generator/
├── backend/
│   ├── app/
│   │   ├── graphs/       # LangGraph supervisor and checkpoints
│   │   ├── rag/          # extraction, chunking, embeddings, retrieval
│   │   ├── routers/      # FastAPI route groups
│   │   ├── services/     # LLM, research, and report services
│   │   └── main.py       # API entrypoint
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── public/           # favicon and Pages SPA redirect
│   └── src/
│       ├── components/
│       ├── pages/
│       └── api/
├── .env.example
└── README.md
```

## Responsible use

- Treat generated participants and insights as hypotheses, not verified facts.
- Preserve retrieved-source metadata when presenting grounded conclusions.
- Do not upload confidential research unless the selected infrastructure and
  organizational policies permit it.
- Validate important product decisions with actual users and domain experts.

## Contributing

Issues and pull requests are welcome. Before submitting a change, run the
backend tests and frontend lint/build commands above. Never include `.env`, API
keys, database credentials, or participant-sensitive research files in a
commit.

---

<div align="center">

Built for faster, evidence-aware product discovery.

[Open the application](https://synthetic-user-generator.pages.dev) ·
[Back to top](#generation-of-ai-powered-synthetic-users-for-product-research)

</div>