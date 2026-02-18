# Visualization Track

This folder contains the visualization implementation phases.

## Current Definition (As Of 2026-02-18)

- **Current Implementation**: `viz/phase2/`
- `viz/phase1/`: Earlier explorer-only build (v2.1)
- `viz/phase3-5/`: Placeholder notes only

## Data Dependencies

`viz/phase2/` expects:

- V2.1 unified graph metadata at:
  - `viz/phase2/public/data/v2_1_visualization_final.json`
- V3.1 temporal data for API endpoints (served by `viz/phase2/api/`):
  - `v3.1/data/v3_1_temporal_shap/`
  - `v3.1/data/v3_1_temporal_graphs/`
  - `v3.1/data/v3_1_development_clusters/`
  - `v3.1/data/v3_1_feedback_loops/`

See `viz/phase2/.env.example` and `viz/phase2/api/.env.example` for configuration.
