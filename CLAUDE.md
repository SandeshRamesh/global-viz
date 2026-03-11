# CLAUDE.md

## PRODUCTION MODE

**This project is LIVE at https://atlas.argonanalytics.org**

Before ANY commit/push:
1. **Review changes** - `git diff` and explain what changed
2. **Check for breaking changes** - API signatures, paths, imports
3. **Test locally first** - `curl` endpoints, check pages load
4. **Verify after deploy** - All health checks must pass

Deployment workflow:
```bash
# 1. Make changes
# 2. Test locally
# 3. Commit to live branch
# 4. Push to both branches: git push origin live && git push origin live:master
# 5. Rebuild Docker: cd /home/sandesh/argon_primary && docker-compose build atlas && docker-compose up -d atlas
# 6. Verify all endpoints respond
```

**IMPORTANT: Atlas runs on Docker, NOT systemd!**
- Container: `atlas` (ports 3005 + 8000)
- Rebuild required for file changes (files are baked into image)
- Do NOT use `systemctl` commands - they won't work

Live URLs to verify:
- Landing: https://atlas.argonanalytics.org
- App: https://atlas.argonanalytics.org/explore
- Research: https://atlas.argonanalytics.org/research
- API Health: https://api.argonanalytics.org/health

**If something breaks, notify user IMMEDIATELY.**

### Cloudflare Cache

Static assets (PDFs, images) are cached by Cloudflare. After deploying changes to static files:
- The deploy script automatically purges cache if `CLOUDFLARE_ZONE_ID` and `CLOUDFLARE_API_TOKEN` are set
- If cache purge fails or credentials aren't set, manually purge from Cloudflare dashboard
- **Always verify static file changes are live** - download and check, don't trust browser cache

Required env vars (set in shell or `/home/sandesh/argon_primary/.env`):
```bash
export CLOUDFLARE_ZONE_ID="your-zone-id"
export CLOUDFLARE_API_TOKEN="your-api-token"  # needs Cache Purge permission
```

### Port Cleanup

After deploying, check for stale processes on old ports:
```bash
# Check what's running on common dev ports
lsof -i :5173 -i :5174 -i :5175 -i :3000 -i :3001 -i :3002

# Kill stale dev servers if needed
pkill -f "vite"
pkill -f "npm run dev"
```

Production ports (do NOT kill):
- 3005: atlas-frontend (systemd)
- 8000: atlas-api (systemd)

---

## SSH Session Safety Rules

**CRITICAL**: Follow these rules to prevent session crashes:

1. **Never pipe curl directly** - save to file first: `curl -s -m 5 url > /tmp/out.json`
2. **Always use timeouts**: `curl -m 5`
3. **Limit output**: `head -c 500` or `head -20`
4. **Kill before starting**: `pkill -9 -f pattern` and verify
5. **Start servers with nohup**: `nohup uvicorn api.main:app --host 0.0.0.0 --port 8000 > /tmp/api.log 2>&1 &`

## Build & Dev

```bash
# Frontend (localhost:5173/global-viz/)
npm run dev

# Backend API (localhost:8000)
source api/venv/bin/activate
python -m uvicorn api.main:app --port 8000
```

Toggle API endpoint in `src/services/api.ts`: `API_MODE = 'local' | 'public'`

## Project Overview

Interactive causal graph visualization for development economics research. React + TypeScript + Vite + D3.js with simulation mode for country-specific causal graphs.

**Tech Stack**: Zustand (state), D3 (viz), Fuse.js (search)

## Repository Structure

