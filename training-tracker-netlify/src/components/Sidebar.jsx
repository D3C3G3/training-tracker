import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LayoutDashboard, Dumbbell, TrendingUp, Target, History, Calendar, LogOut } from 'lucide-react'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/log', icon: Dumbbell, label: 'Registrar' },
  { to: '/progress', icon: TrendingUp, label: 'Progreso' },
  { to: '/goals', icon: Target, label: 'Metas' },
  { to: '/history', icon: History, label: 'Historial' },
  { to: '/routine', icon: Calendar, label: 'Rutina' },
]

export default function Sidebar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const initials = profile?.username?.slice(0, 2).toUpperCase() || '??'

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>IRON<br/>LOG</h1>
        <span>Powerlifting Tracker</span>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="user-chip" style={{ marginBottom: '8px' }}>
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <strong>{profile?.username || 'Atleta'}</strong>
            <span>{profile?.full_name || ''}</span>
          </div>
        </div>
        <button className="nav-item" onClick={handleSignOut} style={{ color: 'var(--text3)' }}>
          <LogOut size={14} /> Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
