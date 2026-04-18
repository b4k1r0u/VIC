/**
 * @fileoverview simulationStore — owns Monte Carlo simulation state.
 * When a simulation completes, mapStore.setActiveLayer('simulation') is
 * triggered automatically and the RecommendationPanel refreshes.
 */
import { create } from 'zustand'
import { simulationAPI } from '../api/simulation'
import { SCENARIOS } from '../types/simulation'
import useMapStore from './mapStore'

function stringifyErrorDetail(detail) {
  if (!detail) return ''
  if (typeof detail === 'string') return detail

  if (Array.isArray(detail)) {
    return detail
      .map((item) => stringifyErrorDetail(item))
      .filter(Boolean)
      .join(' | ')
  }

  if (typeof detail === 'object') {
    const location = Array.isArray(detail.loc) ? detail.loc.join(' > ') : ''
    const message = typeof detail.msg === 'string' ? detail.msg : ''
    if (location || message) {
      return [location, message].filter(Boolean).join(': ')
    }

    return Object.values(detail)
      .map((item) => stringifyErrorDetail(item))
      .filter(Boolean)
      .join(' | ')
  }

  return String(detail)
}

function getSimulationCount(scope) {
  if (scope === 'national') return 1200
  if (scope === 'wilaya') return 900
  if (scope === 'commune') return 600
  return 1000
}

const useSimulationStore = create((set, get) => ({
  // ── State ────────────────────────────────────────────────────────────────────
  isRunning: false,

  /** @type {'boumerdes_2003'|'el_asnam_1980'|'custom'} */
  scenario: 'boumerdes_2003',

  /** @type {import('../types/simulation').CustomScenarioParams|null} */
  customParams: null,

  /** @type {import('../types/simulation').SimulationResult|null} */
  result: null,

  /** @type {'national'|'wilaya'|'commune'} */
  targetScope: 'national',

  /** wilaya or commune code if scope is not 'national' */
  targetCode: null,

  /** @type {import('../types/simulation').ScenarioMeta[]} */
  scenarios: [],

  error: null,

  // ── Actions ──────────────────────────────────────────────────────────────────
  setScenario: (scenario) => set({ scenario }),
  setCustomParams: (params) => set({ customParams: params }),
  setResult: (result) => set({ result }),
  clearResult: () => set({ result: null }),

  setTargetScope: (scope, code = null) =>
    set({ targetScope: scope, targetCode: code }),

  fetchScenarios: async () => {
    try {
      const scenarios = await simulationAPI.getScenarios()
      set({ scenarios })
    } catch (err) {
      console.error('[simulationStore] fetchScenarios failed:', err)
    }
  },

  /**
   * Run a Monte Carlo simulation.
   * On success: stores result and switches map to 'simulation' layer.
   */
  runSimulation: async () => {
    const { scenario, targetScope, targetCode, customParams } = get()
    set({ isRunning: true, error: null })

    try {
      let requestScenario = scenario
      let requestCustomParams = customParams
      let requestScope = targetScope
      let requestTargetCode = targetCode

      if (targetScope === 'commune' && typeof targetCode === 'string') {
        if (targetCode.startsWith('commune:')) {
          requestTargetCode = targetCode.slice('commune:'.length)
        } else if (targetCode.startsWith('wilaya:')) {
          requestScope = 'wilaya'
          requestTargetCode = targetCode.slice('wilaya:'.length)
        }
      }

      // If the user scopes a historical scenario outside its default impacted wilayas,
      // keep the same event parameters but send it as a custom run so the backend
      // can still compute the selected wilaya/commune instead of hard-failing.
      if (scenario !== 'custom' && (requestScope === 'wilaya' || requestScope === 'commune')) {
        const scenarioMeta = SCENARIOS[scenario]
        const scopeWilayaCode =
          requestScope === 'wilaya'
            ? requestTargetCode
            : null

        if (
          scenarioMeta &&
          scopeWilayaCode &&
          !scenarioMeta.affected_wilayas.includes(String(scopeWilayaCode).padStart(2, '0'))
        ) {
          requestScenario = 'custom'
          requestCustomParams = {
            epicenter_lat: scenarioMeta.epicenter[0],
            epicenter_lon: scenarioMeta.epicenter[1],
            magnitude: scenarioMeta.magnitude,
          }
        }
      }

      if (requestScenario === 'custom') {
        const magnitude = Number(requestCustomParams?.magnitude)
        const epicenterLat = Number(requestCustomParams?.epicenter_lat)
        const epicenterLon = Number(requestCustomParams?.epicenter_lon)

        if (
          !Number.isFinite(magnitude) ||
          !Number.isFinite(epicenterLat) ||
          !Number.isFinite(epicenterLon)
        ) {
          throw new Error('Provide latitude, longitude, and magnitude for the custom scenario.')
        }
      }

      if ((requestScope === 'wilaya' || requestScope === 'commune') && !requestTargetCode) {
        throw new Error(`Select ${targetScope === 'wilaya' ? 'a wilaya' : 'a commune'} before running the simulation.`)
      }

      const request = {
        scenario: requestScenario,
        ...(requestScope !== 'national' ? { scope: requestScope } : {}),
        ...(requestTargetCode && { scope_code: requestTargetCode }),
        n_simulations: getSimulationCount(requestScope),
        ...(requestScenario === 'custom' && requestCustomParams ? requestCustomParams : {}),
      }

      const result = await simulationAPI.runScenario(request)
      set({ result, isRunning: false })

      // Switch map to simulation overlay layer automatically
      useMapStore.getState().setActiveLayer('simulation')
    } catch (err) {
      const formattedDetail = stringifyErrorDetail(err?.response?.data?.detail)
      const errorMessage =
        formattedDetail ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (err?.code === 'ECONNABORTED'
          ? 'The simulation backend is taking too long to respond. Try again later or run a more targeted simulation.'
          : err.message)

      set({ error: errorMessage, isRunning: false })
    }
  },
}))

export default useSimulationStore
