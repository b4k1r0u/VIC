/**
 * @fileoverview KPICard — reusable metric card for KPI dashboards.
 *
 * @param {{
 *   label: string,
 *   value: string | number,
 *   sub?: string,
 *   icon?: string,
 *   accentColor?: string,
 *   trend?: number    - positive = up, negative = down
 * }} props
 */
import React from 'react'

export default function KPICard({ label, value, sub, icon, accentColor = '#6366f1', trend }) {
  return (
    <div
      style={{
        background: '#0f172a',
        border: '1px solid #1e293b',
        borderTop: `3px solid ${accentColor}`,
        borderRadius: 10,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.boxShadow = `0 4px 20px ${accentColor}22`
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = ''
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
        {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
      </div>

      <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', lineHeight: 1.2 }}>
        {value ?? '—'}
      </div>

      {(sub || trend != null) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#64748b' }}>
          {sub && <span>{sub}</span>}
          {trend != null && (
            <span style={{ color: trend >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
              {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
      )}
    </div>
  )
}
