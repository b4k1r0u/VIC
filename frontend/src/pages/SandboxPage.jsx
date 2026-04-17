import React, { useState } from 'react'
import { Search, CheckCircle, XCircle, AlertCircle, Download, Check, X } from 'lucide-react'

const WILAYAS = ['Alger','Oran','Constantine','Sétif','Tipaza','Boumerdès','Chlef','Blida','Tizi Ouzou','Annaba','Jijel','Skikda','Guelma','Tlemcen','Laghouat','Batna','Biskra']
const ZONE_OF = {
  Alger:'III', Oran:'IIa', Constantine:'IIa', Sétif:'IIa',
  Tipaza:'III', Boumerdès:'III', Chlef:'III', Blida:'III',
  'Tizi Ouzou':'IIb', Annaba:'IIa', Jijel:'IIa', Skikda:'IIa',
  Guelma:'IIa', Tlemcen:'I', Laghouat:'I', Batna:'I', Biskra:'I',
}
const ZONE_COLOR = { III:'#ef4444', IIb:'#f59e0b', IIa:'#eab308', I:'#22c55e', '0':'#3b82f6' }
const ZONE_BG    = { III:'rgba(239,68,68,0.1)', IIb:'rgba(245,158,11,0.1)', IIa:'rgba(234,179,8,0.1)', I:'rgba(34,197,94,0.1)', '0':'rgba(59,130,246,0.1)' }
const CUMUL_BASE = 344000

function buildScore(form) {
  let score = 30
  const z = ZONE_OF[form.wilaya] || 'IIa'
  if (z === 'III') score += 35
  if (z === 'IIb') score += 20
  if (z === 'IIa') score += 12
  if (z === 'I')   score -= 5
  if (form.rpa === 'non')         score += 18
  if (form.rpa === 'unknown')     score += 8
  if (form.year === 'before1999') score += 12
  if (form.year === 'after2008')  score -= 6
  const si = parseInt(form.si) || 0
  if (si > 50000000) score += 8
  if (si > 100000000) score += 6
  if (form.type === 'residential') score += 4; else score -= 4
  if (form.floors === 'r5') score += 6
  return Math.min(100, Math.max(0, score))
}

