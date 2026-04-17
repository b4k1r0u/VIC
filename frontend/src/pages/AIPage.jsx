import React, { useState } from 'react'
import { Sparkles, RefreshCw, FileText, Globe, BookOpen, BarChart2, ChevronRight } from 'lucide-react'

const KPI_PROGRESS = [
  { label:'Balance Score',              current:47,   target:80,  unit:'/ 100', color:'#f59e0b', invert:false },
  { label:'Zone III du portefeuille',   current:30.5, target:18,  unit:'%',     color:'#ef4444', invert:true },
  { label:'Taux conformité RPA',        current:32,   target:70,  unit:'%',     color:'#22c55e', invert:false },
  { label:'PML 200-ans / Capital',      current:58,   target:40,  unit:'%',     color:'#eab308', invert:true },
  { label:'Couverture réassurance',     current:70,   target:85,  unit:'%',     color:'#22c55e', invert:false },
  { label:'Nouvelles polices Zone I/0', current:420,  target:2000,unit:'',      color:'#3b82f6', invert:false },
]

const BENCHMARKS = [
  { flag:'🇯🇵', pays:'Japon',      meca:'JER Pool obligatoire',         pen:'32%', lecon:'Pool national CatNat obligatoire' },
  { flag:'🇺🇸', pays:'Californie', meca:'CEA public-privé + Cat Bonds', pen:'13%', lecon:'Transfert marchés des capitaux' },
  { flag:'🇫🇷', pays:'France',     meca:'CCR + surcharge obligatoire',  pen:'98%', lecon:'Modèle le plus applicable à l\'Algérie' },
  { flag:'🇹🇷', pays:'Turquie',    meca:'TCIP universel obligatoire',   pen:'50%', lecon:'Rendre obligatoire effectif' },
  { flag:'🇩🇿', pays:'Algérie',    meca:'CatNat semi-obligatoire',      pen:'~8%', lecon:'→ Cible: 25% en 5 ans', highlight:true },
]

const ZONE_DIRECTIVES = [
  {
    zone:'III', color:'#ef4444', bg:'var(--surface)', border:'var(--border)',
    rules:[
      'Franchise minimum: 10% de la SI (min 500 000 DZD)',
      'Attestation RPA99 obligatoire pour tout immeuble > R+2',
      'SI maximum: 50 000 000 DZD sans accord réassureur',
      'Coefficient tarifaire: × 1.8 sur le taux de base',
      'CUMUL ZONE STOP NET: 400 Mrd DZD [Actuel: ~344 Mrd]',
    ],
  },
  {
    zone:'IIb', color:'#f59e0b', bg:'var(--surface)', border:'var(--border)',
    rules:[
      'Franchise minimum: 8% de la SI (min 300 000 DZD)',
      'Vérification RPA99 recommandée pour R+3 et plus',
      'SI maximum: 80 000 000 DZD sans accord réassureur',
      'Coefficient tarifaire: × 1.4 sur le taux de base',
    ],
  },
  {
    zone:'IIa', color:'#eab308', bg:'var(--surface)', border:'var(--border)',
    rules:[
      'Franchise minimum: 5% de la SI (min 150 000 DZD)',
      'Vérification de conformité recommandée',
      'Coefficient tarifaire: × 1.2 sur le taux de base',
      'Développement actif encouragé avec contrôles standards',
    ],
  },
  {
    zone:'I / 0', color:'#22c55e', bg:'var(--surface)', border:'var(--border)',
    rules:[
      'Conditions standards du marché',
      'Franchise de base: 3% de la SI',
      'Coefficient tarifaire: × 0.9 (tarif préférentiel)',
      'Zone PRIORITAIRE — objectif +5 000 polices/an',
    ],
  },
]

const SectionNum = ({ n }) => (
  <div style={{
    fontFamily:'JetBrains Mono,monospace', fontWeight:800, fontSize:'2.5rem',
    color:'rgba(34,197,94,0.10)', lineHeight:1, minWidth:52, paddingTop:2,
    userSelect:'none',
  }}>{n}</div>
)

const SectionHeader = ({ children }) => (
  <div style={{
    fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.9rem',
    color:'var(--text-1)', marginBottom:14, paddingBottom:8,
    borderBottom:`2px solid rgba(34,197,94,0.15)`,
  }}>{children}</div>
)

