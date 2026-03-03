# Global Viz: Product Overview

**Audience:** Marketing copywriters (about page), animators (explainer video), stakeholder presentations.

**Last updated:** 2026-03-03

---

## 1. What It Is

Global Viz is an interactive causal graph visualization that maps the hidden cause-and-effect relationships between 2,583 development indicators across 178 countries and 35 years of history (1990-2024). It answers a question that traditional dashboards cannot: *if a country changes one thing, what else changes -- and why?*

When a user opens Global Viz, they see a radial "sunburst" graph centered on a single root node labeled "Quality of Life." Radiating outward in concentric rings are 9 outcome domains, 45 coarse categories, 196 fine-grained clusters, 569 indicator groups, and 1,763 individual indicators -- from infant mortality rates and school enrollment to CO2 emissions and democratic participation scores. Each node is sized by its statistical importance (SHAP value) to overall quality of life. The edges connecting them are not correlations; they are causal relationships discovered through the PC algorithm and validated through bootstrapped regression across the entire panel dataset.

The simulation engine lets users design policy interventions -- increase education spending by 20%, reduce carbon emissions by 15% -- and watch the causal effects ripple outward through the graph in real time, year by year, with animated edge pulses and node glows showing exactly which indicators improve, which worsen, and by how much. Users can do this for any of 178 individual countries, 11 world regions, or the entire world, filtered by income level.

Nothing else like this exists. Development data tools show *what happened*. Global Viz shows *what would happen, and why*.

---

## 2. Core Features

### 2.1 The Radial Causal Graph (Global View)

The centerpiece of Global Viz is a radial graph with six concentric rings:

| Ring | Name | Count | Description |
|------|------|-------|-------------|
| 0 | Quality of Life | 1 | The root node. A composite score (0-10) calibrated against the Human Development Index. |
| 1 | Outcomes | 9 | Broad outcome categories: Health, Education, Economic, Governance, Environment, Demographics, Security, Development, Research. |
| 2 | Coarse Domains | 45 | Groups like "Labor Market," "Renewable Energy," "Child Health." |
| 3 | Fine Domains | 196 | Narrow thematic clusters within each domain. |
| 4 | Indicator Groups | 569 | Groupings of closely related indicators. |
| 5 | Indicators | 1,763 | Individual measurable indicators (e.g., "Out-of-School Boys - Lower Secondary Age"). |

Users explore by clicking nodes to expand or collapse their children, revealing the tree structure progressively. The graph starts with only the root visible and unfolds outward as the user explores. Every node is sized proportionally to its SHAP importance -- its measured contribution to Quality of Life -- so the most influential indicators are visually larger.

Hovering over any node reveals a detail card with the indicator name, domain, SHAP importance score, ring rank, and (in country mode) the current value and year.

### 2.2 Country-Specific Views

Users select any of 178 countries through a searchable dropdown with:
- Country flags (emoji flags from ISO codes)
- World Bank region grouping (countries sorted under their region header)
- Development stage badges (Developing / Emerging / Advanced based on GNI per capita)
- Data coverage percentage (how much of the causal graph has real data for that country)
- Fuzzy search with abbreviation support

Once a country is selected, the entire graph transforms. Node sizes shift to reflect that country's specific SHAP values. Edge weights change to that country's estimated causal coefficients. The root node's outline color shifts along a red-yellow-green scale to encode the country's Quality of Life score (out of 10), and a numeric label appears beneath it.

The graph is not just a visual filter. The backend loads a country-specific causal graph with edge weights derived from ridge regression on that country's historical data, bootstrapped 100 times for statistical confidence.

### 2.3 The Simulation System

The simulation panel is a draggable toolbox that lets users design and run causal interventions. The workflow:

1. **Select a country** (or region, or unified/stratified view).
2. **Add interventions** (up to 5 simultaneously): pick an indicator from a domain-grouped dropdown and set a percentage change (-100% to +200%). Each intervention can be assigned a specific year (1997-2024).
3. **Set the simulation range** using a dual-thumb slider (1997-2030, covering both historical data and 6 years of projection).
4. **Run the simulation.** The V3.1 engine propagates effects through the causal graph using non-linear marginal effects, ensemble uncertainty via bootstrap resampling, and saturation functions that prevent unrealistic values (e.g., life expectancy cannot exceed 95 years, percentage indicators stay within 0-100%).

