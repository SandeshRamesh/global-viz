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

## Completed: Phase 3 Simulation Polish (Week 9)

- Selective branch expansion (pinnedPaths): post-simulation shows only direct paths to affected indicators
- Parent aggregate effects: affected-only mean + coverage ratio (not diluted mean-with-zeros)
- Border gating: leaves need |pct| >= 0.5%, parents need coverage >= 15% AND |pct| >= 1.0%, top-K per ring
- Saturating-curve border widths: `width = minPx + maxExtraPx * (1 - e^(-|pct|/6))` — skinny, proportional
- Coverage-based opacity for parent borders (honest visual weight)
- Subtle glow for ineligible parents (faint hint without clutter)
- Single-child intermediate pruning with skip-edges
- Ring compression via parent remapping (compact layout, natural radii)
- Temporal edge count badge per intervention (causal edges in year X)
- Simulation error enrichment (base year context + suggested fix)
- Baseline year warning in InterventionBuilder

## Current Work: Phase 3 → Launch

Phase 2 complete as of 2026-02-18. Simulation polish complete 2026-02-19.
Remaining work follows this priority order through launch and beyond.

### Pre-Launch

1. **Simulation on timeline playback** — show simulation results organically during timeline scrubbing (node sizes reflect simulated values as year advances)
2. **Pre-built scenario library** — WHO health, Education MDGs, Infrastructure bundles as loadable templates
3. **Export suite** — PNG screenshot, CSV results, shareable URL with encoded state

### Launch Features

4. **2D + Globe map integration** — choropleth world map + 3D globe showing country-level simulation results geographically
5. **Regional views** — aggregate results by region (Sub-Saharan Africa, SE Asia, etc.)
6. **3D global graph view** — radial viz rendered in 3D with depth, rotation, fly-through

### Post-Launch Polish

7. **Polish, tutorial, animations** — guided first-visit tutorial, smooth transition animations, loading states
8. **Mobile support** — responsive layout, touch interactions, simplified views for small screens
9. **Accessibility** — ARIA attributes, keyboard navigation, screen reader support, color contrast

### Post-Launch Advanced

10. **Security & safety** — CORS production gating, rate limiting, input sanitization, ENV-based config
11. **Methodology page** — standalone `/methodology` route explaining PC algorithm, SHAP, temporal bootstrapping, limitations (policy audience)
12. **Sensitivity analysis & multi-target optimization** — edge weight perturbation, ensemble runs, confidence intervals, Pareto frontier across competing outcomes
13. **Public-facing API** — documented REST API with auth, rate limits, usage docs for external consumers

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

## Backlog (unscheduled, revisit later)

- Scenario comparison (overlay mode) — two scenarios side-by-side with diff view
- Country comparison mode — side-by-side country graphs
- Education/guided mode — simplified interface for non-technical users
- PWA support — offline capability, installable app
