"""
Request Models

Pydantic schemas for API request validation.
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class InterventionInput(BaseModel):
    """Single intervention specification."""
    indicator: str = Field(..., description="Indicator ID to modify")
    change_percent: float = Field(
        ...,
        description="Percent change to apply (-100 to +1000)",
        ge=-100,
        le=1000
    )

    class Config:
        json_schema_extra = {
            "example": {
                "indicator": "v2elvotbuy",
                "change_percent": 20.0
            }
        }


class SimulationRequest(BaseModel):
    """Request for instant simulation."""
    country: str = Field(..., description="Country name or code")
    interventions: List[InterventionInput] = Field(
        ...,
        description="List of interventions to apply",
        min_length=1,
        max_length=20
    )
    year: Optional[int] = Field(
        None,
        description="Baseline year (default: most recent)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "country": "Australia",
                "interventions": [
                    {"indicator": "v2elvotbuy", "change_percent": 20}
                ]
            }
        }


class TemporalSimulationRequest(BaseModel):
    """Request for temporal simulation with lags."""
    country: str = Field(..., description="Country name or code")
    interventions: List[InterventionInput] = Field(
        ...,
        description="List of interventions to apply",
        min_length=1,
        max_length=20
    )
    horizon_years: int = Field(
        10,
        description="Years to project forward (1-30)",
        ge=1,
        le=30
    )
    year: Optional[int] = Field(
        None,
        description="Baseline year (default: most recent)"
    )
    use_significant_lags_only: bool = Field(
        False,
        description="Only use edges with statistically significant lags"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "country": "Australia",
                "interventions": [
                    {"indicator": "v2elvotbuy", "change_percent": 20}
                ],
                "horizon_years": 10
            }
        }
