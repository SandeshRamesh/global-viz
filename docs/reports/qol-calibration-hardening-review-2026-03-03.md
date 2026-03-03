# QoL Calibration Hardening Review (2026-03-03)

## Scope

Pipeline-only QoL calibration hardening:
- `/home/sandesh/Documents/Global_Project/viz/simulation/precompute_qol_scores.py`
- `/home/sandesh/Documents/Global_Project/viz/simulation/qol_definition.py`
- Regenerated artifacts:
  - `/home/sandesh/Documents/Global_Project/viz/data/v31/metadata/qol_calibration_v1.json`
  - `/home/sandesh/Documents/Global_Project/viz/data/v31/metadata/qol_direction_overrides_v1.json`
  - `/home/sandesh/Documents/Global_Project/viz/data/v31/metadata/qol_direction_override_diagnostics_v1.json`
  - `/home/sandesh/Documents/Global_Project/viz/data/v31/qol_scores/country_year_qol_v1.json`

No frontend/API contract changes.

## Root Causes Confirmed

1. Piecewise calibration compression at the top end inflated mid-range developing-country scores.
2. Unbounded z-score aggregation created outlier sensitivity in raw QoL.
3. Equal domain averaging over-weighted noisier/sparser domains.
4. Direction flips lacked diagnostics for auditability.

## Final Method

1. **Higher-resolution monotonic calibration**
   - Increased from 20 to 50 breakpoints (quantile-spaced).

2. **Robust raw-score construction**
   - z-score clip: `±1.5`
   - minimum indicators per domain: `10`
   - non-negative learned domain weights (HDI-aligned):
     - Development: `0.066242`
     - Economic: `0.278047`
     - Education: `0.365302`
     - Environment: `0.0`
     - Governance: `0.0`
     - Health: `0.290409`

3. **Residual correction layer (new)**
   - Added deterministic KNN Gaussian residual model over:
     - base calibrated score
     - domain means
     - indicator/domain coverage counts
   - Serialized into calibration metadata and applied at runtime in `compute_qol`.
   - Model settings: `k=8`, `bandwidth=0.5`, `residual_clip=0.2`.

4. **Direction-flip governance**
   - Stored only true metadata flips (`544` indicators).
   - Added diagnostics artifact for top-impactful flips.

## Validation

### 2020 Baseline (before residual layer)
- MAE: `0.0430`
- P95 |delta|: `0.1404`
- Max |delta|: `0.2809`
- |delta| > 0.12: `13`

### 2020 Corrected (full final calibration)
- MAE: `0.0090`
- P95 |delta|: `0.0255`
- Max |delta|: `0.0809`
- |delta| > 0.12: `0`

### 2020 Holdout Quality (train <= 2019, eval = 2020)
- MAE: `0.0159`
- P95 |delta|: `0.0458`
- Max |delta|: `0.1032`
- |delta| > 0.12: `0`

This clears the target gate (`MAE < 0.04`, `no country with |delta| > 0.12`) with holdout validation.

## Key Country Sanity Check (2020)

| Country | QoL | HDI | Delta |
|---|---:|---:|---:|
| India | 0.641 | 0.638 | +0.003 |
| Niger | 0.359 | 0.394 | -0.035 |
| China | 0.784 | 0.781 | +0.003 |
| Norway | 0.956 | 0.963 | -0.007 |
| United States | 0.926 | 0.923 | +0.003 |
| Ethiopia | 0.478 | 0.489 | -0.011 |

## Runtime Cost Check

`compute_qol` with residual correction averages about `4.17 ms` per call on local venv benchmark (India 2020 sample), acceptable for current instant simulation path.

## Remaining Risks

1. Residual model is data-driven and should be re-trained whenever indicator metadata or baseline generation changes.
2. If dataset composition shifts materially, monitor drift using the holdout metrics already emitted into calibration stats.
