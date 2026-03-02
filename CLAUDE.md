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

## Current Work: Pre-Launch → Launch

Phase 2 complete 2026-02-18. Phase 3 sim polish complete 2026-02-19. Phase 4 sim UX complete 2026-02-20. Phase 5 pre-launch complete 2026-03-01. Map integration complete 2026-03-02.

### Completed Pre-Launch

2. ~~**Pre-built scenario library**~~ — **DONE** (2026-02-20)
3. ~~**Export suite**~~ — **DONE** (2026-03-01): PNG screenshot, CSV results, shareable URL with encoded state
4. ~~**2D + Globe map integration**~~ — **DONE** (2026-03-02): Choropleth world map with QoL heatmap, M-key toggle (hold/tap), dynamic QoL root node encoding (size, outline, interpolated score), smooth crossfade transitions

### Launch Features (current)

5. **Regional views** — aggregate results by region (Sub-Saharan Africa, SE Asia, etc.). Backend already supports `view_type: "regional"` in simulation endpoints (feature-flagged via `ENABLE_REGIONAL_VIEW`). Precomputed data exists: regional baselines, graphs, SHAP, stats across 11 regions. Frontend needs: region selector UI, regional graph rendering, regional simulation integration.
6. **3D global graph view** — radial viz rendered in 3D with depth, rotation, fly-through

### Post-Launch Polish

7. **Polish, tutorial, animations** — guided first-visit tutorial, smooth transition animations, loading states
8. **Mobile support** — responsive layout, touch interactions, simplified views for small screens
9. **Accessibility** — ARIA attributes, keyboard navigation, screen reader support, color contrast

### Post-Launch Advanced

10. **Security & safety** — CORS production gating, rate limiting, input sanitization, ENV-based config
11. **Methodology page** — standalone `/methodology` route explaining PC algorithm, SHAP, temporal bootstrapping, limitations
12. **Sensitivity analysis & multi-target optimization** — edge weight perturbation, ensemble runs, confidence intervals
13. **Public-facing API** — documented REST API with auth, rate limits, usage docs

## Completed Features

### Phase 6: Map Integration (2026-03-02)

- WorldMap choropleth with QoL heatmap (RdYlGn scale, country-level shading)
- M-key toggle: tap toggles, hold (≥250ms) peeks and reverts on release
- Smooth crossfade transitions (opacity-based, no z-index flash)
- Dynamic QoL root node: size encodes level (0.5-1.0), grey fill with RdYlGn outline
- QoL score interpolation across all years (1990-2024) — linear between known points, hold at edges
- QoL x/10 label below root node (70% size, 70% opacity)
- Ring 0 cyan pulse during simulation timeline playback
- Ref-based QoL node positioning (eliminates React re-renders during zoom/pan)
- Animated reset: collapse to root → 1s delay → expand ring 1
- Progressive pinning capped to keepCount (top N by magnitude)
- Subtler ring labels (10px, normal weight, 60% opacity)
- Export suite: PNG screenshot, CSV results, shareable URL with encoded state

### Phase 5: Pre-Launch Polish (Week 10, 2026-02-20)

- Pre-built scenario library: 17 curated policy templates (6 categories) with research-backed interventions
  - Templates: Bolsa Família, Nordic Welfare, Bangladesh Health, Thailand UCS, Rwanda Digital, Estonia eGov, Kenya M-Pesa, Vietnam Export, China Infra/WTO, Ethiopia Roads, India Agri/SSA, Energiewende, Korea Education, Georgia/Singapore Governance
  - TemplateSelector component with category-grouped dropdown, expandable description, collapsible outcomes/evidence panels
  - Template state in simulationStore: `activeTemplate`, `templateModified`, `applyTemplate()`, `resetTemplate()`, `clearTemplate()`
  - "Reset to policy defaults" button appears when user modifies template interventions
  - Hover tooltips on dropdown options showing full description
  - All templates validated against live API (100 indicators, all IDs exist)
- Draggable SimulationPanel: header-drag with viewport constraints (same pattern as DataQualityPanel)
- `C` hotkey clears both local view targets and simulation results + interventions
- `clearResults` also resets interventions, template state

### Phase 4: Simulation UX Polish (Week 10, 2026-02-20)

- Sim in Local View: intervention nodes center, negative effects left, positive right, organized by hop
- Edge pulse cascade: 3-tier CSS animations (near/mid/far) radiating from intervention via BFS hop distance
- Cyan intervention glow (`#00E5FF`): persists entire sim state, `intervention-pulse` CSS animation
- Node flash glow: red/green flash synced to edge ripple arrival at each ring
- Glow ring sync: all sim glow layers (intervention, ineligible, flash) now transition-match node animations
- Auto-zoom on sim node count change (global + local views)
- Zoom-to-node on results panel click (smooth 400ms pan)
- Hover cards with sim info (% change, year, coverage) for both global and local views
- Effects count slider (3-50, pre-simulation) controlling visible effect count
- `T` hotkey toggles timeline with auto-play
- Intervention slider range: -100% to +200%
- Clear results resets expansion to ring 1

### Phase 3: Simulation Polish (Week 9, 2026-02-19)

- Selective branch expansion (pinnedPaths): post-simulation shows only direct paths to affected indicators
- Parent aggregate effects: affected-only mean + coverage ratio
- Border gating: leaves |pct| >= 0.5%, parents coverage >= 15% AND |pct| >= 1.0%, top-K per ring
- Saturating-curve border widths: `width = minPx + maxExtraPx * (1 - e^(-|pct|/6))`
- Coverage-based opacity for parent borders
- Subtle glow for ineligible parents
- Single-child intermediate pruning with skip-edges
- Ring compression via parent remapping
- Temporal edge count badge per intervention
- Simulation error enrichment + baseline year warning

### Phase 2: Core Simulation (Weeks 5-8)

- Income stratification (StrataTabs with dynamic counts)
- Timeline player (1990-2024 scrubbing, auto-collapse)
- Country selector (178 countries, region grouping, autocomplete)
- Temporal SHAP caching (smooth playback, no flash)
- Data Quality Panel (coverage, confidence, transitions)
- Local View temporal edges (year-aware edge updates)
- Per-intervention year support (staggered interventions)
- Simulation range control (dual-thumb slider, 1990-2030)
- Node glow effects (green/red proportional to effect intensity)
- Auto-expand affected branches post-simulation
- Scenario save/load to localStorage
- V3.1 API integration with year-specific temporal graphs

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

- Scenario comparison (overlay mode) — two scenarios side-by-side with diff view
- Country comparison mode — side-by-side country graphs
- Education/guided mode — simplified interface for non-technical users
- PWA support — offline capability, installable app

# currentDate
Today's date is 2026-02-20.
