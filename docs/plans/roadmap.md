# ROADMAP.md

Development roadmap for the Global Project causal visualization tool (Phase 2 repo).

---

## Phase 2 — Simulation & Temporal Analysis (COMPLETE)

**Completed: 2026-02-18**

### Weeks 5-6
- Income stratification tabs (StrataTabs with dynamic country counts per stratum)
- Timeline player with 1990-2024 scrubbing and auto-collapse
- Country selector with 178 countries, region grouping, and Fuse.js autocomplete
- Temporal SHAP caching for smooth playback with no flash

### Week 7
- Data Quality Panel (coverage metrics, confidence bands, stratum transitions)
- Local View temporal edges (year-aware edge updates in DAG flow view)

### Week 8 — Simulation Enhancement
- Per-intervention year support: each intervention in a scenario can target a different year, enabling staggered policy simulations
- Timeline scrubber drives the default intervention year for newly added interventions
- Simulation range control: dual-thumb slider selecting start/end year (1990-2030)
- Node glow effects on the radial viz: green for positive effects, red for negative, intensity proportional to effect magnitude (sourced from `temporalResults.effects`)
- Auto-expand after simulation: only branches of the radial viz containing intervened indicators expand; unrelated branches stay collapsed
- Scenario save/load via localStorage: saves scenario name, country, full intervention list with per-intervention years, and year range; loading restores complete UI state
- Backend: `temporal_simulation_v31.py` updated with `interventions_by_year` support for staggered inputs
- V3.1 API integration with year-specific temporal graph lookups (`/api/simulate/v31/temporal`)

### Deferred to Phase 3
- Scenario comparison / overlay mode (was P0 Week 8)
- Click-node-to-intervene flow (was P1 Week 8)
- Top N quick filter for indicators (was P1 Week 8)
- Pre-built scenario templates (WHO, Education, Infrastructure) (was P2 Week 8)

---

## Phase 3 — Analysis Depth (Weeks 9-11)

Goal: Give researchers tools to interrogate and communicate causal findings.

### P0 — Critical
- **Scenario comparison (overlay mode)**: Run two scenarios side-by-side, overlay effect deltas on the radial viz with a split-color glow scheme
- **Methodology panel**: Explain the causal discovery approach (PC algorithm, SHAP attribution, temporal bootstrapping), targeted at a policy-audience reading level

### P1 — Important
- **Sensitivity analysis**: Perturb edge weights by a configurable percentage, observe variance in simulation outcomes to quantify robustness
- **Click-node-to-intervene flow**: Click any indicator node on the radial viz to pre-populate a new intervention in SimulationPanel
- **Top N quick filter**: Filter indicator list in InterventionBuilder to the top N by SHAP importance for the selected target
- **Export suite**: PNG snapshot of current viz, CSV of simulation results, shareable URL encoding scenario state

### P2 — Nice-to-have
- **Pre-built scenario templates**: Curated intervention bundles for WHO health targets, education investment, and infrastructure spending
- **Animated effect propagation**: Show causal chain lighting up step-by-step after simulation run

---

## Phase 4 — Multi-Target & Country Comparison (Weeks 12-14)

Goal: Enable comparative and multi-objective policy analysis.

- **Multi-target simulation**: Select multiple outcome targets; display joint effect surface
- **Country comparison view**: Run the same scenario across two countries, diff the outcome distributions side-by-side
- **Pareto optimization**: Given a budget constraint (max N interventions), surface the Pareto-optimal frontier of outcome tradeoffs

---

## Phase 5 — Geographic & 3D Visualization (Weeks 15-18)

Goal: Situate causal findings in geographic and dimensional space.

- **Map overlay**: Choropleth world map shaded by selected SHAP importance or simulation outcome magnitude, linked to country selector
- **3D causal graph**: Three.js or WebGL radial viz with depth encoding causal distance from target node
- **Region-level aggregation**: Collapse countries into regional averages for macro-level comparison

---

## Phase 6 — Education Mode & Accessibility (Weeks 19-24)

Goal: Broaden the audience beyond researchers to students and policymakers.

- **Education mode**: Step-by-step guided tour of the causal graph, explaining each domain ring and what it represents
- **Accessibility audit**: Full WCAG 2.1 AA compliance, keyboard navigation, screen reader labels on D3 elements
- **PWA (Progressive Web App)**: Offline capability via service worker; installable on desktop and mobile
- **Internationalization (i18n)**: Label translation infrastructure for at least French and Spanish

---

## API Version History

| Version | Endpoint prefix | Notes |
|---------|----------------|-------|
| V3.0 | `/api/simulate/` | Original simulation, uniform year |
| V3.1 | `/api/simulate/v31/` | Staggered interventions, year-specific temporal graphs |

---

## Key Architectural Constraints

- Temporal SHAP dataset: 35 years (1990-2024) x 178 countries — cache aggressively on frontend
- Max simultaneous interventions: 5 (`MAX_INTERVENTIONS` constant)
- Simulation year range: 1990-2030 (historical + 6-year projection)
- Income strata thresholds: Developing < $4,500 GDP/capita, Emerging $4,500-$14,000, Advanced > $14,000
