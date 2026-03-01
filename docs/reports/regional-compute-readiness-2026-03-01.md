# Regional Compute Readiness Report (2026-03-01)

## Jobs Executed

Commands run from `viz/`:

```bash
python -m simulation.precompute_regional_graphs
python -m simulation.precompute_regional_baselines
python -m simulation.precompute_regional_shap
```

## Output Status

- Regional graph files: `260`
- Regional baseline files: `260`
- Regional SHAP files: `260`

Coverage reports generated:

- `data/v31/metadata/regional_graph_coverage.json`
- `data/v31/metadata/regional_baseline_coverage.json`
- `data/v31/metadata/regional_shap_coverage.json`

Per-region year coverage:

- `10` regions have `26` years each (`1999-2024`)
- `north_america` has `0` years (blocked by `min_countries_per_year=3`; only 2 countries mapped)

## Data Quality Checks

### Coverage

- Written region-year entries (all artifact types): `260`
- Contributor count per written region-year: min `5`, median `15`, max `51`

### Regional Graph Integrity

- Total regional graphs scanned: `260`
- Edge count per graph: min `3,134`, median `20,962`, max `39,128`
- Total edges scanned: `5,247,855`
- Non-finite betas: `0`
- Extreme betas (`|beta| > 5`): `76` (`~0.0014%` of scanned edges)

## Accuracy / Fidelity Checks

### Regional vs Country-Median Edge Weights (2024)

Compared each regional graph edge beta against the median beta from member-country graphs for aligned edges.

Aggregate across 10 regions:

- Mean beta MAE: `0.0638`
- Mean sign agreement: `0.973`
- Mean Pearson correlation: `0.971`
- Mean aligned-edge coverage: `0.322`

Interpretation:

- Regional graphs are a strong representation of central tendency where edges align.
- Edge alignment coverage is partial by design because country graphs remain heterogeneous and sparse in different places.

### Heterogeneity Signal (Need for Fan-Out)

For aligned edges in 2024, ratio of edges with mixed sign across member-country betas:

- Typical range: `0.40 - 0.57`
- Highest: `sub_saharan_africa = 0.676`
- Lowest: `central_asia = 0.307`

Interpretation:

- Inter-country heterogeneity is material in several regions.
- A single regional graph is suitable for primary/interactive UX, but country fan-out is useful for uncertainty bands in high-variance regions.

## Runtime Readiness Notes

- Instant regional simulation (`absolute` mode) succeeded.
- Temporal regional simulation succeeded after ensuring regional stats gracefully skip missing parquet dependencies and use cached country stats where available.

## Recommendation

1. Frontend integration can proceed now for `10` regions (`1999-2024`).
2. Hide or disable `north_america` regional simulation until policy changes (either lower threshold to 2 countries or provide synthetic aggregate).
3. Do **not** run full parallel country fan-out synchronously on every request.
   - Keep regional graph as default interactive path.
   - Add optional asynchronous fan-out (or periodic offline envelopes) for confidence intervals, especially for high-heterogeneity regions (`sub_saharan_africa`, `latin_america_caribbean`, `middle_east_north_africa`).
