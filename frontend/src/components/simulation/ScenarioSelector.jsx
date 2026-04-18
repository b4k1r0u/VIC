/**
 * @fileoverview ScenarioSelector — premium control surface for Monte Carlo setup.
 */
import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Crosshair,
  Mountain,
  Radar,
  Sparkles,
} from 'lucide-react'
import { useSimulation } from '../../hooks/useSimulation'
import { SCENARIOS } from '../../types/simulation'
import { geoAPI } from '../../api/geo'
import communeCatboostRiskScores from '../../../commune_catboost_risk_scores.json'

function communeOptionValue(commune) {
  if (commune?.id != null && commune.id !== '') return `commune:${commune.id}`
  if (commune?.wilaya_code) return `wilaya:${commune.wilaya_code}`
  return ''
}

function isFallbackCommuneSelection(value) {
  return typeof value === 'string' && value.startsWith('wilaya:')
}

function scenarioPresets() {
  return [
    {
      id: 'boumerdes_2003',
      icon: Radar,
      accent: '#ef4444',
      surface: 'linear-gradient(135deg, rgba(254,242,242,0.95), rgba(255,255,255,0.98))',
      note: 'Coastal shock with heavy insured concentration around Algiers.',
      chips: ['Mitidja', 'Zone III', 'Stress test'],
    },
    {
      id: 'el_asnam_1980',
      icon: Mountain,
      accent: '#f59e0b',
      surface: 'linear-gradient(135deg, rgba(255,247,237,0.96), rgba(255,255,255,0.98))',
      note: 'Extreme earthquake on the western corridor with multi-wilaya spread.',
      chips: ['Chlef', 'Magnitude 7+', 'Queue lourde'],
    },
    {
      id: 'custom',
      icon: Crosshair,
      accent: '#2563eb',
      surface: 'linear-gradient(135deg, rgba(239,246,255,0.96), rgba(255,255,255,0.98))',
      note: 'Build a custom event for a targeted portfolio review.',
      chips: ['Libre', 'Épicentre manuel', 'What-if'],
    },
  ]
}

const SCOPE_META = {
  national: {
    label: 'Mondial',
    shortLabel: 'Mondial',
    hint: 'Stress test across the full Algerian portfolio.',
    tone: '#2563eb',
  },
  wilaya: {
    label: 'Wilaya',
    shortLabel: 'Wilaya',
    hint: 'Analyze a regional pocket before rebalancing or transfer.',
    tone: '#0f766e',
  },
  commune: {
    label: 'Commune',
    shortLabel: 'Commune',
    hint: 'Zoom in on a very specific urban cluster.',
    tone: '#b45309',
  },
}

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizePlaceRow(item) {
  return {
    commune_name: item.commune_label || item.commune_name || '',
    wilaya_code: String(item.wilaya_code ?? '').padStart(2, '0'),
    lat: Number(item.latitude),
    lon: Number(item.longitude),
  }
}

const PLACE_ROWS = communeCatboostRiskScores
  .map(normalizePlaceRow)
  .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon) && item.commune_name)

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function findNearestPlace(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null

  let best = null
  let bestDistance = Infinity

  for (const item of PLACE_ROWS) {
    const distance = haversineKm(lat, lon, item.lat, item.lon)
    if (distance < bestDistance) {
      best = item
      bestDistance = distance
    }
  }

  return best
    ? {
        ...best,
        distanceKm: bestDistance,
      }
    : null
}

function Field({ label, helper, children }) {
  return (
    <div style={styles.field}>
      <div style={styles.fieldHead}>
        <label style={styles.fieldLabel}>{label}</label>
        {helper ? <span style={styles.fieldHelper}>{helper}</span> : null}
      </div>
      {children}
    </div>
  )
}

