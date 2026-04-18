/**
 * @fileoverview damage API — typed functions for parametric insurance / damage AI endpoints.
 * Corresponds to backend router: routers/damage.py — prefix: /api/damage
 */
import apiClient, { API_BASE } from './client'
import { toNumber } from '../utils/format'

const BASE_PATHS = ['/api/v1/damage', '/api/damage']

const CONSTRUCTION_TYPE_MAP = {
  'Béton armé': 'Beton arme',
  'Maçonnerie chaînée': 'Maconnerie chainee',
  'Maçonnerie non chaînée': 'Maconnerie non chainee',
  'Métal': 'Metal',
}

function normalizeConstructionType(value) {
  return CONSTRUCTION_TYPE_MAP[value] ?? value
}

function absoluteUrl(value) {
  if (!value) return null
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  return `${API_BASE}${value}`
}

function normalizeDamageAssessment(item) {
  if (!item) return null

  return {
    ...item,
    loss_percentage: toNumber(item.loss_percentage),
    loss_per_km2_dzd: toNumber(item.loss_per_km2_dzd),
    total_loss_dzd: toNumber(item.total_loss_dzd),
    confidence: toNumber(item.confidence),
    affected_area_km2: toNumber(item.affected_area_km2),
    heatmap_url: absoluteUrl(item.heatmap_url),
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

function normalizeDamageResponse(data) {
  const assessment = normalizeDamageAssessment(data.damage_assessment ?? data)

  return {
    ...data,
    damage_assessment: assessment,
    assessment,
    confidence: data.confidence == null ? assessment?.confidence ?? null : toNumber(data.confidence),
  }
}

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
  getHealth: () => requestWithFallback('get', '/health'),

  /**
   * POST /api/damage/estimate
   * Multipart form upload — real image input for CNN model.
   * @param {File} imageFile
   * @param {{ image_type: string, area_km2: number, construction_type: string, zone_sismique: string, wilaya_code?: string, commune_name?: string, query?: string, top_k?: number }} meta
   */
  estimate: (imageFile, meta) => {
    const form = new FormData()
    form.append('image', imageFile)
    Object.entries({
      ...meta,
      construction_type: normalizeConstructionType(meta?.construction_type),
    }).forEach(([key, value]) => value != null && form.append(key, String(value)))

    return requestWithFallback('post', '/estimate', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(normalizeDamageResponse)
  },
}
