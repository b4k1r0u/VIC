import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import { motion } from 'framer-motion'
import 'leaflet/dist/leaflet.css'
import {
  ArrowLeft,
  BrainCircuit,
  Building2,
  Filter,
  Layers3,
  MapPin,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react'
import { geoAPI } from '../api/geo'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import { formatCompactDzd, formatInteger } from '../utils/format'
import communeCatboostRiskScores from '../../commune_catboost_risk_scores.json'

const ALGERIA_CENTER = [28.0339, 1.6596]
const DEFAULT_ZOOM = 5
const ALGERIA_BOUNDS = [
  [18.0, -8.8],
  [37.3, 12.2],
]

const ZONE_COLOR = {
  III: '#dc2626',
  IIb: '#ea580c',
  IIa: '#eab308',
  I: '#22c55e',
  '0': '#38bdf8',
}

const ZONE_WEIGHT = {
  '0': 1,
  I: 2,
  IIa: 3,
  IIb: 4,
  III: 5,
}

const TIER_META = {
  LOW: {
    label: 'Faible',
    color: '#059669',
    surface: 'rgba(5,150,105,0.12)',
  },
  MEDIUM: {
    label: 'Moyen',
    color: '#d97706',
    surface: 'rgba(217,119,6,0.14)',
  },
  HIGH: {
    label: 'Élevé',
    color: '#dc2626',
    surface: 'rgba(220,38,38,0.14)',
  },
}

function getProps(feature) {
  return feature?.properties ?? feature ?? {}
}

function normalizeCode(code) {
  return String(code ?? '').padStart(2, '0')
}

function getLatLng(item) {
  const props = getProps(item)
  const lat = Number(props.lat)
  const lon = Number(props.lon)
  if (Number.isFinite(lat) && Number.isFinite(lon)) return [lat, lon]
  return null
}

function aggregateWilayas(features) {
  const byWilaya = new Map()

  for (const feature of features) {
    const props = getProps(feature)
    const code = normalizeCode(props.wilaya_code)
    if (!code) continue

    const current = byWilaya.get(code) || {
      code,
      name: props.wilaya_name || `Wilaya ${code}`,
      exposure: 0,
      policies: 0,
      communes: 0,
      riskScoreSum: 0,
      riskWeight: 0,
      zoneCounts: { '0': 0, I: 0, IIa: 0, IIb: 0, III: 0 },
      points: [],
    }

    const exposure = Number(props.total_exposure) || 0
    const policies = Number(props.policy_count) || 0
    const zone = props.zone_sismique || '0'
    const score = Number(props.avg_risk_score) || 0
    const point = getLatLng(feature)

    current.exposure += exposure
    current.policies += policies
    current.communes += 1
    current.riskScoreSum += score
    current.riskWeight += 1
    current.zoneCounts[zone] = (current.zoneCounts[zone] || 0) + 1
    if (point) current.points.push(point)

    byWilaya.set(code, current)
  }

  return [...byWilaya.values()]
    .map((wilaya) => {
      const dominantZone = Object.entries(wilaya.zoneCounts).sort((a, b) => {
        const diff = b[1] - a[1]
        if (diff !== 0) return diff
        return (ZONE_WEIGHT[b[0]] || 0) - (ZONE_WEIGHT[a[0]] || 0)
      })[0]?.[0] || '0'

      const center =
        wilaya.points.length > 0
          ? [
              wilaya.points.reduce((sum, [lat]) => sum + lat, 0) / wilaya.points.length,
              wilaya.points.reduce((sum, [, lon]) => sum + lon, 0) / wilaya.points.length,
            ]
          : ALGERIA_CENTER

      return {
        ...wilaya,
        zone: dominantZone,
        avgRiskScore: wilaya.riskWeight ? wilaya.riskScoreSum / wilaya.riskWeight : 0,
        lat: center[0],
        lon: center[1],
      }
    })
    .sort((a, b) => b.exposure - a.exposure)
}

function getCommunesForWilaya(features, wilayaCode) {
  return features
    .map((feature) => getProps(feature))
    .filter((row) => normalizeCode(row.wilaya_code) === normalizeCode(wilayaCode))
    .sort((a, b) => (Number(b.total_exposure) || 0) - (Number(a.total_exposure) || 0))
}

function FitToSelection({ selectedWilaya, communes }) {
  const map = useMap()

  useEffect(() => {
    if (!selectedWilaya) {
      map.setView(ALGERIA_CENTER, DEFAULT_ZOOM, { animate: true })
      return
    }

    const bounds = communes
      .map((commune) => [Number(commune.lat), Number(commune.lon)])
      .filter(([lat, lon]) => Number.isFinite(lat) && Number.isFinite(lon))

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 9 })
      return
    }

    if (bounds.length === 1) {
      map.flyTo(bounds[0], 9, { duration: 0.9 })
      return
    }

    map.flyTo([selectedWilaya.lat, selectedWilaya.lon], 7, { duration: 0.9 })
  }, [communes, map, selectedWilaya])

  return null
}

function wilayaRadius(wilaya, maxExposure) {
  const ratio = maxExposure > 0 ? Math.sqrt(wilaya.exposure / maxExposure) : 0
  return 10 + ratio * 22
}

