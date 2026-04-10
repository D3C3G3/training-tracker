import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase, WEEKLY_ROUTINE, ALL_EXERCISES } from '../lib/supabase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, Trash2, Save, CheckCircle } from 'lucide-react'

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function emptySet(num) {
  return { id: crypto.randomUUID(), set_number: num, reps: '', weight: '', rir: 0, notes: '' }
}

function ExerciseBlock({ exercise, onRemove, onUpdate }) {
  const [sets, setSets] = useState([emptySet(1)])

  function addSet() {
    setSets(s => [...s, emptySet(s.length + 1)])
  }

  function removeSet(id) {
    setSets(s => s.filter(x => x.id !== id).map((x, i) => ({ ...x, set_number: i + 1 })))
  }

  function updateSet(id, field, val) {
    setSets(s => s.map(x => x.id === id ? { ...x, [field]: val } : x))
  }

  useEffect(() => {
    onUpdate(exercise, sets)
  }, [sets])

  return (
    <div className="card mb-16">
      <div className="flex items-center justify-between mb-16">
        <h4 style={{ fontSize: '1.25rem', color: 'var(--text)' }}>{exercise}</h4>
        <button className="btn btn-ghost btn-sm" onClick={() => onRemove(exercise)}>
          <Trash2 size={14} />
        </button>
      </div>

      {/* Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '40px 80px 80px 60px 1fr auto',
        gap: '8px',
        paddingBottom: '8px',
        borderBottom: '1px solid var(--border)',
        marginBottom: '4px'
      }}>
        {['#', 'Peso (kg)', 'Reps', 'RIR', 'Nota', ''].map((h, i) => (
          <span key={i} className="text-xs text-dim" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
        ))}
      </div>

      {sets.map((s) => (
        <div key={s.id} style={{
          display: 'grid',
          gridTemplateColumns: '40px 80px 80px 60px 1fr auto',
          gap: '8px',
          alignItems: 'center',
          paddingTop: '8px',
          paddingBottom: '8px',
          borderBottom: '1px solid var(--border)'
        }}>
          <div className="set-num">{s.set_number}</div>
          <input
            type="number"
            placeholder="0"
            min="0"
            step="0.5"
            value={s.weight}
            onChange={e => updateSet(s.id, 'weight', e.target.value)}
            style={{ padding: '6px 8px', fontSize: '0.9375rem' }}
          />
          <input
            type="number"
            placeholder="0"
            min="0"
            value={s.reps}
            onChange={e => updateSet(s.id, 'reps', e.target.value)}
            style={{ padding: '6px 8px', fontSize: '0.9375rem' }}
          />
          <select
            value={s.rir}
            onChange={e => updateSet(s.id, 'rir', parseInt(e.target.value))}
            style={{ padding: '6px 8px', fontSize: '0.8125rem' }}
          >
            {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <input
            type="text"
            placeholder="Nota opcional..."
            value={s.notes}
            onChange={e => updateSet(s.id, 'notes', e.target.value)}
            style={{ padding: '6px 8px', fontSize: '0.8125rem' }}
          />
          <button
            className="btn btn-danger btn-sm"
            onClick={() => removeSet(s.id)}
            disabled={sets.length === 1}
            style={{ padding: '6px 8px' }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}

      <button className="btn btn-ghost btn-sm" style={{ marginTop: '12px' }} onClick={addSet}>
        <Plus size={14} /> Serie
      </button>
    </div>
  )
}

export default function LogPage() {
  const { user } = useAuth()
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const dayName = format(today, 'EEEE', { locale: es })
  const dayKey = dayName.charAt(0).toUpperCase() + dayName.slice(1)

  const [date, setDate] = useState(todayStr)
  const [selectedDay, setSelectedDay] = useState(DAYS.includes(dayKey) ? dayKey : 'Lunes')
  const [exercises, setExercises] = useState([])
  const [exerciseData, setExerciseData] = useState({})
  const [sessionNotes, setSessionNotes] = useState('')
  const [customExercise, setCustomExercise] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load routine for selected day
  useEffect(() => {
    const routine = WEEKLY_ROUTINE[selectedDay] || []
    setExercises(routine.map(e => e.exercise))
  }, [selectedDay])

  function handleAddExercise(name) {
    const n = name.trim()
    if (!n || exercises.includes(n)) return
    setExercises(e => [...e, n])
    setCustomExercise('')
  }

  function handleRemoveExercise(name) {
    setExercises(e => e.filter(x => x !== name))
    setExerciseData(d => { const nd = { ...d }; delete nd[name]; return nd })
  }

  function handleUpdateExercise(name, sets) {
    setExerciseData(d => ({ ...d, [name]: sets }))
  }

  async function handleSave() {
    if (exercises.length === 0) return
    setSaving(true)

    // Crear sesión
    const { data: session, error: sessErr } = await supabase
      .from('sessions')
      .insert({ user_id: user.id, date, day_name: selectedDay, notes: sessionNotes })
      .select()
      .single()

    if (sessErr) { console.error(sessErr); setSaving(false); return }

    // Crear todas las series
    const allSets = []
    for (const ex of exercises) {
      const sets = exerciseData[ex] || []
      for (const s of sets) {
        if (!s.weight || !s.reps) continue
        allSets.push({
          session_id: session.id,
          user_id: user.id,
          exercise_name: ex,
          set_number: s.set_number,
          reps: parseInt(s.reps),
          weight: parseFloat(s.weight),
          rir: s.rir,
          notes: s.notes || null
        })
      }
    }

    if (allSets.length > 0) {
      const { error: setsErr } = await supabase.from('sets').insert(allSets)
      if (setsErr) console.error(setsErr)
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div>
      <div className="page-header">
        <h2>REGISTRAR SESIÓN</h2>
        <p>Anota tus series, pesos y RIR</p>
      </div>

      {/* Session config */}
      <div className="card mb-24">
        <div className="grid-2" style={{ gap: '16px' }}>
          <div className="form-group">
            <label>Fecha</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Día de rutina</label>
            <select value={selectedDay} onChange={e => setSelectedDay(e.target.value)}>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group" style={{ marginTop: '16px' }}>
          <label>Notas de la sesión</label>
          <textarea
            rows={2}
            placeholder="¿Cómo te sentiste? ¿Algo a destacar?..."
            value={sessionNotes}
            onChange={e => setSessionNotes(e.target.value)}
          />
        </div>
      </div>

      {/* Exercises */}
      {exercises.map(ex => (
        <ExerciseBlock
          key={ex}
          exercise={ex}
          onRemove={handleRemoveExercise}
          onUpdate={handleUpdateExercise}
        />
      ))}

      {/* Add custom exercise */}
      <div className="card mb-24">
        <div className="text-xs text-dim mb-8" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Añadir ejercicio</div>
        <div className="flex gap-8">
          <div style={{ flex: 1 }}>
            <select
              value={customExercise}
              onChange={e => setCustomExercise(e.target.value)}
              style={{ marginBottom: 0 }}
            >
              <option value="">— Seleccionar —</option>
              {ALL_EXERCISES.filter(e => !exercises.includes(e)).map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
              <option value="__custom">Otro ejercicio...</option>
            </select>
          </div>
          <button className="btn btn-ghost" onClick={() => handleAddExercise(customExercise)}>
            <Plus size={16} /> Añadir
          </button>
        </div>
        {customExercise === '__custom' && (
          <div className="flex gap-8" style={{ marginTop: '8px' }}>
            <input
              type="text"
              placeholder="Nombre del ejercicio"
              onKeyDown={e => e.key === 'Enter' && handleAddExercise(e.target.value)}
              onChange={e => {}}
              id="custom-ex-input"
            />
            <button className="btn btn-ghost" onClick={() => handleAddExercise(document.getElementById('custom-ex-input')?.value)}>
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex gap-12">
        <button
          className="btn btn-primary btn-lg"
          onClick={handleSave}
          disabled={saving || exercises.length === 0}
        >
          {saved ? <><CheckCircle size={18} /> Guardado</> : saving ? 'Guardando...' : <><Save size={18} /> Guardar sesión</>}
        </button>
      </div>
    </div>
  )
}
