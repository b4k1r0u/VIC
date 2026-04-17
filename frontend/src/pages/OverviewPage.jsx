import React, { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertTriangle, DollarSign, FileText, Shield, TrendingUp } from 'lucide-react'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ZoneBadge from '../components/shared/ZoneBadge'
import { geoAPI } from '../api/geo'
import { policiesAPI } from '../api/policies'
import {
  formatCompactDzd,
  formatInteger,
  formatPercent,
} from '../utils/format'

const ZONE_COLORS = {
  III: '#dc2626',
  IIb: '#d97706',
  IIa: '#ca8a04',
  I: '#059669',
  '0': '#2563eb',
}

const EMPTY_STATE = { kpis: null, hotspots: [], summary: null }

function SectionTitle({ children }) {
  return <div style={S.sectionTitle}>{children}</div>
}

function StatCard({ label, value, note, Icon, color = 'var(--text-primary)' }) {
  return (
    <div style={S.statCard}>
      <div style={S.statHeader}>
        <span style={S.statLabel}>{label}</span>
        <Icon size={15} color="var(--text-quaternary)" />
      </div>
      <div style={{ ...S.statValue, color }}>{value}</div>
      <div style={S.statNote}>{note}</div>
    </div>
  )
}

function ChartTooltip({ active, payload, formatter }) {
  if (!active || !payload?.length) return null

  return (
    <div style={S.tooltip}>
      {payload.map((entry) => (
        <div key={entry.name} style={{ marginBottom: 4, color: entry.color }}>
          <strong>{entry.name}</strong>: {formatter(entry.value, entry.payload)}
        </div>
      ))}
    </div>
  )
}

