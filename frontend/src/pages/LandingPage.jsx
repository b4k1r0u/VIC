import React, { useState, useEffect } from 'react'
import { useCountUp } from '../hooks/useCountUp'
import { Shield, Map, Zap, Bell, Scale, Bot, FlaskConical, ArrowRight, ExternalLink } from 'lucide-react'

/* ── Seismic wave SVG ── */
function SeismicWave({ color = '#14b8a6', opacity = 0.12 }) {
  return (
    <svg viewBox="0 0 900 40" style={{ width: '100%', height: 40 }} preserveAspectRatio="none">
      <polyline
        points="0,20 30,8 60,28 90,12 120,30 150,5 180,25 210,10 240,28 270,8 300,22 330,4 360,28 390,12 420,30 450,6 480,24 510,14 540,28 570,8 600,20 630,10 660,28 690,6 720,24 750,10 780,28 810,6 840,22 870,12 900,20"
        fill="none" stroke={color} strokeWidth="2" opacity={opacity}
      />
    </svg>
  )
}

/* ── Animated stat counter ── */
function StatCard({ value, label, suffix = '', prefix = '' }) {
  const [visible, setVisible] = useState(false)
  const count = useCountUp(visible ? value : 0, 1800)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 400)
    return () => clearTimeout(t)
  }, [])
  return (
    <div style={S.statCard}>
      <div style={S.statValue}>
        {prefix}<span style={{ animation: visible ? 'countPulse 0.4s ease' : 'none' }}>
          {value >= 1000 ? Math.round(count).toLocaleString('fr-FR') : count.toFixed(count < 10 ? 1 : 0)}
        </span>{suffix}
      </div>
      <div style={S.statLabel}>{label}</div>
    </div>
  )
}

const FEATURES = [
  { Icon: Map, color: '#2563eb', title: 'Carte Interactive', desc: 'Visualisation Leaflet temps réel des 48 wilayas avec exposition par zone RPA99.' },
  { Icon: Zap, color: '#7c3aed', title: 'Simulateur Monte Carlo', desc: 'Calcul de PML et VaR sur 8 000 itérations pour chaque scénario catastrophe.' },
  { Icon: Bell, color: '#dc2626', title: 'Alertes Sismiques LIVE', desc: 'Flux WebSocket EMSC en temps réel avec calcul automatique d\'impact portefeuille.' },
  { Icon: Scale, color: '#059669', title: 'Bilan & Rééquilibrage', desc: 'Score de balance et feuille de route stratégique pour optimiser la concentration.' },
  { Icon: Bot, color: '#d97706', title: 'Analyses & Optimisations', desc: 'Note stratégique générée automatiquement pour la direction générale.' },
  { Icon: FlaskConical, color: '#0d9488', title: 'Sandbox Souscription', desc: 'Test d\'impact d\'une nouvelle police avant approbation définitive.' },
]

