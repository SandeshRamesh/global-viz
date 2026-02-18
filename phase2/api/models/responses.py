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
    importance: Optional[float] = Field(None, description="SHAP importance score for sorting")


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
    base_year: Optional[int] = Field(None, description="Base year for simulation data")
    interventions: List[Dict[str, Any]]
    timeline: Dict[str, Dict[str, float]] = Field(
        ...,
        description="Values at each year (keys: year_0, year_1, ...)"
    )
    effects: Dict[str, Dict[str, Any]] = Field(
        ...,
        description="Effects at each year (keys: year_0, year_1, ...)"
    )
    affected_per_year: Dict[str, int] = Field(
        ...,
        description="Number of affected indicators per year (keys: year_0, year_1, ...)"
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


# =============================================================================
# V3.1 Response Models - Year-specific temporal graphs
# =============================================================================

class IncomeClassification(BaseModel):
    """Income classification for a country at a specific year."""
    group_4tier: Optional[str] = Field(None, description="World Bank 4-tier: Low/Lower-middle/Upper-middle/High")
    group_3tier: Optional[str] = Field(None, description="V3.1 3-tier: Developing/Emerging/Advanced")
    gni_per_capita: Optional[float] = Field(None, description="GNI per capita (Atlas method)")


class RegionInfo(BaseModel):
    """Regional spillover information."""
    region_key: Optional[str] = Field(None, description="Region identifier")
    name: Optional[str] = Field(None, description="Human-readable region name")
    spillover_strength: Optional[float] = Field(None, description="Regional spillover coefficient (0-1)")
    dominant_economy: Optional[str] = Field(None, description="Dominant economy in region")
    regional_leaders: Optional[List[str]] = Field(None, description="Regional economic leaders")


class SpilloverEffect(BaseModel):
    """Spillover effect for an indicator."""
    effect: float = Field(..., description="Spillover effect magnitude")
    spillover_strength: float = Field(..., description="Spillover coefficient used")
    direct_effect: float = Field(..., description="Original direct effect")
    region: Optional[str] = Field(None, description="Region (for regional spillovers)")


class SpilloverResults(BaseModel):
    """Regional and global spillover effects."""
    regional: Dict[str, SpilloverEffect] = Field(default_factory=dict)
    global_effects: Dict[str, SpilloverEffect] = Field(default_factory=dict, alias="global")
    region_info: Optional[RegionInfo] = None
    is_global_power: bool = Field(False, description="Whether country is a global power (USA, CHN, DEU)")


class EnsembleStats(BaseModel):
    """Ensemble simulation statistics."""
    n_runs: int = Field(..., description="Number of ensemble runs")
    converged_runs: int = Field(..., description="Number of runs that converged")
    convergence_rate: float = Field(..., description="Fraction of runs that converged")


class EffectDetailV31(BaseModel):
    """
    Details of effect on a single indicator (V3.1 with optional CIs).

    In percentage mode: only percent_change is populated.
    In absolute mode: all fields are populated.
    """
    # Always present
    percent_change: float

    # Only in absolute mode
    baseline: Optional[float] = Field(None, description="Baseline value (absolute mode only)")
    simulated: Optional[float] = Field(None, description="Simulated value (absolute mode only)")
    absolute_change: Optional[float] = Field(None, description="Absolute change (absolute mode only)")

    # Ensemble mode (optional)
    ci_lower: Optional[float] = Field(None, description="95% CI lower bound (if ensemble)")
    ci_upper: Optional[float] = Field(None, description="95% CI upper bound (if ensemble)")
    std: Optional[float] = Field(None, description="Standard deviation (if ensemble)")


class SimulationResponseV31(BaseModel):
    """
    Response for POST /api/simulate/v31.

    V3.1 instant simulation with year-specific graph, non-linear effects,
    regional spillovers, and optional ensemble uncertainty.
    """
    status: str
    mode: str = Field('percentage', description="Simulation mode: 'percentage' or 'absolute'")
    country: str
    base_year: int = Field(..., description="Year used for graph and baseline")
    view_type: str = Field(..., description="Requested view type")
    view_used: str = Field(..., description="Actual view used (may differ due to fallback)")
    income_classification: Optional[IncomeClassification] = Field(
        None, description="Country's income classification for this year"
    )
    interventions: List[Dict[str, Any]]
    effects: Dict[str, Any] = Field(
        ..., description="Effects with total_affected and top_effects"
    )
    propagation: Dict[str, Any] = Field(
        ..., description="Propagation metadata (iterations, converged)"
    )
    spillovers: Optional[SpilloverResults] = Field(
        None, description="Regional and global spillover effects"
    )
    ensemble: Optional[EnsembleStats] = Field(
        None, description="Ensemble statistics (if n_ensemble_runs > 0)"
    )
    metadata: Dict[str, Any] = Field(
        ..., description="Additional metadata (n_edges, p_value_threshold, etc.)"
    )


class TemporalSimulationResponseV31(BaseModel):
    """
    Response for POST /api/simulate/v31/temporal.

    V3.1 temporal simulation using year-by-year graphs.
    """
    status: str
    country: str
    base_year: int = Field(..., description="Starting year")
    horizon_years: int = Field(..., description="Years projected forward")
    view_type: str = Field(..., description="Requested view type")
    income_classification_evolution: Optional[Dict[int, IncomeClassification]] = Field(
        None, description="Income classification at each year"
    )
    interventions: List[Dict[str, Any]]
    timeline: Dict[int, Dict[str, float]] = Field(
        ..., description="Indicator values at each year"
    )
    effects: Dict[int, Dict[str, EffectDetailV31]] = Field(
        ..., description="Top effects at each year"
    )
    affected_per_year: Dict[int, int] = Field(
        ..., description="Number of affected indicators per year"
    )
    graphs_used: Dict[int, str] = Field(
        ..., description="Which graph view was used for each year"
    )
    spillovers: Optional[Dict[str, Any]] = Field(
        None, description="Spillover effects for final year"
    )
    metadata: Dict[str, Any] = Field(
        ..., description="Propagation and computation metadata"
    )
