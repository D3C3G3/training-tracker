import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import LogPage from './pages/LogPage'
import ProgressPage from './pages/ProgressPage'
import GoalsPage from './pages/GoalsPage'
import HistoryPage from './pages/HistoryPage'
import RoutinePage from './pages/RoutinePage'
import ProtectedLayout from './components/ProtectedLayout'
import './styles/global.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/log" element={<LogPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/routine" element={<RoutinePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
