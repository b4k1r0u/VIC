import React, { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import { geoAPI } from '../api/geo'
import { policiesAPI } from '../api/policies'
import {
  formatCompactDzd,
  formatInteger,
  formatPercent,
  formatRate,
} from '../utils/format'

const ZONE_COLORS = {
  III: '#dc2626',
  IIb: '#d97706',
  IIa: '#ca8a04',
  I: '#059669',
  '0': '#2563eb',
}

function SectionTitle({ children }) {
  return <div style={S.sectionTitle}>{children}</div>
}

function SummaryCard({ label, value, note, color = 'var(--text-primary)' }) {
  return (
    <div style={S.summaryCard}>
      <div style={S.summaryLabel}>{label}</div>
      <div style={{ ...S.summaryValue, color }}>{value}</div>
      <div style={S.summaryNote}>{note}</div>
    </div>
  )
}

function TooltipCard({ active, payload }) {
  if (!active || !payload?.length) return null

  return (
    <div style={S.tooltip}>
      {payload.map((entry) => (
        <div key={entry.name} style={{ color: entry.color, marginBottom: 4 }}>
          <strong>{entry.name}</strong>: {formatPercent(entry.value)}
        </div>
      ))}
    </div>
  )
}

export default function BalancePage() {
  const [adequacyRows, setAdequacyRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const [premiumAdequacy, policySummary] = await Promise.all([
          geoAPI.getPremiumAdequacy(),
          policiesAPI.getSummary(),
        ])

        if (!cancelled) {
          setAdequacyRows(premiumAdequacy)
          setSummary(policySummary)
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
  }, [])

  const zoneShare = useMemo(() => {
    if (!summary) return []

    return summary.by_zone.map((row) => ({
      zone: row.zone,
      share:
        summary.total_policies > 0
          ? (row.policy_count / summary.total_policies) * 100
          : 0,
    }))
  }, [summary])

  const worstSegments = useMemo(
    () => [...adequacyRows].sort((a, b) => a.premium_gap_pct - b.premium_gap_pct).slice(0, 8),
    [adequacyRows]
  )

  const worstSegment = worstSegments[0] ?? null
  const zoneIII = zoneShare.find((row) => row.zone === 'III')?.share ?? 0
  const zoneIIb = zoneShare.find((row) => row.zone === 'IIb')?.share ?? 0

  if (loading) {
    return (
      <main style={S.loadingPage}>
        <LoadingSpinner size={36} />
      </main>
    )
  }

  if (error || !summary) {
    return (
      <main style={S.loadingPage}>
        <div style={S.errorBox}>{error || 'Les donnees recues sont incompletes.'}</div>
      </main>
    )
  }

  return (
    <main style={S.page} className="page-fade">
      <SectionTitle>Équilibre du portefeuille</SectionTitle>

      <div style={S.hero}>
        <div style={S.heroMain}>
          <div style={S.heroTitle}>Lecture de la concentration et de l’adéquation tarifaire</div>
          <div style={S.heroText}>
            Cette vue croise les indicateurs du portefeuille et l’adéquation tarifaire pour
            repérer les zones les plus concentrées et les segments les plus sous-tarifés.
          </div>
        </div>

        <div style={S.heroStats}>
          <SummaryCard
            label="Zone III"
            value={formatPercent(zoneIII)}
            note="Part du portefeuille en zone critique"
            color="var(--danger)"
          />
          <SummaryCard
            label="Zone IIb"
            value={formatPercent(zoneIIb)}
            note="Part du portefeuille en zone élevée"
            color="var(--warning)"
          />
          <SummaryCard
            label="Capital assuré"
            value={formatCompactDzd(summary.total_capital_assure)}
            note="Exposition globale"
          />
          <SummaryCard
            label="Prime nette"
            value={formatCompactDzd(summary.total_prime_nette)}
            note="Prime observée"
            color="var(--success)"
          />
        </div>
      </div>

      <SectionTitle>Concentration par zone</SectionTitle>

      <div style={S.card}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={zoneShare} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="zone" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
              axisLine={false}
              tickLine={false}
              unit="%"
            />
            <Tooltip content={<TooltipCard />} />
            <Bar dataKey="share" name="Part du portefeuille" radius={[8, 8, 0, 0]}>
              {zoneShare.map((row) => (
                <Cell key={row.zone} fill={ZONE_COLORS[row.zone] || '#64748b'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <SectionTitle>Segments les plus sous-tarifés</SectionTitle>

      <div style={S.highlightRow}>
        <div style={S.highlightCard}>
          <div style={S.highlightLabel}>Segment le plus sous-tarifé</div>
          {worstSegment ? (
            <>
              <div style={S.highlightTitle}>
                Zone {worstSegment.zone} · {worstSegment.type_risque}
              </div>
              <div style={S.highlightGap}>{formatPercent(worstSegment.premium_gap_pct)}</div>
              <div style={S.highlightMeta}>
                Observé {formatRate(worstSegment.observed_rate, 6)} vs adéquat {formatRate(worstSegment.adequate_rate, 6)}
              </div>
            </>
          ) : (
            <div style={S.highlightMeta}>Aucune donnée.</div>
          )}
        </div>

        <div style={S.highlightCard}>
          <div style={S.highlightLabel}>Exposition concernée</div>
          <div style={S.highlightTitle}>
            {worstSegment ? formatCompactDzd(worstSegment.total_exposure) : '—'}
          </div>
          <div style={S.highlightMeta}>
            {worstSegment ? `${formatInteger(worstSegment.policy_count)} polices` : '—'}
          </div>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                {['Zone', 'Type', 'Observé', 'Adéquat', 'Gap', 'Polices', 'Exposition'].map((label) => (
                  <th key={label} style={S.th}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {worstSegments.map((row) => (
                <tr key={`${row.zone}-${row.type_risque}`} style={S.row}>
                  <td style={S.tdStrong}>Zone {row.zone}</td>
                  <td style={S.td}>{row.type_risque}</td>
                  <td style={S.tdMono}>{formatRate(row.observed_rate, 6)}</td>
                  <td style={S.tdMono}>{formatRate(row.adequate_rate, 6)}</td>
                  <td style={{ ...S.tdMono, color: row.premium_gap_pct < -50 ? 'var(--danger)' : 'var(--warning)' }}>
                    {formatPercent(row.premium_gap_pct)}
                  </td>
                  <td style={S.tdMono}>{formatInteger(row.policy_count)}</td>
                  <td style={S.tdMono}>{formatCompactDzd(row.total_exposure)}</td>
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
    padding: '16px 18px',
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
  hero: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: 14,
    alignItems: 'stretch',
  },
  heroMain: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '20px 22px',
  },
  heroTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: '1rem',
    color: 'var(--text-primary)',
  },
  heroText: {
    marginTop: 10,
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
    lineHeight: 1.7,
    maxWidth: 560,
  },
  heroStats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  summaryCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '16px 18px',
  },
  summaryLabel: {
    fontSize: '0.66rem',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color: 'var(--text-quaternary)',
    marginBottom: 8,
  },
  summaryValue: {
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 700,
    fontSize: '1rem',
    marginBottom: 6,
  },
  summaryNote: {
    fontSize: '0.72rem',
    color: 'var(--text-tertiary)',
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '16px 18px',
  },
  highlightRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 14,
    marginBottom: 14,
  },
  highlightCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '18px 20px',
  },
  highlightLabel: {
    fontSize: '0.66rem',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color: 'var(--text-quaternary)',
    marginBottom: 10,
  },
  highlightTitle: {
    fontSize: '0.92rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  highlightGap: {
    marginTop: 8,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '1.3rem',
    fontWeight: 700,
    color: 'var(--danger)',
  },
  highlightMeta: {
    marginTop: 8,
    color: 'var(--text-tertiary)',
    fontSize: '0.76rem',
    lineHeight: 1.6,
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
    textTransform: 'uppercase',
    letterSpacing: '0.7px',
    fontSize: '0.66rem',
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
