import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getDailySummary } from '../../services/admin.service'

interface ISummary {
  totalWorkers: number;
  presentes: number;
  faltas: number;
  tardanzas: number;
  enJornada: number;
  finalizados: number;
  trabajadores: any[];
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const [summary, setSummary] = useState<ISummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSummary = async () => {
    try {
      const data = await getDailySummary()
      setSummary(data)
    } catch (err) {
      console.error(err)
      setError('Error al cargar el resumen diario')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSummary()
    const interval = setInterval(loadSummary, 60000) // refrescar cada minuto
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Top bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="font-semibold text-sm text-slate-200">Panel de Administración</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm hidden sm:block">Admin: {user?.nombre}</span>
            <button
              onClick={logout}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 w-full flex-1 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Resumen en Tiempo Real</h1>
          <p className="text-slate-400 text-sm mt-1 capitalize">
            {new Date().toLocaleDateString('es-PE', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading && !summary ? (
          <div className="text-center py-12 text-slate-500">Cargando datos...</div>
        ) : (
          <>
            {/* Tarjetas de Resumen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryCard title="Trabajadores" value={summary?.totalWorkers ?? 0} color="text-blue-400" bgColor="bg-blue-500/10" />
              <SummaryCard title="Presentes" value={summary?.presentes ?? 0} color="text-emerald-400" bgColor="bg-emerald-500/10" />
              <SummaryCard title="Faltas / Ausentes" value={summary?.faltas ?? 0} color="text-red-400" bgColor="bg-red-500/10" />
              <SummaryCard title="Tardanzas" value={summary?.tardanzas ?? 0} color="text-amber-400" bgColor="bg-amber-500/10" />
            </div>

            {/* Tabla Detallada */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mt-8">
              <div className="px-6 py-4 border-b border-slate-800">
                <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                  Detalle de Asistencia de Hoy
                </h2>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="text-left text-xs text-slate-400 font-medium py-3 px-6">Trabajador</th>
                      <th className="text-left text-xs text-slate-400 font-medium py-3 px-6">Estado</th>
                      <th className="text-left text-xs text-slate-400 font-medium py-3 px-6">Tardanza</th>
                      <th className="text-left text-xs text-slate-400 font-medium py-3 px-6">Horas Trab.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {summary?.trabajadores && summary.trabajadores.length > 0 ? (
                      summary.trabajadores.map((registro: any, i: number) => (
                        <tr key={registro.email || i} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-6 text-slate-300 font-medium">
                            {registro.nombre || 'Desconocido'}
                          </td>
                          <td className="py-3 px-6">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
                              ${getStatusConfig(registro.status).bg} ${getStatusConfig(registro.status).color}`}>
                              {getStatusConfig(registro.status).label}
                            </span>
                          </td>
                          <td className="py-3 px-6">
                            {registro.tardanza ? (
                              <span className="text-red-400 text-xs">Sí</span>
                            ) : (
                              <span className="text-emerald-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="py-3 px-6 text-slate-400 text-xs">
                            {registro.horasTrabajadas ? `${registro.horasTrabajadas}h` : '—'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-500">
                          No hay trabajadores registrados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function SummaryCard({ title, value, color, bgColor }: { title: string, value: number, color: string, bgColor: string }) {
  return (
    <div className={`rounded-2xl p-6 border border-slate-800 bg-slate-900 ${bgColor.replace('bg-', 'hover:bg-').replace('/10', '/5')} transition-colors`}>
      <h3 className="text-sm font-medium text-slate-400">{title}</h3>
      <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
    </div>
  )
}

function getStatusConfig(status: string) {
  const configs: Record<string, { label: string; color: string; bg: string }> = {
    sin_jornada: { label: 'Sin iniciar', color: 'text-slate-400', bg: 'bg-slate-500/10' },
    jornada_activa: { label: 'En jornada', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    en_refrigerio: { label: 'En refrigerio', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    post_refrigerio: { label: 'Post ref.', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    finalizado: { label: 'Finalizado', color: 'text-slate-400', bg: 'bg-slate-500/10' },
    falta: { label: 'Falta', color: 'text-red-400', bg: 'bg-red-500/10' },
    falta_justificada: { label: 'Justificada', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  };
  return configs[status] || configs.sin_jornada;
}
