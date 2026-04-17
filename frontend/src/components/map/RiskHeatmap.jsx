/**
 * @fileoverview RiskHeatmap — Leaflet.heat heatmap overlay for risk density.
 * Used as an optional enhancement layer; activated separately from SimulationOverlay.
 * Requires leaflet.heat plugin (loaded via CDN or npm if available).
 */
import React, { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'

/**
 * @param {{
 *   points: { lat: number, lon: number, intensity: number }[]
 * }} props
 */
export default function RiskHeatmap({ points }) {
  const map = useMap()
  const heatRef = useRef(null)

  useEffect(() => {
    if (!points?.length) return

    // Dynamically load leaflet.heat if not already present
    if (!window.L?.heatLayer) {
      console.warn('[RiskHeatmap] leaflet.heat not available — layer skipped')
      return
    }

    const heatData = points.map((p) => [p.lat, p.lon, p.intensity])

    if (heatRef.current) {
      map.removeLayer(heatRef.current)
    }

    heatRef.current = window.L.heatLayer(heatData, {
      radius: 25,
      blur: 20,
      maxZoom: 10,
      gradient: { 0.2: '#22c55e', 0.5: '#eab308', 0.8: '#f97316', 1.0: '#dc2626' },
    }).addTo(map)

    return () => {
      if (heatRef.current) {
        map.removeLayer(heatRef.current)
        heatRef.current = null
      }
    }
  }, [map, points])

  return null // imperative Leaflet layer — no JSX output
}