Results appear as:
- **Node glows**: green glow for positive effects, red for negative, with brightness proportional to effect magnitude.
- **Edge pulse cascades**: animated ripples radiating outward from the intervention node through 3 tiers of edges (near, mid, far), timed by causal hop distance.
- **Node flash effects**: green or red flashes synced to the arrival of edge ripples at each ring.
- **Selective branch expansion**: only the causal paths to affected indicators expand, keeping the graph readable.
- **A results panel** listing every affected indicator with baseline value, simulated value, absolute change, and percent change.

Clicking any result in the results panel zooms smoothly to that node in the graph (400ms animated pan).

### 2.4 Timeline Playback

The timeline player allows users to scrub through 35 years of historical data (1990-2024). As the year changes:
- Node sizes update to reflect that year's SHAP importance values.
- The Quality of Life score on the root node updates.
- The world map background (when visible) recolors to show QoL scores for that year.
- In simulation mode, effects play back year by year with animated edge pulses.

Controls include play/pause, year scrubbing, and a compact play bar at the bottom of the screen. The `T` hotkey toggles the timeline with auto-play. The `Space` bar toggles play/pause.

Temporal SHAP data is pre-cached per country for smooth playback without API calls during scrubbing.

### 2.5 Income Strata Filtering

Four tabs at the top of the interface filter the entire view by World Bank income classification:

| Tab | Threshold | Description |
|-----|-----------|-------------|
| All | -- | Unified view across all countries |
| Developing | < $4,500 GNI/capita | Low and lower-middle income countries |
| Emerging | $4,500 - $14,000 | Upper-middle income countries |
| Advanced | > $14,000 | High income countries |

Each tab displays a dynamic country count badge that updates as the selected year changes (countries can transition between income strata over time). Selecting a stratum loads stratum-specific SHAP values and causal graphs -- the structural relationships between indicators differ by income level. In compact mode (below 1200px viewport width), tabs show abbreviated labels (All / Dev / Emrg / Adv).

### 2.6 Local View (DAG Flow Chart)

Clicking any node and switching to "Local" view opens a horizontal flow chart showing that indicator's causal neighborhood:

- **Causes** (displayed as rounded pills on the left): indicators that causally influence the target.
- **Target** (displayed as a rectangle in the center): the selected indicator.
- **Effects** (displayed as hexagons on the right): indicators that the target causally influences.

Edge thickness encodes the beta coefficient (effect size). Edge color distinguishes positive (reinforcing) from negative (inhibiting) relationships. Users can adjust a beta threshold slider to filter out weak causal links and control input depth (how many layers of upstream causes to show).

In simulation mode, the Local View transforms: intervention nodes appear at the center, negative effects fan to the left, and positive effects fan to the right, providing an intuitive left-right polarity layout.

The Local View supports drill-down navigation -- clicking any cause or effect node makes it the new target, allowing users to trace causal chains across the entire graph.

### 2.7 Data Quality Panel

A dedicated panel (toggled via a button or keyboard shortcut) provides transparency about the underlying data:

- **Coverage percentage**: how much of the graph has observed data vs. imputed data.
- **Observed vs. imputed breakdown**: bar chart showing the ratio for each year.
- **Confidence level**: high, medium, or low, based on data availability.
- **Mini timeline**: a color-coded row of dots (green = complete, yellow = partial, red = sparse) for all 35 years.
- **Income transitions**: in country mode, shows every year a country moved between income brackets (e.g., "2005: Developing to Emerging").
- **Stratum distribution**: in unified/stratified mode, shows a pie chart of how many countries fall in each income tier for the selected year.
- **CI Stats**: in Local View, shows confidence intervals for the displayed causal edges.

### 2.8 World Map Choropleth

A TopoJSON world map sits behind the radial graph, colored by Quality of Life scores using a red-yellow-green (RdYlGn) color scale. The map supports two modes:

