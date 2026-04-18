import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Gauge,
  Layers,
  MapPin,
  PlayCircle,
  Radar,
  Shield,
  Sparkles,
  TrendingDown,
} from 'lucide-react'
import ScenarioSelector from '../components/simulation/ScenarioSelector'
import SimulationKPIs from '../components/simulation/SimulationKPIs'
import LossDistributionChart from '../components/simulation/LossDistributionChart'
import RecommendationCallout from '../components/shared/RecommendationCallout'
import useSimulationStore from '../store/simulationStore'
import { formatCompactDzd, formatDateTime, formatInteger } from '../utils/format'

function formatDZD(value) {
  if (value == null) return '—'
  return formatCompactDzd(value)
}

function PageStyles() {
  return (
    <style>{`
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes pulseRing {
        0%   { transform: scale(0.85); opacity: 0.6; }
        70%  { transform: scale(1.18); opacity: 0; }
        100% { transform: scale(1.18); opacity: 0; }
      }

      .simulation-page .simulation-card {
        transition: transform 0.18s ease, box-shadow 0.18s ease;
      }
      .simulation-page .simulation-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 18px 44px rgba(15,23,42,0.08);
      }

      /* ══════════════════════════════════════════════════
         SCOPE BUTTONS — full-width vertical stack
         Nuclear override: targets every possible wrapper
      ══════════════════════════════════════════════════ */

      /* 1. Force the immediate grid/flex container of the 3 buttons to be a column */
      .scenario-surface > div > div:has(> button),
      .scenario-surface > div:has(> button),
      .scenario-surface [class*="grid"],
      .scenario-surface [style*="grid"],
      .scenario-surface [style*="display: grid"],
      .scenario-surface [style*="display:grid"] {
        display: flex !important;
        flex-direction: column !important;
        gap: 8px !important;
        width: 100% !important;
        grid-template-columns: unset !important;
      }

      /* 2. Every button inside scenario-surface → full width pill */
      .scenario-surface button {
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        width: 100% !important;
        min-height: 48px !important;
        padding: 0 18px !important;
        border-radius: 14px !important;
        border: 1.5px solid #e2e8f0 !important;
        background: #f8fafc !important;
        cursor: pointer !important;
        font-size: 0.875rem !important;
        font-weight: 700 !important;
        color: #334155 !important;
        text-align: left !important;
        transition: all 0.15s ease !important;
        box-shadow: none !important;
        gap: 12px !important;
        overflow: hidden !important;
      }

      /* 3. Keep only the icon + the title text visible — hide description */
      /* Hide any <p>, <small>, second <span>, nested div with description */
      .scenario-surface button p,
      .scenario-surface button small,
      .scenario-surface button [class*="desc"],
      .scenario-surface button [class*="sub"],
      .scenario-surface button [class*="text"]:not(:first-child),
      .scenario-surface button > div > p,
      .scenario-surface button > div > small,
      .scenario-surface button > div > span:nth-child(2),
      .scenario-surface button > span:nth-child(3),
      .scenario-surface button > span:nth-child(4),
      .scenario-surface button > div:last-child:not(:first-child) {
        display: none !important;
      }

      /* 4. The inner wrapper div (icon + text column) should be a clean row */
      .scenario-surface button > div {
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        gap: 12px !important;
        width: 100% !important;
      }

      /* 5. The text column inside the button → single line label only */
      .scenario-surface button > div > div,
      .scenario-surface button > div > span {
        display: flex !important;
        flex-direction: column !important;
      }

      /* 6. Hover */
      .scenario-surface button:hover {
        background: #eff6ff !important;
        border-color: #93c5fd !important;
        color: #1d4ed8 !important;
        box-shadow: 0 4px 16px rgba(37,99,235,0.1) !important;
      }

      /* 7. Active / selected — catch every framework's pattern */
      .scenario-surface button.active,
      .scenario-surface button[data-active="true"],
      .scenario-surface button[aria-pressed="true"],
      .scenario-surface button[data-selected="true"],
      .scenario-surface button[data-state="active"],
      .scenario-surface button[data-state="on"] {
        background: linear-gradient(135deg, #1e40af, #2563eb) !important;
        border-color: #2563eb !important;
        color: #ffffff !important;
        box-shadow: 0 6px 20px rgba(37,99,235,0.28) !important;
      }

      /* 8. Make sure the run button doesn't get the scope button styles */
      .scenario-surface button[type="submit"],
      .scenario-surface button.sim-run-btn,
      .scenario-surface button[class*="launch"],
      .scenario-surface button[class*="run"],
      .scenario-surface button[class*="submit"] {
        background: linear-gradient(135deg, #0f766e, #14b8a6) !important;
        border-color: #0f766e !important;
        color: #ffffff !important;
        justify-content: space-between !important;
        font-size: 0.9rem !important;
        padding: 0 20px !important;
        min-height: 52px !important;
        border-radius: 16px !important;
        box-shadow: 0 6px 20px rgba(15,118,110,0.3) !important;
      }
      .scenario-surface button[type="submit"]:hover,
      .scenario-surface button.sim-run-btn:hover,
      .scenario-surface button[class*="launch"]:hover,
      .scenario-surface button[class*="run"]:hover {
        background: linear-gradient(135deg, #0e6560, #0f9d8a) !important;
        box-shadow: 0 8px 28px rgba(15,118,110,0.4) !important;
      }

      @media (max-width: 1180px) {
        .simulation-page .simulation-layout { grid-template-columns: minmax(0, 1fr); }
        .simulation-page .simulation-result-grid { grid-template-columns: minmax(0, 1fr); }
      }
      @media (max-width: 760px) {
        .simulation-page { padding: 14px; }
        .simulation-page .simulation-meta,
        .simulation-page .simulation-hero-stats,
        .simulation-page .simulation-summary-strip {
          grid-template-columns: minmax(0, 1fr);
        }
      }
    `}</style>
  )
}

