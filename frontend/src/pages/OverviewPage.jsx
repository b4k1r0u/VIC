import React from 'react'
import { useCountUp, useVisible } from '../hooks/useCountUp'
import { ZONES, GROWTH, HOTSPOTS } from '../data/constants'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import {
  FileText, DollarSign, AlertTriangle, Scale,
  TrendingDown, TrendingUp,
} from 'lucide-react'

/* ── Zone color map for consistent rendering ── */
const ZONE_FILL = {
  'Zone III': '#dc2626',
  'Zone IIb': '#d97706',
  'Zone IIa': '#ca8a04',
  'Zone I': '#059669',
  'Zone 0': '#2563eb',
}

/* ── KPI definitions ── */
const KPI_LIST = [
  { label: 'Total Polices', raw: 113100, fmt: v => Math.round(v).toLocaleString('fr-FR'), unit: 'polices', Icon: FileText },
  { label: 'Exposition Estimée', raw: 1131, fmt: v => v.toFixed(0), unit: 'Mrd DZD', Icon: DollarSign },
  { label: 'Zone III Critique', raw: 30.5, fmt: v => v.toFixed(1) + '%', unit: 'du portfolio', Icon: AlertTriangle, status: 'danger' },
  { label: 'Balance Score', raw: 47, fmt: v => v.toFixed(0) + ' / 100', unit: 'score', Icon: Scale },
  { label: 'PML 200-ans', raw: 285, fmt: v => '~' + v.toFixed(0), unit: 'Mrd DZD', Icon: TrendingDown, status: 'danger' },
  { label: 'Prime Annuelle', raw: 351.4, fmt: v => v.toFixed(1), unit: 'M DZD', Icon: TrendingUp, status: 'success' },
]

function KpiCard({ item, delay }) {
  const val = useCountUp(item.raw, 1200 + delay)
  const valColor = item.status === 'danger' ? 'var(--danger)' : item.status === 'success' ? 'var(--success)' : 'var(--text-primary)'

  return (
    <div style={S.kpiCard} className="card-hover">
      <div style={S.kpiHeader}>
        <div style={S.kpiLabel}>{item.label}</div>
        <div style={S.kpiIcon}>
          <item.Icon size={14} color="var(--text-quaternary)" strokeWidth={1.8} />
        </div>
      </div>
      <div style={{ ...S.kpiValue, color: valColor }}>
        {item.fmt(val)}
      </div>
      <div style={S.kpiUnit}>{item.unit}</div>
    </div>
  )
}

/* ── Custom donut center label ── */
function DonutCenter({ cx, cy }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-6" fontSize={14} fontFamily="'JetBrains Mono', monospace" fontWeight="700" fill="var(--text-primary)">
        113 100
      </tspan>
      <tspan x={cx} dy={18} fontSize={10} fill="var(--text-tertiary)" fontFamily="'Plus Jakarta Sans', sans-serif">
        polices
      </tspan>
    </text>
  )
}

/* ── Score color ── */
const scoreColor = s => s >= 85 ? '#dc2626' : s >= 70 ? '#d97706' : '#ca8a04'

/* ── Status label ── */
const statusInfo = z =>
  z === 'III' ? ['var(--danger-muted)', 'var(--danger)', 'CRITIQUE']
    : z === 'IIb' ? ['var(--warning-muted)', 'var(--warning)', 'ÉLEVÉ']
      : ['rgba(202,138,4,0.08)', '#ca8a04', 'MODÉRÉ']

/* ── Tooltip ── */
const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={S.tooltip}>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          <strong>{p.name}</strong>: {p.value?.toLocaleString('fr-FR')}
        </div>
      ))}
    </div>
  )
}

const SectionTitle = ({ children }) => (
  <div style={S.sectionTitle}>
    {children}
  </div>
)

