import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock, CheckCircle2, Phone, MessageSquare,
  Smile, Meh, Frown, Play, Square,
  Coffee, Plus, Loader2, AlertCircle,
  Calendar, TrendingUp, History, ArrowRight, Users,
} from 'lucide-react'
import { api } from '../../../lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type JornadaStatus =
  | 'sin_jornada'
  | 'jornada_activa'
  | 'en_refrigerio'
  | 'post_refrigerio'
  | 'finalizado'

interface AttendanceEvento {
  tipo: 'inicio' | 'salida_refrigerio' | 'vuelta_refrigerio' | 'fin'
  timestamp: string
  metodo: 'manual' | 'biometria'
}

interface AttendanceRecord {
  _id: string
  fecha: string
  status: JornadaStatus | 'falta' | 'falta_justificada'
  eventos: AttendanceEvento[]
  tardanza: boolean
  minutosTardanza: number
  minutosRefrigerio?: number
  horasTrabajadas?: number
}

interface HistorialResumen {
  total: number
  presentes: number
  tardanzas: number
  faltas: number
  horasTotales: number
}

interface ClienteRow {
  _id: string
  nombre: string
  apellido: string
  telefono: string
  estado: 'activo' | 'pendiente' | 'resuelto' | 'inactivo'
  ultimaInteraccion?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  sin_jornada:     { label: 'Sin jornada',     color: 'text-slate-500',  bg: 'bg-slate-100',  dot: 'bg-slate-400' },
  jornada_activa:  { label: 'Jornada activa',  color: 'text-green-700',  bg: 'bg-green-100',  dot: 'bg-green-500 animate-pulse' },
  en_refrigerio:   { label: 'En refrigerio',   color: 'text-amber-700',  bg: 'bg-amber-100',  dot: 'bg-amber-500' },
  post_refrigerio: { label: 'Post refrigerio', color: 'text-blue-700',   bg: 'bg-blue-100',   dot: 'bg-blue-500' },
  finalizado:      { label: 'Finalizado',      color: 'text-slate-600',  bg: 'bg-slate-100',  dot: 'bg-slate-400' },
  falta:           { label: 'Falta',           color: 'text-red-700',    bg: 'bg-red-100',    dot: 'bg-red-500' },
  falta_justificada: { label: 'Falta justificada', color: 'text-orange-700', bg: 'bg-orange-100', dot: 'bg-orange-500' },
}

const RESULTADO_COLORS: Record<string, string> = {
  resuelto:      'bg-green-100 text-green-700',
  pendiente:     'bg-amber-100 text-amber-700',
  sin_respuesta: 'bg-slate-100 text-slate-600',
  callback:      'bg-blue-100 text-blue-700',
}

const STEPS = ['sin_jornada', 'jornada_activa', 'en_refrigerio', 'post_refrigerio', 'finalizado']
const STEP_LABELS = ['Inicio', 'Activo', 'Refrigerio', 'Regreso', 'Fin']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function elapsed(from: string): string {
  const ms = Date.now() - new Date(from).getTime()
  const h = Math.floor(ms / 3600000)
  const min = Math.floor((ms % 3600000) / 60000)
  if (h > 0) return `${h}h ${min}m`
  return `${min}m`
}

const ESTADO_BADGE: Record<string, string> = {
  activo:   'bg-green-100 text-green-700',
  pendiente:'bg-amber-100 text-amber-700',
  resuelto: 'bg-blue-100 text-blue-700',
  inactivo: 'bg-slate-100 text-slate-600',
}

function tiempoRelativo(fechaStr?: string): string {
  if (!fechaStr) return '—'
  const diff = Date.now() - new Date(fechaStr).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (h < 1) return 'hace menos de 1h'
  if (h < 24) return `hace ${h}h`
  if (d === 1) return 'ayer'
  return `hace ${d} días`
}

