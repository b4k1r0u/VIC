/**
 * @fileoverview Dashboard — main page: map + KPIs + alert banner + recommendation panel.
 *
 * Layout:
 *  ┌─────────────────────────────────────────────────────────┐
 *  │  AlertBanner (conditional — top)                        │
 *  ├────────────────────────────┬────────────────────────────┤
 *  │                            │  ScenarioSelector          │
 *  │      AlgeriaMap            │  ─────────────────         │
 *  │  (central map, full area)  │  SimulationKPIs            │
 *  │                            │  LossDistributionChart     │
 *  │                            │  ─────────────────         │
 *  │                            │  RecommendationPanel       │
 *  └────────────────────────────┴────────────────────────────┘
 *
 * Route: /  (or /dashboard in router.jsx)
 */
import React, { Suspense, lazy } from 'react'
import AlertBanner from '../components/alerts/AlertBanner'
import ScenarioSelector from '../components/simulation/ScenarioSelector'
import SimulationKPIs from '../components/simulation/SimulationKPIs'
import LossDistributionChart from '../components/simulation/LossDistributionChart'
import RecommendationPanel from '../components/recommendations/RecommendationPanel'
import KPICard from '../components/shared/KPICard'
import ZoneBadge from '../components/shared/ZoneBadge'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import { useMapData } from '../hooks/useMapData'
import useSimulationStore from '../store/simulationStore'

// Lazy-load the heavy Leaflet map
const AlgeriaMap = lazy(() => import('../components/map/AlgeriaMap'))

const MAP_LAYERS = [
  { id: 'risk',       label: 'Zones RPA' },
  { id: 'exposure',   label: 'Exposition' },
  { id: 'score',      label: 'Score IA' },
  { id: 'simulation', label: 'Simulation' },
]

export default function Dashboard() {
  const { portfolioKPIs, activeLayer, switchLayer, selectedWilaya } = useMapData()
  const simulationResult = useSimulationStore((s) => s.result)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Alert banner (appears on new alert) ── */}
      <AlertBanner />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Left: Map area ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Layer toggle + portfolio KPIs row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 16px', borderBottom: '1px solid #1e293b',
            flexWrap: 'wrap',
          }}>
            {/* Layer switcher */}
            <div style={{ display: 'flex', gap: 4 }}>
              {MAP_LAYERS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => switchLayer(id)}
                  style={{
                    padding: '5px 12px', fontSize: 11, borderRadius: 6,
                    border: '1px solid',
                    borderColor: activeLayer === id ? '#6366f1' : '#1e293b',
                    background: activeLayer === id ? '#6366f1' : 'transparent',
                    color: activeLayer === id ? '#fff' : '#64748b',
                    cursor: 'pointer', fontWeight: 600,
                    transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Live KPIs */}
            {portfolioKPIs && (
              <div style={{ display: 'flex', gap: 16, marginLeft: 'auto', fontSize: 12 }}>
                <span style={{ color: '#64748b' }}>
                  <strong style={{ color: '#f1f5f9' }}>
                    {portfolioKPIs.total_policies?.toLocaleString()}
                  </strong> polices
                </span>
                <span style={{ color: '#64748b' }}>
                  Exposition:{' '}
                  <strong style={{ color: '#f1f5f9' }}>
                    {portfolioKPIs.total_exposure >= 1e9
                      ? `${(portfolioKPIs.total_exposure / 1e9).toFixed(1)} Mrd DZD`
                      : `${(portfolioKPIs.total_exposure / 1e6).toFixed(0)} M DZD`}
                  </strong>
                </span>
                {selectedWilaya && (
                  <span style={{ color: '#818cf8' }}>📍 Wilaya {selectedWilaya}</span>
                )}
              </div>
            )}
          </div>

          {/* Map */}
          <div style={{ flex: 1, position: 'relative' }}>
            <Suspense fallback={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <LoadingSpinner size={40} />
              </div>
            }>
              <AlgeriaMap />
            </Suspense>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div style={{
          width: 340, display: 'flex', flexDirection: 'column',
          borderLeft: '1px solid #1e293b', overflow: 'hidden',
        }}>

          {/* Simulation panel */}
          <div style={{ padding: 16, borderBottom: '1px solid #1e293b' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>📊 Monte Carlo</div>
            <ScenarioSelector />
          </div>

          {/* Simulation results */}
          {simulationResult && (
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e293b' }}>
              <SimulationKPIs result={simulationResult} />
              <div style={{ marginTop: 12 }}>
                <LossDistributionChart result={simulationResult} />
              </div>
            </div>
          )}

          {/* Recommendation panel */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <RecommendationPanel scope="portfolio" />
          </div>
        </div>
      </div>
    </div>
  )
}
