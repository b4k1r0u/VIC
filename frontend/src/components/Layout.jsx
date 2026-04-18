import React, { useState } from 'react'
import { useClock } from '../hooks/useCountUp'
import {
  LayoutDashboard, Map, Zap, Scale, Bot, AlertTriangle,
  FlaskConical, ChevronLeft, ChevronRight, LogOut,
  Activity, Bell,
  ScanSearch,
} from 'lucide-react'

const PAGES = [
  { id:'overview',   Icon:LayoutDashboard, label:"Vue d'ensemble",   group:'main' },
  { id:'map',        Icon:Map,             label:'Carte des Risques', group:'main' },
  { id:'simulator',  Icon:Zap,             label:'Simulateur',        group:'main' },
  { id:'balance',    Icon:Scale,           label:'Équilibre',         group:'analyse' },
  { id:'ai',         Icon:Bot,             label:'Modèles IA',        group:'analyse' },
  { id:'parametric', Icon:ScanSearch,      label:'Paramétrique',      group:'analyse' },
  { id:'alerts',     Icon:AlertTriangle,   label:'Alertes Sismiques', group:'live', live:true },
  { id:'sandbox',    Icon:FlaskConical,    label:'Sandbox Souscription',group:'live' },
]

const GROUPS = [
  { key:'main',    label:'Tableau de Bord' },
  { key:'analyse', label:'Analyse'         },
  { key:'live',    label:'Temps Réel'      },
]

