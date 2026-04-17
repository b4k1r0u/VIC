/**
 * @fileoverview simulationStore — owns Monte Carlo simulation state.
 * When a simulation completes, mapStore.setActiveLayer('simulation') is
 * triggered automatically and the RecommendationPanel refreshes.
 */
import { create } from 'zustand'
import { simulationAPI } from '../api/simulation'
import useMapStore from './mapStore'

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
      const request = {
        scenario,
        scope: targetScope,
        ...(targetCode && { scope_code: targetCode }),
        ...(scenario === 'custom' && customParams && { custom_params: customParams }),
      }

      const result = await simulationAPI.runScenario(request)
      set({ result, isRunning: false })

      // Switch map to simulation overlay layer automatically
      useMapStore.getState().setActiveLayer('simulation')
    } catch (err) {
      set({ error: err.message, isRunning: false })
    }
  },
}))

export default useSimulationStore
