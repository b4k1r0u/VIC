from __future__ import annotations

import re
from pathlib import Path

import numpy as np
import pandas as pd

ZONE_TO_NUM = {"0": 0, "I": 1, "IIa": 2, "IIb": 3, "III": 4}
ADEQUATE_RATES = {"0": 0.0005, "I": 0.0012, "IIa": 0.0028, "IIb": 0.0045, "III": 0.0075}

TYPE_UNKNOWN = "UNKNOWN"
TYPE_BIEN = "BIEN_IMMOBILIER"
TYPE_COMMERCIAL = "INSTALLATION_COMMERCIALE"
TYPE_INDUSTRIAL = "INSTALLATION_INDUSTRIELLE"

CONSTRUCTION_UNKNOWN = "INCONNU"
CONSTRUCTION_MASONRY = "MACONNERIE"
CONSTRUCTION_CONCRETE = "BETON_ARME"
CONSTRUCTION_STEEL = "STRUCTURE_METALLIQUE"

TYPE_TO_CONSTRUCTION = {
    TYPE_BIEN: CONSTRUCTION_MASONRY,
    TYPE_COMMERCIAL: CONSTRUCTION_CONCRETE,
    TYPE_INDUSTRIAL: CONSTRUCTION_STEEL,
    TYPE_UNKNOWN: CONSTRUCTION_UNKNOWN,
}

TYPE_RISK_SCORE = {
    TYPE_BIEN: 0.50,
    TYPE_COMMERCIAL: 0.72,
    TYPE_INDUSTRIAL: 0.90,
    TYPE_UNKNOWN: 0.55,
}


def _clean_text(value: object) -> str:
    if value is None or pd.isna(value):
        return ""
    return re.sub(r"\s+", " ", str(value).strip())


def normalize_zone(value: object) -> str:
    text = _clean_text(value).upper().replace(" ", "")
    if text in {"0", "I", "IIA", "IIB", "III"}:
        if text == "IIA":
            return "IIa"
        if text == "IIB":
            return "IIb"
        return text
    return "UNKNOWN"


def normalize_wilaya_code(value: object) -> str:
    text = _clean_text(value)
    if not text or text.lower() == "nan":
        return "UNKNOWN"

    match = re.search(r"(\d+)", text)
    if not match:
        return "UNKNOWN"

    return f"{int(match.group(1)):02d}"


def normalize_type_risque(value: object) -> str:
    text = _clean_text(value).lower()
    if not text:
        return TYPE_UNKNOWN
    if "industri" in text:
        return TYPE_INDUSTRIAL
    if "commercial" in text:
        return TYPE_COMMERCIAL
    if "bien immobilier" in text or "immobilier" in text:
        return TYPE_BIEN
    return TYPE_UNKNOWN


def normalize_construction_type(value: object, type_risque: object | None = None) -> str:
    text = _clean_text(value).lower()
    if text:
        if "metal" in text:
            return CONSTRUCTION_STEEL
        if "beton" in text:
            return CONSTRUCTION_CONCRETE
        if "ma" in text and "onner" in text:
            return CONSTRUCTION_MASONRY

    normalized_type = normalize_type_risque(type_risque)
    return TYPE_TO_CONSTRUCTION.get(normalized_type, CONSTRUCTION_UNKNOWN)


def _coerce_numeric(series: pd.Series) -> pd.Series:
    return pd.to_numeric(series, errors="coerce").fillna(0.0)


def _coerce_datetimes(series: pd.Series) -> pd.Series:
    raw = pd.Series(series, copy=False)
    text = raw.astype("string")
    iso_mask = text.str.fullmatch(r"\d{4}-\d{2}-\d{2}").fillna(False)

    parsed = pd.Series(pd.NaT, index=raw.index, dtype="datetime64[ns]")
    if iso_mask.any():
        parsed.loc[iso_mask] = pd.to_datetime(
            raw.loc[iso_mask],
            errors="coerce",
            format="%Y-%m-%d",
        )
    if (~iso_mask).any():
        parsed.loc[~iso_mask] = pd.to_datetime(
            raw.loc[~iso_mask],
            errors="coerce",
            dayfirst=True,
        )
    return parsed


def _build_policy_group_ids(portfolio: pd.DataFrame) -> pd.Series:
    raw_ids = portfolio.get("NUMERO_POLICE", pd.Series(index=portfolio.index, dtype="string"))
    raw_ids = raw_ids.astype("string")
    invalid_mask = raw_ids.isna() | raw_ids.str.strip().eq("") | raw_ids.str.lower().eq("nan")
    fallback_ids = pd.Series([f"ROW_{idx}" for idx in portfolio.index], index=portfolio.index, dtype="string")
    policy_ids = raw_ids.where(~invalid_mask, fallback_ids)

    effect = pd.to_datetime(portfolio.get("DATE_EFFET"), errors="coerce").dt.strftime("%Y-%m-%d")
    expiry = pd.to_datetime(portfolio.get("DATE_EXPIRATION"), errors="coerce").dt.strftime("%Y-%m-%d")

    has_effect = effect.notna()
    has_expiry = expiry.notna()
    has_term = has_effect | has_expiry

    term_key = pd.Series("NO_TERM", index=portfolio.index, dtype="string")
    term_key = term_key.where(~has_effect, effect.fillna("NO_EFFET"))
    term_key = term_key + "|" + expiry.fillna("NO_EXPIRY")

    return policy_ids.where(~has_term, policy_ids + "|" + term_key)


