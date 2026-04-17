import React, { useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, ZoomControl } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Layers, Filter, MapPin, SortDesc } from 'lucide-react'

const WILAYAS = [
  { name:'Alger',         code:16, zone:'III',  lat:36.74, lon:3.06,  policies:24959 },
  { name:'Tipaza',        code:42, zone:'III',  lat:36.59, lon:2.47,  policies:4570  },
  { name:'Boumerdès',     code:35, zone:'III',  lat:36.76, lon:3.48,  policies:3340  },
  { name:'Chlef',         code:2,  zone:'III',  lat:36.17, lon:1.33,  policies:2800  },
  { name:'Aïn Defla',     code:44, zone:'III',  lat:36.26, lon:1.97,  policies:2100  },
  { name:'Blida',         code:9,  zone:'III',  lat:36.47, lon:2.83,  policies:3556  },
  { name:'Tizi Ouzou',    code:15, zone:'IIb',  lat:36.72, lon:4.05,  policies:11826 },
  { name:'Médéa',         code:26, zone:'IIb',  lat:36.27, lon:2.75,  policies:2800  },
  { name:'Tissemsilt',    code:38, zone:'IIb',  lat:35.60, lon:1.81,  policies:1900  },
  { name:'Sétif',         code:19, zone:'IIa',  lat:36.19, lon:5.41,  policies:12310 },
  { name:'Jijel',         code:18, zone:'IIa',  lat:36.82, lon:5.77,  policies:4012  },
  { name:'Constantine',   code:25, zone:'IIa',  lat:36.36, lon:6.61,  policies:5053  },
  { name:'Oran',          code:31, zone:'IIa',  lat:35.69, lon:-0.63, policies:5051  },
  { name:'B.B.Arréridj',  code:34, zone:'IIa',  lat:36.07, lon:4.76,  policies:5061  },
  { name:'Annaba',        code:23, zone:'IIa',  lat:36.90, lon:7.76,  policies:3800  },
  { name:'Skikda',        code:21, zone:'IIa',  lat:36.87, lon:6.90,  policies:2900  },
  { name:'Guelma',        code:24, zone:'IIa',  lat:36.46, lon:7.43,  policies:2200  },
  { name:'Mila',          code:43, zone:'IIa',  lat:36.45, lon:6.27,  policies:2100  },
  { name:'Mostaganem',    code:27, zone:'IIa',  lat:35.93, lon:0.09,  policies:2400  },
  { name:'Mascara',       code:29, zone:'IIa',  lat:35.39, lon:0.14,  policies:2000  },
  { name:'Sidi Bel Abbes',code:22, zone:'IIa',  lat:35.18, lon:-0.63, policies:2300  },
  { name:'Tlemcen',       code:13, zone:'I',    lat:34.88, lon:-1.32, policies:2200  },
  { name:'Tiaret',        code:14, zone:'I',    lat:35.37, lon:1.32,  policies:2400  },
  { name:'Laghouat',      code:3,  zone:'I',    lat:33.80, lon:2.87,  policies:1800  },
  { name:'Batna',         code:5,  zone:'I',    lat:35.55, lon:6.17,  policies:2100  },
  { name:'Biskra',        code:7,  zone:'I',    lat:34.85, lon:5.73,  policies:1600  },
  { name:'Tébessa',       code:12, zone:'I',    lat:35.40, lon:8.12,  policies:1500  },
  { name:"M'Sila",        code:28, zone:'I',    lat:35.71, lon:4.54,  policies:2000  },
  { name:'Djelfa',        code:17, zone:'I',    lat:34.67, lon:3.26,  policies:1900  },
  { name:'Naâma',         code:45, zone:'I',    lat:33.27, lon:-0.31, policies:900   },
  { name:'El Bayadh',     code:32, zone:'0',    lat:33.68, lon:1.02,  policies:800   },
  { name:'Ghardaïa',      code:47, zone:'0',    lat:32.49, lon:3.67,  policies:720   },
  { name:'Ouargla',       code:30, zone:'0',    lat:31.95, lon:5.32,  policies:650   },
  { name:'Béchar',        code:8,  zone:'0',    lat:31.62, lon:-2.22, policies:540   },
  { name:'El Oued',       code:39, zone:'0',    lat:33.37, lon:6.87,  policies:430   },
  { name:'Adrar',         code:1,  zone:'0',    lat:27.87, lon:-0.28, policies:280   },
  { name:'Tamanrasset',   code:11, zone:'0',    lat:22.79, lon:5.52,  policies:120   },
  { name:'Illizi',        code:33, zone:'0',    lat:26.49, lon:8.47,  policies:95    },
  { name:'Tindouf',       code:37, zone:'0',    lat:27.67, lon:-8.15, policies:80    },
]