function ScopeBadge({ result }) {
  if (!result) return null
  const label =
    result.scope === 'national'
      ? 'National portfolio'
      : result.scope === 'wilaya'
        ? `Wilaya · ${result.scope_code ?? 'targeted'}`
        : `Commune · ${result.scope_code ?? 'targeted'}`
  return (
    <div style={S.scopeBadge}>
      <MapPin size={12} style={{ flexShrink: 0 }} />
      <span>{label}</span>
    </div>
  )
}

function HeroStat({ icon: Icon, label, value, tone }) {
  return (
    <div style={{ ...S.heroStat, borderColor: `${tone}30` }}>
      <div style={{ ...S.heroStatIcon, background: `${tone}15`, color: tone }}>
        <Icon size={15} />
      </div>
      <div>
        <div style={S.heroStatLabel}>{label}</div>
        <div style={S.heroStatValue}>{value}</div>
      </div>
    </div>
  )
}

function SummaryPill({ label, value, accent }) {
  return (
    <div style={{ ...S.summaryPill, borderColor: `${accent}2c` }}>
      <div style={S.summaryPillLabel}>{label}</div>
      <div style={{ ...S.summaryPillValue, color: accent }}>{value}</div>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={S.emptyState} className="simulation-card">
      <div style={S.emptyOrb}>
        <Radar size={22} color="#14b8a6" />
      </div>
      <div style={S.emptyTitle}>Simulation ready to run</div>
      <div style={S.emptyText}>
        Select a historical earthquake or configure a custom event. The platform
        will then display loss distribution, the most exposed communes, and a
        decision-ready summary.
      </div>
    </div>
  )
}