export default function OverviewPage() {
  const [state, setState] = useState(EMPTY_STATE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const [kpis, hotspots, summary] = await Promise.all([
          geoAPI.getKPIs(),
          geoAPI.getHotspots(10),
          policiesAPI.getSummary(),
        ])

        if (!cancelled) {
          setState({ kpis, hotspots, summary })
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Erreur de chargement')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const zoneData = useMemo(() => {
    if (!state.summary) return []

    return state.summary.by_zone.map((row) => ({
      name: `Zone ${row.zone}`,
      zone: row.zone,
      value: row.policy_count,
      exposure: row.capital_assure,
      pct: state.summary.total_policies
        ? (row.policy_count / state.summary.total_policies) * 100
        : 0,
    }))
  }, [state.summary])

  const yearData = useMemo(() => {
    if (!state.summary) return []

    return [...state.summary.by_year]
      .sort((a, b) => a.policy_year - b.policy_year)
      .map((row) => ({
        year: row.policy_year,
        policies: row.policy_count,
        capital: row.capital_assure,
        premium: row.prime_nette,
      }))
  }, [state.summary])

  const zoneThreeShare = state.kpis?.by_zone.find((row) => row.zone === 'III')?.pct ?? 0

  if (loading) {
    return (
      <main style={S.loadingPage}>
        <LoadingSpinner size={36} />
      </main>
    )
  }

  if (error || !state.kpis || !state.summary) {
    return (
      <main style={S.loadingPage}>
        <div style={S.errorBox}>
          <strong>Impossible de charger le portefeuille.</strong>
          <span>{error || 'Réponse backend incomplète.'}</span>
        </div>
      </main>
    )
  }

  return (
    <main style={S.page} className="page-fade">
      <SectionTitle>Portefeuille Live</SectionTitle>

      <div style={S.statsGrid}>
        <StatCard
          label="Total Polices"
          value={formatInteger(state.kpis.total_policies)}
          note="Portefeuille actuellement chargé depuis le backend"
          Icon={FileText}
        />
        <StatCard
          label="Capital Assuré"
          value={formatCompactDzd(state.summary.total_capital_assure)}
          note="Somme des capitaux assurés"
          Icon={DollarSign}
        />
        <StatCard
          label="Rétention Nette"
          value={formatCompactDzd(state.kpis.net_retention)}
          note="Calcul backend sur les données agrégées"
          Icon={Shield}
        />
        <StatCard
          label="Prime Nette"
          value={formatCompactDzd(state.summary.total_prime_nette)}
          note="Primes annuelles observées"
          Icon={TrendingUp}
          color="var(--success)"
        />
        <StatCard
          label="Zone III"
          value={formatPercent(zoneThreeShare)}
          note="Part du portefeuille en zone critique"
          Icon={AlertTriangle}
          color="var(--danger)"
        />
      </div>

      <SectionTitle>Répartition</SectionTitle>

      <div style={S.twoCol}>
        <div style={S.card}>
          <div style={S.cardTitle}>Distribution par zone sismique</div>
          <div style={S.cardSub}>Basé sur `/api/policies/summary`</div>
          <div style={S.pieRow}>
            <ResponsiveContainer width={190} height={190}>
              <PieChart>
                <Pie data={zoneData} dataKey="value" innerRadius={52} outerRadius={82} paddingAngle={2}>
                  {zoneData.map((row) => (
                    <Cell key={row.zone} fill={ZONE_COLORS[row.zone] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip formatter={(value) => `${formatInteger(value)} polices`} />} />
              </PieChart>
            </ResponsiveContainer>

            <div style={S.zoneLegend}>
              {zoneData.map((row) => (
                <div key={row.zone} style={S.zoneLegendRow}>
                  <div style={{ ...S.zoneSwatch, background: ZONE_COLORS[row.zone] || '#64748b' }} />
                  <div style={{ flex: 1 }}>
                    <div style={S.zoneLegendTitle}>{row.name}</div>
                    <div style={S.zoneLegendMeta}>
                      {formatInteger(row.value)} polices · {formatCompactDzd(row.exposure)}
                    </div>
                  </div>
                  <strong style={S.zoneLegendPct}>{formatPercent(row.pct)}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>Évolution annuelle</div>
          <div style={S.cardSub}>Capital assuré par année de souscription</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={yearData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="capitalFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${Math.round(value / 1e9)} Md`}
              />
              <Tooltip content={<ChartTooltip formatter={(value) => formatCompactDzd(value)} />} />
              <Area
                type="monotone"
                dataKey="capital"
                name="Capital"
                stroke="#14b8a6"
                strokeWidth={2}
                fill="url(#capitalFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <SectionTitle>Hotspots</SectionTitle>

      <div style={S.card}>
        <div style={S.cardTitle}>Top communes par concentration</div>
        <div style={S.cardSub}>Source: `/api/geo/hotspots`</div>
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                {['#', 'Commune', 'Wilaya', 'Zone', 'Polices', 'Exposition', 'Score'].map((label) => (
                  <th key={label} style={S.th}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.hotspots.map((item) => (
                <tr key={`${item.wilaya_code}-${item.commune_code}`} style={S.row}>
                  <td style={S.td}>{item.rank}</td>
                  <td style={S.tdStrong}>{item.commune_name}</td>
                  <td style={S.td}>{item.wilaya_name}</td>
                  <td style={S.td}><ZoneBadge zone={item.zone_sismique} /></td>
                  <td style={S.tdMono}>{formatInteger(item.policy_count)}</td>
                  <td style={S.tdMono}>{formatCompactDzd(item.total_exposure)}</td>
                  <td style={{ ...S.tdMono, color: 'var(--warning)' }}>{item.hotspot_score.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '18px 20px',
    borderRadius: 12,
    background: 'var(--danger-muted)',
    border: '1px solid var(--danger-border)',
    color: 'var(--text-primary)',
  },
  sectionTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '0.72rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1.4px',
    color: 'var(--text-quaternary)',
    marginBottom: 12,
    marginTop: 20,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
  },
  statCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '16px 18px',
    boxShadow: 'var(--shadow-card)',
  },
  statHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: '0.68rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color: 'var(--text-quaternary)',
  },
  statValue: {
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 700,
    fontSize: '1.1rem',
    marginBottom: 6,
  },
  statNote: {
    fontSize: '0.74rem',
    color: 'var(--text-tertiary)',
    lineHeight: 1.5,
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1.15fr 1fr',
    gap: 14,
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '18px 20px',
    boxShadow: 'var(--shadow-card)',
  },
  cardTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 600,
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
  },
  cardSub: {
    marginTop: 4,
    marginBottom: 14,
    fontSize: '0.74rem',
    color: 'var(--text-tertiary)',
  },
  pieRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 18,
    flexWrap: 'wrap',
  },
  zoneLegend: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    flex: 1,
    minWidth: 240,
  },
  zoneLegendRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  zoneSwatch: {
    width: 10,
    height: 10,
    borderRadius: 4,
    flexShrink: 0,
  },
  zoneLegendTitle: {
    fontSize: '0.8rem',
    color: 'var(--text-primary)',
    fontWeight: 600,
  },
  zoneLegendMeta: {
    fontSize: '0.7rem',
    color: 'var(--text-tertiary)',
    marginTop: 2,
  },
  zoneLegendPct: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.75rem',
    color: 'var(--text-primary)',
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.78rem',
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text-quaternary)',
    fontSize: '0.68rem',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
  },
  row: {
    borderBottom: '1px solid var(--border-subtle)',
  },
  td: {
    padding: '12px',
    color: 'var(--text-secondary)',
  },
  tdStrong: {
    padding: '12px',
    color: 'var(--text-primary)',
    fontWeight: 600,
  },
  tdMono: {
    padding: '12px',
    color: 'var(--text-secondary)',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.72rem',
  },
  tooltip: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: '0.72rem',
    color: 'var(--text-primary)',
    boxShadow: 'var(--shadow-lg)',
  },
}
