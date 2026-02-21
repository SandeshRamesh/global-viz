# Semantic Hierarchy Visualization (Phase 3)

Interactive D3 + React visualization with simulation controls backed by the v3.1 FastAPI backend.

## Repo Layout

- `src/` — frontend application code.
- `api/` — backend API and tests.
- `docs/` — architecture, plans, reports, runbooks.
- `scripts/` — dev and CI helper scripts.
- `deploy/` — deployment scaffolding (docker/nginx/env templates).

## Quick Start

### Frontend

```bash
npm install
npm run dev
```

Open [http://localhost:5174](http://localhost:5174).

### Backend

```bash
cd api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

## Quality Checks

```bash
npm run lint
npm run build
api/venv/bin/python -m pytest api/tests -q
```

## Simulation Endpoints

Canonical:
- `POST /api/simulate/v31`
- `POST /api/simulate/v31/temporal`

Compatibility aliases (deprecated):
- `POST /api/simulate` → `/api/simulate/v31`
- `POST /api/simulate/temporal` → `/api/simulate/v31/temporal`

## Core References

- Repo organization reference for Claude Code:
  - `docs/architecture/CLAUDE_CODE_REPO_REFERENCE.md`
- Roadmap:
  - `docs/plans/roadmap.md`
- Current phase plan/progress:
  - `docs/plans/phase4-cinematic-plan.md`
  - `docs/reports/phase4-progress.md`