/* ── Feature card ── */
function FeatureCard({ Icon, color, title, desc }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      style={{
        ...S.featureCard,
        transform: hov ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hov ? 'var(--shadow-lg)' : 'var(--shadow-card)',
        borderColor: hov ? `${color}30` : 'var(--border)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{ ...S.featureIcon, background: `${color}08`, border: `1px solid ${color}18` }}>
        <Icon size={20} color={color} strokeWidth={1.8} />
      </div>
      <div style={S.featureTitle}>{title}</div>
      <div style={S.featureDesc}>{desc}</div>
      <div style={{ ...S.featureArrow, color, opacity: hov ? 1 : 0.4, transform: hov ? 'translateX(4px)' : 'none', transition: 'all 0.2s' }}>
        <ArrowRight size={16} />
      </div>
    </div>
  )
}

export default function LandingPage({ onLogin }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const el = document.getElementById('landing-root')
    if (!el) return
    const handler = () => setScrolled(el.scrollTop > 40)
    el.addEventListener('scroll', handler)
    return () => el.removeEventListener('scroll', handler)
  }, [])

  return (
    <div id="landing-root" style={S.root}>
      {/* ── Navbar ── */}
      <nav style={{
        ...S.navbar,
        boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
        background: scrolled ? 'rgba(248,250,252,0.97)' : 'transparent',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      }}>
        <div style={S.logoBrand}>
          <div style={S.logoIcon}>
            <Shield size={16} color="var(--primary-600)" />
          </div>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', lineHeight: 1 }}>رَصْد RASED</div>
            <div style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)', letterSpacing: '1px', textTransform: 'uppercase' }}>Risque Assurantiel Sismique</div>
          </div>
        </div>
        <div style={S.navLinks}>
          {['Fonctionnalités', 'Données', 'À Propos'].map(l => (
            <a key={l} href="#" style={S.navLink}>{l}</a>
          ))}
          <button onClick={onLogin} style={S.navCta}>
            Accéder <ArrowRight size={13} style={{ marginLeft: 6 }} />
          </button>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section style={S.hero}>
        <div style={S.heroBg} />
        <div style={S.heroGrid} />

        <div style={S.heroContent}>
          <div style={S.heroBadge}>
            <span style={S.heroBadgeDot} />
            Plateforme Risk Management IARD · Algérie 2025
          </div>

          <h1 style={S.heroH1}>
            Gestion Interactive<br />
            <span style={S.heroH1Accent}>des Risques Sismiques</span>
          </h1>
          <p style={S.heroSub}>
            RASED centralise l'exposition de votre portefeuille IARD face aux risques sismiques algériens. Simulez, analysez et rééquilibrez vos engagements pour une prise de décision stratégique optimale.
          </p>

          <div style={S.heroActions}>
            <button onClick={onLogin} style={S.heroPrimaryBtn}>
              Accéder à la Plateforme →
            </button>
            <button style={S.heroSecondaryBtn}>
              <ExternalLink size={14} style={{ marginRight: 7 }} />
              Voir la Démo
            </button>
          </div>

          <div style={S.heroBadges}>
            {['RPA99 Compliant', 'EMSC WebSocket', 'Monte Carlo Engine', 'Recharts Analytics'].map(b => (
              <span key={b} style={S.techBadge}>{b}</span>
            ))}
          </div>
        </div>

        {/* Hero visual */}
        <div style={S.heroVisual}>
          <div style={S.heroCard1}>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-quaternary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.8px' }}>BALANCE SCORE</div>
            <div style={{ fontSize: '2rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--warning)', lineHeight: 1 }}>47/100</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--primary-600)', marginTop: 4 }}>↑ Objectif 82 en 2028</div>
          </div>
          <div style={S.heroCard2}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', animation: 'pulseDot 1.5s infinite' }} />
              <span style={{ fontSize: '0.63rem', color: 'var(--success)', fontWeight: 600 }}>LIVE</span>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-quaternary)', marginLeft: 'auto' }}>EMSC WebSocket</span>
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>M3.7 — Sétif</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: 2 }}>Zone IIa · 18 km depth</div>
          </div>
          <div style={S.heroPillars}>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-quaternary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>Zone Distribution</div>
            {[
              { label: 'Zone III', pct: 30.5, color: '#dc2626' },
              { label: 'Zone IIa', pct: 43.2, color: '#ca8a04' },
              { label: 'Zone I', pct: 7.9, color: '#059669' },
            ].map(z => (
              <div key={z.label} style={{ marginBottom: 9 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>
                  <span>{z.label}</span>
                  <span style={{ color: z.color, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{z.pct}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: z.pct + '%', height: '100%', background: z.color, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Wave ── */}
      <div style={{ background: 'rgba(20,184,166,0.02)', padding: 0, overflow: 'hidden' }}>
        <SeismicWave />
      </div>

      {/* ── Stats section ── */}
      <section style={S.statsSection}>
        <StatCard value={113100} label="Polices Assurées" />
        <StatCard value={1131} label="Mrd DZD Exposés" suffix=" Mrd" />
        <StatCard value={30.5} label="Zone III Critique" suffix="%" />
        <StatCard value={285} label="PML 200-ans (Mrd DZD)" prefix="~" />
        <StatCard value={48} label="Wilayas Couvertes" />
      </section>

      {/* ── Features section ── */}
      <section style={S.featuresSection}>
        <div style={S.sectionHeader}>
          <div style={S.sectionBadge}>Fonctionnalités</div>
          <h2 style={S.sectionH2}>Tous les Outils du Risk Manager</h2>
          <p style={S.sectionSub}>
            Une suite complète pour gérer, analyser et optimiser votre exposition aux risques sismiques en Algérie.
          </p>
        </div>
        <div style={S.featuresGrid}>
          {FEATURES.map(f => <FeatureCard key={f.title} {...f} />)}
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section style={S.ctaSection}>
        <div style={S.ctaCard}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#115e59,#0d9488,#14b8a6)', borderRadius: 'inherit' }} />
          <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <div style={{ position: 'absolute', bottom: -80, left: -30, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 14 }}>🛡️</div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(1.4rem,3vw,2rem)', color: '#fff', marginBottom: 14, letterSpacing: '-0.3px' }}>
              Prêt à Sécuriser Votre Portefeuille ?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>
              Accédez à la plateforme RASED et transformez votre gestion du risque sismique dès aujourd'hui.
            </p>
            <button onClick={onLogin} style={S.ctaBtn}>
              Accéder à RASED →
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={S.footer}>
        <div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: 'var(--primary-600)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={16} color="var(--primary-600)" />رَصَد RASED
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-quaternary)', marginTop: 4 }}>Risque Assurantiel Sismique · Exposition et Diagnostic</div>
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-quaternary)' }}>© 2025 Plateforme IARD Algérie · Confidentiel</div>
      </footer>
    </div>
  )
}

const S = {
  root: { minHeight: '100vh', overflowY: 'auto', overflowX: 'hidden', background: 'var(--bg)', height: '100vh' },
  navbar: {
    position: 'sticky', top: 0, left: 0, right: 0, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 48px', height: 64,
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    transition: 'box-shadow 0.3s, background 0.3s, border-color 0.3s',
  },
  logoBrand: { display: 'flex', alignItems: 'center', gap: 12 },
  logoIcon: {
    width: 36, height: 36, borderRadius: 10,
    background: 'var(--primary-50)', border: '1px solid rgba(20,184,166,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  navLinks: { display: 'flex', alignItems: 'center', gap: 32 },
  navLink: { fontSize: '0.82rem', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' },
  navCta: {
    background: 'linear-gradient(135deg,#0f766e,#14b8a6)',
    color: '#fff', border: 'none', borderRadius: 10,
    padding: '8px 20px', fontSize: '0.82rem', fontWeight: 600,
    cursor: 'pointer', boxShadow: '0 2px 8px rgba(20,184,166,0.2)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    fontFamily: "'Space Grotesk', sans-serif", display: 'flex', alignItems: 'center',
  },
  hero: {
    padding: '60px 5% 40px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: '4vw', minHeight: 'calc(100vh - 70px)',
    position: 'relative', overflow: 'hidden',
  },
  heroBg: {
    position: 'absolute', inset: 0, zIndex: 0,
    background: 'radial-gradient(ellipse 80% 60% at 60% 40%, rgba(20,184,166,0.04) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroGrid: {
    position: 'absolute', inset: 0, zIndex: 0,
    backgroundImage: 'linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px)',
    backgroundSize: '40px 40px',
    pointerEvents: 'none',
  },
  heroContent: { position: 'relative', zIndex: 1, flex: 1, maxWidth: 600 },
  heroBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: 'var(--primary-50)', border: '1px solid rgba(20,184,166,0.15)',
    color: 'var(--primary-700)', borderRadius: 40, padding: '6px 16px',
    fontSize: '0.72rem', fontWeight: 600, marginBottom: 26,
  },
  heroBadgeDot: {
    width: 6, height: 6, borderRadius: '50%', background: 'var(--primary-500)',
    display: 'inline-block', animation: 'pulseDot 2s infinite',
  },
  heroH1: {
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
    fontSize: 'clamp(2.2rem,4.5vw,3.6rem)', lineHeight: 1.08,
    color: 'var(--text-primary)', marginBottom: 22, letterSpacing: '-1.5px',
  },
  heroH1Accent: { color: 'var(--primary-600)' },
  heroSub: { fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 34, maxWidth: 520 },
  heroActions: { display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' },
  heroPrimaryBtn: {
    background: 'linear-gradient(135deg,#0f766e,#14b8a6)',
    color: '#fff', border: 'none', borderRadius: 12,
    padding: '15px 32px', fontSize: '0.95rem', fontWeight: 600,
    cursor: 'pointer', boxShadow: '0 4px 16px rgba(20,184,166,0.2)',
    transition: 'transform 0.18s, box-shadow 0.18s',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  heroSecondaryBtn: {
    background: 'transparent', color: 'var(--text-primary)',
    border: '1px solid var(--border)', borderRadius: 12,
    padding: '15px 32px', fontSize: '0.95rem', fontWeight: 500,
    cursor: 'pointer', transition: 'all 0.18s', display: 'flex', alignItems: 'center',
  },
  heroBadges: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  techBadge: {
    background: 'var(--bg-subtle)', border: '1px solid var(--border)',
    borderRadius: 6, padding: '4px 10px', fontSize: '0.63rem', fontWeight: 600,
    color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace",
  },
  heroVisual: {
    position: 'relative', zIndex: 1, flex: '0 0 480px',
    display: 'flex', flexDirection: 'column', gap: 14,
    background: 'var(--surface)', borderRadius: 20, padding: 28,
    boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)',
    overflow: 'hidden',
  },
  heroCard1: {
    background: 'var(--primary-50)', borderRadius: 12,
    border: '1px solid rgba(20,184,166,0.12)', padding: '16px 20px',
  },
  heroCard2: {
    background: 'var(--warning-muted)', borderRadius: 12,
    border: '1px solid var(--warning-border)', padding: '14px 20px',
  },
  heroPillars: {
    background: 'var(--bg-subtle)', borderRadius: 12,
    border: '1px solid var(--border)', padding: '14px 16px',
  },
  statsSection: {
    background: 'var(--primary-50)',
    borderTop: '1px solid rgba(20,184,166,0.08)',
    borderBottom: '1px solid rgba(20,184,166,0.08)',
    display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
    gap: 0, padding: '48px 6vw',
  },
  statCard: { textAlign: 'center', padding: '0 40px', borderRight: '1px solid rgba(20,184,166,0.12)' },
  statValue: {
    fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
    fontSize: 'clamp(1.6rem,3vw,2.3rem)', color: 'var(--primary-700)', lineHeight: 1,
  },
  statLabel: { fontSize: '0.73rem', color: 'var(--text-tertiary)', marginTop: 6, fontWeight: 500 },
  featuresSection: { padding: '80px 6vw', background: 'transparent' },
  sectionHeader: { textAlign: 'center', marginBottom: 52 },
  sectionBadge: {
    display: 'inline-block', background: 'var(--primary-50)',
    color: 'var(--primary-700)', border: '1px solid rgba(20,184,166,0.15)',
    borderRadius: 20, padding: '4px 14px', fontSize: '0.7rem',
    fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 14,
  },
  sectionH2: {
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
    fontSize: 'clamp(1.6rem,3vw,2.2rem)', color: 'var(--text-primary)',
    marginBottom: 12, letterSpacing: '-0.3px',
  },
  sectionSub: { fontSize: '0.9rem', color: 'var(--text-tertiary)', maxWidth: 520, margin: '0 auto' },
  featuresGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))',
    gap: 16, maxWidth: 1100, margin: '0 auto',
  },
  featureCard: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 16, padding: '24px', cursor: 'pointer',
    transition: 'transform 0.22s var(--ease-out), box-shadow 0.22s ease, border-color 0.22s',
    position: 'relative', overflow: 'hidden',
  },
  featureIcon: {
    width: 48, height: 48, borderRadius: 12, display: 'flex',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  featureTitle: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 8 },
  featureDesc: { fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.7 },
  featureArrow: { marginTop: 16, transition: 'transform 0.2s, opacity 0.2s' },
  ctaSection: { padding: '80px 6vw' },
  ctaCard: {
    maxWidth: 820, margin: '0 auto', borderRadius: 24,
    padding: '64px 40px', position: 'relative', overflow: 'hidden',
    textAlign: 'center',
  },
  ctaBtn: {
    background: 'rgba(255,255,255,0.95)', color: '#0f766e',
    border: 'none', borderRadius: 12,
    padding: '14px 36px', fontSize: '0.95rem', fontWeight: 600,
    cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    fontFamily: "'Space Grotesk', sans-serif", transition: 'transform 0.18s',
  },
  footer: {
    background: 'var(--surface)', borderTop: '1px solid var(--border)',
    padding: '24px 6vw', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
}
