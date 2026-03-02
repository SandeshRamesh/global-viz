"""
Quality of Life (QoL) Composite Score Definition

Pure computation module for building a HDI-calibrated QoL composite
from leaf-level indicator values. All core functions are pure (no I/O);
only `load_indicator_metadata()` reads files.

Score pipeline:
  raw values → z-score normalize (flip negatives) → domain means → overall mean → HDI calibration

DEFINITION_ID tracks the scoring version so cached scores can be invalidated
when the methodology changes.
"""

import csv
import json
import math
from pathlib import Path
from typing import Dict, List, Optional, Tuple, TypedDict


DEFINITION_ID = "qol_v1_hdi_calibrated"


class IndicatorMeta(TypedDict):
    domain: str
    direction: str  # 'positive' | 'negative'


class NormStats(TypedDict):
    mean: float
    std: float
    n: int


class QoLResult(TypedDict):
    raw: float
    calibrated: float
    n_indicators: int
    n_domains: int


# ---------------------------------------------------------------------------
# I/O — the only function that touches the filesystem
# ---------------------------------------------------------------------------

def load_indicator_metadata(
    nodes_csv_path: str | Path,
    properties_json_path: str | Path,
) -> Dict[str, IndicatorMeta]:
    """
    Build indicator metadata by joining v21_nodes.csv (domain) with
    indicator_properties.json (direction).

    Only layer-5 nodes are included (leaf indicators with real data).

    Returns:
        { indicator_id: { domain: str, direction: 'positive'|'negative' } }
    """
    # Read nodes CSV for layer-5 indicator IDs and their domains
    layer5_domain: Dict[str, str] = {}
    with open(nodes_csv_path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["layer"] == "5":
                layer5_domain[row["id"]] = row["domain"]

    # Read indicator_properties.json for direction
    with open(properties_json_path) as f:
        props = json.load(f)

    indicators_props: Dict[str, dict] = props.get("indicators", {})

    result: Dict[str, IndicatorMeta] = {}
    for ind_id, domain in layer5_domain.items():
        prop = indicators_props.get(ind_id, {})
        direction = prop.get("direction", "positive")
        if direction not in ("positive", "negative"):
            direction = "positive"
        result[ind_id] = {"domain": domain, "direction": direction}

    return result


# ---------------------------------------------------------------------------
# Normalization
# ---------------------------------------------------------------------------

def compute_normalization_stats(
    all_baselines: Dict[str, Dict[str, Dict[str, float]]],
) -> Dict[str, NormStats]:
    """
    Compute per-indicator mean and std across all country-years using
    Welford's online algorithm (numerically stable single-pass).

    Args:
        all_baselines: { country: { year: { indicator_id: value } } }

    Returns:
        { indicator_id: { mean, std, n } }
    """
    count: Dict[str, int] = {}
    mean_acc: Dict[str, float] = {}
    m2_acc: Dict[str, float] = {}

    for country_years in all_baselines.values():
        for year_values in country_years.values():
            for ind_id, value in year_values.items():
                if value is None or (isinstance(value, float) and math.isnan(value)):
                    continue
                val = float(value)
                n = count.get(ind_id, 0) + 1
                count[ind_id] = n
                old_mean = mean_acc.get(ind_id, 0.0)
                new_mean = old_mean + (val - old_mean) / n
                mean_acc[ind_id] = new_mean
                m2_acc[ind_id] = m2_acc.get(ind_id, 0.0) + (val - old_mean) * (val - new_mean)

    result: Dict[str, NormStats] = {}
    for ind_id, n in count.items():
        if n < 2:
            continue
        std = math.sqrt(m2_acc[ind_id] / (n - 1))
        if std < 1e-12:
            continue
        result[ind_id] = {"mean": mean_acc[ind_id], "std": std, "n": n}

    return result


def normalize_indicator(
    value: float,
    indicator_id: str,
    norm_stats: Dict[str, NormStats],
    metadata: Dict[str, IndicatorMeta],
    direction_overrides: Optional[Dict[str, str]] = None,
) -> Optional[float]:
    """
    Z-score normalize a single indicator value, inverting sign for
    negative-direction indicators so that higher = better for all.

    If direction_overrides is provided, it takes precedence over metadata
    direction labels. This allows using empirically-determined directions
    (e.g., from HDI correlation analysis).

    Returns None if the indicator has no normalization stats.
    """
    stats = norm_stats.get(indicator_id)
    if stats is None:
        return None

    z = (value - stats["mean"]) / stats["std"]

    # Check override first, then metadata
    direction = None
    if direction_overrides is not None:
        direction = direction_overrides.get(indicator_id)
    if direction is None:
        meta = metadata.get(indicator_id)
        if meta is not None:
            direction = meta["direction"]

    if direction == "negative":
        z = -z

    return z


# ---------------------------------------------------------------------------
# Aggregation
# ---------------------------------------------------------------------------

def compute_raw_qol(
    indicator_values: Dict[str, float],
    metadata: Dict[str, IndicatorMeta],
    norm_stats: Dict[str, NormStats],
    direction_overrides: Optional[Dict[str, str]] = None,
) -> Optional[Tuple[float, int, int]]:
    """
    Compute raw (uncalibrated) QoL score from indicator values.

    Steps:
      1. Normalize each indicator (z-score, sign-flipped for negatives)
      2. Group by domain, take mean per domain
      3. Take equal-weighted mean across domains

    Requires >= 3 domains with at least one indicator each, else returns None.

    Returns:
        (raw_qol, n_indicators, n_domains) or None
    """
    domain_scores: Dict[str, List[float]] = {}
    n_indicators = 0

    for ind_id, value in indicator_values.items():
        meta = metadata.get(ind_id)
        if meta is None:
            continue

        if value is None or (isinstance(value, float) and math.isnan(value)):
            continue

        normalized = normalize_indicator(float(value), ind_id, norm_stats, metadata, direction_overrides)
        if normalized is None:
            continue

        domain = meta["domain"]
        domain_scores.setdefault(domain, []).append(normalized)
        n_indicators += 1

    if len(domain_scores) < 3:
        return None

    domain_means = [sum(scores) / len(scores) for scores in domain_scores.values()]
    raw_qol = sum(domain_means) / len(domain_means)

    return raw_qol, n_indicators, len(domain_scores)


# ---------------------------------------------------------------------------
# HDI calibration
# ---------------------------------------------------------------------------

def apply_hdi_calibration(
    raw_qol: float,
    calibration: Dict[str, List[float]],
) -> float:
    """
    Monotonic piecewise-linear mapping from raw_qol to 0-1 HDI-like scale.

    calibration = {
        "breakpoints": [raw_1, raw_2, ...],   # sorted ascending
        "hdi_values":  [hdi_1, hdi_2, ...],    # corresponding HDI values
    }

    Values outside the breakpoint range are clamped to the nearest endpoint.
    """
    breakpoints = calibration["breakpoints"]
    hdi_values = calibration["hdi_values"]

    if len(breakpoints) < 2 or len(breakpoints) != len(hdi_values):
        raise ValueError(
            f"Calibration requires >= 2 matching breakpoints/hdi_values, "
            f"got {len(breakpoints)}/{len(hdi_values)}"
        )

    # Clamp to range
    if raw_qol <= breakpoints[0]:
        return float(hdi_values[0])
    if raw_qol >= breakpoints[-1]:
        return float(hdi_values[-1])

    # Find the segment
    for i in range(len(breakpoints) - 1):
        if breakpoints[i] <= raw_qol <= breakpoints[i + 1]:
            t = (raw_qol - breakpoints[i]) / (breakpoints[i + 1] - breakpoints[i])
            return float(hdi_values[i] + t * (hdi_values[i + 1] - hdi_values[i]))

    # Fallback (should not reach here)
    return float(hdi_values[-1])


# ---------------------------------------------------------------------------
# Full pipeline
# ---------------------------------------------------------------------------

def compute_qol(
    indicator_values: Dict[str, float],
    metadata: Dict[str, IndicatorMeta],
    norm_stats: Dict[str, NormStats],
    calibration: Dict[str, List[float]],
    direction_overrides: Optional[Dict[str, str]] = None,
) -> Optional[QoLResult]:
    """
    Full QoL pipeline: normalize → aggregate by domain → calibrate to 0-1.

    Returns:
        { raw, calibrated, n_indicators, n_domains } or None if insufficient data.
    """
    result = compute_raw_qol(indicator_values, metadata, norm_stats, direction_overrides)
    if result is None:
        return None

    raw_qol, n_indicators, n_domains = result
    calibrated = apply_hdi_calibration(raw_qol, calibration)

    return {
        "raw": raw_qol,
        "calibrated": calibrated,
        "n_indicators": n_indicators,
        "n_domains": n_domains,
    }
