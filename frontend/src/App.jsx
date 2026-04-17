import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
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

function DashboardLayout({ user, onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  
  // Extract page id from path
  const pageId = location.pathname.split('/')[1] || 'overview'

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      <Sidebar 
        current={pageId} 
        onNavigate={(id) => navigate(`/${id}`)} 
        user={user} 
        onLogout={onLogout} 
      />
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <Topbar pageId={pageId} user={user} />
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/map" element={<RiskMapPage />} />
          <Route path="/simulator" element={<SimulatorPage />} />
          <Route path="/balance" element={<BalancePage />} />
          <Route path="/ai" element={<AIPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/sandbox" element={<SandboxPage />} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </div>
    </div>
  )
}

function InnerApp() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('rased_auth_user')
    return saved ? JSON.parse(saved) : null
  })
  const navigate = useNavigate()

  const handleLogin = (u) => {
    localStorage.setItem('rased_auth_user', JSON.stringify(u))
    setUser(u)
    navigate('/overview')
  }

  const handleLogout = () => {
    localStorage.removeItem('rased_auth_user')
    setUser(null)
    navigate('/landing')
  }

  return (
    <Routes>
      <Route path="/landing" element={<LandingPage onLogin={() => navigate('/login')} />} />
      <Route path="/login" element={
        <LoginPage 
          onLogin={handleLogin} 
          onBack={() => navigate('/landing')} 
        />
      } />
      
      {/* Protected Dashboard Routes */}
      <Route path="/*" element={
        user ? (
          <DashboardLayout user={user} onLogout={handleLogout} />
        ) : (
          <Navigate to="/landing" replace />
        )
      } />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <InnerApp />
    </BrowserRouter>
  )
}
