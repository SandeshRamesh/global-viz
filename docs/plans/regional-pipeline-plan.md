# Regional Simulation Pipeline — Integration Plan

## Goal

Add a `regional` view type to the simulation engine so that users can run simulations against region-level causal graphs (e.g., "Sub-Saharan Africa") with the same speed as a single country simulation. Regional graphs will be precomputed offline and slot into the existing fallback chain alongside `country`, `stratified`, and `unified` views.

After launch, we validate regional graphs against country-level aggregation to determine whether live country fan-out adds value as a confidence band, or whether the regional graph alone is sufficient.

## Implementation Status (2026-03-01)

Completed in code:
- Canonical mapping module: `simulation/region_mapping.py` (strict 178/178 coverage).
- Runtime/API support for `view_type=regional` in instant + temporal simulation.
- Adaptive-year fallback with warnings and scope metadata in responses.
- New precompute jobs:
  - `simulation/precompute_regional_graphs.py`
  - `simulation/precompute_regional_baselines.py`
  - `simulation/precompute_regional_shap.py`
- Feature flag: `ENABLE_REGIONAL_VIEW` (default `false`).

Still required operationally:
- Run regional precompute scripts and verify coverage reports in `data/v31/metadata/`.
- Enable flag in staging, then production after validation.

---

## Current State

**What exists:**
- 178 country-level temporal graphs (26 years each: 1999-2024) at `data/v31/temporal_graphs/countries/`
- 3 stratum-level graphs (35 years each) at `data/v31/temporal_graphs/stratified/`
- 1 unified graph (35 years) at `data/v31/temporal_graphs/unified/`
- Panel data: `data/raw/v21_panel_data_for_v3.parquet` (long format: country, year, indicator_id, value)
- Edge structure: `data/raw/v21_causal_edges.csv` (7,368 global edges from V2.1 PC algorithm)
- Regional mapping: `simulation/region_mapping.py` provides canonical 178/178 mapping to 11 hybrid regions
- Graph loader: `simulation/graph_loader_v31.py` supports `country|stratified|unified|regional` with adaptive-year fallback
- Simulation runner: `simulation/simulation_runner_v31.py` accepts `view_type` + optional `region`

**How stratum graphs were built (the template for regional):**
- Pool all country-year observations within a stratum
- Ridge regression per edge (100 bootstrap), same as country graphs
- Nonlinearity detection (AIC comparison across log/quad/saturation/threshold)
- Granger lag estimation (lags 1-5)
- Output: same JSON schema as country graphs, plus `stratification` block listing member countries
- Baselines: median across member country baselines
- Indicator stats: median within-country temporal std across members

---

## Region Definitions

11 regions from `regional_spillovers.json`:

| Region Key | Name | Mapped Countries | Notes |
|---|---|---|---|
| sub_saharan_africa | Sub-Saharan Africa | 18 | Expand to ~45 |
| western_europe | Western Europe | 16 | OK |
| middle_east_north_africa | Middle East & North Africa | 16 | OK |
| latin_america_caribbean | Latin America & Caribbean | 11 | Expand to ~30 |
| eastern_europe | Eastern Europe | 9 | Expand to ~15 |
| southeast_asia | Southeast Asia | 8 | OK |
| south_asia | South Asia | 8 | OK |
| east_asia_pacific | East Asia & Pacific | 6 | Expand to ~15 |
| central_asia | Central Asia | 5 | Small but keep |
| europe_central_asia | Europe & Central Asia | 4 | Russia/Turkey/Ukraine/Kazakhstan |
| north_america | North America | 3 | Smallest — 2-3 countries |

**Action completed:** Canonical mapping now covers all 178 countries with graph data. World Bank regional groups are used as the base, then deterministically split into the 11-key hybrid taxonomy (EAP/ECA splits + historical overrides).

**Decision: keep all 11 regions.** Even small ones (North America, Central Asia) produce valid Ridge regressions — 3 countries × 35 years = 105 rows is enough for edge-weight estimation on pre-existing edges. The PC algorithm already determined edge *existence* globally in V2.1; we're only re-estimating *weights*.

---

## Pipeline Architecture

### Overview

