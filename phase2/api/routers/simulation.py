"""
Simulation Router

Endpoints for instant and temporal simulations with timeout protection.

V3.0 endpoints: /simulate, /simulate/temporal (static country graphs)
V3.1 endpoints: /simulate/v31, /simulate/v31/temporal (year-specific temporal graphs)
"""

import asyncio
import logging
from fastapi import APIRouter, HTTPException

from ..services import simulation_service
from ..models import (
    SimulationRequest,
    SimulationResponse,
    TemporalSimulationRequest,
    TemporalSimulationResponse,
    # V3.1 models
    SimulationRequestV31,
    SimulationResponseV31,
    TemporalSimulationRequestV31,
    TemporalSimulationResponseV31,
)
from ..config import SIMULATION_TIMEOUT, TEMPORAL_TIMEOUT

router = APIRouter(prefix="/simulate", tags=["simulation"])
logger = logging.getLogger("api.simulation")

# V3.1 timeouts (may need tuning based on ensemble runs)
V31_SIMULATION_TIMEOUT = 30  # More time for ensemble runs
V31_TEMPORAL_TIMEOUT = 60    # More time for multi-year with dynamic graphs


@router.post("", response_model=SimulationResponse)
async def run_instant_simulation(request: SimulationRequest):
    """
    Run instant (single-timestep) simulation.

    Applies interventions and propagates effects through the causal graph
    until convergence. Returns immediate effects on all indicators.

    **Timeout:** 10 seconds
    **Rate Limit:** Subject to global rate limits (100/min, 1000/hr)

    Never cache - always compute fresh.
    """
    try:
        # Convert interventions to dict format
        interventions = [
            {
                'indicator': i.indicator,
                'change_percent': i.change_percent
            }
            for i in request.interventions
        ]

        # Run simulation with timeout
        try:
            result = await asyncio.wait_for(
                asyncio.to_thread(
                    simulation_service.run_instant_simulation,
                    country=request.country,
                    interventions=interventions,
                    year=request.year
                ),
                timeout=SIMULATION_TIMEOUT
            )
        except asyncio.TimeoutError:
            logger.warning(f"Simulation timeout: {request.country} with {len(interventions)} interventions")
            raise HTTPException(
                status_code=504,
                detail={
                    "error": "simulation_timeout",
                    "message": f"Simulation exceeded {SIMULATION_TIMEOUT}s limit",
                    "suggestion": "Try reducing number of interventions"
                }
            )

        return SimulationResponse(**result)

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Simulation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Simulation error: {str(e)}"
        )


@router.post("/temporal", response_model=TemporalSimulationResponse)
async def run_temporal_simulation(request: TemporalSimulationRequest):
    """
    Run temporal (multi-year) simulation with lag effects.

    Projects interventions forward through time, accounting for
    estimated lag effects between indicators. Returns year-by-year
    indicator values.

    **Timeout:** 15 seconds
    **Rate Limit:** Subject to global rate limits (100/min, 1000/hr)

    Never cache - always compute fresh.
    """
    try:
        # Convert interventions to dict format (include per-intervention year)
        interventions = [
            {
                'indicator': i.indicator,
                'change_percent': i.change_percent,
                **(({'year': i.year} if i.year is not None else {}))
            }
            for i in request.interventions
        ]

        # Run temporal simulation with timeout
        try:
            result = await asyncio.wait_for(
                asyncio.to_thread(
                    simulation_service.run_temporal_simulation,
                    country=request.country,
                    interventions=interventions,
                    horizon_years=request.horizon_years,
                    year=request.year,
                    use_significant_lags_only=request.use_significant_lags_only
                ),
                timeout=TEMPORAL_TIMEOUT
            )
        except asyncio.TimeoutError:
            logger.warning(
                f"Temporal simulation timeout: {request.country}, "
                f"horizon={request.horizon_years}, interventions={len(interventions)}"
            )
            raise HTTPException(
                status_code=504,
                detail={
                    "error": "temporal_simulation_timeout",
                    "message": f"Temporal simulation exceeded {TEMPORAL_TIMEOUT}s limit",
                    "suggestion": "Try reducing horizon_years or number of interventions"
                }
            )

        return TemporalSimulationResponse(**result)

    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Temporal simulation ValueError: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Temporal simulation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Temporal simulation error: {str(e)}"
        )


# =============================================================================
# V3.1 Endpoints - Year-specific temporal graphs
# =============================================================================