- **Country mode** (default): each country colored individually by its QoL score.
- **Regional mode**: all countries within a region share one color (regional mean QoL), with thicker inter-region boundaries and thinner intra-region borders.

The map is toggled with the `M` key: a tap toggles it to the foreground; a hold (250ms+) "peeks" at the map and reverts on release. Smooth crossfade transitions prevent visual jarring. The map updates in real time as the timeline year changes.

### 2.9 Regional Views and Spillover Effects

Users can select any of 11 hybrid regions (based on World Bank geographic taxonomy with sub-splits for Europe and Asia):

- East Asia & Pacific
- Southeast Asia
- South Asia
- Central Asia
- Eastern Europe
- Western Europe
- Europe & Central Asia
- Latin America & Caribbean
- Middle East & North Africa
- North America
- Sub-Saharan Africa

Regional selection loads a regional causal graph (edge weights estimated from all countries in that region). Simulations run at the regional level produce **spillover effects**: the engine calculates how an intervention in one region would affect neighboring regions and the global aggregate, based on trade and proximity linkages.

### 2.10 Policy Templates

A library of 17 pre-built scenario templates across 6 categories, each grounded in real-world policy research:

| Category | Templates |
|----------|-----------|
| Economy | Bolsa Familia (Brazil CCT), Nordic Welfare Model, Kenya M-Pesa, Vietnam Export Strategy, China WTO Accession |
| Health | Bangladesh Community Health, Thailand Universal Coverage |
| Infrastructure | Rwanda Digital Transformation, China Infrastructure, Ethiopia Roads |
| Education | Korea Education Reform, India Sarva Shiksha Abhiyan |
| Governance | Estonia e-Governance, Georgia Anti-Corruption, Singapore Integrity |
| Environment | India Agricultural Boost, Germany Energiewende |

Each template includes:
- Pre-configured interventions with research-backed percentage changes
- Source citations (World Bank, IMF, The Lancet, etc.)
- Difficulty rating (easy / moderate / hard)
- Political feasibility assessment (low / medium / high)
- Estimated cost (as % of GDP)
- Expected outcomes with time horizon
- Case study evidence with academic citations

Users can apply a template, modify its interventions, and reset to defaults.

### 2.11 Search and Navigation

- **Fuzzy search** (powered by Fuse.js) across all 2,583 nodes, supporting partial matches, abbreviations, and domain filtering.
- **Recent searches** remembered during the session.
- **Keyboard navigation**: arrow keys traverse sibling nodes by ring angle order; Enter/Space expand/collapse; Escape navigates to parent. Full WCAG 2.1 AA accessibility with ARIA live regions, skip links, focus indicators, and screen reader announcements.
- **Hotkeys**: `T` (timeline), `C` (clear), `M` (map), `+`/`-` (expand/collapse rings), `Space` (play/pause).

### 2.12 Export

- **PNG screenshot** of the current graph state.
- **CSV export** of simulation results (summary and year-by-year timeline).
- **Shareable URL** with encoded state (country, stratum, interventions, view mode) that can be copied and shared.

### 2.13 Scenario Management

Users can save simulation configurations to local storage, name them, and reload them later. The scenario system preserves the country, all interventions with their year assignments, and the simulation year range.

### 2.14 Responsive Design

The interface adapts from 1024px to ultrawide monitors with:
- Responsive panel sizing and collapsible headers.
- Adaptive split ratios for the graph/local-view split (0.67 at 1024px, 0.50 at ultrawide).
- Compact tab labels below 1200px.
- Icon-only action buttons at smaller widths.
- Touch targets meeting WCAG minimum size requirements.

---

## 3. The Data

### 3.1 Scale

| Metric | Value |
|--------|-------|
| Countries | 178 with full temporal causal graphs |
| Country API entries | 203 (includes territories) |
| Years of data | 35 (1990-2024) |
| Projection years | 6 (2025-2030) |
| Total nodes in hierarchy | 2,583 |
| Leaf indicators | 1,763 |
| Structural edges (hierarchy) | 9,950 |
| Causal edges (raw) | 7,368 |
| Temporal graph dataset | ~18 GB (year-specific, country-specific causal graphs) |
| Temporal SHAP dataset | ~1.3 GB (35 years x 178 countries) |
| Baseline dataset | ~328 MB (precomputed country baselines) |
| Regions | 11 (hybrid World Bank + sub-splits) |
| Policy templates | 17 across 6 categories |
| Income strata | 3 (Developing, Emerging, Advanced) |

