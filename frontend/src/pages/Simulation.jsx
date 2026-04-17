/**
 * @fileoverview Simulation — full-page Monte Carlo simulation view.
 *
 * Layout:
 *  ┌────────────────────────┬──────────────────────────────────┐
 *  │  ScenarioSelector      │  LossDistributionChart           │
 *  │  (left panel)          │  SimulationKPIs                  │
 *  │                        │  Per-commune breakdown table     │
 *  └────────────────────────┴──────────────────────────────────┘
 *                  ↓  (after result)
 *  RecommendationPanel (full width bottom)
 *
 * Route: /simulation
 */
import React from 'react'
import ScenarioSelector from '../components/simulation/ScenarioSelector'
import SimulationKPIs from '../components/simulation/SimulationKPIs'
import LossDistributionChart from '../components/simulation/LossDistributionChart'
import RecommendationPanel from '../components/recommendations/RecommendationPanel'
import ZoneBadge from '../components/shared/ZoneBadge'
import useSimulationStore from '../store/simulationStore'

function formatDZD(v) {
  if (!v) return '—'
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)} Mrd DZD`
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)} M DZD`
  return v.toLocaleString()
}

export default function Simulation() {
  const { result, isRunning } = useSimulationStore()

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>
        📊 Simulation Monte Carlo
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start', marginBottom: 24 }}>

        {/* ── Left: controls ── */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Configuration du scénario</h2>
          <ScenarioSelector />
        </div>

        {/* ── Right: results ── */}
        <div>
          {!result && !isRunning && (
            <div style={{
              background: '#0f172a', border: '1px dashed #1e293b', borderRadius: 12,
              padding: 48, textAlign: 'center', color: '#475569',
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎲</div>
              <p>Configurez un scénario et lancez la simulation pour voir les résultats.</p>
            </div>
          )}

          {isRunning && (
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 32, textAlign: 'center' }}>
              <div style={{
                width: 48, height: 48, margin: '0 auto 16px',
                border: '4px solid #6366f133',
                borderTop: '4px solid #6366f1',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }} />
              <p style={{ color: '#94a3b8', fontWeight: 600 }}>Exécution de 10 000 itérations…</p>
              <p style={{ color: '#475569', fontSize: 12, marginTop: 4 }}>Calcul en cours, veuillez patienter</p>
            </div>
          )}

          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* KPI cards */}
              <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20 }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: '#94a3b8' }}>
                  {result.scenario_name} · {result.scope}
                </h2>
                <SimulationKPIs result={result} />
              </div>

              {/* Distribution chart */}
              <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20 }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: '#94a3b8' }}>
                  Distribution des pertes (10 000 itérations)
                </h2>
                <LossDistributionChart result={result} />
              </div>

              {/* Per-commune breakdown */}
              {result.per_commune_json?.length > 0 && (
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20 }}>
                  <h2 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: '#94a3b8' }}>
                    Répartition par commune
                  </h2>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr>
                        {['Commune', 'Wilaya', 'Polices affectées', 'Perte attendue'].map((h) => (
                          <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: '#64748b', borderBottom: '1px solid #1e293b' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.per_commune_json
                        .sort((a, b) => b.expected_loss - a.expected_loss)
                        .slice(0, 20)
                        .map((c) => (
                          <tr key={c.commune_name} style={{ borderBottom: '1px solid #1e293b' }}>
                            <td style={{ padding: '8px 10px' }}>{c.commune_name}</td>
                            <td style={{ padding: '8px 10px', color: '#64748b' }}>{c.wilaya_code}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'right' }}>{c.affected_policies}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', color: '#ef4444' }}>{formatDZD(c.expected_loss)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Recommendation panel (full width, auto-refreshes after simulation) ── */}
      {result && (
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20 }}>
          <RecommendationPanel scope="portfolio" />
        </div>
      )}
    </div>
  )
}