```
Phase 1: Data Preparation
  Complete COUNTRY_REGION_MAP (104 → 178)
  Build region_classifier.py (parallel to income_classifier.py)

Phase 2: Regional Graph Generation (offline, ~20 min on 12 cores)
  Pool panel data by region
  Ridge regression per edge per region per year (expanding window)
  Nonlinearity detection + lag estimation
  Output: data/v31/temporal_graphs/regional/{region_key}/{year}_graph.json

Phase 3: Regional Baselines & Stats (offline, ~2 min)
  Median baselines across region members
  Median within-country temporal std across region members
  Output: data/v31/baselines/regional/{region_key}/{year}.json
          data/v31/regional_indicator_stats/{region_key}.json

Phase 4: Regional SHAP (offline, ~15 min)
  GBR + TreeExplainer per region per target per year
  Output: data/v31/temporal_shap/regional/{region_key}/{target}/{year}_shap.json

Phase 5: Runtime Integration
  Extend graph_loader_v31.py with view_type='regional'
  Extend simulation_runner_v31.py to accept region instead of country
  New API endpoints for regional simulation
  Frontend: region selector on map → simulation panel
```

---

## Phase 1: Data Preparation

### 1A. Complete the Region Mapping

**File:** `simulation/region_classifier.py` (new, mirrors `income_classifier.py`)

```
Purpose:
- Authoritative region assignment for all 178 countries
- Based on World Bank regional classifications
- Function: get_countries_in_region(region_key, year?) -> List[str]
- Function: get_region_for_country(country) -> str
- Function: get_all_region_keys() -> List[str]
- Function: get_region_metadata(region_key) -> dict (name, member count)
```

Source the full 178-country mapping from the World Bank classification already used in `income_classifier.py` (which loads `data/v31/metadata/income_classifications.json`). Cross-reference with `ls data/v31/temporal_graphs/countries/` to ensure every country with a graph gets assigned.

Update `regional_spillovers.py` to import from `region_classifier.py` instead of maintaining its own `COUNTRY_REGION_MAP` dict.

### 1B. Validate Region Sizes

After expanding the mapping, print counts per region. Expected:

- sub_saharan_africa: ~45 countries
- latin_america_caribbean: ~30
- east_asia_pacific: ~15
- western_europe: ~16
- eastern_europe: ~15
- middle_east_north_africa: ~18
- south_asia: ~8
- southeast_asia: ~10
- central_asia: ~5-8
- europe_central_asia: ~4-6
- north_america: ~3

Minimum viable: 3 countries (North America). At 3 countries × 35 years = 105 data points per edge, Ridge regression is stable (especially with alpha=1.0 regularization).

---

## Phase 2: Regional Graph Generation

### 2A. Script: `simulation/precompute_regional_graphs.py`

This is the core pipeline script. It mirrors how stratified graphs were generated, but groups by region instead of income stratum.

**Algorithm per region per year:**

1. **Load panel data** — read `v21_panel_data_for_v3.parquet`, filter to countries in this region
2. **Pivot to wide format** — rows = (country, year) pairs where year <= target_year (expanding window), columns = indicators
3. **For each of the 7,368 V2.1 edges:**
   a. Extract source and target columns from the wide panel
   b. Drop NaN rows, require ≥ 5 observations
   c. Standardize both series (zero mean, unit variance)
   d. **Ridge regression** (alpha=1.0) → beta
   e. **Bootstrap** (100 samples) → std, ci_lower, ci_upper, p_value (from t-test on beta/std)
   f. **Nonlinearity detection:** fit log, quadratic, saturation, threshold models; compare AIC to linear; if ΔAIC > 2.0 and R² improves > 0.03, mark as nonlinear and compute marginal_effects at p25/p50/p75
   g. **Lag estimation:** Granger causality test for lags 1-5, pick lag with min p-value
4. **Output JSON** in identical schema to stratified graphs, with additional `region` and `region_name` fields instead of `stratum`/`stratum_name`

**Parallelization:** 11 regions × 35 years = 385 graph files. Each graph estimates 7,368 edges. Use joblib with 10 workers (respecting 12-core thermal limit). Each region-year takes ~3s → total ~2 min with parallelism.

**Output path:** `data/v31/temporal_graphs/regional/{region_key}/{year}_graph.json`

**JSON schema additions (vs stratified):**

```json
{
  "year": 2020,
  "edges": [...],           // identical schema to stratified
  "metadata": {...},        // identical schema
  "saturation_thresholds": {...},
  "provenance": {...},
  "region": "sub_saharan_africa",
  "region_name": "Sub-Saharan Africa",
  "regionalization": {
    "n_countries": 45,
    "countries_in_region": ["Nigeria", "Kenya", ...],
    "n_country_years": 1575
  }
}
```

### 2B. Validation Script: `scripts/dev/validate_regional_graphs.py`

