# services/ml_service.py
import numpy as np
import pandas as pd
import joblib
from catboost import CatBoostClassifier
from services.ml_service.features import build_feature_matrix

class MLService:
    """
    Loaded once at FastAPI startup. Thread-safe for concurrent requests.
    """

    def __init__(self):
        self.model: CatBoostClassifier | None = None
        self.metadata: dict | None = None
        self.TIER_LABELS = {0: "LOW", 1: "MEDIUM", 2: "HIGH"}

    def load_models(self):
        self.model = CatBoostClassifier()
        self.model.load_model("ml_models/catboost_model.cbm")
        self.metadata = joblib.load("ml_models/feature_metadata.pkl")
        print("✅ CatBoost model loaded")

    def score_policy(self, policy_data: dict) -> dict:
        """
        Score a single policy. Called during policy creation and live form validation.

        Input dict must have: zone_sismique, wilaya_code, type_risque,
                               valeur_assuree, prime_nette (optional)
        """
        # Build a single-row DataFrame
        row = pd.Series({
            "zone_sismique": policy_data.get("zone_sismique", "I"),
            "wilaya_code":   str(policy_data.get("wilaya_code", "00")).zfill(2),
            "TYPE":          policy_data.get("type_risque", "UNKNOWN"),
            "construction_type": policy_data.get("construction_type", "Inconnu"),
            "VALEUR_ASSURÉE":    float(policy_data.get("valeur_assuree", 0)),
            "PRIME_NETTE":       float(policy_data.get("prime_nette", 0)),
            "prime_rate":        self._safe_rate(policy_data),
            "year":              policy_data.get("year", 2025),
            "DATE_EFFET":        None,
            "DATE_EXPIRATION":   None,
        })
        df = pd.DataFrame([row])
        X, _ = build_feature_matrix(df)

        # Predict
        proba = self.model.predict_proba(X)[0]  # [p_low, p_medium, p_high]
        class_idx = int(np.argmax(proba))
        risk_score = float(proba[2] * 100)      # probability of HIGH × 100

        return {
            "score":       round(risk_score, 1),
            "tier":        self.TIER_LABELS[class_idx],
            "proba":       {
                "LOW":    round(float(proba[0]) * 100, 1),
                "MEDIUM": round(float(proba[1]) * 100, 1),
                "HIGH":   round(float(proba[2]) * 100, 1),
            },
            "dominant_factor": self._get_dominant_factor(policy_data),
        }

    def batch_score(self, policies: list[dict]) -> list[dict]:
        """Score all policies at once for map rendering. Much faster than one by one."""
        if not policies:
            return []

        rows = []
        for p in policies:
            rows.append(pd.Series({
                "zone_sismique":     p.get("zone_sismique", "I"),
                "wilaya_code":       str(p.get("wilaya_code", "00")).zfill(2),
                "TYPE":              p.get("type_risque", "UNKNOWN"),
                "construction_type": p.get("construction_type", "Inconnu"),
                "VALEUR_ASSURÉE":    float(p.get("valeur_assuree", 0)),
                "PRIME_NETTE":       float(p.get("prime_nette", 0)),
                "prime_rate":        self._safe_rate(p),
                "year":              p.get("year", 2025),
                "DATE_EFFET":        None,
                "DATE_EXPIRATION":   None,
            }))

        df = pd.DataFrame(rows)
        X, _ = build_feature_matrix(df)
        probas = self.model.predict_proba(X)

        results = []
        for i, proba in enumerate(probas):
            results.append({
                "policy_id": policies[i].get("id"),
                "score":     round(float(proba[2]) * 100, 1),
                "tier":      self.TIER_LABELS[int(np.argmax(proba))],
            })
        return results

    def get_feature_importance(self) -> dict:
        """For explainability panel in UI."""
        importances = self.model.get_feature_importance()
        feature_names = self.metadata["feature_names"]
        return {
            name: round(float(imp), 4)
            for name, imp in sorted(
                zip(feature_names, importances),
                key=lambda x: -x[1]
            )
        }

    def _safe_rate(self, policy_data: dict) -> float:
        val   = float(policy_data.get("valeur_assuree", 0))
        prime = float(policy_data.get("prime_nette", 0))
        return (prime / val) if val > 0 else 0.0

    def _get_dominant_factor(self, policy_data: dict) -> str:
        zone_risks = {"0": "low", "I": "low", "IIa": "moderate",
                      "IIb": "high", "III": "critical"}
        zone = policy_data.get("zone_sismique", "I")
        if zone_risks.get(zone, "low") == "critical":
            return "seismic_zone"
        val = float(policy_data.get("valeur_assuree", 0))
        if val > 50_000_000:  # 50M DZD
            return "insured_value"
        return "risk_combination"


ml_service = MLService()  # singleton, imported in main.py