/* ══════════════════════════════════════════════════════════════ */
export default function OverviewPage() {
  const barVisible = useVisible(700)

  return (
    <main style={S.page} className="page-fade">
      <SectionTitle>Indicateurs Clés — Portefeuille 2025</SectionTitle>

      <div style={S.kpiGrid}>
        {KPI_LIST.map((k, i) => <KpiCard key={k.label} item={k} delay={i * 90} />)}
      </div>

      <SectionTitle>Répartition &amp; Évolution</SectionTitle>
      <div style={S.twoCol}>

        {/* Donut */}
        <div style={S.chartCard}>
          <div style={S.chartTitle}>Distribution par Zone Sismique</div>
          <div style={S.chartSub}>RPA99 · Répartition du portefeuille</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={ZONES} dataKey="pct" innerRadius={58} outerRadius={82}
                  paddingAngle={2} startAngle={90} endAngle={-270}>
                  {ZONES.map((z, i) => (
                    <Cell key={i} fill={ZONE_FILL[z.name] || z.color} stroke="none" opacity={0.85} />
                  ))}
                </Pie>
                <DonutCenter cx={90} cy={90} />
                <Tooltip
                  formatter={(v, n, p) => [`${v}% — ${p.payload.policies.toLocaleString('fr-FR')} polices`, '']}
                  contentStyle={S.tooltipStyle}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {ZONES.map(z => {
                const fill = ZONE_FILL[z.name] || z.color
                return (
                  <div key={z.name} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.78rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 3, background: fill, flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{z.name}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.75rem' }}>
                      {z.pct}%
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-quaternary)', fontFamily: "'JetBrains Mono', monospace" }}>{z.si} Mrd</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Area Chart */}
        <div style={S.chartCard}>
          <div style={S.chartTitle}>Évolution du Portefeuille 2023–2025</div>
          <div style={S.chartSub}>Nombre de polices par zone sismique</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={GROWTH} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                {[['III', '#dc2626'], ['IIb', '#d97706'], ['IIa', '#ca8a04'], ['I', '#059669'], ['Z0', '#2563eb']].map(([k, c]) => (
                  <linearGradient key={k} id={`g${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={c} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={c} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              {[['III', '#dc2626'], ['IIb', '#d97706'], ['IIa', '#ca8a04'], ['I', '#059669'], ['Z0', '#2563eb']].map(([k, c]) => (
                <Area key={k} type="monotone" dataKey={k} stackId="1"
                  stroke={c} strokeWidth={1.5} fill={`url(#g${k})`} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hotspot Table */}
      <SectionTitle>Top 10 — Points de Concentration</SectionTitle>
      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr>
              {['#', 'Wilaya', 'Zone', 'Polices', 'SI Estimé (MDZD)', 'Score Risque', 'Statut'].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOTSPOTS.map(h => {
              const [rowBg, fg, label] = statusInfo(h.zone)
              const zoneColor = { III: '#dc2626', IIb: '#d97706', IIa: '#ca8a04' }[h.zone] || '#059669'
              return (
                <tr key={h.rank} className="table-row-hover"
                  style={{ transition: 'background 0.15s' }}>
                  <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: 'var(--text-quaternary)' }}>
                    {String(h.rank).padStart(2, '0')}
                  </td>
                  <td style={{ ...S.td, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {h.wilaya} <span style={{ color: 'var(--text-quaternary)', fontWeight: 400 }}>({h.code})</span>
                  </td>
                  <td style={S.td}>
                    <span style={{
                      background: `${zoneColor}10`, color: zoneColor,
                      padding: '3px 8px', borderRadius: 4,
                      fontSize: '0.68rem', fontWeight: 600,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {h.zone}
                    </span>
                  </td>
                  <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-secondary)' }}>{h.policies.toLocaleString('fr-FR')}</td>
                  <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-secondary)' }}>{h.si.toLocaleString('fr-FR')}</td>
                  <td style={S.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 4, background: 'var(--border-subtle)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 2,
                          width: barVisible ? h.score + '%' : '0%',
                          background: scoreColor(h.score),
                          transition: 'width 0.8s ease',
                        }} />
                      </div>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', fontWeight: 600, color: scoreColor(h.score), minWidth: 20, textAlign: 'right' }}>
                        {h.score}
                      </span>
                    </div>
                  </td>
                  <td style={S.td}>
                    <span style={{
                      background: rowBg, color: fg,
                      padding: '3px 10px', borderRadius: 4,
                      fontSize: '0.65rem', fontWeight: 600,
                    }}>
                      {label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div style={{ height: 24 }} />
    </main>
  )
}

const S = {
  page: { flex: 1, overflowY: 'auto', padding: '20px 24px' },
  sectionTitle: {
    fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.7rem', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-quaternary)',
    marginBottom: 14, marginTop: 28,
    display: 'flex', alignItems: 'center', gap: 10,
  },
  kpiGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(6,1fr)',
    gap: 12,
  },
  kpiCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '16px 18px',
    boxShadow: 'var(--shadow-card)',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'default',
  },
  kpiHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
  },
  kpiLabel: {
    fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '0.8px', color: 'var(--text-tertiary)',
  },
  kpiIcon: {
    width: 28, height: 28, borderRadius: 6, background: 'var(--bg-subtle)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  kpiValue: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 'clamp(1rem,1.8vw,1.35rem)', fontWeight: 700, lineHeight: 1,
    marginBottom: 6,
  },
  kpiUnit: { fontSize: '0.65rem', color: 'var(--text-quaternary)', fontWeight: 500 },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  chartCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '18px 20px',
    boxShadow: 'var(--shadow-card)',
  },
  chartTitle: {
    fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.85rem',
    fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2,
  },
  chartSub: {
    fontSize: '0.72rem', color: 'var(--text-quaternary)', marginBottom: 16,
  },
  tableWrap: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-card)',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    background: 'var(--bg-subtle)',
    fontSize: '0.63rem', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.8px',
    color: 'var(--text-tertiary)', padding: '10px 16px',
    textAlign: 'left', borderBottom: '1px solid var(--border)',
  },
  td: {
    padding: '10px 16px', fontSize: '0.78rem',
    color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)',
  },
  tooltip: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '10px 14px', fontSize: '0.72rem',
    boxShadow: 'var(--shadow-lg)',
  },
  tooltipStyle: {
    background: 'var(--surface)', borderRadius: 8,
    border: '1px solid var(--border)', fontSize: '0.72rem',
    color: 'var(--text-primary)',
  },
}
