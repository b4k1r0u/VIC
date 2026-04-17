/**
 * @fileoverview recommendations API — functions for the RAG / Gemini recommendation endpoints.
 * Corresponds to backend router: routers/recommendations.py — prefix: /api/recommendations
 *
 * Two modes:
 *  1. Standard POST → full JSON response
 *  2. Streaming POST → SSE stream decoded token by token (typewriter effect in UI)
 */
import apiClient from './client'

const API_BASE = import.meta.env.VITE_API_URL || 'https://s-ismicrisk.onrender.com'

/**
 * @typedef {Object} RecommendationContext
 * @property {'portfolio'|'wilaya'|'commune'|'policy'} scope
 * @property {string} [scope_ref]
 * @property {string} [simulation_id]
 * @property {boolean} [include_damage]
 * @property {string} [user_question]
 */

/**
 * @typedef {Object} Recommendation
 * @property {'CRITIQUE'|'ÉLEVÉE'|'MODÉRÉE'|'OPPORTUNITÉ'} priority
 * @property {'Concentration'|'Réassurance'|'Tarification'|'Croissance'|'Prévention'} category
 * @property {string} title
 * @property {string} description
 * @property {string} action
 * @property {string} [rpa_reference]
 */

export const recommendationAPI = {
  /**
   * POST /api/recommendations
   * Returns full structured response (non-streaming).
   * @param {RecommendationContext} ctx
   * @returns {Promise<{ executive_summary: string, recommendations: Recommendation[], context_sources: string[] }>}
   */
  getRecommendations: (ctx) =>
    apiClient.post('/api/recommendations', ctx).then((r) => r.data),

  /**
   * POST /api/recommendations/stream
   * Server-Sent Events — streams Gemini tokens one by one.
   * Uses native fetch + ReadableStream (not axios) for SSE.
   *
   * @param {RecommendationContext} ctx
   * @param {(text: string) => void} onChunk — called with each decoded text chunk
   * @returns {Promise<void>}
   */
  streamRecommendations: async (ctx, onChunk) => {
    const token = localStorage.getItem('rased_token')
    const resp = await fetch(`${API_BASE}/api/recommendations/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(ctx),
    })

    if (!resp.ok) throw new Error(`Stream failed: ${resp.status}`)

    const reader = resp.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      onChunk(decoder.decode(value))
    }
  },

  /**
   * GET /api/recommendations/latest
   * Returns the last cached recommendation for a given scope.
   * @param {{ scope?: string, scope_ref?: string }} params
   * @returns {Promise<{ executive_summary: string, recommendations: Recommendation[] }|null>}
   */
  getLatest: (params = {}) =>
    apiClient.get('/api/recommendations/latest', { params }).then((r) => r.data),
}
