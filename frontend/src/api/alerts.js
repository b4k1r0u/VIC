/**
 * @fileoverview alerts API — typed functions for seismic alert REST endpoints.
 * Corresponds to backend router: routers/alerts.py — prefix: /api/alerts
 * (Note: real-time alerts come via WebSocket — see hooks/useSeismicAlerts.js)
 */
import apiClient from './client'

export const alertsAPI = {
  /**
   * GET /api/alerts
   * @param {{ limit?: number, min_magnitude?: number }} params
   * @returns {Promise<import('../types/alert').SeismicAlert[]>}
   */
  getAll: (params = {}) =>
    apiClient.get('/api/alerts', { params }).then((r) => r.data),

  /**
   * GET /api/alerts/{id}
   * @param {string} id
   * @returns {Promise<import('../types/alert').SeismicAlert>}
   */
  getById: (id) => apiClient.get(`/api/alerts/${id}`).then((r) => r.data),

  /**
   * POST /api/alerts/test  (dev only)
   * Trigger a fake seismic alert — useful for testing the WebSocket pipeline.
   * @param {{ magnitude: number, lat: number, lon: number }} params
   * @returns {Promise<import('../types/alert').SeismicAlert>}
   */
  triggerTest: (params) =>
    apiClient.post('/api/alerts/test', params).then((r) => r.data),
}