export default function ScenarioSelector() {
  const {
    scenario,
    setScenario,
    targetScope,
    setTargetScope,
    customParams,
    setCustomParams,
    isRunning,
    error,
    run,
  } = useSimulation()

  const [wilayas, setWilayas] = useState([])
  const [communes, setCommunes] = useState([])
  const [wilayaCode, setWilayaCode] = useState('')
  const [communeCode, setCommuneCode] = useState('')
  const [customWilayaCode, setCustomWilayaCode] = useState('')
  const [customCommuneName, setCustomCommuneName] = useState('')

  useEffect(() => {
    geoAPI.getWilayas().then(setWilayas).catch(() => {})
  }, [])

  useEffect(() => {
    if (scenario !== 'custom') return
    if (
      Number.isFinite(Number(customParams?.epicenter_lat)) &&
      Number.isFinite(Number(customParams?.epicenter_lon)) &&
      Number.isFinite(Number(customParams?.magnitude))
    ) {
      return
    }

    setCustomParams({
      epicenter_lat: SCENARIOS.boumerdes_2003.epicenter[0],
      epicenter_lon: SCENARIOS.boumerdes_2003.epicenter[1],
      magnitude: SCENARIOS.boumerdes_2003.magnitude,
    })
  }, [customParams, scenario, setCustomParams])

  useEffect(() => {
    if (scenario !== 'custom') return
    const currentPlace = findNearestPlace(
      Number(customParams?.epicenter_lat),
      Number(customParams?.epicenter_lon)
    )
    if (!currentPlace) return

    setCustomWilayaCode((current) => current || currentPlace.wilaya_code)
    setCustomCommuneName((current) => current || currentPlace.commune_name)
  }, [customParams?.epicenter_lat, customParams?.epicenter_lon, scenario])

  useEffect(() => {
    if (targetScope !== 'commune') {
      setCommunes([])
      setCommuneCode('')
      return
    }

    const request = wilayaCode
      ? geoAPI.getCommunes({ wilaya_code: wilayaCode })
      : geoAPI.getCommunes()

    request.then((rows) => setCommunes(rows ?? [])).catch(() => setCommunes([]))
  }, [targetScope, wilayaCode])

  useEffect(() => {
    if (!communeCode) return
    const exists = communes.some((commune) => communeOptionValue(commune) === String(communeCode))
    if (!exists) {
      setCommuneCode('')
      if (targetScope === 'commune') setTargetScope('commune', null)
    }
  }, [communeCode, communes, setTargetScope, targetScope])

  const scenarioCards = useMemo(
    () =>
      scenarioPresets().map((item) => ({
        ...item,
        meta: SCENARIOS[item.id],
      })),
    []
  )

  const activeScenario = useMemo(
    () => scenarioCards.find((item) => item.id === scenario) ?? scenarioCards[0],
    [scenario, scenarioCards]
  )

  const customCommuneOptions = useMemo(
    () =>
      PLACE_ROWS
        .filter((item) => !customWilayaCode || item.wilaya_code === customWilayaCode)
        .sort((a, b) => a.commune_name.localeCompare(b.commune_name, 'fr')),
    [customWilayaCode]
  )

  const epicenterPlace = useMemo(() => {
    if (scenario === 'custom' && customCommuneName) {
      return (
        customCommuneOptions.find((item) => item.commune_name === customCommuneName) ??
        PLACE_ROWS.find(
          (item) =>
            item.commune_name === customCommuneName &&
            (!customWilayaCode || item.wilaya_code === customWilayaCode)
        ) ??
        null
      )
    }

    const lat = activeScenario.meta ? Number(activeScenario.meta.epicenter[0]) : toNumber(customParams?.epicenter_lat)
    const lon = activeScenario.meta ? Number(activeScenario.meta.epicenter[1]) : toNumber(customParams?.epicenter_lon)
    return findNearestPlace(lat, lon)
  }, [activeScenario.meta, customCommuneName, customCommuneOptions, customParams?.epicenter_lat, customParams?.epicenter_lon, customWilayaCode, scenario])

  const readiness = useMemo(() => {
    if (scenario === 'custom') {
      const placeReady =
        Boolean(customWilayaCode) &&
        Boolean(customCommuneName) &&
        Number.isFinite(Number(customParams?.epicenter_lat)) &&
        Number.isFinite(Number(customParams?.epicenter_lon))
      const magnitudeReady =
        customParams?.magnitude != null &&
        customParams?.magnitude !== '' &&
        Number.isFinite(Number(customParams.magnitude))

      if (!placeReady) {
        return { ready: false, message: 'Select the wilaya and commune of the epicenter first.' }
      }

      if (!magnitudeReady) {
        return { ready: false, message: 'Enter the magnitude before launch.' }
      }
    }

    if (targetScope === 'national') return { ready: true, message: 'Ready to run the Monte Carlo engine.' }
    if (targetScope === 'wilaya') {
      return wilayaCode
        ? { ready: true, message: `Scope locked to wilaya ${wilayaCode}.` }
        : { ready: false, message: 'Select a wilaya before launch.' }
    }
    if (targetScope === 'commune') {
      return communeCode
        ? { ready: true, message: 'Stress-test commune selected.' }
        : { ready: false, message: 'Choose a commune for a micro-local scenario.' }
    }
    return { ready: false, message: '' }
  }, [communeCode, customCommuneName, customParams?.epicenter_lat, customParams?.epicenter_lon, customParams?.magnitude, customWilayaCode, scenario, targetScope, wilayaCode])

  const fallbackCommuneNote = useMemo(() => {
    if (targetScope !== 'commune') return null
    if (!isFallbackCommuneSelection(communeCode)) return null
    const fallbackWilayaCode = communeCode.replace('wilaya:', '')
    return `Commune-level granularity is not available for this record. The calculation will automatically fall back to wilaya level (${fallbackWilayaCode}).`
  }, [communeCode, targetScope])

  const handleScenarioChange = (nextScenario) => {
    setScenario(nextScenario)
    if (nextScenario === 'custom' && !customParams) {
      setCustomParams({
        epicenter_lat: SCENARIOS.boumerdes_2003.epicenter[0],
        epicenter_lon: SCENARIOS.boumerdes_2003.epicenter[1],
        magnitude: SCENARIOS.boumerdes_2003.magnitude,
      })
    }
  }

  const handleCustomPlaceChange = (nextWilayaCode, nextCommuneName) => {
    setCustomWilayaCode(nextWilayaCode)
    setCustomCommuneName(nextCommuneName)

    const nextPlace = PLACE_ROWS.find(
      (item) => item.wilaya_code === nextWilayaCode && item.commune_name === nextCommuneName
    )

    setCustomParams({
      ...(customParams ?? {}),
      epicenter_lat: nextPlace?.lat ?? '',
      epicenter_lon: nextPlace?.lon ?? '',
      magnitude:
        customParams?.magnitude != null && customParams?.magnitude !== ''
          ? Number(customParams.magnitude)
          : SCENARIOS.boumerdes_2003.magnitude,
    })
  }

  const handleScopeChange = (scope) => {
    if (scope === 'wilaya') {
      setTargetScope(scope, wilayaCode || null)
      return
    }

    if (scope === 'commune') {
      setTargetScope(scope, communeCode || null)
      return
    }

    setTargetScope(scope, null)
  }

  return (
    <div style={styles.root}>
      <div style={styles.hero}>
        <div style={styles.heroBadge}>
          <Sparkles size={12} />
          <span>Guided simulation</span>
        </div>
        <div style={styles.heroTitle}>Build a credible seismic scenario and run the model.</div>
        <div style={styles.heroText}>
          The engine combines intensity, structural vulnerability, and Monte Carlo losses to produce
          an actionable portfolio view.
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Scenario selection</div>
        <div style={styles.scenarioGrid}>
          {scenarioCards.map((item) => {
            const Icon = item.icon
            const selected = item.id === scenario
            const meta = item.meta

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleScenarioChange(item.id)}
                disabled={isRunning}
                style={{
                  ...styles.scenarioCard,
                  background: item.surface,
                  borderColor: selected ? item.accent : '#dbe4f0',
                  boxShadow: selected ? `0 18px 40px ${item.accent}1f` : 'none',
                }}
              >
                <div style={styles.scenarioHead}>
                  <div style={{ ...styles.scenarioIcon, background: `${item.accent}15`, color: item.accent }}>
                    <Icon size={16} />
                  </div>
                  <div style={{ ...styles.selectionDot, background: selected ? item.accent : '#cbd5e1' }} />
                </div>
                <div style={styles.scenarioLabel}>
                  {meta?.label ?? 'Custom scenario'}
                </div>
                <div style={styles.scenarioNote}>{item.note}</div>
                <div style={styles.chipRow}>
                  {item.chips.map((chip) => (
                    <span key={chip} style={styles.scenarioChip}>{chip}</span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ ...styles.activeScenarioPanel, borderColor: `${activeScenario.accent}30` }}>
        <div style={styles.activeScenarioHeader}>
          <div>
          <div style={styles.activeScenarioEyebrow}>Loaded event</div>
            <div style={styles.activeScenarioName}>{activeScenario.meta?.label ?? 'Custom scenario'}</div>
          </div>
          <div style={{ ...styles.activeScenarioBadge, color: activeScenario.accent, background: `${activeScenario.accent}12` }}>
            Magnitude {activeScenario.meta?.magnitude ?? (customParams?.magnitude != null && customParams?.magnitude !== '' ? Number(customParams.magnitude).toFixed(1) : '—')}
          </div>
        </div>

        <div style={styles.detailGrid}>
          <div style={styles.detailItem}>
            <span style={styles.detailKey}>Location</span>
            <strong style={styles.detailValue}>
              {epicenterPlace
                ? `${epicenterPlace.commune_name} · Wilaya ${epicenterPlace.wilaya_code}`
                : 'Location pending'}
            </strong>
            <span style={styles.detailSubValue}>
              {scenario === 'custom'
                ? 'Epicenter positioned directly on the selected place.'
                : 'Calibrated historical epicenter.'}
            </span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailKey}>Impacted wilayas</span>
            <strong style={styles.detailValue}>
              {activeScenario.meta?.affected_wilayas?.length ?? 'Libre'}
            </strong>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailKey}>Mode</span>
            <strong style={styles.detailValue}>{scenario === 'custom' ? 'Custom' : 'Calibrated historical'}</strong>
          </div>
        </div>
      </div>

      {scenario === 'custom' && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Custom parameters</div>
          <div style={styles.customGrid}>
            <Field label="Wilaya" helper="Epicenter location">
              <select
                value={customWilayaCode}
                onChange={(e) => handleCustomPlaceChange(e.target.value, '')}
                disabled={isRunning}
              >
                <option value="">Select a wilaya</option>
                {wilayas.map((wilaya) => (
                  <option key={wilaya.code} value={wilaya.code}>
                    {wilaya.code} · {wilaya.name || wilaya.name_fr}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Commune" helper="Exact location">
              <select
                value={customCommuneName}
                onChange={(e) => handleCustomPlaceChange(customWilayaCode, e.target.value)}
                disabled={isRunning || !customWilayaCode}
              >
                <option value="">Select a commune</option>
                {customCommuneOptions.map((commune) => (
                  <option
                    key={`${commune.wilaya_code}-${commune.commune_name}`}
                    value={commune.commune_name}
                  >
                    {commune.commune_name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Magnitude" helper="Earthquake strength">
              <input
                type="number"
                step="0.1"
                min="4"
                max="9"
                value={customParams?.magnitude ?? ''}
                placeholder="6.5"
                onChange={(e) => {
                  setCustomParams({
                    ...(customParams ?? {}),
                    epicenter_lat: customParams?.epicenter_lat ?? '',
                    epicenter_lon: customParams?.epicenter_lon ?? '',
                    magnitude: e.target.value === '' ? '' : Number(e.target.value),
                  })
                }}
                disabled={isRunning}
              />
            </Field>
          </div>
          <div style={styles.placeCard}>
            <div style={styles.placeCardLabel}>Selected location</div>
            <div style={styles.placeCardValue}>
              {epicenterPlace
                ? `${epicenterPlace.commune_name} · Wilaya ${epicenterPlace.wilaya_code}`
                : 'Select a wilaya and a commune'}
            </div>
            <div style={styles.placeCardNote}>
              {epicenterPlace
                ? `The engine automatically uses this commune's coordinates with a default magnitude of ${Number(customParams?.magnitude || SCENARIOS.boumerdes_2003.magnitude).toFixed(1)}.`
                : 'Coordinates remain internal to the simulation logic.'}
            </div>
          </div>
        </div>
      )}

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Calculation scope</div>
        <div style={styles.scopeGrid}>
          {Object.entries(SCOPE_META).map(([scopeId, meta]) => {
            const selected = targetScope === scopeId
            return (
              <button
                key={scopeId}
                type="button"
                onClick={() => handleScopeChange(scopeId)}
                disabled={isRunning}
                style={{
                  ...styles.scopeCard,
                  borderColor: selected ? meta.tone : '#dbe4f0',
                  background: selected ? `linear-gradient(135deg, ${meta.tone}12, #ffffff)` : '#ffffff',
                  boxShadow: selected ? `0 16px 34px ${meta.tone}1f` : 'none',
                }}
                aria-pressed={selected}
              >
                <div style={styles.scopeTextWrap}>
                  <div
                    style={{
                      ...styles.scopePill,
                      background: selected ? meta.tone : '#e2e8f0',
                      color: selected ? '#ffffff' : '#334155',
                    }}
                  >
                    {meta.shortLabel}
                  </div>
                  <div>
                    <div style={styles.scopeLabel}>{meta.label}</div>
                    <div style={styles.scopeHint}>{meta.hint}</div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {targetScope === 'wilaya' && (
        <Field label="Target wilaya" helper="required filter">
          <select
            value={wilayaCode}
            onChange={(e) => {
              const value = e.target.value
              setWilayaCode(value)
              setCommuneCode('')
              setTargetScope('wilaya', value || null)
            }}
            disabled={isRunning}
          >
            <option value="">Select a wilaya</option>
            {wilayas.map((wilaya) => (
              <option key={wilaya.code} value={wilaya.code}>
                {wilaya.code} · {wilaya.name || wilaya.name_fr}
              </option>
            ))}
          </select>
        </Field>
      )}

      {targetScope === 'commune' && (
        <div style={styles.communeSection}>
          <Field label="Filter by wilaya" helper="optional">
            <select
              value={wilayaCode}
              onChange={(e) => {
                setWilayaCode(e.target.value)
                setCommuneCode('')
                setTargetScope('commune', null)
              }}
              disabled={isRunning}
            >
              <option value="">All wilayas</option>
              {wilayas.map((wilaya) => (
                <option key={wilaya.code} value={wilaya.code}>
                  {wilaya.code} · {wilaya.name || wilaya.name_fr}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Target commune" helper={`${communes.length} options`}>
            <select
              value={communeCode}
              onChange={(e) => {
                const value = e.target.value
                setCommuneCode(value)
                setTargetScope('commune', value || null)
              }}
              disabled={isRunning || !communes.length}
            >
              <option value="">Select a commune</option>
              {communes.map((commune) => (
                <option
                  key={commune.id ?? commune.commune_code ?? commune.code ?? commune.commune_name}
                  value={communeOptionValue(commune)}
                >
                  {commune.commune_name ?? commune.name}
                  {commune.wilaya_code ? ` · ${commune.wilaya_code}` : ''}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}

      <div style={styles.runPanel}>
        <div style={styles.runPanelHead}>
          <div>
            <div style={styles.runEyebrow}>Launch status</div>
            <div style={styles.runTitle}>{readiness.message}</div>
          </div>
          <div style={{ ...styles.statusBadge, background: readiness.ready ? '#ecfdf5' : '#fff7ed', color: readiness.ready ? '#047857' : '#9a3412' }}>
            {readiness.ready ? 'Ready' : 'Incomplete'}
          </div>
        </div>

        {fallbackCommuneNote ? (
          <div style={{ ...styles.noteBox, background: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8' }}>
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            <span>{fallbackCommuneNote}</span>
          </div>
        ) : null}

        {error ? (
          <div style={{ ...styles.noteBox, background: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' }}>
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        ) : null}

        <button
          type="button"
          onClick={run}
          disabled={isRunning || !readiness.ready}
          style={{
            ...styles.runButton,
            opacity: isRunning || !readiness.ready ? 0.7 : 1,
          }}
        >
          <span>{isRunning ? 'Simulation running...' : 'Run simulation'}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  hero: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 20,
    padding: '18px 18px 20px',
    background: 'radial-gradient(circle at top left, rgba(37,99,235,0.16), transparent 42%), linear-gradient(145deg, #0f172a, #10233f 58%, #0f766e)',
    color: '#fff',
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.14)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  heroTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1.15,
    marginBottom: 10,
    maxWidth: 320,
  },
  heroText: {
    fontSize: 13,
    lineHeight: 1.65,
    color: 'rgba(255,255,255,0.78)',
    maxWidth: 320,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: '#64748b',
  },
  scenarioGrid: {
    display: 'grid',
    gap: 10,
  },
  scenarioCard: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '14px 14px 16px',
    borderRadius: 18,
    border: '1px solid #dbe4f0',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
  },
  scenarioHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scenarioIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  scenarioLabel: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 15,
    fontWeight: 700,
    color: '#0f172a',
  },
  scenarioNote: {
    fontSize: 12,
    lineHeight: 1.6,
    color: '#475569',
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  scenarioChip: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 8px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.9)',
    border: '1px solid #e2e8f0',
    color: '#334155',
    fontSize: 11,
    fontWeight: 600,
  },
  activeScenarioPanel: {
    borderRadius: 18,
    border: '1px solid',
    background: '#ffffff',
    padding: 16,
    boxShadow: '0 12px 28px rgba(15,23,42,0.05)',
  },
  activeScenarioHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  activeScenarioEyebrow: {
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: '#94a3b8',
    marginBottom: 4,
  },
  activeScenarioName: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 16,
    fontWeight: 700,
    color: '#0f172a',
    lineHeight: 1.2,
  },
  activeScenarioBadge: {
    padding: '8px 12px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 10,
  },
  detailItem: {
    padding: '10px 12px',
    borderRadius: 14,
    background: '#f8fafc',
    border: '1px solid #edf2f7',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  detailKey: {
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#94a3b8',
  },
  detailValue: {
    fontSize: 13,
    color: '#0f172a',
  },
  detailSubValue: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 1.55,
  },
  customGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 10,
  },
  placeCard: {
    marginTop: 12,
    borderRadius: 16,
    border: '1px solid #dbeafe',
    background: 'linear-gradient(135deg, #eff6ff, #ffffff)',
    padding: '14px 15px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  placeCardLabel: {
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: '#64748b',
  },
  placeCardValue: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 16,
    fontWeight: 700,
    color: '#0f172a',
  },
  placeCardNote: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 1.6,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  fieldHead: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
    alignItems: 'baseline',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#334155',
  },
  fieldHelper: {
    fontSize: 11,
    color: '#94a3b8',
  },
  scopeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 10,
  },
  scopeCard: {
    display: 'flex',
    alignItems: 'stretch',
    padding: '14px 13px',
    borderRadius: 18,
    border: '1px solid #dbe4f0',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'border-color 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease',
  },
  scopeTextWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
    width: '100%',
  },
  scopePill: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 86,
    padding: '6px 12px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  scopeLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: 4,
  },
  scopeHint: {
    fontSize: 11,
    lineHeight: 1.55,
    color: '#64748b',
  },
  communeSection: {
    display: 'grid',
    gap: 14,
  },
  runPanel: {
    borderRadius: 18,
    border: '1px solid #dbe4f0',
    background: 'linear-gradient(180deg, #f8fafc, #ffffff)',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  runPanelHead: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  runEyebrow: {
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: '#94a3b8',
    marginBottom: 4,
  },
  runTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 15,
    fontWeight: 700,
    lineHeight: 1.3,
    color: '#0f172a',
  },
  statusBadge: {
    padding: '7px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  noteBox: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
    padding: '10px 12px',
    borderRadius: 14,
    border: '1px solid',
    fontSize: 12,
    lineHeight: 1.55,
  },
  runButton: {
    width: '100%',
    border: 'none',
    borderRadius: 16,
    padding: '14px 16px',
    background: 'linear-gradient(135deg, #0f766e, #14b8a6)',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    boxShadow: '0 16px 32px rgba(20,184,166,0.24)',
  },
}
