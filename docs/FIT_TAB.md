# Fit Tab — Credibility View for the Anchor Findings

The **Fit** tab in the Data Quality panel answers one question a researcher asks
before they trust anything else in Atlas:

> *How well do these relationships actually fit the data, and does that hold up
> as evidence accumulates?*

It sits alongside Overview / Distribution / CI Stats and works in every view
mode. It reads a static precomputed artifact, so it renders correctly even when
the API is down.

---

## Architecture Overview

Two layers, scanned then drilled into:

```
Layer 1 — R² timeline  (unified scope, 1990-2024)
    "Does this finding hold up as the estimation window grows?"
    |
    |  tap a year
    v
Layer 2 — Predicted vs actual  (country scope, one year)
    "For that year, which countries does the model actually predict?"
```

Nothing is fitted in the browser. Both layers read
`public/data/credibility.json` (0.70 MB), precomputed from the shipped v3.1
temporal graphs plus the V2.1 panel data.

**Key files:**

| Layer | File |
|-------|------|
| Artifact generator | `scripts/dev/build_credibility_artifact.py` |
| Artifact | `public/data/credibility.json` |
| Types | `src/types/credibility.ts` |
| Loading + derivation | `src/services/credibility.ts` |
| Rendering | `src/components/simulation/CredibilityContent.tsx` |
| Tab wiring | `src/components/simulation/DataQualityPanel.tsx` |

---

## The five anchor edges

F08 is a two-leg causal chain, so it appears as two series.

| ID | Source → Target | Codes |
|----|-----------------|-------|
| F01 | Adult government benefit → Accumulated income per person | `agmxhoi992` → `accmhoi999` |
| F02 | College enrollment gender gap → Birth rate | `GER.5T8.GPIA` → `wdi_birth` |
| F06 | Local government power → Local election quality | `v2ellocpwr_ord` → `e_v2xel_locelec_4C` |
| F08a | Spending per person → Pre-tax government income | `acfcfci999` → `aptxgoi999` |
| F08b | Pre-tax government income → Agricultural income distribution | `aptxgoi999` → `agninci999` |

---

## How to read Layer 1 — the R² timeline

Two panels stacked on a shared year axis.

```
  1.0 ┤                                        ← R² panel (all five findings)
      │  ●●●●●●●●●                                bold+coloured = focused
  0.5 ┤           ●●●●●●●●●●●●●●●●                 thin grey     = the other four
      │
  0.0 ┼───────────────────────────────
     1990        2005         2024

  +1.0┤  ▁▂▃▅▆▆▆▆▆▆▆▆▆▆▆▆▆▆▆▆▆        ← β panel (focused finding only)
   0  ┼───────────────────────────────   shaded band = 95% bootstrap CI
  -1.0┤
```

### Why two panels and not one

β runs negative for some findings (F02 sits at −0.70) while R² is bounded to
[0, 1]. Plotting a β confidence band behind an R² line on one axis would put two
incompatible quantities on the same scale. They are separated instead: fit
quality on top, effect size and its stability below.

### The R² panel

- **Y axis is R² of the functional form actually selected** for that year —
  linear, threshold, quadratic, logarithmic or saturation. Where a non-linear
  form won, the readout also reports what the plain linear R² would have been.
- **X axis is the year the estimation window ends.** Every window starts at
  1990 and expands, so 2024 is fitted on 35 years of data and 1990 on one. The
  sample size `n` climbs accordingly — F02 goes from n=167 in 1990 to n=5,511 in
  2024.
- **A line that holds flat or climbs** means the relationship survives more
  evidence. **A line that falls** means the relationship weakens as more
  countries and years enter the pool.

Because the window expands rather than slides, this is *not* a time series of
"the effect in year X". It is a cumulative-evidence curve: how the estimate
looks given everything known up to that year.

### Dot states

| Dot | Meaning |
|-----|---------|
| Filled | Country-scope drill-down exists for that year — tappable |
| Hollow | No drill-down. Either before 1999 (too few observations) or a recent year the source indicator has not reported yet |

### The β panel

The line is the bootstrap mean of the standardised slope; the shaded band is the
2.5th–97.5th percentile over 100 bootstrap resamples. A band that narrows over
time is the effect estimate stabilising. A band that stays wide, or crosses zero,
means the sign of the effect is not settled.

