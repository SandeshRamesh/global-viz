"""
API Configuration

Paths, settings, and environment configuration for the V3.0 API.
"""

import os
from pathlib import Path

# Environment
ENV = os.getenv("API_ENV", "development")  # development, staging, production

# Project paths
PROJECT_ROOT = Path(__file__).parent  # viz/phase2/api
REPO_ROOT = Path(os.getenv("GLOBAL_PROJECT_ROOT", PROJECT_ROOT.parents[2]))

# V3.1 Data Root (all data now comes from V3.1 research run)
V31_DATA_ROOT = Path(os.getenv("V31_DATA_ROOT", REPO_ROOT / "v3.1" / "data"))

# V3.1 Temporal Data
V31_TEMPORAL_SHAP_DIR = V31_DATA_ROOT / "v3_1_temporal_shap"
V31_TEMPORAL_GRAPHS_DIR = V31_DATA_ROOT / "v3_1_temporal_graphs"
V31_CLUSTERS_DIR = V31_DATA_ROOT / "v3_1_development_clusters"
V31_FEEDBACK_LOOPS_DIR = V31_DATA_ROOT / "v3_1_feedback_loops"
V31_INCOME_CLASSIFICATIONS = V31_DATA_ROOT / "metadata" / "income_classifications.json"
V31_COUNTRY_TRANSITIONS = V31_DATA_ROOT / "metadata" / "country_transitions.json"
V31_COUNTRY_DATA_QUALITY = V31_DATA_ROOT / "metadata" / "country_data_quality.json"
V31_BASELINES_DIR = V31_DATA_ROOT / "v3_1_baselines"

# Country graphs now come from V3.1 temporal graphs (use latest year by default)
GRAPHS_DIR = V31_TEMPORAL_GRAPHS_DIR / "countries"
COUNTRY_SHAP_DIR = V31_TEMPORAL_SHAP_DIR / "countries"
DEFAULT_GRAPH_YEAR = 2024  # Default year for non-temporal country graph requests

# Panel data for simulations (still from v3.0 raw - needed for baseline values)
RAW_DIR = Path(os.getenv("V30_RAW_DATA_ROOT", REPO_ROOT / "v3.0" / "data" / "raw"))
PANEL_PATH = RAW_DIR / "v21_panel_data_for_v3.parquet"
NODES_PATH = RAW_DIR / "v21_nodes.csv"
EDGES_PATH = RAW_DIR / "v21_causal_edges.csv"

# V2.1 unified graph (for indicator metadata - hierarchy structure)
V21_GRAPH_PATH = Path(os.getenv(
    "V21_GRAPH_PATH",
    PROJECT_ROOT.parent / "public" / "data" / "v2_1_visualization_final.json"
))

# Income strata for stratified views
INCOME_STRATA = ["developing", "emerging", "advanced"]

# Temporal data settings
TEMPORAL_YEAR_MIN = 1990
TEMPORAL_YEAR_MAX = 2024
TEMPORAL_TARGETS = [
    "quality_of_life", "health", "education", "economic", "governance",
    "environment", "demographics", "security", "development"
]

# API settings
API_VERSION = "3.0.0"
API_TITLE = "Global Causal Discovery API"
API_DESCRIPTION = """
## V3.0 Policy Intervention Simulator

Country-specific causal simulation for policy analysis.

### Features
- **203 country-specific causal graphs** with 7,368 edges each
- **Instant simulation**: Propagate interventions through causal network
- **Temporal simulation**: Project effects over 1-20 year horizons with lag effects
- **2,583 development indicators** across economic, social, and governance domains

### Rate Limits
- 100 requests/minute per IP
- 1,000 requests/hour per IP

### Timeouts
- Instant simulation: 10 seconds
- Temporal simulation: 15 seconds

### Support
- Documentation: https://docs.argonanalytics.com
- Issues: https://github.com/argonanalytics/v3-api/issues
"""

# CORS settings
DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]
CORS_ALLOW_WILDCARD = os.getenv("CORS_ALLOW_WILDCARD", "false").lower() == "true"
_default_cors = DEFAULT_CORS_ORIGINS + (["*"] if ENV != "production" else [])
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", ",".join(_default_cors)).split(",")
    if origin.strip()
]

if "*" in CORS_ORIGINS and ENV == "production" and not CORS_ALLOW_WILDCARD:
    CORS_ORIGINS = [origin for origin in CORS_ORIGINS if origin != "*"]
    if not CORS_ORIGINS:
        CORS_ORIGINS = DEFAULT_CORS_ORIGINS

CORS_ALLOW_CREDENTIALS = "*" not in CORS_ORIGINS

# Rate limiting
RATE_LIMIT_ENABLED = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"
RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "100"))
RATE_LIMIT_PER_HOUR = int(os.getenv("RATE_LIMIT_PER_HOUR", "1000"))

# Timeouts (seconds)
SIMULATION_TIMEOUT = int(os.getenv("SIMULATION_TIMEOUT", "10"))
TEMPORAL_TIMEOUT = int(os.getenv("TEMPORAL_TIMEOUT", "60"))

# Simulation limits
DEFAULT_HORIZON_YEARS = 10
MAX_HORIZON_YEARS = 40
MAX_INTERVENTIONS = 20

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_DIR = PROJECT_ROOT / "logs"

# Contact info
CONTACT_NAME = "Argon Analytics"
CONTACT_URL = "https://argonanalytics.com"
CONTACT_EMAIL = "support@argonanalytics.com"
