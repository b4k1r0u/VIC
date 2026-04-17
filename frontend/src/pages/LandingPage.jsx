import React, { useState, useEffect } from 'react'
import { useCountUp } from '../hooks/useCountUp'
import { Shield, Map, Zap, Bell, Scale, Bot, FlaskConical, ArrowRight, ExternalLink } from 'lucide-react'

/* ── Seismic wave SVG ── */
function SeismicWave({ color = '#22c55e', opacity = 0.15 }) {
  return (
    <svg viewBox="0 0 900 40" style={{ width:'100%', height:40 }} preserveAspectRatio="none">
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
        {prefix}<span style={{ animation:visible ? 'countPulse 0.4s ease' : 'none' }}>
          {value >= 1000 ? Math.round(count).toLocaleString('fr-FR') : count.toFixed(count < 10 ? 1 : 0)}
        </span>{suffix}
      </div>
      <div style={S.statLabel}>{label}</div>
    </div>
  )
}

const FEATURES = [
  { Icon:Map,         color:'#3b82f6', title:'Carte Interactive',      desc:'Visualisation Leaflet temps réel des 48 wilayas avec exposition par zone RPA99.' },
  { Icon:Zap,         color:'#8b5cf6', title:'Simulateur Monte Carlo', desc:'Calcul de PML et VaR sur 8 000 itérations pour chaque scénario catastrophe.' },
  { Icon:Bell,        color:'#ef4444', title:'Alertes Sismiques LIVE', desc:'Flux WebSocket EMSC en temps réel avec calcul automatique d\'impact portefeuille.' },
  { Icon:Scale,       color:'#22c55e', title:'Bilan & Rééquilibrage',  desc:'Score de balance et feuille de route stratégique pour optimiser la concentration.' },
  { Icon:Bot,         color:'#f59e0b', title:'Analyses & Optimisations', desc:'Note stratégique générée automatiquement pour la direction générale.' },
  { Icon:FlaskConical,color:'#ec4899', title:'Sandbox Souscription',   desc:'Test d\'impact d\'une nouvelle police avant approbation définitive.' },
]

