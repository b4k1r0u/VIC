"""
monte_carlo_api.py — FastAPI router for the Monte Carlo loss simulation.

Mount this router in the main FastAPI app:

    from monte_carlo_loss_simulation.monte_carlo_api import router as mc_router
    app.include_router(mc_router, prefix="/api/v1")

The portfolio is loaded once at startup and shared across all requests.
"""
from __future__ import annotations

import os
import sys
import time
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

# ── Make local imports work whether this is run standalone or as a package ────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from simulation_service import SimulationService

router = APIRouter(tags=["Monte Carlo Simulation"])

# ── Singleton service + portfolio loaded once at import time ──────────────────
_service = SimulationService()
_portfolio = None  # lazy-loaded on first request to avoid startup delays


def _get_portfolio():
    global _portfolio
    if _portfolio is None:
        _portfolio = SimulationService.load_portfolio()
    return _portfolio


# ── Request / Response models ─────────────────────────────────────────────────

class SimulationRequest(BaseModel):
    scenario: str = Field(
        default="boumerdes_2003",
        description=(
            "Preset scenario key: 'boumerdes_2003', 'el_asnam_1980', or 'custom'. "
            "When 'custom', magnitude / epicenter_lat / epicenter_lon are required."
        ),
        examples=["boumerdes_2003", "el_asnam_1980", "custom"],
    )
    magnitude: Optional[float] = Field(None, ge=4.0, le=9.0, description="Earthquake magnitude (custom only)")
    epicenter_lat: Optional[float] = Field(None, ge=15.0, le=40.0, description="Epicenter latitude (custom only)")
    epicenter_lon: Optional[float] = Field(None, ge=-10.0, le=12.0, description="Epicenter longitude (custom only)")
    depth_km: float = Field(10.0, ge=1.0, le=100.0, description="Focal depth in km")
    scope: Optional[str] = Field(None, pattern="^(wilaya|commune)$", description="Optional spatial scope filter")
    scope_code: Optional[str] = Field(None, description="Wilaya code (e.g. '16') or commune_id for scope filter")

    model_config = {"json_schema_extra": {"example": {"scenario": "boumerdes_2003"}}}


class PerCommuneEntry(BaseModel):
    wilaya_code: str
    commune_name: str
    lat: Optional[float]
    lon: Optional[float]
    expected_loss: float
    policy_count: int
    total_exposure: float


class SimulationResult(BaseModel):
    scenario_name: str
    affected_policies: int
    n_simulations: int
    # Gross (before reinsurance)
    expected_gross_loss: float
    gross_var_95: float
    gross_var_99: float
    # Net (after cession)
    expected_net_loss: float
    var_95: float
    var_99: float
    pml_999: float
    # For histogram (500 sampled points)
    distribution_json: list[float]
    # For map overlay
    per_commune_json: list[dict]


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/health", summary="Health check")
def health():
    """Returns service status and whether the portfolio is loaded."""
    return {
        "status": "ok",
        "portfolio_loaded": _portfolio is not None,
        "available_scenarios": list(SimulationService.SCENARIOS.keys()),
    }


@router.get("/scenarios", summary="List available preset scenarios")
def list_scenarios():
    """Returns the list of built-in scenario presets with their metadata."""
    return {
        key: {
            "label": v["label"],
            "magnitude": v["magnitude"],
            "epicenter": v["epicenter"],
            "depth_km": v["depth_km"],
            "affected_wilayas": v.get("affected_wilayas", []),
        }
        for key, v in SimulationService.SCENARIOS.items()
    }


@router.post(
    "/simulate",
    response_model=SimulationResult,
    summary="Run Monte Carlo loss simulation",
    description=(
        "Runs 10 000 Monte Carlo scenarios for the requested earthquake event "
        "and returns portfolio loss statistics (VaR, PML) plus a per-commune breakdown."
    ),
)
def simulate(body: SimulationRequest):
    """
    Trigger a full Monte Carlo earthquake loss simulation.

    **Preset scenarios**: `boumerdes_2003` and `el_asnam_1980` are pre-configured
    with historically calibrated parameters.

    **Custom scenario**: set `scenario=custom` and provide `magnitude`,
    `epicenter_lat`, `epicenter_lon`.
    """
    # Validate custom scenario
    if body.scenario == "custom":
        if body.magnitude is None or body.epicenter_lat is None or body.epicenter_lon is None:
            raise HTTPException(
                status_code=422,
                detail="Custom scenario requires magnitude, epicenter_lat, and epicenter_lon.",
            )
    elif body.scenario not in SimulationService.SCENARIOS:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown scenario '{body.scenario}'. "
                   f"Valid options: {list(SimulationService.SCENARIOS.keys()) + ['custom']}",
        )

    request_dict = body.model_dump(exclude_none=True)

    t_start = time.time()
    try:
        portfolio = _get_portfolio()
        result = _service.run(request_dict, portfolio)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Simulation error: {exc}") from exc

    elapsed = time.time() - t_start

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    # Attach timing
    result["elapsed_seconds"] = round(elapsed, 2)
    return result


# ── Standalone dev server ─────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    from fastapi import FastAPI

    app = FastAPI(title="RASED Monte Carlo API", version="1.0.0")
    app.include_router(router, prefix="/api/v1")

    print("Starting standalone Monte Carlo API server…")
    print("  Docs: http://localhost:8001/docs")
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