### Worked examples from the shipped data

| Finding | 1990 | 2000 | 2010 | 2024 | Reading |
|---------|------|------|------|------|---------|
| F01 | 1.00 | 0.98 | 0.98 | 0.90 | Near-deterministic, drifting down slightly as coverage widens |
| F02 | 0.52 | 0.52 | 0.54 | 0.55 | Modest but rock-steady across a 33× increase in sample size |
| F06 | 0.77 | 0.80 | 0.82 | 0.84 | Strengthens as evidence accumulates |
| F08a | 0.99 | 0.89 | 0.51 | 0.61 | Decays sharply, bottoms at 0.45 in 2007, partly recovers |
| F08b | 0.98 | 0.69 | 0.46 | 0.63 | Same shape, bottoms at 0.37 in 2009 |

**F08 is the most informative series in the set.** Both legs start near-perfect
on a handful of countries, collapse as the pool widens through the 2000s, then
recover. That U-shape is what an honest fit-quality chart is for: the early
near-1.0 values are small-sample artefacts, not strong findings, and the chart
says so rather than hiding it. Select F08a or F08b in the legend to see it.

F02 is the opposite and equally useful: an unglamorous R² near 0.55 that does not
budge while n grows from 167 to 5,511. Stability under accumulating evidence is
a stronger credibility signal than a high R² on thin data.

---

## How to read Layer 2 — predicted vs actual

Tap any filled dot, or the **Predicted vs actual →** button, to open the scatter
for that finding and year.

```
        │                              ╱      dashed 45° line = perfect prediction
   pred │                        ● ●╱         above  = model over-predicts
        │                   ●  ●╱  ●          below  = model under-predicts
        │              ● ●╱ ●
        │         ●  ╱● ●
        │      ●╱  ●
        └──────────────────────────────
                    observed
```

- **One point per country**, positioned at (observed target value, fitted target
  value) for that year.
- **Point size** encodes how many observations that country's fit rests on.
  Small points are fitted on close to the 10-observation minimum and sit near the
  diagonal partly by construction.
- **Point colour** is that country's *own* R² on a red → amber → green ramp.
  A green point far from the diagonal is a country the model tracks well in shape
  but offsets in level.
- **Tap a point** for country name, observed, predicted, residual, percentage
  error, that country's R², the fitted functional form and the lag.
- **◀ ▶** steps through years without leaving the scatter.

### Why this is country scope, not unified

This is a deliberate correctness decision, not a convenience. In pooled scopes
(unified, stratified, regional) the lag shift is applied to a matrix indexed by
`(country, year)`, so an edge with lag ≥ 1 pairs the closing years of one
country's series with the opening years of the next — 2,242 of 7,368 unified
edges use a non-zero lag. Plotting those pairings would show a reviewer country
pairs that are not real.

Fitting each country on its own series alone removes the problem structurally
rather than warning about it. The green banner above the scatter states this.

### Linear vs log axes

