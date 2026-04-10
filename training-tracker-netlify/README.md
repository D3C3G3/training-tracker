# 🏋️ IRONLOG — Powerlifting Tracker

App web personal para registrar entrenamientos de powerlifting. Incluye:
- 📝 Registro de series por ejercicio (peso, reps, RIR, notas)
- 📈 Gráficas de progreso por ejercicio
- 🎯 Metas de peso con barra de progreso
- 📅 Historial completo de sesiones
- 👤 Auth multiusuario (registro + login)
- 🗓️ Rutina semanal precargada

---

## 🚀 Paso 1 — Crear proyecto en Supabase (GRATIS)

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Haz clic en **New Project**
3. Elige nombre, contraseña de BD y región (EU West es buena opción)
4. Espera ~2 minutos a que se cree

### Configurar la base de datos

5. En el dashboard de Supabase, ve a **SQL Editor** → **New Query**
6. Copia y pega todo el contenido del archivo `supabase-schema.sql`
7. Haz clic en **Run** (▶️)

Deberías ver: `Success. No rows returned`

### Obtener las credenciales

8. Ve a **Settings** → **API**
9. Copia:
   - **Project URL** → es tu `VITE_SUPABASE_URL`
   - **anon public** key → es tu `VITE_SUPABASE_ANON_KEY`

---

## ⚙️ Paso 2 — Configurar el proyecto local

```bash
# Clonar / descomprimir el proyecto
cd powerlifting-app

# Instalar dependencias
npm install

# Crear archivo de entorno
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:
```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

```bash
# Arrancar en local
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) — ¡listo!

---

## 🌐 Paso 3 — Publicar en internet (GRATIS con Netlify)

### Opción A: Netlify (recomendado, muy fácil)

1. Ve a [netlify.com](https://netlify.com) y crea cuenta gratuita
2. Haz clic en **Add new site** → **Deploy manually**
3. Ejecuta en tu terminal:
   ```bash
   npm run build
   ```
4. Arrastra la carpeta `dist/` al área de drop de Netlify
5. En Netlify → **Site settings** → **Environment variables**, añade:
   - `VITE_SUPABASE_URL` = tu URL
   - `VITE_SUPABASE_ANON_KEY` = tu key
6. Ve a **Deploys** → **Trigger deploy** → **Deploy site**

¡Tu app estará en una URL tipo `https://ironlog-xyz.netlify.app`!

### Opción B: Vercel

1. Sube el proyecto a GitHub
2. Importa en [vercel.com](https://vercel.com)
3. Añade las variables de entorno en la configuración
4. Deploy automático

---

## 📧 Confirmar email (Supabase)

Por defecto Supabase requiere confirmación de email al registrarse.

**Para desactivarlo (más cómodo para uso personal):**
- Supabase → **Authentication** → **Email** → desactiva **Enable email confirmations**

---

## 🏗️ Estructura del proyecto

```
src/
├── components/
│   ├── Sidebar.jsx          # Navegación lateral
│   └── ProtectedLayout.jsx  # Wrapper con auth guard
├── hooks/
│   └── useAuth.jsx          # Contexto de autenticación
├── lib/
│   └── supabase.js          # Cliente Supabase + rutina
├── pages/
│   ├── AuthPage.jsx         # Login / Registro
│   ├── Dashboard.jsx        # Inicio con resumen
│   ├── LogPage.jsx          # Registrar entreno
│   ├── ProgressPage.jsx     # Gráficas de progreso
│   ├── GoalsPage.jsx        # Metas y objetivos
│   ├── HistoryPage.jsx      # Historial de sesiones
│   └── RoutinePage.jsx      # Vista de la rutina
└── styles/
    └── global.css           # Estilos globales
```

---

## 🔧 Personalizar la rutina

Edita `src/lib/supabase.js` → objeto `WEEKLY_ROUTINE` para cambiar ejercicios o añadir días.

---

## 🛡️ Seguridad

- Cada usuario solo ve sus propios datos (Row Level Security en Supabase)
- Las contraseñas las gestiona Supabase (nunca se almacenan en texto plano)
- La `anon key` es pública por diseño — no la escondas, es segura
