import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'
import { Target, TrendingUp, Layers, ArrowRight } from 'lucide-react'

const ZONE_COMPARISON = [
  { zone:'Zone III',  current:30.5, target:17,   color:'#ef4444' },
  { zone:'Zone IIb', current:15.9, target:19,    color:'#f59e0b' },
  { zone:'Zone IIa', current:43.2, target:43,    color:'#eab308' },
  { zone:'Zone I',   current:7.9,  target:17,    color:'#22c55e' },
  { zone:'Zone 0',   current:2.5,  target:4,     color:'#3b82f6' },
]

const ROADMAP = [
  {
    year:'Année 1 — 2025/2026', phase:'TRIAGE', color:'#ef4444',
    bg:'rgba(239,68,68,0.08)', border:'rgba(239,68,68,0.25)',
    score:'47 → 60',
    items:[
      '🛡️ Négocier traité XL réassurance Zone III',
      '🚫 Cap dur: Zéro nouvelles polices Zone III',
      '📊 Objectif Balance Score: 47 → 60',
      '💰 Réduction exposition: −54 Mrd DZD',
    ],
  },
  {
    year:'Année 2 — 2026/2027', phase:'DIVERSIFICATION', color:'#f59e0b',
    bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.25)',
    score:'60 → 72',
    items:[
      '📣 Campagne Zone I (Laghouat, Batna, Biskra)',
      '💰 Tarifs incitatifs −15% Zone 0 / Zone I',
      '📊 Objectif Balance Score: 60 → 72',
      '📈 Nouvelles polices Zone I: +5 350',
    ],
  },
  {
    year:'Année 3 — 2027/2028', phase:'OPTIMISATION', color:'#22c55e',
    bg:'rgba(34,197,94,0.08)', border:'rgba(34,197,94,0.25)',
    score:'72 → 82+',
    items:[
      '📉 Non-renouvellement sélectif Zone III non-conformes RPA',
      '🔄 Produits paramétriques Zone IIa',
      '📊 Objectif Balance Score: 72 → 82+',
      '🎯 Zone III final: 30.5% → 17%',
    ],
  },
]

const REINSURANCE_LAYERS = [
  { label:'Rétention Compagnie (30%)', range:'0 – 50 Mrd DZD',   color:'#ef4444', h:60, note:'Risque porté par la compagnie' },
  { label:'XL Treaty — Réassureur',    range:'50 – 150 Mrd DZD',  color:'#f59e0b', h:80, note:'Couverture réassureur standard' },
  { label:'Cat XL — Swiss Re / Munich',range:'150 – 300 Mrd DZD', color:'#eab308', h:70, note:'Spécialiste catastrophes naturelles' },
  { label:'Cat Bond / État Algérien',  range:'300 Mrd DZD +',     color:'#22c55e', h:55, note:'Marchés des capitaux / souverain' },
]

function GaugeSVG({ score, target }) {
  const r = 88, cx = 108, cy = 108, strokeW = 13
  const circ = 2 * Math.PI * r
  const pct  = score / 100
  const tPct = target / 100
  const scoreColor = score < 40 ? '#ef4444' : score < 70 ? '#f59e0b' : '#22c55e'

  return (
    <svg viewBox="0 0 216 216" width={196} height={196}>
      {/* Glow filter */}
      <defs>
        <filter id="gauge-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* Background track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeW} />
      {/* Target arc */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={scoreColor} strokeWidth={strokeW}
        strokeDasharray={`${tPct*circ} ${circ}`}
        strokeDashoffset={circ*0.25}
        strokeLinecap="round" opacity={0.15}
      />
      {/* Score arc */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={scoreColor} strokeWidth={strokeW}
        strokeDasharray={`${pct*circ} ${(1-pct)*circ}`}
        strokeDashoffset={circ*0.25}
        strokeLinecap="round" filter="url(#gauge-glow)"
        style={{ transition:'stroke-dasharray 1s ease' }}
      />
      {/* Target dot */}
      <circle
        cx={cx + r * Math.cos(2*Math.PI*tPct - Math.PI/2)}
        cy={cy + r * Math.sin(2*Math.PI*tPct - Math.PI/2)}
        r={5} fill="#22c55e" filter="url(#gauge-glow)"
      />
      {/* Center text */}
      <text x={cx} y={cy-12} textAnchor="middle" fontSize={40}
        fontFamily="JetBrains Mono,monospace" fontWeight="800" fill={scoreColor}>{score}</text>
      <text x={cx} y={cy+14} textAnchor="middle" fontSize={10} fill="#64748b" fontFamily="Plus Jakarta Sans,sans-serif">Score Actuel</text>
      <text x={cx} y={cy+30} textAnchor="middle" fontSize={9} fill={scoreColor} fontFamily="Plus Jakarta Sans,sans-serif">Objectif {target} en 2028</text>
    </svg>
  )
}

const SectionTitle = ({ children }) => (
  <div style={{
    fontFamily:'Syne, sans-serif', fontSize:'0.6rem', fontWeight:700,
    textTransform:'uppercase', letterSpacing:'2.5px', color:'var(--text-3)',
    marginBottom:12, marginTop:24,
    display:'flex', alignItems:'center', gap:10,
  }}>
    <div style={{ height:1, width:20, background:'var(--border)' }} />
    {children}
    <div style={{ height:1, flex:1, background:'var(--border)' }} />
  </div>
)

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', fontSize:'0.72rem', boxShadow:'var(--sh-lg)', color:'var(--text-1)' }}>
      {payload.map(p => (
        <div key={p.name} style={{ color:p.color }}><strong>{p.name}</strong>: {p.value?.toFixed(1)}%</div>
      ))}
    </div>
  )
}

