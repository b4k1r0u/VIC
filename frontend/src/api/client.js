/**
 * @fileoverview API client base — configures Axios with base URL + interceptors.
 * All api/ modules import from here. No component should call axios directly.
 */
import axios from 'axios'

export const API_BASE =
  import.meta.env.VITE_API_URL || 'https://s-ismicrisk.onrender.com'

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor ──────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    // Attach auth token when available
    const token = localStorage.getItem('rased_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor ─────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('rased_token')
      // Could dispatch a logout action here
    }
    return Promise.reject(error)
  }
)

export default apiClient
