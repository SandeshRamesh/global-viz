# Regional Compute Readiness Report (2026-03-01)

## Jobs Executed

Commands run from `viz/`:

```bash
python -m simulation.precompute_regional_graphs
python -m simulation.precompute_regional_baselines
python -m simulation.precompute_regional_shap
python -m simulation.precompute_regional_stats
```

## Output Status

- Regional graph files: `286`
- Regional baseline files: `286`
- Regional SHAP files: `286`
- Regional indicator stats files: `11`

Coverage reports generated:

- `data/v31/metadata/regional_graph_coverage.json`
- `data/v31/metadata/regional_baseline_coverage.json`
- `data/v31/metadata/regional_shap_coverage.json`
- `data/v31/metadata/regional_indicator_stats_coverage.json`

Per-region year coverage:

- `11` regions have `26` years each (`1999-2024`)
- `north_america` is now generated and available (`Canada` + `United States`; Mexico remains in `latin_america_caribbean`)

## Data Quality Checks

### Coverage

- Written region-year entries (graphs/baselines/SHAP): `286`
- Contributor count per written region-year: min `2`, median `13`, max `51`

### Regional Graph Integrity

- Total regional graphs scanned: `286`
- Edge count per graph: min `752`, median `3,838`, max `6,329`
- Total edges scanned: `1,093,922`
- Non-finite betas: `0`
- Extreme betas (`|beta| > 5`): `0`

### Aggregation Hardening Checks

- Edge-country coverage threshold enabled: default `>= max(2, ceil(30% * contributors))`
- Example (2024):
  - `sub_saharan_africa`: `39,128` candidate edge keys, `2,973` retained, threshold `16` countries
  - `north_america`: `7,721` candidate edge keys, `1,039` retained, threshold `2` countries
- Nonlinearity schema parity restored in regional graphs:
  - edges with `nonlinearity` block: `1,093,922 / 1,093,922`
  - edges with `marginal_effects`: `897,359 / 1,093,922`

## Accuracy / Fidelity Checks

### Regional vs Country-Median Edge Weights (2024)

Regional edges are now computed as medians over retained country-support sets, so aligned-edge fidelity is exact by construction.

Aggregate across 11 regions:

- Mean beta MAE: `0.0`
- Mean sign agreement: `1.0`
- Mean Pearson correlation: `1.0`
- Mean aligned-edge coverage vs country-edge union: `0.1804`

Interpretation:

- Central tendency fidelity on retained edges is exact.
- The retained graph is intentionally sparser than raw edge unions to reduce one-country noise.

### Heterogeneity Signal (Need for Fan-Out)

Mixed-sign ratio on aligned 2024 country edges:

- Highest: `sub_saharan_africa = 0.697`
- Lowest: `north_america = 0.184`
- Typical high-variance regions remain: `sub_saharan_africa`, `latin_america_caribbean`, `middle_east_north_africa`

Interpretation:

- Regional graphs are stable for primary simulation outputs.
- Country-level heterogeneity is still material in several regions, so fan-out remains valuable for uncertainty bands, not as the default serving path.

## Runtime Readiness Notes

- Instant regional simulation (`absolute` mode) succeeded for `north_america`.
- Temporal regional simulation (`n_ensemble_runs=2`) succeeded for `north_america`.
- Regional indicator stats are now precomputed for all 11 regions using country cache + baseline-cache fallback (no parquet hard dependency at runtime).

## Recommendation

1. Frontend integration can proceed for all `11` regions (`1999-2024`).
2. Do **not** run full parallel country fan-out synchronously on every live request.
3. Use regional graph simulation as the default online path; add optional asynchronous fan-out for uncertainty envelopes in high-heterogeneity regions.
