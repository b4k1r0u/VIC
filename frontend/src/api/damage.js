/**
 * @fileoverview damage API — typed functions for parametric insurance / damage AI endpoints.
 * Corresponds to backend router: routers/damage.py — prefix: /api/damage
 */
import apiClient from './client'

/**
 * @typedef {Object} DamageEstimationResult
 * @property {0|1|2|3} damage_class
 * @property {string} damage_label       - "No Damage" | "Minor Damage" | "Major Damage" | "Destroyed"
 * @property {number} loss_percentage    - 0.0 to 1.0
 * @property {number} loss_per_km2_dzd
 * @property {number} total_loss_dzd
 * @property {number} confidence         - 0.0 = mock / simulated
 * @property {string} heatmap_url
 * @property {number} affected_area_km2
 * @property {boolean} is_mock
 * @property {{ [label: string]: number }} breakdown
 */

export const damageAPI = {
  /**
   * POST /api/damage/estimate
   * Multipart form upload — real image input for CNN model.
   * @param {File} imageFile
   * @param {{ image_type: string, area_km2: number, construction_type: string, zone_sismique: string, wilaya_code?: string, commune_id?: number }} meta
   * @returns {Promise<DamageEstimationResult>}
   */
  estimate: (imageFile, meta) => {
    const form = new FormData()
    form.append('image', imageFile)
    Object.entries(meta).forEach(([k, v]) => v != null && form.append(k, String(v)))
    return apiClient
      .post('/api/damage/estimate', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  /**
   * POST /api/damage/estimate-mock
   * No image required — uses lookup table based on zone + type + magnitude.
   * Clearly labeled as "Simulated Estimate" (confidence = 0) in the UI.
   * @param {{ zone_sismique: string, construction_type: string, magnitude: number, area_km2: number }} params
   * @returns {Promise<DamageEstimationResult>}
   */
  estimateMock: (params) =>
    apiClient.post('/api/damage/estimate-mock', params).then((r) => r.data),

  /**
   * GET /api/damage/assessments
   * @param {{ wilaya_code?: string, limit?: number }} params
   * @returns {Promise<DamageEstimationResult[]>}
   */
  getAssessments: (params = {}) =>
    apiClient.get('/api/damage/assessments', { params }).then((r) => r.data),
}
