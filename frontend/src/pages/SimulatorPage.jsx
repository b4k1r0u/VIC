import React, { useState } from 'react'
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
  const mean = results.reduce((a, b) => a + b) / iterations
  const var95 = results[Math.floor(0.95 * iterations)]
  const pml200 = results[Math.floor(0.995 * iterations)]
  const maxLoss = results[iterations - 1]
  const buckets = [0, 20, 40, 60, 80, 100, 120, 150, 180, 220, 270]
  const hist = buckets.slice(0, -1).map((lo, i) => {
    const hi = buckets[i + 1]
    const count = results.filter(v => v >= lo && v < hi).length
    return { label: `${lo}-${hi}`, lo, hi, count, pct: count / iterations }
  })
  return { mean, var95, pml200, maxLoss, hist }
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '10px 14px', fontSize: '0.72rem',
      color: 'var(--text-primary)', boxShadow: 'var(--shadow-lg)',
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{payload[0]?.payload.label} Mrd DZD</div>
      <div style={{ color: 'var(--text-secondary)' }}>Fréquence: <strong style={{ color: 'var(--primary-600)' }}>{payload[0]?.value}</strong></div>
    </div>
  )
}

export default function SimulatorPage() {
  const [selected, setSelected] = useState(null)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState(null)
  const [customMag, setCustomMag] = useState(6.5)
  const [customCity, setCustomCity] = useState('Alger')

  const handleRun = () => {
    const scenario = selected === 'custom'
      ? { meanLoss: Math.pow(10, (customMag - 5) * 0.8) * 15, grossLoss: 120, ceded: 84, net: 36 }
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
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={15} color="var(--primary-500)" />
            Sélection du Scénario
          </div>

          {MC_SCENARIOS.map(sc => (
            <div key={sc.id}
              onClick={() => { setSelected(sc.id); setResults(null) }}
              style={{
                ...S.scenarioCard,
                borderColor: selected === sc.id ? 'rgba(20,184,166,0.4)' : 'var(--border)',
                background: selected === sc.id ? 'var(--primary-50)' : 'var(--surface)',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={S.scTitle}>{sc.title}</div>
                <span style={{ ...S.badge, background: sc.badgeColor + '12', color: sc.badgeColor }}>
                  {sc.badge}
                </span>
              </div>
              <div style={S.scGrid}>
                <div style={S.scStat}><span style={S.scLabel}>Magnitude</span><span style={{ ...S.scVal, color: 'var(--danger)' }}>M{sc.magnitude}</span></div>
                <div style={S.scStat}><span style={S.scLabel}>Profondeur</span><span style={S.scVal}>{sc.depth} km</span></div>
                <div style={S.scStat}><span style={S.scLabel}>Rayon</span><span style={S.scVal}>{sc.radius} km</span></div>
                <div style={S.scStat}><span style={S.scLabel}>Perte brute</span><span style={{ ...S.scVal, color: 'var(--danger)' }}>~{sc.grossLoss} Mrd</span></div>
              </div>
            </div>
          ))}

          {/* Custom scenario */}
          <div onClick={() => { setSelected('custom'); setResults(null) }}
            style={{
              ...S.scenarioCard,
              borderColor: selected === 'custom' ? 'rgba(217,119,6,0.4)' : 'var(--border)',
              background: selected === 'custom' ? 'var(--warning-muted)' : 'var(--surface)',
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={S.scTitle}>🎛️ Scénario Personnalisé</div>
              <span style={{ ...S.badge, background: 'rgba(217,119,6,0.1)', color: 'var(--warning)' }}>STRESS TEST</span>
            </div>
            {selected === 'custom' && (
              <>
                <label style={S.sliderLabel}>
                  Magnitude: <strong style={{ color: 'var(--danger)', fontFamily: "'JetBrains Mono', monospace" }}>M{customMag.toFixed(1)}</strong>
                </label>
                <input type="range" min={5} max={8} step={0.1} value={customMag}
                  onChange={e => setCustomMag(+e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
                <label style={{ ...S.sliderLabel, marginTop: 4 }}>Épicentre:</label>
                <select value={customCity} onChange={e => setCustomCity(e.target.value)} style={S.select}>
                  {['Alger', 'Oran', 'Constantine', 'Sétif', 'Chlef', 'Annaba'].map(c => <option key={c}>{c}</option>)}
                </select>
              </>
            )}
          </div>

          {/* Run button */}
          <button
            onClick={handleRun}
            disabled={!selected || running}
            style={{ ...S.runBtn, opacity: (!selected || running) ? 0.5 : 1 }}>
            {running
              ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} />{progress}%</>
              : <><Play size={14} style={{ marginRight: 8 }} />LANCER LA SIMULATION</>}
          </button>

          {running && (
            <>
              <div style={S.progressBg}>
                <div style={{ ...S.progressFill, width: progress + '%' }} />
              </div>
              <div style={{ fontSize: '0.67rem', color: 'var(--text-quaternary)', textAlign: 'center' }}>
                {Math.round(progress * 80)} / 8 000 itérations Monte Carlo
              </div>
            </>
          )}
        </div>

        {/* Right: results */}
        <div style={S.rightPanel}>
          {!results && !running && (
            <div style={S.emptyState}>
              <div style={{ fontSize: '2.5rem', animation: 'float 4s ease-in-out infinite' }}>🎲</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '1rem', color: 'var(--text-secondary)' }}>
                Sélectionnez un scénario
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', maxWidth: 320, textAlign: 'center', lineHeight: 1.6 }}>
                Choisissez un événement sismique et lancez la simulation Monte Carlo (8 000 itérations).
              </div>
            </div>
          )}

          {results && scenarioData && (
            <>
              {/* KPI cards */}
              <div style={S.statsGrid}>
                {[
                  { label: 'Perte Moyenne', val: results.mean.toFixed(1) + ' Mrd', color: 'var(--text-primary)', bg: 'var(--surface)' },
                  { label: 'VaR 95%', val: results.var95.toFixed(1) + ' Mrd', color: 'var(--warning)', bg: 'var(--warning-muted)' },
                  { label: 'PML (1/200 ans)', val: results.pml200.toFixed(1) + ' Mrd', color: 'var(--danger)', bg: 'var(--danger-muted)' },
                  { label: 'Perte Maximale', val: results.maxLoss.toFixed(1) + ' Mrd', color: 'var(--danger)', bg: 'var(--danger-muted)' },
                ].map(k => (
                  <div key={k.label} style={{ ...S.statCard, background: k.bg }}>
                    <div style={S.statLabel}>{k.label}</div>
                    <div style={{ ...S.statVal, color: k.color }}>{k.val}</div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-quaternary)', marginTop: 2 }}>DZD</div>
                  </div>
                ))}
              </div>

              {/* Histogram */}
              <div style={S.chartCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <BarChart2 size={14} color="var(--primary-500)" />
                  <span style={S.chartTitle}>Distribution des Pertes — Monte Carlo (8 000 simulations)</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={results.hist} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                      {results.hist.map((h, i) => (
                        <Cell key={i} fill={
                          h.hi <= results.mean ? '#059669' :
                            h.lo < results.var95 ? '#ca8a04' :
                              h.lo < results.pml200 ? '#d97706' : '#dc2626'
                        } />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Moyenne', color: '#059669', val: results.mean.toFixed(1) },
                    { label: 'VaR 95%', color: '#ca8a04', val: results.var95.toFixed(1) },
                    { label: 'PML 1/200', color: '#dc2626', val: results.pml200.toFixed(1) },
                  ].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem' }}>
                      <div style={{ width: 10, height: 3, background: l.color, borderRadius: 2 }} />
                      <span style={{ color: 'var(--text-tertiary)' }}>{l.label}:</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", color: l.color, fontWeight: 600 }}>{l.val} Mrd</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Retention breakdown */}
              <div style={S.chartCard}>
                <div style={S.chartTitle}>Répartition Rétention / Réassurance</div>
                <div style={{ marginTop: 12 }}>
                  {[
                    { label: 'Perte Brute Totale', val: scenarioData.grossLoss, pct: 100, color: 'var(--text-tertiary)' },
                    { label: 'Cédé Réassureur (70%)', val: scenarioData.ceded, pct: 70, color: 'var(--success)' },
                    { label: 'Rétention Nette (30%)', val: scenarioData.net, pct: 30, color: 'var(--danger)' },
                  ].map(r => (
                    <div key={r.label} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.label}</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', fontWeight: 600, color: r.color }}>
                          {r.val} Mrd DZD
                        </span>
                      </div>
                      <div style={{ height: 6, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: r.pct + '%', height: '100%', background: r.color, borderRadius: 3, transition: 'width 1s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

const S = {
  page: { flex: 1, overflowY: 'auto', padding: '16px 20px' },
  layout: { display: 'flex', gap: 14, height: '100%' },
  leftPanel: {
    width: 296, display: 'flex', flexDirection: 'column', gap: 10,
    overflowY: 'auto', paddingRight: 4,
  },
  scenarioCard: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '14px 16px', cursor: 'pointer',
    transition: 'all 0.15s',
  },
  scTitle: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' },
  badge: { fontSize: '0.6rem', fontWeight: 600, padding: '2px 8px', borderRadius: 4, whiteSpace: 'nowrap' },
  scGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 },
  scStat: { display: 'flex', flexDirection: 'column', gap: 2 },
  scLabel: { fontSize: '0.6rem', color: 'var(--text-quaternary)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  scVal: { fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' },
  sliderLabel: { fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 5 },
  select: {
    width: '100%', padding: '7px 10px', borderRadius: 6,
    border: '1px solid var(--border)', fontSize: '0.75rem',
    color: 'var(--text-primary)', background: 'var(--bg-subtle)', marginTop: 3,
    cursor: 'pointer',
  },
  runBtn: {
    background: 'linear-gradient(135deg, #0f766e, #14b8a6)',
    color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '11px',
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.8rem',
    cursor: 'pointer', letterSpacing: '0.3px', transition: 'opacity 0.2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  progressBg: { height: 4, background: 'var(--border-subtle)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg,#0f766e,#14b8a6)', borderRadius: 2, transition: 'width 0.1s linear' },
  rightPanel: { flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' },
  emptyState: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 12, color: 'var(--text-tertiary)', textAlign: 'center',
  },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 },
  statCard: {
    border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
    padding: '14px 16px', boxShadow: 'var(--shadow-card)',
  },
  statLabel: { fontSize: '0.62rem', color: 'var(--text-quaternary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 },
  statVal: { fontFamily: "'JetBrains Mono', monospace", fontSize: '1.1rem', fontWeight: 700, lineHeight: 1 },
  chartCard: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '16px 18px', boxShadow: 'var(--shadow-card)',
  },
  chartTitle: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' },
}