export function Sidebar({ current, onNavigate, user, onLogout }) {
  const [collapsed, setCollapsed] = useState(false)
  const [hovered, setHovered] = useState(null)

  return (
    <aside style={{ ...S.sidebar, width: collapsed ? 64 : 240 }}>
      {/* Logo */}
      <div style={S.logo}>
        <div style={S.logoIcon}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        {!collapsed && (
          <div style={{ flex:1, minWidth:0 }}>
            <div style={S.logoName}>RASED</div>
            <div style={S.logoTag}>Risk Intelligence</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(p => !p)}
          style={S.collapseBtn}
          title={collapsed ? 'Développer' : 'Réduire'}
        >
          {collapsed
            ? <ChevronRight size={13} />
            : <ChevronLeft size={13} />}
        </button>
      </div>

      {/* Nav */}
      <nav style={S.nav}>
        {GROUPS.map(g => (
          <div key={g.key} style={{ marginBottom: 4 }}>
            {!collapsed && (
              <div style={S.groupLabel}>{g.label}</div>
            )}
            {PAGES.filter(p => p.group === g.key).map(p => {
              const active = current === p.id
              const isHovered = hovered === p.id
              return (
                <div
                  key={p.id}
                  onClick={() => onNavigate(p.id)}
                  onMouseEnter={() => setHovered(p.id)}
                  onMouseLeave={() => setHovered(null)}
                  title={collapsed ? p.label : undefined}
                  style={{
                    ...S.navItem,
                    ...(active ? S.navItemActive : {}),
                    ...(isHovered && !active ? S.navItemHover : {}),
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? '10px 0' : '8px 12px',
                  }}
                >
                  <p.Icon
                    size={16}
                    strokeWidth={active ? 2 : 1.6}
                    color={active ? '#14b8a6' : 'rgba(255,255,255,0.4)'}
                    style={{ flexShrink:0, transition:'color 0.15s' }}
                  />
                  {!collapsed && (
                    <>
                      <span style={{
                        ...S.navLabel,
                        color: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
                        fontWeight: active ? 600 : 400,
                      }}>{p.label}</span>
                      {p.live && (
                        <span style={S.livePill}>
                          <span style={S.liveDot} />
                          LIVE
                        </span>
                      )}
                    </>
                  )}
                  {collapsed && p.live && (
                    <span style={{
                      ...S.liveDot,
                      position:'absolute', top:6, right:10,
                      width:4, height:4,
                    }} />
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User section */}
      <div style={S.userSection}>
        {user && (
          <div style={{ display:'flex', alignItems:'center', gap:10, flex:1, minWidth:0 }}>
            <div style={S.avatar}>{user.name[0]}</div>
            {!collapsed && (
              <div style={{ minWidth:0, flex:1 }}>
                <div style={S.userName}>{user.name}</div>
                <div style={S.userRole}>{user.role}</div>
              </div>
            )}
          </div>
        )}
        {!collapsed && (
          <button onClick={onLogout} style={S.logoutBtn} title="Déconnexion">
            <LogOut size={14} />
          </button>
        )}
      </div>
    </aside>
  )
}

export function Topbar({ pageId, user }) {
  const now  = useClock()
  const page = PAGES.find(p => p.id === pageId)
  const fmt  = d =>
    d.toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) +
    '  ' + d.toLocaleTimeString('fr-FR')

  return (
    <header style={S.topbar}>
      <div>
        <div style={S.topTitle}>
          {page && <page.Icon size={15} color="var(--primary-500)" style={{ marginRight:8, verticalAlign:'middle' }} />}
          {page?.label}
        </div>
        <div style={S.breadcrumb}>RASED · {page?.label}</div>
      </div>
      <div style={S.topRight}>
        <div style={S.pill}>
          <span style={S.pillDot} />
          Portefeuille Actif
        </div>
        <div style={S.clock}>{fmt(now)}</div>
        {user && (
          <div style={S.userChip}>
            <div style={{ ...S.topAvatar }}>{user.name[0]}</div>
            <div style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)' }}>{user.name}</div>
          </div>
        )}
      </div>
    </header>
  )
}

const S = {
  sidebar: {
    background:'var(--sidebar-bg)',
    borderRight:'1px solid var(--sidebar-border)',
    display:'flex', flexDirection:'column',
    height:'100vh', flexShrink:0,
    transition:'width 0.25s var(--ease-out)',
    overflow:'hidden', position:'relative',
  },
  logo: {
    display:'flex', alignItems:'center', gap:10,
    padding:'16px 16px 14px',
    borderBottom:'1px solid var(--sidebar-border)',
    flexShrink:0,
  },
  logoIcon: {
    width:32, height:32, borderRadius:8,
    background:'rgba(20,184,166,0.08)',
    border:'1px solid rgba(20,184,166,0.15)',
    display:'flex', alignItems:'center', justifyContent:'center',
    flexShrink:0,
  },
  logoName: {
    fontFamily:"'Space Grotesk', sans-serif", fontWeight:700, fontSize:'0.95rem',
    color:'#f1f5f9', lineHeight:1.1, letterSpacing:'0.3px',
  },
  logoTag: {
    fontSize:'0.55rem', color:'rgba(255,255,255,0.28)',
    letterSpacing:'1.5px', marginTop:2, textTransform:'uppercase',
  },
  collapseBtn: {
    background:'transparent',
    border:'1px solid rgba(255,255,255,0.06)',
    borderRadius:6, color:'rgba(255,255,255,0.35)', cursor:'pointer',
    padding:'5px 6px', transition:'all 0.15s', flexShrink:0,
    display:'flex', alignItems:'center', justifyContent:'center',
    marginLeft:'auto',
  },
  nav: { flex:1, overflowY:'auto', padding:'8px 8px' },
  groupLabel: {
    fontSize:'0.58rem', fontWeight:600, textTransform:'uppercase',
    letterSpacing:'1.5px', color:'rgba(255,255,255,0.18)',
    padding:'14px 8px 6px',
  },
  navItem: {
    display:'flex', alignItems:'center', gap:10,
    borderRadius:8, cursor:'pointer', marginBottom:1,
    fontSize:'0.8rem', fontWeight:400,
    transition:'all 0.12s', position:'relative',
  },
  navItemActive: {
    background:'rgba(20,184,166,0.08)',
  },
  navItemHover: {
    background:'rgba(255,255,255,0.03)',
  },
  navLabel: {
    flex:1, whiteSpace:'nowrap', overflow:'hidden',
    textOverflow:'ellipsis', fontSize:'0.8rem',
    transition:'color 0.12s',
  },
  livePill: {
    display:'flex', alignItems:'center', gap:4,
    background:'rgba(220,38,38,0.12)',
    border:'1px solid rgba(220,38,38,0.2)',
    borderRadius:4, padding:'1px 6px',
    fontSize:'0.55rem', fontWeight:700, color:'#f87171',
    flexShrink:0, letterSpacing:'0.5px',
  },
  liveDot: {
    width:4, height:4, borderRadius:'50%', background:'#ef4444',
    display:'inline-block', animation:'pulseDot 1.5s infinite',
  },
  userSection: {
    padding:'12px 14px',
    borderTop:'1px solid var(--sidebar-border)',
    display:'flex', alignItems:'center', gap:8, flexShrink:0,
  },
  avatar: {
    width:30, height:30, borderRadius:8,
    background:'linear-gradient(135deg, #0f766e, #14b8a6)',
    color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
    fontWeight:600, fontSize:'0.75rem', flexShrink:0,
  },
  userName: {
    fontSize:'0.75rem', fontWeight:600, color:'rgba(255,255,255,0.88)',
    whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
  },
  userRole: {
    fontSize:'0.6rem', color:'rgba(255,255,255,0.4)',
    whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
  },
  logoutBtn: {
    marginLeft:'auto', background:'transparent',
    border:'1px solid rgba(255,255,255,0.06)',
    borderRadius:6, padding:'6px 7px', cursor:'pointer',
    color:'rgba(255,255,255,0.35)', transition:'all 0.15s',
    display:'flex', alignItems:'center', justifyContent:'center',
    flexShrink:0,
  },
  topbar: {
    height:'var(--topbar-h)',
    background:'var(--surface)',
    borderBottom:'1px solid var(--border)',
    padding:'0 24px', display:'flex', alignItems:'center',
    justifyContent:'space-between', flexShrink:0,
  },
  topTitle: {
    fontFamily:"'Space Grotesk', sans-serif", fontWeight:600,
    fontSize:'0.9rem', color:'var(--text-primary)', display:'flex', alignItems:'center',
  },
  breadcrumb: { fontSize:'0.65rem', color:'var(--text-quaternary)', marginTop:1, letterSpacing:'0.3px' },
  topRight: { display:'flex', alignItems:'center', gap:12 },
  pill: {
    display:'flex', alignItems:'center', gap:6,
    background:'var(--primary-50)',
    border:'1px solid rgba(20,184,166,0.15)',
    borderRadius:6, padding:'4px 12px',
    fontSize:'0.7rem', fontWeight:600, color:'var(--primary-700)',
  },
  pillDot: {
    width:5, height:5, borderRadius:'50%', background:'var(--primary-500)',
    display:'inline-block', animation:'pulseDot 2s infinite',
  },
  clock: {
    fontFamily:"'JetBrains Mono', monospace", fontSize:'0.65rem',
    color:'var(--text-quaternary)',
  },
  userChip: {
    display:'flex', alignItems:'center', gap:8,
    background:'var(--bg-subtle)',
    border:'1px solid var(--border)',
    borderRadius:8, padding:'4px 12px 4px 4px',
  },
  topAvatar: {
    width:26, height:26, borderRadius:6,
    background:'linear-gradient(135deg, #0f766e, #14b8a6)',
    color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
    fontWeight:600, fontSize:'0.65rem', flexShrink:0,
  },
}
