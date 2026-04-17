from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd

DATA_DIR = Path(__file__).resolve().parent / "data"
DEFAULT_INPUT_PATH = Path(__file__).resolve().parent / "CATNAT_2023_2025.xlsx"
DEFAULT_CLEANED_PATH = DATA_DIR / "portfolio_cleaned.csv"
DEFAULT_ENRICHED_PATH = DATA_DIR / "portfolio_enriched.csv"


def _canonicalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    aliases = {
        "NUMERO_POLICE": ["NUMERO_POLICE"],
        "DATE_EFFET": ["DATE_EFFET"],
        "DATE_EXPIRATION": ["DATE_EXPIRATION"],
        "TYPE": ["TYPE"],
        "Wilaya": ["Wilaya", "WILAYA"],
        "commune_du_risque": ["commune_du_risque", "COMMUNE"],
        "VALEUR_ASSURÉE": ["VALEUR_ASSURÉE", "VALEUR_ASSUREE", "CAPITAL_ASSURE"],
        "PRIME_NETTE": ["PRIME_NETTE"],
    }

    rename_map: dict[str, str] = {}
    for canonical, options in aliases.items():
        for option in options:
            if option in df.columns:
                rename_map[option] = canonical
                break

    canonicalized = df.rename(columns=rename_map).copy()

    required = [
        "NUMERO_POLICE",
        "DATE_EFFET",
        "DATE_EXPIRATION",
        "TYPE",
        "Wilaya",
        "commune_du_risque",
        "VALEUR_ASSURÉE",
        "PRIME_NETTE",
    ]
    missing = [column for column in required if column not in canonicalized.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    return canonicalized[required]


def _read_input_frames(path: str | Path) -> list[pd.DataFrame]:
    source_path = Path(path)
    frames: list[pd.DataFrame] = []

    if source_path.suffix.lower() in {".xlsx", ".xlsm", ".xls"}:
        workbook = pd.ExcelFile(source_path)
        for sheet_name in workbook.sheet_names:
            df = pd.read_excel(source_path, sheet_name=sheet_name)
            df = _canonicalize_columns(df)
            df["source_sheet"] = str(sheet_name)
            frames.append(df)
        return frames

    if source_path.suffix.lower() == ".csv":
        df = pd.read_csv(source_path)
        df = _canonicalize_columns(df)
        df["source_sheet"] = source_path.stem
        return [df]

    raise ValueError(f"Unsupported input format: {source_path.suffix}")


def _extract_code(series: pd.Series) -> pd.Series:
    extracted = series.astype("string").str.extract(r"^\s*(\d+)", expand=False)
    return extracted.where(extracted.notna(), pd.NA).str.zfill(2)


def _strip_code_prefix(series: pd.Series) -> pd.Series:
    cleaned = series.astype("string").str.replace(r"^\s*\d+\s*-\s*", "", regex=True)
    cleaned = cleaned.str.replace(r"\s+", " ", regex=True).str.strip()
    return cleaned.replace({"": pd.NA, "nan": pd.NA, "NaN": pd.NA})


def _parse_numeric(series: pd.Series) -> pd.Series:
    cleaned = (
        series.astype(str)
        .str.replace("\u00a0", "", regex=False)
        .str.replace(" ", "", regex=False)
        .str.strip()
        .replace({"": np.nan, "nan": np.nan, "None": np.nan})
    )

    has_comma = cleaned.str.contains(",", na=False)
    has_dot = cleaned.str.contains(r"\.", na=False)

    both_mask = has_comma & has_dot
    cleaned = cleaned.where(~both_mask, cleaned.str.replace(".", "", regex=False))
    cleaned = cleaned.str.replace(",", ".", regex=False)
    cleaned = cleaned.str.replace(r"[^\d.\-]", "", regex=True)
    return pd.to_numeric(cleaned, errors="coerce")


def load_and_clean_portfolio(paths: list[str | Path]) -> pd.DataFrame:
    """
    Load one or more CSV/XLSX sources and produce a clean portfolio DataFrame.
    """
    frames: list[pd.DataFrame] = []

    for path in paths:
        frames.extend(_read_input_frames(path))

    portfolio = pd.concat(frames, ignore_index=True)

    portfolio["DATE_EFFET"] = pd.to_datetime(
        portfolio["DATE_EFFET"],
        errors="coerce",
        dayfirst=True,
    )
    portfolio["DATE_EXPIRATION"] = pd.to_datetime(
        portfolio["DATE_EXPIRATION"],
        errors="coerce",
        dayfirst=True,
    )

    portfolio["year"] = portfolio["DATE_EFFET"].dt.year
    missing_year_mask = portfolio["year"].isna()
    if missing_year_mask.any():
        portfolio.loc[missing_year_mask, "year"] = pd.to_numeric(
            portfolio.loc[missing_year_mask, "source_sheet"],
            errors="coerce",
        )

    portfolio["wilaya_code"] = _extract_code(portfolio["Wilaya"])
    portfolio["wilaya_name"] = _strip_code_prefix(portfolio["Wilaya"]).str.upper()
    portfolio["commune_name"] = _strip_code_prefix(portfolio["commune_du_risque"]).str.upper()

    portfolio["VALEUR_ASSURÉE"] = _parse_numeric(portfolio["VALEUR_ASSURÉE"]).fillna(0)
    portfolio["PRIME_NETTE"] = _parse_numeric(portfolio["PRIME_NETTE"]).fillna(0)

    portfolio["prime_rate"] = np.where(
        portfolio["VALEUR_ASSURÉE"] > 0,
        portfolio["PRIME_NETTE"] / portfolio["VALEUR_ASSURÉE"],
        np.nan,
    )

    portfolio["TYPE"] = (
        portfolio["TYPE"]
        .fillna("UNKNOWN")
        .astype(str)
        .str.replace(r"\s+", " ", regex=True)
        .str.strip()
    )

    portfolio = portfolio[
        (portfolio["VALEUR_ASSURÉE"] > 0)
        & portfolio["commune_name"].notna()
    ].copy()

    print(f"Portfolio loaded: {len(portfolio)} policies")
    print(f"  Years: {sorted(portfolio['year'].dropna().astype(int).unique().tolist())}")
    print(f"  Types: {portfolio['TYPE'].value_counts().to_dict()}")
    print(f"  Wilayas: {portfolio['wilaya_code'].dropna().nunique()} unique")
    print(
        f"  Wilaya/commune pairs: "
        f"{portfolio[['wilaya_code', 'commune_name']].dropna().drop_duplicates().shape[0]}"
    )
    print(f"  Missing wilaya codes: {int(portfolio['wilaya_code'].isna().sum())}")

    return portfolio


def join_zones(portfolio: pd.DataFrame, zones_df: pd.DataFrame) -> pd.DataFrame:
    """
    Join commune zones into the portfolio DataFrame.
    Exact join first, fuzzy fallback second, wilaya-level fallback last.
    """
    from rapidfuzz import fuzz, process

    from build_commune_zones import get_zone_and_source

    zones_df = zones_df.copy()
    zones_df["wilaya_code"] = zones_df["wilaya_code"].astype(str).str.zfill(2)
    zones_df["commune_name"] = zones_df["commune_name"].astype(str).str.upper().str.strip()

    merged = portfolio.merge(
        zones_df[
            [
                "wilaya_code",
                "commune_name",
                "zone_sismique",
                "zone_source",
                "lat",
                "lon",
                "coordinate_source",
            ]
        ],
        on=["wilaya_code", "commune_name"],
        how="left",
    )

    merged["zone_match_method"] = np.where(merged["zone_sismique"].notna(), "exact", pd.NA)

    unmatched_mask = merged["zone_sismique"].isna()
    n_unmatched = int(unmatched_mask.sum())

    if n_unmatched > 0:
        print(f"Fuzzy matching {n_unmatched} unmatched communes...")

        for idx, row in merged[unmatched_mask].iterrows():
            if pd.isna(row["wilaya_code"]):
                merged.at[idx, "zone_sismique"] = "UNKNOWN"
                merged.at[idx, "zone_source"] = "unknown"
                merged.at[idx, "zone_match_method"] = "missing_wilaya"
                continue

            wilaya_communes = zones_df[
                zones_df["wilaya_code"] == row["wilaya_code"]
            ]["commune_name"].tolist()

            if wilaya_communes:
                best = process.extractOne(
                    row["commune_name"],
                    wilaya_communes,
                    scorer=fuzz.token_sort_ratio,
                )
            else:
                best = None

            if best is not None:
                best_match, score, _ = best
                if score >= 70:
                    zone_row = zones_df[
                        (zones_df["wilaya_code"] == row["wilaya_code"])
                        & (zones_df["commune_name"] == best_match)
                    ].iloc[0]
                    merged.at[idx, "zone_sismique"] = zone_row["zone_sismique"]
                    merged.at[idx, "zone_source"] = zone_row["zone_source"]
                    merged.at[idx, "lat"] = zone_row["lat"]
                    merged.at[idx, "lon"] = zone_row["lon"]
                    merged.at[idx, "coordinate_source"] = zone_row["coordinate_source"]
                    merged.at[idx, "zone_match_method"] = f"fuzzy_{int(score)}"
                    continue

            fallback_zone, fallback_source = get_zone_and_source(
                row["wilaya_code"], row["commune_name"]
            )
            merged.at[idx, "zone_sismique"] = fallback_zone
            merged.at[idx, "zone_source"] = fallback_source
            merged.at[idx, "zone_match_method"] = "wilaya_rpa_fallback"

    zone_to_num = {"0": 0, "I": 1, "IIa": 2, "IIb": 3, "III": 4}
    merged["zone_num"] = merged["zone_sismique"].map(zone_to_num).fillna(-1).astype(int)

    print(f"Zone distribution:\n{merged['zone_sismique'].value_counts(dropna=False)}")
    print(f"Zone match methods:\n{merged['zone_match_method'].value_counts(dropna=False)}")
    print(f"Unknown zones: {int((merged['zone_sismique'] == 'UNKNOWN').sum())}")
    print(f"Missing coordinates: {int(merged['lat'].isna().sum())}")
    return merged


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare enriched CATNAT portfolio data.")
    parser.add_argument(
        "--input",
        default=str(DEFAULT_INPUT_PATH),
        help="Path to CATNAT workbook or CSV source",
    )
    parser.add_argument(
        "--cleaned-output",
        default=str(DEFAULT_CLEANED_PATH),
        help="Path to output cleaned portfolio CSV",
    )
    parser.add_argument(
        "--zones-output",
        default=str(DATA_DIR / "commune_zones.csv"),
        help="Path to commune_zones CSV",
    )
    parser.add_argument(
        "--enriched-output",
        default=str(DEFAULT_ENRICHED_PATH),
        help="Path to output enriched portfolio CSV",
    )
    args = parser.parse_args()

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    portfolio = load_and_clean_portfolio([args.input])
    cleaned_output = Path(args.cleaned_output)
    cleaned_output.parent.mkdir(parents=True, exist_ok=True)
    portfolio.to_csv(cleaned_output, index=False)
    print(f"Saved cleaned portfolio to {cleaned_output}")

    from build_commune_zones import build_lookup_table

    zones_df = build_lookup_table(portfolio, output_path=args.zones_output)
    enriched = join_zones(portfolio, zones_df)

    enriched_output = Path(args.enriched_output)
    enriched_output.parent.mkdir(parents=True, exist_ok=True)
    enriched.to_csv(enriched_output, index=False)
    print(f"Saved enriched portfolio to {enriched_output}")


if __name__ == "__main__":
    main()
