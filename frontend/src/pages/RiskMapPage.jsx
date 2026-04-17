import React, { useEffect, useMemo, useState } from 'react'
import { Filter, Layers, MapPin, Search } from 'lucide-react'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ZoneBadge from '../components/shared/ZoneBadge'
import { geoAPI } from '../api/geo'
import {
  formatCompactDzd,
  formatDateTime,
  formatInteger,
} from '../utils/format'

const LAYER_META = {
  risk: { label: 'Risque', metric: 'Score de risque', color: '#dc2626' },
  exposure: { label: 'Exposition', metric: 'Capital assuré', color: '#2563eb' },
  score: { label: 'Score', metric: 'Layer value', color: '#ca8a04' },
  simulation: { label: 'Simulation', metric: 'Layer value', color: '#14b8a6' },
}

const rowKey = (row) => `${row.wilaya_code}-${row.commune_code}`

function Stat({ label, value, note }) {
  return (
    <div style={S.statCard}>
      <div style={S.statLabel}>{label}</div>
      <div style={S.statValue}>{value}</div>
      <div style={S.statNote}>{note}</div>
    </div>
  )
}

export default function RiskMapPage() {
  const [layer, setLayer] = useState('risk')
  const [rows, setRows] = useState([])
  const [wilayas, setWilayas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [zoneFilter, setZoneFilter] = useState('')
  const [wilayaFilter, setWilayaFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedKey, setSelectedKey] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    geoAPI.getWilayas().then(setWilayas).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const response = await geoAPI.getMapData(layer)
        if (!cancelled) {
          setRows(response.features ?? [])
          setLastUpdated(response.last_updated)
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Erreur de chargement')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [layer])

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase()

    return rows
      .filter((row) => !zoneFilter || row.zone_sismique === zoneFilter)
      .filter((row) => !wilayaFilter || row.wilaya_code === wilayaFilter)
      .filter((row) => {
        if (!term) return true

        return [
          row.commune_name,
          row.wilaya_name,
          row.commune_code,
          row.wilaya_code,
        ]
          .join(' ')
          .toLowerCase()
          .includes(term)
      })
      .sort((a, b) => b.layer_value - a.layer_value)
  }, [rows, search, wilayaFilter, zoneFilter])

  useEffect(() => {
    if (!filteredRows.length) {
      setSelectedKey(null)
      return
    }

    if (!selectedKey || !filteredRows.some((row) => rowKey(row) === selectedKey)) {
      setSelectedKey(rowKey(filteredRows[0]))
    }
  }, [filteredRows, selectedKey])

  const selected = filteredRows.find((row) => rowKey(row) === selectedKey) ?? null

  const wilayaBreakdown = useMemo(() => {
    const grouped = new Map()

    for (const row of filteredRows) {
      const current = grouped.get(row.wilaya_code) || {
        wilaya_code: row.wilaya_code,
        wilaya_name: row.wilaya_name,
        policies: 0,
        exposure: 0,
        layer_value: 0,
      }

      current.policies += row.policy_count
      current.exposure += row.total_exposure
      current.layer_value += row.layer_value

      grouped.set(row.wilaya_code, current)
    }

    return [...grouped.values()]
      .sort((a, b) => b.layer_value - a.layer_value)
      .slice(0, 10)
  }, [filteredRows])

  const totalPolicies = filteredRows.reduce((sum, row) => sum + row.policy_count, 0)
  const totalExposure = filteredRows.reduce((sum, row) => sum + row.total_exposure, 0)

  if (loading) {
    return (
      <main style={S.loadingPage}>
        <LoadingSpinner size={36} />
      </main>
    )
  }

  if (error) {
    return (
      <main style={S.loadingPage}>
        <div style={S.errorBox}>{error}</div>
      </main>
    )
  }

  return (
    <main style={S.page} className="page-fade">
      <div style={S.topbar}>
        <div>
          <div style={S.title}>Atlas des Communes</div>
          <div style={S.subtitle}>
            Données live issues de `/api/geo/map-data` · mise à jour {formatDateTime(lastUpdated)}
          </div>
        </div>

        <div style={S.layerTabs}>
          {Object.entries(LAYER_META).map(([id, meta]) => (
            <button
              key={id}
              onClick={() => setLayer(id)}
              style={{
                ...S.layerBtn,
                borderColor: layer === id ? meta.color : 'var(--border)',
                color: layer === id ? meta.color : 'var(--text-tertiary)',
                background: layer === id ? `${meta.color}10` : 'transparent',
              }}
            >
              <Layers size={13} />
              {meta.label}
            </button>
          ))}
        </div>
      </div>

      <div style={S.statsGrid}>
        <Stat label="Communes filtrées" value={formatInteger(filteredRows.length)} note="Nombre de communes visibles" />
        <Stat label="Polices" value={formatInteger(totalPolicies)} note="Somme sur les communes filtrées" />
        <Stat label="Capital assuré" value={formatCompactDzd(totalExposure)} note="Exposition agrégée" />
        <Stat label={LAYER_META[layer].metric} value={selected ? selected.layer_value.toFixed(2) : '—'} note="Valeur de la commune sélectionnée" />
      </div>

      <div style={S.filterBar}>
        <div style={S.searchBox}>
          <Search size={14} color="var(--text-quaternary)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une commune ou une wilaya"
            style={S.searchInput}
          />
        </div>

        <div style={S.filterGroup}>
          <Filter size={14} color="var(--text-quaternary)" />
          <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} style={S.select}>
            <option value="">Toutes zones</option>
            {['0', 'I', 'IIa', 'IIb', 'III'].map((zone) => (
              <option key={zone} value={zone}>Zone {zone}</option>
            ))}
          </select>
          <select value={wilayaFilter} onChange={(e) => setWilayaFilter(e.target.value)} style={S.select}>
            <option value="">Toutes wilayas</option>
            {wilayas.map((wilaya) => (
              <option key={wilaya.code} value={wilaya.code}>
                {wilaya.code} · {wilaya.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={S.layout}>
        <div style={S.tableCard}>
          <div style={S.cardTitle}>Classement des communes</div>
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  {['Commune', 'Wilaya', 'Zone', 'Polices', 'Exposition', 'Valeur'].map((label) => (
                    <th key={label} style={S.th}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={() => setSelectedKey(rowKey(row))}
                    style={{
                      ...S.row,
                      background:
                        rowKey(row) === selectedKey
                          ? 'var(--primary-50)'
                          : 'transparent',
                    }}
                  >
                    <td style={S.tdStrong}>{row.commune_name}</td>
                    <td style={S.td}>{row.wilaya_name}</td>
                    <td style={S.td}><ZoneBadge zone={row.zone_sismique} /></td>
                    <td style={S.tdMono}>{formatInteger(row.policy_count)}</td>
                    <td style={S.tdMono}>{formatCompactDzd(row.total_exposure)}</td>
                    <td style={{ ...S.tdMono, color: LAYER_META[layer].color }}>{row.layer_value.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={S.sideCol}>
          <div style={S.sideCard}>
            <div style={S.cardTitle}>Commune sélectionnée</div>
            {selected ? (
              <>
                <div style={S.selectedTitle}>
                  <MapPin size={15} color="var(--primary-500)" />
                  {selected.commune_name}
                </div>
                <div style={S.selectedMeta}>{selected.wilaya_name} · code {selected.wilaya_code}</div>
                <div style={{ marginTop: 10 }}>
                  <ZoneBadge zone={selected.zone_sismique} size="md" showLabel />
                </div>

                <div style={S.metricsList}>
                  {[
                    ['Polices', formatInteger(selected.policy_count)],
                    ['Exposition', formatCompactDzd(selected.total_exposure)],
                    ['Rétention nette', formatCompactDzd(selected.net_retention)],
                    ['Score moyen', selected.avg_risk_score.toFixed(2)],
                    [LAYER_META[layer].metric, selected.layer_value.toFixed(2)],
                  ].map(([label, value]) => (
                    <div key={label} style={S.metricRow}>
                      <span style={S.metricLabel}>{label}</span>
                      <span style={S.metricValue}>{value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={S.emptyText}>Aucune commune disponible.</div>
            )}
          </div>

          <div style={S.sideCard}>
            <div style={S.cardTitle}>Top wilayas sur le filtre actuel</div>
            <div style={S.rankList}>
              {wilayaBreakdown.map((row) => {
                const maxValue = wilayaBreakdown[0]?.layer_value || 1
                return (
                  <div key={row.wilaya_code} style={S.rankRow}>
                    <div style={S.rankHeader}>
                      <span style={S.rankName}>{row.wilaya_name}</span>
                      <span style={S.rankValue}>{row.layer_value.toFixed(2)}</span>
                    </div>
                    <div style={S.rankBarBg}>
                      <div
                        style={{
                          ...S.rankBarFill,
                          width: `${(row.layer_value / maxValue) * 100}%`,
                          background: LAYER_META[layer].color,
                        }}
                      />
                    </div>
                    <div style={S.rankMeta}>
                      {formatInteger(row.policies)} polices · {formatCompactDzd(row.exposure)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

const S = {
  page: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 24px',
  },
  loadingPage: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    padding: '16px 18px',
    borderRadius: 12,
    background: 'var(--danger-muted)',
    border: '1px solid var(--danger-border)',
    color: 'var(--text-primary)',
  },
  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  title: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: '1rem',
    color: 'var(--text-primary)',
  },
  subtitle: {
    marginTop: 4,
    fontSize: '0.78rem',
    color: 'var(--text-tertiary)',
  },
  layerTabs: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  layerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '8px 12px',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '0.76rem',
    fontWeight: 600,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
    marginBottom: 14,
  },
  statCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '15px 16px',
  },
  statLabel: {
    fontSize: '0.66rem',
    textTransform: 'uppercase',
    letterSpacing: '0.7px',
    color: 'var(--text-quaternary)',
    marginBottom: 8,
  },
  statValue: {
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 700,
    fontSize: '1rem',
    color: 'var(--text-primary)',
    marginBottom: 6,
  },
  statNote: {
    fontSize: '0.72rem',
    color: 'var(--text-tertiary)',
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minWidth: 280,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '0 12px',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: 'var(--text-primary)',
    padding: '10px 0',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  select: {
    minWidth: 160,
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-primary)',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1.35fr 0.85fr',
    gap: 14,
    alignItems: 'start',
  },
  tableCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  sideCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  sideCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '16px 18px',
  },
  cardTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 600,
    fontSize: '0.88rem',
    color: 'var(--text-primary)',
    marginBottom: 12,
  },
  tableWrap: {
    maxHeight: '68vh',
    overflow: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.78rem',
  },
  th: {
    position: 'sticky',
    top: 0,
    zIndex: 1,
    background: 'var(--surface)',
    textAlign: 'left',
    padding: '10px 12px',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text-quaternary)',
    textTransform: 'uppercase',
    fontSize: '0.66rem',
    letterSpacing: '0.7px',
  },
  row: {
    cursor: 'pointer',
    borderBottom: '1px solid var(--border-subtle)',
  },
  td: {
    padding: '11px 12px',
    color: 'var(--text-secondary)',
  },
  tdStrong: {
    padding: '11px 12px',
    color: 'var(--text-primary)',
    fontWeight: 600,
  },
  tdMono: {
    padding: '11px 12px',
    color: 'var(--text-secondary)',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.72rem',
  },
  selectedTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: 'var(--text-primary)',
    fontWeight: 600,
    fontSize: '0.92rem',
  },
  selectedMeta: {
    marginTop: 4,
    color: 'var(--text-tertiary)',
    fontSize: '0.75rem',
  },
  metricsList: {
    marginTop: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  metricRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricLabel: {
    color: 'var(--text-tertiary)',
    fontSize: '0.76rem',
  },
  metricValue: {
    color: 'var(--text-primary)',
    fontSize: '0.76rem',
    fontFamily: "'JetBrains Mono', monospace",
    textAlign: 'right',
  },
  rankList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  rankRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  rankHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
  },
  rankName: {
    color: 'var(--text-primary)',
    fontSize: '0.78rem',
    fontWeight: 600,
  },
  rankValue: {
    color: 'var(--text-primary)',
    fontSize: '0.72rem',
    fontFamily: "'JetBrains Mono', monospace",
  },
  rankBarBg: {
    height: 6,
    background: 'var(--border-subtle)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  rankBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  rankMeta: {
    color: 'var(--text-tertiary)',
    fontSize: '0.7rem',
  },
  emptyText: {
    color: 'var(--text-tertiary)',
    fontSize: '0.78rem',
  },
}