function RunningState() {
  return (
    <div style={S.runningState} className="simulation-card">
      <div style={S.runningVisual}>
        <div style={S.runningPulse} />
        <div style={S.loadingRing} />
        <PlayCircle size={20} color="#0f766e" style={{ position: 'absolute' }} />
      </div>
      <div style={S.emptyTitle}>Monte Carlo run in progress</div>
      <div style={S.emptyText}>
        The engine combines scenario intensity, structural fragility, and loss dispersion
        to estimate VaR, PML, and spatial impact.
      </div>
      <div style={S.runningSteps}>
        {[
          'Selecting the exposed sub-portfolio',
          'Propagating losses across iterations',
          'Consolidating metrics and summary',
        ].map((step) => (
          <div key={step} style={S.runningStep}>
            <span style={S.runningDot} />
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TopExposureList({ result }) {
  const rows = useMemo(
    () =>
      [...(result?.per_commune_json ?? [])]
        .sort((a, b) => (b.expected_loss ?? 0) - (a.expected_loss ?? 0))
        .slice(0, 6),
    [result]
  )
  if (!rows.length) {
    return <div style={S.noDataNotice}>No commune-level detail was returned for this simulation.</div>
  }
  const max = rows[0]?.expected_loss ?? 1
  return (
    <div style={S.exposureList}>
      {rows.map((row, index) => {
        const ratio = Math.max(8, Math.round(((row.expected_loss ?? 0) / max) * 100))
        return (
          <div key={`${row.wilaya_code}-${row.commune_name}-${index}`} style={S.exposureRow}>
            <div style={S.exposureRank}>{index + 1}</div>
            <div style={S.exposureInfo}>
              <div style={S.exposureName}>{row.commune_name}</div>
              <div style={S.exposureMeta}>
                Wilaya {row.wilaya_code} · {formatInteger(row.affected_policies ?? row.policy_count)} policies
              </div>
              <div style={S.exposureTrack}>
                <div style={{ ...S.exposureFill, width: `${ratio}%` }} />
              </div>
            </div>
            <div style={S.exposureValue}>{formatDZD(row.expected_loss)}</div>
          </div>
        )
      })}
    </div>
  )
}

function InsightCard({ icon: Icon, label, value, note, tone }) {
  return (
    <div style={{ ...S.insightCard, borderColor: `${tone}28` }} className="simulation-card">
      <div style={{ ...S.insightIcon, background: `${tone}14`, color: tone }}>
        <Icon size={15} />
      </div>
      <div style={S.insightBody}>
        <div style={S.insightLabel}>{label}</div>
        <div style={S.insightValue}>{value}</div>
        <div style={S.insightNote}>{note}</div>
      </div>
    </div>
  )
}

function ResultSummary({ result }) {
  const returnRate =
    result.expected_gross_loss > 0
      ? (result.expected_net_loss / result.expected_gross_loss) * 100
      : 0
  const peakCommune = [...(result.per_commune_json ?? [])].sort(
    (a, b) => (b.expected_loss ?? 0) - (a.expected_loss ?? 0)
  )[0]

  return (
    <div style={S.resultGrid} className="simulation-result-grid">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        style={{ ...S.featureCard, ...S.summaryCard }}
        className="simulation-card"
      >
        <div style={S.cardHeader}>
          <div>
            <div style={S.cardEyebrow}>Résumé exécutif</div>
            <div style={S.cardTitle}>{result.scenario_name}</div>
          </div>
          <ScopeBadge result={result} />
        </div>
        <div style={S.summaryStrip} className="simulation-summary-strip">
          <SummaryPill label="Perte nette attendue" value={formatDZD(result.expected_net_loss)} accent="#dc2626" />
          <SummaryPill label="VaR 99%" value={formatDZD(result.var_99)} accent="#2563eb" />
          <SummaryPill label="PML 99,9%" value={formatDZD(result.pml_999)} accent="#7c3aed" />
        </div>
        <div style={S.metaRow} className="simulation-meta">
          <div style={S.metaBlock}>
            <div style={S.metaLabel}>Exécuté le</div>
            <div style={S.metaValue}>{formatDateTime(result.created_at)}</div>
          </div>
          <div style={S.metaBlock}>
            <div style={S.metaLabel}>Polices affectées</div>
            <div style={S.metaValue}>{formatInteger(result.affected_policies)}</div>
          </div>
          <div style={S.metaBlock}>
            <div style={S.metaLabel}>Rétention nette</div>
            <div style={S.metaValue}>{returnRate.toFixed(0)}%</div>
          </div>
        </div>
        <SimulationKPIs result={result} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.04 }}
        style={{ ...S.featureCard, ...S.recommendationCard }}
        className="simulation-card"
      >
        <div style={S.cardHeader}>
          <div>
            <div style={S.cardEyebrow}>Décision assistée</div>
            <div style={S.cardTitle}>Synthèse IA du scénario</div>
          </div>
          <div style={S.glowBadge}>
            <Sparkles size={12} />
            <span>Auto-generated</span>
          </div>
        </div>
        <RecommendationCallout
          payload={result}
          eyebrow="Simulation recommendation"
          title="Lecture prioritaire"
          badgeLabel="Analyse"
          emptyMessage="Aucune recommandation textuelle n'a encore été produite pour cette exécution."
          accent="#0f766e"
          surface="linear-gradient(180deg, #ecfeff 0%, #ffffff 100%)"
          borderColor="#a5f3fc"
          quoteSurface="rgba(255,255,255,0.88)"
        />
        <div style={S.insightStack}>
          <InsightCard icon={Shield} label="Perte brute" value={formatDZD(result.expected_gross_loss)} note="Vision avant réassurance" tone="#0f766e" />
          <InsightCard icon={Gauge} label="Point de rupture" value={formatDZD(result.var_95)} note="Niveau absorbable dans 95% des cas" tone="#f59e0b" />
          <InsightCard icon={MapPin} label="Hotspot principal" value={peakCommune?.commune_name ?? '—'} note={peakCommune ? formatDZD(peakCommune.expected_loss) : 'Aucun hotspot reçu'} tone="#2563eb" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.08 }}
        style={{ ...S.featureCard, ...S.chartCard }}
        className="simulation-card"
      >
        <div style={S.cardHeader}>
          <div>
            <div style={S.cardEyebrow}>Distribution des pertes</div>
            <div style={S.cardTitle}>Courbe de dispersion Monte Carlo</div>
          </div>
          <div style={S.lightBadge}>
            <BarChart3 size={12} />
            <span>{formatInteger(result.distribution_json?.length || 0)} échantillons</span>
          </div>
        </div>
        <div style={S.chartLegend}>
          {[['#2563eb', 'Distribution nette simulée'], ['#f59e0b', 'VaR 95%'], ['#ef4444', 'VaR 99%']].map(([color, label]) => (
            <div key={label} style={S.legendItem}>
              <span style={{ ...S.legendDot, background: color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div style={S.chartWrap}>
          <LossDistributionChart result={result} />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.12 }}
        style={{ ...S.featureCard, ...S.exposureCard }}
        className="simulation-card"
      >
        <div style={S.cardHeader}>
          <div>
            <div style={S.cardEyebrow}>Impact spatial</div>
            <div style={S.cardTitle}>Communes les plus exposées</div>
          </div>
          <div style={S.lightBadge}>
            <Layers size={12} />
            <span>{formatInteger(result.per_commune_json?.length || 0)} communes</span>
          </div>
        </div>
        <TopExposureList result={result} />
      </motion.div>
    </div>
  )
}

export default function Simulation() {
  const result = useSimulationStore((state) => state.result)
  const isRunning = useSimulationStore((state) => state.isRunning)

  const headerStats = useMemo(() => [
    { icon: TrendingDown, label: 'Perte attendue', value: result ? formatDZD(result.expected_net_loss) : 'Monte Carlo ready', tone: '#f97316' },
    { icon: Activity, label: 'Polices impactées', value: result ? formatInteger(result.affected_policies) : 'Scénario requis', tone: '#2563eb' },
    { icon: AlertTriangle, label: 'PML 99,9%', value: result ? formatDZD(result.pml_999) : 'À calculer', tone: '#7c3aed' },
  ], [result])

  return (
    <main style={S.page} className="simulation-page">
      <PageStyles />

      <header style={S.pageHeader} className="simulation-header">
        <div style={S.headerCopy}>
          <div style={S.headerEyebrow}>
            <Radar size={12} />
            <span>Model 2 · Monte Carlo Loss Simulation</span>
          </div>
          <h1 style={S.headerTitle}>Simulation sismique du portefeuille</h1>
          <p style={S.headerText}>
            Une interface de stress testing orientée décision pour mesurer l'impact financier d'un
            séisme sur le portefeuille, avec lecture spatiale et indicateurs extrêmes.
          </p>
        </div>
        <div style={S.heroStats} className="simulation-hero-stats">
          {headerStats.map((item) => (
            <HeroStat key={item.label} icon={item.icon} label={item.label} value={item.value} tone={item.tone} />
          ))}
        </div>
      </header>

      <div style={S.layout} className="simulation-layout">
        <aside style={S.leftCol}>
          <div style={S.controlCard} className="scenario-surface simulation-card">
            <ScenarioSelector />
          </div>
        </aside>
        <section style={S.rightCol}>
          {!result && !isRunning ? <EmptyState /> : null}
          {isRunning ? <RunningState /> : null}
          {result && !isRunning ? <ResultSummary result={result} /> : null}
        </section>
      </div>
    </main>
  )
}

/* ══════════════════════════════════════════════════
   STYLE DICTIONARY
══════════════════════════════════════════════════ */
const S = {
  page: {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    padding: '18px 20px 20px',
    background: 'radial-gradient(circle at top left, rgba(20,184,166,0.08), transparent 22%), linear-gradient(180deg, #f8fafc 0%, #eef4f7 100%)',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  pageHeader: {
    borderRadius: 28,
    padding: '22px 24px',
    background: 'radial-gradient(circle at right top, rgba(45,212,191,0.18), transparent 24%), linear-gradient(135deg, #0f172a, #102a43 60%, #0f766e 110%)',
    color: '#ffffff',
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.2fr) minmax(320px, 0.8fr)',
    gap: 18,
    alignItems: 'end',
    boxShadow: '0 24px 60px rgba(15,23,42,0.14)',
    flexShrink: 0,
  },
  headerCopy: { minWidth: 0 },
  headerEyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 12px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  headerTitle: {
    margin: 0,
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: 'clamp(1.7rem, 3vw, 2.6rem)',
    lineHeight: 1.02,
    maxWidth: 540,
    letterSpacing: '-0.04em',
  },
  headerText: {
    margin: '12px 0 0',
    maxWidth: 560,
    fontSize: 14,
    lineHeight: 1.72,
    color: 'rgba(255,255,255,0.78)',
  },
  heroStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 12,
  },
  heroStat: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 15px',
    borderRadius: 20,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid',
    backdropFilter: 'blur(12px)',
  },
  heroStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.64)', marginBottom: 3 },
  heroStatValue: { fontSize: 14, fontWeight: 700, color: '#ffffff', lineHeight: 1.25 },

  layout: {
    minHeight: 0,
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'minmax(320px, 420px) minmax(0, 1fr)',
    gap: 18,
    alignItems: 'stretch',
  },
  leftCol: { minHeight: 0 },
  controlCard: {
    height: '100%',
    borderRadius: 28,
    background: 'rgba(255,255,255,0.9)',
    border: '1px solid rgba(255,255,255,0.75)',
    boxShadow: '0 18px 44px rgba(15,23,42,0.08)',
    padding: 18,
    overflow: 'auto',
  },
  rightCol: {
    minWidth: 0,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  },

  featureCard: {
    borderRadius: 24,
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    padding: 18,
    boxShadow: '0 14px 40px rgba(15,23,42,0.06)',
  },
  resultGrid: {
    minHeight: 0,
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.2fr) minmax(320px, 0.86fr)',
    gap: 18,
  },
  summaryCard: { display: 'flex', flexDirection: 'column', gap: 16 },
  recommendationCard: { display: 'flex', flexDirection: 'column', gap: 14 },
  chartCard: { minHeight: 440, display: 'flex', flexDirection: 'column', gap: 14 },
  exposureCard: { minHeight: 440, display: 'flex', flexDirection: 'column', gap: 14 },

  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  cardEyebrow: { fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8', marginBottom: 4 },
  cardTitle: { fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, lineHeight: 1.15, color: '#0f172a' },

  summaryStrip: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 },
  summaryPill: { borderRadius: 18, border: '1px solid', background: '#f8fafc', padding: '14px 15px' },
  summaryPillLabel: { fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6 },
  summaryPillValue: { fontSize: 16, fontWeight: 800, lineHeight: 1.2 },

  metaRow: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 },
  metaBlock: { padding: '13px 14px', borderRadius: 16, background: 'linear-gradient(180deg, #f8fafc, #ffffff)', border: '1px solid #e2e8f0' },
  metaLabel: { fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' },
  metaValue: { fontSize: 14, fontWeight: 700, color: '#0f172a' },

  scopeBadge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 999, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' },
  glowBadge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 999, background: '#ecfeff', border: '1px solid #a5f3fc', color: '#0f766e', fontSize: 12, fontWeight: 700 },
  lightBadge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 999, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontSize: 12, fontWeight: 700 },

  insightStack: { display: 'grid', gap: 10 },
  insightCard: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 13px', borderRadius: 18, background: '#ffffff', border: '1px solid' },
  insightIcon: { width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  insightBody: { minWidth: 0 },
  insightLabel: { fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 },
  insightValue: { fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 2 },
  insightNote: { fontSize: 12, color: '#94a3b8' },

  chartLegend: { display: 'flex', flexWrap: 'wrap', gap: 12 },
  legendItem: { display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#475569', fontWeight: 600 },
  legendDot: { width: 9, height: 9, borderRadius: 999 },
  chartWrap: { flex: 1, minHeight: 300 },

  exposureList: { display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto' },
  exposureRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 13px', borderRadius: 18, background: 'linear-gradient(180deg, #f8fafc, #ffffff)', border: '1px solid #e2e8f0' },
  exposureRank: { width: 30, height: 30, borderRadius: 10, background: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 },
  exposureInfo: { flex: 1, minWidth: 0 },
  exposureName: { fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  exposureMeta: { fontSize: 12, color: '#64748b', marginBottom: 8 },
  exposureTrack: { height: 6, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' },
  exposureFill: { height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #38bdf8, #2563eb, #ef4444)' },
  exposureValue: { fontSize: 13, fontWeight: 800, color: '#dc2626', textAlign: 'right', flexShrink: 0 },
  noDataNotice: { padding: '14px 16px', borderRadius: 16, background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', fontSize: 13, lineHeight: 1.6 },

  emptyState: {
    flex: 1, borderRadius: 28, border: '1px solid rgba(255,255,255,0.68)',
    background: 'radial-gradient(circle at top right, rgba(45,212,191,0.16), transparent 20%), linear-gradient(180deg, rgba(255,255,255,0.94), rgba(255,255,255,0.88))',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '48px 26px', textAlign: 'center', boxShadow: '0 20px 48px rgba(15,23,42,0.08)',
  },
  runningState: {
    flex: 1, borderRadius: 28, border: '1px solid rgba(255,255,255,0.68)',
    background: 'radial-gradient(circle at top, rgba(20,184,166,0.18), transparent 22%), linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.88))',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '44px 26px', textAlign: 'center', boxShadow: '0 20px 48px rgba(15,23,42,0.08)',
  },
  emptyOrb: { width: 74, height: 74, borderRadius: 24, background: 'linear-gradient(135deg, #ecfeff, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  runningVisual: { position: 'relative', width: 84, height: 84, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  runningPulse: { position: 'absolute', inset: 8, borderRadius: '50%', background: 'rgba(20,184,166,0.12)', animation: 'pulseRing 1.8s infinite' },
  loadingRing: { width: 58, height: 58, borderRadius: '50%', border: '4px solid #d1fae5', borderTopColor: '#0f766e', animation: 'spin 0.9s linear infinite' },
  emptyTitle: { fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 10 },
  emptyText: { maxWidth: 620, fontSize: 14, lineHeight: 1.75, color: '#64748b' },
  runningSteps: { marginTop: 18, display: 'grid', gap: 8 },
  runningStep: { display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', justifyContent: 'center' },
  runningDot: { width: 8, height: 8, borderRadius: 999, background: '#14b8a6', boxShadow: '0 0 0 4px rgba(20,184,166,0.12)' },
}
