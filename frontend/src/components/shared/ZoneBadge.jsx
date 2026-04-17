/**
 * @fileoverview ZoneBadge — displays an RPA seismic zone label with appropriate color.
 *
 * @param {{ zone: '0'|'I'|'IIa'|'IIb'|'III'|string, size?: 'sm'|'md' }} props
 */
import React from 'react'
import { ZONE_COLORS } from '../../types/geo'

const ZONE_LABELS = {
  '0':   'Zone 0 — Faible',
  'I':   'Zone I — Modérée',
  'IIa': 'Zone IIa — Élevée',
  'IIb': 'Zone IIb — Élevée+',
  'III': 'Zone III — Très élevée',
}

export default function ZoneBadge({ zone, size = 'sm', showLabel = false }) {
  if (!zone) return null
  const color = ZONE_COLORS[zone] ?? '#94a3b8'
  const fontSize = size === 'md' ? 13 : 11

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: `${color}20`,
        color,
        border: `1px solid ${color}55`,
        borderRadius: 5,
        padding: size === 'md' ? '4px 10px' : '2px 7px',
        fontSize,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
      title={ZONE_LABELS[zone] ?? `Zone ${zone}`}
    >
      {zone}
      {showLabel && (
        <span style={{ fontWeight: 400, opacity: 0.8 }}>
          {ZONE_LABELS[zone]?.split('—')[1]?.trim()}
        </span>
      )}
    </span>
  )
}
