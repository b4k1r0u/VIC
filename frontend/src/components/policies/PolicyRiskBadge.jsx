/**
 * @fileoverview PolicyRiskBadge — displays CatBoost risk tier as a colored badge.
 * Updates live in PolicyForm as the user types valeur_assurée (debounced call).
 *
 * @param {{ score: number|null, tier: 'LOW'|'MEDIUM'|'HIGH'|null, loading?: boolean }} props
 */
import React from 'react'
import { RISK_TIER_META } from '../../types/policy'
import LoadingSpinner from '../shared/LoadingSpinner'

export default function PolicyRiskBadge({ score, tier, loading = false }) {
  if (loading) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
        <LoadingSpinner size={12} /> Calcul du score…
      </span>
    )
  }

  if (!tier) return null

  const meta = RISK_TIER_META[tier] ?? { label: tier, color: '#94a3b8', bg: '#1e293b' }

  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: meta.bg, color: meta.color,
        border: `1px solid ${meta.color}`,
        borderRadius: 20, padding: '3px 12px',
        fontSize: 12, fontWeight: 700,
      }}
    >
      {tier === 'HIGH' ? '🔴' : tier === 'MEDIUM' ? '🟡' : '🟢'}
      {meta.label}
      {score != null && <span style={{ fontWeight: 400, opacity: 0.8 }}>{score.toFixed(0)}/100</span>}
    </span>
  )
}
