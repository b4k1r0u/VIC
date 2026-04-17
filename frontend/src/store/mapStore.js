/**
 * @fileoverview mapStore — owns all map state and geographic data.
 * The map is the central visualization layer; every other feature renders
 * its output onto or beside it.
 */
import { create } from 'zustand'
import { geoAPI } from '../api/geo'

/**
 * @typedef {'risk'|'exposure'|'score'|'simulation'} MapLayer
 *
 * Layer behavior:
 *  'risk'       → communes colored by RPA seismic zone (green → dark red)
 *  'exposure'   → communes colored by total valeur_assurée (light → dark blue)
 *  'score'      → communes colored by avg CatBoost risk score
 *  'simulation' → overlay of loss intensity from last simulation run
 */

const useMapStore = create((set, get) => ({
  // ── Data ────────────────────────────────────────────────────────────────────
  /** @type {import('../types/geo').CommuneMapFeature[]} */
  communeData: [],

  /** @type {import('../types/geo').HotspotData[]} */
  hotspots: [],

  /** @type {import('../types/geo').PortfolioKPIs|null} */
  portfolioKPIs: null,

  isLoading: false,
  error: null,

  // ── Filters ─────────────────────────────────────────────────────────────────
  /** @type {'all'|'0'|'I'|'IIa'|'IIb'|'III'} */
  selectedZone: 'all',

  /** @type {string|null} */
  selectedWilaya: null,

  /** @type {string|null} */
  selectedCommune: null,

  /** @type {MapLayer} */
  activeLayer: 'risk',

  // ── Actions ─────────────────────────────────────────────────────────────────
  setSelectedWilaya: (code) => set({ selectedWilaya: code, selectedCommune: null }),
  setSelectedCommune: (code) => set({ selectedCommune: code }),
  setSelectedZone: (zone) => set({ selectedZone: zone }),
  setActiveLayer: (layer) => set({ activeLayer: layer }),

  /** Fetch commune GeoJSON features enriched with exposure + scores */
  fetchMapData: async () => {
    const { activeLayer } = get()
    set({ isLoading: true, error: null })
    try {
      const data = await geoAPI.getMapData(activeLayer)
      set({ communeData: data.features, isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  fetchHotspots: async (topN = 10) => {
    try {
      const hotspots = await geoAPI.getHotspots(topN)
      set({ hotspots })
    } catch (err) {
      console.error('[mapStore] fetchHotspots failed:', err)
    }
  },

  fetchPortfolioKPIs: async () => {
    try {
      const portfolioKPIs = await geoAPI.getKPIs()
      set({ portfolioKPIs })
    } catch (err) {
      console.error('[mapStore] fetchPortfolioKPIs failed:', err)
    }
  },
}))

export default useMapStore
