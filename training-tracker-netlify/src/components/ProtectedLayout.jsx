import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Sidebar from './Sidebar'

export default function ProtectedLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="flex-col items-center gap-16">
          <div className="spinner" />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text3)' }}>IRONLOG</span>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/" replace />

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
