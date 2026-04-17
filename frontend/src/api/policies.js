/**
 * @fileoverview policies API — typed functions for policy CRUD + bulk import endpoints.
 * Corresponds to backend router: routers/policies.py — prefix: /api/policies
 */
import apiClient from './client'

export const policiesAPI = {
  /**
   * GET /api/policies
   * Filterable + paginated portfolio list.
   * @param {import('../types/policy').PolicyFilters} params
   * @returns {Promise<{ items: import('../types/policy').Policy[], total: number, page: number }>}
   */
  getAll: (params = {}) =>
    apiClient.get('/api/policies', { params }).then((r) => r.data),

  /**
   * GET /api/policies/{id}
   * @param {string} id
   * @returns {Promise<import('../types/policy').Policy>}
   */
  getById: (id) => apiClient.get(`/api/policies/${id}`).then((r) => r.data),

  /**
   * POST /api/policies
   * Creates a policy and runs the full enrichment pipeline:
   *   geo_service → zone + coords
   *   ml_service  → risk_score + risk_tier
   *   simulation_service → premium_gap_pct
   * @param {import('../types/policy').CreatePolicyDTO} data
   * @returns {Promise<import('../types/policy').Policy>}
   */
  create: (data) => apiClient.post('/api/policies', data).then((r) => r.data),

  /**
   * PUT /api/policies/{id}
   * @param {string} id
   * @param {Partial<import('../types/policy').CreatePolicyDTO>} data
   * @returns {Promise<import('../types/policy').Policy>}
   */
  update: (id, data) => apiClient.put(`/api/policies/${id}`, data).then((r) => r.data),

  /**
   * DELETE /api/policies/{id}
   * @param {string} id
   * @returns {Promise<{ success: boolean }>}
   */
  remove: (id) => apiClient.delete(`/api/policies/${id}`).then((r) => r.data),

  /**
   * GET /api/policies/{id}/recommendations
   * Inline recommendations for a specific policy row click.
   * @param {string} id
   * @returns {Promise<import('../api/recommendations').Recommendation[]>}
   */
  getRecommendations: (id) =>
    apiClient.get(`/api/policies/${id}/recommendations`).then((r) => r.data),

  /**
   * POST /api/policies/bulk-import
   * CSV upload — returns import summary.
   * @param {File} csvFile
   * @returns {Promise<{ imported: number, failed: number, errors: string[] }>}
   */
  bulkImport: (csvFile) => {
    const form = new FormData()
    form.append('csv_file', csvFile)
    return apiClient
      .post('/api/policies/bulk-import', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
}
