/**
 * @fileoverview RecommendationCard — single recommendation item.
 * Priority badge: 🔴 CRITIQUE / 🟠 ÉLEVÉE / 🟡 MODÉRÉE / 🟢 OPPORTUNITÉ
 *
 * @param {{
 *   recommendation: import('../../api/recommendations').Recommendation,
 *   priorityIcon: Record<string, string>
 * }} props
 */
import React, { useState } from 'react'

const PRIORITY_COLORS = {
  CRITIQUE:    { border: '#ef4444', bg: 'rgba(239,68,68,0.08)'  },
  ÉLEVÉE:      { border: '#f97316', bg: 'rgba(249,115,22,0.08)' },
  MODÉRÉE:     { border: '#eab308', bg: 'rgba(234,179,8,0.08)'  },
  OPPORTUNITÉ: { border: '#22c55e', bg: 'rgba(34,197,94,0.08)'  },
}

const CATEGORY_ICONS = {
  Concentration:  '📍',
  Réassurance:    '🔄',
  Tarification:   '💰',
  Croissance:     '📈',
  Prévention:     '🛡️',
}

export default function RecommendationCard({ recommendation: rec, priorityIcon }) {
  const [expanded, setExpanded] = useState(false)
  const colors = PRIORITY_COLORS[rec.priority] ?? PRIORITY_COLORS['MODÉRÉE']

  return (
    <div
      className="rec-card"
      style={{
        borderLeft: `3px solid ${colors.border}`,
        background: colors.bg,
        borderRadius: 8,
        padding: '10px 14px',
        marginBottom: 8,
        cursor: 'pointer',
        transition: 'opacity 0.15s',
      }}
      onClick={() => setExpanded((e) => !e)}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 13 }}>
          {priorityIcon?.[rec.priority]} {CATEGORY_ICONS[rec.category] ?? '•'}
        </span>
        <span style={{ fontWeight: 600, fontSize: 13, color: '#f1f5f9', flex: 1 }}>
          {rec.title}
        </span>
        <span style={{ fontSize: 10, color: '#64748b', fontVariantCaps: 'all-small-caps' }}>
          {rec.priority}
        </span>
        <span style={{ fontSize: 11, color: '#475569' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {/* ── Expanded body ── */}
      {expanded && (
        <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.65 }}>
          <p style={{ color: '#cbd5e1', marginBottom: 6 }}>{rec.description}</p>
          <p style={{ color: '#94a3b8' }}>
            <strong style={{ color: '#f1f5f9' }}>Action : </strong>
            {rec.action}
          </p>
          {rec.rpa_reference && (
            <span
              style={{
                display: 'inline-block', marginTop: 6,
                background: '#1e293b', borderRadius: 4,
                padding: '2px 7px', fontSize: 10, color: '#818cf8',
              }}
            >
              📖 {rec.rpa_reference}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
