"""
Precompute QoL Scores for All Countries and Years

Run-once script that:
  A. Loads baselines, computes norm stats, determines empirical indicator directions
  B. Computes raw QoL for every country-year
  C. Fits HDI calibration from panel HDI data
  D. Applies calibration, saves final scores

Usage:
    source api/venv/bin/activate
    python -m simulation.precompute_qol_scores
"""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from simulation.qol_definition import (
    DEFINITION_ID,
    apply_hdi_calibration,
    compute_normalization_stats,
    compute_raw_qol,
    load_indicator_metadata,
)

DATA_ROOT = PROJECT_ROOT / "data"
BASELINES_DIR = DATA_ROOT / "v31" / "baselines"
METADATA_DIR = DATA_ROOT / "v31" / "metadata"
OUTPUT_DIR = DATA_ROOT / "v31" / "qol_scores"
PANEL_PATH = DATA_ROOT / "raw" / "v21_panel_data_for_v3.parquet"

# Mapping from panel country names → baseline directory names
PANEL_TO_BASELINE_NAME: Dict[str, str] = {
    "Bolivia (Plurinational State of)": "Bolivia",
    "Cabo Verde": "Cape Verde",
    "Central African Republic (the)": "Central African Republic",
    "Comoros (the)": "Comoros",
    "Congo (the Democratic Republic of the)": "Congo, Dem. Rep.",
    "Congo (the)": "Republic of the Congo",
    "CÃ\u00b4te d'Ivoire": "Ivory Coast",
    "Dominican Republic (the)": "Dominican Republic",
    "Gambia (the)": "The Gambia",
    "Iran (Islamic Republic of)": "Iran, Islamic Rep.",
    "Korea (the Republic of)": "Korea, Rep.",
    "Lao People's Democratic Republic (the)": "Laos",
    "Moldova (the Republic of)": "Moldova",
    "Netherlands (the)": "Netherlands",
    "Niger (the)": "Niger",
    "Philippines (the)": "Philippines",
    "Russian Federation (the)": "Russia",
    "Syrian Arab Republic (the)": "Syria",
    "Tanzania, the United Republic of": "Tanzania",
    "Turkey": "Türkiye",
    "United Arab Emirates (the)": "United Arab Emirates",
    "United Kingdom of Great Britain and Northern Ireland (the)": "United Kingdom",
    "United States of America (the)": "United States",
    "Venezuela (Bolivarian Republic of)": "Venezuela, RB",
}


def load_all_baselines() -> Dict[str, Dict[str, Dict[str, float]]]:
    """
    Load all baseline files from data/v31/baselines/{country}/{year}.json.

    Returns:
        { country: { year_str: { indicator_id: value } } }
    """
    all_baselines: Dict[str, Dict[str, Dict[str, float]]] = {}
    skip_dirs = {"regional", "stratified", "unified"}

    for country_dir in sorted(BASELINES_DIR.iterdir()):
        if not country_dir.is_dir() or country_dir.name in skip_dirs:
            continue
        country = country_dir.name
        all_baselines[country] = {}
        for year_file in sorted(country_dir.glob("*.json")):
            year_str = year_file.stem
            with open(year_file) as f:
                data = json.load(f)
            all_baselines[country][year_str] = data.get("values", {})

    return all_baselines


def build_hdi_map() -> Dict[str, Dict[str, float]]:
    """
    Load HDI values from panel, mapped to baseline country names.

    Returns:
        { baseline_country_name: { year_str: hdi_value } }
    """
    df = pd.read_parquet(PANEL_PATH)
    hdi_df = df[df["indicator_id"] == "undp_hdi"][["country", "year", "value"]].copy()
    hdi_df = hdi_df.dropna(subset=["value"])

    result: Dict[str, Dict[str, float]] = {}
    for _, row in hdi_df.iterrows():
        bl_name = PANEL_TO_BASELINE_NAME.get(row["country"], row["country"])
        result.setdefault(bl_name, {})[str(int(row["year"]))] = float(row["value"])

    return result


