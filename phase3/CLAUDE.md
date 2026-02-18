# Phase 3: Development Clusters, Transparency & Academic Rigor

## Overview

Phase 3 adds **development cluster visualization**, **academic transparency features**, and **data export capabilities**. This phase serves both explorers (cluster insights) and validators (reproducibility).

**Status:** Not Started
**Dependencies:** Phase 2 complete, V3.1 data fully available
**Estimated Duration:** Weeks 9-11
**Target Users:** Path 1 (Explorer), Path 2 (Optimizer), Path 3 (Validator)

---

## Objectives

1. Visualize indicator ecosystems (development clusters)
2. Add full transparency for academic reproducibility
3. Enable data export in multiple formats
4. Provide citation generation and methodology documentation

---

## Week 9: Development Clusters

### What Are Development Clusters

- Groups of indicators connected through causal chains
- Example: "Human Capital Cluster" = education + health + income
- Detected via Louvain community detection on causal graph
- Already computed: 214 files (178 countries + 35 unified years + 1 global)

### Cluster View Mode

* [ ] **Cluster Layer in Global View**
  - Toggle: "Show Clusters" button
  - Nodes group by cluster (convex hull boundaries)
  - Cluster labels: "Human Capital", "Infrastructure", "Governance"
  - Color-coded: Each cluster gets unique hue

* [ ] **Cluster Panel (Sidebar)**
  ```
  Rwanda 2010 - Detected Clusters:

  1. Health-Education Cluster (23 indicators)
     • vaccination_rate → child_mortality → school_enrollment
     • Density: 0.18 (highly connected)

  2. Economic-Trade Cluster (31 indicators)
     • exports → manufacturing → gdp_growth
     • Density: 0.12 (moderately connected)

  3. Governance-Security Cluster (18 indicators)
     • corruption → conflict → political_stability
     • Density: 0.22 (very dense)
  ```

* [ ] **Cluster Stability Over Time**
  - Timeline shows cluster persistence:
  - "Human Capital cluster existed 1990-2024 (stable)"
  - "Infrastructure cluster emerged 2005 (new)"
  - Jaccard similarity chart: How clusters evolve

### Cross-Country Cluster Comparison

* [ ] **Cluster Similarity Matrix**
  ```
  Which countries have similar causal structures?

           Rwanda  Kenya  Uganda
  Rwanda     1.00   0.73   0.68
  Kenya      0.73   1.00   0.81
  Uganda     0.68   0.81   1.00

  Interpretation: Kenya & Uganda have very similar clusters (0.81)
  → Similar development patterns, policies may transfer
  ```

* [ ] **Regional Cluster Patterns**
  - Map view: Countries colored by dominant cluster type
  - Sub-Saharan Africa: Health-Education clusters dominate
  - East Asia: Economic-Trade clusters dominate
  - Europe: Governance-Sustainability clusters dominate

### Cluster Deliverables

* [ ] `ClusterView.tsx` (convex hull rendering, cluster labels)
* [ ] `ClusterPanel.tsx` (sidebar with cluster details)
* [ ] `ClusterSimilarity.tsx` (heatmap matrix)
* [ ] `ClusterTimeline.tsx` (shows emergence/dissolution over time)

---

## Week 10-11: Transparency & Academic Rigor

### Transparency Panel

* [ ] **"Show Methodology" button** (right sidebar drawer)

* [ ] **Per-node statistics display:**
  - SHAP value (importance score)
  - Data quality (% observed vs imputed)
  - Sample size (n observations)
  - Source dataset (WDI, UNESCO, V-Dem, etc.)
  - Confidence interval (ci_lower, ci_upper)

* [ ] **Per-edge statistics display:**
  - Beta coefficient (effect size)
  - Confidence interval (95% CI)
  - P-value (significance)
  - Lag (0-5 years)
  - Calculation method (backdoor adjustment, bootstrap, etc.)

### Data Export Suite

* [ ] **"Download Data" button** (multiple formats)

* [ ] **Export options:**
  - CSV: Full node list + edge list
  - JSON: Complete graph structure
  - SVG: Current view as vector graphic
  - PNG: High-res screenshot (for publications)

* [ ] **Export includes metadata:**
  - Filters applied
  - Date accessed
  - Data version (v3.1.x)
  - Country/stratum/year context

### Citation Generator

* [ ] **"Cite This Work" popup** (modal dialog)

* [ ] **Formats provided:**
  - BibTeX (LaTeX users)
  - APA 7th edition
  - MLA 9th edition
  - Chicago 17th edition

* [ ] **Auto-populates current URL** (for specific views/scenarios)

### Methodology Documentation

* [ ] **`/methodology` page** (separate from main app)

* [ ] **Sections:**
  - Phase A: Causal Discovery (GraNDAG algorithm)
  - Phase B: Semantic Hierarchy (clustering, promotion)
  - V2.1: Results & Validation
  - V3.1: Temporal Dynamics & Stratification
  - Known Limitations (honest disclosure)

* [ ] **Downloadable as PDF** (for offline reading)

### Sensitivity Analysis Runner (Optional)

* [ ] **"Run Sensitivity Test" button**

* [ ] **Options:**
  - Exclude imputed data (re-run on observed only)
  - Exclude high-income countries (test on developing world)
  - Change saturation threshold (GDP $20K → $25K)
  - Arithmetic vs geometric mean comparison

* [ ] **Results comparison** (original vs sensitivity test)

### Transparency Deliverables

* [ ] `TransparencyPanel.tsx` (stats sidebar)
* [ ] `ExportManager.ts` (handles CSV/JSON/SVG/PNG generation)
* [ ] `CitationGenerator.tsx` (modal with copy-to-clipboard)
* [ ] `/methodology` page (Markdown content rendered)
* [ ] PDF export script (generate methodology PDF)

---

## API Requirements

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/clusters/{country}` | GET | Country cluster data |
| `/api/clusters/unified/{year}` | GET | Unified clusters for year |
| `/api/clusters/similarity/{countryA}/{countryB}` | GET | Cluster similarity score |
| `/api/export/csv` | POST | Generate CSV export |
| `/api/export/json` | POST | Generate JSON export |

---

## Success Metrics

* [ ] Clusters render with convex hulls correctly
* [ ] Cluster stability timeline shows evolution
* [ ] Similarity matrix reveals regional patterns
* [ ] 100% data export success rate (all formats)
* [ ] Methodology page complete and accessible
* [ ] Citation generator produces valid citations
* [ ] Zero accessibility violations (WCAG AA)

---

## Dependencies

**From Phase 2:**
- Timeline player (scrubbing, playback)
- Stratification tabs (stratum switching)
- Country selector (178 countries)
- Temporal SHAP API endpoints

**From V3.1 Data:**
- `v3_1_development_clusters/countries/{country}_clusters.json` (178 files)
- `v3_1_development_clusters/unified/{year}_clusters.json` (35 files)

**External Libraries:**
- `d3-delaunay` or similar for convex hull rendering
- `file-saver` for downloads
- `html2canvas` / `dom-to-image` for PNG export
- `jspdf` for PDF methodology export

---

## Legal/Admin Requirements

* [ ] Privacy policy updated (data exports)
* [ ] Terms of service reviewed
* [ ] GDPR compliance verified (no PII in exports)

---

## Out of Scope (Deferred to Phase 4+)

- Multi-target selector (Phase 4)
- Country comparison mode (Phase 4)
- Optimization mode (Phase 5)
- Education/classroom features (Phase 5)
