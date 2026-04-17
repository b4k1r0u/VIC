# scripts/prepare_portfolio.py
import pandas as pd
import numpy as np
from pathlib import Path

def load_and_clean_portfolio(csv_paths: list[str]) -> pd.DataFrame:
    """
    Load all 3 years of CSV data and produce a clean, enriched DataFrame.
    """
    dfs = []
    for path in csv_paths:
        df = pd.read_csv(path, parse_dates=["DATE_EFFET", "DATE_EXPIRATION"])
        df["year"] = pd.to_datetime(df["DATE_EFFET"]).dt.year
        dfs.append(df)

    portfolio = pd.concat(dfs, ignore_index=True)

    # ── Parse wilaya info ──────────────────────────────────────────────
    # Format in CSV: "2 - CHLEF" → code=02, name="CHLEF"
    portfolio["wilaya_code"] = (
        portfolio["Wilaya"]
        .str.split(" - ").str[0]
        .str.strip()
        .str.zfill(2)
    )
    portfolio["wilaya_name"] = (
        portfolio["Wilaya"]
        .str.split(" - ").str[-1]
        .str.strip()
    )

    # ── Parse commune info ─────────────────────────────────────────────
    # Format in CSV: "495 - OUED SLY" → name="OUED SLY"
    portfolio["commune_name"] = (
        portfolio["commune_du_risque"]
        .str.split(" - ").str[-1]
        .str.strip()
        .str.upper()
    )

    # ── Clean financial columns ────────────────────────────────────────
    portfolio["VALEUR_ASSURÉE"] = pd.to_numeric(
        portfolio["VALEUR_ASSURÉE"].astype(str).str.replace(",", ""),
        errors="coerce"
    ).fillna(0)

    portfolio["PRIME_NETTE"] = pd.to_numeric(
        portfolio["PRIME_NETTE"].astype(str).str.replace(",", ""),
        errors="coerce"
    ).fillna(0)

    # ── Compute derived columns ────────────────────────────────────────
    portfolio["prime_rate"] = np.where(
        portfolio["VALEUR_ASSURÉE"] > 0,
        portfolio["PRIME_NETTE"] / portfolio["VALEUR_ASSURÉE"],
        np.nan
    )

    # ── Normalize TYPE column ──────────────────────────────────────────
    portfolio["TYPE"] = portfolio["TYPE"].fillna("UNKNOWN").str.strip()

    # Drop rows with no useful financial data
    portfolio = portfolio[portfolio["VALEUR_ASSURÉE"] > 0].copy()

    print(f"Portfolio loaded: {len(portfolio)} policies")
    print(f"  Years: {portfolio['year'].unique().tolist()}")
    print(f"  Types: {portfolio['TYPE'].value_counts().to_dict()}")
    print(f"  Wilayas: {portfolio['wilaya_code'].nunique()} unique")

    return portfolio


def join_zones(portfolio: pd.DataFrame, zones_df: pd.DataFrame) -> pd.DataFrame:
    """
    Join the commune zones lookup into the portfolio DataFrame.
    Uses fuzzy matching as fallback when exact join fails.
    """
    from rapidfuzz import process, fuzz

    # First: exact join on wilaya_code + commune_name
    merged = portfolio.merge(
        zones_df[["wilaya_code", "commune_name", "zone_sismique", "lat", "lon"]],
        on=["wilaya_code", "commune_name"],
        how="left"
    )

    # Identify unmatched
    unmatched_mask = merged["zone_sismique"].isna()
    n_unmatched = unmatched_mask.sum()

    if n_unmatched > 0:
        print(f"Fuzzy matching {n_unmatched} unmatched communes...")

        for idx, row in merged[unmatched_mask].iterrows():
            wilaya_communes = zones_df[
                zones_df["wilaya_code"] == row["wilaya_code"]
            ]["commune_name"].tolist()

            if not wilaya_communes:
                merged.at[idx, "zone_sismique"] = "I"  # safe default
                continue

            best_match, score, _ = process.extractOne(
                row["commune_name"],
                wilaya_communes,
                scorer=fuzz.token_sort_ratio
            )
            if score >= 70:
                zone_row = zones_df[
                    (zones_df["wilaya_code"] == row["wilaya_code"]) &
                    (zones_df["commune_name"] == best_match)
                ].iloc[0]
                merged.at[idx, "zone_sismique"] = zone_row["zone_sismique"]
                merged.at[idx, "lat"] = zone_row["lat"]
                merged.at[idx, "lon"] = zone_row["lon"]
            else:
                # Fall back to wilaya-level zone
                from scripts.build_commune_zones import get_zone
                merged.at[idx, "zone_sismique"] = get_zone(
                    row["wilaya_code"], row["commune_name"]
                )

    # Encode zone as ordinal integer (needed by CatBoost as numerical feature)
    zone_to_num = {"0": 0, "I": 1, "IIa": 2, "IIb": 3, "III": 4}
    merged["zone_num"] = merged["zone_sismique"].map(zone_to_num).fillna(1)

    print(f"Zone distribution:\n{merged['zone_sismique'].value_counts()}")
    return merged