After generation, validate:
- All 11 regions × 35 years = 385 files exist
- Each file has 7,000+ edges (some edges may be skipped for insufficient data)
- No extreme betas (|beta| > 5 after standardization → flag for review)
- Compare region beta distributions to corresponding stratum betas (sanity check)
- Spot-check: for SSA, the education→GDP edge should be stronger than in Western Europe

---

## Phase 3: Regional Baselines & Indicator Stats

### 3A. Script: `simulation/precompute_regional_baselines.py`

Mirrors `precompute_strata_baselines.py` exactly, substituting region for stratum.

```
For each region:
  For each year 1990-2024:
    1. Get countries in region (from region_classifier)
    2. Load each country's baseline JSON
    3. Compute median per indicator (require ≥ 3 countries)
    4. Save to data/v31/baselines/regional/{region_key}/{year}.json
```

Same JSON schema as stratum baselines: `{label, year, n_countries, n_indicators, values}`.

### 3B. Script: `simulation/precompute_regional_stats.py`

Mirrors stratum indicator stats computation.

```
For each region:
  1. Load within-country temporal stats for each member country
     (from data/v31/country_indicator_stats/{country}.json)
  2. Compute median std per indicator across member countries
  3. Save to data/v31/regional_indicator_stats/{region_key}.json
```

This is critical for unit conversion in absolute-mode simulation. The propagation engine uses `source_std` and `target_std` to convert standardized betas to real-world units. Regional stats must be median *within-country temporal std* (NOT cross-country std, which would be 1000x larger and destroy calibration).

---

## Phase 4: Regional SHAP

### 4A. Script: `simulation/precompute_regional_shap.py`

For each region, for each target, for each year:

1. Pool panel data for all countries in the region
2. Pivot to wide format (rows = country-year pairs, cols = indicators)
3. Compute composite target (e.g., QoL from 9 outcomes)
4. Train GradientBoostingRegressor (same hyperparams as country SHAP: n_estimators=100, max_depth=5, lr=0.1, subsample=0.8)
5. TreeExplainer → SHAP values with bootstrap CI (100 runs)
6. Save to `data/v31/temporal_shap/regional/{region_key}/{target}/{year}_shap.json`

Same JSON schema as country SHAP, with `region` instead of `country`.

**Cost:** 11 regions × 9 targets × 35 years = 3,465 SHAP files. Each takes ~0.5s → ~30 min single-threaded, ~5 min with 10 workers.

---

## Phase 5: Runtime Integration

### 5A. Graph Loader — `simulation/graph_loader_v31.py`

Add `'regional'` to `ViewType`:

```python
ViewType = Literal['country', 'stratified', 'unified', 'regional']
```

Add path resolution:

```python
elif view_type == 'regional':
    if region is None:
        raise ValueError("region required for view_type='regional'")
    return GRAPHS_DIR / "regional" / region / f"{year}_graph.json"
```

Add fallback chain for regional: `regional/{region}/{year} → unified/{year}`.

Update `load_temporal_graph` signature to accept optional `region: str` parameter.

### 5B. Propagation — No changes needed

`propagation_v31.py` is graph-agnostic. It takes an adjacency dict and propagates. No changes required — the regional graph produces the same adjacency structure.

### 5C. Simulation Runner — `simulation/simulation_runner_v31.py`

Update `run_simulation_v31`:
- Accept optional `region: str` parameter
- When `view_type='regional'`, pass `region` to graph loader
- For baselines: load from `baselines/regional/{region_key}/{year}.json`
- For indicator stats: load from `regional_indicator_stats/{region_key}.json`

Add `get_regional_indicator_stats(region_key)` to `indicator_stats.py`.

### 5D. Temporal Simulation — `simulation/temporal_simulation_v31.py`

Same pattern: accept `region` parameter, pass through to graph loader. Stats loading:
- `view_type='regional'` → `get_regional_indicator_stats(region_key)`

### 5E. API Layer — `api/routers/simulation.py`

New request field in `SimulationRequestV31`:

```python
region: Optional[str] = None  # region key, required when view_type='regional'
```

Validation: if `view_type='regional'`, require `region` and validate it's one of the 11 known keys. `country` becomes optional (not needed for regional sim, but could be used for baseline fallback).

New endpoints in `api/routers/temporal.py`:

```
GET /api/temporal/graph/regional/{region_key}/{year}     → regional graph for year
GET /api/temporal/shap/regional/{region_key}/{target}/timeline → regional SHAP timeline
GET /api/regions                                          → list of regions with metadata
```

### 5F. API Models — `api/models/`

