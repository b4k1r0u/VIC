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
  icon: { fontSize: '3.5rem' },
  h2: {
    fontFamily: 'Syne, sans-serif',
    fontSize: '1.25rem', fontWeight: 700,
    color: 'var(--text-2)',
  },
  p: { fontSize: '0.85rem', color: 'var(--text-3)' },
  badge: {
    marginTop: 4,
    background: 'var(--green-50)',
    border: '1px solid var(--green-200)',
    color: 'var(--green-700)',
    borderRadius: 20, padding: '6px 16px',
    fontSize: '0.72rem', fontWeight: 600,
  },
}
