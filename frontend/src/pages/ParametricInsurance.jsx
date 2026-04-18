import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ImagePlus,
  Orbit,
  ShieldAlert,
  Sparkles,
  Waves,
} from 'lucide-react'
import ImageUploader from '../components/parametric/ImageUploader'
import DamageResultCard from '../components/parametric/DamageResultCard'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import RecommendationCallout from '../components/shared/RecommendationCallout'
import ZoneBadge from '../components/shared/ZoneBadge'
import { damageAPI } from '../api/damage'
import { geoAPI } from '../api/geo'
import { CONSTRUCTION_TYPE_OPTIONS } from '../types/policy'
import { formatCompactDzd } from '../utils/format'

const IMAGE_TYPES = ['satellite', 'drone']

function StatusCard({ icon: Icon, label, value, tone = 'neutral' }) {
  const palette = {
    neutral: { bg: '#eff6ff', color: '#1d4ed8' },
    success: { bg: '#ecfdf5', color: '#047857' },
    warning: { bg: '#fff7ed', color: '#c2410c' },
    danger: { bg: '#fef2f2', color: '#b91c1c' },
  }[tone]

  return (
    <div style={S.statusCard}>
      <div style={{ ...S.statusIcon, background: palette.bg, color: palette.color }}>
        <Icon size={16} />
      </div>
      <div style={S.statusLabel}>{label}</div>
      <div style={{ ...S.statusValue, color: palette.color }}>{value}</div>
    </div>
  )
}

function PageStyles() {
  return (
    <style>{`
      .parametric-page input, .parametric-page select, .parametric-page textarea {
        width: 100%; box-sizing: border-box; padding: 10px 13px;
        border: 1.5px solid #dde3ed; border-radius: 10px; font-size: 14px;
        color: #0f172a; background: #fff; outline: none;
        font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
        transition: border-color 0.18s, box-shadow 0.18s;
      }
      .parametric-page input:focus, .parametric-page select:focus, .parametric-page textarea:focus {
        border-color: #0f766e; box-shadow: 0 0 0 3px rgba(15,118,110,0.12);
      }
      .parametric-page select:disabled { opacity: 0.45; background: #f8fafc; cursor: not-allowed; }
      .parametric-page textarea { resize: vertical; min-height: 88px; line-height: 1.6; }
      .parametric-page button { transition: all 0.15s ease; }
      .parametric-page button:hover:not(:disabled) { filter: brightness(1.06); transform: translateY(-1px); box-shadow: 0 6px 18px rgba(0,0,0,0.12); }
      .parametric-page button:active:not(:disabled) { transform: translateY(0); }
      .parametric-page button:disabled { opacity: 0.55; cursor: not-allowed; }
    `}</style>
  )
}

