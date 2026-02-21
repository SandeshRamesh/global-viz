# V3.1 API Server

FastAPI backend for the Global Causal Discovery visualization. Provides country-specific causal graphs and simulation endpoints.

## Quick Start

```bash
cd viz/api

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
viz/
├── data/
│   ├── v31/                    # V3.1 temporal outputs
│   │   ├── temporal_graphs/
│   │   ├── temporal_shap/
│   │   ├── baselines/
│   │   ├── development_clusters/
│   │   ├── feedback_loops/
│   │   └── metadata/
│   └── raw/                    # Baseline simulation inputs
│       ├── v21_panel_data_for_v3.parquet
│       ├── v21_nodes.csv
│       └── v21_causal_edges.csv
└── public/data/                # Frontend static data
```

### Option 1: Default (Local Development)

Data is expected at `viz/data/` by default. Override via environment variables if needed:

```bash
export DATA_ROOT=/path/to/data
export RAW_DATA_ROOT=/path/to/data/raw
export V21_GRAPH_PATH=/path/to/viz/public/data/v2_1_visualization_final.json
```

### Option 2: Download from Release

Data files are available from: [Contact maintainer for data access]

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/health/detailed` | GET | Detailed health (can be disabled in prod) |
| `/api/countries` | GET | List all 205 countries |
| `/api/countries/{code}` | GET | Country baseline values |
| `/api/graph/{code}` | GET | Country-specific causal graph |
| `/api/indicators` | GET | List all 2,583 indicators |
| `/api/simulate/v31` | POST | Canonical instant simulation (v3.1) |
| `/api/simulate/v31/temporal` | POST | Canonical temporal simulation (v3.1) |
| `/api/simulate` | POST | Deprecated alias to `/api/simulate/v31` |
| `/api/simulate/temporal` | POST | Deprecated alias to `/api/simulate/v31/temporal` |

Deprecated alias responses include:
- `Deprecation: true`
- `X-API-Deprecated: true`
- `Link: </api/simulate/v31...>; rel="successor-version"`

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_ENV` | development | Environment mode |
| `CORS_ORIGINS` | localhost:3000,5173,5174 | Allowed CORS origins |
| `CORS_ALLOW_WILDCARD` | false | Allow `*` origins (non-production recommended only) |
| `TRUST_PROXY_IPS` | 127.0.0.1,::1 | Upstream proxies allowed to supply forwarding IP headers |
| `RATE_LIMIT_ENABLED` | true | Enable rate limiting |
| `RATE_LIMIT_PER_MINUTE` | 100 | Requests per minute |
| `RATE_LIMIT_PER_HOUR` | 1000 | Requests per hour |
| `RATE_LIMIT_MAX_TRACKED_IPS` | 10000 | Max in-memory client IP records |
| `RATE_LIMIT_EVICT_FRACTION` | 0.10 | Fraction evicted when IP table exceeds cap |
| `GRAPH_SERVICE_GRAPH_CACHE_MAX` | 64 | Max cached country graphs in API graph service |
| `GRAPH_SERVICE_SHAP_CACHE_MAX` | 128 | Max cached SHAP payloads in API graph service |
| `TEMPORAL_SERVICE_SHAP_CACHE_MAX` | 256 | Max cached temporal SHAP files |
| `TEMPORAL_SERVICE_GRAPH_CACHE_MAX` | 192 | Max cached temporal graph files |
| `TEMPORAL_SERVICE_CLUSTER_CACHE_MAX` | 128 | Max cached cluster/feedback payloads |
| `API_ENABLE_DOCS` | true (dev), false (prod) | Enable `/docs` and `/redoc` |
| `HEALTH_DETAILED_ENABLED` | true (dev), false (prod) | Enable `/health/detailed` |
| `ENFORCE_PRODUCTION_ENV` | false | Fail startup if prod hardening checks fail |
| `SIMULATION_AUTH_ENABLED` | false (dev), true (prod) | Require auth for `/api/simulate*` |
| `SIMULATION_AUTH_TOKEN` | empty | Token accepted via `X-API-Key` or `Authorization: Bearer` |
| `CF_ACCESS_CLIENT_ID` | empty | Cloudflare Access service token ID |
| `CF_ACCESS_CLIENT_SECRET` | empty | Cloudflare Access service token secret |
| `LOG_LEVEL` | INFO | Logging verbosity |
| `DATA_ROOT` | `viz/data` | Root data directory |
| `RAW_DATA_ROOT` | `${DATA_ROOT}/raw` | Baseline simulation inputs |
| `V21_GRAPH_PATH` | `viz/public/data/v2_1_visualization_final.json` | V2.1 graph metadata |

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
# Quick secure default behind Cloudflare Tunnel:
# - loopback only
# - single worker (required for in-memory limiter consistency)
uvicorn main:app --host 127.0.0.1 --port 8000
```

## Public API

A hosted version is available at:
- `https://sim.globalwellbeing.info/api`

The frontend can toggle between local and public API in the UI.