const ZONE_COLOR = { III:'#ef4444', IIb:'#f59e0b', IIa:'#eab308', I:'#22c55e', '0':'#3b82f6' }
const ZONE_BG    = { III:'rgba(239,68,68,0.12)', IIb:'rgba(245,158,11,0.12)', IIa:'rgba(234,179,8,0.12)', I:'rgba(34,197,94,0.12)', '0':'rgba(59,130,246,0.12)' }

const minR = 5, maxR = 38
const maxPol = Math.max(...WILAYAS.map(w => w.policies))
const bubbleR = p => minR + (maxR - minR) * Math.sqrt(p / maxPol)

function WilayaPopup({ w }) {
  const fg = ZONE_COLOR[w.zone]
  const bg = ZONE_BG[w.zone]
  return (
    <div style={{ padding:'16px 18px', minWidth:210, fontFamily:'Plus Jakarta Sans, sans-serif', background:'var(--surface2)', color:'var(--text-1)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.92rem', color:'var(--text-1)' }}>
          {w.name}
        </div>
        <span style={{ background:bg, color:fg, fontFamily:'JetBrains Mono,monospace', fontSize:'0.63rem', fontWeight:700, padding:'2px 8px', borderRadius:6, border:`1px solid ${fg}30` }}>
          Zone {w.zone}
        </span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {[
          ['Wilaya', `N° ${w.code}`],
          ['Polices', w.policies.toLocaleString('fr-FR')],
          ['SI Estimé', `${(w.policies*10).toLocaleString('fr-FR')} M`],
          ['Coords', `${w.lat.toFixed(2)}°N`],
        ].map(([l, v]) => (
          <div key={l}>
            <div style={{ fontSize:'0.56rem', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:2 }}>{l}</div>
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'0.76rem', fontWeight:700, color:'var(--text-1)' }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop:12, height:5, background:'rgba(255,255,255,0.08)', borderRadius:3, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${(w.policies/maxPol)*100}%`, background:fg, borderRadius:3, boxShadow:`0 0 6px ${fg}80` }} />
      </div>
      <div style={{ fontSize:'0.6rem', color:'#64748b', marginTop:4 }}>
        Concentration: {((w.policies/maxPol)*100).toFixed(1)}%
      </div>
    </div>
  )
}

export default function RiskMapPage() {
  const [filterZone, setFilterZone] = useState(null)
  const [sortBy, setSortBy]         = useState('policies')
  const [showBubbles, setShowBubbles] = useState(true)

  const filtered = filterZone ? WILAYAS.filter(w => w.zone === filterZone) : WILAYAS
  const sorted   = [...WILAYAS].sort((a, b) => b[sortBy] - a[sortBy]).slice(0, 10)

  return (
    <main style={S.page} className="page-fade">
      <div style={S.layout}>
        {/* Map */}
        <div style={S.mapWrap}>
          <MapContainer
            center={[28.5, 2.5]}
            zoom={5}
            style={{ width:'100%', height:'100%' }}
            zoomControl={false}
            scrollWheelZoom
          >
            <ZoomControl position="bottomright" />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; OpenStreetMap"
            />
            {showBubbles && filtered.map(w => (
              <CircleMarker
                key={w.code}
                center={[w.lat, w.lon]}
                radius={bubbleR(w.policies)}
                pathOptions={{
                  color: ZONE_COLOR[w.zone],
                  fillColor: ZONE_COLOR[w.zone],
                  fillOpacity: w.zone === 'III' ? 0.75 : 0.55,
                  weight: w.zone === 'III' ? 2 : 1.5,
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
            <div style={{ fontSize:'0.58rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'1.5px', color:'#64748b', marginBottom:6 }}>
              Zones RPA99
            </div>
            {Object.entries(ZONE_COLOR).map(([z, c]) => (
              <div key={z}
                onClick={() => setFilterZone(filterZone === z ? null : z)}
                style={{
                  ...S.legendItem,
                  background: filterZone === z ? `${c}18` : 'transparent',
                  border:`1px solid ${filterZone === z ? c+'40' : 'transparent'}`,
                }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:c, boxShadow:`0 0 6px ${c}` }} />
                <span style={{ fontSize:'0.7rem', color:filterZone===z ? c : '#334155', fontWeight:filterZone===z?700:500 }}>
                  Zone {z}
                </span>
                <span style={{ marginLeft:'auto', fontSize:'0.6rem', fontFamily:'JetBrains Mono,monospace', color:'#64748b' }}>
                  {WILAYAS.filter(w => w.zone === z).length}
                </span>
              </div>
            ))}
          </div>

          {/* Map tag */}
          <div style={{...S.mapTag, color:'#64748b'}}>
            <MapPin size={10} style={{ marginRight:5 }} />
            Carte RPA99 — {filtered.length} wilayas · {filterZone ? `Filtre: Zone ${filterZone}` : 'Toutes zones'}
          </div>
        </div>

        {/* Right sidebar */}
        <div style={S.sidebar}>
          {/* Controls */}
          <div style={S.sideCard}>
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12 }}>
              <Layers size={13} color="var(--g400)" />
              <div style={S.sideTitle2}>Contrôles</div>
            </div>
            <label style={S.toggleRow}>
              <span style={{ fontSize:'0.76rem', color:'var(--text-2)', flex:1 }}>Bulles portefeuille</span>
              <div onClick={() => setShowBubbles(p => !p)}
                style={{ ...S.toggle, background:showBubbles ? 'var(--g500)' : 'rgba(255,255,255,0.1)' }}>
                <div style={{ ...S.knob, left:showBubbles ? 18 : 3 }} />
              </div>
            </label>
            <div style={{ marginTop:12 }}>
              <div style={{ fontSize:'0.58rem', fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'1.2px', marginBottom:7, display:'flex', alignItems:'center', gap:5 }}>
                <SortDesc size={10} />Trier par
              </div>
              <div style={{ display:'flex', gap:6 }}>
                {[['policies','Polices'],['si','Exposition']].map(([k,l]) => (
                  <button key={k} onClick={() => setSortBy(k)} style={{
                    ...S.sortBtn,
                    background: sortBy===k ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)',
                    color: sortBy===k ? 'var(--g400)' : 'var(--text-2)',
                    border: `1px solid ${sortBy===k ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                  }}>{l}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Zone filter */}
          <div style={S.sideCard}>
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:10 }}>
              <Filter size={13} color="var(--g400)" />
              <div style={S.sideTitle2}>Filtrer par Zone</div>
            </div>
            {Object.entries(ZONE_COLOR).map(([z, c]) => {
              const cnt    = WILAYAS.filter(w => w.zone === z).length
              const active = filterZone === z
              const total  = WILAYAS.filter(w => w.zone === z).reduce((s, w) => s + w.policies, 0)
              return (
                <div key={z} onClick={() => setFilterZone(active ? null : z)}
                  style={{ ...S.zoneRow, background:active?`${c}10`:'transparent', borderColor:active?`${c}30`:'transparent' }}>
                  <div style={{ width:9, height:9, borderRadius:'50%', background:c, flexShrink:0, boxShadow:active?`0 0 6px ${c}`:'none' }} />
                  <span style={{ flex:1, fontSize:'0.74rem', color:active?c:'var(--text-2)', fontWeight:active?700:400 }}>Zone {z}</span>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'0.62rem', color:'var(--text-4)' }}>{cnt} wilayas</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Top exposure table */}
          <div style={{ ...S.sideCard, flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#ef4444', boxShadow:'0 0 6px #ef4444' }} />
              <div style={S.sideTitle2}>Top 10 Exposition</div>
            </div>
            <div style={{ overflowY:'auto', flex:1 }}>
              {sorted.map((w, i) => (
                <div key={w.code} style={S.expRow}>
                  <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'0.62rem', color:'var(--text-4)', width:18 }}>
                    {String(i+1).padStart(2,'0')}
                  </div>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:ZONE_COLOR[w.zone], flexShrink:0, boxShadow:`0 0 5px ${ZONE_COLOR[w.zone]}` }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'0.74rem', fontWeight:600, color:'var(--text-1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{w.name}</div>
                    <div style={{ fontSize:'0.6rem', color:'var(--text-4)' }}>Zone {w.zone}</div>
                  </div>
                  <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'0.7rem', fontWeight:700, color:ZONE_COLOR[w.zone], flexShrink:0 }}>
                    {w.policies.toLocaleString('fr-FR')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

const S = {
  page: { flex:1, overflow:'hidden', padding:'14px 18px', display:'flex', flexDirection:'column' },
  layout: { display:'flex', gap:14, flex:1, overflow:'hidden', minHeight:0 },
  mapWrap: {
    flex:1, position:'relative', borderRadius:14, overflow:'hidden',
    border:'1px solid var(--border)', boxShadow:'var(--sh-md)',
  },
  mapLegend: {
    position:'absolute', top:14, left:14, zIndex:1000,
    background:'rgba(255,255,255,0.94)',
    backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
    borderRadius:12, border:'1px solid rgba(0,0,0,0.08)',
    boxShadow:'var(--sh-md)', padding:'12px 14px',
    display:'flex', flexDirection:'column', gap:5,
    minWidth:140,
  },
  legendItem: {
    display:'flex', alignItems:'center', gap:8,
    padding:'5px 8px', borderRadius:8, transition:'all 0.15s',
    cursor:'pointer',
  },
  mapTag: {
    position:'absolute', bottom:14, left:14, zIndex:1000,
    background:'rgba(255,255,255,0.94)',
    backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
    borderRadius:9, border:'1px solid rgba(0,0,0,0.07)',
    padding:'6px 12px', fontSize:'0.65rem', color:'var(--text-3)',
    fontWeight:500, display:'flex', alignItems:'center',
    boxShadow:'var(--sh-sm)',
  },
  sidebar: { width:248, display:'flex', flexDirection:'column', gap:12, overflowY:'auto' },
  sideCard: {
    background:'var(--surface)', border:'1px solid var(--border)',
    borderRadius:12, padding:'14px 16px', boxShadow:'var(--sh-xs)',
  },
  sideTitle2: { fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.75rem', color:'var(--text-1)' },
  toggleRow: { display:'flex', alignItems:'center', gap:8, cursor:'pointer' },
  toggle: { width:36, height:20, borderRadius:10, position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0 },
  knob:   { position:'absolute', top:3, width:14, height:14, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.4)' },
  sortBtn: { flex:1, padding:'6px 8px', borderRadius:7, fontSize:'0.7rem', fontWeight:600, cursor:'pointer', transition:'all 0.15s' },
  zoneRow: { display:'flex', alignItems:'center', gap:8, padding:'7px 9px', borderRadius:9, cursor:'pointer', marginBottom:3, border:'1px solid', transition:'all 0.15s' },
  expRow:  { display:'flex', alignItems:'center', gap:8, paddingBottom:9, marginBottom:9, borderBottom:'1px solid rgba(255,255,255,0.04)' },
}