function communeRadius(commune, maxExposure) {
  const exposure = Number(commune.total_exposure) || 0
  const ratio = maxExposure > 0 ? Math.sqrt(exposure / maxExposure) : 0
  return 5 + ratio * 11
}

function normalizeCatboostCommune(item) {
  return {
    ...item,
    commune_name: item.commune_label || item.commune_name,
    lat: Number(item.latitude),
    lon: Number(item.longitude),
    risk_score: Number(item.risk_score) || 0,
    valeur_assuree: Number(item.valeur_assuree) || 0,
    prime_nette: Number(item.prime_nette) || 0,
    low_probability: Number(item.probabilities?.LOW) || 0,
    medium_probability: Number(item.probabilities?.MEDIUM) || 0,
    high_probability: Number(item.probabilities?.HIGH) || 0,
  }
}

function catboostRadius(commune) {
  const score = Number(commune.risk_score) || 0
  return 6 + Math.max(0, Math.min(18, score * 0.22))
}

function aggregateCatboostWilayas(communes) {
  const byWilaya = new Map()

  for (const commune of communes) {
    const code = normalizeCode(commune.wilaya_code)
    if (!code) continue

    const current = byWilaya.get(code) || {
      code,
      name: `Wilaya ${code}`,
      communes: 0,
      totalScore: 0,
      totalValue: 0,
      tierCounts: { LOW: 0, MEDIUM: 0, HIGH: 0 },
      zoneCounts: { '0': 0, I: 0, IIa: 0, IIb: 0, III: 0 },
      points: [],
    }

    current.name = commune.wilaya_name || current.name
    current.communes += 1
    current.totalScore += Number(commune.risk_score) || 0
    current.totalValue += Number(commune.valeur_assuree) || 0
    current.tierCounts[commune.risk_tier] = (current.tierCounts[commune.risk_tier] || 0) + 1
    current.zoneCounts[commune.zone_sismique || '0'] =
      (current.zoneCounts[commune.zone_sismique || '0'] || 0) + 1

    if (Number.isFinite(commune.lat) && Number.isFinite(commune.lon)) {
      current.points.push([commune.lat, commune.lon])
    }

    byWilaya.set(code, current)
  }

  return [...byWilaya.values()].map((wilaya) => {
    const dominantTier = Object.entries(wilaya.tierCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'LOW'
    const dominantZone = Object.entries(wilaya.zoneCounts).sort((a, b) => {
      const diff = b[1] - a[1]
      if (diff !== 0) return diff
      return (ZONE_WEIGHT[b[0]] || 0) - (ZONE_WEIGHT[a[0]] || 0)
    })[0]?.[0] || '0'

    const center =
      wilaya.points.length > 0
        ? [
            wilaya.points.reduce((sum, [lat]) => sum + lat, 0) / wilaya.points.length,
            wilaya.points.reduce((sum, [, lon]) => sum + lon, 0) / wilaya.points.length,
          ]
        : ALGERIA_CENTER

    return {
      ...wilaya,
      dominantTier,
      dominantZone,
      avgRiskScore: wilaya.communes ? wilaya.totalScore / wilaya.communes : 0,
      exposure: wilaya.totalValue,
      lat: center[0],
      lon: center[1],
    }
  })
}

function catboostWilayaRadius(wilaya) {
  const score = Number(wilaya.avgRiskScore) || 0
  return 10 + Math.max(0, Math.min(18, score * 0.12))
}

function LayerButton({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...S.layerButton,
        background: active ? 'rgba(20,184,166,0.12)' : '#ffffff',
        borderColor: active ? 'rgba(20,184,166,0.28)' : '#dbe4f0',
        color: active ? '#0f766e' : '#475569',
      }}
    >
      {label}
    </button>
  )
}

function ZonePill({ zone, count, active, onClick }) {
  const color = ZONE_COLOR[zone] || '#64748b'
  return (
    <button
      onClick={onClick}
      style={{
        ...S.zonePill,
        background: active ? `${color}14` : '#ffffff',
        borderColor: active ? `${color}40` : '#dbe4f0',
        color: active ? color : '#334155',
      }}
    >
      <span style={{ ...S.zoneDot, background: color }} />
      <span>Zone {zone}</span>
      <span style={S.zoneCount}>{count}</span>
    </button>
  )
}

function QuickStat({ icon, label, value, accent }) {
  return (
    <div style={{ ...S.quickStat, borderColor: `${accent}28` }}>
      <div style={{ ...S.quickStatIcon, color: accent }}>{icon}</div>
      <div>
        <div style={S.quickStatLabel}>{label}</div>
        <div style={S.quickStatValue}>{value}</div>
      </div>
    </div>
  )
}

function WilayaPopup({ wilaya }) {
  return (
    <div style={{ minWidth: 220 }}>
      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{wilaya.name}</div>
      <div style={S.popupRow}>
        <span>Zone dominante</span>
        <strong>Zone {wilaya.zone}</strong>
      </div>
      <div style={S.popupRow}>
        <span>Communes</span>
        <strong>{formatInteger(wilaya.communes)}</strong>
      </div>
      <div style={S.popupRow}>
        <span>Polices</span>
        <strong>{formatInteger(wilaya.policies)}</strong>
      </div>
      <div style={S.popupRow}>
        <span>Exposition</span>
        <strong>{formatCompactDzd(wilaya.exposure)}</strong>
      </div>
    </div>
  )
}

