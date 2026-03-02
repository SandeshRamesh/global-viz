# QoL Composite V2 (Current)

## Purpose
Define a single, simulation-reactive quality-of-life score that is:
- computable for every country-year in `data/v31/baselines`
- consistent between map rendering and simulation outputs
- structurally aligned with V3.1 target construction (indicator min-max -> domain means -> overall mean)

## Definition ID
`qol_v2_minmax_hdi_calibrated`

## Data Scope
- Countries: canonical 178 countries in V3.1 baselines
- Years: **1999-2024** (current baseline coverage)
- Source files:
  - baselines: `data/v31/baselines/{country}/{year}.json`
  - indicator metadata + direction: `data/v31/metadata/indicator_properties.json`
  - domain mapping: `data/raw/v21_nodes.csv` (layer-5 indicators)

## Computation
For each country-year:
1. Use year-specific indicator min/max stats (fallback to global stats if missing).
2. Normalize each indicator to `[0,1]`:
   - `norm = (x - min) / (max - min)`
   - clamp to `[0,1]`
3. If indicator direction is negative, invert:
   - `norm = 1 - norm`
4. Aggregate by domain using arithmetic mean.
5. Aggregate domains using arithmetic mean -> `raw_qol`.
6. Apply monotonic isotonic calibration from `raw_qol` to HDI-like scale -> `calibrated_qol`.

`calibrated_qol` is the value used by map and simulation responses.

## Runtime Contracts
- Instant simulation (`POST /api/simulate/v31`) returns:
  - `qol: { baseline, simulated, delta, n_indicators, n_domains }`
- Temporal simulation (`POST /api/simulate/v31/temporal`) returns:
  - `qol_timeline: { [year]: { baseline, simulated, delta, n_indicators, n_domains } }`

## Map API Contract
- `GET /api/map/qol-scores`
  - validates requested year against precomputed coverage
  - returns `year_min` and `year_max` metadata
- `GET /api/map/qol-scores/all`
  - returns all years plus `year_min/year_max`

## Regeneration
Run when methodology, metadata, or baselines change:

```bash
source api/venv/bin/activate
python -m simulation.precompute_qol_scores
```

Artifacts regenerated:
- `data/v31/metadata/qol_normalization_stats_v1.json`
- `data/v31/metadata/qol_calibration_v1.json`
- `data/v31/qol_scores/country_year_qol_v1.json`
