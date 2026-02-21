# Phase 3 → Launch Plan

## IMPORTANT: Same Codebase

All code lives in `viz/`. The `CLAUDE.md` in this directory has the full architecture, build commands, and file layout.

```bash
npm run dev                                    # Frontend at localhost:5173/global-viz/
source api/venv/bin/activate
python -m uvicorn api.main:app --port 8000     # API at localhost:8000
```

## Completed (Week 9 — Simulation Polish)

- [x] Selective branch expansion (pinnedPaths) with single-child pruning + skip-edges
- [x] Parent aggregate effects: affected-only mean + coverage ratio
- [x] Border gating: leaf |pct| >= 0.5%, parent coverage >= 15% + |pct| >= 1.0%, top-K per ring
- [x] Saturating-curve border widths (skinny, proportional, no balloon)
- [x] Coverage-based opacity for parent borders
- [x] Subtle glow for ineligible parents
- [x] Ring compression via parent remapping (natural radii calculation)
- [x] Temporal edge count badge per intervention
- [x] Simulation error enrichment (base year context)
- [x] Baseline year warning in InterventionBuilder

## Priority Order — Through Launch and Beyond

### 1. Simulation on Timeline Playback
- Show simulation results organically during timeline scrubbing
- Node sizes reflect simulated values as the year advances through the projection range
- Borders/glows update per-year from `temporalResults.effects[year_YYYY]`
- Smooth interpolation between years (reuse timeline player infrastructure)
- Key files: `App.tsx` (getSize, playback mode), `simulationStore.ts` (currentYear)

### 2. Pre-built Scenario Library
- WHO health targets, Education MDGs, Infrastructure investment bundles
- Stored as JSON in `public/data/scenario_templates/`
- Loaded into InterventionBuilder via a "Templates" dropdown
- Each template: name, description, list of interventions with indicator IDs + change %
- Uses existing `SavedScenario` format from `simulationStore.ts`

### 3. Export Suite
- **PNG**: `html2canvas` or `dom-to-image` on SVG container
- **CSV**: Serialize simulation results table (indicator, baseline, change, final value)
- **Shareable URL**: Encode state in URL hash (country, interventions, year range, stratum)
- New component: `src/components/ExportMenu.tsx`

### 4. 2D + Globe Map Integration
- Choropleth world map showing country-level simulation results
- 3D globe option (Three.js or deck.gl)
- Click country on map → loads that country's graph
- Color-coded by simulation effect magnitude or SHAP importance
- Could use existing country list + classification data

### 5. Regional Views
- Aggregate results by region (Sub-Saharan Africa, SE Asia, Latin America, etc.)
- Region-level SHAP importance and simulation effects
- Drill down from region → country
- Requires region classification data (may already exist in income classifications)

### 6. 3D Global Graph View
- Radial viz rendered in 3D with depth and rotation
- Fly-through navigation along causal chains
- Three.js or react-three-fiber
- Major architectural addition — likely separate component/route

### 7. Polish, Tutorial, Animations
- Guided first-visit tutorial (tooltip-based walkthrough)
- Smooth transition animations for all state changes
- Loading skeletons for data-dependent views
- Empty states with helpful prompts
- Animation timing refinement (expand/collapse feels natural)

### 8. Mobile Support
- Responsive layout for tablets and phones
- Touch interactions (pinch-zoom, tap-to-expand)
- Simplified radial viz for small screens (fewer rings, larger nodes)
- Bottom sheet for simulation panel on mobile
- Test on iOS Safari + Chrome Android

### 9. Accessibility
- ARIA attributes on all interactive elements
- Keyboard navigation (Tab through nodes, Enter to expand)
- Screen reader descriptions for graph state
- High-contrast mode
- Color-blind safe palette option
- Focus indicators

### 10. Security & Safety
- CORS production gating (remove wildcard `*`, ENV-based allowlist)
- Rate limiting on API endpoints
- Input sanitization on simulation parameters
- ENV-based config for API URLs and secrets
- CSP headers
- Audit console.log removal (use debug.ts gating)

### 11. Methodology Page
- Standalone `/methodology` route (not a panel)
- Explains: PC algorithm, SHAP attribution, temporal bootstrapping, data sources
- Written for policy audience (not stats PhDs)
- Downloadable as PDF
- Citation generator (BibTeX, APA)

### 12. Sensitivity Analysis & Multi-Target Optimization
- Perturb edge weights by user-specified % (+/-10%, +/-20%)
- Run N ensemble simulations via `n_ensemble_runs` param (backend ready)
- Confidence intervals on results table
- Multi-target optimization (Pareto frontier across competing outcomes)

### 13. Public-Facing API
- Documented REST API for external consumers
- API key authentication
- Rate limits per key
- OpenAPI/Swagger docs
- Usage examples and SDKs
- Versioned endpoints (v1, v2)

## Architecture Context

```
viz/
├── src/
│   ├── App.tsx                              # Main radial viz + D3 rendering
│   ├── stores/simulationStore.ts            # Zustand state
│   ├── services/api.ts                      # API client
│   └── components/simulation/
│       ├── SimulationPanel.tsx               # Container for sim UI
│       ├── CountrySelector.tsx              # 178 countries
│       ├── InterventionBuilder.tsx          # Intervention cards
│       ├── SimulationRunner.tsx             # Run button, scenarios
│       └── ResultsPanel.tsx                 # Results table
├── simulation/                              # V3.1 simulation engine
├── api/
│   ├── routers/simulation.py               # V3.1 endpoints
│   ├── services/simulation_service.py      # Bridges to simulation engine
│   └── config.py                           # Paths, CORS, timeouts
```

## Audit Notes (carry forward)

- **S1**: CORS wildcard `*` in `api/config.py:91` — address in item 10
- **Q2**: Console.logs always on — address in item 10
- **Q4**: Race condition in `setCountry` — needs AbortController
- **U1**: No ARIA attributes — address in item 9
- **U4**: Dual-thumb slider overlap — address in item 7

## Backlog (unscheduled, revisit later)

- Scenario comparison (overlay mode) — two scenarios side-by-side with diff view
- Country comparison mode — side-by-side country graphs
- Education/guided mode — simplified interface for non-technical users
- PWA support — offline capability, installable app
