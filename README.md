# Generation of AI Powered Synthetic Users for Product Research

AI-powered synthetic user research for product teams. Create experiments, generate realistic personas, run surveys and interviews, extract insights, and download a PDF report.

**Cost: $0 for light/demo usage.** Designed to stay within free service tiers.

## Features

- Experiment workspace (product, audience, research objective)
- Persona generation with rich profiles
- Persona memory for consistent opinions
- Survey mode (one question → all personas)
- Interview mode (chat with history + free browser voice so personas can talk aloud)
- Notion-style persona face cards (free DiceBear notionists avatars)
- Perplexity-style speaking orb while personas talk (browser TTS + live visualizer)
- Survey answers can be spoken with free browser text-to-speech (no paid voice APIs)
- Insight extraction (themes, sentiment, validation score)
- Dashboard charts
- Downloadable PDF research report

## Free stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, Tailwind CSS, Axios, Recharts |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Database | SQLite (default) |
| AI (cloud default) | Groq free tier + Apache-2.0 `gpt-oss-20b` |
| AI (local fallback) | [Ollama](https://ollama.com) + Llama 3.2 / Mistral |
| AI (public) | Gemini free tier via [Google AI Studio](https://aistudio.google.com/apikey) |
| PDF | ReportLab |

No paid OpenAI/Anthropic APIs required.

## Quick start (local)

### 1. LLM (pick one)

**Option A — Groq free tier (recommended for cloud deployment)**

1. Create a free API key at [Groq Console](https://console.groq.com/keys).
2. Set in `.env`:

```env
LLM_PROVIDER=groq
GROQ_API_KEY=your_key_here
GROQ_MODEL=openai/gpt-oss-20b
```

This runs the open-weight model in the cloud, so Ollama and your laptop do not
need to be running. Requests stop with a rate-limit error if the free allowance
is exhausted.

**Option B — Ollama (local fallback, fully free)**

1. Install [Ollama](https://ollama.com)
2. Pull a model:

```bash
ollama pull llama3.2
```

**Option C — Gemini free tier**

1. Create a free API key at [Google AI Studio](https://aistudio.google.com/apikey)
2. Set in `.env` (see below):

```env
LLM_PROVIDER=gemini
GOOGLE_API_KEY=your_key_here
```

### 2. Backend

```bash
# from repo root
python -m venv .venv

# Windows
.\.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r backend/requirements.txt
copy .env.example .env   # Windows: copy | Unix: cp .env.example .env

cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs  
Health: http://localhost:8000/health

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

Optional frontend env (`frontend/.env`):

```env
VITE_API_URL=http://localhost:8000
```

## Configuration

Copy `.env.example` to `.env` at the **repo root** or under `backend/` (both work if you set paths carefully; default is cwd when starting uvicorn).

| Variable | Default | Notes |
|----------|---------|--------|
| `DATABASE_URL` | `sqlite:///./app.db` | Local SQLite file |
| `LLM_PROVIDER` | `groq` | `groq`, `ollama`, or `gemini` |
| `GROQ_API_KEY` | empty | Required for the Groq cloud provider |
| `GROQ_MODEL` | `openai/gpt-oss-20b` | Apache-2.0 open-weight model |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | |
| `OLLAMA_MODEL` | `llama3.2` | |
| `GOOGLE_API_KEY` | empty | Free Gemini key |
| `GEMINI_MODEL` | `gemini-2.0-flash` | |
| `CORS_ORIGINS` | localhost Vite | Comma-separated origins |

## Main API

- `POST /experiments` — create experiment  
- `POST /generate-personas` — create experiment + personas (guide contract)  
- `POST /experiments/{id}/generate-personas` — generate personas  
- `POST /experiments/{id}/survey` — `{ "question": "..." }`  
- `POST /experiments/{id}/personas/{persona_id}/chat` — interview  
- `POST /experiments/{id}/insights` — extract insights  
- `GET /experiments/{id}/dashboard` — dashboard data  
- `GET /experiments/{id}/report.pdf` — download PDF  

## Accessible from anywhere (free)

### Path A — Free cloud hosts

1. Backend: deploy `backend/` on a [Render](https://render.com) free web service.  
   - Use the included `backend/Dockerfile` if needed.  
   - Set env: `LLM_PROVIDER=groq`, `GROQ_API_KEY=...`, `CORS_ORIGINS=https://your-frontend.pages.dev`  
   - Free Render services sleep after inactivity and their local SQLite files are ephemeral. Use this setup for demos; connect a free managed PostgreSQL service if experiment data must survive restarts.
2. Frontend: deploy Vite build to [Cloudflare Pages](https://pages.cloudflare.com) or [Vercel](https://vercel.com) free tier.  
   - Build command: `npm run build` (in `frontend/`)  
   - Output: `dist`  
   - Env: `VITE_API_URL=https://your-backend.onrender.com`  

### Path B — Cloudflare Tunnel (local Ollama + worldwide URL)

1. Run backend + frontend (or serve the built frontend) + Ollama on your machine.  
2. Install [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/) (free).  
3. Tunnel the backend (and frontend if needed):

```bash
cloudflared tunnel --url http://localhost:8000
```

Point the public frontend `VITE_API_URL` at the tunnel URL, and add that frontend origin to `CORS_ORIGINS`.

## Tests

```bash
# repo root, venv active
cd backend
pytest -q
```

LLM calls are mocked in unit tests so CI does not need Ollama.

## Project layout

```text
backend/     FastAPI app, agents, PDF
frontend/    React UI
README.md    This file (only markdown committed)
```

## Workflow

1. Create an experiment  
2. Generate personas  
3. Run survey and/or interview  
4. Generate insights  
5. Review dashboard  
6. Download PDF report  

## License

Use freely for learning and product research. No paid services are required to develop or run this project.