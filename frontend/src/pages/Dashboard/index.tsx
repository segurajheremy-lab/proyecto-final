import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useAttendance } from '../../context/AttendanceContext'
import { AttendanceProvider } from '../../context/AttendanceContext'
import { AttendanceStatus, IHistorial, IHistorialRegistro } from '../../types/attendance.types'
import { obtenerHistorial } from '../../services/attendance.service'

const statusConfig: Record<AttendanceStatus, { label: string; color: string; bg: string }> = {
  sin_jornada: { label: 'Sin iniciar', color: 'text-slate-400', bg: 'bg-slate-500/10' },
  jornada_activa: { label: 'En jornada', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  en_refrigerio: { label: 'En refrigerio', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  post_refrigerio: { label: 'Post refrigerio', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  finalizado: { label: 'Jornada finalizada', color: 'text-slate-400', bg: 'bg-slate-500/10' },
  falta: { label: 'Falta', color: 'text-red-400', bg: 'bg-red-500/10' },
  falta_justificada: { label: 'Falta justificada', color: 'text-orange-400', bg: 'bg-orange-500/10' },
}

const DashboardContent = () => {
  const { user, logout } = useAuth()
  const {
    estado,
    isLoading,
    error,
    cargarEstado,
    handleIniciarJornada,
    handleSalirRefrigerio,
    handleVolverRefrigerio,
    handleFinalizarJornada,
  } = useAttendance()

  const [historial, setHistorial] = useState<IHistorial | null>(null)
  const [loadingHistorial, setLoadingHistorial] = useState(false)
  const [historialAbierto, setHistorialAbierto] = useState(false)

  useEffect(() => {
    cargarEstado()
  }, []) // eslint-disable-line

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        setLoadingHistorial(true)
        const data = await obtenerHistorial()
        setHistorial(data)
      } catch {
        console.error('Error cargando historial')
      } finally {
        setLoadingHistorial(false)
      }
    }
    cargarHistorial()
  }, []) // eslint-disable-line

  const status = estado?.status ?? 'sin_jornada'
  const config = statusConfig[status]

  const now = new Date()
  const fechaStr = now.toLocaleDateString('es-PE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const horaStr = now.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-semibold text-sm text-slate-200">Control de Asistencia</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm hidden sm:block">{user?.nombre}</span>
            <button
              onClick={logout}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Saludo y fecha */}
        <div>
          <h1 className="text-2xl font-bold text-white">
            Hola, {user?.nombre.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1 capitalize">{fechaStr} · {horaStr}</p>
        </div>

        {/* Estado actual */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Estado actual</h2>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {config.label}
            </span>
          </div>

          {/* Horario del trabajador */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Entrada', value: user?.horario.entrada },
              { label: 'Refrigerio', value: user?.horario.salidaRefrigerio },
              { label: 'Regreso', value: user?.horario.vueltaRefrigerio },
              { label: 'Salida', value: user?.horario.salida },
            ].map((item) => (
              <div key={item.label} className="bg-slate-800/50 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                <p className="text-sm font-semibold text-slate-200">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Botones de acción */}
          <div className="space-y-3">
            {status === 'sin_jornada' && (
              <ActionButton
                onClick={handleIniciarJornada}
                isLoading={isLoading}
                color="emerald"
                label="Iniciar jornada"
                icon="▶"
              />
            )}
            {status === 'jornada_activa' && (
              <ActionButton
                onClick={handleSalirRefrigerio}
                isLoading={isLoading}
                color="amber"
                label="Salir a refrigerio"
                icon="☕"
              />
            )}
            {status === 'en_refrigerio' && (
              <ActionButton
                onClick={handleVolverRefrigerio}
                isLoading={isLoading}
                color="blue"
                label="Volver de refrigerio"
                icon="↩"
              />
            )}
            {status === 'post_refrigerio' && (
              <ActionButton
                onClick={handleFinalizarJornada}
                isLoading={isLoading}
                color="red"
                label="Finalizar jornada"
                icon="■"
              />
            )}
            {status === 'jornada_activa' && (
              <ActionButton
                onClick={handleFinalizarJornada}
                isLoading={isLoading}
                color="red"
                label="Finalizar jornada sin refrigerio"
                icon="■"
              />
            )}
            {status === 'finalizado' && (
              <div className="text-center py-4 text-slate-500 text-sm">
                ✓ Jornada completada. ¡Hasta mañana!
              </div>
            )}
          </div>
        </div>

        {/* Resumen del día */}
        {estado && status !== 'sin_jornada' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Resumen del día</h2>
            <div className="grid grid-cols-3 gap-4">
              <SummaryCard
                label="Tardanza"
                value={estado.tardanza ? `${estado.minutosTardanza} min` : 'Puntual'}
                color={estado.tardanza ? 'text-red-400' : 'text-emerald-400'}
              />
              <SummaryCard
                label="Refrigerio"
                value={estado.minutosRefrigerio != null ? `${estado.minutosRefrigerio} min` : '—'}
                color="text-amber-400"
              />
              <SummaryCard
                label="Horas trabajadas"
                value={estado.horasTrabajadas != null ? `${estado.horasTrabajadas}h` : '—'}
                color="text-blue-400"
              />
            </div>
          </div>
        )}

        {/* Eventos del día */}
        {estado && estado.eventos.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Registro de hoy</h2>
            <div className="space-y-3">
              {estado.eventos.map((evento, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm text-slate-300 capitalize">
                      {evento.tipo.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(evento.timestamp).toLocaleTimeString('es-PE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Historial 30 días — desplegable */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <button
            onClick={() => setHistorialAbierto(!historialAbierto)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
          >
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              Historial — últimos 30 días
            </h2>
            <div className="flex items-center gap-3">
              {historial && (
                <span className="text-xs text-slate-500">
                  {historial.resumen.diasAsistidos} asistidos · {historial.resumen.tardanzas} tardanzas
                </span>
              )}
              <svg
                className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${historialAbierto ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {historialAbierto && (
            <div className="px-6 pb-6">
              {/* Resumen */}
              {historial && (
                <div className="grid grid-cols-5 gap-3 mb-6">
                  {[
                    { label: 'Días registrados', value: historial.resumen.totalDias, color: 'text-slate-200' },
                    { label: 'Asistidos', value: historial.resumen.diasAsistidos, color: 'text-emerald-400' },
                    { label: 'Faltas', value: historial.resumen.diasFalta, color: 'text-red-400' },
                    { label: 'Tardanzas', value: historial.resumen.tardanzas, color: 'text-amber-400' },
                    { label: 'Prom. horas', value: `${historial.resumen.promedioHoras}h`, color: 'text-blue-400' },
                  ].map((item) => (
                    <div key={item.label} className="bg-slate-800/50 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                      <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tabla */}
              {loadingHistorial ? (
                <div className="text-center py-8 text-slate-500 text-sm">Cargando historial...</div>
              ) : historial && historial.registros.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left text-xs text-slate-500 font-medium pb-3 pr-4">Fecha</th>
                        <th className="text-left text-xs text-slate-500 font-medium pb-3 pr-4">Estado</th>
                        <th className="text-left text-xs text-slate-500 font-medium pb-3 pr-4">Tardanza</th>
                        <th className="text-left text-xs text-slate-500 font-medium pb-3 pr-4">Refrigerio</th>
                        <th className="text-left text-xs text-slate-500 font-medium pb-3">Horas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {historial.registros.map((registro: IHistorialRegistro) => (
                        <tr key={registro.fecha} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 pr-4 text-slate-300 font-medium">
                            {new Date(registro.fecha + 'T12:00:00').toLocaleDateString('es-PE', {
                              weekday: 'short',
                              day: '2-digit',
                              month: 'short',
                            })}
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                              ${statusConfig[registro.status].bg} ${statusConfig[registro.status].color}`}>
                              {statusConfig[registro.status].label}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            {registro.tardanza ? (
                              <span className="text-red-400 text-xs">{registro.minutosTardanza} min</span>
                            ) : (
                              <span className="text-emerald-400 text-xs">Puntual</span>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-slate-400 text-xs">
                            {registro.minutosRefrigerio != null ? `${registro.minutosRefrigerio} min` : '—'}
                          </td>
                          <td className="py-3 text-slate-300 font-medium text-xs">
                            {registro.horasTrabajadas != null ? `${registro.horasTrabajadas}h` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No hay registros en los últimos 30 días
                </div>
              )}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}

const ActionButton = ({
  onClick,
  isLoading,
  color,
  label,
  icon,
}: {
  onClick: () => Promise<void>
  isLoading: boolean
  color: 'emerald' | 'amber' | 'blue' | 'red'
  label: string
  icon: string
}) => {
  const colors = {
    emerald: 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900',
    amber: 'bg-amber-600 hover:bg-amber-500 disabled:bg-amber-900',
    blue: 'bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900',
    red: 'bg-red-600 hover:bg-red-500 disabled:bg-red-900',
  }

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`w-full py-3 px-6 rounded-xl font-medium text-white transition-colors ${colors[color]} disabled:cursor-not-allowed flex items-center justify-center gap-2`}
    >
      <span>{icon}</span>
      <span>{isLoading ? 'Procesando...' : label}</span>
    </button>
  )
}

const SummaryCard = ({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) => (
  <div className="bg-slate-800/50 rounded-xl p-4 text-center">
    <p className="text-xs text-slate-500 mb-1">{label}</p>
    <p className={`text-lg font-bold ${color}`}>{value}</p>
  </div>
)

export default function Dashboard() {
  return (
    <AttendanceProvider>
      <DashboardContent />
    </AttendanceProvider>
  )
}