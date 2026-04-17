import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, ZoomControl } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Layers, Filter, MapPin, SortDesc, ChevronLeft } from 'lucide-react'
import { geoAPI } from '../api/geo'
import LoadingSpinner from '../components/shared/LoadingSpinner'

const WILAYA_COORDS = [
  { name: 'Alger', code: '16', lat: 36.74, lon: 3.06 },
  { name: 'Tipaza', code: '42', lat: 36.59, lon: 2.47 },
  { name: 'Boumerdes', code: '35', lat: 36.76, lon: 3.48 },
  { name: 'Chlef', code: '02', lat: 36.17, lon: 1.33 },
  { name: 'Ain Defla', code: '44', lat: 36.26, lon: 1.97 },
  { name: 'Blida', code: '09', lat: 36.47, lon: 2.83 },
  { name: 'Tizi Ouzou', code: '15', lat: 36.72, lon: 4.05 },
  { name: 'Medea', code: '26', lat: 36.27, lon: 2.75 },
  { name: 'Tissemsilt', code: '38', lat: 35.60, lon: 1.81 },
  { name: 'Setif', code: '19', lat: 36.19, lon: 5.41 },
  { name: 'Jijel', code: '18', lat: 36.82, lon: 5.77 },
  { name: 'Constantine', code: '25', lat: 36.36, lon: 6.61 },
  { name: 'Oran', code: '31', lat: 35.69, lon: -0.63 },
  { name: 'Bordj Bou Arreridj', code: '34', lat: 36.07, lon: 4.76 },
  { name: 'Annaba', code: '23', lat: 36.90, lon: 7.76 },
  { name: 'Skikda', code: '21', lat: 36.87, lon: 6.90 },
  { name: 'Guelma', code: '24', lat: 36.46, lon: 7.43 },
  { name: 'Mila', code: '43', lat: 36.45, lon: 6.27 },
  { name: 'Mostaganem', code: '27', lat: 35.93, lon: 0.09 },
  { name: 'Mascara', code: '29', lat: 35.39, lon: 0.14 },
  { name: 'Sidi Bel Abbes', code: '22', lat: 35.18, lon: -0.63 },
  { name: 'Tlemcen', code: '13', lat: 34.88, lon: -1.32 },
  { name: 'Tiaret', code: '14', lat: 35.37, lon: 1.32 },
  { name: 'Laghouat', code: '03', lat: 33.80, lon: 2.87 },
  { name: 'Batna', code: '05', lat: 35.55, lon: 6.17 },
  { name: 'Biskra', code: '07', lat: 34.85, lon: 5.73 },
  { name: 'Tebessa', code: '12', lat: 35.40, lon: 8.12 },
  { name: 'M Sila', code: '28', lat: 35.71, lon: 4.54 },
  { name: 'Djelfa', code: '17', lat: 34.67, lon: 3.26 },
  { name: 'Naama', code: '45', lat: 33.27, lon: -0.31 },
  { name: 'El Bayadh', code: '32', lat: 33.68, lon: 1.02 },
  { name: 'Ghardaia', code: '47', lat: 32.49, lon: 3.67 },
  { name: 'Ouargla', code: '30', lat: 31.95, lon: 5.32 },
  { name: 'Bechar', code: '08', lat: 31.62, lon: -2.22 },
  { name: 'El Oued', code: '39', lat: 33.37, lon: 6.87 },
  { name: 'Adrar', code: '01', lat: 27.87, lon: -0.28 },
  { name: 'Tamanrasset', code: '11', lat: 22.79, lon: 5.52 },
  { name: 'Illizi', code: '33', lat: 26.49, lon: 8.47 },
  { name: 'Tindouf', code: '37', lat: 27.67, lon: -8.15 },
]

const ZONE_COLOR = { III: '#dc2626', IIb: '#d97706', IIa: '#ca8a04', I: '#059669', '0': '#2563eb' }
const ZONE_WEIGHT = { '0': 1, I: 2, IIa: 3, IIb: 4, III: 5 }

function toNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function normalizeCode(code) {
  return String(code || '').padStart(2, '0')
}

function formatCompactDzd(value) {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)} Md`
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)} M`
  return value.toLocaleString('fr-FR')
}

