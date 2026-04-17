/**
 * @fileoverview router.jsx — all route definitions for RASED.
 *
 * Routes:
 *   /              → Dashboard   (map + KPIs + alerts + simulation sidebar)
 *   /simulation    → Simulation  (full-page Monte Carlo)
 *   /policies      → PolicyManager (table + form + scoring)
 *   /parametric    → ParametricInsurance (image upload + damage AI)
 *
 * Note: This router is used when React Router v6 is integrated.
 * The existing App.jsx uses manual state-based routing — this file
 * can replace it once React Router is wired into main.jsx.
 */
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Dashboard           from './pages/Dashboard'
import Simulation          from './pages/Simulation'
import PolicyManager       from './pages/PolicyManager'
import ParametricInsurance from './pages/ParametricInsurance'

/**
 * Standalone router — import and render this in main.jsx instead of <App />
 * when you are ready to switch to React Router-based navigation.
 *
 * Example main.jsx:
 *   import AppRouter from './router'
 *   ReactDOM.createRoot(document.getElementById('root')).render(<AppRouter />)
 */
export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<Dashboard />} />
        <Route path="/simulation"  element={<Simulation />} />
        <Route path="/policies"    element={<PolicyManager />} />
        <Route path="/parametric"  element={<ParametricInsurance />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

/**
 * NAV_LINKS — consumed by Layout.jsx sidebar to render navigation items.
 * Import this constant to keep nav in sync with route definitions.
 */
export const NAV_LINKS = [
  { path: '/',           label: 'Tableau de bord', icon: '🗺️'  },
  { path: '/simulation', label: 'Monte Carlo',      icon: '📊'  },
  { path: '/policies',   label: 'Portefeuille',     icon: '📋'  },
  { path: '/parametric', label: 'Paramétrique',     icon: '🛰️'  },
]
