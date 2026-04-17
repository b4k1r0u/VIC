/**
 * @fileoverview AlertBanner — top-of-screen notification for new seismic events.
 *
 * Appears when latestAlert is set in alertStore.
 * Pulse animation intensity scales with severity.
 * For M ≥ 5.0 it also shows "Auto-simulation lancée…"
 *
 * Dismisses via the X button → calls alertStore.dismissLatest()
 */
import React, { useEffect } from 'react'
import useAlertStore from '../../store/alertStore'
import { SEVERITY_COLORS } from '../../types/alert'

const SEVERITY_BG = {
  LOW:      'rgba(234,179,8,0.12)',
  MODERATE: 'rgba(249,115,22,0.14)',
  HIGH:     'rgba(239,68,68,0.15)',
  CRITICAL: 'rgba(220,38,38,0.20)',
}

const AUTO_DISMISS_MS = {
  LOW:      8000,
  MODERATE: 12000,
  HIGH:     0,       // manual dismiss only
  CRITICAL: 0,
}

export default function AlertBanner() {
  const latestAlert   = useAlertStore((s) => s.latestAlert)
  const dismissLatest = useAlertStore((s) => s.dismissLatest)
  const markAsRead    = useAlertStore((s) => s.markAsRead)

  // Auto-dismiss for low-severity alerts
  useEffect(() => {
    if (!latestAlert) return
    const delay = AUTO_DISMISS_MS[latestAlert.severity]
    if (!delay) return
    const t = setTimeout(() => dismissLatest(), delay)
    return () => clearTimeout(t)
  }, [latestAlert, dismissLatest])

  if (!latestAlert) return null

  const color = SEVERITY_COLORS[latestAlert.severity] ?? '#ef4444'
  const bg    = SEVERITY_BG[latestAlert.severity]    ?? 'rgba(239,68,68,0.12)'
  const isAutoSim = latestAlert.magnitude >= 5.0

  return (
    <div
      className={`alert-banner alert-banner--${latestAlert.severity.toLowerCase()}`}
      style={{
        background: bg,
        borderBottom: `2px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 20px',
        animation: 'slideDown 0.3s ease',
      }}
    >
      {/* Pulse dot */}
      <span className="pulse-dot" style={{ '--pulse-color': color }} />

      {/* Content */}
      <div style={{ flex: 1, fontSize: 13 }}>
        <strong style={{ color }}>
          🌍 Séisme M{latestAlert.magnitude.toFixed(1)} — {latestAlert.severity}
        </strong>
        <span style={{ color: '#cbd5e1', marginLeft: 10 }}>
          {latestAlert.location_desc}
        </span>
        <span style={{ color: '#64748b', marginLeft: 10, fontSize: 11 }}>
          Zone RPA {latestAlert.rpa_zone} · {latestAlert.nearest_wilaya}
        </span>
        {isAutoSim && (
          <span style={{ color: '#818cf8', marginLeft: 10, fontSize: 11 }}>
            ⚡ Simulation automatique lancée…
          </span>
        )}
      </div>

      {/* Dismiss */}
      <button
        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18 }}
        onClick={() => {
          markAsRead(latestAlert.id)
          dismissLatest()
        }}
        title="Fermer"
      >
        ×
      </button>
    </div>
  )
}