Add `region` field to simulation request models. Add `RegionInfo` response model for `/api/regions`.

---

## Phase 6: Validation — Regional vs Country Aggregate

After regional pipeline is live, build a comparison script:

### `scripts/dev/compare_regional_vs_aggregate.py`

For a set of test scenarios (e.g., +20% health spending in SSA, +50% education spending in Southeast Asia):

1. Run regional simulation (single graph, fast)
2. Run country-level fan-out (all member countries, aggregate results)
3. Compare:
   - Correlation of per-indicator effects between regional vs aggregated
   - Mean absolute deviation
   - Whether country aggregate adds useful variance info (IQR across countries)
4. Report: does the country fan-out provide information that the regional graph misses?

**Decision point:** If the regional graph and country aggregate agree within ~15% for top-20 effects, skip the country fan-out in production. If they diverge meaningfully, optionally add a "show country spread" toggle that runs the fan-out on demand (not by default).

---

## File Changes Summary

### New Files

| File | Purpose |
|---|---|
| `simulation/region_classifier.py` | Authoritative region mapping for all 178 countries |
| `simulation/precompute_regional_graphs.py` | Generate regional temporal graphs (offline) |
| `simulation/precompute_regional_baselines.py` | Generate regional baselines (offline) |
| `simulation/precompute_regional_stats.py` | Generate regional indicator stats (offline) |
| `simulation/precompute_regional_shap.py` | Generate regional SHAP values (offline) |
| `scripts/dev/validate_regional_graphs.py` | Post-generation validation |
| `scripts/dev/compare_regional_vs_aggregate.py` | Regional vs country-aggregate comparison |

### Modified Files

| File | Change |
|---|---|
| `simulation/graph_loader_v31.py` | Add `regional` view type, `region` parameter |
| `simulation/simulation_runner_v31.py` | Accept `region`, load regional baselines/stats |
| `simulation/temporal_simulation_v31.py` | Accept `region`, pass through to loader |
| `simulation/indicator_stats.py` | Add `get_regional_indicator_stats()` |
| `simulation/regional_spillovers.py` | Import from `region_classifier` instead of inline map |
| `api/routers/simulation.py` | Add `region` to request model, validate |
| `api/routers/temporal.py` | Add regional graph/SHAP endpoints |
| `api/models/` | Add `region` field to request models |

### New Data (generated offline, gitignored)

```
data/v31/temporal_graphs/regional/          # 11 regions × 35 years = 385 files (~200MB)
data/v31/baselines/regional/                # 11 regions × 35 years = 385 files (~5MB)
data/v31/regional_indicator_stats/          # 11 files (~1MB)
data/v31/temporal_shap/regional/            # 11 × 9 × 35 = 3,465 files (~50MB)
```

---

## Execution Order

```
Step 1: region_classifier.py                    — map all 178 countries
Step 2: precompute_regional_graphs.py           — generate 385 graph files
Step 3: validate_regional_graphs.py             — sanity check outputs
Step 4: precompute_regional_baselines.py        — generate baseline JSONs
Step 5: precompute_regional_stats.py            — generate indicator stats
Step 6: precompute_regional_shap.py             — generate SHAP values
  -- verification checkpoint: spot-check data files --
Step 7: graph_loader_v31.py edits               — add regional view type
Step 8: indicator_stats.py edits                — add regional stats loader
Step 9: simulation_runner_v31.py edits          — wire up regional sim
Step 10: temporal_simulation_v31.py edits       — wire up regional temporal
Step 11: API model + router edits               — expose endpoints
Step 12: manual API test                        — curl test regional sim
Step 13: compare_regional_vs_aggregate.py       — validate accuracy
```

Steps 1-6 are offline precomputation (can run on this machine, 12 cores, ~30 min total).
Steps 7-11 are code changes (~200 lines across 6 files).
Steps 12-13 are validation.

---

## Open Questions

1. **Region consolidation:** Should `europe_central_asia` (Russia, Ukraine, Turkey, Kazakhstan) be merged into neighboring regions, or kept as its own? It's a grab-bag. Current plan: keep as-is, revisit if graph quality is poor.

2. **Temporal region membership:** Countries don't change regions (unlike income strata where countries move between developing/emerging/advanced over time). This simplifies the pipeline — region membership is static. Confirm this assumption is acceptable.

3. **Frontend scope:** This plan covers backend only. The map integration (choropleth + region selector → simulation panel) is a separate frontend plan that depends on this backend being ready. That plan should be written once this pipeline is implemented.
