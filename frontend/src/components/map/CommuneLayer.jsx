/**
 * @fileoverview CommuneLayer — GeoJSON choropleth layer.
 *
 * Colors communes based on activeLayer:
 *   'risk'     → seismic zone colors (green Zone 0 → dark red Zone III)
 *   'exposure' → blue gradient by total valeur_assurée
 *   'score'    → green/orange/red by avg CatBoost risk score
 *
 * @param {{ features: import('../../types/geo').CommuneMapFeature[], activeLayer: string, onCommuneClick: (wilaya: string, commune: string) => void }} props
 */
import React, { useCallback } from 'react'
import { GeoJSON } from 'react-leaflet'
import { ZONE_COLORS } from '../../types/geo'

// Exposure gradient — light → dark blue
function exposureColor(value, maxValue) {
  const ratio = maxValue > 0 ? Math.min(value / maxValue, 1) : 0
  const lightness = Math.round(80 - ratio * 55)
  return `hsl(217, 91%, ${lightness}%)`
}

// Score gradient — green (0–33), orange (34–66), red (67–100)
function scoreColor(score) {
  if (score <= 33) return '#22c55e'
  if (score <= 66) return '#f97316'
  return '#ef4444'
}

function getFeatureColor(feature, activeLayer, maxExposure) {
  switch (activeLayer) {
    case 'risk':
      return ZONE_COLORS[feature.properties?.zone_sismique] ?? '#64748b'
    case 'exposure':
      return exposureColor(feature.properties?.total_exposure ?? 0, maxExposure)
    case 'score':
      return scoreColor(feature.properties?.avg_risk_score ?? 0)
    default:
      return '#334155'
  }
}

export default function CommuneLayer({ features, activeLayer, onCommuneClick }) {
  const maxExposure = features.reduce(
    (m, f) => Math.max(m, f.properties?.total_exposure ?? 0),
    0
  )

  const style = useCallback(
    (feature) => ({
      fillColor: getFeatureColor(feature, activeLayer, maxExposure),
      fillOpacity: 0.72,
      color: '#1e293b',
      weight: 0.6,
    }),
    [activeLayer, maxExposure]
  )

  const onEachFeature = useCallback(
    (feature, layer) => {
      const p = feature.properties ?? {}
      layer.bindTooltip(
        `<strong>${p.commune_name}</strong><br/>Zone ${p.zone_sismique} · ${p.policy_count ?? 0} polices`,
        { sticky: true, className: 'rased-tooltip' }
      )
      layer.on('click', () => {
        onCommuneClick?.(p.wilaya_code, p.commune_code)
      })
      layer.on('mouseover', () => layer.setStyle({ fillOpacity: 0.9, weight: 1.5 }))
      layer.on('mouseout', () =>  layer.setStyle({ fillOpacity: 0.72, weight: 0.6 }))
    },
    [onCommuneClick]
  )

  if (!features?.length) return null

  return (
    <GeoJSON
      key={activeLayer}
      data={{ type: 'FeatureCollection', features }}
      style={style}
      onEachFeature={onEachFeature}
    />
  )
}