function MisClientesSection() {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState<ClienteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<{ success: boolean; data: { clientes: ClienteRow[] } }>('/clients?limite=5')
      .then(res => setClientes(res.data.data.clientes ?? []))
      .catch(() => setError('No se pudieron cargar los clientes.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <Users size={16} className="text-blue-600" />
          Mis Clientes Asignados
        </h2>
        <button
          onClick={() => navigate('/dashboard/clientes')}
          className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1"
        >
          Ver todos <ArrowRight size={12} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-24">
          <Loader2 size={20} className="animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-600 text-sm px-5 py-4">
          <AlertCircle size={14} /> {error}
        </div>
      ) : clientes.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Users size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No tienes clientes asignados aún.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {clientes.map(c => (
            <div key={c._id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                {c.nombre.charAt(0)}{c.apellido.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{c.nombre} {c.apellido}</p>
                <p className="text-xs text-slate-400">{c.telefono}</p>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${ESTADO_BADGE[c.estado]}`}>
                {c.estado}
              </span>
              <span className="text-xs text-slate-400 shrink-0 hidden sm:block">
                {tiempoRelativo(c.ultimaInteraccion)}
              </span>
              <button
                onClick={() => navigate(`/dashboard/clientes/${c._id}`)}
                className="text-xs text-blue-600 hover:underline font-medium shrink-0"
              >
                Ver ficha
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AgentePage() {
  const [tab, setTab] = useState<'jornada' | 'historial'>('jornada')

  // Jornada state — loaded from DB on mount
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null)
  const [loadingJornada, setLoadingJornada] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  // Historial state
  const [historial, setHistorial] = useState<AttendanceRecord[]>([])
  const [historialResumen, setHistorialResumen] = useState<HistorialResumen | null>(null)
  const [loadingHistorial, setLoadingHistorial] = useState(false)

  // Interaction modal
  const [showModal, setShowModal] = useState(false)
  const [modalResult, setModalResult] = useState('resuelto')
  const [modalNota, setModalNota] = useState('')
  const [savingInteraccion, setSavingInteraccion] = useState(false)

  // ---------------------------------------------------------------------------
  // Load today's attendance from DB on mount (persists across page reloads)
  // ---------------------------------------------------------------------------

  const loadHoy = useCallback(async () => {
    setLoadingJornada(true)
    try {
      const { data } = await api.get<{ success: boolean; data: AttendanceRecord | null }>('/attendance/hoy')
      setAttendance(data.data)
    } catch {
      // silently fail
    } finally {
      setLoadingJornada(false)
    }
  }, [])

  useEffect(() => { loadHoy() }, [loadHoy])

  // ---------------------------------------------------------------------------
  // Load historial when tab switches
  // ---------------------------------------------------------------------------

  const loadHistorial = useCallback(async () => {
    setLoadingHistorial(true)
    try {
      const { data } = await api.get<{
        success: boolean
        data: { records: AttendanceRecord[]; resumen: HistorialResumen }
      }>('/attendance/historial?dias=30')
      setHistorial(data.data.records)
      setHistorialResumen(data.data.resumen)
    } catch {
      // silently fail
    } finally {
      setLoadingHistorial(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'historial') loadHistorial()
  }, [tab, loadHistorial])

  // ---------------------------------------------------------------------------
  // Mark attendance event
  // ---------------------------------------------------------------------------

  const marcarEvento = async (tipo: AttendanceEvento['tipo']) => {
    setActionError('')
    setActionLoading(true)
    try {
      const { data } = await api.post<{ success: boolean; data: AttendanceRecord }>(
        '/attendance/evento',
        { tipo, metodo: 'manual' }
      )
      setAttendance(data.data)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al registrar el evento.'
      setActionError(msg)
    } finally {
      setActionLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const status = (attendance?.status ?? 'sin_jornada') as JornadaStatus
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.sin_jornada
  const currentStepIdx = STEPS.indexOf(status)

  const inicioEvento = attendance?.eventos.find((e) => e.tipo === 'inicio')
  const salidaRefEvento = attendance?.eventos.find((e) => e.tipo === 'salida_refrigerio')

  // Next action button config
  type ActionConfig = { label: string; icon: React.ReactNode; color: string; tipo: AttendanceEvento['tipo'] } | null
  const nextAction: ActionConfig = (() => {
    if (status === 'sin_jornada')     return { label: 'Iniciar jornada',     icon: <Play size={16} />,   color: 'bg-green-600 hover:bg-green-500', tipo: 'inicio' }
    if (status === 'jornada_activa')  return { label: 'Salir a refrigerio',  icon: <Coffee size={16} />, color: 'bg-amber-500 hover:bg-amber-400', tipo: 'salida_refrigerio' }
    if (status === 'en_refrigerio')   return { label: 'Volver de refrigerio',icon: <Play size={16} />,   color: 'bg-blue-600 hover:bg-blue-500',   tipo: 'vuelta_refrigerio' }
    if (status === 'post_refrigerio') return { label: 'Finalizar jornada',   icon: <Square size={16} />, color: 'bg-red-600 hover:bg-red-500',     tipo: 'fin' }
    return null
  })()

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mi Panel</h1>
          <p className="text-slate-500 mt-0.5 text-sm">Gestiona tu jornada y registra tus interacciones.</p>
        </div>
        {/* Tab switcher */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {([
            { key: 'jornada', icon: Clock, label: 'Hoy' },
            { key: 'historial', icon: History, label: 'Historial' },
          ] as const).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── JORNADA TAB ── */}
      {tab === 'jornada' && (
        <>
          {/* Jornada card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            {loadingJornada ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 size={24} className="animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1.5">Estado de jornada</p>
                    <span className={`inline-flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                    {inicioEvento && (
                      <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                        <Clock size={11} />
                        Inicio: {formatTime(inicioEvento.timestamp)}
                        {status === 'jornada_activa' && ` · ${elapsed(inicioEvento.timestamp)} trabajando`}
                      </p>
                    )}
                    {attendance?.tardanza && (
                      <p className="text-xs text-amber-600 mt-1 font-medium">
                        ⚠ Tardanza: {attendance.minutosTardanza} min
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {nextAction && (
                      <button
                        onClick={() => marcarEvento(nextAction.tipo)}
                        disabled={actionLoading}
                        className={`flex items-center gap-2 ${nextAction.color} disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm`}
                      >
                        {actionLoading ? <Loader2 size={16} className="animate-spin" /> : nextAction.icon}
                        {nextAction.label}
                      </button>
                    )}
                    {status === 'jornada_activa' && (
                      <button
                        onClick={() => marcarEvento('fin')}
                        disabled={actionLoading}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
                      >
                        <Square size={14} />
                        Finalizar
                      </button>
                    )}
                    {status === 'finalizado' && (
                      <span className="flex items-center gap-1.5 text-green-600 text-sm font-semibold">
                        <CheckCircle2 size={16} />
                        Jornada completada
                      </span>
                    )}
                  </div>
                </div>

                {/* Error */}
                {actionError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2.5 mb-4">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    {actionError}
                  </div>
                )}

                {/* Timeline */}
                <div className="flex items-center">
                  {STEPS.map((s, i) => {
                    const done = i <= currentStepIdx
                    const active = i === currentStepIdx
                    return (
                      <div key={s} className="flex items-center flex-1">
                        <div className={`w-3 h-3 rounded-full shrink-0 transition-all ${
                          active ? 'bg-blue-600 ring-4 ring-blue-100' : done ? 'bg-blue-600' : 'bg-slate-200'
                        }`} />
                        {i < STEPS.length - 1 && (
                          <div className={`flex-1 h-0.5 transition-all ${done && i < currentStepIdx ? 'bg-blue-600' : 'bg-slate-200'}`} />
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between mt-1.5">
                  {STEP_LABELS.map((l) => (
                    <span key={l} className="text-xs text-slate-400">{l}</span>
                  ))}
                </div>

                {/* Event log */}
                {attendance && attendance.eventos.length > 0 && (
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Registro de eventos</p>
                    <div className="space-y-2">
                      {attendance.eventos.map((e, i) => {
                        const labels: Record<string, string> = {
                          inicio: 'Inicio de jornada',
                          salida_refrigerio: 'Salida a refrigerio',
                          vuelta_refrigerio: 'Vuelta de refrigerio',
                          fin: 'Fin de jornada',
                        }
                        return (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                            <span className="text-slate-600 flex-1">{labels[e.tipo]}</span>
                            <span className="text-slate-400 text-xs">{formatTime(e.timestamp)}</span>
                          </div>
                        )
                      })}
                      {attendance.horasTrabajadas !== undefined && (
                        <div className="flex items-center gap-3 text-sm pt-1 border-t border-slate-100 mt-2">
                          <TrendingUp size={14} className="text-green-500 shrink-0" />
                          <span className="text-slate-600 flex-1 font-medium">Horas trabajadas</span>
                          <span className="text-green-600 font-bold text-xs">{attendance.horasTrabajadas}h</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Phone, label: 'Clientes asignados', value: '—', color: 'bg-blue-50 text-blue-600' },
              { icon: MessageSquare, label: 'Interacciones hoy', value: '—', color: 'bg-purple-50 text-purple-600' },
              { icon: CheckCircle2, label: 'Resueltos hoy', value: '—', color: 'bg-green-50 text-green-600' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm text-center">
                <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center mx-auto mb-2`}>
                  <Icon size={18} />
                </div>
                <p className="text-xl font-extrabold text-slate-800">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Nueva interacción button */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800">Registrar interacción</p>
              <p className="text-sm text-slate-500 mt-0.5">Documenta una llamada o contacto con un cliente.</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              <Plus size={16} />
              Nueva interacción
            </button>
          </div>

          {/* ── MIS CLIENTES ASIGNADOS ── */}
          <MisClientesSection />
        </>
      )}

      {/* ── HISTORIAL TAB ── */}
      {tab === 'historial' && (
        <>
          {loadingHistorial ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 size={28} className="animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {/* Summary cards */}
              {historialResumen && (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    { label: 'Días registrados', value: historialResumen.total, color: 'bg-slate-50 text-slate-600' },
                    { label: 'Presentes', value: historialResumen.presentes, color: 'bg-green-50 text-green-600' },
                    { label: 'Tardanzas', value: historialResumen.tardanzas, color: 'bg-amber-50 text-amber-600' },
                    { label: 'Faltas', value: historialResumen.faltas, color: 'bg-red-50 text-red-600' },
                    { label: 'Horas totales', value: `${historialResumen.horasTotales}h`, color: 'bg-blue-50 text-blue-600' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className={`rounded-xl border border-slate-100 p-4 text-center ${color.split(' ')[0]}`}>
                      <p className={`text-2xl font-extrabold ${color.split(' ')[1]}`}>{value}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Records list */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="font-bold text-slate-800 flex items-center gap-2">
                    <Calendar size={16} className="text-blue-600" />
                    Últimos 30 días
                  </h2>
                  <span className="text-xs text-slate-400">{historial.length} registros</span>
                </div>

                {historial.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <History size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No hay registros de asistencia aún.</p>
                    <p className="text-xs mt-1">Inicia tu primera jornada desde la pestaña "Hoy".</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {historial.map((r) => {
                      const scfg = STATUS_CFG[r.status] ?? STATUS_CFG.sin_jornada
                      const inicio = r.eventos.find((e) => e.tipo === 'inicio')
                      const fin = r.eventos.find((e) => e.tipo === 'fin')
                      return (
                        <div key={r._id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-4">
                            {/* Date */}
                            <div className="w-16 shrink-0 text-center">
                              <p className="text-lg font-extrabold text-slate-800 leading-none">
                                {r.fecha.split('-')[2]}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-PE', { month: 'short' })}
                              </p>
                            </div>

                            {/* Status badge */}
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${scfg.bg} ${scfg.color} shrink-0`}>
                              {scfg.label}
                            </span>

                            {/* Times */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                {inicio && <span>Entrada: <strong className="text-slate-700">{formatTime(inicio.timestamp)}</strong></span>}
                                {fin && <span>Salida: <strong className="text-slate-700">{formatTime(fin.timestamp)}</strong></span>}
                                {r.horasTrabajadas !== undefined && (
                                  <span className="text-green-600 font-semibold">{r.horasTrabajadas}h trabajadas</span>
                                )}
                              </div>
                            </div>

                            {/* Flags */}
                            <div className="flex items-center gap-2 shrink-0">
                              {r.tardanza && (
                                <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                                  +{r.minutosTardanza}min
                                </span>
                              )}
                              {r.minutosRefrigerio !== undefined && (
                                <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full">
                                  Ref: {r.minutosRefrigerio}min
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Nueva interacción modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-slate-800 text-lg mb-5">Registrar interacción</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Resultado</label>
                <select
                  value={modalResult}
                  onChange={(e) => setModalResult(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="resuelto">Resuelto</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="sin_respuesta">Sin respuesta</option>
                  <option value="callback">Callback</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nota de la interacción</label>
                <textarea
                  rows={4}
                  value={modalNota}
                  onChange={(e) => setModalNota(e.target.value)}
                  placeholder="Describe brevemente la interacción con el cliente..."
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                {[
                  { icon: <Smile size={13} className="text-green-500" />, label: 'Positivo' },
                  { icon: <Meh size={13} className="text-blue-400" />, label: 'Neutral' },
                  { icon: <Frown size={13} className="text-red-500" />, label: 'Negativo' },
                ].map(({ icon, label }) => (
                  <span key={label} className="flex items-center gap-1">{icon} {label}</span>
                ))}
                <span className="ml-1">— El sentimiento lo analiza la IA automáticamente.</span>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setShowModal(false); setModalNota(''); setModalResult('resuelto') }}
                className="flex-1 border border-slate-200 text-slate-600 font-medium py-2.5 rounded-xl hover:bg-slate-50 text-sm"
              >
                Cancelar
              </button>
              <button
                disabled={savingInteraccion || !modalNota.trim()}
                onClick={async () => {
                  setSavingInteraccion(true)
                  try {
                    await api.post('/interactions', { resultado: modalResult, nota: modalNota, clientId: 'placeholder' })
                    setShowModal(false)
                    setModalNota('')
                    setModalResult('resuelto')
                  } catch {
                    // silently fail for now
                  } finally {
                    setSavingInteraccion(false)
                  }
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
              >
                {savingInteraccion ? <Loader2 size={15} className="animate-spin" /> : null}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
