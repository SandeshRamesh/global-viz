# ROADMAP.md

Development roadmap for the Global Project causal visualization tool.

---

## Phase 2 — Simulation & Temporal Analysis (COMPLETE 2026-02-18)

- Income stratification tabs (StrataTabs with dynamic country counts per stratum)
- Timeline player with 1990-2024 scrubbing and auto-collapse
- Country selector with 178 countries, region grouping, and Fuse.js autocomplete
- Temporal SHAP caching for smooth playback
- Data Quality Panel (coverage metrics, confidence bands, stratum transitions)
- Local View temporal edges (year-aware edge updates in DAG flow view)
- Per-intervention year support (staggered policy simulations)
- Simulation range control (dual-thumb slider, 1990-2030)
- Node glow effects (green/red proportional to effect magnitude)
- Auto-expand affected branches post-simulation
- Scenario save/load to localStorage
- V3.1 API integration with year-specific temporal graphs

---

## Phase 3 — Simulation Polish (COMPLETE 2026-02-19)

- Selective branch expansion (pinnedPaths): post-simulation shows only direct paths to affected indicators
- Parent aggregate effects: affected-only mean + coverage ratio
- Border gating: leaves |pct| >= 0.5%, parents coverage >= 15% AND |pct| >= 1.0%, top-K per ring
- Saturating-curve border widths
- Single-child intermediate pruning with skip-edges
- Ring compression via parent remapping

---

## Phase 4 — Simulation UX Polish (COMPLETE 2026-02-20)

- Sim in Local View: intervention nodes center, negative effects left, positive right
- Edge pulse cascade: 3-tier CSS animations radiating from intervention via BFS hop distance
- Cyan intervention glow with `intervention-pulse` CSS animation
- Node flash glow: red/green flash synced to edge ripple arrival at each ring
- Auto-zoom on sim node count change
- Zoom-to-node on results panel click (smooth 400ms pan)
- Hover cards with sim info (% change, year, coverage)
- Effects count slider (3-50, pre-simulation)
- `T` hotkey toggles timeline with auto-play
- `C` hotkey clears local view targets + simulation state

---

## Phase 5 — Pre-Launch Polish (COMPLETE 2026-02-20)

- Pre-built scenario library: 17 curated policy templates (6 categories) with research-backed interventions
- TemplateSelector with category-grouped dropdown, expandable descriptions
- Draggable SimulationPanel with viewport constraints

---

## Phase 6 — Export & Map Integration (COMPLETE 2026-03-02)

- Export suite: PNG screenshot, CSV results, shareable URL with encoded state
- WorldMap choropleth with QoL heatmap (RdYlGn scale)
- M-key toggle: tap toggles, hold (≥250ms) peeks and reverts on release
- Smooth crossfade transitions (opacity-based, no z-index flash)
- Dynamic QoL root node encoding: size encodes level, grey fill with RdYlGn outline
- QoL score interpolation across all years (1990-2024)
- QoL x/10 label below root node
- Ring 0 cyan pulse during simulation timeline playback
- Ref-based positioning (eliminates React re-renders during zoom/pan)
- Animated reset: collapse to root → 1s delay → expand ring 1
- Progressive pinning capped to keepCount

---

## Phase 7 — Regional Views (COMPLETE 2026-03-03)

- Region selector in CountrySelector (search by region name/alias, auto-select on single match)
- Regional graph rendering on radial viz (reuses country graph pipeline)
- Regional simulation integration (`view_type: "regional"` in both instant and temporal endpoints)
- 11 regions with display names, icons, and ISO3 mapping (`constants/regions.ts`)
- Region search aliases (e.g. "SSA" → Sub-Saharan Africa, "MENA" → Middle East & North Africa)
- Region ↔ country grouping in dropdown (World Bank region headers)

---

## Phase 7.5 — Polish & Animations (COMPLETE 2026-03-03)

