# CLAUDE.md

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

Phase 2 visualization: React + TypeScript + Vite + D3.js with simulation mode for country-specific causal graphs.

**Tech Stack**: Zustand (state), D3 (viz), Fuse.js (search)

## Architecture

```
src/
├── components/
│   ├── simulation/           # CountrySelector, PlayBar, SimulationPanel, InterventionBuilder, ResultsPanel
│   ├── LocalView/            # DAG flow view
│   └── StrataTabs.tsx        # Income stratification tabs
├── stores/simulationStore.ts # Zustand state
├── services/api.ts           # API client
└── App.tsx                   # Main app + D3 rendering

api/
├── main.py                   # FastAPI entry
├── routers/                  # Route handlers
├── services/                 # Business logic
└── data -> ../export         # Symlink to data
```

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

## Current Work: Phase 3 (Weeks 9-11)

Phase 2 is complete as of 2026-02-18. Active development has moved to Phase 3.

**P0 - Critical (Phase 3):**
- [ ] Scenario comparison (overlay mode) - deferred from Phase 2
- [ ] Methodology panel (explain causal discovery approach)
- [ ] Sensitivity analysis (perturb edge weights, observe outcome variance)

**P1 - Important (Phase 3):**
- [ ] Click-node-to-intervene flow - deferred from Phase 2
- [ ] Top N quick filter for indicators - deferred from Phase 2
- [ ] Export suite (PNG, CSV, shareable URL)

**P2 - Nice-to-have (Phase 3):**
- [ ] Pre-built scenario templates (WHO, Education, Infrastructure) - deferred from Phase 2

## Key Constants

```typescript
// Preserve from Phase 1
DOMAIN_COLORS  // 9 domain color mappings
RING_LABELS    // ['Quality of Life', 'Outcomes', 'Coarse Domains', 'Fine Domains', 'Indicator Groups', 'Indicators']

// Phase 2
MAX_INTERVENTIONS = 5
API_MODE = 'local' | 'public'
```

## Data Structure

- **Temporal SHAP**: 35 years (1990-2024) x 178 countries
- **Income Strata**: Unified, Developing (<$4.5k), Emerging ($4.5k-$14k), Advanced (>$14k)
- **Graph edges**: Year-specific, country-specific, stratum-specific variants

## Completed: Phase 2 (Weeks 5-8)

**Weeks 5-6:**
- Income stratification (StrataTabs with dynamic counts)
- Timeline player (1990-2024 scrubbing, auto-collapse)
- Country selector (178 countries, region grouping, autocomplete)
- Temporal SHAP caching (smooth playback, no flash)

**Week 7:**
- Data Quality Panel (coverage, confidence, transitions)
- Local View temporal edges (year-aware edge updates)

**Week 8 - Simulation Enhancement:**
- Per-intervention year support: each intervention targets a specific year (staggered interventions)
- Timeline scrubber feeds default intervention year
- Simulation range control: dual-thumb slider for start/end year (1990-2030)
- Node glow effects: green/red proportional to simulation effect intensity on the radial viz
- Auto-expand: only branches containing intervened indicators expand after simulation
- Scenario save/load to localStorage (save name, country, interventions, year range; load restores full state)
- Backend: staggered intervention support via `interventions_by_year` in `temporal_simulation_v31.py`
- V3.1 API integration with year-specific temporal graphs

## Roadmap (See ROADMAP.md)

- Phase 3 (Weeks 9-11): Scenario comparison, methodology panel, sensitivity analysis, export suite
- Phase 4 (Weeks 12-14): Multi-target, country comparison, Pareto optimization
- Phase 5 (Weeks 15-18): Map overlay, 3D visualization
- Phase 6 (Weeks 19-24): Education mode, accessibility, PWA
