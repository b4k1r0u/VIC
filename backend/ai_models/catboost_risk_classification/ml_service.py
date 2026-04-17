import os

import joblib
import numpy as np
import pandas as pd
from catboost import CatBoostClassifier

try:
    from .features import build_feature_matrix
    from .preprocessing import (
        ADEQUATE_RATES,
        prepare_portfolio_for_model,
    )
except ImportError:
    from features import build_feature_matrix
    from preprocessing import ADEQUATE_RATES, prepare_portfolio_for_model


class MLService:
    """
    Loaded once at FastAPI startup. Thread-safe for concurrent requests.
    """

    def __init__(self):
        self.model: CatBoostClassifier | None = None
        self.metadata: dict | None = None
        self.tier_labels = {0: "LOW", 1: "MEDIUM", 2: "HIGH"}

    def load_models(self):
        here = os.path.dirname(os.path.abspath(__file__))
        cbm_path = os.path.join(here, "ml_models", "catboost_model.cbm")
        pkl_path = os.path.join(here, "ml_models", "feature_metadata.pkl")

        self.model = CatBoostClassifier()
        self.model.load_model(cbm_path)
        self.metadata = joblib.load(pkl_path)
        print("CatBoost model loaded")

    def score_policy(self, policy_data: dict) -> dict:
        if self.model is None:
            raise RuntimeError("Model is not loaded")

        prepared = self._prepare_policy_frame([policy_data])
        X, _ = build_feature_matrix(prepared)
        X = self._align_feature_order(X)

        proba = self.model.predict_proba(X)[0]
        class_idx = int(np.argmax(proba))
        risk_score = float(proba[2] * 100)

        normalized = prepared.iloc[0]
        return {
            "score": round(risk_score, 1),
            "tier": self.tier_labels[class_idx],
            "proba": {
                "LOW": round(float(proba[0]) * 100, 1),
                "MEDIUM": round(float(proba[1]) * 100, 1),
                "HIGH": round(float(proba[2]) * 100, 1),
            },
            "dominant_factor": self._get_dominant_factor(normalized),
            "normalized_inputs": {
                "zone_sismique": normalized["zone_sismique"],
                "wilaya_code": normalized["wilaya_code"],
                "commune_name": normalized["commune_name"],
                "type_risque": normalized["type_risque"],
                "construction_type": normalized["construction_type"],
            },
        }

    def batch_score(self, policies: list[dict]) -> list[dict]:
        if self.model is None:
            raise RuntimeError("Model is not loaded")
        if not policies:
            return []

        prepared = self._prepare_policy_frame(policies)
        X, _ = build_feature_matrix(prepared)
        X = self._align_feature_order(X)
        probas = self.model.predict_proba(X)

        results = []
        for idx, proba in enumerate(probas):
            results.append(
                {
                    "policy_id": policies[idx].get("id") or prepared.iloc[idx]["NUMERO_POLICE"],
                    "score": round(float(proba[2]) * 100, 1),
                    "tier": self.tier_labels[int(np.argmax(proba))],
                }
            )
        return results

    def get_feature_importance(self) -> dict:
        if self.model is None or self.metadata is None:
            raise RuntimeError("Model metadata is not loaded")

        importances = self.model.get_feature_importance()
        feature_names = self.metadata["feature_names"]
        return {
            name: round(float(importance), 4)
            for name, importance in sorted(
                zip(feature_names, importances),
                key=lambda item: -item[1],
            )
        }

    def _prepare_policy_frame(self, policies: list[dict]) -> pd.DataFrame:
        rows = []
        for idx, policy in enumerate(policies):
            rows.append(
                {
                    "NUMERO_POLICE": policy.get("id", f"API_{idx}"),
                    "zone_sismique": policy.get("zone_sismique", "UNKNOWN"),
                    "wilaya_code": policy.get("wilaya_code", "UNKNOWN"),
                    "commune_name": policy.get("commune_name", "UNKNOWN"),
                    "TYPE": policy.get("type_risque", "UNKNOWN"),
                    "construction_type": policy.get("construction_type"),
                    "VALEUR_ASSURÉE": float(policy.get("valeur_assuree", 0)),
                    "PRIME_NETTE": float(policy.get("prime_nette", 0)),
                    "year": int(policy.get("year", 2025)),
                    "DATE_EFFET": policy.get("date_effet"),
                    "DATE_EXPIRATION": policy.get("date_expiration"),
                }
            )

        df = pd.DataFrame(rows)
        return prepare_portfolio_for_model(df, consolidate=False)

    def _align_feature_order(self, features: pd.DataFrame) -> pd.DataFrame:
        if not self.metadata:
            return features
        return features.loc[:, self.metadata["feature_names"]]

    def _get_dominant_factor(self, policy_row: pd.Series) -> str:
        zone = policy_row["zone_sismique"]
        if zone == "III":
            return "seismic_zone"

        adequate_rate = ADEQUATE_RATES.get(zone, 0.002)
        actual_rate = policy_row.get("prime_rate", 0) or 0
        if adequate_rate > 0 and actual_rate > 0 and actual_rate < adequate_rate * 0.75:
            return "premium_adequacy"

        if float(policy_row.get("VALEUR_ASSURÉE", 0)) > 50_000_000:
            return "insured_value"

        if policy_row.get("type_risque") == "INSTALLATION_INDUSTRIELLE":
            return "risk_type"

        return "risk_combination"


ml_service = MLService()
