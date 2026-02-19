# V3.0 API Server

FastAPI backend for the Global Causal Discovery visualization. Provides country-specific causal graphs and simulation endpoints.

## Quick Start

```bash
cd viz/phase2/api

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Set up data (see below)

# Run server
uvicorn main:app --reload --port 8000
```

Server runs at: `http://localhost:8000`
API docs at: `http://localhost:8000/docs`

## Data Setup

The data files are not included in git (854MB). You need to obtain them separately.

### Required Directory Structure

```
Global_Project/
├── v3.1/data/              # V3.1 temporal outputs
│   ├── v3_1_temporal_graphs/
│   ├── v3_1_temporal_shap/
│   ├── v3_1_development_clusters/
│   ├── v3_1_feedback_loops/
│   └── metadata/
└── v3.0/data/raw/           # Baseline simulation inputs
    ├── v21_panel_data_for_v3.parquet
    ├── v21_nodes.csv
    └── v21_causal_edges.csv
```

### Option 1: Copy from v3.0 (Local Development)

If you have the Global_Project repo available locally:

```bash
# Example: override via environment variables (recommended)
export GLOBAL_PROJECT_ROOT=/path/to/Global_Project
export V31_DATA_ROOT=/path/to/Global_Project/v3.1/data
export V30_RAW_DATA_ROOT=/path/to/Global_Project/v3.0/data/raw
export V21_GRAPH_PATH=/path/to/Global_Project/viz/phase2/public/data/v2_1_visualization_final.json
```

### Option 2: Download from Release

Data files are available from: [Contact maintainer for data access]

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/countries` | GET | List all 205 countries |
| `/api/countries/{code}` | GET | Country baseline values |
| `/api/graph/{code}` | GET | Country-specific causal graph |
| `/api/indicators` | GET | List all 2,583 indicators |
| `/api/simulate` | POST | Instant intervention simulation |
| `/api/simulate/temporal` | POST | Multi-year temporal projection |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_ENV` | development | Environment mode |
| `CORS_ORIGINS` | localhost:3000,5173 | Allowed CORS origins |
| `RATE_LIMIT_ENABLED` | true | Enable rate limiting |
| `RATE_LIMIT_PER_MINUTE` | 100 | Requests per minute |
| `LOG_LEVEL` | INFO | Logging verbosity |
| `GLOBAL_PROJECT_ROOT` | auto | Repo root if not in default location |
| `V31_DATA_ROOT` | `${GLOBAL_PROJECT_ROOT}/v3.1/data` | V3.1 temporal outputs |
| `V30_RAW_DATA_ROOT` | `${GLOBAL_PROJECT_ROOT}/v3.0/data/raw` | Baseline simulation inputs |
| `V21_GRAPH_PATH` | `${GLOBAL_PROJECT_ROOT}/viz/phase2/public/data/v2_1_visualization_final.json` | V2.1 graph metadata |

## Development

```bash
# Run with auto-reload
uvicorn main:app --reload --port 8000

# Run tests
pytest tests/

# Type checking
mypy .
```

## Production

```bash
# Run with multiple workers
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Public API

A hosted version is available at:
- `https://sim.globalwellbeing.info/api`

The frontend can toggle between local and public API in the UI.
