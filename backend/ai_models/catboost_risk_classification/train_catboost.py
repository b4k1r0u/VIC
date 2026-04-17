# scripts/train_catboost.py
"""
Run this once to train and save the CatBoost model.
Expected runtime: 2–5 minutes on a laptop.
"""
import pandas as pd
import numpy as np
from catboost import CatBoostClassifier, Pool, cv
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.metrics import classification_report, roc_auc_score
import shap
import matplotlib.pyplot as plt
import joblib

from scripts.build_commune_zones import build_lookup_table
from scripts.prepare_portfolio import load_and_clean_portfolio, join_zones
from services.ml_service.labeling import assign_risk_labels
from services.ml_service.features import build_feature_matrix


def train():
    # ── 1. Load & prepare data ──────────────────────────────────────
    portfolio = load_and_clean_portfolio([
        "data/portfolio_2023.csv",
        "data/portfolio_2024.csv",
        "data/portfolio_2025.csv",
    ])
    zones_df = pd.read_csv("data/commune_zones.csv")
    portfolio = join_zones(portfolio, zones_df)

    # ── 2. Build features and labels ────────────────────────────────
    X, cat_features = build_feature_matrix(portfolio)
    y, proxy_scores = assign_risk_labels(portfolio)

    print(f"Dataset shape: {X.shape}")
    print(f"Class balance: {y.value_counts().to_dict()}")

    # ── 3. Train/validation split (stratified) ──────────────────────
    X_train, X_val, y_train, y_val = train_test_split(
        X, y,
        test_size=0.20,
        stratify=y,
        random_state=42
    )

    train_pool = Pool(X_train, y_train, cat_features=cat_features)
    val_pool   = Pool(X_val,   y_val,   cat_features=cat_features)

    # ── 4. Model configuration ──────────────────────────────────────
    model = CatBoostClassifier(
        # Core params
        iterations=800,
        learning_rate=0.05,
        depth=7,
        l2_leaf_reg=3,

        # Categorical handling
        cat_features=cat_features,
        one_hot_max_size=10,          # wilaya has ~48 values → use cat embeddings

        # Class imbalance handling
        class_weights={0: 1.0, 1: 1.2, 2: 1.5},  # weight HIGH risk more

        # Output
        loss_function="MultiClass",
        eval_metric="AUC:type=Mu",    # multi-class AUC
        classes_count=3,

        # Training control
        early_stopping_rounds=50,
        random_seed=42,
        verbose=100,

        # GPU if available (dramatically speeds up training)
        task_type="GPU" if _gpu_available() else "CPU",
    )

    # ── 5. Train ────────────────────────────────────────────────────
    model.fit(
        train_pool,
        eval_set=val_pool,
        plot=False,
    )

    # ── 6. Evaluate ─────────────────────────────────────────────────
    y_pred = model.predict(X_val).flatten()
    y_prob = model.predict_proba(X_val)

    print("\n── Classification Report ──")
    print(classification_report(y_val, y_pred,
                                target_names=["LOW", "MEDIUM", "HIGH"]))

    # ── 7. SHAP Explainability ──────────────────────────────────────
    # SHAP shows which features drive each prediction — important for credibility
    explainer = shap.TreeExplainer(model)
    shap_values = explainer(X_val[:200])  # sample for speed

    shap.summary_plot(
        shap_values[:, :, 2],  # SHAP for HIGH class
        X_val[:200],
        plot_type="bar",
        show=False
    )
    plt.savefig("ml_models/shap_feature_importance.png", bbox_inches="tight")
    plt.close()
    print("SHAP plot saved to ml_models/shap_feature_importance.png")

    # ── 8. Save model ───────────────────────────────────────────────
    model.save_model("ml_models/catboost_model.cbm")
    # Also save as ONNX for potential edge deployment
    # model.save_model("ml_models/catboost_model.onnx", format="onnx")

    # Save feature names for inference validation
    joblib.dump({
        "feature_names": list(X.columns),
        "cat_features": cat_features,
        "zone_to_num": {"0": 0, "I": 1, "IIa": 2, "IIb": 3, "III": 4}
    }, "ml_models/feature_metadata.pkl")

    print("\n✅ Model saved to ml_models/catboost_model.cbm")
    print(f"   Best iteration: {model.best_iteration_}")
    return model


def _gpu_available() -> bool:
    try:
        import subprocess
        result = subprocess.run(["nvidia-smi"], capture_output=True)
        return result.returncode == 0
    except FileNotFoundError:
        return False


if __name__ == "__main__":
    train()