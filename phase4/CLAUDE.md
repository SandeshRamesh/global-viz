# Phase 4: Multi-Target & Country Comparison

## Overview

Phase 4 enables **domain-specific analysis** (9 outcome targets) and **cross-country comparisons**. Users can explore what drives health vs education vs economic outcomes, and compare development patterns between countries.

**Status:** Not Started
**Dependencies:** Phase 3 complete
**Estimated Duration:** Weeks 12-14
**Target Users:** Path 2 (Optimizer) - data scientists, economists, policy analysts

---

## Objectives

1. Enable switching between 9 outcome targets (not just QoL)
2. Side-by-side country comparison with synchronized timeline
3. Heterogeneity insights (why drivers differ between contexts)
4. Difference highlighting between countries/strata

---

## Week 12: Multi-Target System

### Target Selector

* [ ] **Target Selector Dropdown**
  ```typescript
  const targetOptions = [
    { id: 'quality_of_life', label: 'Quality of Life (Composite)', icon: '🎯' },
    { id: 'health', label: 'Health & Longevity', icon: '🏥' },
    { id: 'education', label: 'Education & Knowledge', icon: '📚' },
    { id: 'economic', label: 'Income & Living Standards', icon: '💰' },
    { id: 'governance', label: 'Governance & Democracy', icon: '🏛️' },
    { id: 'environment', label: 'Environment & Sustainability', icon: '🌍' },
    { id: 'demographics', label: 'Demographics & Population', icon: '👥' },
    { id: 'security', label: 'Safety & Security', icon: '🛡️' },
    { id: 'development', label: 'Infrastructure & Development', icon: '📈' }
  ]
  ```

* [ ] **Domain-Specific SHAP Loading**
  ```javascript
  GET /api/temporal/shap/{stratum}/{target}/{year}
  // Example: /api/temporal/shap/developing/health/2010
  // If target='health', loads health-specific SHAP
  // Node sizes update to show health-specific importance
  ```

* [ ] **Visual Feedback on Target Switch**
  - Node sizes re-animate (300ms morph)
  - Domain color highlights active target
  - Breadcrumb shows: "QoL > Health & Longevity"

* [ ] **Target Comparison Mode**
  - Split view: [QoL View] | [Health View]
  - Same country, same year, different targets
  - Highlight indicators that differ most between targets

### Target Selector Deliverables

* [ ] `TargetSelector.tsx` (dropdown with icons)
* [ ] `targetStore.ts` (Zustand slice for selected target)
* [ ] Update all SHAP loading to include target parameter
* [ ] Target comparison split view component

---

## Week 13: Country Comparison Mode

### Dual-Country Selector

* [ ] **Side-by-side dropdowns**
  ```
  Compare: [Rwanda ▼] vs [Kenya ▼]
  ```
  - Synchronized timeline (both scrub together)
  - Option: Lock/unlock timeline sync

### Split-Screen Global View

```
┌─────────────────┬─────────────────┐
│    Rwanda       │     Kenya       │
│   (2010)        │    (2010)       │
│                 │                 │
│  [Global View]  │  [Global View]  │
│                 │                 │
└─────────────────┴─────────────────┘
```

### Difference Highlighting

* [ ] **Visual encoding:**
  - Nodes glow if SHAP differs >0.1 between countries
  - Edge thickness shows strength difference
  - Color: Green = stronger in left country, Red = stronger in right

### Comparison Summary Panel

```
Rwanda vs Kenya (2010):

Unique to Rwanda:
• agriculture_productivity (SHAP 0.42 vs 0.18)

Unique to Kenya:
• tourism_revenue (SHAP 0.31 vs 0.08)

Shared drivers:
• education_spending (similar importance)
• health_infrastructure (similar importance)
```

### Comparison Deliverables

* [ ] `ComparisonMode.tsx` (split-screen container)
* [ ] `DualCountrySelector.tsx` (two country dropdowns)
* [ ] `SyncedTimeline.tsx` (single control for both views)
* [ ] `DifferencePanel.tsx` (shows SHAP differences)
* [ ] `DifferenceHighlighter.tsx` (glow logic for divergence)

---

## Week 14: Heterogeneity Insights

### "Why Different?" Explainer

* [ ] **Click divergent node → see explanation**
  ```
  "Agriculture matters more in Rwanda because:
   - 70% employment vs 40% in Kenya
   - Lower urbanization (18% vs 28%)
   - Less economic diversification"
  ```

### Stratum Comparison Tool

```
Compare:
[Developing ▼] vs [Advanced ▼]

Shows:
• Top 10 drivers in each (side-by-side)
• Correlation: r=0.25 (fundamentally different)
• Unique to Developing: Trade, agriculture, basic infrastructure
• Unique to Advanced: Aging, R&D, environmental quality
```

### Importance Comparison Visualization

```
Select indicator: "education_spending"

Importance by Development Stage (2020):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Developing:  ████████████████░░░░ 0.42
Emerging:    ████████████░░░░░░░░ 0.31
Advanced:    ████████░░░░░░░░░░░░ 0.19

Interpretation: Education spending matters 2x more
in developing countries than advanced ones.
```

### Stratum Comparison Heatmap

* [ ] **All indicators × 3 strata matrix**
  - Color intensity = SHAP importance
  - Sortable by "heterogeneity score" (variance across strata)

### Heterogeneity Deliverables

* [ ] `HeterogeneityView.tsx` (importance comparison)
* [ ] `StratumHeatmap.tsx` (indicator × stratum matrix)
* [ ] `HeterogeneityRanking.tsx` (sorted by variance)
* [ ] `HeterogeneityExplainer.tsx` (contextual why-different panel)

---

## API Requirements

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/temporal/shap/{stratum}/{target}/{year}` | GET | Target-specific SHAP by stratum |
| `/api/temporal/shap/{country}/{target}/{year}` | GET | Target-specific SHAP by country |
| `/api/compare/{countryA}/{countryB}/{year}` | GET | Pre-computed country differences |
| `/api/heterogeneity/{indicator}` | GET | Stratum comparison for indicator |

---

## Success Metrics

* [ ] All 9 targets selectable and functional
* [ ] Target switching <300ms with smooth animation
* [ ] Country comparison loads <500ms
* [ ] Split views synchronized within 16ms (one frame)
* [ ] Heterogeneity heatmap renders for all indicators
* [ ] Difference highlighting visually clear

---

## Dependencies

**From Phase 3:**
- Cluster visualization
- Export system
- Transparency panel

**From V3.1 Data:**
- Multi-target SHAP files (9 targets × strata × years)
- Country-specific SHAP by target
- Income classifications

**External Libraries:**
- Split-pane library (react-split-pane or similar)

---

## Out of Scope (Deferred to Phase 5)

- Optimization mode (Pareto frontiers)
- Education/classroom features
- Mobile app
- White-label customization
