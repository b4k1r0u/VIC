#!/usr/bin/env python3
"""
run_simulation.py — Standalone CLI test for the Monte Carlo loss simulation.

Usage:
    python run_simulation.py --scenario boumerdes_2003
    python run_simulation.py --scenario el_asnam_1980
    python run_simulation.py --scenario custom --magnitude 6.0 --lat 36.7 --lon 3.05
    python run_simulation.py --scenario boumerdes_2003 --scope wilaya --scope_code 35
    python run_simulation.py --help

Output: pretty-printed JSON summary of the simulation results.
"""
import argparse
import json
import sys
import os
import time

# ── Make the package importable when run directly from its directory ──────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from simulation_service import SimulationService


def fmt_dzd(value: float) -> str:
    """Format a DZD value in billions / millions for readability."""
    if abs(value) >= 1e9:
        return f"{value / 1e9:.3f} Mrd DZD"
    if abs(value) >= 1e6:
        return f"{value / 1e6:.2f} M DZD"
    return f"{value:,.0f} DZD"


def print_summary(result: dict) -> None:
    """Print a human-readable summary of the simulation result."""
    print("\n" + "=" * 65)
    print(f"  SCENARIO : {result['scenario_name']}")
    print("=" * 65)
    print(f"  Policies affected   : {result['affected_policies']:,}")
    print(f"  Simulations run     : {result['n_simulations']:,}")
    print()
    print("  ── GROSS LOSS (before reinsurance) ──────────────────────")
    print(f"  Expected loss       : {fmt_dzd(result['expected_gross_loss'])}")
    print(f"  VaR 95%             : {fmt_dzd(result['gross_var_95'])}")
    print(f"  VaR 99%             : {fmt_dzd(result['gross_var_99'])}")
    print()
    print("  ── NET LOSS (after 70 % cession to reinsurer) ───────────")
    print(f"  Expected loss       : {fmt_dzd(result['expected_net_loss'])}")
    print(f"  VaR 95%             : {fmt_dzd(result['var_95'])}")
    print(f"  VaR 99%             : {fmt_dzd(result['var_99'])}")
    print(f"  PML 99.9%           : {fmt_dzd(result['pml_999'])}")
    print()
    communes = result.get("per_commune_json", [])
    if communes:
        top5 = sorted(communes, key=lambda c: c["expected_loss"], reverse=True)[:5]
        print("  ── TOP 5 COMMUNES BY EXPECTED LOSS ──────────────────────")
        for r in top5:
            print(
                f"  {r['commune_name']:<28} {fmt_dzd(r['expected_loss']):>20}"
                f"  ({r['policy_count']:,} polices)"
            )
    print("=" * 65 + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run the RASED Monte Carlo earthquake loss simulation.",
        formatter_class=argparse.RawTextHelpFormatter,
    )
    parser.add_argument(
        "--scenario",
        choices=["boumerdes_2003", "el_asnam_1980", "custom"],
        default="boumerdes_2003",
        help=(
            "Preset scenario name, or 'custom' to define your own.\n"
            "  boumerdes_2003  — M6.8 replay of the 2003 Boumerdès event\n"
            "  el_asnam_1980   — M7.3 replay of the 1980 El Asnam event\n"
            "  custom          — requires --magnitude, --lat, --lon"
        ),
    )
    parser.add_argument("--magnitude", type=float, default=6.0, help="Magnitude (for custom scenario)")
    parser.add_argument("--lat",       type=float, default=36.7, help="Epicenter latitude (for custom)")
    parser.add_argument("--lon",       type=float, default=3.05, help="Epicenter longitude (for custom)")
    parser.add_argument("--depth",     type=float, default=10.0, help="Focal depth in km (default: 10)")
    parser.add_argument("--scope",     choices=["wilaya", "commune"], help="Restrict to wilaya or commune")
    parser.add_argument("--scope_code", help="Wilaya code (e.g. '35') or commune_id when --scope is set")
    parser.add_argument("--portfolio", help="Path to portfolio_enriched.csv (optional; uses default path)")
    parser.add_argument("--json",      action="store_true", help="Output raw JSON instead of formatted summary")
    args = parser.parse_args()

    # ── Build request dict ────────────────────────────────────────────────────
    request: dict = {"scenario": args.scenario}
    if args.scenario == "custom":
        request.update({
            "magnitude":    args.magnitude,
            "epicenter_lat": args.lat,
            "epicenter_lon": args.lon,
            "depth_km":     args.depth,
        })
    if args.scope:
        request["scope"] = args.scope
        request["scope_code"] = args.scope_code

    # ── Load portfolio ────────────────────────────────────────────────────────
    print(f"Loading portfolio…", end=" ", flush=True)
    t0 = time.time()
    try:
        portfolio = SimulationService.load_portfolio(args.portfolio)
    except Exception as e:
        print(f"\n[ERROR] Failed to load portfolio: {e}", file=sys.stderr)
        sys.exit(1)
    print(f"done ({time.time() - t0:.1f}s)")

    # ── Run simulation ────────────────────────────────────────────────────────
    print(f"Running simulation (scenario='{args.scenario}')…", end=" ", flush=True)
    t1 = time.time()
    service = SimulationService()
    result = service.run(request, portfolio)
    print(f"done ({time.time() - t1:.1f}s)")

    if "error" in result:
        print(f"\n[ERROR] {result['error']}", file=sys.stderr)
        sys.exit(1)

    # ── Output ────────────────────────────────────────────────────────────────
    if args.json:
        # Slim down the distribution array for readability
        result_out = {k: v for k, v in result.items() if k != "distribution_json"}
        result_out["distribution_sample_size"] = len(result.get("distribution_json", []))
        print(json.dumps(result_out, indent=2, ensure_ascii=False))
    else:
        print_summary(result)


if __name__ == "__main__":
    main()
