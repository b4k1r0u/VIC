import React, { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BrainCircuit,
  Building2,
  CheckCircle2,
  ClipboardList,
  MapPin,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import communeCatboostRiskScores from '../../commune_catboost_risk_scores.json'
import { geoAPI } from '../api/geo'
import { mlAPI } from '../api/ml'
import PolicyRiskBadge from '../components/policies/PolicyRiskBadge'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import RecommendationCallout from '../components/shared/RecommendationCallout'
import ZoneBadge from '../components/shared/ZoneBadge'
import { CONSTRUCTION_TYPE_OPTIONS, TYPE_RISQUE_OPTIONS } from '../types/policy'
import { formatCompactDzd, formatInteger } from '../utils/format'

const INITIAL_FORM = {
  numero_police: '',
  wilaya_code: '',
  commune_name: '',
  type_risque: TYPE_RISQUE_OPTIONS[0],
  construction_type: CONSTRUCTION_TYPE_OPTIONS[0],
  valeur_assuree: '12000000',
  prime_nette: '26000',
  date_effet: '2025-01-01',
  date_expiration: '2025-12-31',
  year: String(new Date().getFullYear()),
}

const TIER_META = {
  LOW: {
    label: 'Faible',
    color: '#047857',
    surface: 'linear-gradient(180deg, rgba(16,185,129,0.16) 0%, rgba(240,253,250,0.92) 100%)',
    border: '#86efac',
    ring: 'rgba(4,120,87,0.12)',
  },
  MEDIUM: {
    label: 'Modere',
    color: '#b45309',
    surface: 'linear-gradient(180deg, rgba(245,158,11,0.18) 0%, rgba(255,251,235,0.94) 100%)',
    border: '#fcd34d',
    ring: 'rgba(180,83,9,0.14)',
  },
  HIGH: {
    label: 'Eleve',
    color: '#b91c1c',
    surface: 'linear-gradient(180deg, rgba(248,113,113,0.18) 0%, rgba(254,242,242,0.95) 100%)',
    border: '#fca5a5',
    ring: 'rgba(185,28,28,0.14)',
  },
}

const TYPE_IMPACT = {
  '1 - Bien Immobilier': 0,
  '2 - Installation Commerciale': 6,
  '3 - Installation Industrielle': 12,
  '4 - Vehicule': -8,
  '5 - Autre': 4,
}

const CONSTRUCTION_IMPACT = {
  'Beton arme': -8,
  'Maconnerie chainee': -3,
  'Maconnerie non chainee': 8,
  Metal: 3,
  Bois: 12,
}

const EXPECTED_RATE_BY_ZONE = {
  '0': 0.06,
  I: 0.09,
  IIa: 0.14,
  IIb: 0.19,
  III: 0.27,
}

const ZONE_LABELS = {
  '0': 'Zone tres faible',
  I: 'Zone faible',
  IIa: 'Zone moderee',
  IIb: 'Zone soutenue',
  III: 'Zone severe',
}

function PageStyles() {
  return (
    <style>{`
      .sandbox-page input, .sandbox-page select, .sandbox-page button {
        font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
      }
      .sandbox-page input, .sandbox-page select {
        width: 100%;
        box-sizing: border-box;
        padding: 12px 14px;
        border: 1.5px solid #d9e2ef;
        border-radius: 14px;
        outline: none;
        background: rgba(255,255,255,0.96);
        color: #0f172a;
        font-size: 14px;
        transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
      }
      .sandbox-page input:focus, .sandbox-page select:focus {
        border-color: #0f766e;
        box-shadow: 0 0 0 4px rgba(15,118,110,0.12);
      }
      .sandbox-page select:disabled, .sandbox-page input:disabled {
        cursor: not-allowed;
        opacity: 0.62;
        background: #f8fafc;
      }
      .sandbox-page button {
        transition: transform 0.16s ease, box-shadow 0.16s ease, filter 0.16s ease;
      }
      .sandbox-page button:hover:not(:disabled) {
        transform: translateY(-1px);
        filter: brightness(1.02);
      }
      .sandbox-page button:disabled {
        cursor: not-allowed;
        opacity: 0.58;
      }
      .sandbox-shell {
        display: grid;
        grid-template-columns: 440px minmax(0, 1fr);
        gap: 18px;
        align-items: start;
      }
      .sandbox-form-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }
      .sandbox-overview-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }
      .sandbox-split-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }
      @media (max-width: 1120px) {
        .sandbox-shell {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 760px) {
        .sandbox-form-grid,
        .sandbox-overview-grid,
        .sandbox-split-grid {
          grid-template-columns: 1fr;
        }
      }
    `}</style>
  )
}

function Field({ label, hint, children }) {
  return (
    <div style={S.field}>
      <div style={S.fieldTop}>
        <label style={S.fieldLabel}>{label}</label>
        {hint ? <span style={S.fieldHint}>{hint}</span> : null}
      </div>
      {children}
    </div>
  )
}

function ScoreBar({ label, value, color }) {
  return (
    <div style={S.scoreBarWrap}>
      <div style={S.scoreBarTop}>
        <span>{label}</span>
        <strong>{value.toFixed(1)}%</strong>
      </div>
      <div style={S.scoreBarTrack}>
        <div style={{ ...S.scoreBarFill, width: `${Math.max(0, Math.min(value, 100))}%`, background: color }} />
      </div>
    </div>
  )
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

function normalizeConstructionType(value) {
  const current = normalizeText(value)

  if (current.includes('BETON')) return 'Beton arme'
  if (current.includes('MACONNERIE') && current.includes('NON')) return 'Maconnerie non chainee'
  if (current.includes('MACONNERIE')) return 'Maconnerie chainee'
  if (current.includes('METAL')) return 'Metal'
  if (current.includes('BOIS')) return 'Bois'

  return value
}

function normalizeRiskType(value) {
  const current = normalizeText(value)

  if (current.includes('IMMOBILIER')) return '1 - Bien Immobilier'
  if (current.includes('COMMERCIALE')) return '2 - Installation Commerciale'
  if (current.includes('INDUSTRIELLE')) return '3 - Installation Industrielle'
  if (current.includes('VEHICULE')) return '4 - Vehicule'

  return '5 - Autre'
}

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function inferTier(score) {
  if (score >= 65) return 'HIGH'
  if (score >= 35) return 'MEDIUM'
  return 'LOW'
}

function buildProbabilities(score) {
  const high = clamp((score - 35) * 1.35, 0, 100)
  const low = clamp((65 - score) * 1.45, 0, 100)
  const medium = clamp(100 - high - low, 0, 100)
  const total = high + medium + low || 1

  return {
    LOW: (low / total) * 100,
    MEDIUM: (medium / total) * 100,
    HIGH: (high / total) * 100,
  }
}

function normalizeReferenceRecord(item) {
  return {
    ...item,
    commune_name: item.commune_label || item.commune_name,
    commune_key: normalizeText(item.commune_label || item.commune_name),
    wilaya_code: String(item.wilaya_code ?? '').padStart(2, '0'),
    zone_sismique: item.zone_sismique || '0',
    type_risque: normalizeRiskType(item.type_risque),
    construction_type: normalizeConstructionType(item.construction_type),
    risk_score: toNumber(item.risk_score),
    valeur_assuree: toNumber(item.valeur_assuree),
    prime_nette: toNumber(item.prime_nette),
    probabilities: {
      LOW: toNumber(item.probabilities?.LOW),
      MEDIUM: toNumber(item.probabilities?.MEDIUM),
      HIGH: toNumber(item.probabilities?.HIGH),
    },
  }
}

const REFERENCE_DATA = communeCatboostRiskScores.map(normalizeReferenceRecord)

function findReferenceRecord({ wilaya_code, commune_name }) {
  const wilayaCode = String(wilaya_code ?? '').padStart(2, '0')
  const communeKey = normalizeText(commune_name)

  return (
    REFERENCE_DATA.find(
      (item) => item.wilaya_code === wilayaCode && item.commune_key === communeKey
    ) ??
    REFERENCE_DATA.find((item) => item.wilaya_code === wilayaCode) ??
    null
  )
}

function getExpectedRate(zone) {
  return EXPECTED_RATE_BY_ZONE[zone] ?? 0.12
}

function buildFallbackMetrics(form, zone, referenceRecord) {
  const insuredValue = toNumber(form.valeur_assuree)
  const netPremium = toNumber(form.prime_nette)
  const premiumRate = insuredValue > 0 ? (netPremium / insuredValue) * 100 : 0
  const expectedRate = getExpectedRate(zone)
  const referenceScore = referenceRecord?.risk_score ?? ((expectedRate / 0.27) * 82 + 8)
  const valuePressure =
    insuredValue >= 50000000 ? 10 :
    insuredValue >= 20000000 ? 6 :
    insuredValue >= 8000000 ? 3 :
    0
  const pricingPressure =
    premiumRate < expectedRate * 0.75 ? 14 :
    premiumRate < expectedRate ? 8 :
    premiumRate > expectedRate * 1.35 ? -4 :
    0
  const typePressure = TYPE_IMPACT[normalizeRiskType(form.type_risque)] ?? 0
  const constructionPressure = CONSTRUCTION_IMPACT[normalizeConstructionType(form.construction_type)] ?? 0
  const score = clamp(
    referenceScore + valuePressure + pricingPressure + typePressure + constructionPressure,
    0,
    100
  )
  const tier = inferTier(score)

  return {
    score,
    tier,
    proba: referenceRecord?.probabilities ?? buildProbabilities(score),
    confidence: referenceRecord ? 0.72 : 0.38,
    dominant_factor:
      pricingPressure >= typePressure && pricingPressure >= constructionPressure && pricingPressure > 0
        ? 'Prime insuffisante versus zone'
        : typePressure >= constructionPressure && typePressure >= valuePressure && typePressure > 0
          ? 'Nature du risque souscrit'
          : constructionPressure > 0
            ? 'Type constructif'
            : valuePressure > 0
              ? 'Montant assure eleve'
              : `Contexte communal ${referenceRecord?.commune_name || ''}`.trim(),
    premium_rate: premiumRate,
    expected_rate: expectedRate,
    premium_delta_pct: expectedRate > 0 ? ((premiumRate - expectedRate) / expectedRate) * 100 : 0,
    reference: referenceRecord,
  }
}

function buildAdvisory({ score, tier, premium_delta_pct, premium_rate, expected_rate, reference, dominant_factor }, zone, form) {
  const verdict =
    tier === 'HIGH'
      ? 'Escalade underwriting requise'
      : tier === 'MEDIUM'
        ? 'Emission possible avec conditions'
        : 'Emission recommandee'

  const priceAction =
    premium_delta_pct < -20
      ? `Revaloriser la prime nette vers ${expected_rate.toFixed(2)}% minimum du capital assure.`
      : premium_delta_pct < 0
        ? 'Ajuster legerement le tarif avant validation.'
        : 'Le tarif semble coherent avec le niveau de risque detecte.'

  const topRisks = [
    zone === 'III' || zone === 'IIb'
      ? `Exposition sismique structurelle en ${ZONE_LABELS[zone] || `zone ${zone}`}.`
      : `Commune rattachee a ${ZONE_LABELS[zone] || `zone ${zone}`}.`,
    dominant_factor ? `Facteur dominant: ${dominant_factor}.` : null,
    premium_delta_pct < 0
      ? `Tarification en dessous du niveau indicatif (${premium_rate.toFixed(2)}% vs ${expected_rate.toFixed(2)}%).`
      : 'Tarification non sous-optimale au regard du contexte geographique.',
  ].filter(Boolean)

  const actions = [
    priceAction,
    tier === 'HIGH'
      ? 'Exiger une validation manuelle, une limite d engagement et des justificatifs techniques.'
      : tier === 'MEDIUM'
        ? 'Ajouter des conditions de prevention et verifier les plans de continuite.'
        : 'Poursuivre le flux d emission avec controle documentaire standard.',
    normalizeConstructionType(form.construction_type) !== 'Beton arme'
      ? 'Verifier la qualite constructive et la conformite parasismique du batiment.'
      : 'Capitaliser sur le profil constructif favorable dans la note de souscription.',
  ]

  const recommendation_sentence =
    tier === 'HIGH'
      ? `Police a orienter vers revue senior: score ${score.toFixed(1)}/100 avec un besoin de conditions strictes avant emission.`
      : tier === 'MEDIUM'
        ? `Police recevable sous conditions: score ${score.toFixed(1)}/100, avec un point d attention principal sur la tarification et la mitigation.`
        : `Police favorable a l emission: score ${score.toFixed(1)}/100, avec un niveau de risque maitrise pour cette commune.`

  const executive_summary = [
    `Le draft soumis sur ${form.commune_name || 'la commune selectionnee'} ressort en niveau ${TIER_META[tier].label.toLowerCase()} avec un score estime de ${score.toFixed(1)}/100.`,
    premium_delta_pct < 0
      ? `La prime nette apparait en retrait d environ ${Math.abs(premium_delta_pct).toFixed(0)}% par rapport au repere attendu pour la zone ${zone}.`
      : `La prime nette reste compatible avec le repere indicatif de la zone ${zone}.`,
    reference?.commune_name
      ? `Le benchmark local s appuie sur le profil de reference ${reference.commune_name}.`
      : 'Le benchmark local provient de la base CatBoost embarquee.',
  ].join(' ')

  return {
    verdict,
    recommendation_sentence,
    executive_summary,
    risks: topRisks,
    actions,
  }
}

function mergeLiveAndFallback(live, fallback, zone, form) {
  const score = Number.isFinite(live?.score) ? live.score : fallback.score
  const tier = live?.tier || inferTier(score)
  const merged = {
    ...fallback,
    ...live,
    score,
    tier,
    confidence: live?.confidence ?? fallback.confidence,
    elapsed_ms: live?.elapsed_ms ?? null,
    proba: {
      LOW: toNumber(live?.proba?.LOW) || fallback.proba.LOW,
      MEDIUM: toNumber(live?.proba?.MEDIUM) || fallback.proba.MEDIUM,
      HIGH: toNumber(live?.proba?.HIGH) || fallback.proba.HIGH,
    },
    premium_rate: fallback.premium_rate,
    expected_rate: fallback.expected_rate,
    premium_delta_pct: fallback.premium_delta_pct,
    reference: fallback.reference,
    dominant_factor: live?.dominant_factor || fallback.dominant_factor,
  }

  return {
    ...merged,
    ...buildAdvisory(merged, zone, form),
  }
}

function formatRate(value) {
  return `${toNumber(value).toFixed(2)}%`
}

export default function SandboxPage() {
  const [wilayas, setWilayas] = useState([])
  const [communes, setCommunes] = useState([])
  const [zoneInfo, setZoneInfo] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [evaluation, setEvaluation] = useState(null)
  const [evaluating, setEvaluating] = useState(false)
  const [error, setError] = useState(null)
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState('')

  useEffect(() => {
    geoAPI.getWilayas().then(setWilayas).catch(() => setWilayas([]))
  }, [])

  useEffect(() => {
    if (!form.wilaya_code) {
      setCommunes([])
      setZoneInfo(null)
      return
    }

    geoAPI.getCommunesByWilaya(form.wilaya_code).then(setCommunes).catch(() => setCommunes([]))
  }, [form.wilaya_code])

  useEffect(() => {
    if (!form.wilaya_code || !form.commune_name) {
      setZoneInfo(null)
      return
    }

    geoAPI
      .getZone(form.wilaya_code, form.commune_name)
      .then(setZoneInfo)
      .catch(() => {
        const reference = findReferenceRecord(form)
        setZoneInfo(reference ? { zone: reference.zone_sismique, description: 'Zone inferree depuis la base locale.' } : null)
      })
  }, [form.wilaya_code, form.commune_name])

  const selectedWilaya = useMemo(
    () => wilayas.find((item) => String(item.code) === String(form.wilaya_code)) ?? null,
    [form.wilaya_code, wilayas]
  )

  const referenceRecord = useMemo(() => findReferenceRecord(form), [form])
  const effectiveZone = zoneInfo?.zone || referenceRecord?.zone_sismique || '0'

  const formKey = useMemo(
    () => JSON.stringify({
      ...form,
      zone: effectiveZone,
    }),
    [effectiveZone, form]
  )

  const communePeers = useMemo(
    () =>
      REFERENCE_DATA.filter(
        (item) => item.wilaya_code === String(form.wilaya_code ?? '').padStart(2, '0')
      ),
    [form.wilaya_code]
  )

  const zonePeers = useMemo(
    () => REFERENCE_DATA.filter((item) => item.zone_sismique === effectiveZone),
    [effectiveZone]
  )

  const benchmarks = useMemo(() => {
    const wilayaAverage =
      communePeers.length > 0
        ? communePeers.reduce((sum, item) => sum + item.risk_score, 0) / communePeers.length
        : 0
    const zoneAverage =
      zonePeers.length > 0
        ? zonePeers.reduce((sum, item) => sum + item.risk_score, 0) / zonePeers.length
        : 0

    return {
      wilayaAverage,
      zoneAverage,
      wilayaCommunes: communePeers.length,
      zoneCommunes: zonePeers.length,
    }
  }, [communePeers, zonePeers])

  const formComplete =
    Boolean(form.wilaya_code) &&
    Boolean(form.commune_name) &&
    toNumber(form.valeur_assuree) > 0 &&
    toNumber(form.prime_nette) >= 0

  const staleResult = Boolean(evaluation && lastEvaluatedKey && lastEvaluatedKey !== formKey)
  const tierMeta = TIER_META[evaluation?.tier || 'MEDIUM']

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function runEvaluation() {
    if (!formComplete) return

    setEvaluating(true)
    setError(null)

    const fallback = buildFallbackMetrics(form, effectiveZone, referenceRecord)
    const payload = {
      policy_id: form.numero_police || 'SANDBOX_PREVIEW',
      wilaya_code: form.wilaya_code,
      commune_name: form.commune_name,
      zone_sismique: effectiveZone,
      type_risque: normalizeRiskType(form.type_risque),
      construction_type: normalizeConstructionType(form.construction_type),
      valeur_assuree: toNumber(form.valeur_assuree),
      prime_nette: toNumber(form.prime_nette),
      year: toNumber(form.year) || new Date(form.date_effet || Date.now()).getFullYear(),
    }

    try {
      let live = await mlAPI.scorePolicy(payload)

      if (!live?.score && !live?.tier) {
        const batch = await mlAPI.batchScore([payload])
        live = batch?.results?.[0] ?? null
      }

      setEvaluation(mergeLiveAndFallback(live, fallback, effectiveZone, form))
    } catch (err) {
      setEvaluation(mergeLiveAndFallback(null, fallback, effectiveZone, form))
      setError(err?.message || 'Le scoring live est indisponible, fallback local applique.')
    } finally {
      setEvaluating(false)
      setLastEvaluatedKey(formKey)
    }
  }

  return (
    <main style={S.page} className="page-fade sandbox-page">
      <PageStyles />

      <section style={S.hero}>
        <div style={S.heroCopy}>
          <div style={S.heroEyebrow}>Sandbox Souscription</div>
          <h1 style={S.heroTitle}>Tester une nouvelle police avant emission.</h1>
          <p style={S.heroText}>
            Cette vue transforme le sandbox en poste de decision underwriting: la police draft est
            scoree, comparee au benchmark communal et accompagnee de risques et de recommandations
            directement exploitables.
          </p>
          <div style={S.heroChips}>
            {['Scoring ML', 'Fallback JSON communal', 'Recommandations underwriting', 'Lecture zone + pricing'].map((chip) => (
              <span key={chip} style={S.heroChip}>{chip}</span>
            ))}
          </div>
        </div>

        <div style={S.heroStats}>
          <div style={S.heroStatCard}>
            <div style={S.heroStatLabel}>Base locale</div>
            <div style={S.heroStatValue}>{formatInteger(REFERENCE_DATA.length)}</div>
            <div style={S.heroStatNote}>communes CatBoost utilisables en secours</div>
          </div>
          <div style={S.heroStatCard}>
            <div style={S.heroStatLabel}>Zone actuelle</div>
            <div style={S.heroStatValue}>{effectiveZone}</div>
            <div style={S.heroStatNote}>{ZONE_LABELS[effectiveZone] || 'Zone en attente'}</div>
          </div>
          <div style={S.heroStatCard}>
            <div style={S.heroStatLabel}>Reference locale</div>
            <div style={S.heroStatValue}>{referenceRecord?.commune_name || 'Aucune'}</div>
            <div style={S.heroStatNote}>{selectedWilaya?.name || 'Selectionnez une wilaya'}</div>
          </div>
        </div>
      </section>

      <div className="sandbox-shell" style={S.shell}>
        <section style={S.formPanel}>
          <div style={S.panelTop}>
            <div>
              <div style={S.panelEyebrow}>Draft policy</div>
              <div style={S.panelTitle}>Nouveau scenario de souscription</div>
            </div>
            <div style={S.sideBadge}>Avant emission</div>
          </div>

          <div className="sandbox-form-grid">
            <Field label="Numero police" hint="Optionnel">
              <input
                value={form.numero_police}
                onChange={(e) => setField('numero_police', e.target.value)}
                placeholder="ex. SANDBOX-2026-001"
              />
            </Field>

            <Field label="Annee" hint="Pilotage">
              <input
                type="number"
                value={form.year}
                onChange={(e) => setField('year', e.target.value)}
                min={2020}
                max={2035}
              />
            </Field>

            <Field label="Wilaya" hint="Obligatoire">
              <select
                value={form.wilaya_code}
                onChange={(e) => {
                  setField('wilaya_code', e.target.value)
                  setField('commune_name', '')
                }}
              >
                <option value="">Selectionner une wilaya</option>
                {wilayas.map((wilaya) => (
                  <option key={wilaya.code} value={wilaya.code}>
                    {wilaya.code} - {wilaya.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Commune" hint="Obligatoire">
              <select
                value={form.commune_name}
                onChange={(e) => setField('commune_name', e.target.value)}
                disabled={!communes.length}
              >
                <option value="">Selectionner une commune</option>
                {communes.map((commune) => (
                  <option key={`${commune.wilaya_code}-${commune.commune_name}`} value={commune.commune_name}>
                    {commune.commune_name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Type de risque" hint="ML feature">
              <select value={form.type_risque} onChange={(e) => setField('type_risque', e.target.value)}>
                {TYPE_RISQUE_OPTIONS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </Field>

            <Field label="Construction" hint="ML feature">
              <select value={form.construction_type} onChange={(e) => setField('construction_type', e.target.value)}>
                {CONSTRUCTION_TYPE_OPTIONS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </Field>

            <Field label="Valeur assuree" hint="DZD">
              <input
                type="number"
                min={0}
                value={form.valeur_assuree}
                onChange={(e) => setField('valeur_assuree', e.target.value)}
                placeholder="12000000"
              />
            </Field>

            <Field label="Prime nette" hint="DZD">
              <input
                type="number"
                min={0}
                value={form.prime_nette}
                onChange={(e) => setField('prime_nette', e.target.value)}
                placeholder="26000"
              />
            </Field>

            <Field label="Date effet">
              <input
                type="date"
                value={form.date_effet}
                onChange={(e) => setField('date_effet', e.target.value)}
              />
            </Field>

            <Field label="Date expiration">
              <input
                type="date"
                value={form.date_expiration}
                onChange={(e) => setField('date_expiration', e.target.value)}
              />
            </Field>
          </div>

          <div style={S.contextCard}>
            <div style={S.contextTop}>
              <div>
                <div style={S.contextEyebrow}>Contexte geographique</div>
                <div style={S.contextTitle}>
                  {form.commune_name || 'Commune a definir'}
                  {selectedWilaya ? `, ${selectedWilaya.name}` : ''}
                </div>
              </div>
              <div style={S.contextIcons}>
                <div style={S.contextIcon}><MapPin size={15} /></div>
                <div style={S.contextIcon}><Building2 size={15} /></div>
              </div>
            </div>

            <div style={S.contextBody}>
              <div style={S.contextMetric}>
                <span style={S.contextMetricLabel}>Zone RPA</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ZoneBadge zone={effectiveZone} size="md" showLabel />
                </div>
              </div>
              <div style={S.contextMetric}>
                <span style={S.contextMetricLabel}>Description</span>
                <span style={S.contextMetricValue}>
                  {zoneInfo?.description || 'Zone derivee via la base locale si l API geo ne repond pas.'}
                </span>
              </div>
              <div style={S.contextMetric}>
                <span style={S.contextMetricLabel}>Benchmark communal</span>
                <span style={S.contextMetricValue}>
                  {referenceRecord
                    ? `${referenceRecord.commune_name} · ${referenceRecord.risk_score.toFixed(1)}/100`
                    : 'Aucune ligne directe, fallback wilaya/base globale.'}
                </span>
              </div>
              <div style={S.contextMetric}>
                <span style={S.contextMetricLabel}>Ticket draft</span>
                <span style={S.contextMetricValue}>
                  {`${formatCompactDzd(form.valeur_assuree)} · prime ${formatCompactDzd(form.prime_nette)}`}
                </span>
              </div>
            </div>
          </div>

          <div style={S.actionRow}>
            <button
              type="button"
              onClick={runEvaluation}
              disabled={!formComplete || evaluating}
              style={S.primaryButton}
            >
              {evaluating ? <LoadingSpinner size={16} /> : <BrainCircuit size={16} />}
              {evaluating ? 'Analyse en cours...' : 'Analyser cette police'}
            </button>

            <div style={S.actionHint}>
              {staleResult
                ? 'Le formulaire a change depuis la derniere analyse.'
                : 'Le resultat affichera score, risques et recommandations.'}
            </div>
          </div>

          {error ? (
            <div style={S.warningBox}>
              <TriangleAlert size={16} />
              <span>{error}</span>
            </div>
          ) : null}
        </section>

        <section style={{ ...S.resultPanel, background: tierMeta.surface, borderColor: tierMeta.border, boxShadow: `0 30px 60px ${tierMeta.ring}` }}>
          {!evaluation && !evaluating ? (
            <div style={S.emptyState}>
              <div style={S.emptyIcon}><Sparkles size={28} color="#0f766e" /></div>
              <div style={S.emptyTitle}>Le sandbox est pret pour une decision.</div>
              <div style={S.emptyText}>
                Renseignez la police draft puis lancez l analyse. La page generera le score, les
                probabilites, les points de vigilance et la recommandation underwriting.
              </div>
              <div style={S.emptyFeatureRow}>
                {[
                  'Verdict underwriting',
                  'Comparaison commune / zone',
                  'Controle pricing',
                ].map((item) => (
                  <span key={item} style={S.emptyFeatureChip}>{item}</span>
                ))}
              </div>
            </div>
          ) : null}

          {evaluating ? (
            <div style={S.emptyState}>
              <div style={S.emptyIcon}><LoadingSpinner size={34} /></div>
              <div style={S.emptyTitle}>Analyse du draft en cours</div>
              <div style={S.emptyText}>
                Le moteur tente d appeler l API ML puis complete le resultat avec la base
                `commune_catboost_risk_scores.json` si necessaire.
              </div>
            </div>
          ) : null}

          {evaluation ? (
            <>
              <div style={S.resultTop}>
                <div>
                  <div style={S.panelEyebrow}>Decision cockpit</div>
                  <div style={S.resultTitle}>{evaluation.verdict}</div>
                  <div style={S.resultSub}>
                    {form.numero_police || 'Scenario draft'} <ArrowRight size={14} style={{ verticalAlign: 'middle' }} /> {form.commune_name || 'Commune'}
                  </div>
                </div>
              </div>

              {staleResult ? (
                <div style={S.staleBox}>
                  Les champs ont change apres la derniere analyse. Relancez le scoring pour mettre
                  a jour la decision.
                </div>
              ) : null}

              <div style={S.scoreHero}>
                <div>
                  <div style={S.scoreEyebrow}>Score estime</div>
                  <div style={S.scoreValue}>
                    <span style={{ color: tierMeta.color }}>{evaluation.score.toFixed(1)}</span>
                    <span style={S.scoreSuffix}>/100</span>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <PolicyRiskBadge score={evaluation.score} tier={evaluation.tier} />
                  </div>
                </div>

                <div style={S.scoreMetaStack}>
                  <div style={S.scoreMetaCard}>
                    <div style={S.scoreMetaLabel}>Confiance</div>
                    <div style={S.scoreMetaValue}>{evaluation.confidence == null ? '—' : `${(evaluation.confidence * 100).toFixed(0)}%`}</div>
                  </div>
                  <div style={S.scoreMetaCard}>
                    <div style={S.scoreMetaLabel}>Latence</div>
                    <div style={S.scoreMetaValue}>{evaluation.elapsed_ms == null ? '—' : `${evaluation.elapsed_ms.toFixed(0)} ms`}</div>
                  </div>
                </div>
              </div>

              <div className="sandbox-overview-grid" style={{ marginBottom: 16 }}>
                <div style={S.overviewCard}>
                  <div style={S.overviewLabel}>Prime / capital</div>
                  <div style={S.overviewValue}>{formatRate(evaluation.premium_rate)}</div>
                  <div style={S.overviewNote}>Cible indicative {formatRate(evaluation.expected_rate)}</div>
                </div>
                <div style={S.overviewCard}>
                  <div style={S.overviewLabel}>Delta pricing</div>
                  <div style={S.overviewValue}>{evaluation.premium_delta_pct >= 0 ? '+' : ''}{evaluation.premium_delta_pct.toFixed(0)}%</div>
                  <div style={S.overviewNote}>vs repere zone {effectiveZone}</div>
                </div>
                <div style={S.overviewCard}>
                  <div style={S.overviewLabel}>Benchmark commune</div>
                  <div style={S.overviewValue}>{evaluation.reference ? evaluation.reference.risk_score.toFixed(1) : '—'}</div>
                  <div style={S.overviewNote}>{evaluation.reference?.commune_name || 'Aucun direct'}</div>
                </div>
              </div>

              <div style={S.subPanel}>
                <div style={S.subPanelTitle}>Probabilites par classe</div>
                <ScoreBar label="LOW" value={evaluation.proba.LOW} color="#059669" />
                <ScoreBar label="MEDIUM" value={evaluation.proba.MEDIUM} color="#d97706" />
                <ScoreBar label="HIGH" value={evaluation.proba.HIGH} color="#dc2626" />
              </div>

              <div style={S.calloutWrap}>
                <RecommendationCallout
                  payload={evaluation}
                  eyebrow="Recommendation"
                  title="Phrase de decision underwriting"
                  badgeLabel={evaluation.tier}
                  emptyMessage="Aucune recommandation disponible."
                  accent={tierMeta.color}
                  surface="linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.94) 100%)"
                  borderColor={tierMeta.border}
                  quoteSurface="rgba(255,255,255,0.78)"
                />
              </div>

              <div className="sandbox-split-grid">
                <div style={S.subPanel}>
                  <div style={S.subPanelTitleRow}>
                    <ShieldAlert size={16} />
                    <span>Risques a surveiller</span>
                  </div>
                  <div style={S.listCol}>
                    {evaluation.risks.map((item) => (
                      <div key={item} style={S.listItemRisk}>{item}</div>
                    ))}
                  </div>
                </div>

                <div style={S.subPanel}>
                  <div style={S.subPanelTitleRow}>
                    <CheckCircle2 size={16} />
                    <span>Actions recommandees</span>
                  </div>
                  <div style={S.listCol}>
                    {evaluation.actions.map((item) => (
                      <div key={item} style={S.listItemAction}>{item}</div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sandbox-split-grid" style={{ marginTop: 14 }}>
                <div style={S.subPanel}>
                  <div style={S.subPanelTitleRow}>
                    <ClipboardList size={16} />
                    <span>Synthese executive</span>
                  </div>
                  <p style={S.summaryText}>{evaluation.executive_summary}</p>
                  {evaluation.dominant_factor ? (
                    <div style={S.factorChip}>Facteur dominant: {evaluation.dominant_factor}</div>
                  ) : null}
                </div>

                <div style={S.subPanel}>
                  <div style={S.subPanelTitleRow}>
                    <Building2 size={16} />
                    <span>Benchmarks de contexte</span>
                  </div>
                  <div style={S.metricList}>
                    <div style={S.metricRow}>
                      <span>Score moyen wilaya</span>
                      <strong>{benchmarks.wilayaAverage ? benchmarks.wilayaAverage.toFixed(1) : '—'}/100</strong>
                    </div>
                    <div style={S.metricRow}>
                      <span>Communes benchmark wilaya</span>
                      <strong>{formatInteger(benchmarks.wilayaCommunes)}</strong>
                    </div>
                    <div style={S.metricRow}>
                      <span>Score moyen zone</span>
                      <strong>{benchmarks.zoneAverage ? benchmarks.zoneAverage.toFixed(1) : '—'}/100</strong>
                    </div>
                    <div style={S.metricRow}>
                      <span>Communes benchmark zone</span>
                      <strong>{formatInteger(benchmarks.zoneCommunes)}</strong>
                    </div>
                    <div style={S.metricRow}>
                      <span>Reference locale</span>
                      <strong>{referenceRecord?.commune_name || 'Fallback global'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </section>
      </div>
    </main>
  )
}

const S = {
  page: {
    flex: 1,
    overflowY: 'auto',
    padding: '22px 24px 28px',
    background:
      'radial-gradient(circle at top left, rgba(13,148,136,0.08), transparent 28%), radial-gradient(circle at top right, rgba(59,130,246,0.08), transparent 30%), #f6f8fb',
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.2fr) minmax(320px, 0.8fr)',
    gap: 18,
    marginBottom: 18,
  },
  heroCopy: {
    padding: '22px 24px',
    borderRadius: 28,
    background: 'linear-gradient(135deg, #083344 0%, #0f766e 46%, #155e75 100%)',
    color: '#ecfeff',
    boxShadow: '0 28px 60px rgba(8,51,68,0.25)',
  },
  heroEyebrow: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.16em',
    fontWeight: 800,
    color: 'rgba(236,254,255,0.72)',
    marginBottom: 12,
  },
  heroTitle: {
    margin: 0,
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '2rem',
    lineHeight: 1.05,
    maxWidth: 620,
  },
  heroText: {
    margin: '14px 0 0',
    maxWidth: 700,
    color: 'rgba(236,254,255,0.86)',
    lineHeight: 1.8,
    fontSize: 14,
  },
  heroChips: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 18,
  },
  heroChip: {
    padding: '8px 12px',
    borderRadius: 999,
    border: '1px solid rgba(236,254,255,0.18)',
    background: 'rgba(255,255,255,0.10)',
    fontSize: 12,
    fontWeight: 700,
  },
  heroStats: {
    display: 'grid',
    gap: 12,
  },
  heroStatCard: {
    padding: '18px 18px',
    borderRadius: 24,
    background: 'rgba(255,255,255,0.92)',
    border: '1px solid rgba(15,23,42,0.06)',
    boxShadow: '0 20px 40px rgba(15,23,42,0.07)',
  },
  heroStatLabel: {
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: '#94a3b8',
    marginBottom: 10,
  },
  heroStatValue: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '1.38rem',
    fontWeight: 800,
    color: '#0f172a',
    marginBottom: 6,
  },
  heroStatNote: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 1.6,
  },
  shell: {
    alignItems: 'start',
  },
  formPanel: {
    padding: '18px 18px 20px',
    borderRadius: 24,
    background: 'rgba(255,255,255,0.96)',
    border: '1px solid rgba(15,23,42,0.08)',
    boxShadow: '0 22px 45px rgba(15,23,42,0.08)',
    position: 'sticky',
    top: 18,
  },
  resultPanel: {
    padding: '18px 18px 20px',
    borderRadius: 28,
    border: '1px solid',
    minHeight: 780,
  },
  panelTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  panelEyebrow: {
    fontSize: 11,
    fontWeight: 800,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    marginBottom: 6,
  },
  panelTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  sideBadge: {
    padding: '7px 11px',
    borderRadius: 999,
    background: 'rgba(15,118,110,0.10)',
    color: '#0f766e',
    border: '1px solid rgba(15,118,110,0.18)',
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  field: {
    marginBottom: 2,
  },
  fieldTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 7,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: '#64748b',
  },
  fieldHint: {
    fontSize: 11,
    color: '#94a3b8',
  },
  contextCard: {
    marginTop: 16,
    padding: '16px 16px',
    borderRadius: 20,
    background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
    border: '1px solid #e2e8f0',
  },
  contextTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  contextEyebrow: {
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: '#94a3b8',
    marginBottom: 6,
  },
  contextTitle: {
    fontWeight: 700,
    color: '#0f172a',
    fontSize: 15,
  },
  contextIcons: {
    display: 'flex',
    gap: 8,
  },
  contextIcon: {
    width: 34,
    height: 34,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    color: '#0f766e',
    background: 'rgba(15,118,110,0.10)',
  },
  contextBody: {
    display: 'grid',
    gap: 10,
  },
  contextMetric: {
    display: 'grid',
    gap: 6,
  },
  contextMetricLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 700,
  },
  contextMetricValue: {
    color: '#0f172a',
    fontSize: 13,
    lineHeight: 1.7,
  },
  actionRow: {
    marginTop: 16,
    display: 'grid',
    gap: 10,
  },
  primaryButton: {
    width: '100%',
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    border: 'none',
    borderRadius: 16,
    padding: '14px 16px',
    background: 'linear-gradient(135deg, #0f766e 0%, #155e75 100%)',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 800,
    boxShadow: '0 18px 30px rgba(15,118,110,0.22)',
  },
  actionHint: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 1.6,
  },
  warningBox: {
    marginTop: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 13px',
    borderRadius: 14,
    border: '1px solid #fcd34d',
    background: '#fffbeb',
    color: '#92400e',
    fontSize: 13,
    lineHeight: 1.6,
  },
  emptyState: {
    minHeight: 420,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '16px 18px',
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.76)',
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: 10,
  },
  emptyText: {
    maxWidth: 560,
    color: '#475569',
    lineHeight: 1.8,
    fontSize: 14,
  },
  emptyFeatureRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
  },
  emptyFeatureChip: {
    padding: '7px 12px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.78)',
    border: '1px solid rgba(15,23,42,0.06)',
    color: '#0f172a',
    fontSize: 12,
    fontWeight: 700,
  },
  resultTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 14,
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  resultTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#0f172a',
    marginBottom: 4,
  },
  resultSub: {
    color: '#475569',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  staleBox: {
    marginBottom: 14,
    padding: '11px 12px',
    borderRadius: 14,
    border: '1px solid rgba(59,130,246,0.18)',
    background: 'rgba(239,246,255,0.78)',
    color: '#1d4ed8',
    fontSize: 13,
    lineHeight: 1.7,
  },
  scoreHero: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'flex-start',
    padding: '18px 18px',
    borderRadius: 24,
    background: 'rgba(255,255,255,0.76)',
    border: '1px solid rgba(255,255,255,0.68)',
    marginBottom: 16,
  },
  scoreEyebrow: {
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: '#64748b',
    marginBottom: 8,
  },
  scoreValue: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 800,
    fontSize: '2.8rem',
    lineHeight: 1,
  },
  scoreSuffix: {
    color: '#94a3b8',
    fontSize: '1.1rem',
  },
  scoreMetaStack: {
    display: 'grid',
    gap: 10,
    minWidth: 130,
  },
  scoreMetaCard: {
    padding: '12px 14px',
    borderRadius: 16,
    background: 'rgba(255,255,255,0.8)',
    border: '1px solid rgba(15,23,42,0.06)',
  },
  scoreMetaLabel: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: '#94a3b8',
    marginBottom: 6,
  },
  scoreMetaValue: {
    color: '#0f172a',
    fontWeight: 800,
    fontSize: 16,
  },
  overviewCard: {
    padding: '14px 14px',
    borderRadius: 18,
    background: 'rgba(255,255,255,0.82)',
    border: '1px solid rgba(15,23,42,0.06)',
  },
  overviewLabel: {
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: '#94a3b8',
    marginBottom: 8,
  },
  overviewValue: {
    color: '#0f172a',
    fontWeight: 800,
    fontSize: '1.08rem',
    marginBottom: 4,
  },
  overviewNote: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 1.6,
  },
  subPanel: {
    padding: '16px 16px',
    borderRadius: 20,
    background: 'rgba(255,255,255,0.80)',
    border: '1px solid rgba(15,23,42,0.06)',
  },
  subPanelTitle: {
    fontWeight: 800,
    color: '#0f172a',
    fontSize: 15,
    marginBottom: 14,
  },
  subPanelTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontWeight: 800,
    color: '#0f172a',
    fontSize: 15,
    marginBottom: 14,
  },
  calloutWrap: {
    margin: '14px 0',
  },
  scoreBarWrap: {
    marginBottom: 12,
  },
  scoreBarTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    color: '#334155',
    fontSize: 13,
    marginBottom: 6,
  },
  scoreBarTrack: {
    width: '100%',
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    background: 'rgba(148,163,184,0.18)',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  listCol: {
    display: 'grid',
    gap: 10,
  },
  listItemRisk: {
    padding: '12px 12px',
    borderRadius: 14,
    background: 'rgba(254,242,242,0.82)',
    border: '1px solid rgba(248,113,113,0.18)',
    color: '#7f1d1d',
    fontSize: 13,
    lineHeight: 1.7,
  },
  listItemAction: {
    padding: '12px 12px',
    borderRadius: 14,
    background: 'rgba(236,253,245,0.84)',
    border: '1px solid rgba(16,185,129,0.18)',
    color: '#065f46',
    fontSize: 13,
    lineHeight: 1.7,
  },
  summaryText: {
    margin: 0,
    color: '#334155',
    fontSize: 14,
    lineHeight: 1.8,
  },
  factorChip: {
    marginTop: 12,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    borderRadius: 999,
    background: 'rgba(15,118,110,0.10)',
    color: '#0f766e',
    fontSize: 12,
    fontWeight: 700,
  },
  metricList: {
    display: 'grid',
    gap: 10,
  },
  metricRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    paddingBottom: 10,
    borderBottom: '1px solid rgba(148,163,184,0.18)',
    color: '#334155',
    fontSize: 13,
  },
}
