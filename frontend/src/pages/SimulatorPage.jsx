import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { MC_SCENARIOS } from '../data/constants'
import { Play, Loader, BarChart2, Layers } from 'lucide-react'

function runMonteCarlo(scenario) {
  const results = []
  const iterations = 8000
  for (let i = 0; i < iterations; i++) {
    const u1 = Math.random() || 1e-10
    const u2 = Math.random()
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    const loss = Math.exp(Math.log(scenario.meanLoss) + 0.7 * z)
    results.push(Math.max(0, loss))
  }
  results.sort((a, b) => a - b)
  const mean   = results.reduce((a, b) => a + b) / iterations
  const var95  = results[Math.floor(0.95 * iterations)]
  const pml200 = results[Math.floor(0.995 * iterations)]
  const maxLoss = results[iterations - 1]
  const buckets = [0,20,40,60,80,100,120,150,180,220,270]
  const hist = buckets.slice(0,-1).map((lo, i) => {
    const hi = buckets[i+1]
    const count = results.filter(v => v >= lo && v < hi).length
    return { label:`${lo}-${hi}`, lo, hi, count, pct:count/iterations }
  })
  return { mean, var95, pml200, maxLoss, hist }
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background:'var(--surface2)', border:'1px solid var(--border)',
      borderRadius:10, padding:'10px 14px', fontSize:'0.72rem',
      color:'var(--text-1)', boxShadow:'var(--sh-lg)',
    }}>
      <div style={{ fontWeight:600, marginBottom:4 }}>{payload[0]?.payload.label} Mrd DZD</div>
      <div style={{ color:'var(--text-2)' }}>Fréquence: <strong style={{ color:'var(--g400)' }}>{payload[0]?.value}</strong></div>
    </div>
  )
}

