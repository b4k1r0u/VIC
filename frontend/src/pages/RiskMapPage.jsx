import React, { useState, useCallback } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, ZoomControl, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Layers, Filter, MapPin, SortDesc, ChevronLeft } from 'lucide-react'

/* ── Wilaya data ── */
const WILAYAS = [
  { name: 'Alger', code: 16, zone: 'III', lat: 36.74, lon: 3.06, policies: 24959 },
  { name: 'Tipaza', code: 42, zone: 'III', lat: 36.59, lon: 2.47, policies: 4570 },
  { name: 'Boumerdès', code: 35, zone: 'III', lat: 36.76, lon: 3.48, policies: 3340 },
  { name: 'Chlef', code: 2, zone: 'III', lat: 36.17, lon: 1.33, policies: 2800 },
  { name: 'Aïn Defla', code: 44, zone: 'III', lat: 36.26, lon: 1.97, policies: 2100 },
  { name: 'Blida', code: 9, zone: 'III', lat: 36.47, lon: 2.83, policies: 3556 },
  { name: 'Tizi Ouzou', code: 15, zone: 'IIb', lat: 36.72, lon: 4.05, policies: 11826 },
  { name: 'Médéa', code: 26, zone: 'IIb', lat: 36.27, lon: 2.75, policies: 2800 },
  { name: 'Tissemsilt', code: 38, zone: 'IIb', lat: 35.60, lon: 1.81, policies: 1900 },
  { name: 'Sétif', code: 19, zone: 'IIa', lat: 36.19, lon: 5.41, policies: 12310 },
  { name: 'Jijel', code: 18, zone: 'IIa', lat: 36.82, lon: 5.77, policies: 4012 },
  { name: 'Constantine', code: 25, zone: 'IIa', lat: 36.36, lon: 6.61, policies: 5053 },
  { name: 'Oran', code: 31, zone: 'IIa', lat: 35.69, lon: -0.63, policies: 5051 },
  { name: 'B.B.Arréridj', code: 34, zone: 'IIa', lat: 36.07, lon: 4.76, policies: 5061 },
  { name: 'Annaba', code: 23, zone: 'IIa', lat: 36.90, lon: 7.76, policies: 3800 },
  { name: 'Skikda', code: 21, zone: 'IIa', lat: 36.87, lon: 6.90, policies: 2900 },
  { name: 'Guelma', code: 24, zone: 'IIa', lat: 36.46, lon: 7.43, policies: 2200 },
  { name: 'Mila', code: 43, zone: 'IIa', lat: 36.45, lon: 6.27, policies: 2100 },
  { name: 'Mostaganem', code: 27, zone: 'IIa', lat: 35.93, lon: 0.09, policies: 2400 },
  { name: 'Mascara', code: 29, zone: 'IIa', lat: 35.39, lon: 0.14, policies: 2000 },
  { name: 'Sidi Bel Abbes', code: 22, zone: 'IIa', lat: 35.18, lon: -0.63, policies: 2300 },
  { name: 'Tlemcen', code: 13, zone: 'I', lat: 34.88, lon: -1.32, policies: 2200 },
  { name: 'Tiaret', code: 14, zone: 'I', lat: 35.37, lon: 1.32, policies: 2400 },
  { name: 'Laghouat', code: 3, zone: 'I', lat: 33.80, lon: 2.87, policies: 1800 },
  { name: 'Batna', code: 5, zone: 'I', lat: 35.55, lon: 6.17, policies: 2100 },
  { name: 'Biskra', code: 7, zone: 'I', lat: 34.85, lon: 5.73, policies: 1600 },
  { name: 'Tébessa', code: 12, zone: 'I', lat: 35.40, lon: 8.12, policies: 1500 },
  { name: "M'Sila", code: 28, zone: 'I', lat: 35.71, lon: 4.54, policies: 2000 },
  { name: 'Djelfa', code: 17, zone: 'I', lat: 34.67, lon: 3.26, policies: 1900 },
  { name: 'Naâma', code: 45, zone: 'I', lat: 33.27, lon: -0.31, policies: 900 },
  { name: 'El Bayadh', code: 32, zone: '0', lat: 33.68, lon: 1.02, policies: 800 },
  { name: 'Ghardaïa', code: 47, zone: '0', lat: 32.49, lon: 3.67, policies: 720 },
  { name: 'Ouargla', code: 30, zone: '0', lat: 31.95, lon: 5.32, policies: 650 },
  { name: 'Béchar', code: 8, zone: '0', lat: 31.62, lon: -2.22, policies: 540 },
  { name: 'El Oued', code: 39, zone: '0', lat: 33.37, lon: 6.87, policies: 430 },
  { name: 'Adrar', code: 1, zone: '0', lat: 27.87, lon: -0.28, policies: 280 },
  { name: 'Tamanrasset', code: 11, zone: '0', lat: 22.79, lon: 5.52, policies: 120 },
  { name: 'Illizi', code: 33, zone: '0', lat: 26.49, lon: 8.47, policies: 95 },
  { name: 'Tindouf', code: 37, zone: '0', lat: 27.67, lon: -8.15, policies: 80 },
]