def prepare_portfolio_for_model(
    portfolio: pd.DataFrame,
    *,
    consolidate: bool = False,
) -> pd.DataFrame:
    df = portfolio.copy()

    if "VALEUR_ASSURÉE" not in df.columns and "VALEUR_ASSUREE" in df.columns:
        df = df.rename(columns={"VALEUR_ASSUREE": "VALEUR_ASSURÉE"})

    if "TYPE" not in df.columns and "type_risque" in df.columns:
        df["TYPE"] = df["type_risque"]

    if "zone_sismique" not in df.columns:
        df["zone_sismique"] = "UNKNOWN"

    if "wilaya_code" not in df.columns:
        df["wilaya_code"] = "UNKNOWN"

    if "commune_name" not in df.columns:
        df["commune_name"] = "UNKNOWN"

    if "construction_type" not in df.columns:
        df["construction_type"] = pd.NA

    if "DATE_EFFET" in df.columns:
        df["DATE_EFFET"] = _coerce_datetimes(df["DATE_EFFET"])
    else:
        df["DATE_EFFET"] = pd.NaT

    if "DATE_EXPIRATION" in df.columns:
        df["DATE_EXPIRATION"] = _coerce_datetimes(df["DATE_EXPIRATION"])
    else:
        df["DATE_EXPIRATION"] = pd.NaT

    df["NUMERO_POLICE"] = df.get("NUMERO_POLICE", pd.Series(index=df.index, dtype="string")).astype("string")
    df["policy_group_id"] = _build_policy_group_ids(df)
    df["zone_sismique"] = df["zone_sismique"].map(normalize_zone)
    df["wilaya_code"] = df["wilaya_code"].map(normalize_wilaya_code)
    df["commune_name"] = df["commune_name"].map(lambda value: _clean_text(value).upper() or "UNKNOWN")
    df["type_risque"] = df["TYPE"].map(normalize_type_risque)
    df["construction_type"] = [
        normalize_construction_type(raw_construction, raw_type)
        for raw_construction, raw_type in zip(df["construction_type"], df["type_risque"])
    ]

    df["VALEUR_ASSURÉE"] = _coerce_numeric(df["VALEUR_ASSURÉE"])
    df["PRIME_NETTE"] = _coerce_numeric(df.get("PRIME_NETTE", 0.0))
    df["year"] = pd.to_numeric(df.get("year", pd.NA), errors="coerce")
    df["year"] = df["year"].fillna(df["DATE_EFFET"].dt.year).fillna(2025).astype(int)

    if consolidate:
        df = consolidate_policy_history(df)

    df["prime_rate"] = np.where(
        df["VALEUR_ASSURÉE"] > 0,
        df["PRIME_NETTE"] / df["VALEUR_ASSURÉE"],
        np.nan,
    )
    df["zone_num"] = df["zone_sismique"].map(ZONE_TO_NUM).fillna(-1).astype(int)
    adequate_rates = df["zone_sismique"].map(ADEQUATE_RATES).replace(0, np.nan)
    df["premium_adequacy_ratio"] = (
        (df["prime_rate"] / adequate_rates)
        .replace([np.inf, -np.inf], np.nan)
        .clip(lower=0, upper=5)
    )

    return df


def consolidate_policy_history(portfolio: pd.DataFrame) -> pd.DataFrame:
    df = portfolio.copy()
    df["_row_order"] = np.arange(len(df))

    df = df.sort_values(
        ["policy_group_id", "DATE_EFFET", "DATE_EXPIRATION", "_row_order"],
        na_position="last",
    )

    latest_rows = df.groupby("policy_group_id", dropna=False, sort=False).tail(1).copy()
    aggregates = df.groupby("policy_group_id", dropna=False).agg(
        NUMERO_POLICE=("NUMERO_POLICE", "last"),
        PRIME_NETTE_TOTAL=("PRIME_NETTE", "sum"),
        max_valeur_assuree=("VALEUR_ASSURÉE", "max"),
        rows_per_policy=("policy_group_id", "size"),
        unique_communes=("commune_name", "nunique"),
        unique_effective_dates=("DATE_EFFET", "nunique"),
    )

    latest_rows = latest_rows.merge(
        aggregates,
        left_on="policy_group_id",
        right_index=True,
        how="left",
    )

    latest_rows["VALEUR_ASSURÉE"] = np.where(
        latest_rows["VALEUR_ASSURÉE"] > 0,
        latest_rows["VALEUR_ASSURÉE"],
        latest_rows["max_valeur_assuree"],
    )
    latest_rows["PRIME_NETTE"] = latest_rows["PRIME_NETTE_TOTAL"]
    latest_rows["year"] = latest_rows["DATE_EFFET"].dt.year.fillna(latest_rows["year"]).fillna(2025).astype(int)

    return latest_rows.drop(columns=["_row_order", "PRIME_NETTE_TOTAL", "max_valeur_assuree"])


def load_training_portfolio(csv_path: str | Path) -> pd.DataFrame:
    df = pd.read_csv(
        csv_path,
        low_memory=False,
        dtype={
            "NUMERO_POLICE": "string",
            "wilaya_code": "string",
            "zone_sismique": "string",
            "commune_name": "string",
            "TYPE": "string",
            "construction_type": "string",
        },
    )
    prepared = prepare_portfolio_for_model(df, consolidate=True)
    prepared = prepared[prepared["VALEUR_ASSURÉE"] > 0].copy()
    return prepared.reset_index(drop=True)
