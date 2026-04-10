import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase, WEEKLY_ROUTINE } from '../lib/supabase'
import { format, startOfWeek, endOfWeek, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { Dumbbell, Target, TrendingUp, Calendar, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ sessions: 0, totalSets: 0, thisWeek: 0 })
  const [recentSessions, setRecentSessions] = useState([])
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)

  const today = new Date()
  const dayName = format(today, 'EEEE', { locale: es })
  const dayKey = dayName.charAt(0).toUpperCase() + dayName.slice(1)
  const todayRoutine = WEEKLY_ROUTINE[dayKey] || []

  useEffect(() => {
    if (!user) return
    fetchData()
  }, [user])

  async function fetchData() {
    setLoading(true)
    const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')

    const [sessRes, weekRes, setsRes, goalsRes] = await Promise.all([
      supabase.from('sessions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(5),
      supabase.from('sessions').select('id').eq('user_id', user.id).gte('date', weekStart).lte('date', weekEnd),
      supabase.from('sets').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('goals').select('*, sets(weight)').eq('user_id', user.id).eq('achieved', false).limit(4)
    ])

    setRecentSessions(sessRes.data || [])
    setStats({
      sessions: sessRes.data?.length || 0,
      thisWeek: weekRes.data?.length || 0,
      totalSets: setsRes.count || 0
    })

    // Para goals, obtenemos el max actual de cada ejercicio
    const goalsWithProgress = await Promise.all((goalsRes.data || []).map(async (g) => {
      const { data } = await supabase
        .from('sets')
        .select('weight')
        .eq('user_id', user.id)
        .eq('exercise_name', g.exercise_name)
        .order('weight', { ascending: false })
        .limit(1)
      return { ...g, current_max: data?.[0]?.weight || 0 }
    }))

    setGoals(goalsWithProgress)
    setLoading(false)
  }

  const hour = today.getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div>
      <div className="page-header">
        <h2>{greeting}, {profile?.username || 'atleta'}</h2>
        <p>{format(today, "EEEE, d 'de' MMMM", { locale: es })} — {todayRoutine.length > 0 ? `Día de ${dayKey}` : 'Día de descanso'}</p>
      </div>

      {/* Stats row */}
      <div className="grid-4 mb-24">
        <div className="stat-card">
          <div className="stat-label">Sesiones totales</div>
          <div className="stat-value">{stats.sessions}</div>
          <div className="stat-sub">registradas</div>
        </div>
        <div className="stat-card" style={{ '--accent': 'var(--accent2)' }}>
          <div className="stat-label">Esta semana</div>
          <div className="stat-value">{stats.thisWeek}</div>
          <div className="stat-sub">entrenamientos</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Series totales</div>
          <div className="stat-value">{stats.totalSets}</div>
          <div className="stat-sub">completadas</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Metas activas</div>
          <div className="stat-value">{goals.length}</div>
          <div className="stat-sub">en progreso</div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: '24px' }}>
        {/* Today's routine */}
        <div>
          <div className="flex items-center justify-between mb-16">
            <h3 style={{ fontSize: '1.5rem' }}>HOY — {dayKey.toUpperCase()}</h3>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/log')}>
              <Dumbbell size={14} /> Registrar
            </button>
          </div>

          {todayRoutine.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💤</div>
              <div className="text-muted">Día de descanso</div>
              <div className="text-dim text-sm" style={{ marginTop: '4px' }}>Recupera y vuelve más fuerte</div>
            </div>
          ) : (
            <div className="day-card">
              {todayRoutine.map((ex, i) => (
                <div className="exercise-row" key={i}>
                  <div>
                    <div className="exercise-name">{ex.exercise}</div>
                  </div>
                  <div className="exercise-prescription">{ex.prescription}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent sessions + Goals */}
        <div className="flex-col gap-24">
          {/* Goals preview */}
          <div>
            <div className="flex items-center justify-between mb-16">
              <h3 style={{ fontSize: '1.5rem' }}>METAS</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/goals')}>
                Ver todas <ChevronRight size={14} />
              </button>
            </div>

            <div className="flex-col gap-8">
              {goals.length === 0 ? (
                <div className="card text-muted text-sm" style={{ textAlign: 'center', padding: '20px' }}>
                  Sin metas activas. <button onClick={() => navigate('/goals')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>Añade una →</button>
                </div>
              ) : goals.map(g => {
                const pct = Math.min(100, Math.round((g.current_max / g.target_weight) * 100))
                return (
                  <div key={g.id} className="card card-sm">
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-sm" style={{ fontWeight: 500 }}>{g.exercise_name}</span>
                      <span className="text-xs text-dim">{g.current_max} / {g.target_weight} kg</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-xs text-dim" style={{ marginTop: '4px' }}>{pct}% conseguido</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent sessions */}
          <div>
            <div className="flex items-center justify-between mb-16">
              <h3 style={{ fontSize: '1.5rem' }}>ÚLTIMAS SESIONES</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/history')}>
                Historial <ChevronRight size={14} />
              </button>
            </div>

            <div className="flex-col gap-8">
              {recentSessions.length === 0 ? (
                <div className="card text-muted text-sm" style={{ textAlign: 'center', padding: '20px' }}>
                  Aún no hay sesiones registradas
                </div>
              ) : recentSessions.slice(0, 3).map(s => (
                <div key={s.id} className="card card-sm flex items-center justify-between" style={{ cursor: 'pointer' }} onClick={() => navigate(`/history`)}>
                  <div>
                    <div className="text-sm" style={{ fontWeight: 500 }}>{s.day_name || 'Sesión'}</div>
                    <div className="text-xs text-dim">{format(new Date(s.date + 'T12:00'), "d 'de' MMMM", { locale: es })}</div>
                  </div>
                  <ChevronRight size={14} color="var(--text3)" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
