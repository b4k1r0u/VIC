/**
 * @fileoverview geo API — typed functions for all geography endpoints.
 * Corresponds to backend router: routers/geo.py — prefix: /api/geo
 */
import axios from 'axios'
import apiClient from './client'
import { toNumber } from '../utils/format'

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

const COMMUNE_API_BASE =
  import.meta.env.VITE_COMMUNE_API_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '')

export const geoAPI = {
  /**
   * GET /api/geo/map-data?layer=risk|exposure|score|simulation
   * @param {'risk'|'exposure'|'score'|'simulation'} layer
   * @returns {Promise<{ features: import('../types/geo').CommuneMapFeature[], last_updated: string }>}
   */
  getMapData: (layer = 'risk') =>
    apiClient.get('/api/geo/map-data', { params: { layer } }).then((r) => ({
      ...r.data,
      features: (r.data.features ?? []).map(normalizeMapFeature),
    })),

  /**
   * GET /api/geo/hotspots?top_n=10
   * @param {number} topN
   * @returns {Promise<import('../types/geo').HotspotData[]>}
   */
  getHotspots: (topN = 10) =>
    apiClient
      .get('/api/geo/hotspots', { params: { top_n: topN } })
      .then((r) => (r.data ?? []).map(normalizeHotspot)),

  /**
   * GET /api/geo/kpis
   * @returns {Promise<import('../types/geo').PortfolioKPIs>}
   */
  getKPIs: () =>
    apiClient.get('/api/geo/kpis').then((r) => ({
      ...r.data,
      total_exposure: toNumber(r.data.total_exposure),
      net_retention: toNumber(r.data.net_retention),
      by_zone: (r.data.by_zone ?? []).map((row) => ({
        ...row,
        exposure: toNumber(row.exposure),
        pct: toNumber(row.pct),
      })),
      top_hotspot: normalizeHotspot(r.data.top_hotspot),
    })),

  /**
   * GET /api/geo/wilayas
   * @returns {Promise<import('../types/geo').WilayaBasic[]>}
   */
  getWilayas: () =>
    apiClient
      .get('/api/geo/wilayas')
      .then((r) => (r.data ?? []).map((item) => ({ code: item.code, name: item.name }))),

  /**
   * GET /api/geo/wilayas/{code}/communes
   * @param {string} wilayaCode
   * @returns {Promise<import('../types/geo').CommuneBasic[]>}
   */
  getCommunesByWilaya: (wilayaCode) =>
    axios.get(`${COMMUNE_API_BASE}/api/geo/wilayas/${wilayaCode}/communes`).then((r) => r.data),

  /**
   * GET /api/geo/zone/{wilaya_code}/{commune_name}
   * Auto-fills the seismic zone badge in PolicyForm.
   * @param {string} wilayaCode
   * @param {string} communeName
   * @returns {Promise<{ zone: string, description: string }>}
   */
  getZone: (wilayaCode, communeName) =>
    axios
      .get(`${COMMUNE_API_BASE}/api/geo/zone/${wilayaCode}/${encodeURIComponent(communeName)}`)
      .then((r) => r.data),

  /**
   * GET /api/geo/premium-adequacy
   * @returns {Promise<import('../types/geo').PremiumAdequacyRow[]>}
   */
  getPremiumAdequacy: () =>
    apiClient.get('/api/geo/premium-adequacy').then((r) =>
      (r.data ?? []).map((row) => ({
        ...row,
        adequate_rate: toNumber(row.adequate_rate),
        observed_rate: toNumber(row.observed_rate),
        premium_gap_pct: toNumber(row.premium_gap_pct),
        total_exposure: toNumber(row.total_exposure),
      }))
    ),
}
