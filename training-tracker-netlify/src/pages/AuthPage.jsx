import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: '', password: '', username: '', fullName: ''
  })

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setError('') }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'login') {
      const { error } = await signIn(form.email, form.password)
      if (error) setError(error.message)
      else navigate('/dashboard')
    } else {
      if (!form.username.trim()) { setError('El nombre de usuario es obligatorio'); setLoading(false); return }
      const { error } = await signUp(form.email, form.password, form.username, form.fullName)
      if (error) setError(error.message)
      else setError('✓ Revisa tu email para confirmar la cuenta')
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1 className="auth-title">IRONLOG</h1>
        <p className="auth-subtitle">Powerlifting Tracker</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <div className="form-group">
                <label>Nombre completo</label>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={form.fullName}
                  onChange={e => set('fullName', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Usuario *</label>
                <input
                  type="text"
                  placeholder="powerlifter42"
                  value={form.username}
                  onChange={e => set('username', e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={loading}>
            {loading ? '...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? (
            <>¿Sin cuenta?<button onClick={() => setMode('register')}>Regístrate</button></>
          ) : (
            <>¿Ya tienes cuenta?<button onClick={() => setMode('login')}>Iniciar sesión</button></>
          )}
        </div>
      </div>
    </div>
  )
}