export default function BalancePage() {
  return (
    <main style={S.page} className="page-fade">

      {/* Hero Banner */}
      <div style={S.heroBanner}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.2rem', color:'var(--text-1)', marginBottom:6 }}>
            Score de Bilan du Portefeuille
          </div>
          <div style={{ fontSize:'0.78rem', color:'var(--text-2)', maxWidth:380, lineHeight:1.7 }}>
            Concentration géographique et capacité de rétention par zones sismiques.
            Objectif cible: <strong style={{ color:'#22c55e' }}>82 / 100 d'ici 2028</strong>.
          </div>
        </div>
        <GaugeSVG score={47} target={82} />
        <div style={S.heroStats}>
          {[
            { label:'Zone III actuelle', val:'30.5%', color:'#ef4444' },
            { label:'Zone III cible',    val:'17%',   color:'#22c55e' },
            { label:'Score → 2028',      val:'+35 pts',color:'#22c55e' },
          ].map(s => (
            <div key={s.label} style={S.heroStat}>
              <div style={{ fontSize:'0.6rem', color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:4 }}>{s.label}</div>
              <div style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:800, fontSize:'1.4rem', color:s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      <SectionTitle>Répartition Actuelle vs Cible</SectionTitle>
      <div style={S.chartCard}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={ZONE_COMPARISON} layout="vertical" margin={{ top:4, right:50, left:64, bottom:4 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis type="number" domain={[0,55]} tick={{ fontSize:10, fill:'#64748b' }} axisLine={false} tickLine={false} unit="%" />
            <YAxis type="category" dataKey="zone" tick={{ fontSize:11, fill:'#94a3b8', fontWeight:500 }} axisLine={false} tickLine={false} width={60} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="current" name="Actuel" radius={[0,4,4,0]} maxBarSize={14}>
              {ZONE_COMPARISON.map((z, i) => (
                <Cell key={i} fill={z.color} />
              ))}
            </Bar>
            <Bar dataKey="target" name="Cible 2028" radius={[0,4,4,0]} fill="#22c55e" fillOpacity={0.25} maxBarSize={14} />
            <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize:'0.72rem', color:'var(--text-2)' }} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display:'flex', gap:28, marginTop:10 }}>
          {ZONE_COMPARISON.map(z => {
            const delta = (z.target - z.current).toFixed(1)
            const positive = delta > 0
            return (
              <div key={z.zone} style={{ fontSize:'0.68rem' }}>
                <div style={{ color:'var(--text-3)', marginBottom:2 }}>{z.zone}</div>
                <div style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700,
                  color: positive ? '#22c55e' : Number(delta) < 0 ? '#ef4444' : '#64748b' }}>
                  {positive ? '+' : ''}{delta}%
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <SectionTitle>Plan de Rééquilibrage — Feuille de Route 3 Ans</SectionTitle>
      <div style={S.roadmapGrid}>
        {ROADMAP.map((r, i) => (
          <div key={r.year} style={{ ...S.roadmapCard, borderColor:r.border, background:r.bg }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div>
                <div style={{ fontSize:'0.6rem', fontWeight:700, color:r.color, textTransform:'uppercase', letterSpacing:'2px', marginBottom:4 }}>
                  {r.phase}
                </div>
                <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.82rem', color:'var(--text-1)' }}>{r.year}</div>
              </div>
              <div style={{ background:r.color, color:'#fff', fontFamily:'JetBrains Mono,monospace', fontSize:'0.7rem', fontWeight:700, padding:'5px 10px', borderRadius:8, boxShadow:`0 0 12px ${r.color}50` }}>
                {r.score}
              </div>
            </div>
            {r.items.map((it, j) => (
              <div key={j} style={{ display:'flex', alignItems:'flex-start', gap:7, fontSize:'0.73rem', color:'var(--text-2)', marginBottom:8, lineHeight:1.5 }}>
                <ArrowRight size={12} color={r.color} style={{ flexShrink:0, marginTop:2 }} />
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
            <div key={i} style={{ ...S.towerLayer, height:l.h, background:`${l.color}08`, borderLeft:`4px solid ${l.color}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.78rem', color:l.color }}>{l.label}</div>
                  <div style={{ fontSize:'0.67rem', color:'var(--text-3)', marginTop:3 }}>{l.note}</div>
                </div>
                <div style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, fontSize:'0.78rem', color:l.color, textAlign:'right' }}>
                  {l.range}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height:32 }} />
    </main>
  )
}

const S = {
  page: { flex:1, overflowY:'auto', padding:'22px 28px' },
  heroBanner: {
    background:'var(--surface)', border:'1px solid var(--border)', borderRadius:18,
    padding:'26px 32px', display:'flex', alignItems:'center',
    gap:32, boxShadow:'var(--sh-md)', marginBottom:4, flexWrap:'wrap',
  },
  heroStats: { display:'flex', gap:36, marginLeft:'auto', flexWrap:'wrap' },
  heroStat:  { textAlign:'right' },
  chartCard: {
    background:'var(--surface)', border:'1px solid var(--border)',
    borderRadius:14, padding:'20px 24px', boxShadow:'var(--sh-sm)',
  },
  roadmapGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 },
  roadmapCard: { border:'2px solid', borderRadius:14, padding:'20px 22px', transition:'transform 0.2s' },
  towerCard: {
    background:'var(--surface)', border:'1px solid var(--border)',
    borderRadius:14, padding:'20px 24px', boxShadow:'var(--sh-sm)',
  },
  tower: { display:'flex', flexDirection:'column', gap:6 },
  towerLayer: { padding:'12px 16px', borderRadius:10, display:'flex', alignItems:'center', transition:'opacity 0.2s' },
}
