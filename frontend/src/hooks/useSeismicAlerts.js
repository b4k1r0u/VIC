/**
 * @fileoverview useSeismicAlerts — WebSocket hook for real-time seismic alerts.
 *
 * Mounted at App root so it's always active regardless of page.
 * Handles 4 message types:
 *   'history'             → load last 5 alerts on connect
 *   'new_alert'           → add to alertStore; trigger auto-simulation if M≥5.0
 *   'simulation_complete' → update simulationStore with auto-run result
 *   'ping'                → respond with pong to keep connection alive
 *
 * Reconnects automatically after 5 s if connection drops.
 */
import { useEffect, useRef } from 'react'
import useAlertStore from '../store/alertStore'
import useSimulationStore from '../store/simulationStore'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
const RECONNECT_DELAY = 5000

export function useSeismicAlerts() {
  const addAlert    = useAlertStore((s) => s.addAlert)
  const addAlerts   = useAlertStore((s) => s.addAlerts)
  const setConnected = useAlertStore((s) => s.setConnected)
  const setResult   = useSimulationStore((s) => s.setResult)
  const setCustomParams = useSimulationStore((s) => s.setCustomParams)
  const setScenario = useSimulationStore((s) => s.setScenario)
  const runSimulation = useSimulationStore((s) => s.runSimulation)

  const wsRef = useRef(null)
  const reconnectRef = useRef(null)

  useEffect(() => {
    function connect() {
      if (reconnectRef.current) clearTimeout(reconnectRef.current)

      const ws = new WebSocket(`${WS_URL}/ws/alerts`)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        console.info('[WS] Connected to seismic alert stream')
      }

      ws.onmessage = (event) => {
        let msg
        try { msg = JSON.parse(event.data) } catch { return }

        switch (msg.type) {
          case 'history':
            // Server sends last 5 alerts immediately on connect
            addAlerts(msg.alerts ?? [])
            break

          case 'new_alert': {
            const alert = msg.alert
            addAlert(alert)

            // Auto-trigger Monte Carlo for M ≥ 5.0
            if (alert.magnitude >= 5.0) {
              setScenario('custom')
              setCustomParams({
                epicenter_lat: alert.lat,
                epicenter_lon: alert.lon,
                magnitude: alert.magnitude,
              })
              runSimulation()
            }
            break
          }

          case 'simulation_complete':
            // Auto-run simulation result pushed by backend after alert
            setResult(msg.result)
            break

          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }))
            break

          default:
            break
        }
      }

      ws.onclose = () => {
        setConnected(false)
        console.warn('[WS] Disconnected — reconnecting in 5 s…')
        reconnectRef.current = setTimeout(connect, RECONNECT_DELAY)
      }

      ws.onerror = () => {
        setConnected(false)
        ws.close()
      }
    }

    connect()

    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      wsRef.current?.close()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
