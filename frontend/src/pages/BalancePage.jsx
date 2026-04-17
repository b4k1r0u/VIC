import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'
import { ArrowRight } from 'lucide-react'

const ZONE_COMPARISON = [
  { zone: 'Zone III', current: 30.5, target: 17, color: '#dc2626' },
  { zone: 'Zone IIb', current: 15.9, target: 19, color: '#d97706' },
  { zone: 'Zone IIa', current: 43.2, target: 43, color: '#ca8a04' },
  { zone: 'Zone I', current: 7.9, target: 17, color: '#059669' },
  { zone: 'Zone 0', current: 2.5, target: 4, color: '#2563eb' },
]

const ROADMAP = [
  {
    year: 'Année 1 — 2025/2026', phase: 'TRIAGE', color: '#dc2626',
    bg: 'var(--danger-muted)', border: 'var(--danger-border)',
    score: '47 → 60',
    items: [
      'Négocier traité XL réassurance Zone III',
      'Cap dur: Zéro nouvelles polices Zone III',
      'Objectif Balance Score: 47 → 60',
      'Réduction exposition: −54 Mrd DZD',
    ],
  },
  {
    year: 'Année 2 — 2026/2027', phase: 'DIVERSIFICATION', color: '#d97706',
    bg: 'var(--warning-muted)', border: 'var(--warning-border)',
    score: '60 → 72',
    items: [
      'Campagne Zone I (Laghouat, Batna, Biskra)',
      'Tarifs incitatifs −15% Zone 0 / Zone I',
      'Objectif Balance Score: 60 → 72',
      'Nouvelles polices Zone I: +5 350',
    ],
  },
  {
    year: 'Année 3 — 2027/2028', phase: 'OPTIMISATION', color: '#059669',
    bg: 'var(--success-muted)', border: 'var(--success-border)',
    score: '72 → 82+',
    items: [
      'Non-renouvellement sélectif Zone III non-conformes RPA',
      'Produits paramétriques Zone IIa',
      'Objectif Balance Score: 72 → 82+',
      'Zone III final: 30.5% → 17%',
    ],
  },
]

const REINSURANCE_LAYERS = [
  { label: 'Rétention Compagnie (30%)', range: '0 – 50 Mrd DZD', color: '#dc2626', note: 'Risque porté par la compagnie' },
  { label: 'XL Treaty — Réassureur', range: '50 – 150 Mrd DZD', color: '#d97706', note: 'Couverture réassureur standard' },
  { label: 'Cat XL — Swiss Re / Munich', range: '150 – 300 Mrd DZD', color: '#ca8a04', note: 'Spécialiste catastrophes naturelles' },
  { label: 'Cat Bond / État Algérien', range: '300 Mrd DZD +', color: '#059669', note: 'Marchés des capitaux / souverain' },
]

function GaugeSVG({ score, target }) {
  const r = 88, cx = 108, cy = 108, strokeW = 12
  const circ = 2 * Math.PI * r
  const pct = score / 100
  const tPct = target / 100
  const scoreColor = score < 40 ? '#dc2626' : score < 70 ? '#d97706' : '#059669'

  return (
    <svg viewBox="0 0 216 216" width={180} height={180}>
      {/* Background track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={strokeW} />
      {/* Target arc */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={scoreColor} strokeWidth={strokeW}
        strokeDasharray={`${tPct * circ} ${circ}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round" opacity={0.12}
      />
      {/* Score arc */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={scoreColor} strokeWidth={strokeW}
        strokeDasharray={`${pct * circ} ${(1 - pct) * circ}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
      {/* Target dot */}
      <circle
        cx={cx + r * Math.cos(2 * Math.PI * tPct - Math.PI / 2)}
        cy={cy + r * Math.sin(2 * Math.PI * tPct - Math.PI / 2)}
        r={4} fill="#059669"
      />
      {/* Center text */}
      <text x={cx} y={cy - 10} textAnchor="middle" fontSize={36}
        fontFamily="'JetBrains Mono', monospace" fontWeight="700" fill={scoreColor}>{score}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize={10} fill="var(--text-tertiary)" fontFamily="'Plus Jakarta Sans', sans-serif">Score Actuel</text>
      <text x={cx} y={cy + 28} textAnchor="middle" fontSize={9} fill={scoreColor} fontFamily="'Plus Jakarta Sans', sans-serif">Objectif {target} en 2028</text>
    </svg>
  )
}

const SectionTitle = ({ children }) => (
  <div style={S.sectionTitle}>{children}</div>
)

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: '0.72rem', boxShadow: 'var(--shadow-lg)', color: 'var(--text-primary)' }}>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color }}><strong>{p.name}</strong>: {p.value?.toFixed(1)}%</div>
      ))}
    </div>
  )
}

