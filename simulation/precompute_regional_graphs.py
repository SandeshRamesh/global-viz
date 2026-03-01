"""
Precompute Regional Temporal Graphs.

Aggregates existing country-year graphs into regional-year graphs by taking
robust medians of edge weights and uncertainty terms.

Output:
  data/v31/temporal_graphs/regional/{region_key}/{year}_graph.json
  data/v31/metadata/regional_graph_coverage.json
"""

from __future__ import annotations

import json
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np

from .region_mapping import get_all_region_keys, get_countries_in_region, get_region_metadata

DATA_ROOT = Path(__file__).parent.parent / "data"
COUNTRY_GRAPHS_DIR = DATA_ROOT / "v31" / "temporal_graphs" / "countries"
REGIONAL_GRAPHS_DIR = DATA_ROOT / "v31" / "temporal_graphs" / "regional"
COVERAGE_REPORT_PATH = DATA_ROOT / "v31" / "metadata" / "regional_graph_coverage.json"

YEARS = list(range(1990, 2025))
MIN_COUNTRIES_PER_YEAR = 3

EDGE_NUMERIC_FIELDS = [
    "beta",
    "std",
    "ci_lower",
    "ci_upper",
    "p_value",
    "r_squared",
    "n_samples",
    "n_bootstrap",
]


def _load_country_graph(country: str, year: int) -> dict | None:
    path = COUNTRY_GRAPHS_DIR / country / f"{year}_graph.json"
    if not path.exists():
        return None
    try:
        with open(path) as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return None


def _edge_key(edge: dict) -> Tuple[str, str, int]:
    return (
        str(edge.get("source")),
        str(edge.get("target")),
        int(edge.get("lag", 0) or 0),
    )


def _aggregate_edges(edge_groups: Dict[Tuple[str, str, int], List[dict]]) -> List[dict]:
    out: List[dict] = []

    for (source, target, lag), edges in edge_groups.items():
        if not edges:
            continue

        row = {
            "source": source,
            "target": target,
            "lag": lag,
        }

        for field in EDGE_NUMERIC_FIELDS:
            values = [e.get(field) for e in edges if e.get(field) is not None]
            if not values:
                continue
            row[field] = float(np.median(values))

        # Relationship type: most common value
        relationship_types = [e.get("relationship_type") for e in edges if e.get("relationship_type")]
        if relationship_types:
            row["relationship_type"] = max(set(relationship_types), key=relationship_types.count)

        # Aggregate marginal effects (if present)
        marginal_effects = [e.get("marginal_effects") for e in edges if isinstance(e.get("marginal_effects"), dict)]
        if marginal_effects:
            merged: Dict[str, List[float]] = defaultdict(list)
            for me in marginal_effects:
                for k, v in me.items():
                    if v is not None:
                        merged[k].append(float(v))
            row["marginal_effects"] = {k: float(np.median(vs)) for k, vs in merged.items() if vs}

        # Keep nonlinearity metadata from first valid edge for schema compatibility.
        for e in edges:
            if e.get("nonlinearity_metadata"):
                row["nonlinearity_metadata"] = e["nonlinearity_metadata"]
                break

        out.append(row)

    return out


def _aggregate_saturation_thresholds(graphs: List[dict]) -> Dict[str, float]:
    merged: Dict[str, List[float]] = defaultdict(list)
    for graph in graphs:
        thresholds = graph.get("saturation_thresholds") or {}
        for indicator, value in thresholds.items():
            if value is not None:
                merged[indicator].append(float(value))
    return {indicator: float(np.median(values)) for indicator, values in merged.items() if values}


def _build_regional_graph(region_key: str, year: int) -> tuple[dict | None, List[str]]:
    countries = get_countries_in_region(region_key)
    contributing: List[str] = []
    graphs: List[dict] = []

    for country in countries:
        graph = _load_country_graph(country, year)
        if graph is None:
            continue
        contributing.append(country)
        graphs.append(graph)

    if len(contributing) < MIN_COUNTRIES_PER_YEAR:
        return None, contributing

    edge_groups: Dict[Tuple[str, str, int], List[dict]] = defaultdict(list)
    for graph in graphs:
        for edge in graph.get("edges", []):
            key = _edge_key(edge)
            edge_groups[key].append(edge)

    edges = _aggregate_edges(edge_groups)
    saturation_thresholds = _aggregate_saturation_thresholds(graphs)
    region_meta = get_region_metadata(region_key) or {"name": region_key}

    payload = {
        "year": year,
        "region": region_key,
        "region_name": region_meta.get("name", region_key),
        "edges": edges,
        "saturation_thresholds": saturation_thresholds,
        "metadata": {
            "view": "regional",
            "n_edges": len(edges),
            "n_countries": len(contributing),
            "countries_in_region": contributing,
            "n_source_graphs": len(graphs),
            "aggregation": "median",
        },
        "provenance": {
            "created_at": datetime.utcnow().isoformat() + "Z",
            "method": "aggregate_country_graphs",
            "source": "data/v31/temporal_graphs/countries",
            "min_countries_per_year": MIN_COUNTRIES_PER_YEAR,
        },
    }
    return payload, contributing


def precompute_regional_graphs() -> dict:
    REGIONAL_GRAPHS_DIR.mkdir(parents=True, exist_ok=True)
    COVERAGE_REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)

    coverage = {
        "years": YEARS,
        "min_countries_per_year": MIN_COUNTRIES_PER_YEAR,
        "regions": {},
    }
    files_written = 0

    for region_key in get_all_region_keys():
        region_dir = REGIONAL_GRAPHS_DIR / region_key
        region_dir.mkdir(parents=True, exist_ok=True)

        rows = {}
        years_written = 0
        countries_total = len(get_countries_in_region(region_key))

        for year in YEARS:
            graph, contributors = _build_regional_graph(region_key, year)
            rows[str(year)] = {
                "n_countries_total": countries_total,
                "n_countries_contributing": len(contributors),
                "written": graph is not None,
                "n_edges": len(graph.get("edges", [])) if graph else 0,
            }

            if graph is None:
                continue

            with open(region_dir / f"{year}_graph.json", "w") as f:
                json.dump(graph, f)
            years_written += 1
            files_written += 1

        coverage["regions"][region_key] = {
            "years_written": years_written,
            "by_year": rows,
        }

    coverage["files_written"] = files_written
    with open(COVERAGE_REPORT_PATH, "w") as f:
        json.dump(coverage, f, indent=2)

    print(f"Regional graph precompute complete: {files_written} files")
    print(f"Coverage report: {COVERAGE_REPORT_PATH}")
    return coverage


if __name__ == "__main__":
    precompute_regional_graphs()