### 3.2 Indicator Domains

The 2,583 nodes span seven primary domains:

| Domain | Node Count | Examples |
|--------|-----------|----------|
| Education | 604 | School enrollment, literacy, out-of-school rates, teacher ratios |
| Economic | 583 | GDP growth, trade balance, foreign investment, income inequality |
| Governance | 466 | Democratic participation, rule of law, corruption indices, press freedom |
| Environment | 385 | CO2 emissions, forest cover, renewable energy, water access |
| Development | 297 | Human development components, infrastructure, urbanization |
| Health | 191 | Life expectancy, infant mortality, disease prevalence, healthcare access |
| Security | 56 | Conflict indicators, political stability, violence metrics |

### 3.3 Data Sources

The indicator data is drawn from major international databases including:
- **World Development Indicators (WDI)** -- World Bank
- **V-Dem Dataset** -- Varieties of Democracy Institute (governance and democratic indicators)
- **UNDP Human Development Index** components
- **WHO Global Health Observatory** data

### 3.4 Research Methodology

The causal graph is not hand-drawn or assumption-based. It is computationally discovered:

1. **Causal discovery (PC algorithm)**: The Peter-Clark (PC) constraint-based algorithm identifies the direction of causal edges from the panel data, distinguishing cause from effect rather than merely finding correlations.
2. **Edge weight estimation (Ridge regression)**: Each causal edge is assigned a beta coefficient via ridge regression, estimated separately for each country (or region, or stratum) using that entity's time series data.
3. **Bootstrap validation**: Every edge weight is bootstrapped 100 times to produce confidence intervals, standard deviations, and p-values. Users can see this uncertainty in the Data Quality Panel.
4. **SHAP importance**: Tree-based SHAP (SHapley Additive exPlanations) values quantify each indicator's contribution to Quality of Life, bootstrapped with confidence intervals.
5. **Temporal specificity**: Causal graphs are re-estimated for each year (1990-2024) to capture structural changes over time -- the relationships between indicators in 1995 may differ from those in 2020.
6. **Non-linear propagation**: The simulation engine uses marginal effects evaluated at country-specific percentiles, not simple linear multiplication, producing realistic projections.
7. **Saturation functions**: Domain-specific bounds prevent the simulation from producing impossible values (e.g., enrollment rates above 100%, life expectancy above 95).

---

## 4. Visual Design Language

### 4.1 Color System

Nine domain colors provide instant visual identification throughout the interface:

| Domain | Color | Hex |
|--------|-------|-----|
| Health | Pink | #E91E63 |
| Education | Orange | #FF9800 |
| Economic | Green | #4CAF50 |
| Governance | Purple | #9C27B0 |
| Environment | Cyan | #00BCD4 |
| Demographics | Brown | #795548 |
| Security | Red | #F44336 |
| Development | Indigo | #3F51B5 |
| Research | Teal | #009688 |

These colors are used consistently for node fills, domain badges, legend dots, and Local View styling.

### 4.2 Ring Structure

The six concentric rings create a visual hierarchy from abstract (center) to concrete (outer edge). The root node sits alone at the center, creating a strong focal point. Ring labels ("Quality of Life," "Outcomes," "Coarse Domains," etc.) are displayed as interactive buttons that expand or collapse entire rings.

### 4.3 Node Sizing

Node size encodes SHAP importance via area proportionality: a node twice as important appears twice the area, not twice the radius. This follows perceptual best practices for circle-based encodings. Nodes below a minimum importance threshold are rendered with dashed borders and muted colors to indicate low significance without removing them.

### 4.4 Animation System

The visualization uses a layered animation system:

