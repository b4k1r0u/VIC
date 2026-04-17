/**
 * @fileoverview ScenarioSelector — scenario + scope picker for Monte Carlo.
 *
 * Responsibilities:
 *  1. Scenario dropdown: Boumerdès 2003 / El Asnam 1980 / Custom
 *  2. Scope selector: National / By Wilaya / By Commune
 *  3. Custom params: epicenter lat/lon + magnitude (shown when 'custom')
 *  4. [Run Simulation] button → calls simulationStore.run()
 *  5. Loading state: progress bar + "Running 10,000 simulations…"
 */
import React, { useState } from 'react'
import { useSimulation } from '../../hooks/useSimulation'
import { SCENARIOS } from '../../types/simulation'
import LoadingSpinner from '../shared/LoadingSpinner'

export default function ScenarioSelector() {
  const {
    scenario, setScenario,
    targetScope, setTargetScope,
    customParams, setCustomParams,
    isRunning, error,
    run,
  } = useSimulation()

  const [wilayaCode, setWilayaCode] = useState('')

  const handleScopeChange = (scope) => {
    setTargetScope(scope, scope === 'wilaya' ? wilayaCode : null)
  }

  const handleCustomParam = (key, value) => {
    setCustomParams({ ...(customParams ?? {}), [key]: parseFloat(value) })
  }

  return (
    <div className="scenario-selector">
      {/* ── Scenario ── */}
      <div className="field-group">
        <label htmlFor="scenario-select">Scénario</label>
        <select
          id="scenario-select"
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          disabled={isRunning}
        >
          <option value="boumerdes_2003">{SCENARIOS.boumerdes_2003.label}</option>
          <option value="el_asnam_1980">{SCENARIOS.el_asnam_1980.label}</option>
          <option value="custom">Scénario personnalisé</option>
        </select>
      </div>

      {/* ── Custom params ── */}
      {scenario === 'custom' && (
        <div className="custom-params">
          <div className="field-group">
            <label>Latitude épicentre</label>
            <input
              type="number"
              step="0.01"
              placeholder="ex. 36.83"
              onChange={(e) => handleCustomParam('epicenter_lat', e.target.value)}
            />
          </div>
          <div className="field-group">
            <label>Longitude épicentre</label>
            <input
              type="number"
              step="0.01"
              placeholder="ex. 3.65"
              onChange={(e) => handleCustomParam('epicenter_lon', e.target.value)}
            />
          </div>
          <div className="field-group">
            <label>Magnitude</label>
            <input
              type="number"
              step="0.1"
              min="4"
              max="9"
              placeholder="ex. 6.5"
              onChange={(e) => handleCustomParam('magnitude', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ── Scope ── */}
      <div className="field-group">
        <label>Périmètre</label>
        <div className="scope-buttons">
          {['national', 'wilaya', 'commune'].map((s) => (
            <button
              key={s}
              className={`scope-btn ${targetScope === s ? 'active' : ''}`}
              onClick={() => handleScopeChange(s)}
              disabled={isRunning}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Wilaya code (if scope = wilaya) ── */}
      {targetScope === 'wilaya' && (
        <div className="field-group">
          <label>Code wilaya</label>
          <input
            type="text"
            maxLength={2}
            placeholder="ex. 16"
            value={wilayaCode}
            onChange={(e) => {
              setWilayaCode(e.target.value)
              setTargetScope('wilaya', e.target.value)
            }}
          />
        </div>
      )}

      {/* ── Error ── */}
      {error && <p className="error-text">{error}</p>}

      {/* ── Run button ── */}
      <button
        className="run-btn"
        onClick={run}
        disabled={isRunning}
      >
        {isRunning
          ? <><LoadingSpinner size={16} /> Simulation en cours…</>
          : '▶ Lancer la simulation'}
      </button>

      {isRunning && (
        <p className="running-hint">Exécution de 10 000 itérations Monte Carlo…</p>
      )}
    </div>
  )
}
