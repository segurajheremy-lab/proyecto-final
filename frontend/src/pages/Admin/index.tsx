import { useState, useEffect } from 'react'
import { obtenerResumen, descargarExcel } from '../../services/admin.service'

interface ISummary {
  totalWorkers: number
  presentes: number
  faltas: number
  tardanzas: number
  enJornada: number
  finalizados: number
  trabajadores: {
    nombre: string
    email: string
    status: string
    tardanza: boolean
    horasTrabajadas: number
  }[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  sin_jornada: { label: 'Sin iniciar', color: 'text-slate-400', bg: 'bg-slate-500/10' },
  jornada_activa: { label: 'En jornada', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  en_refrigerio: { label: 'En refrigerio', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  post_refrigerio: { label: 'Post refrigerio', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  finalizado: { label: 'Finalizado', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  falta: { label: 'Falta', color: 'text-red-400', bg: 'bg-red-500/10' },
  falta_justificada: { label: 'Justificada', color: 'text-orange-400', bg: 'bg-orange-500/10' },
}

function getFechaLocal() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function AdminDashboard() {
  const [fecha, setFecha] = useState(getFechaLocal())
  const [summary, setSummary] = useState<ISummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  const loadSummary = async (f: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await obtenerResumen(f)
      setSummary(data)
    } catch {
      setError('Error al cargar el resumen diario')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSummary(fecha)
    const interval = setInterval(() => loadSummary(fecha), 60000)
    return () => clearInterval(interval)
  }, [fecha])

  const handleDownload = async () => {
    try {
      setDownloading(true)
      await descargarExcel(fecha)
    } catch {
      setError('Error al descargar el reporte')
    } finally {
      setDownloading(false)
    }
  }

  const horasPromedio =
    summary && summary.presentes > 0
      ? (
          summary.trabajadores
            .filter((t) => t.horasTrabajadas > 0)
            .reduce((acc, t) => acc + t.horasTrabajadas, 0) /
          (summary.trabajadores.filter((t) => t.horasTrabajadas > 0).length || 1)
        ).toFixed(1)
      : '0'

  const fechaDisplay = new Date(fecha + 'T12:00:00').toLocaleDateString('es-PE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Panel General</h1>
          <p className="text-slate-400 text-sm mt-1 capitalize">{fechaDisplay}</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
          />
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {downloading ? 'Descargando...' : 'Descargar Excel'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* SECCIÓN 1: Tarjetas de Resumen */}
      {loading && !summary ? (
        <div className="text-center py-16 text-slate-500">Cargando datos...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Presentes */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/30 transition-colors group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-emerald-400">{summary?.presentes ?? 0}</p>
              <p className="text-sm text-slate-400 mt-1">Presentes hoy</p>
            </div>

            {/* Faltas */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-red-500/30 transition-colors group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-red-400">{summary?.faltas ?? 0}</p>
              <p className="text-sm text-slate-400 mt-1">Faltas</p>
            </div>

            {/* Tardanzas */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-amber-500/30 transition-colors group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-amber-400">{summary?.tardanzas ?? 0}</p>
              <p className="text-sm text-slate-400 mt-1">Tardanzas</p>
            </div>

            {/* Horas promedio */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/30 transition-colors group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-blue-400">{horasPromedio}h</p>
              <p className="text-sm text-slate-400 mt-1">Horas promedio</p>
            </div>
          </div>

          {/* SECCIÓN 2: Tabla de trabajadores */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                Detalle de Trabajadores
              </h2>
              <span className="text-xs text-slate-500">
                {summary?.trabajadores?.length ?? 0} registros
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/40">
                  <tr>
                    <th className="text-left text-xs text-slate-400 font-medium py-3 px-6">Nombre</th>
                    <th className="text-left text-xs text-slate-400 font-medium py-3 px-6">Estado actual</th>
                    <th className="text-left text-xs text-slate-400 font-medium py-3 px-6">Tardanza</th>
                    <th className="text-left text-xs text-slate-400 font-medium py-3 px-6">Horas trabajadas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {summary?.trabajadores && summary.trabajadores.length > 0 ? (
                    summary.trabajadores.map((t, i) => {
                      const cfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.sin_jornada
                      return (
                        <tr key={t.email || i} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-6">
                            <div>
                              <p className="text-slate-200 font-medium">{t.nombre}</p>
                              <p className="text-slate-500 text-xs">{t.email}</p>
                            </div>
                          </td>
                          <td className="py-3.5 px-6">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-6">
                            {t.tardanza ? (
                              <span className="inline-flex items-center gap-1 text-red-400 text-xs font-medium">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                                </svg>
                                Sí
                              </span>
                            ) : (
                              <span className="text-emerald-400 text-xs">Puntual</span>
                            )}
                          </td>
                          <td className="py-3.5 px-6 text-slate-300 text-sm font-medium">
                            {t.horasTrabajadas ? `${t.horasTrabajadas}h` : '—'}
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-slate-500">
                        No hay trabajadores registrados para esta fecha
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