def compute_yearly_normalization_stats(
    all_baselines: Dict[str, Dict[str, Dict[str, float]]],
) -> Dict[str, Dict[str, dict]]:
    """
    Compute min-max normalization stats separately for each year.

    Returns:
        { year_str: { indicator_id: {min, max, n} } }
    """
    years = sorted({
        year_str
        for country_years in all_baselines.values()
        for year_str in country_years.keys()
    })

    stats_by_year: Dict[str, Dict[str, dict]] = {}
    for year_str in years:
        year_slice = {
            country: {year_str: year_values}
            for country, country_years in all_baselines.items()
            if (year_values := country_years.get(year_str)) is not None
        }
        stats_by_year[year_str] = compute_normalization_stats(year_slice)

    return stats_by_year


def fit_hdi_calibration(
    raw_scores: Dict[str, Dict[str, float]],
    hdi_map: Dict[str, Dict[str, float]],
    n_breakpoints: int = 20,
) -> Tuple[Dict[str, List[float]], Dict[str, float]]:
    """
    Fit piecewise-linear calibration from raw QoL → HDI.

    Uses isotonic regression to ensure monotonicity, then samples breakpoints.

    Returns:
        (calibration_dict, fit_stats)
    """
    from sklearn.isotonic import IsotonicRegression

    # Join raw_scores with HDI
    pairs: List[Tuple[float, float]] = []
    for country, years in raw_scores.items():
        hdi_years = hdi_map.get(country, {})
        for year_str, raw_qol in years.items():
            hdi_val = hdi_years.get(year_str)
            if hdi_val is not None:
                pairs.append((raw_qol, hdi_val))

    if len(pairs) < 50:
        raise ValueError(f"Too few QoL-HDI pairs for calibration: {len(pairs)}")

    raw_arr = np.array([p[0] for p in pairs])
    hdi_arr = np.array([p[1] for p in pairs])

    # Fit isotonic regression (monotonic increasing)
    iso = IsotonicRegression(increasing=True, out_of_bounds="clip")
    iso.fit(raw_arr, hdi_arr)

    # Sample breakpoints evenly across the raw score range
    raw_min, raw_max = float(raw_arr.min()), float(raw_arr.max())
    bp_raw = np.linspace(raw_min, raw_max, n_breakpoints)
    bp_hdi = iso.predict(bp_raw)

    calibration = {
        "breakpoints": [round(float(x), 6) for x in bp_raw],
        "hdi_values": [round(float(x), 6) for x in bp_hdi],
    }

    # Compute fit statistics
    predicted = iso.predict(raw_arr)
    residuals = hdi_arr - predicted
    correlation = float(np.corrcoef(raw_arr, hdi_arr)[0, 1])
    mae = float(np.mean(np.abs(residuals)))

    stats = {
        "correlation": round(correlation, 4),
        "mae": round(mae, 4),
        "n_pairs": len(pairs),
        "raw_range": [round(raw_min, 4), round(raw_max, 4)],
        "hdi_range": [round(float(hdi_arr.min()), 4), round(float(hdi_arr.max()), 4)],
    }

    return calibration, stats


