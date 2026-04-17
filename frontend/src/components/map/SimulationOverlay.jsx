/**
 * @fileoverview SimulationOverlay — loss intensity overlay after Monte Carlo run.
 * Colors communes by expected loss amount from the simulation result.
 * Activated automatically when mapStore.activeLayer === 'simulation'.
 *
 * Color scale: transparent → opaque red gradient by loss intensity.
 *
 * @param {{ result: import('../../types/simulation').SimulationResult }} props
 */
import React, { useCallback } from 'react'
import { GeoJSON } from 'react-leaflet'
import { useMapData } from '../../hooks/useMapData'

function lossColor(loss, maxLoss) {
  if (maxLoss === 0) return 'rgba(100,116,139,0.3)'
  const ratio = Math.min(loss / maxLoss, 1)
  const r = Math.round(220 * ratio + 30 * (1 - ratio))
  const g = Math.round(20 * (1 - ratio))
  const b = Math.round(30 * (1 - ratio))
  const a = 0.15 + ratio * 0.75
  return `rgba(${r},${g},${b},${a})`
}

export default function SimulationOverlay({ result }) {
  const { communeData } = useMapData()

  if (!result?.per_commune_json?.length || !communeData?.length) return null

  // Build a lookup: commune_name → expected_loss
  const lossMap = Object.fromEntries(
    result.per_commune_json.map((c) => [c.commune_name, c.expected_loss])
  )

  const maxLoss = Math.max(...result.per_commune_json.map((c) => c.expected_loss), 1)

  // Enrich commune features with loss data
  const enriched = communeData.map((f) => ({
    ...f,
    properties: {
      ...f.properties,
      sim_loss: lossMap[f.properties?.commune_name] ?? 0,
    },
  }))

  const style = useCallback(
    (feature) => ({
      fillColor: lossColor(feature.properties.sim_loss, maxLoss),
      fillOpacity: 1,
      color: '#7f1d1d',
      weight: 0.4,
    }),
    [maxLoss]
  )

  const onEachFeature = useCallback((feature, layer) => {
    const p = feature.properties
    const loss = p.sim_loss
    const fmt = (v) =>
      v >= 1e9 ? `${(v / 1e9).toFixed(2)} Mrd DZD` : `${(v / 1e6).toFixed(1)} M DZD`
    layer.bindTooltip(
      `<strong>${p.commune_name}</strong><br/>Perte estimée : ${fmt(loss)}`,
      { sticky: true }
    )
  }, [])

  return (
    <GeoJSON
      key={`sim-${result.id}`}
      data={{ type: 'FeatureCollection', features: enriched }}
      style={style}
      onEachFeature={onEachFeature}
    />
  )
}