const ZONE_COLOR = { III: '#dc2626', IIb: '#d97706', IIa: '#ca8a04', I: '#059669', '0': '#2563eb' }
const ZONE_LABEL = { III: 'Zone III', IIb: 'Zone IIb', IIa: 'Zone IIa', I: 'Zone I', '0': 'Zone 0' }

/* ── Generate simplified wilaya polygons for choropleth ── */
function generateWilayaGeoJSON(wilayas) {
  const features = wilayas.map(w => {
    // Generate a polygon approximation around each wilaya center
    const r = w.zone === '0' ? 2.2 : w.zone === 'I' ? 1.3 : 0.7
    const points = 8
    const coords = []
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * 2 * Math.PI
      // Add some pseudo-random wobble for organic shapes
      const wobble = 0.7 + 0.3 * Math.sin(w.code * 3 + i * 7)
      coords.push([
        w.lon + r * Math.cos(angle) * wobble * (0.8 + 0.4 * Math.cos(angle * 2)),
        w.lat + r * Math.sin(angle) * wobble * 0.8,
      ])
    }
    return {
      type: 'Feature',
      properties: {
        name: w.name,
        code: w.code,
        zone: w.zone,
        policies: w.policies,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [coords],
      },
    }
  })
  return { type: 'FeatureCollection', features }
}

/* ── Commune data generator for drill-down ── */
function generateCommunes(wilaya) {
  const communeNames = {
    16: ['Alger-Centre', 'Bab El Oued', 'Bir Mourad Raïs', 'El Biar', 'Hussein Dey', 'Kouba', 'Sidi M\'hamed', 'Dar El Beïda', 'Bab Ezzouar', 'Bordj El Kiffan', 'Chéraga', 'Dély Ibrahim'],
    42: ['Tipaza', 'Koléa', 'Hadjout', 'Cherchell', 'Gouraya', 'Sidi Amar'],
    35: ['Boumerdès', 'Dellys', 'Bordj Ménaïel', 'Thénia', 'Khemis El Khechna', 'Ouled Moussa'],
    15: ['Tizi Ouzou', 'Azazga', 'Draâ Ben Khedda', 'Larbaâ Nath Irathen', 'Aïn El Hammam', 'Ouaguenoun'],
    19: ['Sétif', 'El Eulma', 'Aïn Azel', 'Bougâa', 'Aïn Oulmène', 'Djemila'],
    31: ['Oran', 'Bir El Djir', 'Es Sénia', 'Aïn Türk', 'Gdyel', 'Aïn El Kerma'],
    25: ['Constantine', 'El Khroub', 'Aïn Smara', 'Hamma Bouziane', 'Zighoud Youcef', 'Didouche Mourad'],
  }

  const names = communeNames[wilaya.code] || Array.from({ length: 6 }, (_, i) => `Commune ${i + 1}`)
  return names.map((name, i) => {
    const angle = (i / names.length) * 2 * Math.PI
    const dist = 0.15 + Math.random() * 0.2
    return {
      name,
      lat: wilaya.lat + dist * Math.sin(angle),
      lon: wilaya.lon + dist * Math.cos(angle),
      policies: Math.floor(wilaya.policies / names.length * (0.5 + Math.random())),
      zone: wilaya.zone,
    }
  })
}

const maxPol = Math.max(...WILAYAS.map(w => w.policies))

