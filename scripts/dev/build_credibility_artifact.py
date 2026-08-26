#!/usr/bin/env python3
"""
Build the static credibility artifact consumed by the Data Quality panel.

Two layers are emitted into a single JSON:

  Layer 1 (timeline)  - For each anchor finding, the per-year fit quality of the
                        unified temporal graph (1990-2024): R^2 of the selected
                        functional form, the linear R^2, beta and its bootstrap
                        CI. Read verbatim out of the shipped graph JSONs; no
                        refitting is involved.

  Layer 2 (drilldown) - For each anchor finding x year, a country-scope
                        predicted-vs-actual point per country. Each country's
                        prediction comes from a fit over that country's OWN
                        series (years <= Y), so the cross-country lag pairing
                        defect that affects unified/stratified scopes cannot
                        apply here. See DISCLOSURES below.

The fit is a faithful re-implementation of
  v3.1/scripts/phase2_compute/phase2B/compute_temporal_graphs_v2.py
so that reconstructed predictions correspond to the coefficients the site
actually serves. `--validate` checks the re-implementation against the stored
country graph JSONs before anything is written.

Read-only with respect to every research artifact. The only file written is the
output JSON.

Usage:
    python scripts/dev/build_credibility_artifact.py --validate
    python scripts/dev/build_credibility_artifact.py
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

# --- Paths -------------------------------------------------------------------
# Research data lives in the canonical checkout; it is gitignored here (~19 GB).
RESEARCH_ROOT = Path("/home/sandesh/Documents/Global_Project/viz")
PANEL_PATH = RESEARCH_ROOT / "data" / "raw" / "v21_panel_data_for_v3.parquet"
NODES_PATH = RESEARCH_ROOT / "data" / "raw" / "v21_nodes.csv"
GRAPHS_DIR = RESEARCH_ROOT / "data" / "v31" / "temporal_graphs"
UNIFIED_DIR = GRAPHS_DIR / "unified"
COUNTRIES_DIR = GRAPHS_DIR / "countries"

REPO_ROOT = Path(__file__).resolve().parents[2]
OUT_PATH = REPO_ROOT / "public" / "data" / "credibility.json"

# --- Fit constants (mirrored from compute_temporal_graphs_v2.py) -------------
MIN_SAMPLES = 10
MAX_LAG = 5
AIC_THRESHOLD = 2.0
R2_IMPROVEMENT_MIN = 0.03
PERCENTILES = [25, 50, 75]

YEAR_MIN, YEAR_MAX = 1990, 2024

# --- Anchor findings ---------------------------------------------------------
ANCHORS: list[dict[str, str]] = [
    {
        "id": "F01",
        "group": "F01",
        "title": "Maternal health access to child mortality",
        "source": "agmxhoi992",
        "target": "accmhoi999",
    },
    {
        "id": "F02",
        "group": "F02",
        "title": "Gender parity in tertiary enrolment to birth rate",
        "source": "GER.5T8.GPIA",
        "target": "wdi_birth",
    },
    {
        "id": "F06",
        "group": "F06",
        "title": "Local government power to elected local office",
        "source": "v2ellocpwr_ord",
        "target": "e_v2xel_locelec_4C",
    },
    {
        "id": "F08a",
        "group": "F08",
        "title": "Capital formation to tax revenue (leg 1 of 2)",
        "source": "acfcfci999",
        "target": "aptxgoi999",
    },
    {
        "id": "F08b",
        "group": "F08",
        "title": "Tax revenue to national income (leg 2 of 2)",
        "source": "aptxgoi999",
        "target": "agninci999",
    },
]

# --- Disclosures surfaced in the UI -----------------------------------------
DISCLOSURES: list[dict[str, str]] = [
    {
        "id": "lag-pairing",
        "severity": "warning",
        "title": "Cross-country lag pairing in pooled scopes",
        "body": (
            "In unified, stratified and regional graphs the lag shift is applied to a "
            "matrix indexed by (country, year), so an edge with lag >= 1 pairs the final "
            "years of one country with the opening years of the next. 2,242 of 7,368 "
            "unified edges use a non-zero lag. The timeline above reads the pooled fit "
            "and inherits this; the predicted-vs-actual drill-down deliberately does not, "
            "because every point there is fitted within a single country's own series."
        ),
    },
    {
        "id": "a4-f08a-ci",
        "severity": "note",
        "title": "A4 artifact inconsistency for F08a",
        "body": (
            "In the superseded A4 artifact (v2.1/outputs/A4/lasso_effect_estimates.pkl) the "
            "F08a edge carries beta = 1.602 with a bootstrap CI of [-6.140, -2.015] - the "
            "point estimate falls outside its own interval and the signs disagree. Nothing "
            "shown here derives from that artifact; the serving layer is v3.1. Recorded so "
            "that anyone tracing the finding back to A4 meets the flag first."
        ),
    },
    {
        "id": "in-sample",
        "severity": "note",
        "title": "Predictions are in-sample",
        "body": (
            "The drill-down plots fitted values, not out-of-sample forecasts. Year Y is "
            "inside the window the coefficients were estimated on, so points near the "
            "diagonal show fit, not predictive skill. Countries with few observations sit "
            "close to the diagonal by construction - the point size encodes sample size."
        ),
    },
]


# --- Faithful re-implementation of the v3.1 edge fit -------------------------

def linear_stats(x: np.ndarray, y: np.ndarray) -> tuple[float, float, float, float, int]:
    """OLS slope/intercept/R^2/SSE. Mirrors compute_linear_stats, plus intercept.

    The upstream helper computes the intercept internally but only returns the
    slope; the drill-down needs it to place the fitted line, so it is returned
    here as well. Degenerate cases return the same sentinels as upstream.
    """
    n = len(x)
    if n < 3:
        return 0.0, 0.0, -np.inf, np.inf, 0

    x_mean = float(np.mean(x))
    y_mean = float(np.mean(y))

    num = float(np.sum((x - x_mean) * (y - y_mean)))
    denom = float(np.sum((x - x_mean) ** 2))

    if denom < 1e-10:
        return 0.0, 0.0, -np.inf, np.inf, 0

    beta = num / denom
    intercept = y_mean - beta * x_mean

    y_pred = intercept + beta * x
    ss_res = float(np.sum((y - y_pred) ** 2))
    ss_tot = float(np.sum((y - y_mean) ** 2))

    if ss_tot < 1e-10:
        return beta, intercept, 0.0, ss_res, n

    return beta, intercept, 1.0 - (ss_res / ss_tot), ss_res, n


def fit_logarithmic(x: np.ndarray, y: np.ndarray) -> dict[str, Any]:
    if np.any(x <= 0):
        return {"valid": False}
    log_x = np.log(x)
    beta, _, r2, sse, n = linear_stats(log_x, y)
    if not np.isfinite(r2) or r2 < -1:
        return {"valid": False}
    a = float(np.mean(y) - beta * np.mean(log_x))
    return {
        "valid": True,
        "type": "logarithmic",
        "r2": float(r2),
        "aic": float(n * np.log(sse / n + 1e-10) + 4),
        "params": {"a": a, "b": float(beta)},
    }


def fit_quadratic(x: np.ndarray, y: np.ndarray) -> dict[str, Any]:
    n = len(x)
    if n < 5:
        return {"valid": False}
    design = np.column_stack([np.ones(n), x, x ** 2])
    try:
        params = np.linalg.solve(design.T @ design + 1e-8 * np.eye(3), design.T @ y)
    except np.linalg.LinAlgError:
        return {"valid": False}
    y_pred = design @ params
    ss_res = float(np.sum((y - y_pred) ** 2))
    ss_tot = float(np.sum((y - np.mean(y)) ** 2))
    if ss_tot < 1e-10:
        return {"valid": False}
    a, b, c = (float(v) for v in params)
    return {
        "valid": True,
        "type": "quadratic",
        "r2": 1.0 - (ss_res / ss_tot),
        "aic": float(n * np.log(ss_res / n + 1e-10) + 6),
        "params": {"a": a, "b": b, "c": c},
    }


def fit_saturation(x: np.ndarray, y: np.ndarray) -> dict[str, Any]:
    n = len(x)
    if n < 5:
        return {"valid": False}
    try:
        from scipy.optimize import curve_fit
    except ImportError:
        return {"valid": False}

    def model(xx, cap, rate):
        return cap * (1 - np.exp(-rate * xx))

    y_max = float(np.max(y))
    if y_max <= 0:
        return {"valid": False}
    try:
        popt, _ = curve_fit(
            model, x, y,
            p0=[y_max * 1.1, 0.01],
            bounds=([y_max * 0.9, 1e-6], [y_max * 2, 10]),
            maxfev=1000,
        )
    except Exception:
        return {"valid": False}
    cap, rate = (float(v) for v in popt)
    ss_res = float(np.sum((y - model(x, cap, rate)) ** 2))
    ss_tot = float(np.sum((y - np.mean(y)) ** 2))
    if ss_tot < 1e-10:
        return {"valid": False}
    return {
        "valid": True,
        "type": "saturation",
        "r2": 1.0 - (ss_res / ss_tot),
        "aic": float(n * np.log(ss_res / n + 1e-10) + 4),
        "params": {"L": cap, "k": rate},
    }


def fit_threshold(x: np.ndarray, y: np.ndarray) -> dict[str, Any]:
    """Piecewise-linear fit.

    Upstream stores only the two slopes and the split point. Both intercepts are
    recovered here so the segment predictions can actually be evaluated.
    """
    n = len(x)
    if n < 10:
        return {"valid": False}

    best = None
    best_sse = np.inf
    for pct in range(20, 85, 10):
        threshold = float(np.percentile(x, pct))
        mask_low = x < threshold
        mask_high = ~mask_low
        if mask_low.sum() < 3 or mask_high.sum() < 3:
            continue
        b_lo, i_lo, _, sse_lo, n_lo = linear_stats(x[mask_low], y[mask_low])
        b_hi, i_hi, _, sse_hi, n_hi = linear_stats(x[mask_high], y[mask_high])
        total_sse = sse_lo + sse_hi
        if total_sse < best_sse:
            best_sse = total_sse
            best = {
                "threshold": threshold,
                "beta_low": float(b_lo),
                "beta_high": float(b_hi),
                "intercept_low": float(i_lo),
                "intercept_high": float(i_hi),
                "n_low": int(n_lo),
                "n_high": int(n_hi),
            }

    if best is None:
        return {"valid": False}

    ss_tot = float(np.sum((y - np.mean(y)) ** 2))
    if ss_tot < 1e-10:
        return {"valid": False}

    return {
        "valid": True,
        "type": "threshold",
        "r2": 1.0 - (best_sse / ss_tot),
        "aic": float(n * np.log(best_sse / n + 1e-10) + 8),
        "params": best,
    }


def detect_nonlinearity(x: np.ndarray, y: np.ndarray,
                        linear_r2: float, linear_sse: float) -> dict[str, Any]:
    """Select the functional form by AIC, mirroring the upstream gate."""
    n = len(x)
    if n < MIN_SAMPLES:
        return {"type": "linear", "detected": False}

    linear_aic = float(n * np.log(linear_sse / n + 1e-10) + 4)

    candidates = {
        "logarithmic": fit_logarithmic(x, y),
        "quadratic": fit_quadratic(x, y),
        "saturation": fit_saturation(x, y),
        "threshold": fit_threshold(x, y),
    }

    best_name, best_aic, best_result = "linear", linear_aic, None
    for name, result in candidates.items():
        if not result.get("valid"):
            continue
        if (linear_aic - result["aic"] > AIC_THRESHOLD
                and result["r2"] - linear_r2 > R2_IMPROVEMENT_MIN
                and result["aic"] < best_aic):
            best_name, best_aic, best_result = name, result["aic"], result

    if best_result is None:
        return {"type": "linear", "detected": False, "aic_linear": linear_aic}

    return {
        "type": best_result["type"],
        "detected": True,
        "r2_nonlinear": best_result["r2"],
        "aic_linear": linear_aic,
        "aic_nonlinear": best_result["aic"],
        "params": best_result["params"],
    }


def fit_edge(x_full: np.ndarray, y_full: np.ndarray) -> dict[str, Any] | None:
    """Lag selection + functional-form selection for one edge on one series.

    Mirrors compute_edge_enhanced, minus the bootstrap (the CI is read from the
    shipped graph JSON rather than resampled here). Returns the winning lag, the
    linear R^2 at that lag, and everything needed to evaluate predictions.
    """
    valid_full = ~(np.isnan(x_full) | np.isnan(y_full))

    best = None
    best_r2 = -np.inf
    for lag in range(0, MAX_LAG + 1):
        if lag == 0:
            x_lag, y_lag, valid = x_full, y_full, valid_full
        else:
            x_lag, y_lag = x_full[:-lag], y_full[lag:]
            valid = ~(np.isnan(x_lag) | np.isnan(y_lag))

        if valid.sum() < MIN_SAMPLES:
            continue

        x_clean = x_lag[valid]
        y_clean = y_lag[valid]
        beta, intercept, r2, sse, n = linear_stats(x_clean, y_clean)
        if r2 > best_r2:
            best_r2 = r2
            best = {
                "lag": lag,
                "x": x_clean,
                "y": y_clean,
                "beta_raw": beta,
                "intercept": intercept,
                "r2_linear": r2,
                "sse": sse,
                "n": int(n),
            }

    if best is None or best["n"] < MIN_SAMPLES:
        return None

    best["nonlinearity"] = detect_nonlinearity(
        best["x"], best["y"], best["r2_linear"], best["sse"]
    )
    return best


def predict(fit: dict[str, Any], x: float | np.ndarray) -> float | np.ndarray:
    """Evaluate the fitted functional form at x."""
    nl = fit["nonlinearity"]
    kind = nl.get("type", "linear")
    p = nl.get("params", {})

    if not nl.get("detected") or kind == "linear":
        return fit["intercept"] + fit["beta_raw"] * x
    if kind == "quadratic":
        return p["a"] + p["b"] * x + p["c"] * np.asarray(x) ** 2
    if kind == "logarithmic":
        safe = np.where(np.asarray(x) > 0, x, np.nan)
        return p["a"] + p["b"] * np.log(safe)
    if kind == "saturation":
        return p["L"] * (1 - np.exp(-p["k"] * np.asarray(x)))
    if kind == "threshold":
        arr = np.asarray(x, dtype=float)
        low = p["intercept_low"] + p["beta_low"] * arr
        high = p["intercept_high"] + p["beta_high"] * arr
        return np.where(arr < p["threshold"], low, high)
    return fit["intercept"] + fit["beta_raw"] * x


def model_r2(fit: dict[str, Any]) -> float:
    """R^2 of the functional form actually selected."""
    nl = fit["nonlinearity"]
    if nl.get("detected"):
        return float(nl["r2_nonlinear"])
    return float(fit["r2_linear"])


# --- Data loading ------------------------------------------------------------

def load_panel(indicators: set[str]) -> pd.DataFrame:
    print(f"Loading panel from {PANEL_PATH} ...", flush=True)
    panel = pd.read_parquet(PANEL_PATH)
    panel = panel[panel["indicator_id"].isin(indicators)]
    print(f"  {len(panel):,} rows across {panel['indicator_id'].nunique()} anchor indicators")
    return panel


def load_labels(indicators: set[str]) -> dict[str, str]:
    try:
        nodes = pd.read_csv(NODES_PATH)
    except Exception as exc:  # pragma: no cover - labels are cosmetic
        print(f"  ! could not read node labels ({exc}); falling back to raw codes")
        return {}
    nodes = nodes[nodes["id"].isin(indicators)]
    return dict(zip(nodes["id"], nodes["label"]))


def build_timelines() -> tuple[dict[str, list[dict[str, Any]]], dict[str, Any]]:
    """Layer 1: read per-year unified fit stats straight out of the graph JSONs."""
    wanted = {(a["source"], a["target"]): a["id"] for a in ANCHORS}
    timelines: dict[str, list[dict[str, Any]]] = {a["id"]: [] for a in ANCHORS}
    provenance: dict[str, Any] = {}

    for year in range(YEAR_MIN, YEAR_MAX + 1):
        path = UNIFIED_DIR / f"{year}_graph.json"
        if not path.exists():
            continue
        with open(path) as fh:
            graph = json.load(fh)
        if not provenance:
            provenance = graph.get("provenance", {})

        index = {(e["source"], e["target"]): e for e in graph["edges"]}
        for key, anchor_id in wanted.items():
            edge = index.get(key)
            if edge is None:
                continue
            nl = edge.get("nonlinearity", {})
            r2_model = nl["r2_nonlinear"] if nl.get("detected") else edge["r_squared"]
            timelines[anchor_id].append({
                "year": year,
                "r2": round(float(r2_model), 5),
                "r2Linear": round(float(edge["r_squared"]), 5),
                "beta": round(float(edge["beta"]), 5),
                "ciLower": round(float(edge["ci_lower"]), 5),
                "ciUpper": round(float(edge["ci_upper"]), 5),
                "pValue": float(f"{edge['p_value']:.3e}"),
                "n": int(edge["n_samples"]),
                "lag": int(edge["lag"]),
                "type": edge["relationship_type"],
            })
        print(f"  unified {year} ok", flush=True)

    return timelines, provenance


def build_drilldowns(panel: pd.DataFrame) -> tuple[list[str], dict[str, dict[str, Any]]]:
    """Layer 2: country-scope predicted-vs-actual, one point per country per year.

    Every country is fitted on its own series only, so the pooled-scope lag
    pairing defect cannot reach these points.
    """
    countries = sorted(panel["country"].unique())
    country_index = {name: i for i, name in enumerate(countries)}

    # country -> wide frame (year x indicator), reused across anchors and years
    print(f"Pivoting {len(countries)} country frames ...", flush=True)
    wide_by_country: dict[str, pd.DataFrame] = {}
    for name, chunk in panel.groupby("country", sort=False):
        wide_by_country[name] = chunk.pivot_table(
            index="year", columns="indicator_id", values="value", aggfunc="mean"
        ).sort_index()

    drilldowns: dict[str, dict[str, Any]] = {a["id"]: {} for a in ANCHORS}

    for anchor in ANCHORS:
        src, tgt, anchor_id = anchor["source"], anchor["target"], anchor["id"]
        print(f"  drilldown {anchor_id} ({src} -> {tgt}) ...", flush=True)

        for year in range(YEAR_MIN, YEAR_MAX + 1):
            idx: list[int] = []
            observed: list[float] = []
            predicted: list[float] = []
            r2s: list[float] = []
            ns: list[int] = []
            lags: list[int] = []
            types: list[str] = []

            for name, wide in wide_by_country.items():
                if src not in wide.columns or tgt not in wide.columns:
                    continue
                window = wide.loc[wide.index <= year]
                if len(window) < MIN_SAMPLES:
                    continue

                x_full = window[src].to_numpy(dtype=float)
                y_full = window[tgt].to_numpy(dtype=float)
                fit = fit_edge(x_full, y_full)
                if fit is None:
                    continue

                # The point for this year: target at Y, source at Y - lag.
                years = window.index.to_numpy()
                lag = fit["lag"]
                if year not in years:
                    continue
                pos = int(np.where(years == year)[0][0])
                src_pos = pos - lag
                if src_pos < 0:
                    continue
                x_here = float(x_full[src_pos])
                y_here = float(y_full[pos])
                if not (math.isfinite(x_here) and math.isfinite(y_here)):
                    continue

                y_hat = float(np.asarray(predict(fit, x_here)).item())
                if not math.isfinite(y_hat):
                    continue

                idx.append(country_index[name])
                observed.append(round(y_here, 4))
                predicted.append(round(y_hat, 4))
                r2s.append(round(model_r2(fit), 4))
                ns.append(fit["n"])
                lags.append(lag)
                types.append(fit["nonlinearity"].get("type", "linear"))

            if idx:
                drilldowns[anchor_id][str(year)] = {
                    "c": idx, "o": observed, "p": predicted,
                    "r2": r2s, "n": ns, "lag": lags, "t": types,
                }

    return countries, drilldowns


# --- Validation --------------------------------------------------------------

def validate(panel: pd.DataFrame, samples: int = 12) -> bool:
    """Check the re-implementation against stored country graph JSONs.

    For a sample of (country, year, anchor edge) triples, refit from the panel
    and compare lag / linear R^2 / relationship type against what the shipped
    graph records. Any mismatch means the reconstruction is not faithful and the
    drill-down would be misleading.
    """
    print("\n" + "=" * 72)
    print("VALIDATING re-implementation against stored country graphs")
    print("=" * 72)

    available = sorted(p.name for p in COUNTRIES_DIR.iterdir() if p.is_dir())
    probe_countries = [c for c in ["Kenya", "India", "Brazil", "Norway"] if c in available][:4]
    probe_years = [2005, 2015, 2024]

    checked = 0
    failures: list[str] = []

    for country in probe_countries:
        wide = panel[panel["country"] == country].pivot_table(
            index="year", columns="indicator_id", values="value", aggfunc="mean"
        ).sort_index()

        for year in probe_years:
            path = COUNTRIES_DIR / country / f"{year}_graph.json"
            if not path.exists():
                continue
            with open(path) as fh:
                stored = {(e["source"], e["target"]): e for e in json.load(fh)["edges"]}

            for anchor in ANCHORS:
                key = (anchor["source"], anchor["target"])
                edge = stored.get(key)
                if edge is None:
                    continue
                if key[0] not in wide.columns or key[1] not in wide.columns:
                    continue

                window = wide.loc[wide.index <= year]
                if len(window) < MIN_SAMPLES:
                    continue
                fit = fit_edge(
                    window[key[0]].to_numpy(dtype=float),
                    window[key[1]].to_numpy(dtype=float),
                )
                if fit is None:
                    continue

                checked += 1
                tag = f"{country}/{year} {anchor['id']}"

                if fit["lag"] != edge["lag"]:
                    failures.append(f"{tag}: lag {fit['lag']} != stored {edge['lag']}")
                    continue
                if abs(fit["r2_linear"] - edge["r_squared"]) > 1e-6:
                    failures.append(
                        f"{tag}: linear R2 {fit['r2_linear']:.9f} != stored {edge['r_squared']:.9f}"
                    )
                    continue
                if fit["nonlinearity"].get("type", "linear") != edge["relationship_type"]:
                    failures.append(
                        f"{tag}: form {fit['nonlinearity'].get('type')} != stored {edge['relationship_type']}"
                    )
                    continue
                if fit["n"] != edge["n_samples"]:
                    failures.append(f"{tag}: n {fit['n']} != stored {edge['n_samples']}")
                    continue

                if checked <= samples:
                    print(f"  ok  {tag:28s} lag={fit['lag']} "
                          f"R2={fit['r2_linear']:.9f} form={edge['relationship_type']} n={fit['n']}")

    print(f"\n  checked {checked} edge fits, {len(failures)} mismatch(es)")
    for msg in failures[:15]:
        print(f"  FAIL {msg}")
    if checked == 0:
        print("  ! nothing was checked - treating as failure")
        return False
    return not failures


# --- Entry point -------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--validate", action="store_true",
                        help="only verify the re-implementation, write nothing")
    parser.add_argument("--skip-validate", action="store_true",
                        help="build without the pre-flight validation")
    args = parser.parse_args()

    indicators = {a["source"] for a in ANCHORS} | {a["target"] for a in ANCHORS}
    panel = load_panel(indicators)

    if not args.skip_validate:
        if not validate(panel):
            print("\nValidation failed - refusing to write the artifact.", file=sys.stderr)
            return 1
        print("  reconstruction matches the shipped graphs exactly\n")

    if args.validate:
        return 0

    labels = load_labels(indicators)

    print("Building Layer 1 (unified R2 timelines) ...", flush=True)
    timelines, provenance = build_timelines()

    print("Building Layer 2 (country-scope predicted vs actual) ...", flush=True)
    countries, drilldowns = build_drilldowns(panel)

    findings = []
    for anchor in ANCHORS:
        aid = anchor["id"]
        findings.append({
            "id": aid,
            "group": anchor["group"],
            "title": anchor["title"],
            "source": anchor["source"],
            "target": anchor["target"],
            "sourceLabel": labels.get(anchor["source"], anchor["source"]),
            "targetLabel": labels.get(anchor["target"], anchor["target"]),
            "timeline": timelines[aid],
            "drilldown": drilldowns[aid],
        })

    payload = {
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "yearRange": [YEAR_MIN, YEAR_MAX],
        "scopeNote": (
            "Timeline reads the unified (all-country) temporal graphs. Drill-down is "
            "country-scope: each country fitted on its own series only."
        ),
        "provenance": provenance,
        "disclosures": DISCLOSURES,
        "countries": countries,
        "findings": findings,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w") as fh:
        json.dump(payload, fh, separators=(",", ":"))

    size_mb = OUT_PATH.stat().st_size / 1e6
    print(f"\nWrote {OUT_PATH} ({size_mb:.2f} MB)")
    for finding in findings:
        pts = sum(len(v["c"]) for v in finding["drilldown"].values())
        print(f"  {finding['id']:5s} timeline={len(finding['timeline']):2d} yrs  "
              f"drilldown={len(finding['drilldown']):2d} yrs / {pts:,} country points")
    return 0


if __name__ == "__main__":
    sys.exit(main())