export default function BalancePage() {
  return (
    <main style={S.page} className="page-fade">

      {/* Hero Banner */}
      <div style={S.heroBanner}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: 6 }}>
            Score de Bilan du Portefeuille
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 380, lineHeight: 1.7 }}>
            Concentration géographique et capacité de rétention par zones sismiques.
            Objectif cible: <strong style={{ color: 'var(--success)' }}>82 / 100 d'ici 2028</strong>.
          </div>
        </div>
        <GaugeSVG score={47} target={82} />
        <div style={S.heroStats}>
          {[
            { label: 'Zone III actuelle', val: '30.5%', color: 'var(--danger)' },
            { label: 'Zone III cible', val: '17%', color: 'var(--success)' },
            { label: 'Score → 2028', val: '+35 pts', color: 'var(--success)' },
          ].map(s => (
            <div key={s.label} style={S.heroStat}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-quaternary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '1.3rem', color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      <SectionTitle>Répartition Actuelle vs Cible</SectionTitle>
      <div style={S.chartCard}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={ZONE_COMPARISON} layout="vertical" margin={{ top: 4, right: 50, left: 64, bottom: 4 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" domain={[0, 55]} tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} unit="%" />
            <YAxis type="category" dataKey="zone" tick={{ fontSize: 11, fill: 'var(--text-tertiary)', fontWeight: 500 }} axisLine={false} tickLine={false} width={60} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="current" name="Actuel" radius={[0, 3, 3, 0]} maxBarSize={12}>
              {ZONE_COMPARISON.map((z, i) => (
                <Cell key={i} fill={z.color} />
              ))}
            </Bar>
            <Bar dataKey="target" name="Cible 2028" radius={[0, 3, 3, 0]} fill="#059669" fillOpacity={0.18} maxBarSize={12} />
            <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 28, marginTop: 10 }}>
          {ZONE_COMPARISON.map(z => {
            const delta = (z.target - z.current).toFixed(1)
            const positive = delta > 0
            return (
              <div key={z.zone} style={{ fontSize: '0.7rem' }}>
                <div style={{ color: 'var(--text-tertiary)', marginBottom: 2 }}>{z.zone}</div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                  color: positive ? 'var(--success)' : Number(delta) < 0 ? 'var(--danger)' : 'var(--text-tertiary)'
                }}>
                  {positive ? '+' : ''}{delta}%
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <SectionTitle>Plan de Rééquilibrage — Feuille de Route 3 Ans</SectionTitle>
      <div style={S.roadmapGrid}>
        {ROADMAP.map((r) => (
          <div key={r.year} style={{ ...S.roadmapCard, borderColor: r.border, background: r.bg }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: '0.6rem', fontWeight: 600, color: r.color, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 4 }}>
                  {r.phase}
                </div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{r.year}</div>
              </div>
              <div style={{ background: r.color, color: '#fff', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', fontWeight: 600, padding: '4px 10px', borderRadius: 6 }}>
                {r.score}
              </div>
            </div>
            {r.items.map((it, j) => (
              <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 7, lineHeight: 1.5 }}>
                <ArrowRight size={11} color={r.color} style={{ flexShrink: 0, marginTop: 3 }} />
                {it}
              </div>
            ))}
          </div>
        ))}
      </div>

      <SectionTitle>Structure de Réassurance — Tour de Protection</SectionTitle>
      <div style={S.towerCard}>
        <div style={S.tower}>
          {[...REINSURANCE_LAYERS].reverse().map((l, i) => (
            <div key={i} style={{ ...S.towerLayer, borderLeft: `3px solid ${l.color}`, background: `${l.color}05` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.8rem', color: l.color }}>{l.label}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-quaternary)', marginTop: 2 }}>{l.note}</div>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: '0.78rem', color: l.color, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {l.range}
                </div>
              </div>
            </div>
          ))}
        </div>
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
    marginBottom: 12, marginTop: 28,
  },
  heroBanner: {
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
    padding: '24px 28px', display: 'flex', alignItems: 'center',
    gap: 28, boxShadow: 'var(--shadow-md)', marginBottom: 4, flexWrap: 'wrap',
  },
  heroStats: { display: 'flex', gap: 32, marginLeft: 'auto', flexWrap: 'wrap' },
  heroStat: { textAlign: 'right' },
  chartCard: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '18px 22px', boxShadow: 'var(--shadow-card)',
  },
  roadmapGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 },
  roadmapCard: { border: '1px solid', borderRadius: 'var(--radius-lg)', padding: '18px 20px', transition: 'transform 0.2s' },
  towerCard: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '18px 22px', boxShadow: 'var(--shadow-card)',
  },
  tower: { display: 'flex', flexDirection: 'column', gap: 6 },
  towerLayer: { padding: '14px 16px', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center' },
}
