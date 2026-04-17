/**
 * @fileoverview AlgeriaMap — THE central map component.
 *
 * Responsibilities (from architecture doc):
 *  1. Renders the base map (OpenStreetMap tiles)
 *  2. Renders CommuneLayer  → choropleth by selectedLayer
 *  3. Renders ExposureBubbles → circles sized by valeur_assurée
 *  4. Renders SimulationOverlay → heatmap of loss intensity post-simulation
 *  5. Renders AlertMarker → pulsing icon when live earthquake alert
 *  6. Handles click events → updates selectedWilaya / selectedCommune in mapStore
 *  7. Side panel opens when a zone is selected
 *
 * Props: none — reads directly from mapStore
 */
import React from 'react'
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import CommuneLayer from './CommuneLayer'
import ExposureBubbles from './ExposureBubbles'
import SimulationOverlay from './SimulationOverlay'
import AlertMarker from './AlertMarker'
import { useMapData } from '../../hooks/useMapData'
import useAlertStore from '../../store/alertStore'
import useSimulationStore from '../../store/simulationStore'

// Algeria bounding box centre
const ALGERIA_CENTER = [28.0339, 1.6596]
const DEFAULT_ZOOM = 5

export default function AlgeriaMap() {
  const { communeData, activeLayer, handleCommuneClick } = useMapData()
  const latestAlert = useAlertStore((s) => s.latestAlert)
  const simulationResult = useSimulationStore((s) => s.result)

  return (
    <MapContainer
      center={ALGERIA_CENTER}
      zoom={DEFAULT_ZOOM}
      zoomControl={false}
      style={{ width: '100%', height: '100%', background: '#0f172a' }}
    >
      {/* Base tiles */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        maxZoom={19}
      />

      <ZoomControl position="bottomright" />

      {/* Layer: choropleth coloring by zone / exposure / score */}
      <CommuneLayer
        features={communeData}
        activeLayer={activeLayer}
        onCommuneClick={handleCommuneClick}
      />

      {/* Layer: exposure bubbles (circles sized by valeur_assurée) */}
      {activeLayer === 'exposure' && (
        <ExposureBubbles features={communeData} />
      )}

      {/* Layer: simulation loss intensity overlay (shown after Monte Carlo run) */}
      {activeLayer === 'simulation' && simulationResult && (
        <SimulationOverlay result={simulationResult} />
      )}

      {/* Alert marker: pulsing epicenter circle when live alert fires */}
      {latestAlert && <AlertMarker alert={latestAlert} />}
    </MapContainer>
  )
}