@router.post("/v31", response_model=SimulationResponseV31, tags=["simulation-v31"])
async def run_instant_simulation_v31(request: SimulationRequestV31):
    """
    Run V3.1 instant simulation with year-specific temporal graph.

    **V3.1 Features:**
    - Year-specific causal graphs (4,768 pre-computed files)
    - P-value filtering for statistical significance
    - Non-linear propagation using marginal effects
    - Optional ensemble uncertainty quantification
    - Regional spillover effects

    **Simulation Modes:**
    - `percentage` (default): Fast, no baseline loading (~<1s). Returns percent_change only.
    - `absolute`: Full baseline values from pre-computed JSON (~<2s). Returns baseline, simulated, absolute_change, percent_change.

    **View Types:**
    - `country`: Country-specific graph (most accurate)
    - `stratified`: Income-group graph (fallback if country unavailable)
    - `unified`: Global average graph (least specific)

    **Timeout:** 30 seconds (60s for ensemble runs)
    """
    try:
        interventions = [
            {
                'indicator': i.indicator,
                'change_percent': i.change_percent
            }
            for i in request.interventions
        ]

        # Adjust timeout based on ensemble runs
        timeout = V31_SIMULATION_TIMEOUT
        if request.n_ensemble_runs > 0:
            # Add extra time for ensemble runs
            timeout = min(120, timeout + request.n_ensemble_runs // 10)

        try:
            result = await asyncio.wait_for(
                asyncio.to_thread(
                    simulation_service.run_instant_simulation_v31,
                    country=request.country,
                    interventions=interventions,
                    year=request.year,
                    mode=request.mode,
                    view_type=request.view_type,
                    p_value_threshold=request.p_value_threshold,
                    use_nonlinear=request.use_nonlinear,
                    n_ensemble_runs=request.n_ensemble_runs,
                    include_spillovers=request.include_spillovers,
                    top_n_effects=request.top_n_effects
                ),
                timeout=timeout
            )
        except asyncio.TimeoutError:
            logger.warning(
                f"V3.1 simulation timeout: {request.country}, year={request.year}, "
                f"ensemble={request.n_ensemble_runs}"
            )
            raise HTTPException(
                status_code=504,
                detail={
                    "error": "v31_simulation_timeout",
                    "message": f"V3.1 simulation exceeded {timeout}s limit",
                    "suggestion": "Try reducing n_ensemble_runs or using view_type='unified'"
                }
            )

        return SimulationResponseV31(**result)

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"V3.1 simulation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"V3.1 simulation error: {str(e)}"
        )


@router.post("/v31/temporal", response_model=TemporalSimulationResponseV31, tags=["simulation-v31"])
async def run_temporal_simulation_v31(request: TemporalSimulationRequestV31):
    """
    Run V3.1 temporal simulation with year-by-year graphs.

    **Key V3.1 Feature:** Uses a DIFFERENT causal graph for each projection year,
    capturing how causal relationships evolve over time.

    **Parameters:**
    - `use_dynamic_graphs`: If True (default), loads year-specific graph for each
      projection year. If False, uses base_year graph for all years (V3.0 behavior).
    - `view_type`: Graph source - 'country', 'stratified', or 'unified'
    - `include_spillovers`: Add regional spillover effects for final year

    **Timeline Output:**
    Returns indicator values at each year from base_year to base_year + horizon_years.

    **Timeout:** 60 seconds (more for ensemble runs)
    """
    try:
        interventions = [
            {
                'indicator': i.indicator,
                'change_percent': i.change_percent
            }
            for i in request.interventions
        ]

        # Adjust timeout based on horizon and ensemble
        timeout = V31_TEMPORAL_TIMEOUT
        if request.n_ensemble_runs > 0:
            timeout = min(180, timeout + request.n_ensemble_runs // 5)
        if request.horizon_years > 15:
            timeout += 30

        try:
            result = await asyncio.wait_for(
                asyncio.to_thread(
                    simulation_service.run_temporal_simulation_v31,
                    country=request.country,
                    interventions=interventions,
                    base_year=request.base_year,
                    horizon_years=request.horizon_years,
                    view_type=request.view_type,
                    p_value_threshold=request.p_value_threshold,
                    use_nonlinear=request.use_nonlinear,
                    use_dynamic_graphs=request.use_dynamic_graphs,
                    n_ensemble_runs=request.n_ensemble_runs,
                    include_spillovers=request.include_spillovers,
                    top_n_effects=request.top_n_effects
                ),
                timeout=timeout
            )
        except asyncio.TimeoutError:
            logger.warning(
                f"V3.1 temporal simulation timeout: {request.country}, "
                f"base_year={request.base_year}, horizon={request.horizon_years}"
            )
            raise HTTPException(
                status_code=504,
                detail={
                    "error": "v31_temporal_timeout",
                    "message": f"V3.1 temporal simulation exceeded {timeout}s limit",
                    "suggestion": "Try reducing horizon_years, n_ensemble_runs, or use view_type='unified'"
                }
            )

        return TemporalSimulationResponseV31(**result)

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"V3.1 temporal simulation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"V3.1 temporal simulation error: {str(e)}"
        )