Economic indicators span orders of magnitude across countries. On F08b in 2023
the values run from 589 to 1.53 × 10⁹ — a 2.6-million-fold spread — and on a
linear axis 207 of 218 countries fall inside the first 1% of the range, i.e. a
single unreadable smear at the origin. Axes therefore default to **log** when the
spread exceeds 1000× and every value is positive, and to **linear** otherwise
(F02's birth rate, 0–45, stays linear). The toggle sits above the chart. When a
log axis is active, any country with a non-positive value is counted in a note
beneath the chart rather than silently dropped.

### The three summary numbers

| Stat | Meaning |
|------|---------|
| **Med % err** | Median absolute percentage error across countries. The headline accuracy number |
| **Med \|resid\|** | Median absolute residual in the target's native units |
| **R² ≥ .5** | Share of countries whose own fit clears R² = 0.5 |

**There is deliberately no observed-vs-predicted correlation here.** With target
values spanning five orders of magnitude that correlation reads above 0.99
almost regardless of fit quality — it measures the spread of country sizes, not
the model. Median percentage error stays honest at any scale.

---

## Where the numbers come from

**Layer 1 is read, not computed.** Every value — R², β, CI, p-value, n, lag,
relationship type — is lifted verbatim from
`data/v31/temporal_graphs/unified/{year}_graph.json`, the same files the site
serves.

**Layer 2 is reconstructed**, because no fitted values or model objects are
stored anywhere in the pipeline. A4 (`lasso_effect_estimates.pkl`) keeps only
`beta`, `ci_lower`, `ci_upper`, `n_selected` and `sample_size` per edge — no R²,
no residuals, no pickled estimator. The v3.1 graphs add R² and the full
functional-form parameters but still no fitted values.

The generator therefore re-implements the v3.1 edge fit from
`v3.1/scripts/phase2_compute/phase2B/compute_temporal_graphs_v2.py`: select the
lag 0–5 that maximises linear R², then select the functional form by AIC subject
to the same gates (ΔAIC > 2.0 and ΔR² > 0.03), then evaluate it.

One wrinkle worth knowing: the upstream threshold fit stores the two segment
slopes and the split point but **not** the two intercepts, so a stored threshold
edge cannot be evaluated from the graph JSON alone. The generator recovers the
intercepts by refitting each segment from the panel.

### How we know the reconstruction is faithful

The generator refuses to write the artifact unless both checks pass:

1. **Fit reproduction** — 43 country/year/edge fits are compared against the
   stored country graph JSONs. Lag, linear R² (to 1e-9), selected functional
   form and sample size must all match exactly.
2. **Prediction reproduction** — 97 fits confirm that evaluating the fitted form
   reproduces that form's stored R² to 1e-9, across linear (50), threshold (44),
   quadratic (2) and logarithmic (1) edges.

Run check 1 alone with `--validate`.

---

## Known limitations

These are surfaced in the UI under **Known limitations**, not left for a
reviewer to discover.

1. **Cross-country lag pairing in pooled scopes** *(warning)* — described above.
   The Layer 1 timeline reads the pooled fit and inherits it; the Layer 2
   drill-down does not. Fixing the pairing in a preprocessing step remains open
   before publication.
2. **A4 artifact inconsistency for F08a** *(note)* — in
   `v2.1/outputs/A4/lasso_effect_estimates.pkl` the F08a edge carries
   β = 1.602 with a bootstrap CI of [−6.140, −2.015]: the point estimate falls
   outside its own interval and the signs disagree. Nothing in this tab derives
   from A4 — the serving layer is v3.1 — but anyone tracing a finding back to
   the A4 pickle should meet the flag first.
3. **Predictions are in-sample** *(note)* — year Y lies inside the window the
   coefficients were estimated on. Points near the diagonal show fit, not
   predictive skill.

### Coverage

Drill-down starts at **1999** — a country needs 10 observations from 1990 to be
fitted at all — and ends between **2022 and 2024** depending on when the source
indicator last reported. The readout defaults to the most recent year that
actually has points, so the drill-down button is never dead on open.

| Finding | Drill-down years | Country points |
|---------|------------------|----------------|
| F01 | 1999–2023 | 1,855 |
| F02 | 1999–2022 | 3,562 |
| F06 | 1999–2024 | 2,119 |
| F08a | 1999–2024 | 2,542 |
| F08b | 1999–2023 | 5,438 |

---

## Regenerating the artifact

The generator reads the research data from the canonical checkout
(`/home/sandesh/Documents/Global_Project/viz/data/`), which is gitignored here at
~19 GB. It is read-only with respect to every research artifact; the only file
it writes is the output JSON.

```bash
# verify the re-implementation against the shipped graphs, write nothing
python scripts/dev/build_credibility_artifact.py --validate

# validate, then build public/data/credibility.json
python scripts/dev/build_credibility_artifact.py

# build without the pre-flight validation
python scripts/dev/build_credibility_artifact.py --skip-validate
```

Requires `pandas`, `numpy`, `pyarrow` and `scipy`; the API venv at
`api/venv/bin/python` has them.

To change which findings appear, edit the `ANCHORS` list at the top of the
generator and rebuild. To change the disclosure text shown in the UI, edit
`DISCLOSURES` in the same file — the copy lives in the artifact, not the
component.

> **Note on `.gitignore`:** the `data/` rule is anchored as `/data/`. Unanchored,
> it also matched `public/data/`, which silently excluded runtime assets from git
> and from the Docker image. If the artifact 404s in production, check that rule
> first.
