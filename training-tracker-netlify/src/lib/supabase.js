import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tu rutina semanal extraída del Excel
export const WEEKLY_ROUTINE = {
  Lunes: [
    { exercise: 'SQ LB 2ct', prescription: '4x4 @4' },
    { exercise: 'DL SUMO 2ct', prescription: '3x4 @4' },
    { exercise: 'Ext. cuádriceps', prescription: '3x12 RIR1' },
    { exercise: 'Prensa', prescription: '3x8 RIR0' },
  ],
  Martes: [
    { exercise: 'BP kodama', prescription: '3x5 @4' },
    { exercise: 'Remo en T', prescription: '3x12 RIR0' },
    { exercise: 'Jalón al pecho', prescription: '4x12 RIR1' },
    { exercise: 'Remo Gironda', prescription: '3x12 RIR1' },
    { exercise: 'Curl predicador', prescription: '2x12 RIR0' },
    { exercise: 'Bayesian', prescription: '2x12 RIR0' },
  ],
  Miércoles: [],
  Jueves: [
    { exercise: 'BP spotto', prescription: '3x4 @4' },
    { exercise: 'Inclinado mancuerna', prescription: '3x8 RIR0' },
    { exercise: 'Aperturas', prescription: '4x12 RIR1' },
    { exercise: 'Press militar', prescription: '3x12 RIR2' },
    { exercise: 'Laterales', prescription: '4x15 RIR0' },
    { exercise: 'Extensión de tríceps', prescription: '3x12 RIR1' },
  ],
  Viernes: [
    { exercise: 'SQ LB', prescription: '4x4 @4 / 1x2 @6' },
    { exercise: 'BP', prescription: '4x4 @4' },
    { exercise: 'DL SUMO', prescription: '3x3 @3/2x2 @6' },
    { exercise: 'Rumano', prescription: '3x12 RIR2' },
    { exercise: 'Curl de isquio', prescription: '2x15 RIR0' },
  ],
  Sábado: [],
  Domingo: [],
}

export const ALL_EXERCISES = [
  ...new Set(
    Object.values(WEEKLY_ROUTINE)
      .flat()
      .map(e => e.exercise)
  ),
]

export const MAIN_LIFTS = ['SQ LB', 'SQ LB 2ct', 'BP kodama', 'BP', 'BP spotto', 'DL SUMO', 'DL SUMO 2ct']
