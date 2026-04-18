import React, { useState } from 'react'

export default function LoginPage({ onLogin, onBack }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [focused, setFocused] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setTimeout(() => {
      if (!email.trim() || !password.trim()) {
        setError('Invalid email or password.')
        setLoading(false)
        return
      }

      onLogin({
        email: email.trim(),
        password: '',
        name: email.trim().split('@')[0] || 'User',
        role: 'Platform user',
      })
    }, 900)
  }

  return (
    <div style={S.root}>
      {/* Left panel — branding */}
      <div style={S.left}>
        <div style={S.leftBg} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <button onClick={onBack} style={S.backBtn}>← Back</button>

          <div style={S.brandWrap}>
            <div style={S.logo}>رَصْد</div>
            <div style={S.brandName}>RASED</div>
            <div style={S.brandTagline}>Seismic Insurance Risk<br />Exposure and Diagnostics</div>
          </div>

          <div style={S.features}>
            {[
              { icon: '🗺️', text: 'Interactive seismic map with Leaflet' },
              { icon: '🎲', text: '10K-iteration Monte Carlo simulation' },
              { icon: '🔴', text: 'Real-time seismic alerts (EMSC)' },
              { icon: '📊', text: 'Strategic recommendations and actuarial insights' },
            ].map(f => (
              <div key={f.text} style={S.featureItem}>
                <div style={S.featureIconLeft}>{f.icon}</div>
                <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)' }}>{f.text}</span>
              </div>
            ))}
          </div>

          <div style={S.statsWrap}>
            {[['113 100', 'Policies'], ['1 131 Bn', 'Exposure (DZD)'], ['48', 'Wilayas']].map(([v, l]) => (
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
            <div style={S.formTitle}>Sign in</div>
            <div style={S.formSub}>Access your RASED workspace</div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email */}
            <div style={S.fieldWrap}>
              <label style={S.label}>Email Address</label>
              <div style={{ ...S.inputWrap, borderColor: focused === 'email' ? 'var(--primary-500)' : error ? 'var(--danger)' : 'var(--border)', boxShadow: focused === 'email' ? '0 0 0 3px rgba(20,184,166,0.08)' : 'none' }}>
                <span style={S.inputIcon}>📧</span>
                <input
                  type="email" value={email} required
                  placeholder="your@email.com"
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  style={S.input}
                />
              </div>
            </div>

            {/* Password */}
            <div style={S.fieldWrap}>
              <label style={S.label}>Password</label>
              <div style={{ ...S.inputWrap, borderColor: focused === 'pass' ? 'var(--primary-500)' : error ? 'var(--danger)' : 'var(--border)', boxShadow: focused === 'pass' ? '0 0 0 3px rgba(20,184,166,0.08)' : 'none' }}>
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
                  Signing in...
                </span>
              ) : 'Sign In →'}
            </button>
          </form>

          <div style={S.formFooter}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-quaternary)', textAlign: 'center' }}>
              🔒 Restricted access · Confidential P&C data
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const S = {
  root: { display: 'flex', minHeight: '100vh' },
  left: {
    flex: '0 0 420px', position: 'relative', overflow: 'hidden',
    background: 'linear-gradient(160deg, #115e59 0%, #0d9488 50%, #14b8a6 100%)',
    padding: '40px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
  },
  leftBg: {
    position: 'absolute', inset: 0,
    background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
    pointerEvents: 'none',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 8, padding: '6px 14px', fontSize: '0.75rem', fontWeight: 500,
    cursor: 'pointer', marginBottom: 40, display: 'inline-block', transition: 'background 0.15s',
  },
  brandWrap: { marginBottom: 40 },
  logo: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '3rem', color: '#fff', lineHeight: 1, marginBottom: 4, opacity: 0.9 },
  brandName: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.8rem', color: '#fff', letterSpacing: '-0.5px' },
  brandTagline: { fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', marginTop: 8, lineHeight: 1.6 },
  features: { display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 40 },
  featureItem: { display: 'flex', alignItems: 'center', gap: 12 },
  featureIconLeft: {
    width: 34, height: 34, borderRadius: 9,
    background: 'rgba(255,255,255,0.1)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0,
  },
  statsWrap: {
    display: 'flex', gap: 0,
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)',
  },
  statItem: { flex: 1, padding: '14px 16px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.08)' },
  statVal: { fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.9rem', color: '#fff' },
  statLbl: { fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', marginTop: 3 },
  right: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg)', padding: '40px 24px',
  },
  formCard: {
    background: 'var(--surface)', borderRadius: 16, padding: '36px 40px',
    boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)',
    width: '100%', maxWidth: 440,
  },
  formHeader: { marginBottom: 24 },
  formTitle: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: 4 },
  formSub: { fontSize: '0.82rem', color: 'var(--text-tertiary)' },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' },
  inputWrap: {
    display: 'flex', alignItems: 'center',
    border: '1px solid var(--border)', borderRadius: 10,
    background: 'var(--surface)', overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  inputIcon: { padding: '0 12px', fontSize: '0.9rem' },
  input: {
    flex: 1, border: 'none', outline: 'none',
    padding: '12px 12px 12px 0', fontSize: '0.85rem',
    color: 'var(--text-primary)', background: 'transparent',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  eyeBtn: { background: 'none', border: 'none', padding: '0 12px', cursor: 'pointer', fontSize: '0.9rem' },
  errorBox: {
    background: 'var(--danger-muted)', border: '1px solid var(--danger-border)',
    borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem', color: 'var(--danger)',
  },
  submitBtn: {
    background: 'linear-gradient(135deg,#0f766e,#14b8a6)',
    color: '#fff', border: 'none', borderRadius: 12,
    padding: '14px', fontSize: '0.9rem', fontWeight: 600,
    cursor: 'pointer', boxShadow: '0 2px 8px rgba(20,184,166,0.2)',
    fontFamily: "'Space Grotesk', sans-serif", transition: 'opacity 0.2s',
    width: '100%',
  },
  formFooter: { marginTop: 20 },
}
