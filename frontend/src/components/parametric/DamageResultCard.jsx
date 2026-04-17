/**
 * @fileoverview DamageResultCard — displays damage AI estimation output.
 * Shows: damage class, loss %, heatmap overlay, per-class breakdown.
 * Mock estimates shown with "Estimation simulée" badge (confidence = 0).
 *
 * @param {{ result: import('../../api/damage').DamageEstimationResult }} props
 */
import React from 'react'

const CLASS_COLORS = {
  0: '#22c55e',  // No Damage
  1: '#eab308',  // Minor
  2: '#f97316',  // Major
  3: '#dc2626',  // Destroyed
}

const CLASS_LABELS = {
  0: 'Aucun dommage',
  1: 'Dommages mineurs',
  2: 'Dommages majeurs',
  3: 'Destruction totale',
}

function pct(v) { return `${(v * 100).toFixed(1)}%` }
function fmt(v)  { return v >= 1e9 ? `${(v / 1e9).toFixed(2)} Mrd DZD` : `${(v / 1e6).toFixed(1)} M DZD` }

export default function DamageResultCard({ result }) {
  if (!result) return null

  const color = CLASS_COLORS[result.damage_class] ?? '#94a3b8'
  const isMock = result.is_mock || result.confidence === 0

  return (
    <div style={{
      background: '#0f172a', border: '1px solid #1e293b',
      borderRadius: 12, padding: 20, position: 'relative',
    }}>
      {/* Mock badge */}
      {isMock && (
        <span style={{
          position: 'absolute', top: 12, right: 12,
          background: '#1e293b', color: '#64748b',
          fontSize: 10, padding: '2px 8px', borderRadius: 20,
          fontWeight: 600, letterSpacing: '0.05em',
        }}>
          ESTIMATION SIMULÉE
        </span>
      )}

      {/* Main metric */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: `${color}20`, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 28,
        }}>
          {result.damage_class === 3 ? '💀' : result.damage_class === 2 ? '🏚️' : result.damage_class === 1 ? '⚠️' : '✅'}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color }}>{pct(result.loss_percentage)}</div>
          <div style={{ fontSize: 14, color: '#f1f5f9', fontWeight: 600 }}>
            {CLASS_LABELS[result.damage_class]}
          </div>
          {result.confidence > 0 && (
            <div style={{ fontSize: 11, color: '#64748b' }}>
              Confiance : {pct(result.confidence)}
            </div>
          )}
        </div>
      </div>

      {/* Financial metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Perte / km²', value: fmt(result.loss_per_km2_dzd) },
          { label: 'Perte totale', value: fmt(result.total_loss_dzd) },
          { label: 'Surface affectée', value: `${result.affected_area_km2?.toFixed(1)} km²` },
        ].map((m) => (
          <div key={m.label} style={{ background: '#1e293b', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>{m.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Per-class breakdown */}
      {result.breakdown && (
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>Répartition des dommages</div>
          {Object.entries(result.breakdown).map(([label, pctVal]) => (
            <div key={label} style={{ marginBottom: 5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                <span style={{ color: '#94a3b8' }}>{label}</span>
                <span style={{ color: '#f1f5f9' }}>{pct(pctVal)}</span>
              </div>
              <div style={{ height: 4, background: '#1e293b', borderRadius: 2 }}>
                <div style={{ height: '100%', width: pct(pctVal), background: color, borderRadius: 2, transition: 'width 0.4s' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Heatmap image */}
      {result.heatmap_url && (
        <img
          src={result.heatmap_url}
          alt="Carte thermique des dommages"
          style={{ width: '100%', borderRadius: 8, marginTop: 14 }}
        />
      )}
    </div>
  )
}
