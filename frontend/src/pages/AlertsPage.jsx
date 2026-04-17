import React, { useState, useEffect, useRef } from 'react'
import { SIMULATED_EVENTS } from '../data/constants'
import { Wifi, WifiOff, Zap, AlertTriangle, Phone, X, Clock, Activity } from 'lucide-react'

const magColor = m => m >= 5 ? '#ef4444' : m >= 4 ? '#f59e0b' : '#22c55e'
const magBg    = m => m >= 5 ? 'rgba(239,68,68,0.12)' : m >= 4 ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)'
const fmtTime  = d => d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit', second:'2-digit' })
const fmtDate  = d => d.toLocaleDateString('fr-FR', { day:'2-digit', month:'short' })

const SEED_ALERTS = [
  { id:10, time: new Date(Date.now()-172800000), ...SIMULATED_EVENTS[4] },
  { id:11, time: new Date(Date.now()-86400000),  ...SIMULATED_EVENTS[2] },
  { id:12, time: new Date(Date.now()-10800000),  ...SIMULATED_EVENTS[1] },
  { id:13, time: new Date(Date.now()-900000),    ...SIMULATED_EVENTS[0] },
]

export default function AlertsPage() {
  const [wsStatus, setWsStatus]     = useState('connecting')
  const [alerts, setAlerts]         = useState(SEED_ALERTS)
  const [majorAlert, setMajorAlert] = useState(null)
  const [flash, setFlash]           = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [epicentre, setEpicentre]   = useState(null)
  const eventIdx = useRef(0)

  useEffect(() => {
    const t = setTimeout(() => setWsStatus('connected'), 1800)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (wsStatus !== 'connected') return
    let to
    const scheduleNext = () => {
      to = setTimeout(() => {
        const ev = SIMULATED_EVENTS[eventIdx.current % SIMULATED_EVENTS.length]
        eventIdx.current++
        const alert = { id: Date.now(), time: new Date(), ...ev }
        setAlerts(prev => [alert, ...prev].slice(0, 30))
        setLastUpdate(new Date())
        setEpicentre({ x: 60 + (ev.lon + 2) * 23, y: 195 - (ev.lat - 33) * 14 })
        if (ev.magnitude >= 4.0) { setFlash(true); setTimeout(() => setFlash(false), 1000) }
        if (ev.isMajor) { setMajorAlert(alert); setTimeout(() => setMajorAlert(null), 14000) }
        scheduleNext()
      }, 9000 + Math.random() * 11000)
    }
    scheduleNext()
    return () => clearTimeout(to)
  }, [wsStatus])

  const latestMajor = alerts[0]

  return (
    <main
      style={{
        ...S.page,
        background: flash ? 'rgba(239,68,68,0.04)' : 'transparent',
        transition: 'background 0.5s',
      }}
      className="page-fade"
    >
      {/* Major alert banner */}
      {majorAlert && (
        <div style={S.majorBanner} className="major-alert-flash">
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <AlertTriangle size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1rem', color:'#fff', letterSpacing:'-0.3px' }}>
                ALERTE SISMIQUE MAJEURE — M{majorAlert.magnitude}
              </div>
              <div style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.85)', marginTop:2 }}>{majorAlert.location}</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button style={S.crisisBtn}>
              <Phone size={13} style={{ marginRight:6 }} />
              Protocole de Crise
            </button>
            <button onClick={() => setMajorAlert(null)} style={S.dismissBtn}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Status strip */}
      <div style={S.statusStrip}>
        {[
          { label:'EMSC WebSocket', ok: wsStatus==='connected', state: wsStatus==='connected' ? 'CONNECTÉ' : 'CONNEXION...' },
          { label:'USGS API',       ok: true,  state:'CONNECTÉ' },
          { label:'CRAAG Algérie',  ok: null,  state:'SIMULÉ'   },
        ].map(s => (
          <div key={s.label} style={S.statusItem}>
            <div style={{
              ...S.statusDot,
              background: s.ok===null ? '#f59e0b' : s.ok ? '#22c55e' : '#64748b',
              animation: s.ok ? 'pulseDot 1.5s infinite' : 'none',
              boxShadow: s.ok===null ? '0 0 8px rgba(245,158,11,0.5)' : s.ok ? '0 0 8px rgba(34,197,94,0.5)' : 'none',
            }} />
            <span style={{ fontSize:'0.68rem', color:'var(--text-2)', fontWeight:600 }}>{s.label}</span>
            <span style={{
              fontFamily:'JetBrains Mono,monospace', fontSize:'0.6rem',
              color: s.ok===null ? '#f59e0b' : s.ok ? '#22c55e' : '#64748b',
              fontWeight:700,
            }}>
              ● {s.state}
            </span>
          </div>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
          <Clock size={11} color="var(--text-3)" />
          <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'0.6rem', color:'var(--text-3)' }}>
            {fmtTime(lastUpdate)}
          </span>
        </div>
      </div>

      {wsStatus === 'connecting' ? (
        <div style={S.connectBox}>
          <div style={{ position:'relative', width:64, height:64 }}>
            <div style={S.spinner} />
            <Wifi size={24} color="var(--g500)" style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)' }} />
          </div>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, color:'var(--text-2)', fontSize:'1rem' }}>
            Connexion à EMSC WebSocket...
          </div>
          <code style={{ fontSize:'0.68rem', color:'var(--text-3)', background:'var(--surface)', border:'1px solid var(--border)', padding:'6px 12px', borderRadius:8 }}>
            wss://www.seismicportal.eu/standing_order/websocket
          </code>
        </div>
      ) : (
        <div style={S.layout}>
          {/* Feed column */}
          <div style={S.feedCard}>
            <div style={S.feedHead}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Activity size={15} color="#ef4444" />
                <span style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.85rem', color:'var(--text-1)' }}>
                  Flux en Temps Réel
                </span>
              </div>
              <span style={S.countBadge}>{alerts.length} événements</span>
            </div>
            <div style={S.feedScroll}>
              {alerts.map((a, i) => (
                <div key={a.id} style={{
                  ...S.alertRow,
                  borderLeft:`3px solid ${magColor(a.magnitude)}`,
                  background: a.isMajor ? 'rgba(239,68,68,0.06)' : 'var(--surface2)',
                  animation: i === 0 ? 'fadeIn 0.4s ease' : 'none',
                }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{
                        ...S.magBadge,
                        background:magBg(a.magnitude),
                        color:magColor(a.magnitude),
                        border:`1px solid ${magColor(a.magnitude)}30`,
                      }}>
                        M{a.magnitude}
                      </span>
                      <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'0.6rem', color:'var(--text-3)' }}>
                        {fmtDate(a.time)} · {fmtTime(a.time)}
                      </span>
                    </div>
                    {a.isMajor && <span style={S.majorChip}>🔴 MAJEUR</span>}
                  </div>
                  <div style={{ fontSize:'0.78rem', fontWeight:600, color:'var(--text-1)', marginBottom:3 }}>
                    {a.location}
                  </div>
                  <div style={{ fontSize:'0.65rem', color:'var(--text-3)', marginBottom: a.affectedWilayas?.length ? 8 : 0 }}>
                    Prof: {a.depth} km · {a.lat}°N {a.lon}°E
                  </div>
                  {a.affectedWilayas?.length > 0 ? (
                    <div style={S.impactBox}>
                      <div style={{ fontSize:'0.6rem', fontWeight:700, color:'#fbbf24', marginBottom:6, display:'flex', alignItems:'center', gap:5 }}>
                        <Zap size={10} style={{ flexShrink:0 }} />
                        IMPACT PORTEFEUILLE
                      </div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                        {a.affectedWilayas.map(w => (
                          <span key={w} style={S.wChip}>{w}</span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span style={S.safeChip}>✅ Hors portefeuille principal</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div style={S.rightCol}>
            {/* Mini map */}
            <div style={S.sideCard}>
              <div style={S.sideTitle}>🗺️ Localisation Épicentre</div>
              <svg viewBox="0 0 500 370" style={{ width:'100%', height:175 }}>
                <rect width="500" height="370" fill="#0a0f1e" />
                <path
                  d="M 45,72 L 95,58 L 175,50 L 255,47 L 330,48 L 408,52 L 452,68 L 462,95 L 455,128 L 440,158 L 432,192 L 424,232 L 416,274 L 405,320 L 385,362 L 348,370 L 295,368 L 240,366 L 187,358 L 148,340 L 122,310 L 100,278 L 80,245 L 62,212 L 48,178 L 42,140 Z"
                  fill="rgba(34,197,94,0.06)"
                  stroke="rgba(34,197,94,0.25)"
                  strokeWidth={1.5}
                />
                {epicentre && (
                  <g>
                    <circle cx={epicentre.x} cy={epicentre.y} r={28} fill="none" stroke="#ef4444" strokeWidth={1} opacity={0.2} />
                    <circle cx={epicentre.x} cy={epicentre.y} r={15} fill="none" stroke="#ef4444" strokeWidth={1.5} opacity={0.5} />
                    <circle cx={epicentre.x} cy={epicentre.y} r={5} fill="#ef4444" />
                    <text x={epicentre.x+8} y={epicentre.y-8} fontSize={8} fill="#f87171" fontFamily="JetBrains Mono" fontWeight="700">
                      Épicentre
                    </text>
                  </g>
                )}
                {!epicentre && (
                  <text x={250} y={185} textAnchor="middle" fontSize={10} fill="#475569" fontFamily="Plus Jakarta Sans">
                    En attente d'événement...
                  </text>
                )}
              </svg>
            </div>

            {/* Impact panel */}
            {latestMajor?.affectedWilayas?.length > 0 && (
              <div style={S.sideCard}>
                <div style={S.sideTitle}>⚡ Dernier Impact Calculé</div>
                <div style={{ marginBottom:10 }}>
                  <span style={{
                    fontFamily:'JetBrains Mono,monospace', fontWeight:800, fontSize:'1.3rem',
                    color:magColor(latestMajor.magnitude),
                  }}>M{latestMajor.magnitude}</span>
                </div>
                {[
                  ['Polices exposées',    '~29 500',       '#ef4444'],
                  ['Exposition SI',       '~295 Mrd DZD',  '#f59e0b'],
                  ['Rétention nette',     '~88 Mrd DZD',   '#f59e0b'],
                  ['Réassureur notifié',  'Swiss Re [SIM]','#22c55e'],
                ].map(([l,v,c]) => (
                  <div key={l} style={S.impactRow}>
                    <span style={{ fontSize:'0.67rem', color:'var(--text-2)' }}>{l}</span>
                    <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'0.7rem', fontWeight:700, color:c }}>{v}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Scale */}
            <div style={S.sideCard}>
              <div style={S.sideTitle}>Échelle de Magnitude</div>
              {[
                ['< 4.0', 'Mineur',  '#22c55e'],
                ['4.0–5.0','Modéré', '#f59e0b'],
                ['> 5.0', 'Majeur',  '#ef4444'],
              ].map(([r,l,c]) => (
                <div key={r} style={{ display:'flex', alignItems:'center', gap:9, marginBottom:9 }}>
                  <div style={{ width:9, height:9, borderRadius:'50%', background:c, boxShadow:`0 0 8px ${c}60` }} />
                  <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'0.68rem', color:c, fontWeight:600 }}>M{r}</span>
                  <span style={{ fontSize:'0.68rem', color:'var(--text-3)' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

const S = {
  page: { flex:1, overflowY:'auto', padding:'16px 24px' },
  majorBanner: {
    background:'linear-gradient(135deg,#dc2626,#7f1d1d)',
    border:'1px solid rgba(239,68,68,0.4)',
    borderRadius:14, padding:'16px 20px', marginBottom:14,
    display:'flex', alignItems:'center', justifyContent:'space-between', gap:12,
    boxShadow:'0 8px 32px rgba(239,68,68,0.3)',
    color:'#fff',
  },
  crisisBtn: {
    background:'rgba(255,255,255,0.15)',
    border:'1px solid rgba(255,255,255,0.3)',
    color:'#fff', borderRadius:8, padding:'8px 14px',
    fontSize:'0.72rem', fontWeight:700, cursor:'pointer',
    display:'flex', alignItems:'center',
  },
  dismissBtn: {
    background:'rgba(255,255,255,0.1)', color:'#fff', border:'none',
    borderRadius:8, padding:'8px', cursor:'pointer',
    display:'flex', alignItems:'center', justifyContent:'center',
  },
  statusStrip: {
    display:'flex', alignItems:'center', gap:20, flexWrap:'wrap',
    background:'var(--surface)', border:'1px solid var(--border)',
    borderRadius:12, padding:'10px 20px', marginBottom:14,
    boxShadow:'var(--sh-sm)',
  },
  statusItem: { display:'flex', alignItems:'center', gap:7 },
  statusDot:  { width:8, height:8, borderRadius:'50%', flexShrink:0 },
  connectBox: {
    display:'flex', flexDirection:'column', alignItems:'center',
    justifyContent:'center', height:'55vh', gap:18,
  },
  spinner: {
    width:64, height:64, border:'3px solid rgba(34,197,94,0.1)',
    borderTop:'3px solid var(--g500)', borderRadius:'50%',
    animation:'spin 0.9s linear infinite', position:'absolute',
    top:0, left:0,
  },
  layout: {
    display:'flex', gap:14,
    height:'calc(100vh - var(--topbar-h) - 120px)', minHeight:380,
  },
  feedCard: {
    flex:1, background:'var(--surface)', border:'1px solid var(--border)',
    borderRadius:14, boxShadow:'var(--sh-sm)',
    display:'flex', flexDirection:'column', overflow:'hidden',
  },
  feedHead: {
    padding:'14px 18px', borderBottom:'1px solid var(--border)',
    display:'flex', alignItems:'center', justifyContent:'space-between',
    background:'rgba(255,255,255,0.02)', flexShrink:0,
  },
  countBadge: {
    background:'rgba(34,197,94,0.1)',
    border:'1px solid rgba(34,197,94,0.2)',
    color:'var(--g400)', borderRadius:20,
    padding:'2px 10px', fontSize:'0.62rem', fontWeight:700,
  },
  feedScroll: { flex:1, overflowY:'auto', padding:'10px 12px', display:'flex', flexDirection:'column', gap:8 },
  alertRow: {
    borderRadius:10, padding:'11px 13px',
    border:'1px solid var(--border)',
    transition:'background 0.2s',
  },
  magBadge: {
    padding:'2px 9px', borderRadius:6,
    fontFamily:'JetBrains Mono,monospace', fontWeight:700, fontSize:'0.73rem',
  },
  majorChip: {
    background:'rgba(239,68,68,0.15)', color:'#f87171',
    border:'1px solid rgba(239,68,68,0.3)',
    fontSize:'0.6rem', fontWeight:700, padding:'2px 8px', borderRadius:6,
  },
  safeChip: {
    background:'rgba(34,197,94,0.1)', color:'#4ade80',
    border:'1px solid rgba(34,197,94,0.2)',
    fontSize:'0.62rem', fontWeight:600, padding:'3px 9px',
    borderRadius:6, display:'inline-block', marginTop:2,
  },
  impactBox: {
    background:'rgba(245,158,11,0.07)',
    border:'1px solid rgba(245,158,11,0.2)',
    borderRadius:8, padding:'8px 10px', marginTop:4,
  },
  wChip: {
    background:'rgba(255,255,255,0.05)', border:'1px solid rgba(245,158,11,0.2)',
    fontSize:'0.6rem', color:'#fbbf24', padding:'2px 7px',
    borderRadius:4, fontWeight:600,
  },
  rightCol: { width:274, display:'flex', flexDirection:'column', gap:12, overflowY:'auto' },
  sideCard: {
    background:'var(--surface)', border:'1px solid var(--border)',
    borderRadius:12, padding:'14px 16px', boxShadow:'var(--sh-sm)',
  },
  sideTitle: {
    fontFamily:'Syne,sans-serif', fontWeight:700,
    fontSize:'0.75rem', color:'var(--text-1)', marginBottom:12,
  },
  impactRow: {
    display:'flex', justifyContent:'space-between', alignItems:'center',
    marginBottom:8, paddingBottom:8, borderBottom:'1px solid var(--border)',
  },
}
