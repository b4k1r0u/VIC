import numpy as np
import pandas as pd

try:
    from .preprocessing import ADEQUATE_RATES
except ImportError:
    from preprocessing import ADEQUATE_RATES


def build_feature_matrix(portfolio: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    """
    Build the exact feature frame used by both training and inference.

    Expects a portfolio that has already been normalized by preprocessing.py.
    """
    df = pd.DataFrame(index=portfolio.index)

    # Categorical features
    df["zone_sismique"] = portfolio["zone_sismique"].fillna("UNKNOWN").astype(str)
    df["wilaya_code"] = portfolio["wilaya_code"].fillna("UNKNOWN").astype(str)
    df["commune_name"] = portfolio["commune_name"].fillna("UNKNOWN").astype(str)
    df["type_risque"] = portfolio["type_risque"].fillna("UNKNOWN").astype(str)
    df["construction_type"] = portfolio["construction_type"].fillna("INCONNU").astype(str)

    # Numerical features
    df["log_valeur_assuree"] = np.log1p(portfolio["VALEUR_ASSURÉE"].clip(lower=0))
    df["log_prime_nette"] = np.log1p(portfolio["PRIME_NETTE"].clip(lower=0))
    df["prime_rate"] = portfolio["prime_rate"].clip(lower=0, upper=0.05).fillna(0.0)
    df["zone_num"] = portfolio["zone_num"].fillna(-1).astype(int)

    adequate_rates = portfolio["zone_sismique"].map(ADEQUATE_RATES).replace(0, np.nan)
    df["premium_adequacy_ratio"] = (
        (portfolio["prime_rate"] / adequate_rates)
        .replace([np.inf, -np.inf], np.nan)
        .clip(lower=0, upper=5)
        .fillna(0.0)
    )

    duration = (
        pd.to_datetime(portfolio["DATE_EXPIRATION"], errors="coerce") -
        pd.to_datetime(portfolio["DATE_EFFET"], errors="coerce")
    ).dt.days
    df["duration_days"] = duration.clip(lower=0, upper=730).fillna(365).astype(int)
    df["year"] = portfolio["year"].fillna(2025).astype(int)

    cat_features = [
        "zone_sismique",
        "wilaya_code",
        "commune_name",
        "type_risque",
        "construction_type",
    ]
    return df, cat_features
