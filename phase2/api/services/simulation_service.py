"""
Simulation Service

All simulations now use V3.1 pre-computed year-specific temporal graphs.
V3.0 endpoints redirect to V3.1 methods for backward compatibility.

V3.1 Features:
- Non-linear propagation (marginal effects)
- Ensemble uncertainty quantification
- Regional spillover effects
- Year-specific causal graphs (1990-2024)
"""

import sys
from pathlib import Path
from typing import Dict, List, Optional, Any, Literal

# Add V3.1 simulation package to path
V31_ROOT = Path(__file__).parent.parent.parent.parent.parent / 'v3.1'
sys.path.insert(0, str(V31_ROOT))

from .graph_service import graph_service
from ..config import DEFAULT_GRAPH_YEAR

# V3.1 type aliases
ViewType = Literal['country', 'stratified', 'unified']
SimulationMode = Literal['percentage', 'absolute']


class SimulationService:
    """Service for running instant and temporal simulations using V3.1."""

    def __init__(self):
        self._v31_simulation_runner = None
        self._v31_temporal_runner = None

    def _get_v31_simulation_runner(self):
        """Lazy load V3.1 instant simulation module."""
        if self._v31_simulation_runner is None:
            from simulation import run_simulation_v31
            self._v31_simulation_runner = run_simulation_v31
        return self._v31_simulation_runner

    def _get_v31_temporal_runner(self):
        """Lazy load V3.1 temporal simulation module."""
        if self._v31_temporal_runner is None:
            from simulation import run_temporal_simulation_v31
            self._v31_temporal_runner = run_temporal_simulation_v31
        return self._v31_temporal_runner

    def run_instant_simulation(
        self,
        country: str,
        interventions: List[Dict[str, Any]],
        year: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Run instant (single-timestep) simulation.

        Now redirects to V3.1 simulation for all requests.

        Args:
            country: Country name
            interventions: List of {"indicator": str, "change_percent": float}
            year: Optional baseline year (defaults to DEFAULT_GRAPH_YEAR)

        Returns:
            Simulation results with effects and metadata
        """
        # Use default year if not specified
        if year is None:
            year = DEFAULT_GRAPH_YEAR

        # Run V3.1 simulation
        result = self.run_instant_simulation_v31(
            country=country,
            interventions=interventions,
            year=year,
            mode='percentage',
            view_type='country',
            p_value_threshold=0.05,
            use_nonlinear=True,
            n_ensemble_runs=0,
            include_spillovers=False,
            top_n_effects=20
        )

        # Convert V3.1 result to V3.0 format for backward compatibility
        return self._convert_v31_to_v30_instant(country, interventions, result)

    def run_temporal_simulation(
        self,
        country: str,
        interventions: List[Dict[str, Any]],
        horizon_years: int = 10,
        year: Optional[int] = None,
        use_significant_lags_only: bool = False
    ) -> Dict[str, Any]:
        """
        Run temporal (multi-year) simulation with lag effects.

        Now redirects to V3.1 temporal simulation.

        Args:
            country: Country name
            interventions: List of {"indicator": str, "change_percent": float}
            horizon_years: Years to project forward (1-30)
            year: Optional baseline year
            use_significant_lags_only: Only use edges with significant lags

        Returns:
            Temporal simulation results with year-by-year effects
        """
        # Use default year if not specified
        base_year = year if year is not None else DEFAULT_GRAPH_YEAR

        # Run V3.1 temporal simulation
        result = self.run_temporal_simulation_v31(
            country=country,
            interventions=interventions,
            base_year=base_year,
            horizon_years=horizon_years,
            view_type='country',
            p_value_threshold=0.10 if use_significant_lags_only else 0.05,
            use_nonlinear=True,
            use_dynamic_graphs=True,
            n_ensemble_runs=0,
            include_spillovers=False,
            top_n_effects=20
        )

        # Convert V3.1 result to V3.0 format for backward compatibility
        return self._convert_v31_to_v30_temporal(country, interventions, horizon_years, result)

    def _convert_v31_to_v30_instant(
        self,
        country: str,
        interventions: List[Dict[str, Any]],
        v31_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Convert V3.1 instant simulation result to V3.0 format."""
        effects = v31_result.get('effects', {})
        metadata = v31_result.get('metadata', {})

        return {
            'status': v31_result.get('status', 'success'),
            'country': country,
            'interventions': interventions,
            'effects': effects,
            'propagation': {
                'n_affected': metadata.get('indicators_affected', len(effects)),
                'iterations': metadata.get('propagation_iterations', 0),
                'converged': metadata.get('converged', True)
            }
        }

    def _convert_v31_to_v30_temporal(
        self,
        country: str,
        interventions: List[Dict[str, Any]],
        horizon_years: int,
        v31_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Convert V3.1 temporal simulation result to V3.0 format."""
        # V3.1 returns int keys (2020, 2021), V3.0 expects str keys ("2020", "2021")
        timeline_raw = v31_result.get('timeline', {})
        effects_raw = v31_result.get('effects', {})
        affected_raw = v31_result.get('affected_per_year', {})
        metadata = v31_result.get('metadata', {})

        # Convert int keys to str keys
        timeline = {str(k): v for k, v in timeline_raw.items()}
        effects = {str(k): v for k, v in effects_raw.items()}
        affected_per_year = {str(k): v for k, v in affected_raw.items()}

        return {
            'status': v31_result.get('status', 'success'),
            'country': country,
            'horizon_years': horizon_years,
            'base_year': v31_result.get('base_year'),
            'interventions': interventions,
            'timeline': timeline,
            'effects': effects,
            'affected_per_year': affected_per_year,
            'metadata': {
                'total_indicators': metadata.get('total_indicators', 0),
                'n_edges': metadata.get('n_edges', 0),
                'use_significant_lags_only': metadata.get('use_significant_lags_only', False)
            }
        }

    # =========================================================================
    # V3.1 Methods - Year-specific temporal graphs
    # =========================================================================

    def run_instant_simulation_v31(
        self,
        country: str,
        interventions: List[Dict[str, Any]],
        year: int,
        mode: SimulationMode = 'percentage',
        view_type: ViewType = 'country',
        p_value_threshold: float = 0.05,
        use_nonlinear: bool = True,
        n_ensemble_runs: int = 0,
        include_spillovers: bool = True,
        top_n_effects: int = 20
    ) -> Dict[str, Any]:
        """
        Run V3.1 instant simulation with year-specific graph.

        Args:
            country: Country name (e.g., 'Australia')
            interventions: List of {"indicator": str, "change_percent": float}
            year: Year for graph and baseline (1990-2024)
            mode: 'percentage' (fast, no baselines) or 'absolute' (real values)
            view_type: 'country', 'stratified', or 'unified'
            p_value_threshold: Filter edges by p-value
            use_nonlinear: Use marginal effects when available
            n_ensemble_runs: 0 = point estimate, >0 = bootstrap ensemble
            include_spillovers: Include regional spillover effects
            top_n_effects: Number of top effects to return

        Returns:
            V3.1 simulation results with effects, spillovers, and metadata
        """
        run_simulation = self._get_v31_simulation_runner()

        result = run_simulation(
            country=country,
            interventions=interventions,
            year=year,
            mode=mode,
            view_type=view_type,
            p_value_threshold=p_value_threshold,
            use_nonlinear=use_nonlinear,
            n_ensemble_runs=n_ensemble_runs,
            include_spillovers=include_spillovers,
            top_n_effects=top_n_effects
        )

        # Check for simulation errors
        if result.get('status') == 'error':
            raise ValueError(result.get('message', 'V3.1 simulation failed'))

        return result

    def run_temporal_simulation_v31(
        self,
        country: str,
        interventions: List[Dict[str, Any]],
        base_year: int,
        horizon_years: int = 10,
        view_type: ViewType = 'country',
        p_value_threshold: float = 0.05,
        use_nonlinear: bool = True,
        use_dynamic_graphs: bool = True,
        n_ensemble_runs: int = 0,
        include_spillovers: bool = True,
        top_n_effects: int = 20
    ) -> Dict[str, Any]:
        """
        Run V3.1 temporal simulation with year-by-year graphs.

        Key V3.1 feature: Loads a DIFFERENT graph for each projection year,
        capturing evolving causal relationships over time.

        Args:
            country: Country name
            interventions: List of {"indicator": str, "change_percent": float}
            base_year: Starting year (1990-2024)
            horizon_years: Years to project forward (1-30)
            view_type: Graph view type
            p_value_threshold: Edge significance filter
            use_nonlinear: Use marginal effects when available
            use_dynamic_graphs: Load year-specific graph for each year
            n_ensemble_runs: 0 = point estimate, >0 = bootstrap
            include_spillovers: Include regional spillovers for final year
            top_n_effects: Number of top effects per year

        Returns:
            Temporal simulation results with timeline, effects, and spillovers
        """
        run_temporal = self._get_v31_temporal_runner()

        result = run_temporal(
            country=country,
            interventions=interventions,
            base_year=base_year,
            horizon_years=horizon_years,
            view_type=view_type,
            p_value_threshold=p_value_threshold,
            use_nonlinear=use_nonlinear,
            use_dynamic_graphs=use_dynamic_graphs,
            n_ensemble_runs=n_ensemble_runs,
            include_spillovers=include_spillovers,
            top_n_effects=top_n_effects
        )

        # Check for simulation errors
        if result.get('status') == 'error':
            raise ValueError(result.get('message', 'V3.1 temporal simulation failed'))

        return result


# Singleton instance
simulation_service = SimulationService()
