/**
 * @fileoverview Policy type definitions for RASED portfolio management.
 */

/**
 * @typedef {Object} Policy
 * @property {string} id
 * @property {string} numero_police
 * @property {string} date_effet
 * @property {string} date_expiration
 * @property {string} type_risque
 * @property {string} [construction_type]
 * @property {string} wilaya_code
 * @property {number} commune_id
 * @property {string} commune_name
 * @property {string} [adresse]
 * @property {number} [lat]
 * @property {number} [lon]
 * @property {number} valeur_assuree
 * @property {number} prime_nette
 * @property {number} prime_rate
 * @property {string} zone_sismique
 * @property {number} risk_score
 * @property {'LOW'|'MEDIUM'|'HIGH'} risk_tier
 * @property {number} premium_gap_pct
 * @property {number} year
 */

/**
 * @typedef {Object} CreatePolicyDTO
 * @property {string} numero_police
 * @property {string} date_effet
 * @property {string} date_expiration
 * @property {string} type_risque
 * @property {string} [construction_type]
 * @property {string} wilaya_code
 * @property {string} commune_name
 * @property {string} [adresse]
 * @property {number} valeur_assuree
 * @property {number} prime_nette
 */

/**
 * @typedef {Object} PolicyFilters
 * @property {string} [zone]
 * @property {string} [wilaya_code]
 * @property {string} [type_risque]
 * @property {'LOW'|'MEDIUM'|'HIGH'} [risk_tier]
 * @property {number} [year]
 * @property {number} [min_value]
 * @property {number} [max_value]
 * @property {string} [search]
 * @property {number} [page]
 * @property {number} [size]
 */

export const TYPE_RISQUE_OPTIONS = [
  '1 - Bien Immobilier',
  '2 - Installation Commerciale',
  '3 - Installation Industrielle',
  '4 - Véhicule',
  '5 - Autre',
]

export const CONSTRUCTION_TYPE_OPTIONS = [
  'Maçonnerie chaînée',
  'Béton armé',
  'Maçonnerie non chaînée',
  'Métal',
  'Bois',
]

export const RISK_TIER_META = {
  LOW:    { label: 'Faible',  color: '#22c55e', bg: '#dcfce7' },
  MEDIUM: { label: 'Moyen',   color: '#eab308', bg: '#fef9c3' },
  HIGH:   { label: 'Élevé',   color: '#ef4444', bg: '#fee2e2' },
}
