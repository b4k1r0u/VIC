/**
 * @fileoverview simulation API — typed functions for Monte Carlo simulation endpoints.
 * Corresponds to backend router: routers/simulation.py — prefix: /api/simulation
 */
import apiClient from './client'
import { toNumber } from '../utils/format'

const BASE_PATHS = ['/api/v1/simulation', '/api/simulation']
const SIMULATION_TIMEOUT_MS = 120000

function fallbackSimulationId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `sim-${Date.now()}`
}

function normalizeCommuneLoss(item) {
  if (!item) return null

  return {
    ...item,
    expected_loss: toNumber(item.expected_loss),
    affected_policies: toNumber(item.affected_policies ?? item.policy_count),
    policy_count: toNumber(item.policy_count),
    total_exposure: toNumber(item.total_exposure),
    lat: toNumber(item.lat),
    lon: toNumber(item.lon),
  }
}

function normalizeSimulationResult(result, request = {}) {
  if (!result || typeof result !== 'object') return result

  const payload =
    result.monte_carlo && typeof result.monte_carlo === 'object'
      ? {
          ...result.monte_carlo,
          executive_summary: result.executive_summary,
          confidence: result.confidence,
          recommendations: result.recommendations,
          context_sources: result.context_sources,
          retrieved_documents: result.retrieved_documents,
          generation_mode: result.generation_mode,
          llm_used: result.llm_used,
          llm_error: result.llm_error,
        }
      : result

  if (payload.error) {
    const error = new Error(payload.error)
    error.response = { data: payload }
    throw error
  }

  return {
    ...payload,
    id: payload.id ?? fallbackSimulationId(),
    scenario_name: payload.scenario_name ?? request.scenario ?? 'Simulation',
    scope: payload.scope ?? request.scope ?? 'national',
    scope_code: payload.scope_code ?? request.scope_code ?? null,
    created_at: payload.created_at ?? new Date().toISOString(),
    affected_policies: toNumber(payload.affected_policies),
    expected_loss: toNumber(payload.expected_loss),
    expected_gross_loss: toNumber(payload.expected_gross_loss),
    gross_var_95: toNumber(payload.gross_var_95),
    gross_var_99: toNumber(payload.gross_var_99),
    expected_net_loss: toNumber(payload.expected_net_loss),
    var_95: toNumber(payload.var_95),
    var_99: toNumber(payload.var_99),
    pml_999: toNumber(payload.pml_999),
    worst_case_loss: toNumber(payload.worst_case_loss),
    elapsed_seconds: toNumber(payload.elapsed_seconds),
    distribution_json: (payload.distribution_json ?? []).map((value) => toNumber(value)),
    per_commune_json: (payload.per_commune_json ?? [])
      .map(normalizeCommuneLoss)
      .filter(Boolean),
  }
}

async function requestWithFallback(method, path, configOrData, requestConfig = {}) {
  let lastError

  for (const basePath of BASE_PATHS) {
    try {
      if (method === 'get') {
        const response = await apiClient.get(`${basePath}${path}`, {
          ...configOrData,
          ...requestConfig,
        })
        return response.data
      }

      if (method === 'post') {
        const response = await apiClient.post(`${basePath}${path}`, configOrData, requestConfig)
        return response.data
      }
    } catch (error) {
      lastError = error
      if (error?.response?.status && error.response.status !== 404) {
        throw error
      }
    }
  }

  throw lastError
}

export const simulationAPI = {
  /**
   * GET /api/simulation/scenarios
   * @returns {Promise<import('../types/simulation').ScenarioMeta[]>}
   */
  getScenarios: () => requestWithFallback('get', '/scenarios'),

  /**
   * POST /api/simulation/run
   * Runs synchronously for hackathon (10,000 Monte Carlo iterations).
   * @param {import('../types/simulation').SimulationRequest} params
   * @returns {Promise<import('../types/simulation').SimulationResult>}
   */
  runScenario: async (params) => {
    const data = await requestWithFallback('post', '/run', params, { timeout: SIMULATION_TIMEOUT_MS })
    return normalizeSimulationResult(data, params)
  },

  /**
   * GET /api/simulation/results
   * @param {{ limit?: number, scope?: string, triggered_by?: string }} params
   * @returns {Promise<import('../types/simulation').SimulationResult[]>}
   */
  getResults: (params = {}) => requestWithFallback('get', '/results', { params }),

  /**
   * GET /api/simulation/results/{id}
   * @param {string} id
   * @returns {Promise<import('../types/simulation').SimulationResult>}
   */
  getResult: async (id) => {
    const data = await requestWithFallback('get', `/results/${id}`)
    return normalizeSimulationResult(data)
  },
}
