import React, { useState } from 'react'
import LandingPage   from './pages/LandingPage'
import LoginPage     from './pages/LoginPage'
import { Sidebar, Topbar } from './components/Layout'
import OverviewPage  from './pages/OverviewPage'
import RiskMapPage   from './pages/RiskMapPage'
import SimulatorPage from './pages/SimulatorPage'
import BalancePage   from './pages/BalancePage'
import AIPage        from './pages/AIPage'
import AlertsPage    from './pages/AlertsPage'
import SandboxPage   from './pages/SandboxPage'

// screen: 'landing' | 'login' | 'dashboard'
export default function App() {
  const [screen, setScreen] = useState('landing')
  const [user, setUser]     = useState(null)
  const [page, setPage]     = useState('overview')

  const handleLogin = (u) => {
    setUser(u)
    setScreen('dashboard')
  }
  const handleLogout = () => {
    setUser(null)
    setScreen('landing')
  }

  /* Landing */
  if (screen === 'landing') {
    return <LandingPage onLogin={() => setScreen('login')} />
  }

  /* Login */
  if (screen === 'login') {
    return <LoginPage onLogin={handleLogin} onBack={() => setScreen('landing')} />
  }

  /* Dashboard */
  const renderPage = () => {
    switch (page) {
      case 'overview':  return <OverviewPage />
      case 'map':       return <RiskMapPage />
      case 'simulator': return <SimulatorPage />
      case 'balance':   return <BalancePage />
      case 'ai':        return <AIPage />
      case 'alerts':    return <AlertsPage />
      case 'sandbox':   return <SandboxPage />
      default:          return <OverviewPage />
    }
  }

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      <Sidebar current={page} onNavigate={setPage} user={user} onLogout={handleLogout} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <Topbar pageId={page} user={user} />
        {renderPage()}
      </div>
    </div>
  )
}
