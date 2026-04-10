import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase, ALL_EXERCISES, MAIN_LIFTS } from '../lib/supabase'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { TrendingUp } from 'lucide-react'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <div style={{ color: 'var(--text2)', fontSize: '0.75rem', marginBottom: '4px' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
          {p.value} <span style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>kg</span>
        </div>
      ))}
    </div>
  )
}

export default function ProgressPage() {
  const { user } = useAuth()
  const [selectedExercise, setSelectedExercise] = useState(MAIN_LIFTS[0])
  const [chartData, setChartData] = useState([])
  const [prStats, setPrStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [allExercises, setAllExercises] = useState(ALL_EXERCISES)

  useEffect(() => {
    if (!user) return
    // Load all exercises the user has logged
    supabase.from('sets').select('exercise_name').eq('user_id', user.id).then(({ data }) => {
      if (data) {
        const unique = [...new Set(data.map(s => s.exercise_name))]
        setAllExercises(prev => [...new Set([...prev, ...unique])])
      }
    })
  }, [user])

  useEffect(() => {
    if (!user || !selectedExercise) return
    fetchProgress()
  }, [user, selectedExercise])

  async function fetchProgress() {
    setLoading(true)
    const { data } = await supabase
      .from('sets')
      .select('weight, reps, rir, created_at, sessions(date)')
      .eq('user_id', user.id)
      .eq('exercise_name', selectedExercise)
      .order('created_at', { ascending: true })

    if (!data) { setLoading(false); return }

    // Group by session date, take max weight per date
    const byDate = {}
    for (const s of data) {
      const d = s.sessions?.date || format(new Date(s.created_at), 'yyyy-MM-dd')
      if (!byDate[d] || s.weight > byDate[d].weight) {
        byDate[d] = { date: d, weight: s.weight, reps: s.reps, rir: s.rir }
      }
    }

    const sorted = Object.values(byDate).sort((a, b) => a.date > b.date ? 1 : -1)
    const chartFormatted = sorted.map(d => ({
      date: format(new Date(d.date + 'T12:00'), 'd MMM', { locale: es }),
      peso: d.weight,
      fullDate: d.date,
      reps: d.reps,
      rir: d.rir
    }))

    setChartData(chartFormatted)

    if (sorted.length > 0) {
      const weights = sorted.map(s => s.weight)
      const max = Math.max(...weights)
      const last = sorted[sorted.length - 1]
      const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null
      const gain = prev ? (last.weight - prev.weight).toFixed(1) : null

      setPrStats({
        pr: max,
        last: last.weight,
        gain,
        sessions: sorted.length
      })
    } else {
      setPrStats(null)
    }

    setLoading(false)
  }

  return (
    <div>
      <div className="page-header">
        <h2>PROGRESO</h2>
        <p>Evolución de tus pesos por ejercicio</p>
      </div>

      {/* Exercise selector */}
      <div className="card mb-24">
        <div className="form-group">
          <label>Ejercicio</label>
          <select value={selectedExercise} onChange={e => setSelectedExercise(e.target.value)}>
            <optgroup label="Levantamientos principales">
              {MAIN_LIFTS.map(e => <option key={e} value={e}>{e}</option>)}
            </optgroup>
            <optgroup label="Todos los ejercicios">
              {allExercises.filter(e => !MAIN_LIFTS.includes(e)).map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Stats row */}
      {prStats && (
        <div className="grid-3 mb-24">
          <div className="stat-card">
            <div className="stat-label">PR histórico</div>
            <div className="stat-value" style={{ color: 'var(--accent)' }}>{prStats.pr}<span style={{ fontSize: '1rem', color: 'var(--text2)' }}> kg</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Último peso</div>
            <div className="stat-value">{prStats.last}<span style={{ fontSize: '1rem', color: 'var(--text2)' }}> kg</span></div>
            {prStats.gain !== null && (
              <div className={`stat-sub ${parseFloat(prStats.gain) >= 0 ? 'text-success' : 'text-danger'}`}>
                {parseFloat(prStats.gain) >= 0 ? '+' : ''}{prStats.gain} kg vs anterior
              </div>
            )}
          </div>
          <div className="stat-card">
            <div className="stat-label">Sesiones</div>
            <div className="stat-value">{prStats.sessions}</div>
            <div className="stat-sub">con este ejercicio</div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="card">
        <div className="flex items-center gap-8 mb-24">
          <TrendingUp size={16} color="var(--accent)" />
          <h4 style={{ fontSize: '1rem', color: 'var(--text2)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
            {selectedExercise} — Peso máximo por sesión
          </h4>
        </div>

        {loading ? (
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        ) : chartData.length === 0 ? (
          <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}>
            Sin datos aún para este ejercicio
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--text3)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--text3)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={['auto', 'auto']}
                tickFormatter={v => `${v}kg`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border2)' }} />
              {prStats && (
                <ReferenceLine
                  y={prStats.pr}
                  stroke="var(--accent)"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                  label={{ value: 'PR', fill: 'var(--accent)', fontSize: 10, position: 'right' }}
                />
              )}
              <Line
                type="monotone"
                dataKey="peso"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={{ fill: 'var(--accent)', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: 'var(--accent)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Table of all entries */}
      {chartData.length > 0 && (
        <div className="card" style={{ marginTop: '24px' }}>
          <h4 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>HISTORIAL DE PESOS</h4>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Peso máx.</th>
                  <th>Reps</th>
                  <th>RIR</th>
                </tr>
              </thead>
              <tbody>
                {[...chartData].reverse().map((d, i) => (
                  <tr key={i}>
                    <td>{format(new Date(d.fullDate + 'T12:00'), "d 'de' MMMM yyyy", { locale: es })}</td>
                    <td style={{ color: d.peso === prStats?.pr ? 'var(--accent)' : 'var(--text)', fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
                      {d.peso} kg {d.peso === prStats?.pr && <span className="tag tag-accent" style={{ marginLeft: '6px' }}>PR</span>}
                    </td>
                    <td>{d.reps}</td>
                    <td>RIR {d.rir}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
