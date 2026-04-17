/**
 * @fileoverview useSimulation — convenience hook wrapping simulationStore.
 * Provides a clean interface for components that drive or display simulations.
 */
import { useCallback } from 'react'
import useSimulationStore from '../store/simulationStore'
import useMapStore from '../store/mapStore'

export function useSimulation() {
  const {
    isRunning,
    scenario,
    customParams,
    result,
    targetScope,
    targetCode,
    scenarios,
    error,
    setScenario,
    setCustomParams,
    setTargetScope,
    clearResult,
    runSimulation,
    fetchScenarios,
    setResult,
  } = useSimulationStore()

  const setActiveLayer = useMapStore((s) => s.setActiveLayer)

  /** Run and automatically switch map to 'simulation' overlay */
  const run = useCallback(async () => {
    await runSimulation()
  }, [runSimulation])

  /** Clear simulation result and reset map to 'risk' layer */
  const reset = useCallback(() => {
    clearResult()
    setActiveLayer('risk')
  }, [clearResult, setActiveLayer])

  return {
    isRunning,
    scenario,
    customParams,
    result,
    targetScope,
    targetCode,
    scenarios,
    error,
    setScenario,
    setCustomParams,
    setTargetScope,
    setResult,
    fetchScenarios,
    run,
    reset,
  }
}
