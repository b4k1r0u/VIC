# services/ml_service/features.py
import pandas as pd
import numpy as np

def build_feature_matrix(portfolio: pd.DataFrame) -> pd.DataFrame:
    """
    Build the final feature matrix for CatBoost training and inference.
    Returns DataFrame with exactly the features the model expects.
    """
    df = pd.DataFrame()

    # ── Categorical features (CatBoost handles these natively) ──────
    df["zone_sismique"]  = portfolio["zone_sismique"].fillna("I").astype(str)
    df["wilaya_code"]    = portfolio["wilaya_code"].fillna("00").astype(str)
    df["type_risque"]    = portfolio["TYPE"].fillna("UNKNOWN").astype(str)

    # Construction type — new field captured at policy creation
    # For historical data: we impute from TYPE
    def impute_construction(row):
        if pd.notna(row.get("construction_type")):
            return row["construction_type"]
        # Imputation logic:
        type_to_construction = {
            "1 - Bien Immobilier":           "Maçonnerie",
            "2 - Installation Commerciale":  "Béton armé",
            "3 - Installation Industrielle": "Structure métallique",
        }
        return type_to_construction.get(row["TYPE"], "Inconnu")

    df["construction_type"] = portfolio.apply(impute_construction, axis=1)

    # ── Numerical features ───────────────────────────────────────────
    df["log_valeur_assuree"] = np.log1p(portfolio["VALEUR_ASSURÉE"])  # log-normalize

    # Prime rate (clip outliers)
    df["prime_rate"] = portfolio["prime_rate"].clip(0, 0.05).fillna(0)

    # Zone as ordinal number (redundant with categorical, but helps tree splits)
    zone_to_num = {"0": 0, "I": 1, "IIa": 2, "IIb": 3, "III": 4}
    df["zone_num"] = portfolio["zone_sismique"].map(zone_to_num).fillna(1)

    # Policy duration in days (longer = more exposure period)
    if "DATE_EFFET" in portfolio.columns and "DATE_EXPIRATION" in portfolio.columns:
        df["duration_days"] = (
            pd.to_datetime(portfolio["DATE_EXPIRATION"]) -
            pd.to_datetime(portfolio["DATE_EFFET"])
        ).dt.days.clip(0, 730)
    else:
        df["duration_days"] = 365

    # Year (CatBoost can learn temporal patterns)
    df["year"] = portfolio["year"].fillna(2024).astype(int)

    # ── Categorical feature indices (for CatBoost) ───────────────────
    CAT_FEATURES = ["zone_sismique", "wilaya_code", "type_risque", "construction_type"]

    return df, CAT_FEATURES