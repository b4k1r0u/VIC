/**
 * @fileoverview geo API — typed functions for all geography endpoints.
 * Corresponds to backend router: routers/geo.py — prefix: /api/geo
 */
import axios from 'axios'
import apiClient, { API_BASE } from './client'
import { FALLBACK_COMMUNES, FALLBACK_WILAYAS } from '../data/geoFallback'
import { toNumber } from '../utils/format'

const GEO_BASE_PATHS = ['/api/v1/geo', '/api/geo']

function normalizeHotspot(item) {
  if (!item) return null

  return {
    ...item,
    total_exposure: toNumber(item.total_exposure),
    hotspot_score: toNumber(item.hotspot_score),
  }
}

function normalizeMapFeature(item) {
  return {
    ...item,
    total_exposure: toNumber(item.total_exposure),
    avg_risk_score: toNumber(item.avg_risk_score),
    net_retention: toNumber(item.net_retention),
    hotspot_score: toNumber(item.hotspot_score),
    layer_value: toNumber(item.layer_value),
  }
}

function normalizeCommuneBasic(item) {
  if (!item) return null

  return {
    ...item,
    id: item.id,
    code: item.code ?? item.commune_code ?? '',
    commune_code: item.commune_code ?? item.code ?? '',
    commune_name: item.commune_name ?? item.name ?? item.commune ?? '',
    wilaya_code: item.wilaya_code ?? '',
    wilaya_name: item.wilaya_name ?? '',
    lat: toNumber(item.lat),
    lon: toNumber(item.lon),
  }
}

function sortByCodeThenName(items) {
  return [...items].sort((a, b) =>
    String(a.code ?? a.wilaya_code ?? '').localeCompare(String(b.code ?? b.wilaya_code ?? '')) ||
    String(a.name ?? a.commune_name ?? '').localeCompare(String(b.name ?? b.commune_name ?? ''), 'fr')
  )
}

function uniqueWilayas(items) {
  const byCode = new Map()

  for (const item of items ?? []) {
    const code = String(item.code ?? '').padStart(2, '0')
    if (!code) continue

    if (!byCode.has(code)) {
      byCode.set(code, {
        ...item,
        code,
        name: item.name ?? item.name_fr ?? '',
        name_fr: item.name_fr ?? item.name ?? '',
      })
    }
  }

  return sortByCodeThenName([...byCode.values()])
}

function uniqueCommunes(items) {
  const byKey = new Map()

  for (const raw of items ?? []) {
    const item = normalizeCommuneBasic(raw)
    if (!item?.commune_name || !item?.wilaya_code) continue

    const key = `${item.wilaya_code}::${item.commune_name.trim().toUpperCase()}`
    if (!byKey.has(key)) {
      byKey.set(key, item)
    }
  }

  return [...byKey.values()].sort((a, b) =>
    String(a.wilaya_code).localeCompare(String(b.wilaya_code)) ||
    String(a.commune_name).localeCompare(String(b.commune_name), 'fr')
  )
}

function fallbackCommunes(items) {
  return uniqueCommunes(items).map((item) => ({
    ...item,
    id: null,
  }))
}

const COMMUNE_API_BASE =
  import.meta.env.VITE_COMMUNE_API_URL || API_BASE