function CommunePopup({ commune }) {
  return (
    <div style={{ minWidth: 220 }}>
      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{commune.commune_name}</div>
      <div style={S.popupRow}>
        <span>Zone sismique</span>
        <strong>Zone {commune.zone_sismique || '0'}</strong>
      </div>
      <div style={S.popupRow}>
        <span>Polices</span>
        <strong>{formatInteger(commune.policy_count)}</strong>
      </div>
      <div style={S.popupRow}>
        <span>Exposition</span>
        <strong>{formatCompactDzd(commune.total_exposure)}</strong>
      </div>
      <div style={S.popupRow}>
        <span>Score moyen</span>
        <strong>{Math.round(Number(commune.avg_risk_score) || 0)}/100</strong>
      </div>
    </div>
  )
}

function CatboostCommunePopup({ commune }) {
  const tier = TIER_META[commune.risk_tier] || TIER_META.MEDIUM

  return (
    <div style={{ minWidth: 250 }}>
      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{commune.commune_name}</div>
      <div style={{ ...S.popupTag, background: tier.surface, color: tier.color, borderColor: `${tier.color}33` }}>
        CatBoost · {tier.label}
      </div>
      <div style={S.popupRow}>
        <span>Score risque</span>
        <strong>{commune.risk_score.toFixed(1)}/100</strong>
      </div>
      <div style={S.popupRow}>
        <span>Zone sismique</span>
        <strong>Zone {commune.zone_sismique || '0'}</strong>
      </div>
      <div style={S.popupRow}>
        <span>Capital assuré</span>
        <strong>{formatCompactDzd(commune.valeur_assuree)}</strong>
      </div>
      <div style={S.popupRow}>
        <span>Prime nette</span>
        <strong>{formatCompactDzd(commune.prime_nette)}</strong>
      </div>
      <div style={{ marginTop: 10 }}>
        <div style={S.popupProbabilityLabel}>Probabilités CatBoost</div>
        <div style={S.popupProbabilityGrid}>
          <div style={S.popupProbabilityCard}>
            <span>Low</span>
            <strong>{commune.low_probability.toFixed(1)}%</strong>
          </div>
          <div style={S.popupProbabilityCard}>
            <span>Medium</span>
            <strong>{commune.medium_probability.toFixed(1)}%</strong>
          </div>
          <div style={S.popupProbabilityCard}>
            <span>High</span>
            <strong>{commune.high_probability.toFixed(1)}%</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

function SelectedWilayaPanel({ wilaya, communes, onBack, dataLayer }) {
  const maxValue = Math.max(
    ...communes.map((item) =>
      dataLayer === 'catboost'
        ? Number(item.risk_score) || 0
        : Number(item.total_exposure) || 0
    ),
    1
  )

  return (
    <motion.div
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28 }}
      style={S.sidebarCard}
    >
      <div style={S.selectedHeader}>
        <button onClick={onBack} style={S.backButton}>
          <ArrowLeft size={14} />
          Retour
        </button>
        <div>
          <div style={S.selectedEyebrow}>Drill-down Wilaya</div>
          <div style={S.selectedTitle}>{wilaya.name}</div>
        </div>
      </div>

      <div style={S.selectedSummary}>
        <div style={S.summaryChip}>
          {dataLayer === 'catboost'
            ? `Tier ${TIER_META[wilaya.dominantTier]?.label || 'Moyen'}`
            : `Zone dominante ${wilaya.zone}`}
        </div>
        <div style={S.summaryChip}>{formatInteger(communes.length)} communes</div>
        <div style={S.summaryChip}>
          {dataLayer === 'catboost'
            ? `${(Number(wilaya.avgRiskScore) || 0).toFixed(1)}/100`
            : formatCompactDzd(wilaya.exposure)}
        </div>
      </div>

      <div style={S.communeList}>
        {communes.map((commune) => (
          <div key={commune.commune_code || commune.commune_name} style={S.communeRow}>
            <div
              style={{
                ...S.communeSwatch,
                background:
                  dataLayer === 'catboost'
                    ? (TIER_META[commune.risk_tier] || TIER_META.MEDIUM).color
                    : ZONE_COLOR[commune.zone_sismique || '0'] || '#64748b',
              }}
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={S.communeName}>{commune.commune_name}</div>
              <div style={S.communeMeta}>
                {dataLayer === 'catboost'
                  ? `Zone ${commune.zone_sismique || '0'} · ${(TIER_META[commune.risk_tier] || TIER_META.MEDIUM).label}`
                  : `Zone ${commune.zone_sismique || '0'} · Score ${Math.round(Number(commune.avg_risk_score) || 0)}`}
              </div>
              <div style={S.exposureTrack}>
                <div
                  style={{
                    ...S.exposureFill,
                    width: `${(
                      ((dataLayer === 'catboost'
                        ? Number(commune.risk_score) || 0
                        : Number(commune.total_exposure) || 0) / maxValue) * 100
                    )}%`,
                    background:
                      dataLayer === 'catboost'
                        ? (TIER_META[commune.risk_tier] || TIER_META.MEDIUM).color
                        : ZONE_COLOR[commune.zone_sismique || '0'] || '#64748b',
                  }}
                />
              </div>
            </div>
            <div style={S.communeStats}>
              <div>
                {dataLayer === 'catboost'
                  ? `${(Number(commune.risk_score) || 0).toFixed(1)}/100`
                  : formatInteger(commune.policy_count)}
              </div>
              <div style={S.communeExposure}>
                {dataLayer === 'catboost'
                  ? formatCompactDzd(commune.valeur_assuree)
                  : formatCompactDzd(commune.total_exposure)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default function RiskMapPage() {
  const [features, setFeatures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedZone, setSelectedZone] = useState(null)
  const [selectedWilayaCode, setSelectedWilayaCode] = useState(null)
  const [viewMode, setViewMode] = useState('wilayas')
  const [dataLayer, setDataLayer] = useState('portfolio')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const response = await geoAPI.getMapData('risk')
        if (!cancelled) setFeatures(response.features ?? [])
      } catch (err) {
        if (!cancelled) setError(err.message || 'Erreur de chargement de la carte')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const allWilayas = useMemo(() => aggregateWilayas(features), [features])
  const catboostCommunes = useMemo(
    () => communeCatboostRiskScores.map(normalizeCatboostCommune).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon)),
    []
  )
  const allCatboostWilayas = useMemo(() => aggregateCatboostWilayas(catboostCommunes), [catboostCommunes])
  const visibleWilayas = useMemo(
    () => (selectedZone ? allWilayas.filter((item) => item.zone === selectedZone) : allWilayas),
    [allWilayas, selectedZone]
  )
  const visibleCatboostCommunes = useMemo(
    () => (
      selectedZone
        ? catboostCommunes.filter((item) => (item.zone_sismique || '0') === selectedZone)
        : catboostCommunes
    ),
    [catboostCommunes, selectedZone]
  )
  const visibleCatboostWilayas = useMemo(
    () => (
      selectedZone
        ? allCatboostWilayas.filter((item) => item.dominantZone === selectedZone)
        : allCatboostWilayas
    ),
    [allCatboostWilayas, selectedZone]
  )

  const selectedWilaya = useMemo(
    () => {
      const source = dataLayer === 'catboost' ? allCatboostWilayas : allWilayas
      return source.find((item) => item.code === selectedWilayaCode) || null
    },
    [allCatboostWilayas, allWilayas, dataLayer, selectedWilayaCode]
  )

  const selectedCommunes = useMemo(
    () => {
      if (!selectedWilaya) return []
      if (dataLayer === 'catboost') {
        return visibleCatboostCommunes
          .filter((item) => normalizeCode(item.wilaya_code) === normalizeCode(selectedWilaya.code))
          .sort((a, b) => (Number(b.risk_score) || 0) - (Number(a.risk_score) || 0))
      }

      return getCommunesForWilaya(features, selectedWilaya.code)
    },
    [dataLayer, features, selectedWilaya, visibleCatboostCommunes]
  )

  const zoneCounts = useMemo(() => {
    const source = dataLayer === 'catboost' ? catboostCommunes : allWilayas
    return ['III', 'IIb', 'IIa', 'I', '0'].map((zone) => ({
      zone,
      count: source.filter((item) => (item.zone || item.zone_sismique || item.dominantZone) === zone).length,
    }))
  }, [allWilayas, catboostCommunes, dataLayer])

  const maxWilayaExposure = Math.max(...visibleWilayas.map((item) => item.exposure), 1)
  const maxCommuneExposure = Math.max(...selectedCommunes.map((item) => Number(item.total_exposure) || 0), 1)
  const topCatboostCommunes = useMemo(
    () => [...visibleCatboostCommunes].sort((a, b) => (Number(b.risk_score) || 0) - (Number(a.risk_score) || 0)).slice(0, 12),
    [visibleCatboostCommunes]
  )

  const topRiskWilayas = useMemo(
    () => [...visibleWilayas].sort((a, b) => (ZONE_WEIGHT[b.zone] || 0) - (ZONE_WEIGHT[a.zone] || 0) || b.exposure - a.exposure),
    [visibleWilayas]
  )

  const handleWilayaSelect = useCallback((wilaya) => {
    setSelectedWilayaCode(wilaya.code)
    setViewMode('communes')
  }, [])

  const catboostStats = useMemo(() => {
    const highCount = visibleCatboostCommunes.filter((item) => item.risk_tier === 'HIGH').length
    const avgScore =
      visibleCatboostCommunes.length > 0
        ? visibleCatboostCommunes.reduce((sum, item) => sum + (Number(item.risk_score) || 0), 0) / visibleCatboostCommunes.length
        : 0
    const maxScore = topCatboostCommunes[0]?.risk_score ?? 0

    return { highCount, avgScore, maxScore }
  }, [topCatboostCommunes, visibleCatboostCommunes])

  if (loading) {
    return (
      <main style={S.centerState}>
        <LoadingSpinner size={34} color="#22c55e" />
      </main>
    )
  }

  if (error) {
    return (
      <main style={S.centerState}>
        <div style={S.errorBox}>{error}</div>
      </main>
    )
  }

  return (
    <main style={S.page}>
      <div style={S.hero}>
        <div style={S.heroMain}>
          <div style={S.heroEyebrow}>Risk Cartography</div>
          <h1 style={S.heroTitle}>Carte des risques</h1>
          <div style={S.heroText}>
            {dataLayer === 'catboost'
              ? 'Couche IA CatBoost par commune avec lecture du score, du tier et des probabilités.'
              : 'Wilayas en vue globale, communes en drill-down direct.'}
          </div>
        </div>
        <div style={S.heroStats}>
          <QuickStat
            icon={dataLayer === 'catboost' ? <BrainCircuit size={14} /> : <Building2 size={14} />}
            label={dataLayer === 'catboost' ? 'Communes scorées' : 'Wilayas'}
            value={formatInteger(dataLayer === 'catboost' ? visibleCatboostCommunes.length : allWilayas.length)}
            accent={dataLayer === 'catboost' ? '#7c3aed' : '#38bdf8'}
          />
          <QuickStat
            icon={dataLayer === 'catboost' ? <TrendingUp size={14} /> : <MapPin size={14} />}
            label={dataLayer === 'catboost' ? 'Score moyen' : 'Communes'}
            value={dataLayer === 'catboost' ? `${catboostStats.avgScore.toFixed(1)}/100` : formatInteger(features.length)}
            accent={dataLayer === 'catboost' ? '#dc2626' : '#22c55e'}
          />
          <QuickStat
            icon={<ShieldAlert size={14} />}
            label={dataLayer === 'catboost' ? 'Tiers élevés' : 'Dominante'}
            value={
              dataLayer === 'catboost'
                ? formatInteger(catboostStats.highCount)
                : `Zone ${zoneCounts.sort((a, b) => b.count - a.count)[0]?.zone || '0'}`
            }
            accent="#f59e0b"
          />
        </div>
        <div style={S.heroActions}>
          <div style={S.layerSwitch}>
            <button
              onClick={() => {
                setDataLayer('portfolio')
                setSelectedWilayaCode(null)
                setViewMode('wilayas')
              }}
              style={{
                ...S.layerSwitchButton,
                ...(dataLayer === 'portfolio' ? S.layerSwitchButtonActive : {}),
              }}
            >
              <Layers3 size={14} />
              <span>Portefeuille</span>
            </button>
            <button
              onClick={() => {
                setDataLayer('catboost')
                setSelectedWilayaCode(null)
                setViewMode('wilayas')
              }}
              style={{
                ...S.layerSwitchButton,
                ...(dataLayer === 'catboost' ? S.catboostSwitchButtonActive : {}),
              }}
            >
              <BrainCircuit size={14} />
              <span>CatBoost IA</span>
            </button>
          </div>
          <div style={S.modeGroup}>
            <LayerButton active={viewMode === 'wilayas'} label="Vue wilayas" onClick={() => setViewMode('wilayas')} />
            <LayerButton active={viewMode === 'communes'} label="Vue communes" onClick={() => selectedWilaya && setViewMode('communes')} />
          </div>
        </div>
      </div>

      <div style={S.layout}>
        <section style={S.mapSection}>
          <div style={S.floatingPanel}>
            <div style={S.panelTitle}>
              {dataLayer === 'catboost' ? <BrainCircuit size={14} /> : <Layers3 size={14} />}
              <span>{dataLayer === 'catboost' ? 'Couche CatBoost' : 'Filtre zone'}</span>
            </div>
            {dataLayer === 'catboost' && (
              <div style={S.catboostLegend}>
                {Object.entries(TIER_META).map(([tier, meta]) => (
                  <div key={tier} style={S.legendRow}>
                    <span style={{ ...S.legendDot, background: meta.color }} />
                    <span>{meta.label}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={S.zoneGrid}>
              {zoneCounts.map(({ zone, count }) => (
                <ZonePill
                  key={zone}
                  zone={zone}
                  count={count}
                  active={selectedZone === zone}
                  onClick={() => setSelectedZone(selectedZone === zone ? null : zone)}
                />
              ))}
            </div>
          </div>

          <div style={S.floatingFoot}>
            <Filter size={13} />
            <span>
              {selectedWilaya
                ? `${selectedWilaya.name} · ${selectedCommunes.length} communes`
                : dataLayer === 'catboost'
                  ? `${visibleCatboostCommunes.length} communes IA visibles`
                  : `${visibleWilayas.length} wilayas visibles`}
            </span>
          </div>

          <MapContainer
            center={ALGERIA_CENTER}
            zoom={DEFAULT_ZOOM}
            minZoom={5}
            maxBounds={ALGERIA_BOUNDS}
            maxBoundsViscosity={1}
            zoomControl={false}
            style={{ width: '100%', height: '100%', background: '#dfeaf6' }}
          >
            <FitToSelection selectedWilaya={viewMode === 'communes' ? selectedWilaya : null} communes={selectedCommunes} />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />
            <ZoomControl position="bottomright" />

            {dataLayer === 'portfolio' &&
              (viewMode === 'wilayas' || !selectedWilaya) &&
              visibleWilayas.map((wilaya) => (
                <CircleMarker
                  key={wilaya.code}
                  center={[wilaya.lat, wilaya.lon]}
                  radius={wilayaRadius(wilaya, maxWilayaExposure)}
                  pathOptions={{
                    color: ZONE_COLOR[wilaya.zone] || '#94a3b8',
                    fillColor: ZONE_COLOR[wilaya.zone] || '#94a3b8',
                    fillOpacity: 0.28,
                    weight: 2,
                  }}
                  eventHandlers={{ click: () => handleWilayaSelect(wilaya) }}
                >
                  <Popup maxWidth={260}>
                    <WilayaPopup wilaya={wilaya} />
                  </Popup>
                </CircleMarker>
              ))}

            {dataLayer === 'portfolio' &&
              selectedWilaya &&
              viewMode === 'communes' &&
              selectedCommunes.map((commune) => {
                const lat = Number(commune.lat)
                const lon = Number(commune.lon)
                if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null

                return (
                  <CircleMarker
                    key={commune.commune_code || commune.commune_name}
                    center={[lat, lon]}
                    radius={communeRadius(commune, maxCommuneExposure)}
                    pathOptions={{
                      color: ZONE_COLOR[commune.zone_sismique || '0'] || '#94a3b8',
                      fillColor: ZONE_COLOR[commune.zone_sismique || '0'] || '#94a3b8',
                      fillOpacity: 0.72,
                      weight: 1.5,
                    }}
                  >
                    <Popup maxWidth={260}>
                      <CommunePopup commune={commune} />
                    </Popup>
                  </CircleMarker>
                )
              })}

            {dataLayer === 'catboost' &&
              viewMode === 'wilayas' &&
              visibleCatboostWilayas.map((wilaya) => {
                const tier = TIER_META[wilaya.dominantTier] || TIER_META.MEDIUM

                return (
                  <CircleMarker
                    key={`catboost-${wilaya.code}`}
                    center={[wilaya.lat, wilaya.lon]}
                    radius={catboostWilayaRadius(wilaya)}
                    pathOptions={{
                      color: tier.color,
                      fillColor: tier.color,
                      fillOpacity: 0.24,
                      weight: 2,
                    }}
                    eventHandlers={{ click: () => handleWilayaSelect(wilaya) }}
                  >
                    <Popup maxWidth={260}>
                      <div style={{ minWidth: 220 }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{wilaya.name}</div>
                        <div style={S.popupRow}>
                          <span>CatBoost moyen</span>
                          <strong>{wilaya.avgRiskScore.toFixed(1)}/100</strong>
                        </div>
                        <div style={S.popupRow}>
                          <span>Tier dominant</span>
                          <strong style={{ color: tier.color }}>{tier.label}</strong>
                        </div>
                        <div style={S.popupRow}>
                          <span>Communes scorées</span>
                          <strong>{formatInteger(wilaya.communes)}</strong>
                        </div>
                        <div style={S.popupRow}>
                          <span>Capital assuré</span>
                          <strong>{formatCompactDzd(wilaya.exposure)}</strong>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                )
              })}

            {dataLayer === 'catboost' &&
              viewMode === 'communes' &&
              selectedCommunes.map((commune) => {
                const tier = TIER_META[commune.risk_tier] || TIER_META.MEDIUM

                return (
                  <CircleMarker
                    key={`catboost-${commune.commune_code || commune.commune_name}`}
                    center={[commune.lat, commune.lon]}
                    radius={catboostRadius(commune)}
                    pathOptions={{
                      color: tier.color,
                      fillColor: tier.color,
                      fillOpacity: 0.72,
                      weight: 1.8,
                    }}
                  >
                    <Popup maxWidth={280}>
                      <CatboostCommunePopup commune={commune} />
                    </Popup>
                  </CircleMarker>
                )
              })}

            {dataLayer === 'catboost' &&
              !selectedWilaya &&
              viewMode !== 'wilayas' &&
              visibleCatboostCommunes.map((commune) => {
                const tier = TIER_META[commune.risk_tier] || TIER_META.MEDIUM

                return (
                  <CircleMarker
                    key={`catboost-all-${commune.commune_code}`}
                    center={[commune.lat, commune.lon]}
                    radius={catboostRadius(commune)}
                    pathOptions={{
                      color: tier.color,
                      fillColor: tier.color,
                      fillOpacity: 0.6,
                      weight: 1.4,
                    }}
                  >
                    <Popup maxWidth={280}>
                      <CatboostCommunePopup commune={commune} />
                    </Popup>
                  </CircleMarker>
                )
              })}
          </MapContainer>
        </section>

        <aside style={S.sidebar}>
          {selectedWilaya && viewMode === 'communes' ? (
            <SelectedWilayaPanel
              wilaya={selectedWilaya}
              communes={selectedCommunes}
              dataLayer={dataLayer}
              onBack={() => {
                setSelectedWilayaCode(null)
                setViewMode('wilayas')
              }}
            />
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
                style={S.sidebarCard}
              >
                <div style={S.cardEyebrow}>{dataLayer === 'catboost' ? 'Hotspot CatBoost' : 'Hotspot wilayas'}</div>
                <div style={S.cardTitle}>{dataLayer === 'catboost' ? 'Communes à surveiller' : 'Priorité de lecture'}</div>
                <div style={S.riskList}>
                  {dataLayer === 'catboost'
                    ? topCatboostCommunes.map((commune, index) => {
                        const tier = TIER_META[commune.risk_tier] || TIER_META.MEDIUM

                        return (
                          <button
                            key={`${commune.commune_code}-${index}`}
                            onClick={() => {
                              setSelectedWilayaCode(normalizeCode(commune.wilaya_code))
                              setViewMode('communes')
                            }}
                            style={S.riskRow}
                          >
                            <div style={{ ...S.rankBadge, background: tier.surface, color: tier.color }}>{index + 1}</div>
                            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                              <div style={S.riskRowTitle}>{commune.commune_name}</div>
                              <div style={S.riskRowMeta}>
                                Zone {commune.zone_sismique || '0'} · {tier.label}
                              </div>
                            </div>
                            <div style={S.riskRowValue}>{commune.risk_score.toFixed(1)}/100</div>
                          </button>
                        )
                      })
                    : topRiskWilayas.map((wilaya, index) => (
                        <button
                          key={wilaya.code}
                          onClick={() => handleWilayaSelect(wilaya)}
                          style={S.riskRow}
                        >
                          <div style={S.rankBadge}>{index + 1}</div>
                          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                            <div style={S.riskRowTitle}>{wilaya.name}</div>
                            <div style={S.riskRowMeta}>
                              Zone {wilaya.zone} · {formatInteger(wilaya.communes)} communes
                            </div>
                          </div>
                          <div style={S.riskRowValue}>{formatCompactDzd(wilaya.exposure)}</div>
                        </button>
                      ))}
                </div>
              </motion.div>
            </>
          )}
        </aside>
      </div>
    </main>
  )
}

const S = {
  page: {
    flex: 1,
    height: 'calc(100vh - var(--topbar-h))',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: '12px 14px 14px',
    overflow: 'hidden',
    overflowX: 'hidden',
    background:
      'linear-gradient(180deg, #f8fbff 0%, #f3f7fb 100%)',
  },
  hero: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '12px 14px',
    borderRadius: 18,
    flexWrap: 'nowrap',
    background: 'linear-gradient(135deg, #ffffff, #f7fbff)',
    border: '1px solid #dbe4f0',
    boxShadow: '0 10px 24px rgba(15,23,42,0.05)',
    flexShrink: 0,
  },
  heroMain: {
    minWidth: 0,
  },
  heroEyebrow: {
    fontSize: '0.62rem',
    textTransform: 'uppercase',
    letterSpacing: '0.16em',
    color: '#0891b2',
    fontWeight: 700,
    marginBottom: 4,
  },
  heroTitle: {
    margin: 0,
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '1.35rem',
    lineHeight: 1,
    color: '#0f172a',
  },
  heroText: {
    margin: '6px 0 0',
    maxWidth: 360,
    fontSize: '0.76rem',
    lineHeight: 1.3,
    color: '#475569',
  },
  heroStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(110px, 1fr))',
    gap: 8,
    flex: 1,
    maxWidth: 430,
  },
  quickStat: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
    padding: '8px 10px',
    borderRadius: 14,
    border: '1px solid',
    background: '#ffffff',
  },
  quickStatIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f8fafc',
    flexShrink: 0,
  },
  quickStatLabel: {
    fontSize: '0.64rem',
    color: '#64748b',
    fontWeight: 600,
    lineHeight: 1.1,
  },
  quickStatValue: {
    fontSize: '0.88rem',
    color: '#0f172a',
    fontWeight: 800,
    marginTop: 2,
    whiteSpace: 'nowrap',
  },
  heroActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  layerSwitch: {
    display: 'flex',
    gap: 6,
    padding: 4,
    borderRadius: 999,
    background: '#eef4fb',
    border: '1px solid #dbe4f0',
  },
  layerSwitchButton: {
    border: '1px solid transparent',
    background: 'transparent',
    color: '#475569',
    borderRadius: 999,
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '0.72rem',
    transition: 'all 0.18s ease',
  },
  layerSwitchButtonActive: {
    background: '#ffffff',
    color: '#0f766e',
    borderColor: 'rgba(15,118,110,0.18)',
    boxShadow: '0 6px 16px rgba(15,23,42,0.06)',
  },
  catboostSwitchButtonActive: {
    background: 'linear-gradient(135deg, #f5f3ff, #eef2ff)',
    color: '#6d28d9',
    borderColor: 'rgba(109,40,217,0.16)',
    boxShadow: '0 8px 18px rgba(109,40,217,0.12)',
  },
  modeGroup: {
    display: 'flex',
    gap: 6,
  },
  layerButton: {
    border: '1px solid',
    borderRadius: 999,
    padding: '8px 12px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.72rem',
    transition: 'all 0.18s ease',
    boxShadow: '0 2px 10px rgba(15,23,42,0.03)',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 320px',
    gap: 12,
    alignItems: 'stretch',
    minHeight: 0,
    flex: 1,
  },
  mapSection: {
    position: 'relative',
    borderRadius: 22,
    overflow: 'hidden',
    minHeight: 0,
    height: '100%',
    background: '#ffffff',
    border: '1px solid #dbe4f0',
    boxShadow: '0 20px 50px rgba(15,23,42,0.08)',
  },
  floatingPanel: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 900,
    width: 240,
    padding: '10px 10px 9px',
    borderRadius: 14,
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(10px)',
    border: '1px solid #dbe4f0',
    boxShadow: '0 14px 26px rgba(15,23,42,0.08)',
  },
  panelTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#0f172a',
    fontWeight: 700,
    fontSize: '0.72rem',
    marginBottom: 8,
  },
  zoneGrid: {
    display: 'grid',
    gap: 6,
  },
  catboostLegend: {
    display: 'grid',
    gap: 6,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottom: '1px solid #edf2f7',
  },
  legendRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: '0.68rem',
    color: '#475569',
    fontWeight: 600,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  zonePill: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    border: '1px solid',
    borderRadius: 12,
    padding: '7px 9px',
    cursor: 'pointer',
    fontSize: '0.68rem',
    fontWeight: 600,
    boxShadow: '0 4px 12px rgba(15,23,42,0.03)',
  },
  zoneDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  zoneCount: {
    marginLeft: 'auto',
    color: '#64748b',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.68rem',
  },
  floatingFoot: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    zIndex: 900,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(10px)',
    border: '1px solid #dbe4f0',
    color: '#334155',
    fontWeight: 600,
    fontSize: '0.7rem',
    boxShadow: '0 12px 24px rgba(15,23,42,0.08)',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    minHeight: 0,
  },
  sidebarCard: {
    borderRadius: 18,
    background: 'linear-gradient(180deg, #ffffff, #f8fbff)',
    border: '1px solid #dbe4f0',
    padding: 14,
    boxShadow: '0 12px 28px rgba(15,23,42,0.05)',
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  cardEyebrow: {
    fontSize: '0.64rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#0891b2',
    fontWeight: 700,
    marginBottom: 6,
  },
  cardTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    color: '#0f172a',
    fontSize: '0.92rem',
    fontWeight: 700,
    marginBottom: 10,
  },
  riskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    overflowY: 'auto',
  },
  riskRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    textAlign: 'left',
    padding: '10px 10px',
    borderRadius: 14,
    border: '1px solid #e2e8f0',
    background: '#ffffff',
    cursor: 'pointer',
    color: 'inherit',
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 999,
    background: 'rgba(34,197,94,0.14)',
    color: '#86efac',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: '0.68rem',
    flexShrink: 0,
  },
  riskRowTitle: {
    color: '#0f172a',
    fontWeight: 700,
    fontSize: '0.76rem',
  },
  riskRowMeta: {
    color: '#64748b',
    fontSize: '0.66rem',
    marginTop: 2,
  },
  riskRowValue: {
    color: '#334155',
    fontSize: '0.68rem',
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
  },
  selectedHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  selectedEyebrow: {
    fontSize: '0.62rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#0891b2',
    fontWeight: 700,
    marginBottom: 5,
  },
  selectedTitle: {
    color: '#0f172a',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: '0.94rem',
  },
  backButton: {
    border: '1px solid #dbe4f0',
    background: '#ffffff',
    color: '#334155',
    borderRadius: 999,
    padding: '7px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '0.68rem',
  },
  selectedSummary: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  summaryChip: {
    padding: '6px 8px',
    borderRadius: 999,
    background: '#f8fafc',
    border: '1px solid #dbe4f0',
    color: '#334155',
    fontSize: '0.66rem',
    fontWeight: 600,
  },
  communeList: {
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    paddingRight: 2,
  },
  communeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    padding: '10px 10px',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
  },
  communeSwatch: {
    width: 10,
    height: 38,
    borderRadius: 999,
    flexShrink: 0,
  },
  communeName: {
    color: '#0f172a',
    fontWeight: 700,
    fontSize: '0.74rem',
    marginBottom: 3,
  },
  communeMeta: {
    color: '#64748b',
    fontSize: '0.62rem',
    marginBottom: 6,
  },
  exposureTrack: {
    height: 5,
    borderRadius: 999,
    background: '#e2e8f0',
    overflow: 'hidden',
  },
  exposureFill: {
    height: '100%',
    borderRadius: 999,
  },
  communeStats: {
    minWidth: 70,
    textAlign: 'right',
    color: '#0f172a',
    fontWeight: 700,
    fontSize: '0.68rem',
    fontFamily: "'JetBrains Mono', monospace",
  },
  communeExposure: {
    color: '#64748b',
    fontSize: '0.58rem',
    marginTop: 3,
  },
  popupRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    fontSize: '0.74rem',
    marginBottom: 5,
    color: '#334155',
  },
  popupTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    border: '1px solid',
    padding: '5px 9px',
    fontSize: '0.66rem',
    fontWeight: 700,
    marginBottom: 10,
  },
  popupProbabilityLabel: {
    fontSize: '0.66rem',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: '#94a3b8',
    fontWeight: 700,
    marginBottom: 6,
  },
  popupProbabilityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 6,
  },
  popupProbabilityCard: {
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    padding: '7px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    fontSize: '0.66rem',
    color: '#64748b',
  },
  centerState: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    padding: '14px 16px',
    borderRadius: 16,
    color: '#fecaca',
    background: 'rgba(127,29,29,0.25)',
    border: '1px solid rgba(248,113,113,0.2)',
  },
}
