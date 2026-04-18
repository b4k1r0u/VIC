import React, { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  BrainCircuit,
  Layers3,
  Radar,
  ShieldCheck,
  Sparkles,
  TimerReset,
} from 'lucide-react'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import RecommendationCallout from '../components/shared/RecommendationCallout'
import ZoneBadge from '../components/shared/ZoneBadge'
import { geoAPI } from '../api/geo'
import { mlAPI } from '../api/ml'
import { CONSTRUCTION_TYPE_OPTIONS, TYPE_RISQUE_OPTIONS } from '../types/policy'
import {
  formatCompactDzd,
  formatInteger,
} from '../utils/format'

const TIER_META = {
  LOW: { label: 'Faible', color: '#0f766e', bg: '#ccfbf1' },
  MEDIUM: { label: 'Moyen', color: '#b45309', bg: '#fef3c7' },
  HIGH: { label: 'Élevé', color: '#b91c1c', bg: '#fee2e2' },
}

const FEATURE_COLORS = ['#0f766e', '#0e7490', '#2563eb', '#7c3aed', '#c2410c']

const SCORE_PRESETS = {
  risky: {
    policy_id: 'RISKY_ALGER_III',
    zone_sismique: 'III',
    wilaya_code: '16',
    commune_name: 'ALGER CENTRE',
    type_risque: '1 - Bien Immobilier',
    construction_type: 'Beton arme',
    valeur_assuree: 12000000,
    prime_nette: 24000,
    year: 2025,
    query: 'Return a concise underwriting verdict and 3 actions.',
    top_k: 4,
  },
  safer: {
    policy_id: 'SAFE_ORAN_IIA',
    zone_sismique: 'IIa',
    wilaya_code: '31',
    commune_name: 'ORAN',
    type_risque: '1 - Bien Immobilier',
    construction_type: 'Beton arme',
    valeur_assuree: 5000000,
    prime_nette: 9000,
    year: 2025,
    query: 'Return a concise underwriting verdict and 3 actions.',
    top_k: 4,
  },
}

function StatTile({ icon: Icon, label, value, note, accent = '#0f766e' }) {
  return (
    <div style={S.statTile}>
      <div style={{ ...S.statIcon, color: accent, background: `${accent}15` }}>
        <Icon size={16} />
      </div>
      <div style={S.statLabel}>{label}</div>
      <div style={{ ...S.statValue, color: accent }}>{value}</div>
      <div style={S.statNote}>{note}</div>
    </div>
  )
}

function ImportanceTooltip({ active, payload }) {
  if (!active || !payload?.length) return null

  return (
    <div style={S.tooltip}>
      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
        {payload[0].payload.label}
      </div>
      <div style={{ color: '#334155' }}>
        Importance: <strong>{payload[0].value.toFixed(2)}</strong>
      </div>
    </div>
  )
}

function ScoreBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={S.scoreBarLabelRow}>
        <span>{label}</span>
        <strong>{value.toFixed(1)}%</strong>
      </div>
      <div style={S.scoreBarTrack}>
        <div style={{ ...S.scoreBarFill, width: `${Math.min(100, value)}%`, background: color }} />
      </div>
    </div>
  )
}

function normalizeText(value) {
  return String(value ?? '').trim()
}

function buildFormFromPreset(preset) {
  return {
    wilaya_code: preset.wilaya_code,
    commune_name: preset.commune_name,
    zone_sismique: preset.zone_sismique,
    type_risque: preset.type_risque,
    construction_type:
      preset.construction_type === 'Beton arme' ? 'Béton armé' : preset.construction_type,
    valeur_assuree: String(preset.valeur_assuree),
    prime_nette: String(preset.prime_nette),
    year: String(preset.year),
    query: preset.query,
    top_k: String(preset.top_k),
  }
}

