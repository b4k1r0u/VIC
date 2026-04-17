/**
 * @fileoverview geo API — typed functions for all geography endpoints.
 * Corresponds to backend router: routers/geo.py — prefix: /api/geo
 */
import apiClient from './client'

export const geoAPI = {
  /**
   * GET /api/geo/map-data?layer=risk|exposure|score|simulation
   * @param {'risk'|'exposure'|'score'|'simulation'} layer
   * @returns {Promise<{ features: import('../types/geo').CommuneMapFeature[], last_updated: string }>}
   */
  getMapData: (layer = 'risk') =>
    apiClient.get('/api/geo/map-data', { params: { layer } }).then((r) => r.data),

  /**
   * GET /api/geo/hotspots?top_n=10
   * @param {number} topN
   * @returns {Promise<import('../types/geo').HotspotData[]>}
   */
  getHotspots: (topN = 10) =>
    apiClient.get('/api/geo/hotspots', { params: { top_n: topN } }).then((r) => r.data),

  /**
   * GET /api/geo/kpis
   * @returns {Promise<import('../types/geo').PortfolioKPIs>}
   */
  getKPIs: () => apiClient.get('/api/geo/kpis').then((r) => r.data),

  /**
   * GET /api/geo/wilayas
   * @returns {Promise<import('../types/geo').WilayaBasic[]>}
   */
  getWilayas: () => apiClient.get('/api/geo/wilayas').then((r) => r.data),

  /**
   * GET /api/geo/wilayas/{code}/communes
   * @param {string} wilayaCode
   * @returns {Promise<import('../types/geo').CommuneBasic[]>}
   */
  getCommunesByWilaya: (wilayaCode) =>
    apiClient.get(`/api/geo/wilayas/${wilayaCode}/communes`).then((r) => r.data),

  /**
   * GET /api/geo/zone/{wilaya_code}/{commune_name}
   * Auto-fills the seismic zone badge in PolicyForm.
   * @param {string} wilayaCode
   * @param {string} communeName
   * @returns {Promise<{ zone: string, description: string }>}
   */
  getZone: (wilayaCode, communeName) =>
    apiClient
      .get(`/api/geo/zone/${wilayaCode}/${encodeURIComponent(communeName)}`)
      .then((r) => r.data),

  /**
   * GET /api/geo/premium-adequacy
   * @returns {Promise<import('../types/geo').PremiumAdequacyRow[]>}
   */
  getPremiumAdequacy: () => apiClient.get('/api/geo/premium-adequacy').then((r) => r.data),
}