```
viz/
├── src/                          # Frontend application code
│   ├── components/
│   │   ├── simulation/           # CountrySelector, SimulationPanel, InterventionBuilder,
│   │   │                         # SimulationRunner, TimelinePlayer, ResultsPanel, TemplateSelector
│   │   ├── LocalView/            # DAG flow view (structural + sim modes)
│   │   ├── ViewTabs.tsx          # Global/Local/Split view switcher
│   │   └── StrataTabs.tsx        # Income stratification tabs
│   ├── stores/simulationStore.ts # Zustand state (panel, country, interventions, playback)
│   ├── services/api.ts           # API client
│   ├── utils/causalEdges.ts      # buildLocalViewData + buildSimLocalViewData
│   ├── layouts/                  # RadialLayout.ts, LocalViewLayout.ts
│   ├── styles/App.css            # CSS animations (edge pulse, node flash, intervention glow)
│   └── App.tsx                   # Main app + D3 radial rendering (~4500 lines)
│
├── simulation/                   # V3.1 simulation engine (self-contained)
│   ├── graph_loader_v31.py       # Year-specific graph loading with fallback
│   ├── simulation_runner_v31.py  # Instant simulation runner
│   ├── temporal_simulation_v31.py # Multi-year temporal simulation
│   ├── propagation_v31.py        # Causal propagation engine
│   ├── indicator_stats.py        # Country-specific statistics
│   ├── income_classifier.py      # World Bank income classification
│   ├── regional_spillovers.py    # Regional spillover effects
│   └── saturation_functions.py   # Indicator saturation bounds
│
├── api/                          # FastAPI backend
│   ├── main.py                   # Entry point
│   ├── routers/                  # Route handlers
│   ├── services/                 # Business logic
│   └── config.py                 # Paths, CORS, timeouts
│
├── data/                         # Research data (~19GB, gitignored)
│   ├── v31/                      # V3.1 temporal outputs
│   │   ├── temporal_graphs/      # 17GB - year-specific causal graphs
│   │   ├── temporal_shap/        # 1.2GB - SHAP importance values
│   │   ├── baselines/            # 305MB - precomputed baselines
│   │   ├── development_clusters/
│   │   ├── feedback_loops/
│   │   └── metadata/
│   └── raw/                      # 70MB - from original research data
│       ├── v21_panel_data_for_v3.parquet
│       ├── v21_nodes.csv
│       └── v21_causal_edges.csv
│
├── docs/                         # Documentation
│   ├── architecture/             # CLAUDE_CODE_REPO_REFERENCE.md
│   ├── plans/                    # roadmap.md, phase plans, 3d-sandbox-spec.md
│   ├── reports/                  # phase4-progress.md, performance-report.md
│   ├── runbooks/                 # Operational runbooks
│   └── phases/                   # Historical phase implementation notes
│
├── deploy/                       # Deployment scaffolding
│   ├── docker/                   # Dockerfiles
│   ├── nginx/                    # SPA routing + reverse proxy
│   └── env/                      # .env.staging.example, .env.prod.example
│
├── scripts/                      # Automation
│   ├── dev/                      # analyze.cjs, test-layout.cjs
│   └── ci/                       # CI scripts
│
└── .github/workflows/            # CI/CD pipelines (ci.yml, deploy.yml)
```

**File placement rules** (see `docs/architecture/CLAUDE_CODE_REPO_REFERENCE.md`):
- Plans/RFCs → `docs/plans/`
- Progress/status reports → `docs/reports/`
- Utility scripts → `scripts/dev/`
- No ad-hoc docs at repo root

## Key API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/health` | Health check |
| `/api/countries` | List 203 countries |
| `/api/graph/{country}` | Country graph + SHAP + baseline |
| `/api/temporal/shap/{target}/timeline` | Unified SHAP all years |
| `/api/temporal/shap/{country}/{target}/timeline` | Country SHAP timeline |
| `/api/temporal/graph/{year}` | Unified graph for year |
| `/api/temporal/graph/{country}/{year}` | Country graph for year |
| `/api/simulate/v31` | V3.1 instant simulation |
| `/api/simulate/v31/temporal` | V3.1 temporal simulation |

## Roadmap & Progress

See `docs/plans/roadmap.md` for full phase history and feature details.

**Completed**: Phases 2–9A (Core Sim → Sim Polish → Sim UX → Pre-Launch → Map → Regional → Polish → Accessibility → Desktop Adaptive Layout)

**Next**: Phase 9B/C — Tablet & Mobile

**Pending fix**: Layout stability on single-node collapse — see `docs/plans/codex-layout-stability-fix.md`

## Key Constants

```typescript
DOMAIN_COLORS       // 9 domain color mappings
RING_LABELS         // ['Quality of Life', 'Outcomes', 'Coarse Domains', 'Fine Domains', 'Indicator Groups', 'Indicators']
MAX_INTERVENTIONS   // 5
API_MODE            // 'local' | 'public'
SIM_MS_PER_YEAR     // Animation speed per sim year
```

## Data Structure

- **Temporal SHAP**: 35 years (1990-2024) x 178 countries
- **Income Strata**: Unified, Developing (<$4.5k), Emerging ($4.5k-$14k), Advanced (>$14k)
- **Graph edges**: Year-specific, country-specific, stratum-specific variants
- **Indicator domains**: Development (38), Economic (24), Education (12), Environment (20), Governance (5)

## Backlog (unscheduled)

See `docs/plans/roadmap.md` → "Future Phases (BACKLOG)" for full list.
