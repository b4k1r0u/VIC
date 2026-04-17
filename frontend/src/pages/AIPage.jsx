import React, { useState } from 'react'
import { Sparkles, RefreshCw, FileText, Globe, BookOpen, BarChart2, ChevronRight } from 'lucide-react'

const KPI_PROGRESS = [
  { label: 'Balance Score', current: 47, target: 80, unit: '/ 100', color: 'var(--warning)', invert: false },
  { label: 'Zone III du portefeuille', current: 30.5, target: 18, unit: '%', color: 'var(--danger)', invert: true },
  { label: 'Taux conformité RPA', current: 32, target: 70, unit: '%', color: 'var(--success)', invert: false },
  { label: 'PML 200-ans / Capital', current: 58, target: 40, unit: '%', color: '#ca8a04', invert: true },
  { label: 'Couverture réassurance', current: 70, target: 85, unit: '%', color: 'var(--success)', invert: false },
  { label: 'Nouvelles polices Zone I/0', current: 420, target: 2000, unit: '', color: 'var(--info)', invert: false },
]

const BENCHMARKS = [
  { flag: '🇯🇵', pays: 'Japon', meca: 'JER Pool obligatoire', pen: '32%', lecon: 'Pool national CatNat obligatoire' },
  { flag: '🇺🇸', pays: 'Californie', meca: 'CEA public-privé + Cat Bonds', pen: '13%', lecon: 'Transfert marchés des capitaux' },
  { flag: '🇫🇷', pays: 'France', meca: 'CCR + surcharge obligatoire', pen: '98%', lecon: 'Modèle le plus applicable à l\'Algérie' },
  { flag: '🇹🇷', pays: 'Turquie', meca: 'TCIP universel obligatoire', pen: '50%', lecon: 'Rendre obligatoire effectif' },
  { flag: '🇩🇿', pays: 'Algérie', meca: 'CatNat semi-obligatoire', pen: '~8%', lecon: '→ Cible: 25% en 5 ans', highlight: true },
]

const ZONE_DIRECTIVES = [
  {
    zone: 'III', color: '#dc2626',
    rules: [
      'Franchise minimum: 10% de la SI (min 500 000 DZD)',
      'Attestation RPA99 obligatoire pour tout immeuble > R+2',
      'SI maximum: 50 000 000 DZD sans accord réassureur',
      'Coefficient tarifaire: × 1.8 sur le taux de base',
      'CUMUL ZONE STOP NET: 400 Mrd DZD [Actuel: ~344 Mrd]',
    ],
  },
  {
    zone: 'IIb', color: '#d97706',
    rules: [
      'Franchise minimum: 8% de la SI (min 300 000 DZD)',
      'Vérification RPA99 recommandée pour R+3 et plus',
      'SI maximum: 80 000 000 DZD sans accord réassureur',
      'Coefficient tarifaire: × 1.4 sur le taux de base',
    ],
  },
  {
    zone: 'IIa', color: '#ca8a04',
    rules: [
      'Franchise minimum: 5% de la SI (min 150 000 DZD)',
      'Vérification de conformité recommandée',
      'Coefficient tarifaire: × 1.2 sur le taux de base',
      'Développement actif encouragé avec contrôles standards',
    ],
  },
  {
    zone: 'I / 0', color: '#059669',
    rules: [
      'Conditions standards du marché',
      'Franchise de base: 3% de la SI',
      'Coefficient tarifaire: × 0.9 (tarif préférentiel)',
      'Zone PRIORITAIRE — objectif +5 000 polices/an',
    ],
  },
]

const SectionNum = ({ n }) => (
  <div style={{
    fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '2rem',
    color: 'var(--border)', lineHeight: 1, minWidth: 48, paddingTop: 2,
    userSelect: 'none',
  }}>{n}</div>
)

const SectionHeader = ({ children }) => (
  <div style={{
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.92rem',
    color: 'var(--text-primary)', marginBottom: 14, paddingBottom: 8,
    borderBottom: '2px solid var(--border)',
  }}>{children}</div>
)

