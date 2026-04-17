import React from 'react'

export default function ComingSoon({ icon, title, description }) {
  return (
    <main style={S.page} className="page-fade">
      <div style={S.center}>
        <div style={S.icon}>{icon}</div>
        <h2 style={S.h2}>{title}</h2>
        <p style={S.p}>{description}</p>
        <div style={S.badge}>🔨 Module en développement — Étape suivante</div>
      </div>
    </main>
  )
}

const S = {
  page: { flex: 1, overflowY: 'auto', padding: '22px 28px' },
  center: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    height: '65vh', gap: 14,
  },
  icon: { fontSize: '3rem' },
  h2: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '1.2rem', fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  p: { fontSize: '0.85rem', color: 'var(--text-tertiary)' },
  badge: {
    marginTop: 4,
    background: 'var(--primary-50)',
    border: '1px solid rgba(20,184,166,0.12)',
    color: 'var(--primary-700)',
    borderRadius: 20, padding: '6px 16px',
    fontSize: '0.72rem', fontWeight: 600,
  },
}