function FieldGroup({ label, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <label style={{ fontSize:'0.63rem', fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'1.2px' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

export default function SandboxPage() {
  const [form, setForm]     = useState({ wilaya:'Alger', si:'50000000', type:'commercial', floors:'r2', year:'before1999', rpa:'non', btype:'chain' })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const zone      = ZONE_OF[form.wilaya] || 'IIa'
  const zoneColor = ZONE_COLOR[zone]
  const si        = parseInt(form.si) || 0
  const siMDZD    = si / 1e6

  const handleAnalyse = () => {
    setLoading(true)
    setTimeout(() => {
      const score    = buildScore(form)
      const newCumul = CUMUL_BASE + siMDZD
      const stopNet  = 400000
      const rec = score >= 80 ? 'refus' : score >= 60 ? 'conditions' : 'accepte'
      setResult({ score, zone, newCumul, stopNet, pctBefore:(CUMUL_BASE/stopNet)*100, pctAfter:(newCumul/stopNet)*100, rec })
      setLoading(false)
    }, 700)
  }

  const set = (k, v) => { setForm(p => ({ ...p, [k]:v })); setResult(null) }

  const selectStyle = {
    width:'100%', padding:'9px 12px', borderRadius:9,
    border:'1px solid var(--border)', fontSize:'0.78rem',
    color:'var(--text-1)', background:'var(--surface2)', cursor:'pointer',
    outline:'none', transition:'border-color 0.15s',
  }

  return (
    <main style={S.page} className="page-fade">
      <div style={S.layout}>

        {/* LEFT — Configurator */}
        <div style={S.leftPanel}>
          <div style={S.panelHeader}>
            <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:6 }}>
              <div style={{ width:34, height:34, borderRadius:9, background:'rgba(236,72,153,0.12)', border:'1px solid rgba(236,72,153,0.22)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Search size={15} color="#f472b6" />
              </div>
              <div>
                <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.88rem', color:'var(--text-1)' }}>
                  Nouvelle Police à Évaluer
                </div>
                <div style={{ fontSize:'0.63rem', color:'var(--text-3)', marginTop:1 }}>
                  Configurez et analysez l'impact avant approbation
                </div>
              </div>
            </div>
          </div>

          {/* Live zone indicator */}
          <div style={{ padding:'10px 18px', borderBottom:'1px solid var(--border)', background:'var(--surface2)', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background:zoneColor, boxShadow:`0 0 8px ${zoneColor}` }} />
            <span style={{ fontSize:'0.72rem', color:'var(--text-2)' }}>Zone détectée:</span>
            <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, color:zoneColor, fontSize:'0.78rem' }}>ZONE {zone}</span>
            <span style={{ marginLeft:'auto', fontSize:'0.63rem', color:'var(--text-3)', fontFamily:'JetBrains Mono,monospace' }}>
              SI: {siMDZD.toFixed(1)} M DZD
            </span>
          </div>

          <div style={S.form}>
            <FieldGroup label="Type de bien">
              <select value={form.type} onChange={e => set('type', e.target.value)} style={selectStyle}>
                <option value="commercial">Installation Commerciale</option>
                <option value="residential">Résidence Principale</option>
                <option value="industrial">Site Industriel</option>
              </select>
            </FieldGroup>

            <FieldGroup label="Wilaya">
              <select value={form.wilaya} onChange={e => set('wilaya', e.target.value)} style={selectStyle}>
                {WILAYAS.map(w => <option key={w}>{w}</option>)}
              </select>
            </FieldGroup>

            <FieldGroup label="Type de bâtiment">
              <select value={form.btype} onChange={e => set('btype', e.target.value)} style={selectStyle}>
                <option value="chain">Maçonnerie Chaînée</option>
                <option value="frame">Béton Armé</option>
                <option value="steel">Structure Métallique</option>
                <option value="other">Autre</option>
              </select>
            </FieldGroup>

            <FieldGroup label="Nombre d'étages">
              <select value={form.floors} onChange={e => set('floors', e.target.value)} style={selectStyle}>
                <option value="r1">R+1</option>
                <option value="r2">R+2</option>
                <option value="r3">R+3</option>
                <option value="r5">R+5 et plus</option>
              </select>
            </FieldGroup>

            <FieldGroup label="Année de construction">
              <select value={form.year} onChange={e => set('year', e.target.value)} style={selectStyle}>
                <option value="before1999">Avant 1999 (pré-RPA)</option>
                <option value="1999_2008">1999–2008</option>
                <option value="after2008">Après 2008</option>
              </select>
            </FieldGroup>

            <FieldGroup label="Conformité RPA99">
              <select value={form.rpa} onChange={e => set('rpa', e.target.value)} style={selectStyle}>
                <option value="oui">✅ Attestée</option>
                <option value="non">❌ Non attestée</option>
                <option value="unknown">❓ Inconnue</option>
              </select>
            </FieldGroup>

            <FieldGroup label={`Valeur Assurée — ${siMDZD.toFixed(1)} M DZD`}>
              <input
                type="number" value={form.si}
                onChange={e => set('si', e.target.value)}
                style={{ ...selectStyle, fontFamily:'JetBrains Mono,monospace', fontSize:'0.82rem' }}
              />
              <input type="range" min={1000000} max={500000000} step={1000000} value={form.si}
                onChange={e => set('si', e.target.value)}
                style={{ width:'100%', accentColor:zoneColor, marginTop:4, cursor:'pointer' }}
              />
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.6rem', color:'var(--text-4)', fontFamily:'JetBrains Mono,monospace' }}>
                <span>1 M</span><span>500 M</span>
              </div>
            </FieldGroup>

            <button onClick={handleAnalyse} disabled={loading} style={S.analyseBtn}>
              {loading
                ? '⏳ Analyse en cours...'
                : <><Search size={14} style={{ marginRight:8 }} />ANALYSER L'IMPACT</>}
            </button>
          </div>
        </div>

        {/* RIGHT — Results */}
        <div style={S.rightPanel}>
          {!result && !loading && (
            <div style={S.empty}>
              <div style={{ fontSize:'3.5rem', animation:'float 4s ease-in-out infinite' }}>🔍</div>
              <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'1rem', color:'var(--text-2)' }}>
                Configurez et lancez l'analyse
              </div>
              <div style={{ fontSize:'0.82rem', color:'var(--text-3)', maxWidth:320, textAlign:'center', lineHeight:1.7 }}>
                Le système calculera l'impact de cette police sur le portefeuille et donnera une recommandation.
              </div>
            </div>
          )}

          {result && (
            <>
              {/* Zone detected */}
              <div style={{ ...S.resultCard, borderTop:`3px solid ${zoneColor}` }}>
                <div style={S.rtLabel}>Zone RPA Détectée</div>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{
                    background:ZONE_BG[result.zone],
                    border:`2px solid ${zoneColor}30`,
                    borderRadius:12, padding:'8px 18px',
                    fontFamily:'JetBrains Mono,monospace', fontSize:'1.8rem',
                    fontWeight:800, color:zoneColor,
                  }}>
                    ZONE {result.zone}
                  </div>
                  {result.zone === 'III' && <span style={{ fontSize:'1.5rem' }}>⚠️</span>}
                  <div style={{ fontSize:'0.72rem', color:'var(--text-3)', lineHeight:1.6 }}>
                    Basé sur: Wilaya <strong style={{ color:'var(--text-2)' }}>{form.wilaya}</strong><br/>
                    → RPA99 Annexe 1
                  </div>
                </div>
              </div>

              {/* Score */}
              <div style={S.resultCard}>
                <div style={S.rtLabel}>Score de Risque Estimé</div>
                <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:14 }}>
                  <div style={{
                    fontFamily:'JetBrains Mono,monospace', fontSize:'2.2rem', fontWeight:800,
                    color:result.score>=80?'#ef4444':result.score>=60?'#f59e0b':'#22c55e',
                  }}>
                    {result.score}<span style={{ fontSize:'1rem', fontWeight:400, color:'var(--text-3)' }}>/100</span>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ height:8, background:'rgba(255,255,255,0.06)', borderRadius:6, overflow:'hidden' }}>
                      <div style={{
                        height:'100%', borderRadius:6,
                        width:result.score+'%',
                        background:result.score>=80?'linear-gradient(90deg,#dc2626,#ef4444)':result.score>=60?'linear-gradient(90deg,#d97706,#f59e0b)':'linear-gradient(90deg,#16a34a,#22c55e)',
                        transition:'width 1s ease',
                        boxShadow:`0 0 12px ${result.score>=80?'#ef444460':result.score>=60?'#f59e0b60':'#22c55e60'}`,
                      }} />
                    </div>
                    <div style={{ fontSize:'0.6rem', color:'var(--text-3)', marginTop:4, fontFamily:'JetBrains Mono,monospace' }}>
                      {result.score >= 80 ? 'RISQUE ÉLEVÉ' : result.score >= 60 ? 'RISQUE MODÉRÉ' : 'RISQUE FAIBLE'}
                    </div>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[
                    { f:`Zone ${result.zone}`, pts:result.zone==='III'?'+35':result.zone==='IIb'?'+20':result.zone==='IIa'?'+12':'-5', bad:['III','IIb'].includes(result.zone) },
                    { f:form.rpa==='non'?'Non-conformité RPA':form.rpa==='oui'?'Conformité RPA':'RPA inconnue', pts:form.rpa==='non'?'+18':form.rpa==='oui'?'0':'+8', bad:form.rpa!=='oui' },
                    { f:form.year==='before1999'?'Bâtiment avant 1999':form.year==='after2008'?'Bâtiment récent (post-2008)':'Bâtiment 1999–2008', pts:form.year==='before1999'?'+12':form.year==='after2008'?'-6':'+0', bad:form.year==='before1999' },
                    { f:`SI: ${siMDZD.toFixed(0)} M DZD`, pts:si>100e6?'+14':si>50e6?'+8':'+2', bad:si>50e6 },
                  ].map((f, i) => (
                    <div key={i} style={{
                      fontSize:'0.7rem', padding:'6px 10px', borderRadius:8,
                      background:f.bad?'rgba(239,68,68,0.08)':'rgba(34,197,94,0.08)',
                      border:`1px solid ${f.bad?'rgba(239,68,68,0.2)':'rgba(34,197,94,0.2)'}`,
                      color:f.bad?'#f87171':'#4ade80',
                    }}>
                      {f.bad?'▲':'▼'} {f.f} <strong style={{ fontFamily:'JetBrains Mono,monospace' }}>{f.pts}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cumul gauge */}
              <div style={S.resultCard}>
                <div style={S.rtLabel}>Cumul Zone III — Impact Stop Net</div>
                {[
                  { label:'AVANT ajout', val:CUMUL_BASE, pct:result.pctBefore },
                  { label:'APRÈS ajout', val:Math.round(result.newCumul), pct:result.pctAfter },
                ].map(r => (
                  <div key={r.label} style={{ marginBottom:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <span style={{ fontSize:'0.7rem', color:'var(--text-2)', fontWeight:500 }}>{r.label}</span>
                      <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'0.7rem', fontWeight:700,
                        color:r.pct>90?'#ef4444':r.pct>75?'#f59e0b':'var(--g400)' }}>
                        {r.val.toLocaleString('fr-FR')} / 400 000 MDZD ({r.pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div style={{ height:9, background:'rgba(255,255,255,0.06)', borderRadius:6, overflow:'hidden' }}>
                      <div style={{
                        width:`${Math.min(r.pct,100)}%`, height:'100%',
                        background:r.pct>90?'#ef4444':r.pct>75?'#f59e0b':'#22c55e',
                        borderRadius:6, transition:'width 0.9s ease',
                        boxShadow:`0 0 8px ${r.pct>90?'#ef444460':r.pct>75?'#f59e0b60':'#22c55e60'}`,
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Decision box */}
              <div style={{
                ...S.decisionBox,
                borderColor: result.rec==='refus'?'rgba(239,68,68,0.4)':result.rec==='conditions'?'rgba(245,158,11,0.4)':'rgba(34,197,94,0.4)',
                background: result.rec==='refus'?'rgba(239,68,68,0.07)':result.rec==='conditions'?'rgba(245,158,11,0.07)':'rgba(34,197,94,0.07)',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  {result.rec==='refus'
                    ? <XCircle size={20} color="#ef4444" />
                    : result.rec==='conditions'
                    ? <AlertCircle size={20} color="#f59e0b" />
                    : <CheckCircle size={20} color="#22c55e" />}
                  <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'0.9rem',
                    color:result.rec==='refus'?'#ef4444':result.rec==='conditions'?'#f59e0b':'#22c55e' }}>
                    {result.rec==='refus'?'RECOMMANDATION: REFUS CONSEILLÉ':
                     result.rec==='conditions'?'RECOMMANDATION: ACCEPTER AVEC CONDITIONS':
                     'RECOMMANDATION: ACCEPTATION STANDARD'}
                  </div>
                </div>
                {result.rec==='refus' && (
                  <div style={{ fontSize:'0.75rem', color:'var(--text-2)', lineHeight:1.7, marginBottom:14 }}>
                    Cette police ajoute <strong style={{ color:'#ef4444' }}>{siMDZD.toFixed(1)} M DZD</strong> en Zone III ({result.pctAfter.toFixed(1)}% du STOP NET → seuil critique 90%).<br/>
                    Alternative: franchises renforcées + cession 90% réassureur.
                  </div>
                )}
                {result.rec==='conditions' && (
                  <div style={{ fontSize:'0.75rem', color:'var(--text-2)', lineHeight:1.7, marginBottom:14 }}>
                    Acceptation possible sous réserve de: franchise ≥ 10%, attestation RPA99 fournie sous 30 jours, cession 70% minimum au réassureur.
                  </div>
                )}
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {result.rec !== 'refus' && (
                    <button style={{ ...S.actionBtn, background:result.rec==='conditions'?'rgba(245,158,11,0.15)':'rgba(34,197,94,0.15)', color:result.rec==='conditions'?'#f59e0b':'#22c55e', border:`1px solid ${result.rec==='conditions'?'rgba(245,158,11,0.3)':'rgba(34,197,94,0.3)'}` }}>
                      <Check size={13} style={{ marginRight:5 }} />
                      {result.rec==='conditions'?'ACCEPTER AVEC CONDITIONS':'ACCEPTER'}
                    </button>
                  )}
                  <button style={{ ...S.actionBtn, background:'rgba(239,68,68,0.12)', color:'#f87171', border:'1px solid rgba(239,68,68,0.25)' }}>
                    <X size={13} style={{ marginRight:5 }} />REFUSER
                  </button>
                  <button style={{ ...S.actionBtn, background:'rgba(255,255,255,0.06)', color:'var(--text-2)', border:'1px solid var(--border)' }}>
                    <Download size={13} style={{ marginRight:5 }} />EXPORTER
                  </button>
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
  page: { flex:1, overflowY:'auto', padding:'18px 24px' },
  layout: { display:'flex', gap:16, minHeight:'80vh' },
  leftPanel: {
    width:320, background:'var(--surface)', border:'1px solid var(--border)',
    borderRadius:14, overflow:'hidden', boxShadow:'var(--sh-sm)',
    display:'flex', flexDirection:'column',
  },
  panelHeader: {
    padding:'18px 20px', borderBottom:'1px solid var(--border)',
    background:'rgba(255,255,255,0.02)',
  },
  form: { padding:'16px', overflowY:'auto', display:'flex', flexDirection:'column', gap:14 },
  analyseBtn: {
    background:'linear-gradient(135deg, #15803d, #22c55e)',
    color:'#fff', border:'none', borderRadius:10, padding:'12px',
    fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.82rem',
    cursor:'pointer', marginTop:4, transition:'opacity 0.2s',
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'var(--sh-green)', letterSpacing:'0.5px',
  },
  rightPanel: { flex:1, display:'flex', flexDirection:'column', gap:14 },
  empty: {
    flex:1, display:'flex', flexDirection:'column',
    alignItems:'center', justifyContent:'center', gap:14,
    color:'var(--text-3)', textAlign:'center', minHeight:'60vh',
  },
  resultCard: {
    background:'var(--surface)', border:'1px solid var(--border)',
    borderRadius:14, padding:'18px 20px', boxShadow:'var(--sh-sm)',
  },
  rtLabel: {
    fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase',
    letterSpacing:'1.2px', color:'var(--text-3)', marginBottom:10,
  },
  decisionBox: { border:'2px solid', borderRadius:14, padding:'18px 20px' },
  actionBtn: {
    border:'none', borderRadius:9, padding:'9px 14px',
    fontSize:'0.72rem', fontWeight:700, cursor:'pointer',
    fontFamily:'Syne,sans-serif', display:'flex', alignItems:'center',
    transition:'opacity 0.15s',
  },
}