/* ── Feature card ── */
function FeatureCard({ Icon, color, title, desc }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      style={{
        ...S.featureCard,
        transform: hov ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hov ? `var(--sh-lg), 0 0 30px ${color}18` : 'var(--sh-sm)',
        borderColor: hov ? `${color}30` : 'rgba(255,255,255,0.08)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{ ...S.featureIcon, background:`${color}12`, border:`1px solid ${color}25` }}>
        <Icon size={20} color={color} strokeWidth={1.8} />
      </div>
      <div style={S.featureTitle}>{title}</div>
      <div style={S.featureDesc}>{desc}</div>
      <div style={{ ...S.featureArrow, color, opacity: hov ? 1 : 0.5, transform: hov ? 'translateX(4px)' : 'none', transition:'all 0.2s' }}>
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
        boxShadow: scrolled ? 'var(--sh-sm)' : 'none',
        background: scrolled ? 'rgba(248,250,252,0.97)' : 'transparent',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.07)' : '1px solid transparent',
      }}>
        <div style={S.logoBrand}>
          <div style={S.logoIcon}>
            <Shield size={16} color="var(--g500)" />
          </div>
          <div>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.1rem', color:'var(--text-1)', lineHeight:1 }}>رَصْد RASED</div>
            <div style={{ fontSize:'0.55rem', color:'var(--text-3)', letterSpacing:'1px', textTransform:'uppercase' }}>Risque Assurantiel Sismique</div>
          </div>
        </div>
        <div style={S.navLinks}>
          {['Fonctionnalités','Données','À Propos'].map(l => (
            <a key={l} href="#" style={S.navLink}>{l}</a>
          ))}
          <button onClick={onLogin} style={S.navCta}>
            Accéder <ArrowRight size={13} style={{ marginLeft:6 }} />
          </button>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section style={S.hero}>
        <div style={S.heroBg} />
        <div style={S.heroGlow1} />
        <div style={S.heroGlow2} />
        <div style={S.heroGrid} />

        <div style={S.heroContent}>
          <div style={S.heroBadge}>
            <span style={S.heroBadgeDot} />
            Plateforme Risk Management IARD · Algérie 2025
          </div>

          <h1 style={S.heroH1}>
            Gestion Interactive<br/>
            <span style={S.heroH1Accent}>des Risques</span>
          </h1>
          <p style={S.heroSub}>
            RASED centralise l'exposition de votre portefeuille IARD face aux risques sismiques algériens. Simulez, analysez et rééquilibrez vos engagements pour une prise de décision stratégique optimale.
          </p>

          <div style={S.heroActions}>
            <button onClick={onLogin} style={S.heroPrimaryBtn}>
              🚀 Accéder à la Plateforme
            </button>
            <button style={S.heroSecondaryBtn}>
              <ExternalLink size={14} style={{ marginRight:7 }} />
              Voir la Démo
            </button>
          </div>

          <div style={S.heroBadges}>
            {['RPA99 Compliant','EMSC WebSocket','Monte Carlo Engine','Recharts Analytics'].map(b => (
              <span key={b} style={S.techBadge}>{b}</span>
            ))}
          </div>
        </div>

        {/* Hero visual */}
        <div style={S.heroVisual}>
          {/* Scan line */}
          <div style={{
            position:'absolute', left:0, right:0, height:1,
            background:'linear-gradient(90deg,transparent,rgba(34,197,94,0.4),transparent)',
            animation:'scanLine 4s linear infinite', zIndex:2,
          }} />
          <div style={S.heroCard1}>
            <div style={{ fontSize:'0.6rem', color:'var(--text-3)', marginBottom:4, textTransform:'uppercase', letterSpacing:'1px' }}>BALANCE SCORE</div>
            <div style={{ fontSize:'2.2rem', fontFamily:'JetBrains Mono,monospace', fontWeight:800, color:'#f59e0b', lineHeight:1 }}>47/100</div>
            <div style={{ fontSize:'0.65rem', color:'var(--g600)', marginTop:4 }}>↑ Objectif 82 en 2028</div>
          </div>
          <div style={S.heroCard2}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'#22c55e', animation:'pulseDot 1.5s infinite', boxShadow:'0 0 6px #22c55e' }} />
              <span style={{ fontSize:'0.63rem', color:'#22c55e', fontWeight:700 }}>LIVE</span>
              <span style={{ fontSize:'0.6rem', color:'var(--text-3)', marginLeft:'auto' }}>EMSC WebSocket</span>
            </div>
            <div style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--text-1)' }}>M3.7 — Sétif</div>
            <div style={{ fontSize:'0.65rem', color:'var(--text-3)', marginTop:2 }}>Zone IIa · 18 km depth</div>
          </div>
          <div style={S.heroPillars}>
            <div style={{ fontSize:'0.6rem', color:'var(--text-3)', marginBottom:10, textTransform:'uppercase', letterSpacing:'1px', fontWeight:600 }}>Zone Distribution</div>
            {[
              { label:'Zone III', pct:30.5, color:'#ef4444' },
              { label:'Zone IIa', pct:43.2, color:'#eab308' },
              { label:'Zone I',   pct:7.9,  color:'#22c55e' },
            ].map(z => (
              <div key={z.label} style={{ marginBottom:9 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.65rem', color:'var(--text-3)', marginBottom:4 }}>
                  <span>{z.label}</span>
                  <span style={{ color:z.color, fontWeight:700, fontFamily:'JetBrains Mono,monospace' }}>{z.pct}%</span>
                </div>
                <div style={{ height:4, background:'rgba(0,0,0,0.06)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ width:z.pct+'%', height:'100%', background:z.color, borderRadius:3, boxShadow:`0 0 6px ${z.color}80` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Wave divider ── */}
      <div style={{ background:'rgba(34,197,94,0.03)', padding:'0', overflow:'hidden' }}>
        <SeismicWave color='#22c55e' opacity={0.15} />
      </div>

      {/* ── Stats section ── */}
      <section style={S.statsSection}>
        <StatCard value={113100} label="Polices Assurées" />
        <StatCard value={1131}   label="Mrd DZD Exposés" suffix=" Mrd" />
        <StatCard value={30.5}   label="Zone III Critique" suffix="%" />
        <StatCard value={285}    label="PML 200-ans (Mrd DZD)" prefix="~" />
        <StatCard value={48}     label="Wilayas Couvertes" />
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
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,#14532d,#15803d,#16a34a)', borderRadius:'inherit' }} />
          <div style={{ position:'absolute', top:-60, right:-60, width:240, height:240, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />
          <div style={{ position:'absolute', bottom:-80, left:-30, width:320, height:320, borderRadius:'50%', background:'rgba(255,255,255,0.03)' }} />
          <div style={{ position:'relative', zIndex:1, textAlign:'center' }}>
            <div style={{ fontSize:'2.8rem', marginBottom:14, animation:'float 4s ease-in-out infinite' }}>🛡️</div>
            <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'clamp(1.4rem,3vw,2rem)', color:'#fff', marginBottom:14, letterSpacing:'-0.5px' }}>
              Prêt à Sécuriser Votre Portefeuille ?
            </h2>
            <p style={{ color:'rgba(255,255,255,0.75)', fontSize:'0.9rem', marginBottom:32, maxWidth:480, margin:'0 auto 32px' }}>
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
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, color:'var(--g500)', fontSize:'1.05rem', display:'flex', alignItems:'center', gap:8 }}>
            <Shield size={16} color="var(--g500)" />رَصَد RASED
          </div>
          <div style={{ fontSize:'0.68rem', color:'var(--text-4)', marginTop:4 }}>Risque Assurantiel Sismique · Exposition et Diagnostic</div>
        </div>
        <div style={{ fontSize:'0.68rem', color:'var(--text-4)' }}>© 2025 Plateforme IARD Algérie · Confidentiel</div>
      </footer>
    </div>
  )
}

const S = {
  root: {
    minHeight:'100vh', overflowY:'auto', overflowX:'hidden',
    background:'#f8fafc',
    height:'100vh',
  },

  /* Navbar */
  navbar: {
    position:'sticky', top:0, left:0, right:0, zIndex:100,
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'0 48px', height:64,
    backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
    transition:'box-shadow 0.3s, background 0.3s, border-color 0.3s',
  },
  logoBrand: { display:'flex', alignItems:'center', gap:12 },
  logoIcon: {
    width:36, height:36, borderRadius:10,
    background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.25)',
    display:'flex', alignItems:'center', justifyContent:'center',
  },
  navLinks:   { display:'flex', alignItems:'center', gap:32 },
  navLink: {
    fontSize:'0.82rem', color:'var(--text-2)', textDecoration:'none',
    fontWeight:500, transition:'color 0.15s',
  },
  navCta: {
    background:'linear-gradient(135deg,var(--g700),var(--g500))',
    color:'#fff', border:'none', borderRadius:10,
    padding:'8px 20px', fontSize:'0.82rem', fontWeight:700,
    cursor:'pointer', boxShadow:'var(--sh-green)',
    transition:'transform 0.15s, box-shadow 0.15s',
    fontFamily:'Syne,sans-serif', display:'flex', alignItems:'center',
  },

  /* ── Sections ── */
  hero: {
    padding:'60px 5% 40px', display:'flex', alignItems:'center',
    justifyContent:'space-between', gap:'4vw', minHeight:'calc(100vh - 70px)',
    position:'relative', overflow:'hidden',
  },
  heroBg: {
    position:'absolute', inset:0, zIndex:0,
    background:'radial-gradient(ellipse 80% 60% at 60% 40%, rgba(34,197,94,0.08) 0%, transparent 70%)',
    pointerEvents:'none',
  },
  heroGlow1: {
    position:'absolute', top:'10%', right:'5%', width:500, height:500,
    borderRadius:'50%', background:'radial-gradient(circle, rgba(34,197,94,0.07), transparent 70%)',
    pointerEvents:'none', animation:'float 8s ease-in-out infinite',
  },
  heroGlow2: {
    position:'absolute', bottom:'5%', left:'15%', width:300, height:300,
    borderRadius:'50%', background:'radial-gradient(circle, rgba(59,130,246,0.06), transparent 70%)',
    pointerEvents:'none', animation:'float 12s ease-in-out infinite reverse',
  },
  heroGrid: {
    position:'absolute', inset:0, zIndex:0,
    backgroundImage:`linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)`,
    backgroundSize:'40px 40px',
    pointerEvents:'none',
  },

  heroContent: { position:'relative', zIndex:1, flex:1, maxWidth:600 },
  heroBadge: {
    display:'inline-flex', alignItems:'center', gap:8,
    background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)',
    color:'var(--g700)', borderRadius:40, padding:'6px 16px',
    fontSize:'0.72rem', fontWeight:600, marginBottom:26,
  },
  heroBadgeDot: {
    width:7, height:7, borderRadius:'50%', background:'var(--g500)',
    display:'inline-block', animation:'pulseDot 1.5s infinite',
    boxShadow:'0 0 6px var(--g500)',
  },
  heroH1: {
    fontFamily:'Syne,sans-serif', fontWeight:900,
    fontSize:'clamp(2.2rem,4.5vw,3.6rem)', lineHeight:1.05,
    color:'var(--text-1)', marginBottom:22, letterSpacing:'-2px',
  },
  heroH1Accent: {
    background:'linear-gradient(135deg, var(--g400), var(--g600), #10b981)',
    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
    backgroundSize:'200% 200%', animation:'gradientShift 4s ease infinite',
  },
  heroSub: {
    fontSize:'1rem', color:'var(--text-2)', lineHeight:1.8,
    marginBottom:34, maxWidth:520,
  },
  heroActions: { display:'flex', gap:12, marginBottom:28, flexWrap:'wrap' },
  heroPrimaryBtn: {
    background:'linear-gradient(135deg,var(--g700),var(--g500))',
    color:'#fff', border:'none', borderRadius:12,
    padding:'15px 32px', fontSize:'0.95rem', fontWeight:700,
    cursor:'pointer', boxShadow:'var(--sh-green-lg)',
    transition:'transform 0.18s, box-shadow 0.18s',
    fontFamily:'Syne,sans-serif',
  },
  heroSecondaryBtn: {
    background:'rgba(255,255,255,0.05)',
    color:'var(--text-1)',
    border:'1px solid var(--border)', borderRadius:12,
    padding:'15px 32px', fontSize:'0.95rem', fontWeight:600,
    cursor:'pointer', transition:'all 0.18s',
    display:'flex', alignItems:'center',
  },
  heroBadges: { display:'flex', gap:8, flexWrap:'wrap' },
  techBadge: {
    background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
    borderRadius:6, padding:'4px 10px', fontSize:'0.63rem', fontWeight:600,
    color:'var(--text-3)', fontFamily:'JetBrains Mono,monospace',
  },

  /* Hero visual */
  heroVisual: {
    position:'relative', zIndex:1, flex:'0 0 520px',
    display:'flex', flexDirection:'column', gap:18,
    background:'#ffffff', backdropFilter:'blur(20px)',
    borderRadius:24, padding:32,
    boxShadow:'var(--sh-xl)', border:'1px solid rgba(0,0,0,0.08)',
    overflow:'hidden',
  },
  heroCard1: {
    background:'rgba(34,197,94,0.07)', borderRadius:12,
    border:'1px solid rgba(34,197,94,0.18)', padding:'16px 20px',
  },
  heroCard2: {
    background:'rgba(245,158,11,0.07)', borderRadius:12,
    border:'1px solid rgba(245,158,11,0.18)', padding:'14px 20px',
  },
  heroPillars: {
    background:'rgba(0,0,0,0.03)', borderRadius:12,
    border:'1px solid rgba(0,0,0,0.07)', padding:'14px 16px',
  },

  /* Stats */
  statsSection: {
    background:'rgba(34,197,94,0.04)',
    borderTop:'1px solid rgba(34,197,94,0.1)',
    borderBottom:'1px solid rgba(34,197,94,0.1)',
    display:'flex', justifyContent:'center', flexWrap:'wrap',
    gap:0, padding:'48px 6vw',
  },
  statCard: { textAlign:'center', padding:'0 40px', borderRight:'1px solid rgba(0,0,0,0.07)' },
  statValue: {
    fontFamily:'JetBrains Mono,monospace', fontWeight:800,
    fontSize:'clamp(1.6rem,3vw,2.5rem)', color:'var(--g600)', lineHeight:1,
  },
  statLabel: { fontSize:'0.73rem', color:'var(--text-3)', marginTop:6, fontWeight:500 },

  /* Features */
  featuresSection: { padding:'80px 6vw', background:'transparent' },
  sectionHeader:   { textAlign:'center', marginBottom:52 },
  sectionBadge: {
    display:'inline-block', background:'rgba(34,197,94,0.08)',
    color:'var(--g400)', border:'1px solid rgba(34,197,94,0.2)',
    borderRadius:20, padding:'4px 14px', fontSize:'0.7rem',
    fontWeight:700, textTransform:'uppercase', letterSpacing:'2px', marginBottom:14,
  },
  sectionH2: {
    fontFamily:'Syne,sans-serif', fontWeight:800,
    fontSize:'clamp(1.6rem,3vw,2.4rem)', color:'var(--text-1)',
    marginBottom:12, letterSpacing:'-0.5px',
  },
  sectionSub: { fontSize:'0.9rem', color:'var(--text-3)', maxWidth:520, margin:'0 auto' },
  featuresGrid: {
    display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px,1fr))',
    gap:20, maxWidth:1100, margin:'0 auto',
  },
  featureCard: {
    background:'var(--surface)', border:'1px solid var(--border)',
    borderRadius:16, padding:'26px', cursor:'pointer',
    transition:'transform 0.22s cubic-bezier(0.16,1,0.3,1), box-shadow 0.22s ease, border-color 0.22s',
    position:'relative', overflow:'hidden',
  },
  featureIcon: {
    width:50, height:50, borderRadius:13, display:'flex',
    alignItems:'center', justifyContent:'center', marginBottom:16,
  },
  featureTitle: {
    fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'1rem',
    color:'var(--text-1)', marginBottom:8,
  },
  featureDesc: { fontSize:'0.8rem', color:'var(--text-2)', lineHeight:1.7 },
  featureArrow: { marginTop:16, transition:'transform 0.2s, opacity 0.2s' },

  /* CTA */
  ctaSection: { padding:'80px 6vw' },
  ctaCard: {
    maxWidth:820, margin:'0 auto', borderRadius:24,
    padding:'64px 40px', position:'relative', overflow:'hidden',
    textAlign:'center',
  },
  ctaBtn: {
    background:'rgba(255,255,255,0.95)', color:'#15803d',
    border:'none', borderRadius:12,
    padding:'14px 36px', fontSize:'0.95rem', fontWeight:700,
    cursor:'pointer', boxShadow:'0 4px 20px rgba(0,0,0,0.25)',
    fontFamily:'Syne,sans-serif', transition:'transform 0.18s',
  },

  /* Footer */
  footer: {
    background:'var(--surface)',
    borderTop:'1px solid var(--border)',
    padding:'24px 6vw', display:'flex',
    alignItems:'center', justifyContent:'space-between',
  },
}
