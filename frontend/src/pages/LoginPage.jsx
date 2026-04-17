import React, { useState } from 'react'

const DEMO_USERS = [
  { email: 'admin@rased.dz', password: 'rased2025', name: 'Ahmed Benali', role: 'Directeur Risques' },
  { email: 'demo@rased.dz',  password: 'demo',      name: 'Yasmine Kaci', role: 'Analyste Actuariel' },
]

export default function LoginPage({ onLogin, onBack }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [focused, setFocused]   = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setTimeout(() => {
      const user = DEMO_USERS.find(u => u.email === email && u.password === password)
      if (user) {
        onLogin(user)
      } else {
        setError('Email ou mot de passe incorrect.')
        setLoading(false)
      }
    }, 900)
  }

  const fillDemo = (u) => {
    setEmail(u.email)
    setPassword(u.password)
    setError('')
  }

  return (
    <div style={S.root}>
      {/* Left panel — branding */}
      <div style={S.left}>
        <div style={S.leftBg} />
        <div style={S.leftGlow} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <button onClick={onBack} style={S.backBtn}>← Retour</button>

          <div style={S.brandWrap}>
            <div style={S.logo}>رَصَد</div>
            <div style={S.brandName}>RASED</div>
            <div style={S.brandTagline}>Risque Assurantiel Sismique<br/>Exposition et Diagnostic</div>
          </div>

          <div style={S.features}>
            {[
              { icon: '🗺️', text: 'Carte sismique interactive Leaflet' },
              { icon: '🎲', text: 'Simulation Monte Carlo 10K itérations' },
              { icon: '🔴', text: 'Alertes sismiques en temps réel (EMSC)' },
              { icon: '🤖', text: 'Recommandations stratégiques IA' },
            ].map(f => (
              <div key={f.text} style={S.featureItem}>
                <div style={S.featureIconLeft}>{f.icon}</div>
                <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)' }}>{f.text}</span>
              </div>
            ))}
          </div>

          <div style={S.statsWrap}>
            {[['113 100','Polices'], ['1 131 Mrd','Exposition (DZD)'], ['48','Wilayas']].map(([v,l]) => (
              <div key={l} style={S.statItem}>
                <div style={S.statVal}>{v}</div>
                <div style={S.statLbl}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div style={S.right}>
        <div style={S.formCard}>
          <div style={S.formHeader}>
            <div style={S.formTitle}>Connexion</div>
            <div style={S.formSub}>Accédez à votre espace RASED</div>
          </div>

          {/* Demo accounts */}
          <div style={S.demoSection}>
            <div style={S.demoLabel}>Comptes de démonstration :</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {DEMO_USERS.map(u => (
                <button key={u.email} onClick={() => fillDemo(u)} style={S.demoBtn}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--g700)' }}>{u.role}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-4)' }}>{u.email}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email */}
            <div style={S.fieldWrap}>
              <label style={S.label}>Adresse Email</label>
              <div style={{ ...S.inputWrap, borderColor: focused === 'email' ? 'var(--g500)' : error ? '#dc2626' : 'var(--border)', boxShadow: focused === 'email' ? '0 0 0 3px rgba(34,197,94,0.12)' : 'none' }}>
                <span style={S.inputIcon}>📧</span>
                <input
                  type="email" value={email} required
                  placeholder="votre@email.dz"
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  style={S.input}
                />
              </div>
            </div>

            {/* Password */}
            <div style={S.fieldWrap}>
              <label style={S.label}>Mot de Passe</label>
              <div style={{ ...S.inputWrap, borderColor: focused === 'pass' ? 'var(--g500)' : error ? '#dc2626' : 'var(--border)', boxShadow: focused === 'pass' ? '0 0 0 3px rgba(34,197,94,0.12)' : 'none' }}>
                <span style={S.inputIcon}>🔒</span>
                <input
                  type={showPass ? 'text' : 'password'} value={password} required
                  placeholder="••••••••"
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('pass')}
                  onBlur={() => setFocused(null)}
                  style={S.input}
                />
                <button type="button" onClick={() => setShowPass(p => !p)} style={S.eyeBtn}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={S.errorBox}>
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} style={{ ...S.submitBtn, opacity: loading ? 0.75 : 1 }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Connexion en cours...
                </span>
              ) : 'Se Connecter →'}
            </button>
          </form>

          <div style={S.formFooter}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-4)', textAlign: 'center' }}>
              🔒 Accès restreint · Données confidentielles IARD
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const S = {
  root: { display: 'flex', minHeight: '100vh' },

  /* Left branding panel */
  left: {
    flex: '0 0 420px', position: 'relative', overflow: 'hidden',
    background: 'linear-gradient(160deg, var(--g800) 0%, var(--g600) 50%, #10b981 100%)',
    padding: '40px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
  },
  leftBg: {
    position: 'absolute', inset: 0,
    background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
    pointerEvents: 'none',
  },
  leftGlow: {
    position: 'absolute', top: -100, right: -100, width: 400, height: 400,
    borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 8, padding: '6px 14px', fontSize: '0.75rem', fontWeight: 600,
    cursor: 'pointer', marginBottom: 40, display: 'inline-block',
    transition: 'background 0.15s',
  },
  brandWrap: { marginBottom: 40 },
  logo:      { fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: '3.5rem', color: '#fff', lineHeight: 1, marginBottom: 4, opacity: 0.9 },
  brandName: { fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '2rem', color: '#fff', letterSpacing: '-1px' },
  brandTagline: { fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', marginTop: 8, lineHeight: 1.6 },
  features: { display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 40 },
  featureItem: { display: 'flex', alignItems: 'center', gap: 12 },
  featureIconLeft: {
    width: 34, height: 34, borderRadius: 9,
    background: 'rgba(255,255,255,0.15)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0,
  },
  statsWrap: {
    display: 'flex', gap: 0,
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)',
  },
  statItem: { flex: 1, padding: '14px 16px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.1)' },
  statVal:  { fontFamily: 'JetBrains Mono,monospace', fontWeight: 800, fontSize: '0.9rem', color: '#fff' },
  statLbl:  { fontSize: '0.6rem', color: 'rgba(255,255,255,0.6)', marginTop: 3 },

  /* Right form panel */
  right: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#f8fafc', padding: '40px 24px',
  },
  formCard: {
    background: '#fff', borderRadius: 20, padding: '36px 40px',
    boxShadow: 'var(--sh-lg)', border: '1px solid var(--border)',
    width: '100%', maxWidth: 440,
  },
  formHeader: { marginBottom: 24 },
  formTitle: { fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-1)', marginBottom: 4 },
  formSub:   { fontSize: '0.82rem', color: 'var(--text-3)' },

  demoSection: { marginBottom: 20 },
  demoLabel:   { fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 8 },
  demoBtn: {
    flex: 1, background: 'var(--g50)', border: '1px solid var(--g200)',
    borderRadius: 10, padding: '10px 12px', cursor: 'pointer',
    textAlign: 'left', transition: 'background 0.15s', display: 'block',
  },

  fieldWrap:  { display: 'flex', flexDirection: 'column', gap: 6 },
  label:      { fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-2)' },
  inputWrap: {
    display: 'flex', alignItems: 'center',
    border: '1px solid var(--border)', borderRadius: 10,
    background: '#fff', overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  inputIcon: { padding: '0 12px', fontSize: '0.9rem' },
  input: {
    flex: 1, border: 'none', outline: 'none',
    padding: '12px 12px 12px 0', fontSize: '0.85rem',
    color: 'var(--text-1)', background: 'transparent',
    fontFamily: 'Inter,sans-serif',
  },
  eyeBtn: {
    background: 'none', border: 'none', padding: '0 12px',
    cursor: 'pointer', fontSize: '0.9rem',
  },
  errorBox: {
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 8, padding: '10px 14px',
    fontSize: '0.78rem', color: '#dc2626',
  },
  submitBtn: {
    background: 'linear-gradient(135deg,var(--g700),var(--g500))',
    color: '#fff', border: 'none', borderRadius: 12,
    padding: '14px', fontSize: '0.9rem', fontWeight: 700,
    cursor: 'pointer', boxShadow: 'var(--sh-green)',
    fontFamily: 'Syne,sans-serif', transition: 'opacity 0.2s',
    width: '100%',
  },
  formFooter: { marginTop: 20 },
}