function PageStyles() {
  return (
    <style>{`
      .ai-page input, .ai-page select, .ai-page textarea {
        width: 100%; box-sizing: border-box; padding: 10px 13px;
        border: 1.5px solid #dde3ed; border-radius: 10px; font-size: 14px;
        color: #0f172a; background: #fff; outline: none;
        font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
        transition: border-color 0.18s, box-shadow 0.18s;
      }
      .ai-page input:focus, .ai-page select:focus, .ai-page textarea:focus {
        border-color: #0f766e; box-shadow: 0 0 0 3px rgba(15,118,110,0.12);
      }
      .ai-page select:disabled { opacity: 0.45; background: #f8fafc; cursor: not-allowed; }
      .ai-page textarea { resize: vertical; min-height: 88px; line-height: 1.6; }
      .ai-page button { transition: all 0.15s ease; }
      .ai-page button:hover:not(:disabled) { filter: brightness(1.06); transform: translateY(-1px); box-shadow: 0 6px 18px rgba(0,0,0,0.12); }
      .ai-page button:active:not(:disabled) { transform: translateY(0); }
      .ai-page button:disabled { opacity: 0.55; cursor: not-allowed; }
    `}</style>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8', whiteSpace: 'nowrap' }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #e2e8f0, transparent)' }} />
    </div>
  )
}