- **Edge pulse cascades**: When a simulation runs, animated ripples flow outward from the intervention node. Three tiers of animation (near, mid, far) reduce in intensity with distance, creating a natural "wave" effect.
- **Node flash glows**: Green or red drop-shadow flashes appear on nodes as the edge ripple reaches them, synchronized by BFS hop distance from the intervention.
- **Intervention glow**: The intervention node pulses with a cyan glow (`intervention-pulse` animation).
- **QoL cyan flash**: The root node flashes cyan during simulation timeline playback.
- **Enter/exit transitions**: Nodes scale from 0 to 1 on appear (300ms, cubic-out easing) and shrink on disappear (200ms, cubic-in easing). Named D3 transitions prevent conflicts.
- **Viewport animations**: Smooth 400ms pan-and-zoom when navigating to a specific node.
- **Animated reset**: On clear, nodes collapse to the root over a 1-second sequence, then ring 1 re-expands.

### 4.5 Overall Aesthetic

The interface uses a light theme with a clean, research-tool feel. The background is a subtle world map choropleth that can be brought to the foreground. Panels (simulation, data quality) float as draggable cards with rounded corners, soft shadows, and collapsible sections. The graph itself is rendered entirely in SVG via D3.js, allowing smooth zoom and pan interactions.

The visual language conveys scientific credibility: no decoration for its own sake, clear hierarchical structure, and transparent data provenance at every level.

---

## 5. Key Numbers

- **2,583** nodes in the causal hierarchy
- **1,763** individual development indicators
- **7,368** causal edges discovered by the PC algorithm
- **178** countries with full temporal causal graphs
- **35** years of historical data (1990-2024)
- **6** years of forward projection (2025-2030)
- **11** world regions
- **9** outcome domains
- **17** pre-built policy templates grounded in peer-reviewed research
- **~20 GB** of causal graph data powering the backend
- **100** bootstrap iterations per edge weight for statistical confidence
- **5** simultaneous interventions per simulation
- **6** concentric rings in the radial hierarchy

---

## 6. Emotional Hook

### The Narrative

Development economics has spent decades accumulating data. The World Bank alone tracks thousands of indicators for every country on Earth, every year. The result is an overwhelming catalog of numbers: GDP growth rates, school enrollment percentages, CO2 emissions per capita, maternal mortality ratios. These numbers are published in spreadsheets and dashboards that answer one question: *what happened?*

But the question policymakers actually need answered is different: *what would happen if we did something?*

If Rwanda increases its education budget by 15%, what happens to child mortality? If Brazil expands its conditional cash transfer program, what happens to inequality -- and does that improvement in inequality then feed back into political stability, which feeds back into investment, which feeds back into growth? These questions involve causal chains that cross domains, unfold over years, and behave differently depending on whether a country is developing, emerging, or advanced.

Until now, answering those questions required either a team of economists building bespoke models for each scenario, or intuition. Global Viz makes those causal chains visible, explorable, and simulatable -- for any country, any indicator, any time period.

### Questions This Tool Can Answer

- "If India increases renewable energy investment by 25%, what happens to air quality, respiratory disease, and labor productivity over the next decade?"
- "How did the causal drivers of Quality of Life in Sub-Saharan Africa change between 1995 and 2020?"
- "Which indicators have the strongest causal influence on democratic participation in emerging economies?"
- "If we replicate Brazil's Bolsa Familia program in a different developing country, what effects should we expect -- and which ones might be different?"
- "What are the spillover effects of China's infrastructure investment on neighboring regions?"
- "How confident are we in the causal link between female education and child mortality? What does the bootstrapped confidence interval look like?"

### Why It Matters

Global Viz turns 20 gigabytes of causal discovery research into something a policymaker, a journalist, a student, or an activist can explore in a web browser. It does not hide its uncertainty -- every edge has a confidence interval, every node has a data quality score. It does not flatten complexity -- it visualizes it, letting users trace causal chains across domains and decades.

The tool represents a bridge between academic causal inference research and practical policy reasoning. It makes the invisible visible: the web of cause and effect that connects education to health to governance to economic growth to environmental sustainability, and back again.

---

*This document covers the product as of March 2026. Planned features include tablet/mobile optimization (Phase 9B/C), a guided tutorial (Phase 11), a standalone methodology page (Phase 12), sensitivity analysis (Phase 13), and a public API (Phase 14).*