export default function AIPage() {
  const [typing, setTyping]         = useState(false)
  const [regenerated, setRegenerated] = useState(false)

  const handleRegen = () => {
    setTyping(true)
    setTimeout(() => { setTyping(false); setRegenerated(true) }, 2400)
  }

  return (
    <main style={S.page} className="page-fade">
      {/* Header */}
      <div style={S.docHeader}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <FileText size={16} color="var(--g400)" />
            </div>
            <div style={S.docTitle}>NOTE DE RECOMMANDATION STRATÉGIQUE</div>
          </div>
          <div style={S.docMeta}>
            <span style={S.metaChip}>📅 {new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })}</span>
            <span style={S.metaChip}>👤 Direction Générale</span>
            <span style={{ ...S.metaChip, background:'rgba(239,68,68,0.12)', color:'#f87171', border:'1px solid rgba(239,68,68,0.25)' }}>🔒 CONFIDENTIEL</span>
          </div>
        </div>
        <button onClick={handleRegen} disabled={typing}
          style={{ ...S.regenBtn, opacity:typing ? 0.7 : 1 }}>
          {typing
            ? <><RefreshCw size={13} style={{ marginRight:7, animation:'spin 1s linear infinite' }} />Génération en cours...</>
            : <><Sparkles size={13} style={{ marginRight:7 }} />Actualiser le rapport</>}
        </button>
      </div>

      {typing && (
        <div style={S.typingBanner}>
          <div style={S.typingDots}>
            <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
          </div>
          Le moteur analytique croise 113 100 polices pour la mise à jour stratégique...
        </div>
      )}

      {/* Section 01 */}
      <div style={S.section}>
        <SectionNum n="01" />
        <div style={S.sectionContent}>
          <SectionHeader>Diagnostic Exécutif</SectionHeader>
          <div style={S.calloutRed}>
            <div style={{ fontWeight:700, color:'#f87171', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
              ⚠️ Risque Critique Identifié
            </div>
            <div style={{ fontSize:'0.8rem', lineHeight:1.8, color:'var(--text-2)' }}>
              Le portefeuille IARD présente une <strong style={{ color:'var(--text-1)' }}>surconcentration structurelle</strong> en Zone III (sismique critique) à <strong style={{ color:'#f87171' }}>30,5%</strong>, soit 34 369 polices représentant ~344 Mrd DZD d'exposition.
              Le PML à 200 ans est estimé à <strong style={{ color:'#f87171' }}>~285 Mrd DZD</strong>, ce qui représente un risque de rétention nette de ~85 Mrd DZD non-couvert par les réserves actuelles.
            </div>
          </div>
          <div style={S.calloutGreen}>
            <div style={{ fontWeight:700, color:'#4ade80', marginBottom:8 }}>✅ Points Positifs</div>
            <div style={{ fontSize:'0.8rem', lineHeight:1.8, color:'var(--text-2)' }}>
              La couverture de réassurance à <strong style={{ color:'var(--text-1)' }}>70%</strong> est satisfaisante. La croissance du portefeuille (+11,3% sur 2023–2025) témoigne d'une dynamique commerciale forte.
              Le taux de prime de 310 DZD/1 000 DZD de SI reste compétitif.
            </div>
          </div>
        </div>
      </div>

      {/* Section 02 */}
      <div style={S.section}>
        <SectionNum n="02" />
        <div style={S.sectionContent}>
          <SectionHeader>
            <Globe size={14} style={{ marginRight:8, color:'var(--g400)', verticalAlign:'middle' }} />
            Benchmarking International
          </SectionHeader>
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  {['Pays','Mécanisme','Pénétration','Leçon Clé'].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BENCHMARKS.map(b => (
                  <tr key={b.pays} style={{
                    background: b.highlight ? 'rgba(34,197,94,0.06)' : 'transparent',
                    borderLeft: b.highlight ? '3px solid #22c55e' : '3px solid transparent',
                  }}>
                    <td style={S.td}><span style={{ fontSize:'1.1rem' }}>{b.flag}</span> <strong style={{ color:'var(--text-1)' }}>{b.pays}</strong></td>
                    <td style={{ ...S.td, maxWidth:200 }}>{b.meca}</td>
                    <td style={{ ...S.td, fontFamily:'JetBrains Mono,monospace', fontWeight:700, color:b.highlight ? '#4ade80' : 'var(--text-1)' }}>{b.pen}</td>
                    <td style={{ ...S.td, fontSize:'0.72rem', color:b.highlight ? '#4ade80' : 'var(--text-2)', fontWeight:b.highlight?700:400 }}>{b.lecon}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section 03 */}
      <div style={S.section}>
        <SectionNum n="03" />
        <div style={S.sectionContent}>
          <SectionHeader>
            <BookOpen size={14} style={{ marginRight:8, color:'var(--g400)', verticalAlign:'middle' }} />
            Directives de Souscription par Zone
          </SectionHeader>
          <div style={S.directivesGrid}>
            {ZONE_DIRECTIVES.map(d => (
              <div key={d.zone} style={{ ...S.directiveCard, borderLeft:`4px solid ${d.color}`, background:d.bg, border:`1px solid ${d.border}`, borderLeftWidth:4 }}>
                <div style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, fontSize:'0.85rem', color:d.color, marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
                  ZONE {d.zone}
                  <span style={{ fontSize:'0.55rem', background:`${d.color}20`, padding:'2px 6px', borderRadius:4, letterSpacing:'1px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, textTransform:'uppercase' }}>DIRECTIVES</span>
                </div>
                {d.rules.map((r, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:7, fontSize:'0.72rem', color:'var(--text-2)', marginBottom:7, lineHeight:1.5 }}>
                    <ChevronRight size={11} color={d.color} style={{ flexShrink:0, marginTop:2 }} />
                    {r}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 04 */}
      <div style={S.section}>
        <SectionNum n="04" />
        <div style={S.sectionContent}>
          <SectionHeader>
            <BarChart2 size={14} style={{ marginRight:8, color:'var(--g400)', verticalAlign:'middle' }} />
            Tableau de Bord KPI — Objectifs 2028
          </SectionHeader>
          <div style={S.kpiGrid}>
            {KPI_PROGRESS.map(k => {
              const pct = k.invert
                ? Math.max(0, 100 - (k.current / k.target) * 100)
                : Math.min(100, (k.current / k.target) * 100)
              return (
                <div key={k.label} style={S.kpiCard}>
                  <div style={{ fontSize:'0.62rem', color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:8 }}>{k.label}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, color:k.color, fontSize:'1rem' }}>
                      {k.current}{k.unit}
                    </span>
                    <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'0.68rem', color:'var(--text-3)' }}>
                      → {k.target}{k.unit}
                    </span>
                  </div>
                  <div style={{ height:5, background:'rgba(0,0,0,0.07)', borderRadius:4, overflow:'hidden', marginBottom:5 }}>
                    <div style={{ width:pct+'%', height:'100%', background:k.color, borderRadius:4, transition:'width 1s ease', boxShadow:`0 0 6px ${k.color}60` }} />
                  </div>
                  <div style={{ fontSize:'0.6rem', color:'var(--text-3)' }}>Progression: {pct.toFixed(0)}%</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ height:32 }} />
    </main>
  )
}

const S = {
  page: { flex:1, overflowY:'auto', padding:'22px 28px' },
  docHeader: {
    display:'flex', alignItems:'flex-start', justifyContent:'space-between',
    background:'var(--surface)', border:'1px solid var(--border)',
    borderRadius:16, padding:'20px 24px', marginBottom:22,
    boxShadow:'var(--sh-sm)',
  },
  docTitle: {
    fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'0.92rem',
    color:'var(--text-1)', letterSpacing:'0.3px',
  },
  docMeta: { display:'flex', gap:8, flexWrap:'wrap', marginTop:4 },
  metaChip: {
    background:'rgba(34,197,94,0.08)', color:'var(--g400)',
    border:'1px solid rgba(34,197,94,0.2)', borderRadius:6,
    padding:'3px 10px', fontSize:'0.67rem', fontWeight:600,
  },
  regenBtn: {
    background:'linear-gradient(135deg,#15803d,#22c55e)', color:'#fff',
    border:'none', borderRadius:10, padding:'10px 18px',
    fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.78rem',
    cursor:'pointer', whiteSpace:'nowrap', transition:'opacity 0.2s',
    display:'flex', alignItems:'center', boxShadow:'var(--sh-green)',
  },
  typingBanner: {
    background:'rgba(34,197,94,0.07)', border:'1px solid rgba(34,197,94,0.2)',
    borderRadius:10, padding:'10px 16px', marginBottom:18,
    display:'flex', alignItems:'center', gap:12,
    fontSize:'0.75rem', color:'var(--g400)', fontWeight:500,
  },
  typingDots: { display:'flex', gap:4 },
  section: { display:'flex', gap:22, marginBottom:28 },
  sectionContent: { flex:1 },
  calloutRed: {
    background:'var(--surface)', borderLeft:'4px solid #ef4444', borderTop:'1px solid var(--border)', borderRight:'1px solid var(--border)', borderBottom:'1px solid var(--border)',
    borderRadius:12, padding:'16px 18px', marginBottom:12,
    boxShadow:'var(--sh-sm)',
  },
  calloutGreen: {
    background:'var(--surface)', borderLeft:'4px solid #22c55e', borderTop:'1px solid var(--border)', borderRight:'1px solid var(--border)', borderBottom:'1px solid var(--border)',
    borderRadius:12, padding:'16px 18px',
    boxShadow:'var(--sh-sm)',
  },
  tableWrap: {
    background:'var(--surface)', border:'1px solid var(--border)',
    borderRadius:12, overflow:'hidden',
  },
  table: { width:'100%', borderCollapse:'collapse' },
  th: {
    background:'rgba(0,0,0,0.02)', fontSize:'0.62rem', fontWeight:700,
    textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--text-3)',
    padding:'11px 16px', textAlign:'left', borderBottom:'1px solid var(--border)',
  },
  td: {
    padding:'11px 16px', fontSize:'0.78rem',
    color:'var(--text-2)', borderBottom:'1px solid rgba(0,0,0,0.04)',
  },
  directivesGrid: { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14 },
  directiveCard: { borderRadius:12, padding:'14px 16px' },
  kpiGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 },
  kpiCard: {
    background:'var(--surface)', border:'1px solid var(--border)',
    borderRadius:12, padding:'14px 16px', boxShadow:'var(--sh-sm)',
  },
}
