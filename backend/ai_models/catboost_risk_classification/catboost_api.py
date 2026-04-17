"""
catboost_api.py — FastAPI router for the CatBoost Risk Classification.

Mount this router in the main FastAPI app:

    from catboost_risk_classification.catboost_api import router as cb_router
    app.include_router(cb_router, prefix="/api/v1")
"""
from __future__ import annotations

import os
import sys
import time
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ml_service import ml_service

router = APIRouter(tags=["CatBoost Risk Analysis"])

# Pre-load the model if not loaded
try:
    if ml_service.model is None:
        ml_service.load_models()
except Exception as e:
    print(f"Failed to autoload models (expected if just building/not trained yet): {e}")

class PolicyScoreRequest(BaseModel):
    zone_sismique: str = Field(default="I", description="RPA 99 Seismic Zone (0, I, IIa, IIb, III)")
    wilaya_code: str = Field(default="16", description="Wilaya code (01-58)")
    commune_name: Optional[str] = Field(default=None, description="Commune name when known")
    type_risque: str = Field(default="Bien immobilier", description="Usage type")
    construction_type: Optional[str] = Field(default=None, description="Material (optional)")
    valeur_assuree: float = Field(default=10000000.0, description="Insured Value in DZD")
    prime_nette: Optional[float] = Field(0.0, description="Net premium (used to calculate coverage adequacy rate)")
    year: int = Field(2025, description="Underwriting year")

class Probabilities(BaseModel):
    LOW: float
    MEDIUM: float
    HIGH: float

class PolicyScoreResponse(BaseModel):
    score: float
    tier: str
    proba: Probabilities
    dominant_factor: str
    normalized_inputs: dict
    elapsed_ms: float

class BatchScoreRequest(BaseModel):
    policies: List[dict]

@router.get("/health", summary="Health check")
def health():
    return {
        "status": "ok",
        "model_loaded": ml_service.model is not None,
    }

@router.post("/score", response_model=PolicyScoreResponse, summary="Score a single policy")
def score_policy(request: PolicyScoreRequest):
    if ml_service.model is None:
        raise HTTPException(status_code=503, detail="CatBoost model is not loaded or missing.")
    
    t0 = time.time()
    res = ml_service.score_policy(request.model_dump())
    elapsed = (time.time() - t0) * 1000
    res["elapsed_ms"] = round(elapsed, 2)
    return res

@router.post("/batch_score", summary="Score multiple policies for map rendering")
def batch_score(request: BatchScoreRequest):
    if ml_service.model is None:
        raise HTTPException(status_code=503, detail="CatBoost model is not loaded or missing.")
    
    res = ml_service.batch_score(request.policies)
    return {"results": res}


if __name__ == "__main__":
    import uvicorn
    from fastapi import FastAPI

    app = FastAPI(title="RASED CatBoost API", version="1.0.0")
    app.include_router(router, prefix="/api/v1")

    print("Starting standalone CatBoost API server…")
    print("  Docs: http://localhost:8002/docs")
    uvicorn.run(app, host="0.0.0.0", port=8002, log_level="info")
