/**
 * @fileoverview simulation API — typed functions for Monte Carlo simulation endpoints.
 * Corresponds to backend router: routers/simulation.py — prefix: /api/simulation
 */
import apiClient from './client'

export const simulationAPI = {
  /**
   * GET /api/simulation/scenarios
   * @returns {Promise<import('../types/simulation').ScenarioMeta[]>}
   */
  getScenarios: () => apiClient.get('/api/simulation/scenarios').then((r) => r.data),

  /**
   * POST /api/simulation/run
   * Runs synchronously for hackathon (10,000 Monte Carlo iterations).
   * @param {import('../types/simulation').SimulationRequest} params
   * @returns {Promise<import('../types/simulation').SimulationResult>}
   */
  runScenario: (params) =>
    apiClient.post('/api/simulation/run', params).then((r) => r.data),

  /**
   * GET /api/simulation/results
   * @param {{ limit?: number, scope?: string, triggered_by?: string }} params
   * @returns {Promise<import('../types/simulation').SimulationResult[]>}
   */
  getResults: (params = {}) =>
    apiClient.get('/api/simulation/results', { params }).then((r) => r.data),

  /**
   * GET /api/simulation/results/{id}
   * @param {string} id
   * @returns {Promise<import('../types/simulation').SimulationResult>}
   */
  getResult: (id) => apiClient.get(`/api/simulation/results/${id}`).then((r) => r.data),
}
