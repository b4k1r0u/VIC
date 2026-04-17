/**
 * @fileoverview Geographic type definitions for RASED
 * These are JSDoc typedefs mirroring the TypeScript types in the architecture doc.
 */

/**
 * @typedef {Object} CommuneMapFeature
 * @property {string} commune_code
 * @property {string} commune_name
 * @property {string} wilaya_code
 * @property {'0'|'I'|'IIa'|'IIb'|'III'} zone_sismique
 * @property {number} lat
 * @property {number} lon
 * @property {number} total_exposure
 * @property {number} policy_count
 * @property {number} avg_risk_score
 * @property {number} net_retention
 * @property {number} hotspot_score
 */

/**
 * @typedef {Object} PortfolioKPIs
 * @property {number} total_exposure
 * @property {number} total_policies
 * @property {number} net_retention
 * @property {{ zone: string, exposure: number, policy_count: number, pct: number }[]} by_zone
 * @property {HotspotData} top_hotspot
 */

/**
 * @typedef {Object} HotspotData
 * @property {string} commune_name
 * @property {string} wilaya_code
 * @property {string} zone_sismique
 * @property {number} hotspot_score
 * @property {number} total_exposure
 * @property {number} policy_count
 */

/**
 * @typedef {Object} WilayaBasic
 * @property {string} code
 * @property {string} name_fr
 * @property {string} zone_sismique
 */

/**
 * @typedef {Object} CommuneBasic
 * @property {number} id
 * @property {string} commune_code
 * @property {string} commune_name
 * @property {string} zone_sismique
 */

/**
 * @typedef {Object} PremiumAdequacyRow
 * @property {string} zone_sismique
 * @property {string} type_risque
 * @property {number} adequate_rate
 * @property {number} avg_actual_rate
 * @property {number} gap_pct
 */

/** @typedef {'risk'|'exposure'|'score'|'simulation'} MapLayer */

export const ZONE_COLORS = {
  '0':   '#22c55e',   // green
  'I':   '#84cc16',   // lime
  'IIa': '#eab308',   // yellow
  'IIb': '#f97316',   // orange
  'III': '#dc2626',   // red
}

export const ZONE_WEIGHTS = {
  '0': 1, 'I': 2, 'IIa': 3, 'IIb': 4, 'III': 5,
}
