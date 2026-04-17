/**
 * @fileoverview policies API — typed functions for policy CRUD + bulk import endpoints.
 * Corresponds to backend router: routers/policies.py — prefix: /api/policies
 */
import apiClient from './client'
import { toNumber } from '../utils/format'

const RISK_BY_ZONE = {
  '0': { score: 10, tier: 'LOW' },
  I: { score: 25, tier: 'LOW' },
  IIa: { score: 45, tier: 'MEDIUM' },
  IIb: { score: 65, tier: 'HIGH' },
  III: { score: 85, tier: 'HIGH' },
}

function normalizePolicy(item) {
  const zoneRisk = RISK_BY_ZONE[item.zone_sismique] ?? { score: 40, tier: 'MEDIUM' }

  return {
    ...item,
    id: item.id,
    wilaya_code: item.code_wilaya,
    commune_name: item.commune,
    valeur_assuree: toNumber(item.capital_assure),
    capital_assure: toNumber(item.capital_assure),
    prime_nette: toNumber(item.prime_nette),
    risk_score: zoneRisk.score,
    risk_tier: zoneRisk.tier,
    year: item.policy_year,
  }
}

function unsupported(message) {
  return Promise.reject(new Error(message))
}

export const policiesAPI = {
  /**
   * GET /api/policies
   * Filterable + paginated portfolio list.
   * @param {import('../types/policy').PolicyFilters} params
   * @returns {Promise<{ items: import('../types/policy').Policy[], total: number, page: number }>}
   */
  getAll: (params = {}) =>
    apiClient
      .get('/api/policies', {
        params: {
          page: params.page,
          size: params.size,
          policy_year: params.policy_year ?? params.year,
          code_wilaya: params.code_wilaya ?? params.wilaya_code,
          zone_sismique: params.zone_sismique ?? params.zone,
          type_risque: params.type_risque,
          commune: params.commune,
          search: params.search,
        },
      })
      .then((r) => ({
        ...r.data,
        items: (r.data.items ?? []).map(normalizePolicy),
      })),

  /**
   * GET /api/policies/{id}
   * @param {string} id
   * @returns {Promise<import('../types/policy').Policy>}
   */
  getById: (id) =>
    apiClient.get(`/api/policies/${id}`).then((r) => normalizePolicy(r.data)),

  /**
   * GET /api/policies/summary
   * @returns {Promise<{ total_policies: number, total_capital_assure: number, total_prime_nette: number, by_zone: object[], by_year: object[] }>}
   */
  getSummary: () =>
    apiClient.get('/api/policies/summary').then((r) => ({
      ...r.data,
      total_capital_assure: toNumber(r.data.total_capital_assure),
      total_prime_nette: toNumber(r.data.total_prime_nette),
      by_zone: (r.data.by_zone ?? []).map((row) => ({
        ...row,
        capital_assure: toNumber(row.capital_assure),
        prime_nette: toNumber(row.prime_nette),
      })),
      by_year: (r.data.by_year ?? []).map((row) => ({
        ...row,
        capital_assure: toNumber(row.capital_assure),
        prime_nette: toNumber(row.prime_nette),
      })),
    })),

  /**
   * POST /api/policies
   * Creates a policy and runs the full enrichment pipeline:
   *   geo_service → zone + coords
   *   ml_service  → risk_score + risk_tier
   *   simulation_service → premium_gap_pct
   * @param {import('../types/policy').CreatePolicyDTO} data
   * @returns {Promise<import('../types/policy').Policy>}
   */
  create: () =>
    unsupported("Le backend actuel n'expose pas la création de polices."),

  /**
   * PUT /api/policies/{id}
   * @param {string} id
   * @param {Partial<import('../types/policy').CreatePolicyDTO>} data
   * @returns {Promise<import('../types/policy').Policy>}
   */
  update: () =>
    unsupported("Le backend actuel n'expose pas la modification de polices."),

  /**
   * DELETE /api/policies/{id}
   * @param {string} id
   * @returns {Promise<{ success: boolean }>}
   */
  remove: () =>
    unsupported("Le backend actuel n'expose pas la suppression de polices."),

  /**
   * GET /api/policies/{id}/recommendations
   * Inline recommendations for a specific policy row click.
   * @param {string} id
   * @returns {Promise<import('../api/recommendations').Recommendation[]>}
   */
  getRecommendations: (id) =>
    unsupported("Le backend actuel n'expose pas les recommandations par police."),

  /**
   * POST /api/policies/bulk-import
   * CSV upload — returns import summary.
   * @param {File} csvFile
   * @returns {Promise<{ imported: number, failed: number, errors: string[] }>}
   */
  bulkImport: (csvFile) => {
    return unsupported("Le backend actuel n'expose pas l'import CSV.")
  },
}