export default function SimulatorPage() {
  const [selected, setSelected] = useState(null)
  const [running, setRunning]   = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults]   = useState(null)
  const [customMag, setCustomMag]   = useState(6.5)
  const [customCity, setCustomCity] = useState('Alger')

  const handleRun = () => {
    const scenario = selected === 'custom'
      ? { meanLoss:Math.pow(10,(customMag-5)*0.8)*15, grossLoss:120, ceded:84, net:36 }
      : MC_SCENARIOS.find(s => s.id === selected)
    if (!scenario) return
    setRunning(true); setResults(null); setProgress(0)
    let p = 0
    const ticker = setInterval(() => {
      p += 100 / 22; setProgress(Math.min(Math.round(p), 100))
      if (p >= 100) { clearInterval(ticker); setResults(runMonteCarlo(scenario)); setRunning(false) }
    }, 40)
  }

  const scenarioData = selected ? MC_SCENARIOS.find(s => s.id === selected) : null

  return (
    <main style={S.page} className="page-fade">
      <div style={S.layout}>

        {/* Left: scenario selector */}
        <div style={S.leftPanel}>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.85rem', color:'var(--text-1)', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
            <Layers size={15} color="var(--g400)" />
            Sélection du Scénario
          </div>

          {MC_SCENARIOS.map(sc => (
            <div key={sc.id}
              onClick={() => { setSelected(sc.id); setResults(null) }}
              style={{
                ...S.scenarioCard,
                borderColor: selected === sc.id ? 'rgba(34,197,94,0.5)' : 'var(--border)',
                background: selected === sc.id ? 'rgba(34,197,94,0.07)' : 'var(--surface)',
                boxShadow: selected === sc.id ? '0 0 0 1px rgba(34,197,94,0.2), var(--sh-sm)' : 'var(--sh-xs)',
              }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div style={S.scTitle}>{sc.title}</div>
                <span style={{ ...S.badge, background:sc.badgeColor+'15', color:sc.badgeColor, border:`1px solid ${sc.badgeColor}25` }}>
                  {sc.badge}
                </span>
              </div>
              <div style={S.scGrid}>
                <div style={S.scStat}><span style={S.scLabel}>Magnitude</span><span style={{ ...S.scVal, color:'#f87171' }}>M{sc.magnitude}</span></div>
                <div style={S.scStat}><span style={S.scLabel}>Profondeur</span><span style={S.scVal}>{sc.depth} km</span></div>
                <div style={S.scStat}><span style={S.scLabel}>Rayon</span><span style={S.scVal}>{sc.radius} km</span></div>
                <div style={S.scStat}><span style={S.scLabel}>Perte brute</span><span style={{ ...S.scVal, color:'#ef4444' }}>~{sc.grossLoss} Mrd</span></div>
              </div>
            </div>
          ))}

          {/* Custom scenario */}
          <div onClick={() => { setSelected('custom'); setResults(null) }}
            style={{
              ...S.scenarioCard,
              borderColor: selected==='custom' ? 'rgba(245,158,11,0.5)' : 'var(--border)',
              background: selected==='custom' ? 'rgba(245,158,11,0.07)' : 'var(--surface)',
              boxShadow: selected==='custom' ? '0 0 0 1px rgba(245,158,11,0.2), var(--sh-sm)' : 'var(--sh-xs)',
            }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <div style={S.scTitle}>🎛️ Scénario Personnalisé</div>
              <span style={{ ...S.badge, background:'rgba(245,158,11,0.15)', color:'#f59e0b', border:'1px solid rgba(245,158,11,0.25)' }}>STRESS TEST</span>
            </div>
            {selected === 'custom' && (
              <>
                <label style={S.sliderLabel}>
                  Magnitude: <strong style={{ color:'#ef4444', fontFamily:'JetBrains Mono,monospace' }}>M{customMag.toFixed(1)}</strong>
                </label>
                <input type="range" min={5} max={8} step={0.1} value={customMag}
                  onChange={e => setCustomMag(+e.target.value)} style={S.slider} />
                <label style={{ ...S.sliderLabel, marginTop:10 }}>Épicentre:</label>
                <select value={customCity} onChange={e => setCustomCity(e.target.value)} style={S.select}>
                  {['Alger','Oran','Constantine','Sétif','Chlef','Annaba'].map(c => <option key={c}>{c}</option>)}
                </select>
              </>
            )}
          </div>

          {/* Run button */}
          <button
            onClick={handleRun}
            disabled={!selected || running}
            style={{ ...S.runBtn, opacity:(!selected||running)?0.5:1 }}>
            {running
              ? <><Loader size={14} style={{ animation:'spin 1s linear infinite', marginRight:8 }} />{progress}%</>
              : <><Play size={14} style={{ marginRight:8 }} />LANCER LA SIMULATION</>}
          </button>

          {running && (
            <>
              <div style={S.progressBg}>
                <div style={{ ...S.progressFill, width:progress+'%' }} />
              </div>
              <div style={{ fontSize:'0.67rem', color:'var(--text-3)', textAlign:'center' }}>
                {Math.round(progress * 80)} / 8 000 itérations Monte Carlo
              </div>
            </>
          )}
        </div>

        {/* Right: results */}
        <div style={S.rightPanel}>
          {!results && !running && (
            <div style={S.emptyState}>
              <div style={{ fontSize:'3rem', animation:'float 4s ease-in-out infinite' }}>🎲</div>
              <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'1rem', color:'var(--text-2)' }}>
                Sélectionnez un scénario
              </div>
              <div style={{ fontSize:'0.8rem', color:'var(--text-3)', maxWidth:320, textAlign:'center' }}>
                Choisissez un événement sismique et lancez la simulation Monte Carlo (8 000 itérations).
              </div>
            </div>
          )}

          {results && scenarioData && (
            <>
              {/* KPI cards */}
              <div style={S.statsGrid}>
                {[
                  { label:'Perte Moyenne',    val:results.mean.toFixed(1)+' Mrd',   color:'var(--text-1)', accent:'rgba(255,255,255,0.05)' },
                  { label:'VaR 95%',           val:results.var95.toFixed(1)+' Mrd',  color:'#f59e0b',       accent:'rgba(245,158,11,0.08)' },
                  { label:'PML (1/200 ans)',    val:results.pml200.toFixed(1)+' Mrd', color:'#ef4444',       accent:'rgba(239,68,68,0.08)' },
                  { label:'Perte Maximale',     val:results.maxLoss.toFixed(1)+' Mrd',color:'#ef4444',       accent:'rgba(239,68,68,0.08)' },
                ].map(k => (
                  <div key={k.label} style={{ ...S.statCard, background:k.accent, borderColor:`${k.color}20` }}>
                    <div style={S.statLabel}>{k.label}</div>
                    <div style={{ ...S.statVal, color:k.color }}>{k.val}</div>
                    <div style={{ fontSize:'0.6rem', color:'var(--text-3)', marginTop:2 }}>DZD</div>
                  </div>
                ))}
              </div>

              {/* Histogram */}
              <div style={S.chartCard}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                  <BarChart2 size={14} color="var(--g400)" />
                  <span style={S.chartTitle}>Distribution des Pertes — Monte Carlo (8 000 simulations)</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={results.hist} margin={{ top:4, right:4, left:-15, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="label" tick={{ fontSize:9, fill:'#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize:9, fill:'#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[3,3,0,0]}>
                      {results.hist.map((h, i) => (
                        <Cell key={i} fill={
                          h.hi <= results.mean  ? '#22c55e' :
                          h.lo < results.var95  ? '#eab308' :
                          h.lo < results.pml200 ? '#f59e0b' : '#ef4444'
                        } />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display:'flex', gap:18, marginTop:10, flexWrap:'wrap' }}>
                  {[
                    { label:'Moyenne', color:'#22c55e', val:results.mean.toFixed(1) },
                    { label:'VaR 95%', color:'#eab308', val:results.var95.toFixed(1) },
                    { label:'PML 1/200', color:'#ef4444', val:results.pml200.toFixed(1) },
                  ].map(l => (
                    <div key={l.label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.68rem' }}>
                      <div style={{ width:10, height:3, background:l.color, borderRadius:2 }} />
                      <span style={{ color:'var(--text-3)' }}>{l.label}:</span>
                      <span style={{ fontFamily:'JetBrains Mono,monospace', color:l.color, fontWeight:700 }}>{l.val} Mrd</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Retention breakdown */}
              <div style={S.chartCard}>
                <div style={S.chartTitle}>Répartition Rétention / Réassurance</div>
                {[
                  { label:'Perte Brute Totale',    val:scenarioData.grossLoss, pct:100, color:'#64748b' },
                  { label:'Cédé Réassureur (70%)', val:scenarioData.ceded,     pct:70,  color:'#22c55e' },
                  { label:'Rétention Nette (30%)', val:scenarioData.net,       pct:30,  color:'#ef4444' },
                ].map(r => (
                  <div key={r.label} style={{ marginBottom:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <span style={{ fontSize:'0.72rem', color:'var(--text-2)' }}>{r.label}</span>
                      <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'0.75rem', fontWeight:700, color:r.color }}>
                        {r.val} Mrd DZD
                      </span>
                    </div>
                    <div style={{ height:8, background:'rgba(255,255,255,0.06)', borderRadius:4, overflow:'hidden' }}>
                      <div style={{ width:r.pct+'%', height:'100%', background:r.color, borderRadius:4, transition:'width 1s ease', boxShadow:`0 0 8px ${r.color}60` }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

const S = {
  page: { flex:1, overflowY:'auto', padding:'20px 24px' },
  layout: { display:'flex', gap:16, height:'100%' },
  leftPanel: {
    width:296, display:'flex', flexDirection:'column', gap:12,
    overflowY:'auto', paddingRight:4,
  },
  scenarioCard: {
    background:'var(--surface)', border:'2px solid var(--border)',
    borderRadius:12, padding:'14px 16px', cursor:'pointer',
    transition:'all 0.18s',
  },
  scTitle: { fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.82rem', color:'var(--text-1)' },
  badge:   { fontSize:'0.59rem', fontWeight:700, padding:'2px 8px', borderRadius:6, whiteSpace:'nowrap' },
  scGrid:  { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8 },
  scStat:  { display:'flex', flexDirection:'column', gap:2 },
  scLabel: { fontSize:'0.58rem', color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.8px' },
  scVal:   { fontFamily:'JetBrains Mono,monospace', fontSize:'0.78rem', fontWeight:600, color:'var(--text-1)' },
  sliderLabel: { fontSize:'0.72rem', color:'var(--text-2)', display:'block', marginBottom:5 },
  slider: { width:'100%', accentColor:'#22c55e' },
  select: {
    width:'100%', padding:'7px 10px', borderRadius:8,
    border:'1px solid var(--border)', fontSize:'0.75rem',
    color:'var(--text-1)', background:'var(--surface2)', marginTop:3,
    cursor:'pointer',
  },
  runBtn: {
    background:'linear-gradient(135deg, #15803d, #22c55e)',
    color:'#fff', border:'none', borderRadius:10, padding:'12px',
    fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.82rem',
    cursor:'pointer', letterSpacing:'0.5px', transition:'opacity 0.2s',
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'var(--sh-green)',
  },
  progressBg: { height:5, background:'rgba(255,255,255,0.06)', borderRadius:4, overflow:'hidden' },
  progressFill: { height:'100%', background:'linear-gradient(90deg,#16a34a,#4ade80)', borderRadius:4, transition:'width 0.1s linear' },
  rightPanel: { flex:1, display:'flex', flexDirection:'column', gap:14, overflowY:'auto' },
  emptyState: {
    flex:1, display:'flex', flexDirection:'column', alignItems:'center',
    justifyContent:'center', gap:14, color:'var(--text-3)', textAlign:'center',
  },
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 },
  statCard: {
    border:'1px solid var(--border)', borderRadius:12,
    padding:'14px 16px', boxShadow:'var(--sh-sm)',
  },
  statLabel: { fontSize:'0.6rem', color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:8 },
  statVal: { fontFamily:'JetBrains Mono,monospace', fontSize:'1.1rem', fontWeight:700, lineHeight:1 },
  chartCard: {
    background:'var(--surface)', border:'1px solid var(--border)',
    borderRadius:12, padding:'18px 20px', boxShadow:'var(--sh-sm)',
  },
  chartTitle: { fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.82rem', color:'var(--text-1)' },
}
