# services/ml_service/labeling.py
import pandas as pd
ZONE_TO_NUM = {"0": 0, "I": 1, "IIa": 2, "IIb": 3, "III": 4}

# Risk weights for each factor (calibrated to RPA 99 and actuarial practice)
ZONE_WEIGHT      = 0.40   # seismic zone is the dominant factor
VALUE_WEIGHT     = 0.25   # higher value = more at stake
TYPE_WEIGHT      = 0.20   # construction/usage type matters
RATE_WEIGHT      = 0.15   # a very low prime_rate vs. adequate = higher real risk

def compute_proxy_risk_score(row: pd.Series, portfolio: pd.DataFrame) -> float:
    """
    Computes a continuous risk score [0, 1] for a policy using
    domain-knowledge rules. This becomes the training signal for CatBoost.

    The score is NOT the label. We discretize it into 3 classes (0/1/2).
    CatBoost then learns a richer function than our rules alone capture.
    """
    # ── Factor 1: Seismic Zone (0–4 scale) ──────────────────────────
    zone_score = ZONE_TO_NUM.get(row["zone_sismique"], 1) / 4.0

    # ── Factor 2: Normalized Insured Value ──────────────────────────
    val_median = portfolio["VALEUR_ASSURÉE"].median()
    val_p90    = portfolio["VALEUR_ASSURÉE"].quantile(0.90)
    val_score  = min(row["VALEUR_ASSURÉE"] / val_p90, 1.0)

    # ── Factor 3: Risk Type Multiplier ──────────────────────────────
    type_risk = {
        "1 - Bien Immobilier":          0.5,   # residential — moderate
        "2 - Installation Commerciale": 0.7,   # commercial — higher
        "3 - Installation Industrielle":0.9,   # industrial — highest
        "UNKNOWN":                      0.5,
    }
    type_score = type_risk.get(row["TYPE"], 0.5)

    # ── Factor 4: Premium Rate Adequacy ─────────────────────────────
    # If the company is charging less than the actuarially adequate rate,
    # the "hidden risk" is higher (underpricing = higher risk exposure)
    adequate_rates = {
        "0": 0.0005, "I": 0.0012, "IIa": 0.0028, "IIb": 0.0045, "III": 0.0075
    }
    adequate = adequate_rates.get(row["zone_sismique"], 0.002)
    actual   = row.get("prime_rate", adequate)

    if actual > 0 and adequate > 0:
        rate_gap_normalized = max(0, (adequate - actual) / adequate)  # 0 if overpriced
    else:
        rate_gap_normalized = 0.5  # unknown — medium risk

    # ── Composite Score ──────────────────────────────────────────────
    score = (
        ZONE_WEIGHT   * zone_score +
        VALUE_WEIGHT  * val_score  +
        TYPE_WEIGHT   * type_score +
        RATE_WEIGHT   * rate_gap_normalized
    )
    return score  # in [0, 1]


def assign_risk_labels(portfolio: pd.DataFrame) -> pd.Series:
    """
    Discretize the proxy risk score into 3 classes for CatBoost training.
    Threshold chosen to create roughly 30% HIGH, 40% MEDIUM, 30% LOW.
    """
    scores = portfolio.apply(
        lambda r: compute_proxy_risk_score(r, portfolio),
        axis=1
    )
    labels = pd.cut(scores, bins=[0, 0.35, 0.65, 1.0], labels=[0, 1, 2])
    labels = labels.cat.codes  # convert to integers
    print(f"Label distribution: {labels.value_counts().to_dict()}")
    return labels, scores