function WilayaPopup({ w }) {
  const fg = ZONE_COLOR[w.zone]
  return (
    <div style={{ padding: '14px 16px', minWidth: 200, fontFamily: "'Plus Jakarta Sans', sans-serif", background: 'var(--surface)', color: 'var(--text-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
          {w.name}
        </div>
        <span style={{ background: `${fg}10`, color: fg, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>
          Zone {w.zone}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          ['Wilaya', `N° ${w.code}`],
          ['Polices', w.policies.toLocaleString('fr-FR')],
          ['SI Estimé', `${(w.policies * 10).toLocaleString('fr-FR')} M`],
          ['Coords', `${w.lat.toFixed(2)}°N`],
        ].map(([l, v]) => (
          <div key={l}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-quaternary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{l}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(w.policies / maxPol) * 100}%`, background: fg, borderRadius: 2 }} />
      </div>
      <div style={{ fontSize: '0.62rem', color: 'var(--text-quaternary)', marginTop: 4 }}>
        Concentration: {((w.policies / maxPol) * 100).toFixed(1)}%
      </div>
    </div>
  )
}

/* ── Commune Detail View ── */
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
        {communes.map((c, i) => (
          <div key={i} style={S.communeRow}>
            <div style={{ width: 7, height: 7, borderRadius: 3, background: fg, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0 }}>
              {c.policies.toLocaleString('fr-FR')}
            </div>
          </div>
        ))}
        {/* Summary stats */}
        <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.63rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-quaternary)', marginBottom: 8 }}>Résumé</div>
          {[
            ['Total Polices', wilaya.policies.toLocaleString('fr-FR')],
            ['SI Estimé', `${(wilaya.policies * 10).toLocaleString('fr-FR')} MDZD`],
            ['Zone Sismique', `Zone ${wilaya.zone}`],
          ].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.72rem' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>{l}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: 'var(--text-primary)' }}>{v}</span>
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
  const [communes, setCommunes] = useState(null)

  const filtered = filterZone ? WILAYAS.filter(w => w.zone === filterZone) : WILAYAS
  const sorted = [...WILAYAS].sort((a, b) => b[sortBy] - a[sortBy]).slice(0, 10)

  const geoData = generateWilayaGeoJSON(filtered)

  const handleWilayaClick = useCallback((w) => {
    setSelectedWilaya(w)
    setCommunes(generateCommunes(w))
  }, [])

  const geoStyle = useCallback((feature) => {
    const zone = feature.properties.zone
    return {
      fillColor: ZONE_COLOR[zone],
      fillOpacity: 0.35,
      color: ZONE_COLOR[zone],
      weight: 1.5,
      opacity: 0.6,
    }
  }, [])

  const onEachFeature = useCallback((feature, layer) => {
    const p = feature.properties
    layer.bindTooltip(
      `<strong>${p.name}</strong><br/>Zone ${p.zone} · ${p.policies.toLocaleString('fr-FR')} polices`,
      { sticky: true, className: 'rased-tooltip' }
    )
    layer.on('click', () => {
      const w = WILAYAS.find(w => w.code === p.code)
      if (w) handleWilayaClick(w)
    })
    layer.on('mouseover', () => layer.setStyle({ fillOpacity: 0.55, weight: 2.5 }))
    layer.on('mouseout', () => layer.setStyle({ fillOpacity: 0.35, weight: 1.5 }))
  }, [handleWilayaClick])

  return (
    <main style={S.page} className="page-fade">
      <div style={S.layout}>
        {/* Map */}
        <div style={S.mapWrap}>
          <MapContainer
            center={[28.5, 2.5]}
            zoom={5}
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
            scrollWheelZoom
          >
            <ZoomControl position="bottomright" />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
              attribution="&copy; OpenStreetMap"
            />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
              attribution=""
            />

            {/* Choropleth layer — colored wilaya areas */}
            <GeoJSON
              key={filterZone || 'all'}
              data={geoData}
              style={geoStyle}
              onEachFeature={onEachFeature}
            />

            {/* Bubble overlay if enabled */}
            {showBubbles && filtered.map(w => (
              <CircleMarker
                key={w.code}
                center={[w.lat, w.lon]}
                radius={4 + 28 * Math.sqrt(w.policies / maxPol)}
                pathOptions={{
                  color: ZONE_COLOR[w.zone],
                  fillColor: ZONE_COLOR[w.zone],
                  fillOpacity: 0.45,
                  weight: 1.2,
                }}
                eventHandlers={{
                  click: () => handleWilayaClick(w),
                }}
              >
                <Popup maxWidth={240} minWidth={210} closeButton={false}>
                  <div><WilayaPopup w={w} /></div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          {/* Map overlay legend */}
          <div style={S.mapLegend}>
            <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-quaternary)', marginBottom: 8 }}>
              Zones RPA99
            </div>
            {Object.entries(ZONE_COLOR).map(([z, c]) => (
              <div key={z}
                onClick={() => setFilterZone(filterZone === z ? null : z)}
                style={{
                  ...S.legendItem,
                  background: filterZone === z ? `${c}08` : 'transparent',
                  borderColor: filterZone === z ? `${c}25` : 'transparent',
                }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: c, flexShrink: 0, opacity: 0.8 }} />
                <span style={{ fontSize: '0.72rem', color: filterZone === z ? c : 'var(--text-secondary)', fontWeight: filterZone === z ? 600 : 400 }}>
                  Zone {z}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '0.63rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-quaternary)' }}>
                  {WILAYAS.filter(w => w.zone === z).length}
                </span>
              </div>
            ))}
          </div>

          {/* Map tag */}
          <div style={S.mapTag}>
            <MapPin size={10} style={{ marginRight: 5 }} />
            Carte RPA99 — {filtered.length} wilayas · {filterZone ? `Filtre: Zone ${filterZone}` : 'Toutes zones'}
          </div>
        </div>

        {/* Right sidebar */}
        <div style={S.sidebar}>
          {selectedWilaya && communes ? (
            <CommuneView
              wilaya={selectedWilaya}
              communes={communes}
              onBack={() => { setSelectedWilaya(null); setCommunes(null) }}
            />
          ) : (
            <>
              {/* Controls */}
              <div style={S.sideCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Layers size={13} color="var(--primary-500)" />
                  <div style={S.sideTitle2}>Contrôles</div>
                </div>
                <label style={S.toggleRow}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', flex: 1 }}>Bulles portefeuille</span>
                  <div onClick={() => setShowBubbles(p => !p)}
                    style={{ ...S.toggle, background: showBubbles ? 'var(--primary-500)' : 'var(--slate-300)' }}>
                    <div style={{ ...S.knob, left: showBubbles ? 18 : 3 }} />
                  </div>
                </label>
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-quaternary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <SortDesc size={10} />Trier par
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[['policies', 'Polices'], ['si', 'Exposition']].map(([k, l]) => (
                      <button key={k} onClick={() => setSortBy(k)} style={{
                        ...S.sortBtn,
                        background: sortBy === k ? 'var(--primary-50)' : 'transparent',
                        color: sortBy === k ? 'var(--primary-700)' : 'var(--text-tertiary)',
                        border: `1px solid ${sortBy === k ? 'rgba(20,184,166,0.2)' : 'var(--border)'}`,
                      }}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Zone filter */}
              <div style={S.sideCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Filter size={13} color="var(--primary-500)" />
                  <div style={S.sideTitle2}>Filtrer par Zone</div>
                </div>
                {Object.entries(ZONE_COLOR).map(([z, c]) => {
                  const cnt = WILAYAS.filter(w => w.zone === z).length
                  const active = filterZone === z
                  return (
                    <div key={z} onClick={() => setFilterZone(active ? null : z)}
                      style={{ ...S.zoneRow, background: active ? `${c}06` : 'transparent', borderColor: active ? `${c}20` : 'transparent' }}>
                      <div style={{ width: 8, height: 8, borderRadius: 3, background: c, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: '0.76rem', color: active ? c : 'var(--text-secondary)', fontWeight: active ? 600 : 400 }}>Zone {z}</span>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: 'var(--text-quaternary)' }}>{cnt} wilayas</div>
                    </div>
                  )
                })}
              </div>

              {/* Top exposure table */}
              <div style={{ ...S.sideCard, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 7, height: 7, borderRadius: 3, background: 'var(--danger)' }} />
                  <div style={S.sideTitle2}>Top 10 Exposition</div>
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {sorted.map((w, i) => (
                    <div key={w.code} style={S.expRow} onClick={() => handleWilayaClick(w)}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.63rem', color: 'var(--text-quaternary)', width: 18 }}>
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <div style={{ width: 6, height: 6, borderRadius: 3, background: ZONE_COLOR[w.zone], flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.name}</div>
                        <div style={{ fontSize: '0.63rem', color: 'var(--text-quaternary)' }}>Zone {w.zone}</div>
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0 }}>
                        {w.policies.toLocaleString('fr-FR')}
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
}
