/**
 * @fileoverview PolicyTable — sortable, filterable portfolio table.
 *
 * Responsibilities:
 *  - Renders paginated policy list from policyStore
 *  - Filter bar: zone / type / risk tier / year / value range / search
 *  - Click row → selectPolicy → opens PolicyForm / detail panel on the right
 *  - Shows risk badge + zone badge per row
 *  - CSV bulk-import trigger button
 */
import React, { useEffect, useRef } from 'react'
import usePolicyStore from '../../store/policyStore'
import PolicyRiskBadge from './PolicyRiskBadge'
import ZoneBadge from '../shared/ZoneBadge'
import LoadingSpinner from '../shared/LoadingSpinner'
import { TYPE_RISQUE_OPTIONS } from '../../types/policy'

const ZONE_OPTIONS = ['0', 'I', 'IIa', 'IIb', 'III']
const TIER_OPTIONS = ['LOW', 'MEDIUM', 'HIGH']

function fmt(v) {
  if (!v) return '—'
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)} Md`
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)} M`
  return v.toLocaleString()
}

export default function PolicyTable({ onImport }) {
  const {
    policies, total, page, pageSize, filters,
    isLoading, selectedPolicy,
    fetchPolicies, setPage, setFilters, selectPolicy, deletePolicy,
  } = usePolicyStore()

  const csvRef = useRef(null)

  useEffect(() => { fetchPolicies() }, [page, filters]) // eslint-disable-line

  const totalPages = Math.ceil(total / pageSize)

  const handleImportCSV = (e) => {
    const file = e.target.files?.[0]
    if (file) onImport?.(file)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Filter bar ── */}
      <div style={{ display: 'flex', gap: 10, padding: '12px 16px', flexWrap: 'wrap', borderBottom: '1px solid #1e293b' }}>
        <input
          placeholder="🔍 Recherche…"
          value={filters.search ?? ''}
          onChange={(e) => setFilters({ search: e.target.value || undefined })}
          style={{ flex: 1, minWidth: 140 }}
        />
        <select value={filters.zone ?? ''} onChange={(e) => setFilters({ zone: e.target.value || undefined })}>
          <option value="">Toutes zones</option>
          {ZONE_OPTIONS.map((z) => <option key={z} value={z}>Zone {z}</option>)}
        </select>
        <select value={filters.risk_tier ?? ''} onChange={(e) => setFilters({ risk_tier: e.target.value || undefined })}>
          <option value="">Tous niveaux</option>
          {TIER_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filters.type_risque ?? ''} onChange={(e) => setFilters({ type_risque: e.target.value || undefined })}>
          <option value="">Tous types</option>
          {TYPE_RISQUE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input
          type="number"
          placeholder="Année"
          value={filters.year ?? ''}
          onChange={(e) => setFilters({ year: e.target.value ? parseInt(e.target.value) : undefined })}
          style={{ width: 80 }}
        />

        {/* CSV import */}
        <input ref={csvRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImportCSV} />
        <button onClick={() => csvRef.current?.click()} style={{ padding: '6px 12px', fontSize: 12 }}>
          📤 Importer CSV
        </button>
      </div>

      {/* ── Table ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <LoadingSpinner size={28} />
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#0f172a', position: 'sticky', top: 0 }}>
                {['N° Police', 'Wilaya', 'Zone', 'Type', 'Valeur assurée', 'Prime', 'Score', 'Expiration', ''].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap', borderBottom: '1px solid #1e293b' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {policies.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 32, color: '#475569' }}>
                    Aucune police trouvée
                  </td>
                </tr>
              )}
              {policies.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => selectPolicy(p)}
                  style={{
                    cursor: 'pointer',
                    background: selectedPolicy?.id === p.id ? 'rgba(99,102,241,0.1)' : 'transparent',
                    transition: 'background 0.15s',
                    borderBottom: '1px solid #1e293b',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseOut={(e) => e.currentTarget.style.background = selectedPolicy?.id === p.id ? 'rgba(99,102,241,0.1)' : 'transparent'}
                >
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#94a3b8' }}>{p.numero_police}</td>
                  <td style={{ padding: '10px 14px' }}>{p.wilaya_code}</td>
                  <td style={{ padding: '10px 14px' }}><ZoneBadge zone={p.zone_sismique} /></td>
                  <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{p.type_risque?.split(' - ')[0]}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(p.valeur_assuree)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: '#64748b' }}>{fmt(p.prime_nette)}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <PolicyRiskBadge score={p.risk_score} tier={p.risk_tier} />
                  </td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{p.date_expiration}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); deletePolicy(p.id) }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14 }}
                      title="Supprimer"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid #1e293b', fontSize: 12, color: '#64748b' }}>
        <span>{total.toLocaleString()} polices au total</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setPage(page - 1)} disabled={page <= 1}>←</button>
          <span>Page {page} / {totalPages || 1}</span>
          <button onClick={() => setPage(page + 1)} disabled={page >= totalPages}>→</button>
        </div>
      </div>
    </div>
  )
}
