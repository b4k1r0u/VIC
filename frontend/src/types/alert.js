/**
 * @fileoverview Seismic alert type definitions for RASED.
 */

/**
 * @typedef {Object} SeismicAlert
 * @property {string} id
 * @property {string} usgs_id
 * @property {number} magnitude
 * @property {number} depth_km
 * @property {number} lat
 * @property {number} lon
 * @property {string} location_desc
 * @property {string} event_time          - ISO 8601
 * @property {string} nearest_wilaya
 * @property {string} nearest_commune
 * @property {string} rpa_zone
 * @property {'LOW'|'MODERATE'|'HIGH'|'CRITICAL'} severity
 * @property {string} [simulation_id]
 */

/**
 * Alert severity classification by magnitude:
 * M < 4.0    → not shown
 * M 4.0–4.9  → LOW      (banner only)
 * M 5.0–5.9  → MODERATE (banner + auto-simulation)
 * M 6.0–6.9  → HIGH     (banner + auto-simulation + recommendation refresh)
 * M ≥ 7.0    → CRITICAL (all above + highlight Zone III policies)
 */
export const SEVERITY_THRESHOLDS = {
  LOW:      { min: 4.0, max: 4.9 },
  MODERATE: { min: 5.0, max: 5.9 },
  HIGH:     { min: 6.0, max: 6.9 },
  CRITICAL: { min: 7.0, max: Infinity },
}

export const SEVERITY_COLORS = {
  LOW:      '#eab308',
  MODERATE: '#f97316',
  HIGH:     '#ef4444',
  CRITICAL: '#dc2626',
}

/**
 * @param {number} magnitude
 * @returns {'LOW'|'MODERATE'|'HIGH'|'CRITICAL'|null}
 */
export function getSeverity(magnitude) {
  if (magnitude >= 7.0) return 'CRITICAL'
  if (magnitude >= 6.0) return 'HIGH'
  if (magnitude >= 5.0) return 'MODERATE'
  if (magnitude >= 4.0) return 'LOW'
  return null
}