- Panel enter/exit CSS transitions (SimulationPanel, DataQualityPanel)
- Named D3 exit transitions (`node-exit`, `label-exit`, `edge-exit`)
- Stale circle/label cleanup before D3 data join (fixes reset node-vanish bug)
- `+`/`-` hotkeys for ring expand/collapse, space bar play/pause
- QoL calibration fix: KNN Gaussian residual correction
- QoL score label sync during simulation playback (2 decimal places)
- Simulation start year fix (was hardcoded to 2020)
- SHAP cache pipeline stability (no restart on year scrub)
- Hide unaffected domain nodes during simulation
- CountrySelector dropdown animation
- Layout stability fix for single-node collapse (pending: `docs/plans/codex-layout-stability-fix.md`)

---

## Phase 8 — Accessibility (COMPLETE 2026-03-03)

Goal: WCAG 2.1 AA compliance. Keyboard navigation, screen reader support, color contrast, focus management, ARIA attributes across all interactive elements.

- Global mode radial graph keyboard navigation (roving tabindex on SVG nodes)
- Arrow-key sibling traversal by ring angle order
- Enter/Space expand-collapse support with live-region action announcements
- Escape parent-focus navigation with hidden-node fallback recovery
- Focus indicators, touch targets, form labels, results table accessibility
- Skip link, ARIA live regions, screen reader announcements

---

## Phase 9A — Desktop Adaptive Layout (COMPLETE 2026-03-03)

Goal: Make all UI chrome adapt gracefully from 1024px to ultrawide. Panel collapse states, adaptive split ratio, responsive tab labels.

- Breakpoint constants + `useViewport` hook (debounced resize tracking)
- SimulationPanel responsive sizing + collapsible header (country name + intervention count badge)
- DataQualityPanel responsive sizing + collapsible header (active page indicator)
- Adaptive split ratio: viewport-aware default (0.67/0.60/0.55/0.50) with user-override tracking
- Search input overflow fix (`width: 100%` respects container)
- Ring button font size floor (9px → 11px)
- StrataTabs compact mode: short labels (All/Dev/Emrg/Adv) below 1200px
- ViewTabs compact mode: icon-only action buttons below 1200px
- SVG title tooltip removal (was showing "Causal graph: unified" on hover)

---

## Phase 9B/C — Tablet & Mobile (PLANNED)

Goal: Full screen size support from phone to ultrawide. Touch interactions, simplified views for small screens.

---

## Phase 10 — Security & Safety (PLANNED)

Goal: Production-ready security. CORS production gating, rate limiting, input sanitization, ENV-based config, CSP headers.

---

## Phase 11 — Tutorial (PLANNED)

Goal: Guided first-visit walkthrough. Step-by-step tour of the causal graph, simulation panel, timeline, and map features.

---

## Phase 12 — Methodology Page (PLANNED)

Goal: Standalone `/methodology` route explaining the PC algorithm, SHAP importance, temporal bootstrapping, income stratification, QoL composite, and limitations.

---

## Phase 13 — Sensitivity Analysis (PLANNED)

Goal: Edge weight perturbation, ensemble simulation runs, confidence intervals, multi-target optimization.

---

## Phase 14 — Public API (PLANNED)

Goal: Documented REST API with authentication, rate limits, usage docs, and versioning.

---

## Future Phases (BACKLOG)

- **3D global graph view**: Radial viz in 3D with depth, rotation, fly-through (Three.js/WebGL)
- **Scenario comparison**: Two scenarios side-by-side with diff view
- **Country comparison**: Same scenario across two countries
- **Education mode**: Guided tour of the causal graph
- **PWA**: Offline capability, installable app
- **i18n**: Translation infrastructure (French, Spanish)

---

## API Version History

| Version | Endpoint prefix | Notes |
|---------|----------------|-------|
| V3.0 | `/api/simulate/` | Original simulation, uniform year |
| V3.1 | `/api/simulate/v31/` | Staggered interventions, year-specific temporal graphs, regional views |

---

## Key Architectural Constraints

- Temporal SHAP dataset: 35 years (1990-2024) x 178 countries — cache aggressively on frontend
- Max simultaneous interventions: 5 (`MAX_INTERVENTIONS` constant)
- Simulation year range: 1990-2030 (historical + 6-year projection)
- Income strata thresholds: Developing < $4,500 GDP/capita, Emerging $4,500-$14,000, Advanced > $14,000
- Regional taxonomy: 11 hybrid regions (WB geographic + sub-splits for Europe/Asia)
