import { WEEKLY_ROUTINE } from '../lib/supabase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export default function RoutinePage() {
  const today = new Date()
  const todayName = format(today, 'EEEE', { locale: es })
  const todayKey = todayName.charAt(0).toUpperCase() + todayName.slice(1)

  return (
    <div>
      <div className="page-header">
        <h2>RUTINA SEMANAL</h2>
        <p>Tu programa de entrenamiento</p>
      </div>

      <div className="grid-2" style={{ gap: '16px' }}>
        {DAYS.map(day => {
          const exercises = WEEKLY_ROUTINE[day] || []
          const isToday = day === todayKey
          const isRest = exercises.length === 0

          return (
            <div key={day} className="day-card" style={{
              borderColor: isToday ? 'var(--accent)' : 'var(--border)',
              boxShadow: isToday ? '0 0 0 1px var(--accent)' : 'none'
            }}>
              <div className="day-card-header">
                <div className="day-name">{day.toUpperCase()}</div>
                <div className="flex items-center gap-8">
                  {isToday && <span className="tag tag-accent">Hoy</span>}
                  {isRest
                    ? <span className="tag tag-muted">Descanso</span>
                    : <span className="tag tag-muted">{exercises.length} ejercicios</span>
                  }
                </div>
              </div>

              {isRest ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: '0.875rem' }}>
                  💤 Recuperación activa
                </div>
              ) : exercises.map((ex, i) => (
                <div key={i} className="exercise-row">
                  <div className="exercise-name">{ex.exercise}</div>
                  <div className="exercise-prescription">{ex.prescription}</div>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <h4 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--text2)' }}>LEYENDA</h4>
        <div className="grid-2 gap-16">
          <div className="flex-col gap-8">
            <div className="text-sm"><span style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>@N</span> — RPE (esfuerzo percibido)</div>
            <div className="text-sm"><span style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>RIR N</span> — Reps In Reserve</div>
          </div>
          <div className="flex-col gap-8">
            <div className="text-sm"><span style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>NxM</span> — N series × M reps</div>
            <div className="text-sm"><span style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>2ct / sumo</span> — variante del ejercicio</div>
          </div>
        </div>
      </div>
    </div>
  )
}
