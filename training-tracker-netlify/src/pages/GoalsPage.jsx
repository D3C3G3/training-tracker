import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase, ALL_EXERCISES } from '../lib/supabase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, Trophy, Target, Trash2, CheckCircle } from 'lucide-react'

function GoalCard({ goal, onDelete, onAchieve }) {
  const pct = Math.min(100, Math.round((goal.current_max / goal.target_weight) * 100))
  const remaining = Math.max(0, goal.target_weight - goal.current_max)
  const isNear = pct >= 80

  return (
    <div className="goal-card" style={{ borderColor: goal.achieved ? 'var(--success)' : isNear ? 'rgba(232,255,0,0.3)' : 'var(--border)' }}>
      <div className="flex items-center justify-between">
        <div className="goal-exercise">{goal.exercise_name}</div>
        <div className="flex gap-8">
          {!goal.achieved && (
            <button className="btn btn-ghost btn-sm" onClick={() => onAchieve(goal.id)} title="Marcar como conseguida">
              <CheckCircle size={14} />
            </button>
          )}
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(goal.id)}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {goal.achieved ? (
        <div className="flex items-center gap-8" style={{ color: 'var(--success)' }}>
          <Trophy size={16} />
          <span className="text-sm">¡Meta conseguida! {goal.achieved_at && format(new Date(goal.achieved_at), "d MMM yyyy", { locale: es })}</span>
        </div>
      ) : (
        <>
          <div className="goal-numbers">
            <span className="goal-current">{goal.current_max}</span>
            <span className="goal-separator">/</span>
            <span className="goal-target">{goal.target_weight}</span>
            <span className="goal-unit">kg</span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-dim">{pct}% del objetivo</span>
              <span className="text-xs" style={{ color: isNear ? 'var(--accent)' : 'var(--text3)' }}>
                {remaining > 0 ? `Faltan ${remaining} kg` : '¡Objetivo alcanzado!'}
              </span>
            </div>
            <div className="progress-track">
              <div
                className={`progress-fill ${pct >= 100 ? 'success' : isNear ? '' : 'orange'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {goal.target_date && (
            <div className="text-xs text-dim">
              Fecha objetivo: {format(new Date(goal.target_date + 'T12:00'), "d 'de' MMMM yyyy", { locale: es })}
            </div>
          )}

          {goal.notes && <div className="text-xs text-muted">{goal.notes}</div>}
        </>
      )}
    </div>
  )
}

export default function GoalsPage() {
  const { user } = useAuth()
  const [goals, setGoals] = useState([])
  const [achieved, setAchieved] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ exercise_name: ALL_EXERCISES[0], target_weight: '', target_date: '', notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (user) fetchGoals() }, [user])

  async function fetchGoals() {
    setLoading(true)
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const goalsWithMax = await Promise.all((data || []).map(async (g) => {
      const { data: setsData } = await supabase
        .from('sets')
        .select('weight')
        .eq('user_id', user.id)
        .eq('exercise_name', g.exercise_name)
        .order('weight', { ascending: false })
        .limit(1)
      return { ...g, current_max: setsData?.[0]?.weight || 0 }
    }))

    setGoals(goalsWithMax.filter(g => !g.achieved))
    setAchieved(goalsWithMax.filter(g => g.achieved))
    setLoading(false)
  }

  async function handleCreate() {
    if (!form.target_weight) return
    setSaving(true)
    const { error } = await supabase.from('goals').insert({
      user_id: user.id,
      exercise_name: form.exercise_name,
      target_weight: parseFloat(form.target_weight),
      target_date: form.target_date || null,
      notes: form.notes || null
    })
    if (!error) { setShowModal(false); setForm({ exercise_name: ALL_EXERCISES[0], target_weight: '', target_date: '', notes: '' }); fetchGoals() }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta meta?')) return
    await supabase.from('goals').delete().eq('id', id)
    fetchGoals()
  }

  async function handleAchieve(id) {
    await supabase.from('goals').update({ achieved: true, achieved_at: new Date().toISOString() }).eq('id', id)
    fetchGoals()
  }

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h2>METAS</h2>
            <p>Define tus objetivos y sigue tu progreso</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Nueva meta
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center" style={{ height: '200px' }}>
          <div className="spinner" />
        </div>
      ) : (
        <>
          {/* Active goals */}
          {goals.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Target size={40} color="var(--text3)" style={{ margin: '0 auto 16px' }} />
              <div className="text-muted">Sin metas activas</div>
              <div className="text-dim text-sm" style={{ marginTop: '4px' }}>Crea tu primer objetivo de peso</div>
            </div>
          ) : (
            <div className="grid-2 mb-32">
              {goals.map(g => (
                <GoalCard key={g.id} goal={g} onDelete={handleDelete} onAchieve={handleAchieve} />
              ))}
            </div>
          )}

          {/* Achieved goals */}
          {achieved.length > 0 && (
            <div>
              <div className="flex items-center gap-8 mb-16">
                <Trophy size={16} color="var(--success)" />
                <h3 style={{ fontSize: '1.25rem', color: 'var(--success)' }}>CONSEGUIDAS</h3>
              </div>
              <div className="grid-2">
                {achieved.map(g => (
                  <GoalCard key={g.id} goal={g} onDelete={handleDelete} onAchieve={() => {}} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.5rem' }}>NUEVA META</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="flex-col gap-16">
                <div className="form-group">
                  <label>Ejercicio</label>
                  <select value={form.exercise_name} onChange={e => setForm(f => ({ ...f, exercise_name: e.target.value }))}>
                    {ALL_EXERCISES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Peso objetivo (kg) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="ej: 200"
                    value={form.target_weight}
                    onChange={e => setForm(f => ({ ...f, target_weight: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Fecha objetivo (opcional)</label>
                  <input
                    type="date"
                    value={form.target_date}
                    onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Nota (opcional)</label>
                  <textarea
                    rows={2}
                    placeholder="¿Por qué quieres llegar a este peso?"
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving || !form.target_weight}>
                {saving ? 'Guardando...' : 'Crear meta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
