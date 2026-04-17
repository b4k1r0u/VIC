/**
 * @fileoverview policyStore — owns the policy portfolio state.
 * The Policy Manager is where raw data lives. When a policy is added it
 * is enriched with its RPA zone + geocoordinates + CatBoost score.
 */
import { create } from 'zustand'
import { policiesAPI } from '../api/policies'

const DEFAULT_FILTERS = {
  zone: undefined,
  wilaya_code: undefined,
  type_risque: undefined,
  risk_tier: undefined,
  year: undefined,
  min_value: undefined,
  max_value: undefined,
  search: undefined,
}

const usePolicyStore = create((set, get) => ({
  // ── State ────────────────────────────────────────────────────────────────────
  /** @type {import('../types/policy').Policy[]} */
  policies: [],

  total: 0,
  page: 1,
  pageSize: 50,

  /** @type {import('../types/policy').PolicyFilters} */
  filters: { ...DEFAULT_FILTERS },

  isLoading: false,
  error: null,

  /** Policy currently selected in the table (for detail view) */
  selectedPolicy: null,

  // ── Actions ──────────────────────────────────────────────────────────────────
  setPage: (page) => set({ page }),
  setFilters: (filters) => set({ filters: { ...get().filters, ...filters }, page: 1 }),
  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS }, page: 1 }),
  selectPolicy: (policy) => set({ selectedPolicy: policy }),

  fetchPolicies: async (overrideFilters) => {
    const { filters, page, pageSize } = get()
    set({ isLoading: true, error: null })
    try {
      const params = { ...filters, ...overrideFilters, page, size: pageSize }
      const data = await policiesAPI.getAll(params)
      set({ policies: data.items, total: data.total, isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  /**
   * Create a new policy.
   * Backend runs the full enrichment pipeline:
   *   zone lookup → geocoding → CatBoost scoring → premium adequacy
   * @param {import('../types/policy').CreatePolicyDTO} data
   * @returns {Promise<import('../types/policy').Policy>}
   */
  addPolicy: async (data) => {
    const policy = await policiesAPI.create(data)
    set((state) => ({
      policies: [policy, ...state.policies],
      total: state.total + 1,
    }))
    return policy
  },

  updatePolicy: async (id, data) => {
    const updated = await policiesAPI.update(id, data)
    set((state) => ({
      policies: state.policies.map((p) => (p.id === id ? updated : p)),
      selectedPolicy: state.selectedPolicy?.id === id ? updated : state.selectedPolicy,
    }))
    return updated
  },

  deletePolicy: async (id) => {
    await policiesAPI.remove(id)
    set((state) => ({
      policies: state.policies.filter((p) => p.id !== id),
      total: state.total - 1,
      selectedPolicy: state.selectedPolicy?.id === id ? null : state.selectedPolicy,
    }))
  },
}))

export default usePolicyStore
