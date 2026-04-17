import React, { useState } from 'react'
import { useClock } from '../hooks/useCountUp'
import {
  LayoutDashboard, Map, Zap, Scale, Bot, AlertTriangle,
  FlaskConical, ChevronLeft, ChevronRight, LogOut,
  Shield, Activity, Bell,
} from 'lucide-react'

const PAGES = [
  { id:'overview',   Icon:LayoutDashboard, label:"Vue d'ensemble",   group:'main' },
  { id:'map',        Icon:Map,             label:'Carte des Risques', group:'main' },
  { id:'simulator',  Icon:Zap,             label:'Simulateur',        group:'main' },
  { id:'balance',    Icon:Scale,           label:'Équilibre',         group:'analyse' },
  { id:'ai',         Icon:Bot,             label:'Stratégie & Optimisation',group:'analyse' },
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

  return (
    <aside style={{ ...S.sidebar, width: collapsed ? 64 : 232 }}>
      {/* Logo */}
      <div style={S.logo}>
        <div style={S.logoIcon}>
          <Shield size={18} color="#22c55e" />
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
            ? <ChevronRight size={14} />
            : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav */}
      <nav style={S.nav}>
        {GROUPS.map(g => (
          <div key={g.key} style={{ marginBottom: 6 }}>
            {!collapsed && (
              <div style={S.groupLabel}>{g.label}</div>
            )}
            {PAGES.filter(p => p.group === g.key).map(p => {
              const active = current === p.id
              return (
                <div
                  key={p.id}
                  onClick={() => onNavigate(p.id)}
                  title={collapsed ? p.label : undefined}
                  className={active ? 'nav-active-glow' : ''}
                  style={{
                    ...S.navItem,
                    ...(active ? S.navItemActive : {}),
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? '10px 0' : '9px 12px',
                  }}
                >
                  <p.Icon
                    size={16}
                    strokeWidth={active ? 2.2 : 1.8}
                    color={active ? '#22c55e' : 'rgba(255,255,255,0.45)'}
                    style={{ flexShrink:0, transition:'color 0.15s' }}
                  />
                  {!collapsed && (
                    <>
                      <span style={{
                        ...S.navLabel,
                        color: active ? '#e2e8f0' : 'rgba(255,255,255,0.50)',
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
                      position:'absolute', top:6, right:6,
                      width:5, height:5,
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
          <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0 }}>
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
          {page && <page.Icon size={15} color="var(--g500)" style={{ marginRight:8, verticalAlign:'middle' }} />}
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
            <div style={{ ...S.avatar, width:26, height:26, fontSize:'0.7rem' }}>{user.name[0]}</div>
            <div style={{ fontSize:'0.72rem', fontWeight:600, color:'var(--text-2)' }}>{user.name}</div>
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
    transition:'width 0.24s cubic-bezier(0.16,1,0.3,1)',
    overflow:'hidden', position:'relative',
  },
  logo: {
    display:'flex', alignItems:'center', gap:10,
    padding:'16px 14px 12px',
    borderBottom:'1px solid var(--sidebar-border)',
    flexShrink:0,
  },
  logoIcon: {
    width:32, height:32, borderRadius:9,
    background:'rgba(34,197,94,0.12)',
    border:'1px solid rgba(34,197,94,0.2)',
    display:'flex', alignItems:'center', justifyContent:'center',
    flexShrink:0,
  },
  logoName: {
    fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'0.95rem',
    color:'#f1f5f9', lineHeight:1.1, letterSpacing:'0.5px',
  },
  logoTag: {
    fontSize:'0.53rem', color:'rgba(255,255,255,0.3)',
    letterSpacing:'1px', marginTop:2, textTransform:'uppercase',
  },
  collapseBtn: {
    background:'rgba(255,255,255,0.05)',
    border:'1px solid rgba(255,255,255,0.08)',
    borderRadius:7, color:'rgba(255,255,255,0.4)', cursor:'pointer',
    padding:'5px 6px', transition:'all 0.15s', flexShrink:0,
    display:'flex', alignItems:'center', justifyContent:'center',
    marginLeft:'auto',
  },
  nav: { flex:1, overflowY:'auto', padding:'10px 8px' },
  groupLabel: {
    fontSize:'0.54rem', fontWeight:700, textTransform:'uppercase',
    letterSpacing:'2px', color:'rgba(255,255,255,0.22)',
    padding:'10px 8px 6px',
  },
  navItem: {
    display:'flex', alignItems:'center', gap:9,
    borderRadius:9, cursor:'pointer', marginBottom:2,
    fontSize:'0.78rem', fontWeight:500,
    transition:'all 0.14s', position:'relative',
  },
  navItemActive: {
    background:'rgba(34,197,94,0.10)',
  },
  navLabel: {
    flex:1, whiteSpace:'nowrap', overflow:'hidden',
    textOverflow:'ellipsis', fontSize:'0.78rem', fontWeight:500,
    transition:'color 0.14s',
  },
  livePill: {
    display:'flex', alignItems:'center', gap:4,
    background:'rgba(239,68,68,0.15)',
    border:'1px solid rgba(239,68,68,0.25)',
    borderRadius:6, padding:'2px 6px',
    fontSize:'0.52rem', fontWeight:700, color:'#f87171',
    flexShrink:0,
  },
  liveDot: {
    width:5, height:5, borderRadius:'50%', background:'#ef4444',
    display:'inline-block', animation:'pulseDot 1.5s infinite',
  },
  userSection: {
    padding:'10px 12px',
    borderTop:'1px solid var(--sidebar-border)',
    display:'flex', alignItems:'center', gap:8, flexShrink:0,
  },
  avatar: {
    width:30, height:30, borderRadius:8,
    background:'linear-gradient(135deg,var(--g600),var(--g400))',
    border:'1px solid rgba(34,197,94,0.3)',
    color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
    fontWeight:700, fontSize:'0.8rem', flexShrink:0,
  },
  userName: {
    fontSize:'0.72rem', fontWeight:600, color:'rgba(255,255,255,0.9)',
    whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
  },
  userRole: {
    fontSize:'0.58rem', color:'rgba(255,255,255,0.5)',
    whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
  },
  logoutBtn: {
    marginLeft:'auto', background:'rgba(255,255,255,0.05)',
    border:'1px solid rgba(255,255,255,0.08)',
    borderRadius:7, padding:'6px 7px', cursor:'pointer',
    color:'rgba(255,255,255,0.4)', transition:'all 0.15s',
    display:'flex', alignItems:'center', justifyContent:'center',
    flexShrink:0,
  },
  topbar: {
    height:'var(--topbar-h)',
    background:'#ffffff',
    backdropFilter:'blur(16px)',
    WebkitBackdropFilter:'blur(16px)',
    borderBottom:'1px solid rgba(0,0,0,0.07)',
    padding:'0 28px', display:'flex', alignItems:'center',
    justifyContent:'space-between', flexShrink:0,
    boxShadow:'0 1px 6px rgba(0,0,0,0.06)',
  },
  topTitle: {
    fontFamily:'Syne, sans-serif', fontWeight:700,
    fontSize:'0.88rem', color:'var(--text-1)', display:'flex', alignItems:'center',
  },
  breadcrumb: { fontSize:'0.6rem', color:'var(--text-3)', marginTop:2, letterSpacing:'0.5px' },
  topRight: { display:'flex', alignItems:'center', gap:14 },
  pill: {
    display:'flex', alignItems:'center', gap:6,
    background:'rgba(34,197,94,0.08)',
    border:'1px solid rgba(34,197,94,0.18)',
    borderRadius:20, padding:'4px 12px',
    fontSize:'0.68rem', fontWeight:600, color:'var(--g600)',
  },
  pillDot: {
    width:6, height:6, borderRadius:'50%', background:'var(--g500)',
    display:'inline-block', animation:'pulseDot 1.5s infinite',
  },
  clock: {
    fontFamily:'JetBrains Mono,monospace', fontSize:'0.62rem',
    color:'var(--text-3)',
  },
  userChip: {
    display:'flex', alignItems:'center', gap:8,
    background:'var(--surface2)',
    border:'1px solid var(--border)',
    borderRadius:10, padding:'4px 12px 4px 6px',
  },
}
