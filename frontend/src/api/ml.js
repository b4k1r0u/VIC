import apiClient from './client'
import { toNumber } from '../utils/format'

const BASE_PATHS = ['/api/v1/ml', '/api/ml']

const CONSTRUCTION_TYPE_MAP = {
  'Béton armé': 'Beton arme',
  'Maçonnerie chaînée': 'Maconnerie chainee',
  'Maçonnerie non chaînée': 'Maconnerie non chainee',
  'Métal': 'Metal',
}

function normalizeConstructionType(value) {
  return CONSTRUCTION_TYPE_MAP[value] ?? value
}

function normalizeScorePayload(payload = {}) {
  return {
    ...payload,
    construction_type: normalizeConstructionType(payload.construction_type),
  }
}

function normalizeScoreResult(data) {
  if (!data) return null

  return {
    ...data,
    score: toNumber(data.score),
    confidence: data.confidence == null ? null : toNumber(data.confidence),
    elapsed_ms: data.elapsed_ms == null ? null : toNumber(data.elapsed_ms),
    proba: {
      LOW: toNumber(data.proba?.LOW),
      MEDIUM: toNumber(data.proba?.MEDIUM),
      HIGH: toNumber(data.proba?.HIGH),
    },
  }
}

async function requestWithFallback(method, path, payload, config = {}) {
  let lastError

  for (const basePath of BASE_PATHS) {
    try {
      if (method === 'get') {
        const response = await apiClient.get(`${basePath}${path}`, {
          ...payload,
          ...config,
        })
        return response.data
      }

      if (method === 'post') {
        const response = await apiClient.post(`${basePath}${path}`, payload, config)
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

export const mlAPI = {
  getHealth: () => requestWithFallback('get', '/health'),

  getFeatureImportance: () =>
    requestWithFallback('get', '/feature-importance').then((data) => ({
      ...data,
      features: [...(data.features ?? [])]
        .map((item) => ({
          ...item,
          importance: toNumber(item.importance),
        }))
        .sort((a, b) => b.importance - a.importance),
    })),

  scorePolicy: (payload) =>
    requestWithFallback('post', '/score', normalizeScorePayload(payload)).then(normalizeScoreResult),

  batchScore: (policies) =>
    requestWithFallback('post', '/batch-score', {
      policies: (policies ?? []).map(normalizeScorePayload),
    }).then((data) => ({
      ...data,
      results: (data.results ?? []).map((item) => ({
        ...item,
        score: toNumber(item.score),
      })),
    })),
}
