/**
 * @fileoverview alertStore — owns real-time seismic alert state.
 * Alerts arrive via WebSocket (useSeismicAlerts hook) and are stored here.
 * Components subscribe only to what they need.
 */
import { create } from 'zustand'

const useAlertStore = create((set, get) => ({
  // ── State ────────────────────────────────────────────────────────────────────
  /** @type {import('../types/alert').SeismicAlert[]} */
  alerts: [],

  isConnected: false,

  /** @type {import('../types/alert').SeismicAlert|null} */
  latestAlert: null,

  /** IDs of alerts the user has read/dismissed */
  readIds: new Set(),

  // ── Actions ──────────────────────────────────────────────────────────────────
  setConnected: (status) => set({ isConnected: status }),

  /**
   * Add a new alert — deduplicates by id.
   * Also sets latestAlert for the banner trigger.
   */
  addAlert: (alert) =>
    set((state) => {
      const exists = state.alerts.some((a) => a.id === alert.id)
      if (exists) return {}
      return {
        alerts: [alert, ...state.alerts].slice(0, 100), // cap at 100
        latestAlert: alert,
      }
    }),

  /** Add multiple alerts at once (used for history on WebSocket connect) */
  addAlerts: (alerts) =>
    set((state) => {
      const existingIds = new Set(state.alerts.map((a) => a.id))
      const newOnes = alerts.filter((a) => !existingIds.has(a.id))
      return { alerts: [...newOnes, ...state.alerts].slice(0, 100) }
    }),

  markAsRead: (id) =>
    set((state) => ({ readIds: new Set([...state.readIds, id]) })),

  markAllRead: () =>
    set((state) => ({ readIds: new Set(state.alerts.map((a) => a.id)) })),

  clearAll: () => set({ alerts: [], latestAlert: null, readIds: new Set() }),

  dismissLatest: () => set({ latestAlert: null }),

  // ── Derived ──────────────────────────────────────────────────────────────────
  get unreadCount() {
    const { alerts, readIds } = get()
    return alerts.filter((a) => !readIds.has(a.id)).length
  },
}))

export default useAlertStore