function aggregateWilayas(rows) {
  const coordsByCode = new Map(WILAYA_COORDS.map((item) => [item.code, item]))
  const grouped = new Map()

  for (const row of rows) {
    const code = normalizeCode(row.wilaya_code)
    const coords = coordsByCode.get(code)
    if (!coords) continue

    const current = grouped.get(code) || {
      code,
      name: row.wilaya_name || coords.name,
      zone: row.zone_sismique,
      lat: coords.lat,
      lon: coords.lon,
      policies: 0,
      exposure: 0,
      communes: 0,
    }

    current.policies += toNumber(row.policy_count)
    current.exposure += toNumber(row.total_exposure)
    current.communes += 1

    if ((ZONE_WEIGHT[row.zone_sismique] || 0) > (ZONE_WEIGHT[current.zone] || 0)) {
      current.zone = row.zone_sismique
    }

    grouped.set(code, current)
  }

  return [...grouped.values()]
}

function markerRadius(wilaya, maxPolicies) {
  const ratio = maxPolicies > 0 ? wilaya.policies / maxPolicies : 0
  return 4 + Math.pow(ratio, 0.45) * 10
}

function WilayaPopup({ wilaya, maxExposure }) {
  const fg = ZONE_COLOR[wilaya.zone]
  const concentration = maxExposure > 0 ? (wilaya.exposure / maxExposure) * 100 : 0

  return (
    <div style={{ padding: '14px 16px', minWidth: 210, fontFamily: "'Plus Jakarta Sans', sans-serif", background: 'var(--surface)', color: 'var(--text-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
          {wilaya.name}
        </div>
        <span style={{ background: `${fg}10`, color: fg, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>
          Zone {wilaya.zone}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          ['Wilaya', `N° ${wilaya.code}`],
          ['Polices', wilaya.policies.toLocaleString('fr-FR')],
          ['Exposition', `${formatCompactDzd(wilaya.exposure)} DZD`],
          ['Communes', wilaya.communes.toLocaleString('fr-FR')],
        ].map(([label, value]) => (
          <div key={label}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-quaternary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{label}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(concentration, 100)}%`, background: fg, borderRadius: 2 }} />
      </div>
      <div style={{ fontSize: '0.62rem', color: 'var(--text-quaternary)', marginTop: 4 }}>
        Concentration exposition: {concentration.toFixed(1)}%
      </div>
    </div>
  )
}

function CommuneView({ wilaya, communes, onBack }) {
  const fg = ZONE_COLOR[wilaya.zone]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={S.communeHeader}>
        <button onClick={onBack} style={S.backBtn}>
          <ChevronLeft size={14} />
          Retour
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
            {wilaya.name}
          </span>
          <span style={{ background: `${fg}10`, color: fg, fontSize: '0.63rem', fontWeight: 600, padding: '2px 6px', borderRadius: 4, fontFamily: "'JetBrains Mono', monospace" }}>
            Zone {wilaya.zone}
          </span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-quaternary)', marginBottom: 10 }}>
          Communes ({communes.length})
        </div>
        {communes.map((commune) => (
          <div key={`${commune.wilaya_code}-${commune.commune_code}`} style={S.communeRow}>
            <div style={{ width: 7, height: 7, borderRadius: 3, background: ZONE_COLOR[commune.zone_sismique], flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{commune.commune_name}</div>
              <div style={{ fontSize: '0.64rem', color: 'var(--text-quaternary)' }}>Zone {commune.zone_sismique}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {toNumber(commune.policy_count).toLocaleString('fr-FR')}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', color: 'var(--text-quaternary)' }}>
                {formatCompactDzd(toNumber(commune.total_exposure))}
              </div>
            </div>
          </div>
        ))}
        <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.63rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-quaternary)', marginBottom: 8 }}>Résumé</div>
          {[
            ['Total Polices', wilaya.policies.toLocaleString('fr-FR')],
            ['Exposition', `${formatCompactDzd(wilaya.exposure)} DZD`],
            ['Zone Sismique', `Zone ${wilaya.zone}`],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.72rem' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>{label}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function RiskMapPage() {
  const [filterZone, setFilterZone] = useState(null)
  const [sortBy, setSortBy] = useState('policies')
  const [showBubbles, setShowBubbles] = useState(true)
  const [selectedWilaya, setSelectedWilaya] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const response = await geoAPI.getMapData('exposure')
        if (!cancelled) setRows(response.features ?? [])
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

  const wilayas = useMemo(() => aggregateWilayas(rows), [rows])
  const filtered = useMemo(
    () => (filterZone ? wilayas.filter((wilaya) => wilaya.zone === filterZone) : wilayas),
    [filterZone, wilayas]
  )
  const sorted = useMemo(
    () => [...wilayas].sort((a, b) => b[sortBy] - a[sortBy]).slice(0, 10),
    [sortBy, wilayas]
  )
  const maxPolicies = useMemo(() => Math.max(...wilayas.map((wilaya) => wilaya.policies), 1), [wilayas])
  const maxExposure = useMemo(() => Math.max(...wilayas.map((wilaya) => wilaya.exposure), 1), [wilayas])

  const communes = useMemo(() => {
    if (!selectedWilaya) return null
    return rows
      .filter((row) => normalizeCode(row.wilaya_code) === selectedWilaya.code)
      .sort((a, b) => toNumber(b.total_exposure) - toNumber(a.total_exposure))
  }, [rows, selectedWilaya])

  const handleWilayaClick = useCallback((wilaya) => {
    setSelectedWilaya(wilaya)
  }, [])

  if (loading) {
    return (
      <main style={S.loadingPage}>
        <LoadingSpinner size={36} />
      </main>
    )
  }

  if (error) {
    return (
      <main style={S.loadingPage}>
        <div style={S.errorBox}>{error}</div>
      </main>
    )
  }

  return (
    <main style={S.page} className="page-fade">
      <div style={S.layout}>
        <div style={S.mapWrap}>
          <MapContainer center={[34.4, 2.8]} zoom={6} style={{ width: '100%', height: '100%' }} zoomControl={false} scrollWheelZoom>
            <ZoomControl position="bottomright" />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
              attribution="&copy; OpenStreetMap"
            />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
              attribution=""
            />

            {showBubbles && filtered.map((wilaya) => (
              <CircleMarker
                key={wilaya.code}
                center={[wilaya.lat, wilaya.lon]}
                radius={markerRadius(wilaya, maxPolicies)}
                pathOptions={{
                  color: ZONE_COLOR[wilaya.zone],
                  fillColor: ZONE_COLOR[wilaya.zone],
                  fillOpacity: 0.22,
                  opacity: 0.9,
                  weight: 1.5,
                }}
                eventHandlers={{
                  click: () => handleWilayaClick(wilaya),
                }}
              >
                <Popup maxWidth={240} minWidth={210} closeButton={false}>
                  <div><WilayaPopup wilaya={wilaya} maxExposure={maxExposure} /></div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          <div style={S.mapLegend}>
            <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-quaternary)', marginBottom: 8 }}>
              Zones RPA99
            </div>
            {Object.entries(ZONE_COLOR).map(([zone, color]) => (
              <div
                key={zone}
                onClick={() => setFilterZone(filterZone === zone ? null : zone)}
                style={{
                  ...S.legendItem,
                  background: filterZone === zone ? `${color}08` : 'transparent',
                  borderColor: filterZone === zone ? `${color}25` : 'transparent',
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0, opacity: 0.8 }} />
                <span style={{ fontSize: '0.72rem', color: filterZone === zone ? color : 'var(--text-secondary)', fontWeight: filterZone === zone ? 600 : 400 }}>
                  Zone {zone}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '0.63rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-quaternary)' }}>
                  {wilayas.filter((wilaya) => wilaya.zone === zone).length}
                </span>
              </div>
            ))}
          </div>

          <div style={S.mapTag}>
            <MapPin size={10} style={{ marginRight: 5 }} />
            Carte RPA99 — {filtered.length} wilayas · {filterZone ? `Filtre: Zone ${filterZone}` : 'Toutes zones'}
          </div>
        </div>

        <div style={S.sidebar}>
          {selectedWilaya && communes ? (
            <CommuneView
              wilaya={selectedWilaya}
              communes={communes}
              onBack={() => setSelectedWilaya(null)}
            />
          ) : (
            <>
              <div style={S.sideCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Layers size={13} color="var(--primary-500)" />
                  <div style={S.sideTitle2}>Contrôles</div>
                </div>
                <label style={S.toggleRow}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', flex: 1 }}>Bulles portefeuille</span>
                  <div onClick={() => setShowBubbles((prev) => !prev)} style={{ ...S.toggle, background: showBubbles ? 'var(--primary-500)' : 'var(--slate-300)' }}>
                    <div style={{ ...S.knob, left: showBubbles ? 18 : 3 }} />
                  </div>
                </label>
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-quaternary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <SortDesc size={10} />Trier par
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[['policies', 'Polices'], ['exposure', 'Exposition']].map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setSortBy(key)}
                        style={{
                          ...S.sortBtn,
                          background: sortBy === key ? 'var(--primary-50)' : 'transparent',
                          color: sortBy === key ? 'var(--primary-700)' : 'var(--text-tertiary)',
                          border: `1px solid ${sortBy === key ? 'rgba(20,184,166,0.2)' : 'var(--border)'}`,
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={S.sideCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Filter size={13} color="var(--primary-500)" />
                  <div style={S.sideTitle2}>Filtrer par Zone</div>
                </div>
                {Object.entries(ZONE_COLOR).map(([zone, color]) => {
                  const count = wilayas.filter((wilaya) => wilaya.zone === zone).length
                  const active = filterZone === zone
                  return (
                    <div
                      key={zone}
                      onClick={() => setFilterZone(active ? null : zone)}
                      style={{ ...S.zoneRow, background: active ? `${color}06` : 'transparent', borderColor: active ? `${color}20` : 'transparent' }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: 3, background: color, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: '0.76rem', color: active ? color : 'var(--text-secondary)', fontWeight: active ? 600 : 400 }}>Zone {zone}</span>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: 'var(--text-quaternary)' }}>{count} wilayas</div>
                    </div>
                  )
                })}
              </div>

              <div style={{ ...S.sideCard, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 7, height: 7, borderRadius: 3, background: 'var(--danger)' }} />
                  <div style={S.sideTitle2}>Top 10 Exposition</div>
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {sorted.map((wilaya, index) => (
                    <div key={wilaya.code} style={S.expRow} onClick={() => handleWilayaClick(wilaya)}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.63rem', color: 'var(--text-quaternary)', width: 18 }}>
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div style={{ width: 6, height: 6, borderRadius: 3, background: ZONE_COLOR[wilaya.zone], flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{wilaya.name}</div>
                        <div style={{ fontSize: '0.63rem', color: 'var(--text-quaternary)' }}>Zone {wilaya.zone}</div>
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0 }}>
                        {sortBy === 'policies'
                          ? wilaya.policies.toLocaleString('fr-FR')
                          : formatCompactDzd(wilaya.exposure)}
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
  page: { flex: 1, overflow: 'hidden', padding: '12px 16px', display: 'flex', flexDirection: 'column' },
  layout: { display: 'flex', gap: 12, flex: 1, overflow: 'hidden', minHeight: 0 },
  mapWrap: {
    flex: 1, position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
    border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)',
  },
  mapLegend: {
    position: 'absolute', top: 12, left: 12, zIndex: 1000,
    background: 'var(--surface-overlay)',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-md)', padding: '10px 12px',
    display: 'flex', flexDirection: 'column', gap: 3,
    minWidth: 135,
  },
  legendItem: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '5px 8px', borderRadius: 6, transition: 'all 0.15s',
    cursor: 'pointer', border: '1px solid',
  },
  mapTag: {
    position: 'absolute', bottom: 12, left: 12, zIndex: 1000,
    background: 'var(--surface-overlay)',
    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    borderRadius: 6, border: '1px solid var(--border)',
    padding: '5px 10px', fontSize: '0.65rem', color: 'var(--text-tertiary)',
    fontWeight: 500, display: 'flex', alignItems: 'center',
    boxShadow: 'var(--shadow-sm)',
  },
  sidebar: { width: 256, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' },
  sideCard: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '14px 16px', boxShadow: 'var(--shadow-card)',
  },
  sideTitle2: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-primary)' },
  toggleRow: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
  toggle: { width: 36, height: 20, borderRadius: 10, position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 },
  knob: { position: 'absolute', top: 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' },
  sortBtn: { flex: 1, padding: '6px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' },
  zoneRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', marginBottom: 2, border: '1px solid', transition: 'all 0.15s' },
  expRow: { display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8, marginBottom: 8, borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'opacity 0.15s' },
  communeHeader: {
    padding: '12px 14px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
  },
  backBtn: {
    display: 'flex', alignItems: 'center', gap: 4, background: 'transparent',
    border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px',
    fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-secondary)', cursor: 'pointer',
    transition: 'all 0.15s',
  },
  communeRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 10px', borderRadius: 6, marginBottom: 2,
    borderBottom: '1px solid var(--border-subtle)',
  },
  loadingPage: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    padding: '14px 16px',
    borderRadius: 12,
    background: 'var(--surface)',
    border: '1px solid var(--danger-border)',
    color: 'var(--danger)',
  },
}
