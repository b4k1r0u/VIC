import React, { useState, useEffect, useRef } from 'react'
import { SIMULATED_EVENTS } from '../data/constants'
import { Wifi, Zap, AlertTriangle, Phone, X, Clock, Activity } from 'lucide-react'

const magColor = m => m >= 5 ? 'var(--danger)' : m >= 4 ? 'var(--warning)' : 'var(--success)'
const magBg = m => m >= 5 ? 'var(--danger-muted)' : m >= 4 ? 'var(--warning-muted)' : 'var(--success-muted)'
const fmtTime = d => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
const fmtDate = d => d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })

const SEED_ALERTS = [
  { id: 10, time: new Date(Date.now() - 172800000), ...SIMULATED_EVENTS[4] },
  { id: 11, time: new Date(Date.now() - 86400000), ...SIMULATED_EVENTS[2] },
  { id: 12, time: new Date(Date.now() - 10800000), ...SIMULATED_EVENTS[1] },
  { id: 13, time: new Date(Date.now() - 900000), ...SIMULATED_EVENTS[0] },
]

export default function AlertsPage() {
  const [wsStatus, setWsStatus] = useState('connecting')
  const [alerts, setAlerts] = useState(SEED_ALERTS)
  const [majorAlert, setMajorAlert] = useState(null)
  const [flash, setFlash] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [epicentre, setEpicentre] = useState(null)
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
        background: flash ? 'rgba(220,38,38,0.02)' : 'transparent',
        transition: 'background 0.5s',
      }}
      className="page-fade"
    >
      {/* Major alert banner */}
      {majorAlert && (
        <div style={S.majorBanner} className="major-alert-flash">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                ALERTE SISMIQUE MAJEURE — M{majorAlert.magnitude}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{majorAlert.location}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={S.crisisBtn}>
              <Phone size={13} style={{ marginRight: 6 }} />
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
          { label: 'EMSC WebSocket', ok: wsStatus === 'connected', state: wsStatus === 'connected' ? 'CONNECTÉ' : 'CONNEXION...' },
          { label: 'USGS API', ok: true, state: 'CONNECTÉ' },
          { label: 'CRAAG Algérie', ok: null, state: 'SIMULÉ' },
        ].map(s => (
          <div key={s.label} style={S.statusItem}>
            <div style={{
              ...S.statusDot,
              background: s.ok === null ? 'var(--warning)' : s.ok ? 'var(--success)' : 'var(--text-quaternary)',
              animation: s.ok ? 'pulseDot 2s infinite' : 'none',
            }} />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem',
              color: s.ok === null ? 'var(--warning)' : s.ok ? 'var(--success)' : 'var(--text-quaternary)',
              fontWeight: 600,
            }}>
              ● {s.state}
            </span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={11} color="var(--text-quaternary)" />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', color: 'var(--text-quaternary)' }}>
            {fmtTime(lastUpdate)}
          </span>
        </div>
      </div>

      {wsStatus === 'connecting' ? (
        <div style={S.connectBox}>
          <div style={{ position: 'relative', width: 56, height: 56 }}>
            <div style={S.spinner} />
            <Wifi size={22} color="var(--primary-500)" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
          </div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Connexion à EMSC WebSocket...
          </div>
          <code style={{ fontSize: '0.68rem', color: 'var(--text-quaternary)', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 6 }}>
            wss://www.seismicportal.eu/standing_order/websocket
          </code>
        </div>
      ) : (
        <div style={S.layout}>
          {/* Feed column */}
          <div style={S.feedCard}>
            <div style={S.feedHead}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={14} color="var(--danger)" />
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  Flux en Temps Réel
                </span>
              </div>
              <span style={S.countBadge}>{alerts.length} événements</span>
            </div>
            <div style={S.feedScroll}>
              {alerts.map((a, i) => (
                <div key={a.id} style={{
                  ...S.alertRow,
                  borderLeft: `3px solid ${magColor(a.magnitude)}`,
                  background: a.isMajor ? 'var(--danger-muted)' : 'var(--surface)',
                  animation: i === 0 ? 'fadeIn 0.4s ease' : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        ...S.magBadge,
                        background: magBg(a.magnitude),
                        color: magColor(a.magnitude),
                      }}>
                        M{a.magnitude}
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', color: 'var(--text-quaternary)' }}>
                        {fmtDate(a.time)} · {fmtTime(a.time)}
                      </span>
                    </div>
                    {a.isMajor && <span style={S.majorChip}>MAJEUR</span>}
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                    {a.location}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-quaternary)', marginBottom: a.affectedWilayas?.length ? 8 : 0 }}>
                    Prof: {a.depth} km · {a.lat}°N {a.lon}°E
                  </div>
                  {a.affectedWilayas?.length > 0 ? (
                    <div style={S.impactBox}>
                      <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--warning)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Zap size={10} style={{ flexShrink: 0 }} />
                        IMPACT PORTEFEUILLE
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
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
              <div style={S.sideTitle}>Localisation Épicentre</div>
              <svg viewBox="0 0 500 370" style={{ width: '100%', height: 165 }}>
                <rect width="500" height="370" fill="var(--bg-subtle)" rx="8" />
                <path
                  d="M 45,72 L 95,58 L 175,50 L 255,47 L 330,48 L 408,52 L 452,68 L 462,95 L 455,128 L 440,158 L 432,192 L 424,232 L 416,274 L 405,320 L 385,362 L 348,370 L 295,368 L 240,366 L 187,358 L 148,340 L 122,310 L 100,278 L 80,245 L 62,212 L 48,178 L 42,140 Z"
                  fill="rgba(20,184,166,0.06)"
                  stroke="rgba(20,184,166,0.2)"
                  strokeWidth={1.5}
                />
                {epicentre && (
                  <g>
                    <circle cx={epicentre.x} cy={epicentre.y} r={24} fill="none" stroke="var(--danger)" strokeWidth={1} opacity={0.15} />
                    <circle cx={epicentre.x} cy={epicentre.y} r={12} fill="none" stroke="var(--danger)" strokeWidth={1.5} opacity={0.4} />
                    <circle cx={epicentre.x} cy={epicentre.y} r={4} fill="var(--danger)" />
                    <text x={epicentre.x + 8} y={epicentre.y - 8} fontSize={8} fill="var(--danger)" fontFamily="'JetBrains Mono'" fontWeight="600">
                      Épicentre
                    </text>
                  </g>
                )}
                {!epicentre && (
                  <text x={250} y={185} textAnchor="middle" fontSize={10} fill="var(--text-quaternary)" fontFamily="'Plus Jakarta Sans'">
                    En attente d'événement...
                  </text>
                )}
              </svg>
            </div>

            {/* Impact panel */}
            {latestMajor?.affectedWilayas?.length > 0 && (
              <div style={S.sideCard}>
                <div style={S.sideTitle}>Dernier Impact Calculé</div>
                <div style={{ marginBottom: 10 }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '1.2rem',
                    color: magColor(latestMajor.magnitude),
                  }}>M{latestMajor.magnitude}</span>
                </div>
                {[
                  ['Polices exposées', '~29 500', 'var(--danger)'],
                  ['Exposition SI', '~295 Mrd DZD', 'var(--warning)'],
                  ['Rétention nette', '~88 Mrd DZD', 'var(--warning)'],
                  ['Réassureur notifié', 'Swiss Re [SIM]', 'var(--success)'],
                ].map(([l, v, c]) => (
                  <div key={l} style={S.impactRow}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{l}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', fontWeight: 600, color: c }}>{v}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Scale */}
            <div style={S.sideCard}>
              <div style={S.sideTitle}>Échelle de Magnitude</div>
              {[
                ['< 4.0', 'Mineur', 'var(--success)'],
                ['4.0–5.0', 'Modéré', 'var(--warning)'],
                ['> 5.0', 'Majeur', 'var(--danger)'],
              ].map(([r, l, c]) => (
                <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 3, background: c }} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: c, fontWeight: 600 }}>M{r}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{l}</span>
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
  page: { flex: 1, overflowY: 'auto', padding: '14px 20px' },
  majorBanner: {
    background: 'linear-gradient(135deg,#dc2626,#991b1b)',
    border: '1px solid rgba(220,38,38,0.3)',
    borderRadius: 'var(--radius-lg)', padding: '14px 18px', marginBottom: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    color: '#fff',
  },
  crisisBtn: {
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.25)',
    color: '#fff', borderRadius: 6, padding: '7px 14px',
    fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center',
  },
  dismissBtn: {
    background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none',
    borderRadius: 6, padding: '7px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  statusStrip: {
    display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '8px 18px', marginBottom: 12,
    boxShadow: 'var(--shadow-card)',
  },
  statusItem: { display: 'flex', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  connectBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '55vh', gap: 16,
  },
  spinner: {
    width: 56, height: 56, border: '3px solid var(--border)',
    borderTop: '3px solid var(--primary-500)', borderRadius: '50%',
    animation: 'spin 0.9s linear infinite', position: 'absolute',
    top: 0, left: 0,
  },
  layout: {
    display: 'flex', gap: 12,
    height: 'calc(100vh - var(--topbar-h) - 110px)', minHeight: 380,
  },
  feedCard: {
    flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  feedHead: {
    padding: '12px 16px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'var(--bg-subtle)', flexShrink: 0,
  },
  countBadge: {
    background: 'var(--primary-50)',
    border: '1px solid rgba(20,184,166,0.15)',
    color: 'var(--primary-700)', borderRadius: 4,
    padding: '2px 10px', fontSize: '0.63rem', fontWeight: 600,
  },
  feedScroll: { flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 },
  alertRow: {
    borderRadius: 'var(--radius)', padding: '10px 12px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    transition: 'background 0.2s',
  },
  magBadge: {
    padding: '2px 8px', borderRadius: 4,
    fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: '0.72rem',
  },
  majorChip: {
    background: 'var(--danger-muted)', color: 'var(--danger)',
    border: '1px solid var(--danger-border)',
    fontSize: '0.6rem', fontWeight: 600, padding: '2px 8px', borderRadius: 4,
  },
  safeChip: {
    background: 'var(--success-muted)', color: 'var(--success)',
    border: '1px solid var(--success-border)',
    fontSize: '0.65rem', fontWeight: 500, padding: '3px 8px',
    borderRadius: 4, display: 'inline-block', marginTop: 2,
  },
  impactBox: {
    background: 'var(--warning-muted)',
    border: '1px solid var(--warning-border)',
    borderRadius: 6, padding: '8px 10px', marginTop: 4,
  },
  wChip: {
    background: 'var(--surface)', border: '1px solid var(--warning-border)',
    fontSize: '0.62rem', color: 'var(--warning)', padding: '2px 7px',
    borderRadius: 3, fontWeight: 500,
  },
  rightCol: { width: 260, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' },
  sideCard: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '12px 14px', boxShadow: 'var(--shadow-card)',
  },
  sideTitle: {
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
    fontSize: '0.78rem', color: 'var(--text-primary)', marginBottom: 10,
  },
  impactRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)',
  },
}
