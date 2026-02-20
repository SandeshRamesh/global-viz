# Semantic Hierarchy Visualization (Phase 3)

Interactive D3 + React visualization with policy simulation controls backed by the v3.1 API.

## Features

- 6-ring hierarchical structure (Root → Outcomes → Coarse Domains → Fine Domains → Indicator Groups → Indicators)
- Interactive zoom and pan
- Color-coded domains
- Click nodes to view details
- Real-time statistics and ring breakdowns

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5174 in your browser.

Backend API default: http://localhost:8000

Canonical simulation endpoints:
- `POST /api/simulate/v31`
- `POST /api/simulate/v31/temporal`

Compatibility aliases (deprecated, still supported):
- `POST /api/simulate` -> `/api/simulate/v31`
- `POST /api/simulate/temporal` -> `/api/simulate/v31/temporal`

## Build

```bash
npm run build
npm run preview
```

## Data Format

This version only supports v2.1 data format. The data file should be placed at
`/public/data/v2_1_visualization_final.json`.

See `/home/sandesh/Documents/Global_Project/viz/phase3/CLAUDE.md` for architecture notes.
