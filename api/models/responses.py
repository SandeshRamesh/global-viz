"""
Response Models

Pydantic schemas for API responses.
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any


# --- Country Models ---

class CountryInfo(BaseModel):
    """Basic country information."""
    name: str
    n_edges: int
    n_edges_with_data: int
    coverage: float = Field(..., description="Data coverage (0-1)")


class CountryListResponse(BaseModel):
    """Response for GET /api/countries."""
    total: int
    countries: List[CountryInfo]


# --- Graph Models ---

class EdgeInfo(BaseModel):
    """Single edge in a graph."""
    source: str
    target: str
    beta: float
    ci_lower: float
    ci_upper: float
    global_beta: float
    data_available: bool
    lag: Optional[int] = None
    lag_pvalue: Optional[float] = None
    lag_significant: Optional[bool] = None


class GraphResponse(BaseModel):
    """Response for GET /api/graph/{country}."""
    country: str
    n_edges: int
    n_edges_with_data: int
    edges: List[Dict[str, Any]]
    baseline: Dict[str, float] = Field(
        ...,
        description="Current indicator values"
    )
    shap_importance: Dict[str, float] = Field(
        default_factory=dict,
        description="Country-specific SHAP importance for node sizing (0-1 normalized)"
    )
    metadata: Dict[str, Any]


# --- Indicator Models ---

class IndicatorInfo(BaseModel):
    """Basic indicator information."""
    id: str
    label: Optional[str] = None
    domain: Optional[str] = None


class IndicatorDetailResponse(BaseModel):
    """Response for GET /api/indicators/{id}."""
    id: str
    label: Optional[str] = None
    description: Optional[str] = None
    domain: Optional[str] = None
    ring: Optional[int] = None
    shap_importance: Optional[float] = None
    in_degree: Optional[int] = None
    out_degree: Optional[int] = None
    data_available: bool = True


class IndicatorListResponse(BaseModel):
    """Response for GET /api/indicators."""
    total: int
    indicators: List[IndicatorInfo]


# --- Simulation Models ---

class EffectDetail(BaseModel):
    """Details of effect on a single indicator."""
    baseline: float
    simulated: float
    absolute_change: float
    percent_change: float


class SimulationResponse(BaseModel):
    """Response for POST /api/simulate."""
    status: str
    country: str
    interventions: List[Dict[str, Any]]
    effects: Dict[str, Any] = Field(
        ...,
        description="Simulation effects"
    )
    propagation: Dict[str, Any] = Field(
        ...,
        description="Propagation metadata"
    )


class TemporalEffects(BaseModel):
    """Effects at a single time point."""
    year: int
    effects: Dict[str, EffectDetail]


class TemporalSimulationResponse(BaseModel):
    """Response for POST /api/simulate/temporal."""
    status: str
    country: str
    horizon_years: int
    interventions: List[Dict[str, Any]]
    timeline: Dict[int, Dict[str, float]] = Field(
        ...,
        description="Values at each year"
    )
    effects: Dict[int, Dict[str, Any]] = Field(
        ...,
        description="Effects at each year"
    )
    affected_per_year: Dict[int, int] = Field(
        ...,
        description="Number of affected indicators per year"
    )
    metadata: Dict[str, Any]


# --- Metadata Models ---

class MetadataResponse(BaseModel):
    """Response for GET /api/metadata."""
    version: str
    total_countries: int
    total_indicators: int
    total_edges: int
    graphs_with_lags: int
    significant_lags: int


# --- Error Models ---

class ErrorResponse(BaseModel):
    """Error response schema."""
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None
