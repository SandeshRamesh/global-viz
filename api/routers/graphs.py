"""
Graphs Router

Endpoints for country graph data.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from ..services import graph_service
from ..models import GraphResponse

router = APIRouter(prefix="/graph", tags=["graphs"])


@router.get("/{country}/timeline")
async def get_country_timeline(
    country: str,
    start_year: Optional[int] = Query(None, description="Start year (default: 10 years before end)"),
    end_year: Optional[int] = Query(None, description="End year (default: most recent)")
):
    """
    Get historical timeline of indicator values for a country.

    Returns multi-year panel data for historical playback visualization.
    Default returns last 10 years of data.
    """
    if not graph_service.country_exists(country):
        raise HTTPException(
            status_code=404,
            detail=f"Country '{country}' not found"
        )

    timeline = graph_service.get_historical_timeline(country, start_year, end_year)

    if not timeline['years']:
        raise HTTPException(
            status_code=404,
            detail=f"No timeline data found for '{country}'"
        )

    return {
        'country': country,
        'start_year': timeline['years'][0] if timeline['years'] else None,
        'end_year': timeline['years'][-1] if timeline['years'] else None,
        'years': timeline['years'],
        'values': timeline['values'],
        'n_indicators': len(timeline['indicators'])
    }


@router.get("/{country}", response_model=GraphResponse)
async def get_country_graph(
    country: str,
    year: Optional[int] = Query(None, description="Baseline year for indicator values")
):
    """
    Get full graph data for a country.

    Returns all edges with coefficients, confidence intervals, and lag data.
    Also includes current baseline values for all indicators.

    Cache this per-session on client side.
    """
    # Verify country exists
    if not graph_service.country_exists(country):
        raise HTTPException(
            status_code=404,
            detail=f"Country '{country}' not found"
        )

    # Load graph
    graph = graph_service.get_country_graph(country)
    if not graph:
        raise HTTPException(
            status_code=500,
            detail=f"Error loading graph for '{country}'"
        )

    # Get baseline values
    baseline = graph_service.get_baseline_values(country, year)

    # Get country-specific SHAP importance for node sizing
    shap_importance = graph_service.get_country_shap(country)

    return GraphResponse(
        country=country,
        n_edges=graph.get('n_edges', 0),
        n_edges_with_data=graph.get('n_edges_with_data', 0),
        edges=graph.get('edges', []),
        baseline=baseline,
        shap_importance=shap_importance,
        metadata={
            'year': year or 'latest',
            'has_lag_data': any('lag' in e for e in graph.get('edges', [])),
            'n_significant_lags': sum(
                1 for e in graph.get('edges', [])
                if e.get('lag_significant', False)
            ),
            'has_country_shap': len(shap_importance) > 0,
            'n_shap_indicators': len(shap_importance)
        }
    )