def main() -> None:
    print(f"=== QoL Score Precomputation ({DEFINITION_ID}) ===\n")

    # --- Phase A: Load metadata, baselines, compute normalization stats ---
    print("Phase A: Loading indicator metadata...")
    metadata = load_indicator_metadata(
        DATA_ROOT / "raw" / "v21_nodes.csv",
        METADATA_DIR / "indicator_properties.json",
    )
    print(f"  {len(metadata)} indicators loaded")

    print("Phase A: Loading all baselines...")
    all_baselines = load_all_baselines()
    n_countries = len(all_baselines)
    n_files = sum(len(years) for years in all_baselines.values())
    print(f"  {n_countries} countries, {n_files} country-year files")

    print("Phase A: Computing normalization stats (global + per-year min-max)...")
    norm_stats_global = compute_normalization_stats(all_baselines)
    norm_stats_by_year = compute_yearly_normalization_stats(all_baselines)
    print(f"  Global stats for {len(norm_stats_global)} indicators")
    print(f"  Year-specific stats for {len(norm_stats_by_year)} years")

    # Save normalization stats
    METADATA_DIR.mkdir(parents=True, exist_ok=True)
    norm_path = METADATA_DIR / "qol_normalization_stats_v1.json"
    with open(norm_path, "w") as f:
        json.dump(
            {
                "schema": "per_year_minmax_v1",
                "global": norm_stats_global,
                "by_year": norm_stats_by_year,
            },
            f,
        )
    print(f"  Saved -> {norm_path.relative_to(PROJECT_ROOT)}")

    print("Phase A: Loading HDI data...")
    hdi_map = build_hdi_map()
    print(f"  HDI data for {len(hdi_map)} countries")

    # --- Phase B: Compute raw QoL for all country-years ---
    print("\nPhase B: Computing raw QoL scores...")
    raw_scores: Dict[str, Dict[str, float]] = {}
    total = 0
    skipped = 0

    for country, years in all_baselines.items():
        raw_scores[country] = {}
        for year_str, values in years.items():
            year_stats = norm_stats_by_year.get(year_str) or norm_stats_global
            result = compute_raw_qol(values, metadata, year_stats)
            if result is not None:
                raw_qol, _, _ = result
                raw_scores[country][year_str] = raw_qol
                total += 1
            else:
                skipped += 1

    print(f"  {total} scores computed, {skipped} skipped (insufficient domains)")

    # Quick sanity check on raw scores
    raw_2020 = {c: s.get("2020") for c, s in raw_scores.items() if s.get("2020") is not None}
    sorted_2020 = sorted(raw_2020.items(), key=lambda x: x[1])
    print(f"  Raw 2020 range: {sorted_2020[0][0]}={sorted_2020[0][1]:.4f} to {sorted_2020[-1][0]}={sorted_2020[-1][1]:.4f}")
    norway_raw = raw_2020.get("Norway")
    afghan_raw = raw_2020.get("Afghanistan")
    if norway_raw and afghan_raw:
        print(f"  Norway raw={norway_raw:.4f}, Afghanistan raw={afghan_raw:.4f} (Norway should be higher)")

    # --- Phase C: Fit HDI calibration ---
    print("\nPhase C: Fitting HDI calibration...")
    calibration, cal_stats = fit_hdi_calibration(raw_scores, hdi_map)
    print(f"  Correlation: {cal_stats['correlation']}")
    print(f"  MAE: {cal_stats['mae']}")
    print(f"  Pairs: {cal_stats['n_pairs']}")

    # Save calibration
    cal_path = METADATA_DIR / "qol_calibration_v1.json"
    with open(cal_path, "w") as f:
        json.dump({"calibration": calibration, "stats": cal_stats}, f, indent=2)
    print(f"  Saved -> {cal_path.relative_to(PROJECT_ROOT)}")

    # --- Phase D: Apply calibration and save final scores ---
    print("\nPhase D: Applying calibration to all country-years...")

    # Load ISO3 codes
    with open(METADATA_DIR / "income_classifications.json") as f:
        ic_data = json.load(f)
    ic_countries = ic_data.get("countries", {})

    # Build final output
    scores_output: Dict[str, dict] = {}
    for country, years in raw_scores.items():
        iso3 = ic_countries.get(country, {}).get("iso3", "")
        by_year: Dict[str, float] = {}
        for year_str, raw_qol in years.items():
            calibrated = apply_hdi_calibration(raw_qol, calibration)
            by_year[year_str] = round(calibrated, 4)

        if by_year:
            scores_output[country] = {
                "iso3": iso3,
                "by_year": dict(sorted(by_year.items())),
            }

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / "country_year_qol_v1.json"
    final = {
        "definition_id": DEFINITION_ID,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "calibration": cal_stats,
        "scores": dict(sorted(scores_output.items())),
    }
    with open(output_path, "w") as f:
        json.dump(final, f, indent=2)
    print(f"  {len(scores_output)} countries with scores")
    print(f"  Saved -> {output_path.relative_to(PROJECT_ROOT)}")

    # --- Verification ---
    print("\n=== Verification ===")
    check_year = "2020"
    ranked_2020 = sorted(
        (
            (country, data["by_year"].get(check_year))
            for country, data in scores_output.items()
            if data["by_year"].get(check_year) is not None
        ),
        key=lambda x: x[1],
    )
    print(f"  2020 bottom 5: {[c for c, _ in ranked_2020[:5]]}")
    print(f"  2020 top 5: {[c for c, _ in ranked_2020[-5:]]}")
    print(f"  Calibration correlation(raw->HDI): {cal_stats['correlation']}")
    if cal_stats["correlation"] < 0.5:
        print("  WARN: raw-to-HDI correlation is low; review domain coverage and indicator directions.")

    print("\nDone.")


if __name__ == "__main__":
    main()
