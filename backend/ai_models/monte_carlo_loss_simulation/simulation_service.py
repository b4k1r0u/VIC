# services/simulation_service.py
import numpy as np
import pandas as pd
from scipy.stats import beta as beta_dist
from services.simulation_service.vulnerability import compute_damage_ratio

class SimulationService:

    # Scenario definitions with realistic physics
    SCENARIOS = {
        "boumerdes_2003": {
            "label":          "Boumerdès 2003 — M6.8",
            "epicenter":      (36.83, 3.65),
            "magnitude":      6.8,
            "depth_km":       10.0,
            "affected_wilayas": ["35", "16", "15", "09", "42", "26"],
            # Attenuation: how PGA drops with distance (Akkar & Bommer 2010)
            "pga_epicenter":  0.45,   # g at epicenter — calibrated to 2003 event
        },
        "el_asnam_1980": {
            "label":          "El Asnam 1980 — M7.3",
            "epicenter":      (36.14, 1.41),
            "magnitude":      7.3,
            "depth_km":       10.0,
            "affected_wilayas": ["02", "14", "27", "38", "45", "22"],
            "pga_epicenter":  0.65,   # g — larger event
        },
    }

    def run(self, request: dict, portfolio_df: pd.DataFrame) -> dict:
        """
        Full Monte Carlo simulation.

        Steps:
        1. Select scenario (or use custom params)
        2. Filter portfolio to affected area
        3. For each policy: compute site PGA using attenuation
        4. For each policy: get vulnerability (MDR, sigma) from fragility curves
        5. Monte Carlo: sample 10,000 loss scenarios
        6. Aggregate statistics
        7. Return results + per-commune breakdown
        """
        # ── Step 1: Scenario setup ───────────────────────────────────
        scenario_name = request.get("scenario", "boumerdes_2003")

        if scenario_name == "custom":
            scenario = {
                "label":          f"Custom M{request['magnitude']}",
                "epicenter":      (request["epicenter_lat"], request["epicenter_lon"]),
                "magnitude":      request["magnitude"],
                "depth_km":       request.get("depth_km", 10.0),
                "affected_wilayas": None,   # derive from distance
                "pga_epicenter":  self._magnitude_to_pga(request["magnitude"]),
            }
        else:
            scenario = self.SCENARIOS[scenario_name]

        # ── Step 2: Filter affected policies ────────────────────────
        affected = self._get_affected_policies(
            portfolio_df, scenario, request.get("scope"), request.get("scope_code")
        )

        if len(affected) == 0:
            return {"error": "No policies in affected area", "affected_policies": 0}

        # ── Step 3: Compute site PGA for each policy ─────────────────
        affected = affected.copy()
        affected["site_pga"] = affected.apply(
            lambda row: self._compute_site_pga(
                row["lat"], row["lon"],
                scenario["epicenter"],
                scenario["magnitude"],
                scenario["depth_km"],
            ),
            axis=1
        )

        # ── Step 4: Compute mean damage ratio per policy ─────────────
        affected["mdr"], affected["mdr_sigma"] = zip(*affected.apply(
            lambda row: compute_damage_ratio(
                row["site_pga"],
                row.get("construction_type", "Inconnu")
            ),
            axis=1
        ))

        # ── Step 5: Monte Carlo — 10,000 iterations ──────────────────
        N_SIMS = 10_000
        rng = np.random.default_rng(seed=42)

        # Vectorized Beta sampling for all policies × all simulations
        # Beta(α, β) parameterized from mean and variance of damage ratio
        alpha, beta_param = self._moments_to_beta_params(
            affected["mdr"].values,
            affected["mdr_sigma"].values
        )

        # Shape: (N_policies, N_simulations)
        damage_samples = np.zeros((len(affected), N_SIMS))
        for i, (a, b) in enumerate(zip(alpha, beta_param)):
            if a <= 0 or b <= 0:
                damage_samples[i] = affected.iloc[i]["mdr"]
            else:
                damage_samples[i] = rng.beta(a, b, size=N_SIMS)

        # Policy loss per simulation: damage_ratio × insured_value
        insured_values = affected["VALEUR_ASSURÉE"].values.reshape(-1, 1)
        policy_losses = damage_samples * insured_values  # (N_policies, N_sims)

        # Portfolio gross loss per simulation: Σ across policies
        gross_losses = policy_losses.sum(axis=0)  # (N_sims,)

        # Net loss after reinsurance (company retains 30%)
        RETENTION = 0.30
        net_losses = gross_losses * RETENTION

        # ── Step 6: Statistics ───────────────────────────────────────
        result = {
            "scenario_name":       scenario["label"],
            "affected_policies":   len(affected),
            "n_simulations":       N_SIMS,

            # Gross (before reinsurance)
            "expected_gross_loss": float(gross_losses.mean()),
            "gross_var_95":        float(np.percentile(gross_losses, 95)),
            "gross_var_99":        float(np.percentile(gross_losses, 99)),

            # Net (after 70% cession)
            "expected_net_loss":   float(net_losses.mean()),
            "var_95":              float(np.percentile(net_losses, 95)),
            "var_99":              float(np.percentile(net_losses, 99)),
            "pml_999":             float(np.percentile(net_losses, 99.9)),

            # Distribution for histogram chart (sampled to 500 points)
            "distribution_json":   (net_losses[::20]).tolist(),

            # Per commune breakdown (for map overlay)
            "per_commune_json":    self._aggregate_by_commune(
                                       affected, policy_losses.mean(axis=1)
                                   ),
        }

        return result

    def _compute_site_pga(
        self,
        site_lat: float, site_lon: float,
        epicenter: tuple, magnitude: float, depth_km: float
    ) -> float:
        """
        Ground Motion Prediction using Akkar & Bommer 2010 GMPE (simplified).
        Returns PGA in g units.

        Full equation: ln(PGA) = b1 + b2*M + b3*M² + (b4+b5*M)*ln(R_eff) + b6*S + ε
        Where R_eff = √(R_jb² + h²), R_jb = Joyner-Boore distance
        """
        # Distance from epicenter
        R_epi = self._haversine_km(site_lat, site_lon, epicenter[0], epicenter[1])
        R_eff = np.sqrt(R_epi**2 + depth_km**2)  # effective distance

        # Akkar & Bommer 2010 coefficients for PGA (simplified form)
        b1, b2, b3 = 1.647, 0.767, -0.074
        b4, b5     = -2.369, 0.169
        b6         = 0.0   # no site amplification term (Vs30 handled separately)

        ln_pga = b1 + b2*magnitude + b3*magnitude**2 + (b4 + b5*magnitude)*np.log(max(R_eff, 1))

        pga_rock = np.exp(ln_pga)  # PGA on rock (g)
        pga_rock = min(pga_rock, 2.0)  # physical cap

        # Simple site amplification (ratio Vs30_rock=760 / Vs30_site)
        # For Zone III (Mitidja plain): factor ~1.3 to 1.8
        # For rock sites: factor = 1.0
        site_factor = 1.3 if R_epi < 50 else 1.0
        return float(pga_rock * site_factor)

    def _get_affected_policies(
        self, portfolio: pd.DataFrame, scenario: dict,
        scope: str | None, scope_code: str | None
    ) -> pd.DataFrame:
        """Filter portfolio to policies in the affected zone."""

        if scenario.get("affected_wilayas"):
            mask = portfolio["wilaya_code"].isin(scenario["affected_wilayas"])
        else:
            # Distance-based filtering for custom scenarios
            epic = scenario["epicenter"]
            mag  = scenario["magnitude"]
            radius_km = 30 * np.exp(0.5 * mag)  # empirical radius-magnitude scaling
            distances = portfolio.apply(
                lambda r: self._haversine_km(r.get("lat", 0), r.get("lon", 0), epic[0], epic[1]),
                axis=1
            )
            mask = distances <= radius_km

        affected = portfolio[mask].copy()

        # Further scope restriction
        if scope == "wilaya" and scope_code:
            affected = affected[affected["wilaya_code"] == scope_code]
        elif scope == "commune" and scope_code:
            affected = affected[affected["commune_id"] == int(scope_code)]

        return affected

    @staticmethod
    def _haversine_km(lat1, lon1, lat2, lon2) -> float:
        """Haversine formula — great-circle distance in km."""
        R = 6371
        dlat = np.radians(lat2 - lat1)
        dlon = np.radians(lon2 - lon1)
        a = np.sin(dlat/2)**2 + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon/2)**2
        return R * 2 * np.arcsin(np.sqrt(a))

    @staticmethod
    def _moments_to_beta_params(means: np.ndarray, stds: np.ndarray) -> tuple:
        """Convert mean and std to Beta distribution α, β parameters."""
        means = np.clip(means, 0.001, 0.999)
        stds  = np.clip(stds,  0.001, 0.5)

        variance = stds**2
        common   = means * (1 - means) / variance - 1
        alpha    = np.maximum(means * common, 0.1)
        beta_p   = np.maximum((1 - means) * common, 0.1)
        return alpha, beta_p

    @staticmethod
    def _magnitude_to_pga(magnitude: float) -> float:
        """Rough PGA at epicenter from magnitude (Wells & Coppersmith 1994 scaling)."""
        return min(0.15 * np.exp(0.6 * (magnitude - 5.0)), 2.0)

    @staticmethod
    def _aggregate_by_commune(affected: pd.DataFrame, mean_losses: np.ndarray) -> list:
        """Aggregate expected losses by commune for map overlay."""
        affected = affected.copy()
        affected["expected_loss"] = mean_losses
        agg = affected.groupby(["wilaya_code", "commune_name", "lat", "lon"]).agg(
            expected_loss=("expected_loss", "sum"),
            policy_count=("VALEUR_ASSURÉE", "count"),
            total_exposure=("VALEUR_ASSURÉE", "sum"),
        ).reset_index()

        return agg.to_dict(orient="records")