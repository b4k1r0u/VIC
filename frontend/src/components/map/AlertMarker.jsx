/**
 * @fileoverview AlertMarker — pulsing epicenter circle for live seismic alerts.
 * Appears on the map when a new alert fires from the WebSocket.
 * Pulse animation intensity scales with alert severity.
 *
 * @param {{ alert: import('../../types/alert').SeismicAlert }} props
 */
import React from 'react'
import { CircleMarker, Popup } from 'react-leaflet'
import { SEVERITY_COLORS } from '../../types/alert'

export default function AlertMarker({ alert }) {
  if (!alert?.lat || !alert?.lon) return null

  const color = SEVERITY_COLORS[alert.severity] ?? '#ef4444'
  const radius = alert.severity === 'CRITICAL' ? 24
    : alert.severity === 'HIGH' ? 18
    : alert.severity === 'MODERATE' ? 13
    : 9

  const eventTime = new Date(alert.event_time).toLocaleString('fr-DZ')

  return (
    <>
      {/* Outer pulse ring */}
      <CircleMarker
        center={[alert.lat, alert.lon]}
        radius={radius * 2.2}
        pathOptions={{ color, fillColor: color, fillOpacity: 0.12, weight: 1.5 }}
      />
      {/* Inner solid circle */}
      <CircleMarker
        center={[alert.lat, alert.lon]}
        radius={radius}
        pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 2 }}
      >
        <Popup>
          <div style={{ minWidth: 200 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
              🌍 M{alert.magnitude.toFixed(1)} — {alert.severity}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              <div>{alert.location_desc}</div>
              <div>Profondeur : {alert.depth_km} km</div>
              <div>Zone RPA : {alert.rpa_zone}</div>
              <div>Wilaya : {alert.nearest_wilaya}</div>
              <div style={{ marginTop: 4, opacity: 0.7 }}>{eventTime}</div>
            </div>
          </div>
        </Popup>
      </CircleMarker>
    </>
  )
}