export default function AIPage() {
  const [health, setHealth] = useState(null)
  const [featureState, setFeatureState] = useState({ loading: true, error: null, data: [] })
  const [wilayas, setWilayas] = useState([])
  const [communes, setCommunes] = useState([])
  const [scoreLoading, setScoreLoading] = useState(false)
  const [scoreError, setScoreError] = useState(null)
  const [scoreResult, setScoreResult] = useState(null)
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchError, setBatchError] = useState(null)
  const [batchResults, setBatchResults] = useState([])
  const [batchDrafts, setBatchDrafts] = useState([])
  const [form, setForm] = useState(() => buildFormFromPreset(SCORE_PRESETS.risky))

  useEffect(() => {
    mlAPI.getHealth().then(setHealth).catch(() => {})
    geoAPI.getWilayas().then(setWilayas).catch(() => {})

    mlAPI.getFeatureImportance()
      .then((data) => setFeatureState({ loading: false, error: null, data: data.features ?? [] }))
      .catch((error) => {
        setFeatureState({
          loading: false,
          error: error.message || 'Impossible de charger l’importance des variables.',
          data: [],
        })
      })
  }, [])

  useEffect(() => {
    if (!form.wilaya_code) {
      setCommunes([])
      return
    }

    geoAPI.getCommunesByWilaya(form.wilaya_code).then(setCommunes).catch(() => setCommunes([]))
  }, [form.wilaya_code])

  useEffect(() => {
    if (!form.wilaya_code || !form.commune_name) return

    geoAPI.getZone(form.wilaya_code, form.commune_name)
      .then((data) => setForm((current) => ({ ...current, zone_sismique: data.zone })))
      .catch(() => {})
  }, [form.wilaya_code, form.commune_name])

  const featureChartData = useMemo(
    () =>
      featureState.data.slice(0, 8).map((item, index) => ({
        ...item,
        label: item.name.replaceAll('_', ' '),
        fill: FEATURE_COLORS[index % FEATURE_COLORS.length],
      })),
    [featureState.data]
  )

  const tierMeta = TIER_META[scoreResult?.tier] ?? TIER_META.MEDIUM

  const metricTiles = useMemo(() => {
    const metrics = health?.training_metrics ?? {}

    return [
      {
        label: 'Modèle',
        value: health?.model_loaded ? 'CatBoost chargé' : 'Indisponible',
        note: health?.model_path ? health.model_path.split('/').pop() : 'Aucun chemin reçu',
        icon: BrainCircuit,
        accent: health?.model_loaded ? '#0f766e' : '#b91c1c',
      },
      {
        label: 'Données train',
        value: formatInteger(metrics.training_rows ?? 0),
        note: 'Lignes utilisées pour entraîner le classifieur',
        icon: Layers3,
        accent: '#2563eb',
      },
      {
        label: 'Macro F1',
        value: metrics.macro_f1 ? metrics.macro_f1.toFixed(4) : '—',
        note: 'Qualité globale sur la validation',
        icon: ShieldCheck,
        accent: '#7c3aed',
      },
      {
        label: 'Best Iteration',
        value: metrics.best_iteration ?? '—',
        note: 'Point d’arrêt optimal du boosting',
        icon: Activity,
        accent: '#ea580c',
      },
    ]
  }, [health])

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function loadPreset(kind) {
    setForm(buildFormFromPreset(SCORE_PRESETS[kind]))
  }

  async function handleScore(event) {
    event.preventDefault()
    setScoreLoading(true)
    setScoreError(null)

    try {
      const result = await mlAPI.scorePolicy({
        zone_sismique: form.zone_sismique,
        wilaya_code: form.wilaya_code,
        commune_name: normalizeText(form.commune_name) || undefined,
        type_risque: form.type_risque,
        construction_type: form.construction_type,
        valeur_assuree: Number(form.valeur_assuree),
        prime_nette: Number(form.prime_nette),
        year: Number(form.year),
        query: normalizeText(form.query) || undefined,
        top_k: Number(form.top_k) || 4,
      })

      setScoreResult(result)
    } catch (error) {
      setScoreError(error.response?.data?.detail ?? error.message ?? 'Erreur de scoring')
    } finally {
      setScoreLoading(false)
    }
  }

  function addCurrentToBatch() {
    setBatchDrafts((current) => [
      ...current,
      {
        policy_id: `DRAFT_${current.length + 1}`,
        zone_sismique: form.zone_sismique,
        wilaya_code: form.wilaya_code,
        commune_name: normalizeText(form.commune_name) || undefined,
        type_risque: form.type_risque,
        construction_type: form.construction_type,
        valeur_assuree: Number(form.valeur_assuree),
        prime_nette: Number(form.prime_nette),
        year: Number(form.year),
      },
    ])
  }

  async function handleBatchScore() {
    if (!batchDrafts.length) return

    setBatchLoading(true)
    setBatchError(null)

    try {
      const response = await mlAPI.batchScore(batchDrafts)
      setBatchResults(
        (response.results ?? []).map((item, index) => ({
          ...item,
          draft_label: batchDrafts[index]?.policy_id ?? item.policy_id,
        }))
      )
    } catch (error) {
      setBatchError(error.response?.data?.detail ?? error.message ?? 'Erreur batch')
    } finally {
      setBatchLoading(false)
    }
  }

  return (
    <main style={S.page} className="page-fade ai-page">
      <PageStyles />
      <section style={S.hero}>
        <div>
          <div style={S.eyebrow}>CatBoost Risk Lab</div>
          <h1 style={S.heroTitle}>Scoring actuariel, batch scoring et lecture du modèle</h1>
          <p style={S.heroText}>
            Cette page permet d’évaluer une police, de lancer un scoring en lot et de lire les
            facteurs qui influencent le modèle. Chaque analyse peut aussi produire une synthèse
            métier et des recommandations contextuelles.
          </p>
        </div>

        <div style={S.heroPills}>
          <div style={S.heroPill}>
            <Radar size={14} />
            <span>{health?.model_loaded ? 'CatBoost en ligne' : 'Modèle non chargé'}</span>
          </div>
          <div style={S.heroPill}>
            <TimerReset size={14} />
            <span>Le scoring unitaire est plus détaillé, mais plus lent que le traitement en lot</span>
          </div>
        </div>
      </section>

      <section style={S.statsGrid}>
        {metricTiles.map((tile) => (
          <StatTile key={tile.label} {...tile} />
        ))}
      </section>

      <section style={S.mainGrid}>
        <div style={S.leftColumn}>
          <div style={S.panel}>
            <div style={S.panelHeader}>
              <div>
                <div style={S.panelEyebrow}>Scoring unitaire</div>
                <div style={S.panelTitle}>Évaluer une police</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button style={S.ghostBtn} onClick={() => loadPreset('risky')}>🔴 Risqué</button>
                <button style={S.ghostBtn} onClick={() => loadPreset('safer')}>🟢 Sain</button>
              </div>
            </div>

            <form onSubmit={handleScore}>
              <SectionLabel>Géolocalisation</SectionLabel>
              <div style={S.formGrid}>
                <div style={S.field}>
                  <label style={S.label}>Wilaya</label>
                  <select value={form.wilaya_code} onChange={(event) => {
                    setField('wilaya_code', event.target.value)
                    setField('commune_name', '')
                  }}>
                    <option value="">Sélectionner…</option>
                    {wilayas.map((wilaya) => (
                      <option key={wilaya.code} value={wilaya.code}>
                        {wilaya.code} · {wilaya.name_fr || wilaya.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={S.field}>
                  <label style={S.label}>Commune</label>
                  <select
                    value={form.commune_name}
                    onChange={(event) => setField('commune_name', event.target.value)}
                    disabled={!communes.length}
                  >
                    <option value="">Sélectionner…</option>
                    {communes.map((commune) => (
                      <option key={commune.code || commune.id || commune.commune_name} value={commune.commune_name}>
                        {commune.commune_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={S.field}>
                  <label style={S.label}>Type de risque</label>
                  <select value={form.type_risque} onChange={(event) => setField('type_risque', event.target.value)}>
                    {TYPE_RISQUE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div style={S.field}>
                  <label style={S.label}>Construction</label>
                  <select value={form.construction_type} onChange={(event) => setField('construction_type', event.target.value)}>
                    {CONSTRUCTION_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <SectionLabel>Valeurs financières</SectionLabel>
              <div style={S.formGrid}>

                <div style={S.field}>
                  <label style={S.label}>Valeur assurée</label>
                  <input
                    type="number"
                    min="0"
                    value={form.valeur_assuree}
                    onChange={(event) => setField('valeur_assuree', event.target.value)}
                  />
                </div>

                <div style={S.field}>
                  <label style={S.label}>Prime nette</label>
                  <input
                    type="number"
                    min="0"
                    value={form.prime_nette}
                    onChange={(event) => setField('prime_nette', event.target.value)}
                  />
                </div>

                <div style={S.field}>
                  <label style={S.label}>Année</label>
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={form.year}
                    onChange={(event) => setField('year', event.target.value)}
                  />
                </div>

                <div style={S.field}>
                  <label style={S.label}>Top K RAG</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={form.top_k}
                    onChange={(event) => setField('top_k', event.target.value)}
                  />
                </div>
              </div>

              <SectionLabel>Question analyste</SectionLabel>
              <div style={{ ...S.field, marginBottom: 16 }}>
                <label style={S.label}>Question analyste</label>
                <textarea
                  value={form.query}
                  onChange={(event) => setField('query', event.target.value)}
                  rows={3}
                  placeholder="Ex. Donne un verdict de souscription concis et trois actions prioritaires."
                />
              </div>

              {form.zone_sismique && (
                <div style={S.zoneRow}>
                  <ZoneBadge zone={form.zone_sismique} size="md" showLabel />
                  <span style={S.metaText}>Zone sismique détectée automatiquement</span>
                </div>
              )}

              {scoreError && <div style={S.errorBox}>{scoreError}</div>}

              <div style={S.actionRow}>
                <button type="submit" style={S.primaryBtn} disabled={scoreLoading}>
                  {scoreLoading ? <><LoadingSpinner size={14} color="#fff" /> Scoring…</> : '⚡ Scorer la police'}
                </button>
                <button type="button" style={S.secondaryBtn} onClick={addCurrentToBatch}>
                  + Ajouter au batch
                </button>
              </div>
            </form>
          </div>

          <div style={S.panel}>
            <div style={S.panelHeader}>
              <div>
                <div style={S.panelEyebrow}>Scoring en lot</div>
                <div style={S.panelTitle}>Traiter plusieurs polices</div>
              </div>
              <div style={{ ...S.batchPill, background: batchDrafts.length > 0 ? '#dbeafe' : '#f1f5f9', color: batchDrafts.length > 0 ? '#1d4ed8' : '#64748b' }}>
                {batchDrafts.length} police{batchDrafts.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div style={S.batchList}>
              {batchDrafts.length === 0 && (
                <div style={S.emptyBox}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
                  <div style={{ fontWeight: 700, color: '#334155', marginBottom: 4 }}>File batch vide</div>
                  <div>Ajoutez des polices depuis le formulaire de scoring.</div>
                </div>
              )}

              {batchDrafts.map((draft, index) => (
                <div key={`${draft.policy_id}-${index}`} style={S.batchCard}>
                  <div>
                    <div style={S.batchTitle}>{draft.policy_id}</div>
                    <div style={S.batchMeta}>
                      Wilaya {draft.wilaya_code} · {draft.commune_name || 'sans commune'} · {draft.type_risque}
                    </div>
                  </div>
                  <div style={S.batchSide}>
                    <ZoneBadge zone={draft.zone_sismique} />
                    <strong style={S.batchValue}>{formatCompactDzd(draft.valeur_assuree)}</strong>
                  </div>
                </div>
              ))}
            </div>

            <div style={S.actionRow}>
              <button
                type="button"
                style={S.primaryBtn}
                onClick={handleBatchScore}
                disabled={batchLoading || !batchDrafts.length}
              >
                {batchLoading ? <><LoadingSpinner size={14} color="#fff" /> Batch scoring…</> : 'Lancer le batch'}
              </button>
              <button type="button" style={S.secondaryBtn} onClick={() => {
                setBatchDrafts([SCORE_PRESETS.risky, SCORE_PRESETS.safer])
                setBatchResults([])
              }}>
                Charger 2 exemples
              </button>
              <button type="button" style={S.secondaryBtn} onClick={() => {
                setBatchDrafts([])
                setBatchResults([])
              }}>
                Vider
              </button>
            </div>

            {batchError && <div style={S.errorBox}>{batchError}</div>}

            {batchResults.length > 0 && (
              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Label</th>
                      <th style={S.th}>Score</th>
                      <th style={S.th}>Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchResults.map((item) => (
                      <tr key={`${item.draft_label}-${item.policy_id}`} style={S.row}>
                        <td style={S.td}>{item.draft_label}</td>
                        <td style={S.tdMono}>{item.score.toFixed(1)}</td>
                        <td style={S.td}>
                          <span style={{
                            ...S.tierPill,
                            background: TIER_META[item.tier]?.bg || '#e2e8f0',
                            color: TIER_META[item.tier]?.color || '#334155',
                          }}>
                            {item.tier}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div style={S.rightColumn}>
          <div style={S.resultHero}>
            {!scoreResult && !scoreLoading && (
              <div style={S.emptyState}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(15,118,110,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                  <Sparkles size={28} color="#0f766e" />
                </div>
                <div style={S.emptyTitle}>Prêt pour un scoring live</div>
                <div style={S.emptyText}>
                  Lancez un scoring unitaire pour afficher le score CatBoost, les probabilités,
                  le résumé généré et les recommandations depuis la couche RAG.
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
                  {['Score 0–100', 'Tier LOW/MEDIUM/HIGH', 'RAG enrichi'].map(t => (
                    <span key={t} style={{ borderRadius: 999, padding: '5px 12px', background: 'rgba(15,118,110,0.1)', color: '#0f766e', fontSize: 12, fontWeight: 700 }}>{t}</span>
                  ))}
                </div>
              </div>
            )}

            {scoreLoading && (
              <div style={S.emptyState}>
                <div style={{ marginBottom: 8 }}><LoadingSpinner size={40} /></div>
                <div style={S.emptyTitle}>Scoring en cours…</div>
                <div style={S.emptyText}>
                  Le moteur calcule le score CatBoost, puis enrichit le resultat avec
                  le contexte documentaire et les recommandations RAG.
                </div>
              </div>
            )}

            {scoreResult && (
              <>
                <div style={S.scoreHeroHeader}>
                  <div>
                    <div style={S.panelEyebrow}>Score de risque CatBoost</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
                      <span style={{ ...S.scoreValue, color: tierMeta.color }}>{scoreResult.score.toFixed(1)}</span>
                      <span style={{ fontSize: 20, color: '#94a3b8', fontWeight: 600 }}>/100</span>
                    </div>
                    <div style={{ ...S.scoreTierChip, background: tierMeta.bg, color: tierMeta.color, display: 'inline-block' }}>
                      {tierMeta.label}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                    <div style={S.scoreMetaCard}>
                      <div style={S.scoreMetaLabel}>Confidence</div>
                      <div style={S.scoreMetaValue}>{scoreResult.confidence == null ? '—' : `${(scoreResult.confidence * 100).toFixed(0)}%`}</div>
                    </div>
                    <div style={S.scoreMetaCard}>
                      <div style={S.scoreMetaLabel}>Elapsed</div>
                      <div style={S.scoreMetaValue}>{scoreResult.elapsed_ms == null ? '—' : `${scoreResult.elapsed_ms.toFixed(0)} ms`}</div>
                    </div>
                  </div>
                </div>

                {scoreResult.dominant_factor && (
                  <div style={{ padding: '8px 12px', background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 10, fontSize: 13, color: '#78350f', fontWeight: 600, marginBottom: 16 }}>
                    🎯 Facteur dominant: {scoreResult.dominant_factor}
                  </div>
                )}

                <div style={S.scoreBars}>
                  <div style={S.scoreBarsTitle}>Probabilités par classe</div>
                  <ScoreBar label="LOW — Risque faible" value={scoreResult.proba.LOW} color="#047857" />
                  <ScoreBar label="MEDIUM — Risque modéré" value={scoreResult.proba.MEDIUM} color="#d97706" />
                  <ScoreBar label="HIGH — Risque élevé" value={scoreResult.proba.HIGH} color="#b91c1c" />
                </div>

                <div style={S.summaryBox}>
                  <div style={S.summaryTitle}>Executive summary</div>
                  <p style={S.summaryText}>{scoreResult.executive_summary || 'Aucune synthèse renvoyée.'}</p>
                </div>

                <div style={S.cardGrid}>
                  <div style={S.subPanel}>
                    <div style={S.subPanelTitle}>Entrées normalisées</div>
                    <div style={S.kvList}>
                      {Object.entries(scoreResult.normalized_inputs ?? {}).map(([key, value]) => (
                        <div key={key} style={S.kvRow}>
                          <span>{key}</span>
                          <strong>{String(value)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={S.subPanel}>
                    <div style={S.subPanelTitle}>Sources</div>
                    <div style={S.sourceWrap}>
                      {(scoreResult.context_sources ?? []).map((source) => (
                        <span key={source} style={S.sourceChip}>{source}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={S.subPanel}>
                  <RecommendationCallout
                    payload={scoreResult}
                    eyebrow="Recommandation underwriting"
                    title="Synthèse d'aide à la décision"
                    badgeLabel="Réponse score"
                    emptyMessage="Aucune recommandation exploitable n a ete produite pour cette analyse."
                    accent="#0f766e"
                    surface="linear-gradient(180deg, #ecfeff 0%, #ffffff 100%)"
                    borderColor="#99f6e4"
                    quoteSurface="rgba(255,255,255,0.86)"
                  />
                </div>
              </>
            )}
          </div>

          <div style={S.panel}>
            <div style={S.panelHeader}>
              <div>
                <div style={S.panelEyebrow}>Lecture du modèle</div>
                <div style={S.panelTitle}>Variables les plus influentes</div>
              </div>
            </div>

            {featureState.loading ? (
              <div style={S.loadingBox}>
                <LoadingSpinner size={24} />
              </div>
            ) : featureState.error ? (
              <div style={S.errorBox}>{featureState.error}</div>
            ) : (
              <>
                <div style={S.featureNote}>
                  Les variables les plus influentes sont principalement la valeur assurée,
                  l’adéquation tarifaire et le niveau de zone sismique.
                </div>

                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer>
                    <BarChart data={featureChartData} layout="vertical" margin={{ top: 8, right: 12, left: 28, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis
                        type="category"
                        dataKey="label"
                        tick={{ fontSize: 11, fill: '#334155' }}
                        axisLine={false}
                        tickLine={false}
                        width={100}
                      />
                      <Tooltip content={<ImportanceTooltip />} />
                      <Bar dataKey="importance" radius={[0, 8, 8, 0]}>
                        {featureChartData.map((item) => (
                          <Cell key={item.name} fill={item.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={S.featureList}>
                  {featureState.data.slice(0, 12).map((feature, index) => (
                    <div key={feature.name} style={S.featureRow}>
                      <div style={S.featureRank}>{index + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={S.featureName}>{feature.name}</div>
                        <div style={S.featureValue}>{feature.importance.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

const S = {
  page: {
    flex: 1, overflowY: 'auto', padding: '28px 32px 48px',
    background: 'radial-gradient(circle at top left, rgba(20,184,166,0.07), transparent 30%), linear-gradient(180deg, #f7fbfc 0%, #f8fafc 40%, #eef4f8 100%)',
  },
  hero: {
    background: 'linear-gradient(135deg, #0f172a 0%, #123b4a 42%, #0f766e 100%)',
    borderRadius: 24, padding: '32px 36px', color: '#f8fafc',
    display: 'flex', justifyContent: 'space-between', gap: 32,
    alignItems: 'flex-start', boxShadow: '0 24px 60px rgba(15,23,42,0.18)',
    marginBottom: 24, flexWrap: 'wrap',
  },
  eyebrow: {
    fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.6)', marginBottom: 10, fontWeight: 700,
  },
  heroTitle: {
    margin: 0, fontSize: 30, lineHeight: 1.2, maxWidth: 620,
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
  },
  heroText: {
    margin: '12px 0 0', maxWidth: 620,
    color: 'rgba(255,255,255,0.72)', fontSize: 14, lineHeight: 1.8,
  },
  heroPills: {
    display: 'flex', flexDirection: 'column', gap: 10, minWidth: 240,
  },
  heroPill: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px',
    background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 999, fontSize: 12, color: '#e2e8f0',
  },
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16, marginBottom: 24,
  },
  statTile: {
    background: '#fff', borderRadius: 20, border: '1px solid rgba(148,163,184,0.14)',
    padding: '20px 20px 18px', boxShadow: '0 4px 20px rgba(148,163,184,0.1)',
  },
  statIcon: {
    width: 40, height: 40, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  statLabel: {
    fontSize: 11, color: '#94a3b8', marginBottom: 6, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  statValue: { fontSize: 22, fontWeight: 800, marginBottom: 6, lineHeight: 1.1 },
  statNote: { fontSize: 12, color: '#64748b', lineHeight: 1.5 },
  mainGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
    gap: 24, alignItems: 'start',
  },
  leftColumn: { display: 'flex', flexDirection: 'column', gap: 24 },
  rightColumn: { display: 'flex', flexDirection: 'column', gap: 24 },
  panel: {
    background: '#fff', borderRadius: 22, border: '1px solid rgba(148,163,184,0.14)',
    padding: '24px', boxShadow: '0 4px 24px rgba(148,163,184,0.1)',
  },
  resultHero: {
    background: '#fff', borderRadius: 22, border: '1px solid rgba(148,163,184,0.14)',
    padding: '24px', boxShadow: '0 4px 24px rgba(148,163,184,0.1)',
  },
  panelHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    gap: 12, marginBottom: 20, flexWrap: 'wrap',
  },
  panelEyebrow: {
    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em',
    color: '#94a3b8', marginBottom: 5, fontWeight: 700,
  },
  panelTitle: {
    fontSize: 16, fontWeight: 800, color: '#0f172a',
    fontFamily: "'JetBrains Mono', monospace",
  },
  formGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16, marginBottom: 20,
  },
  field: { display: 'flex', flexDirection: 'column', gap: 7 },
  label: { fontSize: 12, color: '#475569', fontWeight: 700, letterSpacing: '0.02em' },
  zoneRow: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
    background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, marginBottom: 16,
  },
  inlineMeta: {
    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
    padding: '10px 14px', background: '#f0fdf4',
    border: '1px solid #bbf7d0', borderRadius: 12, marginBottom: 16,
  },
  metaText: { fontSize: 12, color: '#166534' },
  actionRow: { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 },
  primaryBtn: {
    border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #0f766e, #0e7490)',
    color: '#fff', padding: '12px 20px', fontWeight: 800, fontSize: 14,
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
  },
  secondaryBtn: {
    borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff',
    color: '#334155', padding: '11px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
  },
  ghostBtn: {
    borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc',
    color: '#475569', padding: '8px 12px', fontWeight: 600, fontSize: 12, cursor: 'pointer',
  },
  errorBox: {
    borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca',
    color: '#b91c1c', padding: '12px 14px', fontSize: 13, lineHeight: 1.5, marginBottom: 14,
  },
  emptyBox: {
    borderRadius: 14, border: '1px dashed #cbd5e1', background: '#f8fafc',
    padding: '24px', color: '#64748b', fontSize: 13, textAlign: 'center',
  },
  batchPill: {
    borderRadius: 999, padding: '7px 12px', background: '#dbeafe',
    color: '#1d4ed8', fontSize: 12, fontWeight: 700,
  },
  batchList: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 },
  batchCard: {
    borderRadius: 14, padding: '13px 16px', border: '1px solid #dbeafe',
    background: 'linear-gradient(180deg, #fff, #f8fbff)',
    display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center',
  },
  batchTitle: { fontSize: 14, fontWeight: 800, color: '#0f172a' },
  batchMeta: { fontSize: 12, color: '#64748b', marginTop: 4 },
  batchSide: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 },
  batchValue: { color: '#0f172a', fontSize: 13, fontWeight: 700 },
  tableWrap: {
    overflowX: 'auto', borderRadius: 12, border: '1px solid #e2e8f0', marginTop: 16,
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left', fontSize: 11, color: '#94a3b8', padding: '10px 14px',
    background: '#f8fafc', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.07em', borderBottom: '1px solid #e2e8f0',
  },
  row: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 14px', fontSize: 13, color: '#334155' },
  tdMono: {
    padding: '12px 14px', fontSize: 14, color: '#0f172a',
    fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
  },
  tierPill: { display: 'inline-flex', borderRadius: 999, padding: '5px 10px', fontWeight: 700, fontSize: 11 },
  emptyState: {
    borderRadius: 18, border: '1px dashed #7dd3fc',
    background: 'linear-gradient(160deg, #f0f9ff, #e0f2fe)',
    padding: '36px 28px', display: 'flex', flexDirection: 'column',
    gap: 12, alignItems: 'center', textAlign: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: 800, color: '#0f172a' },
  emptyText: { color: '#475569', fontSize: 14, lineHeight: 1.7, maxWidth: 340 },
  scoreHeroHeader: {
    display: 'flex', justifyContent: 'space-between', gap: 16,
    alignItems: 'flex-start', marginBottom: 20,
    padding: '20px 22px', background: '#f8fafc',
    borderRadius: 16, border: '1px solid #e2e8f0',
  },
  scoreValue: {
    fontSize: 52, fontWeight: 900, color: '#0f172a', lineHeight: 1,
    fontFamily: "'Space Grotesk', sans-serif",
  },
  scoreTierChip: { borderRadius: 999, padding: '10px 16px', fontWeight: 800, fontSize: 13 },
  scoreMetaRow: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: 12, marginBottom: 20,
  },
  scoreMetaCard: {
    borderRadius: 12, background: '#fff', border: '1px solid #e2e8f0', padding: '12px 14px',
  },
  scoreMetaLabel: {
    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em',
    color: '#94a3b8', marginBottom: 6, fontWeight: 700,
  },
  scoreMetaValue: { fontSize: 15, fontWeight: 700, color: '#0f172a' },
  scoreBars: {
    marginBottom: 20, padding: '16px 18px',
    background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0',
  },
  scoreBarsTitle: {
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
    color: '#94a3b8', marginBottom: 14,
  },
  scoreBarLabelRow: {
    display: 'flex', justifyContent: 'space-between', marginBottom: 6,
    fontSize: 12, color: '#475569', fontWeight: 600,
  },
  scoreBarTrack: { height: 8, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 999, transition: 'width 0.6s ease' },
  summaryBox: {
    borderRadius: 14, background: '#fff', border: '1px solid #dbeafe',
    padding: '16px 18px', marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em',
    color: '#64748b', marginBottom: 10, fontWeight: 700,
  },
  summaryText: { margin: 0, color: '#334155', fontSize: 14, lineHeight: 1.8 },
  cardGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 14, marginBottom: 16,
  },
  subPanel: {
    borderRadius: 14, background: '#fff', border: '1px solid #e2e8f0',
    padding: '16px 18px', marginBottom: 14,
  },
  subPanelTitle: { fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 12 },
  kvList: { display: 'flex', flexDirection: 'column', gap: 6 },
  kvRow: {
    display: 'flex', justifyContent: 'space-between', gap: 12,
    fontSize: 12, color: '#64748b', padding: '6px 0', borderBottom: '1px solid #f1f5f9',
  },
  sourceWrap: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  sourceChip: {
    borderRadius: 999, padding: '6px 12px', background: '#ecfeff',
    color: '#155e75', fontSize: 12, fontWeight: 700, border: '1px solid #a5f3fc',
  },
  recCard: {
    borderRadius: 14, padding: '16px 18px',
    background: '#fff', border: '1px solid #e2e8f0', marginBottom: 10,
  },
  recHeader: { display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  recPriority: {
    borderRadius: 999, padding: '4px 10px', background: '#fee2e2',
    color: '#b91c1c', fontSize: 11, fontWeight: 800,
  },
  recCategory: {
    borderRadius: 999, padding: '4px 10px', background: '#dbeafe',
    color: '#1d4ed8', fontSize: 11, fontWeight: 700,
  },
  recTitle: { fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 6 },
  recText: { fontSize: 13, color: '#475569', lineHeight: 1.7, marginBottom: 8 },
  recAction: {
    fontSize: 13, color: '#0f766e', fontWeight: 700, lineHeight: 1.6,
    padding: '8px 12px', background: '#f0fdfa', borderRadius: 8,
  },
  featureNote: {
    fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 16,
    padding: '12px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0',
  },
  featureList: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 8, marginTop: 16,
  },
  featureRow: {
    borderRadius: 12, border: '1px solid #e2e8f0', padding: '10px 12px',
    display: 'flex', gap: 10, alignItems: 'center', background: '#fff',
  },
  featureRank: {
    width: 26, height: 26, borderRadius: '50%', background: '#dbeafe',
    color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: 11, flexShrink: 0,
  },
  featureName: { fontSize: 12, fontWeight: 700, color: '#0f172a' },
  featureValue: { fontSize: 11, color: '#64748b', marginTop: 3 },
  loadingBox: { minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  tooltip: {
    background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0',
    padding: '10px 12px', boxShadow: '0 12px 24px rgba(15,23,42,0.1)',
  },
}
