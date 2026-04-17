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

/* ── KPI definitions ── */
const KPI_LIST = [
  { label: 'Total Polices',       raw: 113100, fmt: v => Math.round(v).toLocaleString('fr-FR'),  unit: 'polices',     color: '#3b82f6',  Icon: FileText,       accent: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)' },
  { label: 'Exposition Estimée',  raw: 1131,   fmt: v => v.toFixed(0),                            unit: 'Mrd DZD',     color: '#a78bfa',  Icon: DollarSign,     accent: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.25)' },
  { label: 'Zone III Critique',   raw: 30.5,   fmt: v => v.toFixed(1) + '%',                      unit: 'du portfolio', color: '#ef4444',  Icon: AlertTriangle,  accent: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)' },
  { label: 'Balance Score',       raw: 47,     fmt: v => v.toFixed(0) + ' / 100',                 unit: 'score',       color: '#f59e0b',  Icon: Scale,          accent: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
  { label: 'PML 200-ans',         raw: 285,    fmt: v => '~' + v.toFixed(0),                      unit: 'Mrd DZD',     color: '#ef4444',  Icon: TrendingDown,   accent: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)' },
  { label: 'Prime Annuelle',      raw: 351.4,  fmt: v => v.toFixed(1),                            unit: 'M DZD',       color: '#22c55e',  Icon: TrendingUp,     accent: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.25)' },
]

function KpiCard({ item, delay }) {
  const val = useCountUp(item.raw, 1200 + delay)
  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${item.border}`,
      borderRadius: 'var(--radius-lg)',
      padding: '18px 20px',
      boxShadow: 'var(--sh-sm)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default',
    }}
    className="card-hover"
    >
      {/* Glow accent */}
      <div style={{
        position:'absolute', inset:0, borderRadius:'inherit',
        background: `radial-gradient(ellipse at top right, ${item.accent} 0%, transparent 70%)`,
        pointerEvents:'none',
      }} />
      <div style={{ position:'relative', zIndex:1 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'1.5px', color:'var(--text-3)' }}>
            {item.label}
          </div>
          <div style={{
            width:32, height:32, borderRadius:9, background:item.accent,
            border:`1px solid ${item.border}`,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <item.Icon size={15} color={item.color} strokeWidth={2} />
          </div>
        </div>
        <div style={{
          fontFamily:'JetBrains Mono, monospace',
          fontSize:'clamp(1.1rem,2vw,1.45rem)', fontWeight:700, lineHeight:1,
          color: item.color, marginBottom:5,
        }}>
          {item.fmt(val)}
        </div>
        <div style={{ fontSize:'0.62rem', color:'var(--text-3)', fontWeight:500 }}>{item.unit}</div>
      </div>
    </div>
  )
}

/* ── Custom donut center label ── */
function DonutCenter({ cx, cy }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-7" fontSize={13} fontFamily="JetBrains Mono,monospace" fontWeight="700" fill="#f1f5f9">
        113 100
      </tspan>
      <tspan x={cx} dy={18} fontSize={9} fill="#64748b" fontFamily="Plus Jakarta Sans,sans-serif">
        polices
      </tspan>
    </text>
  )
}

/* ── Score color ── */
const scoreColor = s => s >= 85 ? '#ef4444' : s >= 70 ? '#f59e0b' : '#eab308'

/* ── Status label ── */
const statusInfo = z =>
  z === 'III'  ? ['rgba(239,68,68,0.12)',  '#f87171', '🔴 CRITIQUE']
  : z === 'IIb' ? ['rgba(245,158,11,0.12)', '#fbbf24', '🟠 ÉLEVÉ']
  : ['rgba(234,179,8,0.12)', '#facc15', '🟡 MODÉRÉ']

/* ── Tooltip ── */
const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background:'var(--surface2)', border:'1px solid var(--border)',
      borderRadius:10, padding:'10px 14px', fontSize:'0.72rem',
      boxShadow:'var(--sh-lg)',
    }}>
      {payload.map(p => (
        <div key={p.name} style={{ color:p.color, marginBottom:2 }}>
          <strong>{p.name}</strong>: {p.value?.toLocaleString('fr-FR')}
        </div>
      ))}
    </div>
  )
}

const SectionTitle = ({ children }) => (
  <div style={{
    fontFamily:'Syne, sans-serif', fontSize:'0.6rem', fontWeight:700,
    textTransform:'uppercase', letterSpacing:'2.5px', color:'var(--text-3)',
    marginBottom:14, marginTop:26,
    display:'flex', alignItems:'center', gap:10,
  }}>
    <div style={{ height:1, width:20, background:'var(--border)', borderRadius:2 }} />
    {children}
    <div style={{ height:1, flex:1, background:'var(--border)', borderRadius:2 }} />
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
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <ResponsiveContainer width={190} height={190}>
              <PieChart>
                <Pie data={ZONES} dataKey="pct" innerRadius={60} outerRadius={86}
                  paddingAngle={2} startAngle={90} endAngle={-270}>
                  {ZONES.map((z, i) => (
                    <Cell key={i} fill={z.color} stroke="none" opacity={0.9} />
                  ))}
                </Pie>
                <DonutCenter cx={95} cy={95} />
                <Tooltip
                  formatter={(v, n, p) => [`${v}% — ${p.payload.policies.toLocaleString('fr-FR')} polices`, '']}
                  contentStyle={{
                    background:'var(--surface2)', borderRadius:10,
                    border:'1px solid var(--border)', fontSize:'0.72rem',
                    color:'var(--text-1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display:'flex', flexDirection:'column', gap:8, flex:1 }}>
              {ZONES.map(z => (
                <div key={z.name} style={{ display:'flex', alignItems:'center', gap:8, fontSize:'0.74rem' }}>
                  <div style={{ width:9, height:9, borderRadius:'50%', background:z.color, flexShrink:0 }} />
                  <span style={{ color:'var(--text-2)', flex:1 }}>{z.name}</span>
                  <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, color:z.color, fontSize:'0.7rem' }}>
                    {z.pct}%
                  </span>
                  <span style={{ fontSize:'0.63rem', color:'var(--text-3)', fontFamily:'JetBrains Mono,monospace' }}>{z.si} Mrd</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Area Chart */}
        <div style={S.chartCard}>
          <div style={S.chartTitle}>Évolution du Portefeuille 2023–2025</div>
          <div style={S.chartSub}>Nombre de polices par zone sismique</div>
          <ResponsiveContainer width="100%" height={185}>
            <AreaChart data={GROWTH} margin={{ top:4, right:4, left:-20, bottom:0 }}>
              <defs>
                {[['III','#ef4444'],['IIb','#f59e0b'],['IIa','#eab308'],['I','#22c55e'],['Z0','#3b82f6']].map(([k, c]) => (
                  <linearGradient key={k} id={`g${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={c} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={c} stopOpacity={0.03} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="year" tick={{ fontSize:11, fill:'#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10, fill:'#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              {[['III','#ef4444'],['IIb','#f59e0b'],['IIa','#eab308'],['I','#22c55e'],['Z0','#3b82f6']].map(([k, c]) => (
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
              const zBg  = { III:'rgba(239,68,68,0.12)', IIb:'rgba(245,158,11,0.12)', IIa:'rgba(234,179,8,0.12)' }[h.zone] || 'rgba(34,197,94,0.12)'
              const zFg  = { III:'#f87171', IIb:'#fbbf24', IIa:'#facc15' }[h.zone] || '#4ade80'
              const bc   = { III:'#ef4444', IIb:'#f59e0b', IIa:'#eab308' }[h.zone] || '#22c55e'
              return (
                <tr key={h.rank} style={{ borderLeft:`3px solid ${bc}`, transition:'background 0.15s' }}
                   className="table-row-hover">
                  <td style={{ ...S.td, fontFamily:'JetBrains Mono,monospace', fontSize:'0.68rem', color:'var(--text-3)' }}>
                    {String(h.rank).padStart(2,'0')}
                  </td>
                  <td style={{ ...S.td, fontWeight:600, color:'var(--text-1)' }}>
                    {h.wilaya} <span style={{ color:'var(--text-3)', fontWeight:400 }}>({h.code})</span>
                  </td>
                  <td style={S.td}>
                    <span style={{ background:zBg, color:zFg, padding:'2px 8px', borderRadius:6, fontSize:'0.63rem', fontWeight:700, fontFamily:'JetBrains Mono,monospace', border:`1px solid ${bc}30` }}>
                      {h.zone}
                    </span>
                  </td>
                  <td style={{ ...S.td, fontFamily:'JetBrains Mono,monospace', color:'var(--text-2)' }}>{h.policies.toLocaleString('fr-FR')}</td>
                  <td style={{ ...S.td, fontFamily:'JetBrains Mono,monospace', color:'var(--text-2)' }}>{h.si.toLocaleString('fr-FR')}</td>
                  <td style={S.td}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ flex:1, height:5, background:'rgba(255,255,255,0.06)', borderRadius:4, overflow:'hidden' }}>
                        <div style={{
                          height:'100%', borderRadius:4,
                          width: barVisible ? h.score + '%' : '0%',
                          background: scoreColor(h.score),
                          transition:'width 1s ease',
                          boxShadow:`0 0 8px ${scoreColor(h.score)}60`,
                        }} />
                      </div>
                      <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'0.7rem', fontWeight:700, color:scoreColor(h.score) }}>
                        {h.score}
                      </span>
                    </div>
                  </td>
                  <td style={S.td}>
                    <span style={{ background:rowBg, color:fg, padding:'3px 8px', borderRadius:6, fontSize:'0.62rem', fontWeight:700, border:`1px solid ${fg}30` }}>
                      {label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div style={{ height:32 }} />
    </main>
  )
}

const S = {
  page: { flex:1, overflowY:'auto', padding:'22px 28px' },
  kpiGrid: {
    display:'grid', gridTemplateColumns:'repeat(6,1fr)',
    gap:14,
  },
  twoCol: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  chartCard: {
    background:'var(--surface)',
    border:'1px solid var(--border)',
    borderRadius:'var(--radius-lg)',
    padding:'20px 22px',
    boxShadow:'var(--sh-sm)',
  },
  chartTitle: {
    fontFamily:'Syne, sans-serif', fontSize:'0.82rem',
    fontWeight:700, color:'var(--text-1)', marginBottom:2,
  },
  chartSub: {
    fontSize:'0.68rem', color:'var(--text-3)', marginBottom:16,
  },
  tableWrap: {
    background:'var(--surface)', border:'1px solid var(--border)',
    borderRadius:'var(--radius-lg)', overflow:'hidden', boxShadow:'var(--sh-sm)',
  },
  table: { width:'100%', borderCollapse:'collapse' },
  th: {
    background:'rgba(255,255,255,0.03)',
    fontSize:'0.6rem', fontWeight:700,
    textTransform:'uppercase', letterSpacing:'1px',
    color:'var(--text-3)', padding:'12px 16px',
    textAlign:'left', borderBottom:'1px solid var(--border)',
  },
  td: {
    padding:'11px 16px', fontSize:'0.78rem',
    color:'var(--text-2)', borderBottom:'1px solid rgba(255,255,255,0.03)',
  },
}
