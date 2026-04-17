#!/usr/bin/env python3
"""
run_catboost.py — Standalone CLI test for the CatBoost Risk Classification.

Usage:
    python run_catboost.py --score '{"zone_sismique":"III", "valeur_assuree": 50000000, "type_risque": "1 - Bien Immobilier", "wilaya_code": "16", "prime_nette": 50000}'
"""
import argparse
import json
import sys
import os
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ml_service import ml_service

def main():
    parser = argparse.ArgumentParser(description="Evaluate a policy using the Custom CatBoost Model.")
    parser.add_argument("--score", type=str, help="JSON string representing policy data to score", required=True)
    args = parser.parse_args()

    ml_service.load_models()

    try:
        policy_data = json.loads(args.score)
    except json.JSONDecodeError:
        print("[ERROR] Invalid JSON provided to --score")
        sys.exit(1)

    t0 = time.time()
    result = ml_service.score_policy(policy_data)
    elapsed = time.time() - t0

    print("\n" + "=" * 50)
    print("  CATBOOST RISK CLASSIFICATION")
    print("=" * 50)
    print(f"  Overall Score   : {result['score']:>5} / 100")
    print(f"  Risk Tier       : {result['tier']:>5}")
    print(f"  Dominant Factor : {result['dominant_factor']}")
    print("\n  Class Probabilities:")
    print(f"    LOW    : {result['proba']['LOW']}%")
    print(f"    MEDIUM : {result['proba']['MEDIUM']}%")
    print(f"    HIGH   : {result['proba']['HIGH']}%")
    print("-" * 50)
    print(f"  Latency         : {elapsed*1000:.1f} ms")
    print("=" * 50 + "\n")

if __name__ == "__main__":
    main()
