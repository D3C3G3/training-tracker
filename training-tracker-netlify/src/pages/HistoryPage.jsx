import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'

function SessionCard({ session, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [sets, setSets] = useState(null)
  const [loading, setLoading] = useState(false)

  async function loadSets() {
    if (sets !== null) return
    setLoading(true)
    const { data } = await supabase
      .from('sets')
      .select('*')
      .eq('session_id', session.id)
      .order('exercise_name')
      .order('set_number')
    setSets(data || [])
    setLoading(false)
  }

  function toggle() {
    if (!expanded) loadSets()
    setExpanded(e => !e)
  }

  // Group sets by exercise
  const byExercise = {}
  if (sets) {
    for (const s of sets) {
      if (!byExercise[s.exercise_name]) byExercise[s.exercise_name] = []
      byExercise[s.exercise_name].push(s)
    }
  }

  const totalSets = sets?.length || 0
  const totalWeight = sets?.reduce((acc, s) => acc + s.weight * s.reps, 0) || 0

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        className="flex items-center justify-between"
        style={{ padding: '16px 20px', cursor: 'pointer', background: 'var(--bg3)' }}
        onClick={toggle}
      >
        <div className="flex items-center gap-16">
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--text)' }}>
              {session.day_name || 'Sesión'}
            </div>
            <div className="text-xs text-dim">
              {format(new Date(session.date + 'T12:00'), "EEEE d 'de' MMMM yyyy", { locale: es })}
            </div>
          </div>
          {sets !== null && (
            <div className="flex gap-8">
              <span className="tag tag-muted">{totalSets} series</span>
              <span className="tag tag-accent">{Math.round(totalWeight).toLocaleString()} kg vol.</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-8">
          <button
            className="btn btn-danger btn-sm"
            onClick={e => { e.stopPropagation(); onDelete(session.id) }}
          >
            <Trash2 size={12} />
          </button>
          {expanded ? <ChevronUp size={16} color="var(--text3)" /> : <ChevronDown size={16} color="var(--text3)" />}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '20px' }}>
          {session.notes && (
            <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg3)', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--accent)' }}>
              <div className="text-xs text-dim mb-4">NOTA DE SESIÓN</div>
              <div className="text-sm">{session.notes}</div>
            </div>
          )}

          {loading ? <div className="spinner" style={{ margin: '20px auto' }} /> : (
            Object.entries(byExercise).map(([ex, exSets]) => (
              <div key={ex} style={{ marginBottom: '20px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--accent)', marginBottom: '8px' }}>{ex}</div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Serie</th>
                        <th>Peso</th>
                        <th>Reps</th>
                        <th>RIR</th>
                        <th>Nota</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exSets.map(s => (
                        <tr key={s.id}>
                          <td style={{ color: 'var(--text3)' }}>{s.set_number}</td>
                          <td style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text)' }}>{s.weight} kg</td>
                          <td>{s.reps}</td>
                          <td>RIR {s.rir}</td>
                          <td style={{ color: 'var(--text3)', fontStyle: s.notes ? 'normal' : 'italic' }}>{s.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function HistoryPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => { if (user) fetchSessions() }, [user])

  async function fetchSessions() {
    setLoading(true)
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    setSessions(data || [])
    setLoading(false)
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta sesión y todas sus series?')) return
    await supabase.from('sets').delete().eq('session_id', id)
    await supabase.from('sessions').delete().eq('id', id)
    fetchSessions()
  }

  const filtered = sessions.filter(s =>
    !filter || s.day_name?.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <h2>HISTORIAL</h2>
        <p>Todas tus sesiones registradas</p>
      </div>

      <div className="card mb-24">
        <input
          type="text"
          placeholder="Buscar por día (Lunes, Martes...)"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center" style={{ height: '200px' }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <div className="text-muted">Sin sesiones registradas</div>
        </div>
      ) : (
        <div className="flex-col gap-8">
          {filtered.map(s => (
            <SessionCard key={s.id} session={s} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
