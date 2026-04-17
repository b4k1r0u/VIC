/**
 * @fileoverview ExposureBubbles — proportional circle markers on the map.
 * Circle radius is scaled by total valeur_assurée per commune.
 * Shown when activeLayer === 'exposure'.
 *
 * @param {{ features: import('../../types/geo').CommuneMapFeature[] }} props
 */
import React from 'react'
import { CircleMarker, Tooltip } from 'react-leaflet'

const MAX_RADIUS = 40
const MIN_RADIUS = 4

function formatDZD(value) {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)} Mrd DZD`
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)} M DZD`
  return `${value.toLocaleString()} DZD`
}

export default function ExposureBubbles({ features }) {
  if (!features?.length) return null

  const maxExposure = features.reduce(
    (m, f) => Math.max(m, f.properties?.total_exposure ?? 0),
    1
  )

  return features
    .filter((f) => f.properties?.total_exposure > 0 && f.properties?.lat && f.properties?.lon)
    .map((f) => {
      const p = f.properties
      const ratio = Math.sqrt(p.total_exposure / maxExposure)
      const radius = MIN_RADIUS + ratio * (MAX_RADIUS - MIN_RADIUS)

      return (
        <CircleMarker
          key={p.commune_code}
          center={[p.lat, p.lon]}
          radius={radius}
          pathOptions={{
            fillColor: '#3b82f6',
            fillOpacity: 0.55,
            color: '#60a5fa',
            weight: 1,
          }}
        >
          <Tooltip sticky>
            <strong>{p.commune_name}</strong>
            <br />
            Exposition: {formatDZD(p.total_exposure)}
            <br />
            {p.policy_count} polices
          </Tooltip>
        </CircleMarker>
      )
    })
}
