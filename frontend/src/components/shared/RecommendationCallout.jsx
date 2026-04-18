import React, { useMemo } from 'react'
import { Sparkles } from 'lucide-react'
import { extractRecommendationSentence } from '../../utils/recommendation'

export default function RecommendationCallout({
  payload,
  eyebrow = 'Backend Recommendation',
  title = 'Recommended statement',
  badgeLabel = 'Live response',
  emptyMessage = 'No usable recommendation was returned.',
  accent = '#0f766e',
  surface = 'linear-gradient(180deg, #f0fdfa 0%, #ffffff 100%)',
  borderColor = '#99f6e4',
  quoteSurface = 'rgba(255,255,255,0.82)',
}) {
  const sentence = useMemo(() => extractRecommendationSentence(payload), [payload])

  return (
    <div style={{ ...S.wrap, background: surface, borderColor }}>
      <div style={S.header}>
        <div style={S.headerLeft}>
          <div style={{ ...S.iconWrap, color: accent, background: `${accent}14` }}>
            <Sparkles size={16} />
          </div>
          <div>
            <div style={S.eyebrow}>{eyebrow}</div>
            <div style={S.title}>{title}</div>
          </div>
        </div>

        <div style={{ ...S.badge, color: accent, borderColor: `${accent}30`, background: `${accent}10` }}>
          {badgeLabel}
        </div>
      </div>

      <div style={{ ...S.quotePanel, background: quoteSurface, borderColor: `${accent}20` }}>
        <div style={{ ...S.quoteMark, color: `${accent}30` }}>“</div>
        <p style={S.quoteText}>{sentence || emptyMessage}</p>
      </div>
    </div>
  )
}

const S = {
  wrap: {
    border: '1px solid',
    borderRadius: 18,
    padding: '16px 18px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  eyebrow: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    color: '#94a3b8',
    fontWeight: 700,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 800,
    color: '#0f172a',
  },
  badge: {
    border: '1px solid',
    borderRadius: 999,
    padding: '6px 11px',
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  quotePanel: {
    position: 'relative',
    border: '1px solid',
    borderRadius: 16,
    padding: '18px 18px 18px 28px',
    minHeight: 96,
  },
  quoteMark: {
    position: 'absolute',
    top: 8,
    left: 12,
    fontSize: 34,
    lineHeight: 1,
    fontFamily: 'Georgia, serif',
    userSelect: 'none',
  },
  quoteText: {
    margin: 0,
    color: '#1e293b',
    fontSize: 14,
    lineHeight: 1.8,
    fontWeight: 600,
  },
}