export default function AIPage() {
  const [typing, setTyping] = useState(false)
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--primary-50)', border: '1px solid rgba(20,184,166,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={15} color="var(--primary-600)" />
            </div>
            <div style={S.docTitle}>NOTE DE RECOMMANDATION STRATÉGIQUE</div>
          </div>
          <div style={S.docMeta}>
            <span style={S.metaChip}>📅 {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            <span style={S.metaChip}>👤 Direction Générale</span>
            <span style={{ ...S.metaChipDanger }}>🔒 CONFIDENTIEL</span>
          </div>
        </div>
        <button onClick={handleRegen} disabled={typing}
          style={{ ...S.regenBtn, opacity: typing ? 0.7 : 1 }}>
          {typing
            ? <><RefreshCw size={13} style={{ marginRight: 7, animation: 'spin 1s linear infinite' }} />Génération en cours...</>
            : <><Sparkles size={13} style={{ marginRight: 7 }} />Actualiser le rapport</>}
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
            <div style={{ fontWeight: 600, color: 'var(--danger)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
              ⚠️ Risque Critique Identifié
            </div>
            <div style={{ fontSize: '0.8rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
              Le portefeuille IARD présente une <strong style={{ color: 'var(--text-primary)' }}>surconcentration structurelle</strong> en Zone III (sismique critique) à <strong style={{ color: 'var(--danger)' }}>30,5%</strong>, soit 34 369 polices représentant ~344 Mrd DZD d'exposition.
              Le PML à 200 ans est estimé à <strong style={{ color: 'var(--danger)' }}>~285 Mrd DZD</strong>, ce qui représente un risque de rétention nette de ~85 Mrd DZD non-couvert par les réserves actuelles.
            </div>
          </div>
          <div style={S.calloutGreen}>
            <div style={{ fontWeight: 600, color: 'var(--success)', marginBottom: 8, fontSize: '0.85rem' }}>✅ Points Positifs</div>
            <div style={{ fontSize: '0.8rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
              La couverture de réassurance à <strong style={{ color: 'var(--text-primary)' }}>70%</strong> est satisfaisante. La croissance du portefeuille (+11,3% sur 2023–2025) témoigne d'une dynamique commerciale forte.
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
            <Globe size={14} style={{ marginRight: 8, color: 'var(--primary-500)', verticalAlign: 'middle' }} />
            Benchmarking International
          </SectionHeader>
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  {['Pays', 'Mécanisme', 'Pénétration', 'Leçon Clé'].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BENCHMARKS.map(b => (
                  <tr key={b.pays} style={{
                    background: b.highlight ? 'var(--primary-50)' : 'transparent',
                    borderLeft: b.highlight ? '3px solid var(--primary-500)' : '3px solid transparent',
                  }} className="table-row-hover">
                    <td style={S.td}><span style={{ fontSize: '1.1rem' }}>{b.flag}</span> <strong style={{ color: 'var(--text-primary)' }}>{b.pays}</strong></td>
                    <td style={{ ...S.td, maxWidth: 200 }}>{b.meca}</td>
                    <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: b.highlight ? 'var(--primary-600)' : 'var(--text-primary)' }}>{b.pen}</td>
                    <td style={{ ...S.td, fontSize: '0.75rem', color: b.highlight ? 'var(--primary-600)' : 'var(--text-secondary)', fontWeight: b.highlight ? 600 : 400 }}>{b.lecon}</td>
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
            <BookOpen size={14} style={{ marginRight: 8, color: 'var(--primary-500)', verticalAlign: 'middle' }} />
            Directives de Souscription par Zone
          </SectionHeader>
          <div style={S.directivesGrid}>
            {ZONE_DIRECTIVES.map(d => (
              <div key={d.zone} style={{ ...S.directiveCard, borderLeft: `3px solid ${d.color}` }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: '0.82rem', color: d.color, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  ZONE {d.zone}
                  <span style={{ fontSize: '0.55rem', background: `${d.color}10`, padding: '2px 6px', borderRadius: 3, letterSpacing: '0.8px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, textTransform: 'uppercase', color: d.color }}>DIRECTIVES</span>
                </div>
                {d.rules.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 7, lineHeight: 1.5 }}>
                    <ChevronRight size={11} color={d.color} style={{ flexShrink: 0, marginTop: 3 }} />
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
            <BarChart2 size={14} style={{ marginRight: 8, color: 'var(--primary-500)', verticalAlign: 'middle' }} />
            Tableau de Bord KPI — Objectifs 2028
          </SectionHeader>
          <div style={S.kpiGrid}>
            {KPI_PROGRESS.map(k => {
              const pct = k.invert
                ? Math.max(0, 100 - (k.current / k.target) * 100)
                : Math.min(100, (k.current / k.target) * 100)
              return (
                <div key={k.label} style={S.kpiCard}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-quaternary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{k.label}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'baseline' }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: k.color, fontSize: '1rem' }}>
                      {k.current}{k.unit}
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: 'var(--text-quaternary)' }}>
                      → {k.target}{k.unit}
                    </span>
                  </div>
                  <div style={{ height: 4, background: 'var(--border-subtle)', borderRadius: 2, overflow: 'hidden', marginBottom: 5 }}>
                    <div style={{ width: pct + '%', height: '100%', background: k.color, borderRadius: 2, transition: 'width 1s ease' }} />
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-quaternary)' }}>Progression: {pct.toFixed(0)}%</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ height: 24 }} />
    </main>
  )
}

const S = {
  page: { flex: 1, overflowY: 'auto', padding: '20px 24px' },
  docHeader: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)', padding: '18px 22px', marginBottom: 20,
    boxShadow: 'var(--shadow-card)',
  },
  docTitle: {
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.92rem',
    color: 'var(--text-primary)', letterSpacing: '0.2px',
  },
  docMeta: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  metaChip: {
    background: 'var(--bg-subtle)', color: 'var(--text-tertiary)',
    border: '1px solid var(--border)', borderRadius: 4,
    padding: '3px 10px', fontSize: '0.67rem', fontWeight: 500,
  },
  metaChipDanger: {
    background: 'var(--danger-muted)', color: 'var(--danger)',
    border: '1px solid var(--danger-border)', borderRadius: 4,
    padding: '3px 10px', fontSize: '0.67rem', fontWeight: 600,
  },
  regenBtn: {
    background: 'linear-gradient(135deg, #0f766e, #14b8a6)', color: '#fff',
    border: 'none', borderRadius: 'var(--radius)', padding: '9px 16px',
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.78rem',
    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'opacity 0.2s',
    display: 'flex', alignItems: 'center',
  },
  typingBanner: {
    background: 'var(--primary-50)', border: '1px solid rgba(20,184,166,0.15)',
    borderRadius: 'var(--radius)', padding: '10px 16px', marginBottom: 18,
    display: 'flex', alignItems: 'center', gap: 12,
    fontSize: '0.75rem', color: 'var(--primary-700)', fontWeight: 500,
  },
  typingDots: { display: 'flex', gap: 4 },
  section: { display: 'flex', gap: 20, marginBottom: 28 },
  sectionContent: { flex: 1 },
  calloutRed: {
    background: 'var(--surface)', borderLeft: '3px solid var(--danger)', border: '1px solid var(--border)',
    borderLeftWidth: 3, borderLeftColor: 'var(--danger)',
    borderRadius: 'var(--radius-lg)', padding: '16px 18px', marginBottom: 12,
    boxShadow: 'var(--shadow-card)',
  },
  calloutGreen: {
    background: 'var(--surface)', borderLeft: '3px solid var(--success)', border: '1px solid var(--border)',
    borderLeftWidth: 3, borderLeftColor: 'var(--success)',
    borderRadius: 'var(--radius-lg)', padding: '16px 18px',
    boxShadow: 'var(--shadow-card)',
  },
  tableWrap: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    background: 'var(--bg-subtle)', fontSize: '0.63rem', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)',
    padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid var(--border)',
  },
  td: {
    padding: '10px 16px', fontSize: '0.78rem',
    color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)',
  },
  directivesGrid: { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 },
  directiveCard: {
    borderRadius: 'var(--radius-lg)', padding: '14px 16px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-card)',
  },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 },
  kpiCard: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '14px 16px', boxShadow: 'var(--shadow-card)',
  },
}
