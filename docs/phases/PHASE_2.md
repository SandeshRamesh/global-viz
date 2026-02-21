# Phase 2: Practitioner Features - Path 4

**Timeline:** Weeks 5-6

**Objective:** Enable policy practitioners to run scenarios quickly

**Target Users:** Path 4 (Practitioner) - government officials, policy advisors, city planners

---

## Implementation Status

### Section 4: Country Selector + Static Exploration ✅ COMPLETE

**Completed 2024-12-30:**

- [x] **CountrySelector.tsx** - Searchable dropdown with 203 countries
  - Type-to-filter search
  - Coverage indicator (% of edges with data)
  - Clear selection button
  - Click-outside to close dropdown (capture phase)
  - Auto-close on hover away (900ms delay)
  - Loading states
  - Persists in both Global and Local views

- [x] **API Integration** - V3.0 backend serves country-specific data
  - `GET /api/graph/{country}` returns edges, baseline values, and SHAP importance
  - Country-specific SHAP importance (174 countries with ~1600 indicators each)

- [x] **Node Sizing Pipeline** - Country-specific SHAP-based sizing
  - Ring 5: Direct country SHAP values (0-1 normalized)
  - Ring 0-4: SUM aggregation of children's SHAP
  - Normalized so Root = 1.0 (preserves size hierarchy)
  - Uses Phase 1 viewport-aware layout pipeline

- [x] **Node Filtering** - Remove nodes without country data
  - Nodes without coverage are removed (not dimmed)
  - Parent nodes kept if any child has data
  - Layout recomputes for filtered node set

- [x] **Local View Edge Weights** - Country-specific β coefficients
  - Hierarchical edges from unified model
  - Causal edges with country-specific betas

- [x] **UX Polish** (completed 2024-12-30)
  - Reset (R key) now clears country selection back to unified model
  - Text direction changes instantly (no spinning animation on country switch)
  - Text-anchor updates properly when nodes cross 90° boundary
  - Beta slider: pointer capture for smooth dragging outside slider bounds
  - Controls panel always visible in Local View (even in empty state)
  - Beta slider persists when threshold filters all edges

---

## Country Context System ✅ COMPLETE

- [x] Country selector dropdown (203 countries)
- [x] Load country-specific data values (indicators populate with actual numbers)
- [x] Country selector visible in all views (Global, Local, Split)
- [x] Reset clears country and returns to unified model
- [ ] Map integration (highlight selected country on world map) - *deferred*
- [ ] Regional comparison toggle (show regional averages) - *deferred*

---

## Pre-Built Scenario Library

- [ ] WHO Health Scenario (increase health expenditure +15%)
- [ ] World Bank Education Scenario (universal primary enrollment)
- [ ] IMF Economic Scenario (progressive taxation)
- [ ] UNEP Environment Scenario (renewable energy transition)
- [x] Custom Scenario Builder (user-defined interventions)

---

## Simulation Mode (UI Only)

- [x] "Run Simulation" button (triggers intervention propagation)
- [x] Node glow feedback (red/green for decrease/increase)
- [ ] Intensity scaling (glow brightness = magnitude of change)
- [x] Results summary panel (before/after comparison table)

**Note:** Actual simulation backend not required - this phase shows mock results or uses pre-computed scenarios from SHAP scores.

---

## Scenario Comparison

- [ ] Side-by-side scenario A vs B view (split screen Local View)
- [ ] Difference highlighting (nodes that change between scenarios)
- [ ] Export comparison (PowerPoint slide deck auto-generator)

---

## Deliverables

- [ ] `CountrySelector.jsx` (dropdown + map)
- [ ] `ScenarioLibrary.jsx` (pre-built scenarios panel)
- [ ] `SimulationRunner.jsx` (UI feedback system)
- [ ] `ComparisonView.jsx` (side-by-side layout)
- [ ] PowerPoint export template

---

## Success Metrics

- [ ] 5+ pre-built scenarios
- [ ] Scenario comparison functional
- [ ] PowerPoint export working
