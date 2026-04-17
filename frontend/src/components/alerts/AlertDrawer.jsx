/**
 * @fileoverview AlertDrawer — side drawer showing full seismic alert history.
 *
 * Responsibilities:
 *  - List all alerts reverse-chronologically
 *  - Badge on nav icon showing unread count
 *  - Each row shows: magnitude, location, severity chip, time, zone
 *  - Click row → view linked simulation result if any
 *
 * @param {{ open: boolean, onClose: () => void }} props
 */
import React from 'react'
import useAlertStore from '../../store/alertStore'
import { SEVERITY_COLORS } from '../../types/alert'

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60)    return `il y a ${Math.floor(diff)} s`
  if (diff < 3600)  return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  return new Date(iso).toLocaleDateString('fr-DZ')
}

export default function AlertDrawer({ open, onClose }) {
  const alerts    = useAlertStore((s) => s.alerts)
  const readIds   = useAlertStore((s) => s.readIds)
  const markAsRead = useAlertStore((s) => s.markAsRead)
  const markAllRead = useAlertStore((s) => s.markAllRead)
  const isConnected = useAlertStore((s) => s.isConnected)

  if (!open) return null

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside
        className="alert-drawer"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed', right: 0, top: 0, bottom: 0, width: 380,
          background: '#0f172a', borderLeft: '1px solid #1e293b',
          display: 'flex', flexDirection: 'column', zIndex: 1000,
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #1e293b',
        }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: 15 }}>🌍 Alertes sismiques</span>
            <span
              style={{
                marginLeft: 8, width: 8, height: 8, borderRadius: '50%',
                display: 'inline-block',
                background: isConnected ? '#22c55e' : '#ef4444',
              }}
              title={isConnected ? 'Connecté' : 'Déconnecté'}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={markAllRead} style={{ fontSize: 11, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
              Tout marquer lu
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer' }}>×</button>
          </div>
        </div>

        {/* ── Alert list ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {alerts.length === 0 && (
            <p style={{ color: '#475569', textAlign: 'center', marginTop: 40, fontSize: 13 }}>
              Aucune alerte récente
            </p>
          )}
          {alerts.map((alert) => {
            const isRead  = readIds.has(alert.id)
            const color   = SEVERITY_COLORS[alert.severity] ?? '#ef4444'
            return (
              <div
                key={alert.id}
                onClick={() => markAsRead(alert.id)}
                style={{
                  display: 'flex', gap: 12, padding: '12px 20px',
                  borderBottom: '1px solid #1e293b', cursor: 'pointer',
                  background: isRead ? 'transparent' : 'rgba(99,102,241,0.05)',
                  transition: 'background 0.15s',
                }}
              >
                {/* Severity indicator */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: `${color}22`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 14, fontWeight: 700, color,
                }}>
                  {alert.magnitude.toFixed(1)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>
                    {alert.location_desc}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    Zone {alert.rpa_zone} · {alert.nearest_wilaya} · {timeAgo(alert.event_time)}
                  </div>
                </div>

                {/* Severity chip */}
                <span style={{
                  alignSelf: 'center', fontSize: 9, fontWeight: 700,
                  color, border: `1px solid ${color}`, borderRadius: 4,
                  padding: '2px 6px', letterSpacing: '0.05em',
                }}>
                  {alert.severity}
                </span>
              </div>
            )
          })}
        </div>
      </aside>
    </div>
  )
}