function authHeaders() {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('rased_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function requestGeo(method, path, config = {}) {
  let lastError

  for (const basePath of GEO_BASE_PATHS) {
    try {
      if (!COMMUNE_API_BASE || COMMUNE_API_BASE === API_BASE) {
        const response = await apiClient.get(`${basePath}${path}`, config)
        return response.data
      }

      const response = await axios.get(`${COMMUNE_API_BASE}${basePath}${path}`, {
        ...config,
        headers: {
          ...authHeaders(),
          ...(config.headers ?? {}),
        },
      })
      return response.data
    } catch (error) {
      lastError = error
      if (error?.response?.status && error.response.status !== 404) {
        throw error
      }
    }
  }

  throw lastError
}

export const geoAPI = {
  /**
   * GET /api/geo/map-data?layer=risk|exposure|score|simulation
   * @param {'risk'|'exposure'|'score'|'simulation'} layer
   * @returns {Promise<{ features: import('../types/geo').CommuneMapFeature[], last_updated: string }>}
   */
  getMapData: (layer = 'risk') =>
    requestGeo('get', '/map-data', { params: { layer } }).then((data) => ({
      ...data,
      features: (data.features ?? []).map(normalizeMapFeature),
    })),

  /**
   * GET /api/geo/hotspots?top_n=10
   * @param {number} topN
   * @returns {Promise<import('../types/geo').HotspotData[]>}
   */
  getHotspots: (topN = 10) =>
    requestGeo('get', '/hotspots', { params: { top_n: topN } })
      .then((data) => (data ?? []).map(normalizeHotspot)),

  /**
   * GET /api/geo/kpis
   * @returns {Promise<import('../types/geo').PortfolioKPIs>}
   */
  getKPIs: () =>
    requestGeo('get', '/kpis').then((data) => ({
      ...data,
      total_exposure: toNumber(data.total_exposure),
      net_retention: toNumber(data.net_retention),
      by_zone: (data.by_zone ?? []).map((row) => ({
        ...row,
        exposure: toNumber(row.exposure),
        pct: toNumber(row.pct),
      })),
      top_hotspot: normalizeHotspot(data.top_hotspot),
    })),

  /**
   * GET /api/geo/wilayas
   * @returns {Promise<import('../types/geo').WilayaBasic[]>}
   */
  getWilayas: () =>
    requestGeo('get', '/wilayas')
      .then((data) => uniqueWilayas(data))
      .catch(() => uniqueWilayas(FALLBACK_WILAYAS)),

  /**
   * GET /api/geo/wilayas/{code}/communes
   * @param {string} wilayaCode
   * @returns {Promise<import('../types/geo').CommuneBasic[]>}
   */
  getCommunesByWilaya: (wilayaCode) =>
    requestGeo('get', `/wilayas/${wilayaCode}/communes`).then((rows) =>
      uniqueCommunes(rows)
    ).catch(() => fallbackCommunes(FALLBACK_COMMUNES.filter((item) => item.wilaya_code === wilayaCode))),

  /**
   * GET /api/geo/communes?wilaya_code=...
   * @param {{ wilaya_code?: string, zone_sismique?: string, has_coordinates?: boolean }} [params]
   * @returns {Promise<import('../types/geo').CommuneBasic[]>}
   */
  getCommunes: (params = {}) =>
    requestGeo('get', '/communes', { params })
      .then((data) => uniqueCommunes(data))
      .catch(() => {
        let rows = FALLBACK_COMMUNES
        if (params.wilaya_code) rows = rows.filter((item) => item.wilaya_code === params.wilaya_code)
        if (params.zone_sismique) rows = rows.filter((item) => item.zone_sismique === params.zone_sismique)
        if (params.has_coordinates === true) rows = rows.filter((item) => item.lat != null && item.lon != null)
        return fallbackCommunes(rows)
      }),

  /**
   * GET /api/geo/zone/{wilaya_code}/{commune_name}
   * Auto-fills the seismic zone badge in PolicyForm.
   * @param {string} wilayaCode
   * @param {string} communeName
   * @returns {Promise<{ zone: string, description: string }>}
   */
  getZone: (wilayaCode, communeName) =>
    requestGeo('get', `/zone/${wilayaCode}/${encodeURIComponent(communeName)}`),

  /**
   * GET /api/geo/premium-adequacy
   * @returns {Promise<import('../types/geo').PremiumAdequacyRow[]>}
   */
  getPremiumAdequacy: () =>
    requestGeo('get', '/premium-adequacy').then((data) =>
      (data ?? []).map((row) => ({
        ...row,
        adequate_rate: toNumber(row.adequate_rate),
        observed_rate: toNumber(row.observed_rate),
        premium_gap_pct: toNumber(row.premium_gap_pct),
        total_exposure: toNumber(row.total_exposure),
      }))
    ),
}
