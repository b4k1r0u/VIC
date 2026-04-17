/**
 * @fileoverview LoadingSpinner — inline animated spinner.
 *
 * @param {{ size?: number, color?: string }} props
 */
import React from 'react'

export default function LoadingSpinner({ size = 20, color = '#6366f1' }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: `${Math.max(2, size / 8)}px solid ${color}33`,
        borderTop: `${Math.max(2, size / 8)}px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        flexShrink: 0,
        verticalAlign: 'middle',
      }}
      aria-label="Chargement…"
    />
  )
}
