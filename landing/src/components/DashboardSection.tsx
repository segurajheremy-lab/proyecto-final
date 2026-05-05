import { TrendingUp, Users, Database } from 'lucide-react'

// Simulated SVG area chart
function AreaChart() {
  const points = [
    { x: 0, pos: 70, neu: 50, neg: 30 },
    { x: 60, pos: 75, neu: 48, neg: 25 },
    { x: 120, pos: 65, neu: 52, neg: 35 },
    { x: 180, pos: 80, neu: 45, neg: 20 },
    { x: 240, pos: 85, neu: 42, neg: 18 },
    { x: 300, pos: 78, neu: 47, neg: 22 },
    { x: 360, pos: 90, neu: 40, neg: 15 },
    { x: 420, pos: 88, neu: 43, neg: 17 },
    { x: 480, pos: 92, neu: 38, neg: 12 },
  ]

  const toPath = (key: 'pos' | 'neu' | 'neg') => {
    const h = 160
    const scale = (v: number) => h - (v / 100) * h
    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${scale(p[key])}`).join(' ')
    const area = `${line} L ${points[points.length - 1].x} ${h} L 0 ${h} Z`
    return { line, area }
  }

  const pos = toPath('pos')
  const neu = toPath('neu')
  const neg = toPath('neg')

  return (
    <svg viewBox="0 0 480 160" className="w-full h-40" preserveAspectRatio="none">
      <defs>
        <linearGradient id="gradPos" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="gradNeu" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="gradNeg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={neg.area} fill="url(#gradNeg)" />
      <path d={neg.line} fill="none" stroke="#ef4444" strokeWidth="1.5" />
      <path d={neu.area} fill="url(#gradNeu)" />
      <path d={neu.line} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
      <path d={pos.area} fill="url(#gradPos)" />
      <path d={pos.line} fill="none" stroke="#22c55e" strokeWidth="2" />
    </svg>
  )
}

const roleUsers = [
  { label: 'Admin', initials: 'AD', bg: 'bg-blue-600', count: '3 usuarios' },
  { label: 'Supervisor', initials: 'SV', bg: 'bg-indigo-500', count: '12 usuarios' },
  { label: 'Agente', initials: 'AG', bg: 'bg-green-500', count: '48 usuarios' },
]

const dbStats = [
  { label: 'Clientes registrados', value: '24,891' },
  { label: 'Interacciones totales', value: '183,402' },
  { label: 'Registros de asistencia', value: '9,217' },
]

export default function DashboardSection() {
  return (
    <section className="bg-slate-50 py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-3">
            Todo lo que necesitas para optimizar tu call center
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Un panel de control diseñado para que tengas visibilidad total de tu operación
            en un solo vistazo.
          </p>
        </div>

        {/* Dashboard panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Top bar */}
          <div className="bg-slate-800 px-5 py-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-4 text-slate-400 text-xs">callcenter-ia.app/dashboard</span>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left — Chart (2/3) */}
            <div className="lg:col-span-2 bg-slate-50 rounded-xl p-5 border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp size={18} className="text-green-500" />
                    Análisis de Sentimiento del Cliente
                  </h4>
                  <p className="text-slate-400 text-xs mt-0.5">Últimos 30 días</p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 font-semibold px-3 py-1 rounded-full">
                  +12% positivo
                </span>
              </div>

              <AreaChart />

              {/* Legend */}
              <div className="flex items-center gap-6 mt-4">
                {[
                  { color: 'bg-green-500', label: 'Positivo', pct: '62%' },
                  { color: 'bg-blue-500', label: 'Neutral', pct: '28%' },
                  { color: 'bg-red-400', label: 'Negativo', pct: '10%' },
                ].map(({ color, label, pct }) => (
                  <div key={label} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className={`w-3 h-3 rounded-full ${color}`} />
                    {label}
                    <span className="font-semibold text-slate-800">{pct}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — 2 stacked cards (1/3) */}
            <div className="flex flex-col gap-5">
              {/* Roles card */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex-1">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <Users size={16} className="text-indigo-500" />
                  Gestión de Roles
                </h4>
                <div className="space-y-3">
                  {roleUsers.map(({ label, initials, bg, count }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className={`${bg} w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700">{label}</p>
                        <p className="text-xs text-slate-400">{count}</p>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* DB card */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <Database size={16} className="text-blue-500" />
                  Base de Datos Corporativa
                </h4>
                <div className="space-y-3">
                  {dbStats.map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="text-sm font-bold text-slate-800">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