export default function ParametricInsurance() {
  const [health, setHealth] = useState(null)
  const [wilayas, setWilayas] = useState([])
  const [communes, setCommunes] = useState([])
  const [zoneInfo, setZoneInfo] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [form, setForm] = useState({
    image_type: 'satellite',
    wilaya_code: '16',
    commune_name: 'ALGER CENTRE',
    area_km2: '12',
    construction_type: 'Béton armé',
    query: 'Summarize the expected operational impact and 3 insurer actions.',
    top_k: '4',
  })

  useEffect(() => {
    damageAPI.getHealth().then(setHealth).catch(() => {})
    geoAPI.getWilayas().then(setWilayas).catch(() => {})
  }, [])

  useEffect(() => {
    if (!form.wilaya_code) {
      setCommunes([])
      return
    }

    geoAPI.getCommunesByWilaya(form.wilaya_code).then((rows) => {
      setCommunes(rows)

      if (!rows.some((row) => row.commune_name === form.commune_name)) {
        const fallback = rows[0]?.commune_name ?? ''
        setForm((current) => ({ ...current, commune_name: fallback }))
      }
    }).catch(() => setCommunes([]))
  }, [form.wilaya_code])

  useEffect(() => {
    if (!form.wilaya_code || !form.commune_name) {
      setZoneInfo(null)
      return
    }

    geoAPI.getZone(form.wilaya_code, form.commune_name)
      .then(setZoneInfo)
      .catch(() => setZoneInfo(null))
  }, [form.wilaya_code, form.commune_name])

  const assessment = result?.damage_assessment ?? null

  const healthCards = useMemo(() => ([
    {
      label: 'Damage API',
      value: health?.status || '—',
      icon: Orbit,
      tone: health?.status === 'ok' ? 'success' : 'danger',
    },
    {
      label: 'CNN chargé',
      value: health?.model_loaded ? 'Oui' : 'Non',
      icon: ImagePlus,
      tone: health?.model_loaded ? 'success' : 'warning',
    },
    {
      label: 'Mode courant',
      value: health?.cnn_enabled ? 'Vision réelle' : 'Estimation simulée',
      icon: Sparkles,
      tone: health?.cnn_enabled ? 'success' : 'warning',
    },
    {
      label: 'Device',
      value: health?.device || '—',
      icon: Waves,
      tone: 'neutral',
    },
  ]), [health])

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleEstimate(event) {
    event.preventDefault()

    if (!imageFile) {
      setError('Chargez une image pour lancer l estimation parametrique.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await damageAPI.estimate(imageFile, {
        image_type: form.image_type,
        area_km2: Number(form.area_km2),
        construction_type: form.construction_type,
        zone_sismique: zoneInfo?.zone || undefined,
        wilaya_code: form.wilaya_code || undefined,
        commune_name: form.commune_name || undefined,
        query: form.query.trim() || undefined,
        top_k: Number(form.top_k) || 4,
      })

      setResult(response)
    } catch (requestError) {
      setError(requestError.response?.data?.detail ?? requestError.message ?? 'Erreur damage estimate')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={S.page} className="page-fade parametric-page">
      <PageStyles />
      <section style={S.hero}>
        <div>
          <div style={S.heroEyebrow}>Parametric Damage Studio</div>
          <h1 style={S.heroTitle}>Front paramétrique pour l’estimation de dommages post-séisme</h1>
          <p style={S.heroText}>
            Cette page estime les dommages après séisme à partir de l’image, de la zone analysée
            et du type de construction. Le résultat combine un diagnostic de dommage, une synthèse
            d’aide à la décision et des recommandations opérationnelles.
          </p>
        </div>

        <div style={S.heroSide}>
          <div style={S.heroChip}>
            <ShieldAlert size={14} />
            <span>Image, zone, type de construction et contexte documentaire</span>
          </div>
          <div style={S.heroChip}>
            <AlertTriangle size={14} />
            <span>
              {health?.cnn_enabled ? 'Analyse visuelle active' : 'Analyse visuelle indisponible : resultat simule'}
            </span>
          </div>
        </div>
      </section>

      <section style={S.statusGrid}>
        {healthCards.map((card) => (
          <StatusCard key={card.label} {...card} />
        ))}
      </section>

      {!health?.cnn_enabled && (
        <div style={S.warningBanner}>
          Le moteur d’analyse visuelle n’est pas encore chargé. L’écran reste utilisable, mais les
          résultats affichés seront simulés afin de permettre le test complet du parcours.
        </div>
      )}

      <section style={S.mainGrid}>
        <div style={S.leftCol}>
          <div style={S.panel}>
            <div style={S.panelHeader}>
              <div>
                <div style={S.panelEyebrow}>Analyse</div>
                <div style={S.panelTitle}>Lancer une estimation de dommages</div>
              </div>
            </div>

            <form onSubmit={handleEstimate}>
              <div style={{ marginBottom: 16 }}>
                <label style={S.label}>Image post-événement</label>
                <ImageUploader onFile={setImageFile} label="Image satellite ou drone à analyser" />
              </div>

              <div style={S.formGrid}>
                <div style={S.field}>
                  <label style={S.label}>Type d’image</label>
                  <div style={S.segmentedWrap}>
                    {IMAGE_TYPES.map((type) => (
                      <button
                        type="button"
                        key={type}
                        onClick={() => setField('image_type', type)}
                        style={{
                          ...S.segmentedBtn,
                          background: form.image_type === type ? '#0f766e' : '#fff',
                          color: form.image_type === type ? '#fff' : '#334155',
                          borderColor: form.image_type === type ? '#0f766e' : '#dbe4f0',
                        }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={S.field}>
                  <label style={S.label}>Surface affectée (km²)</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={form.area_km2}
                    onChange={(event) => setField('area_km2', event.target.value)}
                  />
                </div>

                <div style={S.field}>
                  <label style={S.label}>Wilaya</label>
                  <select
                    value={form.wilaya_code}
                    onChange={(event) => setField('wilaya_code', event.target.value)}
                  >
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
                  <label style={S.label}>Construction</label>
                  <select
                    value={form.construction_type}
                    onChange={(event) => setField('construction_type', event.target.value)}
                  >
                    {CONSTRUCTION_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
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

              <div style={S.field}>
                <label style={S.label}>Question analyste</label>
                <textarea
                  rows={3}
                  value={form.query}
                  onChange={(event) => setField('query', event.target.value)}
                  placeholder="Ex. Summarize operational impact and 3 insurer actions."
                />
              </div>

              <div style={S.locationCard}>
                <div>
                  <div style={S.locationLabel}>Zone détectée</div>
                  {zoneInfo ? <ZoneBadge zone={zoneInfo.zone} size="md" showLabel /> : <span style={S.locationHint}>Sélectionnez une commune</span>}
                </div>
                <div style={S.locationMeta}>
                  <div>{zoneInfo?.description || 'Aucune description.'}</div>
                  <div>
                    {zoneInfo?.lat && zoneInfo?.lon
                      ? `${zoneInfo.lat}, ${zoneInfo.lon}`
                      : 'Coordonnées non disponibles'}
                  </div>
                </div>
              </div>

              {error && <div style={S.errorBox}>{error}</div>}

              <button type="submit" style={S.primaryBtn} disabled={loading}>
                {loading ? <><LoadingSpinner size={14} color="#fff" /> Estimation en cours…</> : 'Estimer les dommages'}
              </button>
            </form>
          </div>

          <div style={S.panel}>
            <div style={S.panelEyebrow}>Comment tester</div>
            <div style={S.testGrid}>
              <div style={S.testCard}>
                <div style={S.testStep}>1</div>
                <div>
                  <div style={S.testTitle}>Page</div>
                  <div style={S.testText}>Ouvrez la page `Paramétrique` dans la sidebar.</div>
                </div>
              </div>
              <div style={S.testCard}>
                <div style={S.testStep}>2</div>
                <div>
                  <div style={S.testTitle}>Image</div>
                  <div style={S.testText}>Chargez n’importe quelle image `.png` ou `.jpg`.</div>
                </div>
              </div>
              <div style={S.testCard}>
                <div style={S.testStep}>3</div>
                <div>
                  <div style={S.testTitle}>Zone</div>
                  <div style={S.testText}>Choisissez `16 / ALGER CENTRE` pour retrouver le scénario validé.</div>
                </div>
              </div>
              <div style={S.testCard}>
                <div style={S.testStep}>4</div>
                <div>
                  <div style={S.testTitle}>Résultat attendu</div>
                  <div style={S.testText}>
                    Tant que le CNN est indisponible, la réponse doit afficher `ESTIMATION SIMULÉE`
                    et quand même retourner la synthèse, les recommandations et la heatmap.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={S.rightCol}>
          {!assessment && !loading && (
            <div style={S.emptyState}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(15,118,110,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                <Sparkles size={28} color="#0f766e" />
              </div>
              <div style={S.emptyTitle}>Résultat paramétrique en attente</div>
              <div style={S.emptyText}>
                Lancez une estimation pour afficher la carte de dommages, la perte totale, le
                résumé exécutif et les recommandations dérivées du contexte portefeuille.
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
                {['Damage Label', 'Perte en DZD', 'Recommandations RAG'].map(t => (
                  <span key={t} style={{ borderRadius: 999, padding: '5px 12px', background: 'rgba(15,118,110,0.1)', color: '#0f766e', fontSize: 12, fontWeight: 700 }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {assessment && (
            <>
              <div style={S.panelDark}>
                <div style={S.panelHeader}>
                  <div>
                    <div style={S.panelEyebrowDark}>Damage Assessment</div>
                    <div style={S.panelTitleDark}>{assessment.damage_label}</div>
                  </div>
                  <div style={S.metricPill}>
                    {assessment.is_mock ? 'Mode simulé' : 'Vision réelle'}
                  </div>
                </div>

                <DamageResultCard result={assessment} />
              </div>

              <div style={S.panel}>
                <div style={S.summaryStrip}>
                  <div>
                    <div style={S.summaryLabel}>Perte totale estimée</div>
                    <div style={S.summaryValue}>{formatCompactDzd(assessment.total_loss_dzd)}</div>
                  </div>
                  <div>
                    <div style={S.summaryLabel}>Confiance globale</div>
                    <div style={S.summaryValue}>
                      {result?.confidence == null ? '—' : `${(result.confidence * 100).toFixed(0)}%`}
                    </div>
                  </div>
                  <div>
                    <div style={S.summaryLabel}>Generation mode</div>
                    <div style={S.summaryValue}>{result?.generation_mode || '—'}</div>
                  </div>
                </div>

                <div style={S.subPanel}>
                  <div style={S.subTitle}>Executive summary</div>
                  <p style={S.summaryText}>{result?.executive_summary || 'Aucune synthèse fournie.'}</p>
                </div>

                <div style={S.subPanel}>
                  <div style={S.subTitle}>Sources de contexte</div>
                  <div style={S.sourceWrap}>
                    {(result?.context_sources ?? []).map((source) => (
                      <span key={source} style={S.sourceChip}>{source}</span>
                    ))}
                  </div>
                </div>

                <div style={S.subPanel}>
                  <RecommendationCallout
                    payload={result}
                    eyebrow="Recommandation paramétrique"
                    title="Synthèse d'aide à la décision"
                    badgeLabel="Réponse damage"
                    emptyMessage="Aucune recommandation exploitable n a ete renvoyee pour cette estimation."
                    accent="#0f766e"
                    surface="linear-gradient(180deg, #ecfeff 0%, #ffffff 100%)"
                    borderColor="#99f6e4"
                    quoteSurface="rgba(255,255,255,0.86)"
                  />
                </div>

                {(result?.retrieved_documents ?? []).length > 0 && (
                  <div style={S.subPanel}>
                    <div style={S.subTitle}>Documents récupérés</div>
                    {(result.retrieved_documents ?? []).map((doc, index) => (
                      <div key={`${doc.title}-${index}`} style={S.docCard}>
                        <div style={S.docTitle}>{doc.title}</div>
                        <div style={S.docMeta}>{doc.source} · score {doc.score?.toFixed?.(2) ?? doc.score}</div>
                        <div style={S.docText}>{doc.excerpt}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  )
}

const S = {
  page: {
    flex: 1, overflowY: 'auto', padding: '28px 32px 48px',
    background: 'radial-gradient(circle at top right, rgba(249,115,22,0.07), transparent 26%), radial-gradient(circle at top left, rgba(20,184,166,0.07), transparent 22%), linear-gradient(180deg, #fcfcfd 0%, #f8fafc 52%, #eef4f7 100%)',
  },
  hero: {
    background: 'linear-gradient(135deg, #111827 0%, #1d3557 38%, #0f766e 100%)',
    borderRadius: 24, padding: '32px 36px', color: '#f8fafc',
    display: 'flex', justifyContent: 'space-between', gap: 32,
    alignItems: 'flex-start', boxShadow: '0 24px 60px rgba(15,23,42,0.18)',
    marginBottom: 24, flexWrap: 'wrap',
  },
  heroEyebrow: {
    fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.6)', marginBottom: 10, fontWeight: 700,
  },
  heroTitle: {
    margin: 0, fontSize: 30, lineHeight: 1.2, maxWidth: 660,
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
  },
  heroText: {
    margin: '12px 0 0', maxWidth: 660,
    color: 'rgba(255,255,255,0.72)', fontSize: 14, lineHeight: 1.8,
  },
  heroSide: { display: 'flex', flexDirection: 'column', gap: 10, minWidth: 260 },
  heroChip: {
    borderRadius: 16, padding: '10px 14px',
    background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.14)',
    display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#e2e8f0',
  },
  statusGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: 16, marginBottom: 20,
  },
  statusCard: {
    background: '#fff', borderRadius: 20, border: '1px solid rgba(148,163,184,0.14)',
    padding: '20px 20px 18px', boxShadow: '0 4px 20px rgba(148,163,184,0.1)',
  },
  statusIcon: {
    width: 40, height: 40, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  statusLabel: {
    fontSize: 11, color: '#94a3b8', marginBottom: 6,
    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  statusValue: { fontSize: 18, fontWeight: 800 },
  warningBanner: {
    borderRadius: 16, padding: '14px 18px',
    background: 'linear-gradient(90deg, #fff7ed 0%, #fffbeb 100%)',
    border: '1px solid #fdba74', color: '#9a3412',
    fontSize: 13, lineHeight: 1.7, marginBottom: 20,
  },
  mainGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
    gap: 24, alignItems: 'start',
  },
  leftCol: { display: 'flex', flexDirection: 'column', gap: 24 },
  rightCol: { display: 'flex', flexDirection: 'column', gap: 24 },
  panel: {
    background: '#fff', borderRadius: 22, border: '1px solid rgba(148,163,184,0.14)',
    padding: '24px', boxShadow: '0 4px 24px rgba(148,163,184,0.1)',
  },
  panelDark: {
    background: 'linear-gradient(180deg, #0f172a 0%, #101f35 100%)',
    borderRadius: 22, border: '1px solid rgba(51,65,85,0.9)',
    padding: '24px', boxShadow: '0 18px 34px rgba(15,23,42,0.28)', color: '#f8fafc',
  },
  panelHeader: {
    display: 'flex', justifyContent: 'space-between', gap: 12,
    alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap',
  },
  panelEyebrow: {
    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em',
    color: '#94a3b8', marginBottom: 5, fontWeight: 700,
  },
  panelTitle: { fontSize: 16, fontWeight: 800, color: '#0f172a', fontFamily: "'JetBrains Mono', monospace" },
  panelEyebrowDark: {
    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em',
    color: 'rgba(226,232,240,0.6)', marginBottom: 5, fontWeight: 700,
  },
  panelTitleDark: { fontSize: 18, fontWeight: 800, color: '#fff' },
  metricPill: {
    borderRadius: 999, padding: '8px 12px',
    background: 'rgba(20,184,166,0.14)', color: '#99f6e4', fontSize: 12, fontWeight: 700,
  },
  formGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16, marginBottom: 20,
  },
  field: { display: 'flex', flexDirection: 'column', gap: 7 },
  label: { fontSize: 12, color: '#475569', fontWeight: 700, letterSpacing: '0.02em' },
  segmentedWrap: { display: 'flex', gap: 8 },
  segmentedBtn: {
    flex: 1, borderRadius: 12, border: '1.5px solid', padding: '10px 12px',
    fontWeight: 700, textTransform: 'capitalize', cursor: 'pointer', fontSize: 14,
  },
  locationCard: {
    borderRadius: 14, border: '1px solid #dbeafe', background: '#f8fbff',
    padding: '14px 16px', display: 'flex', justifyContent: 'space-between',
    gap: 12, marginTop: 4, marginBottom: 16, alignItems: 'center',
  },
  locationLabel: {
    fontSize: 11, color: '#94a3b8', marginBottom: 8, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  locationHint: { color: '#94a3b8', fontSize: 13 },
  locationMeta: { fontSize: 12, color: '#475569', textAlign: 'right', lineHeight: 1.6 },
  errorBox: {
    borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca',
    color: '#b91c1c', padding: '12px 14px', fontSize: 13, lineHeight: 1.5, marginBottom: 14,
  },
  primaryBtn: {
    width: '100%', border: 'none', borderRadius: 12,
    background: 'linear-gradient(135deg, #0f766e, #115e59)',
    color: '#fff', padding: '13px 16px', fontWeight: 800, fontSize: 14,
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  testGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 12, marginTop: 16,
  },
  testCard: {
    borderRadius: 14, background: '#fff', border: '1px solid #e2e8f0',
    padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start',
  },
  testStep: {
    width: 32, height: 32, borderRadius: '50%', background: '#dcfce7',
    color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, flexShrink: 0, fontSize: 14,
  },
  testTitle: { fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 6 },
  testText: { fontSize: 12, color: '#475569', lineHeight: 1.6 },
  emptyState: {
    borderRadius: 22, border: '1px dashed #7dd3fc',
    background: 'linear-gradient(160deg, #f0f9ff, #e0f2fe)',
    padding: '40px 28px', display: 'flex', flexDirection: 'column',
    gap: 12, alignItems: 'center', textAlign: 'center',
  },
  emptyTitle: { fontSize: 20, fontWeight: 800, color: '#0f172a' },
  emptyText: { color: '#475569', fontSize: 14, lineHeight: 1.7, maxWidth: 340 },
  summaryStrip: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 12, marginBottom: 20, padding: '16px 18px',
    background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0',
  },
  summaryLabel: {
    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em',
    color: '#94a3b8', marginBottom: 6, fontWeight: 700,
  },
  summaryValue: { fontSize: 18, fontWeight: 800, color: '#0f172a' },
  subPanel: {
    borderRadius: 14, background: '#fff', border: '1px solid #e2e8f0',
    padding: '16px 18px', marginBottom: 14,
  },
  subTitle: { fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 12 },
  summaryText: { margin: 0, color: '#334155', fontSize: 14, lineHeight: 1.8 },
  sourceWrap: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  sourceChip: {
    borderRadius: 999, padding: '6px 12px', background: '#ecfeff',
    color: '#155e75', fontSize: 12, fontWeight: 700, border: '1px solid #a5f3fc',
  },
  recCard: {
    borderRadius: 14, padding: '16px 18px',
    background: '#fff', border: '1px solid #e2e8f0', marginBottom: 10,
  },
  recHead: { display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
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
  emptyInline: {
    borderRadius: 12, border: '1px dashed #e2e8f0', background: '#f8fafc',
    padding: '14px', color: '#64748b', fontSize: 13, textAlign: 'center',
  },
  docCard: {
    borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0',
    padding: '12px 14px', marginBottom: 10,
  },
  docTitle: { fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 5 },
  docMeta: { fontSize: 11, color: '#94a3b8', marginBottom: 6 },
  docText: { fontSize: 12, color: '#475569', lineHeight: 1.6 },
}
