// placeholder — part 1
import { useState, useEffect, useCallback, FormEvent } from 'react'
import {
  Calendar, Download, Mail, Loader2, AlertCircle,
  CheckCircle2, BarChart3, TrendingUp, Users,
  Clock, Phone, AlertTriangle, X,
} from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReporteAgente {
  tipo: 'reporte_agente'
  generadoPor: { nombre: string; role: string }
  agente: { nombre: string; email: string }
  fecha: string
  asistencia: {
    status: string
    horaEntrada: string | null
    horaSalida: string | null
    tardanza: boolean
    minutosTardanza: number
    horasTrabajadas: number
    minutosRefrigerio: number
  }
  interacciones: {
    total: number; resueltas: number; pendientes: number
    sinRespuesta: number; callbacks: number; duracionPromedio: number
  }
  sentimiento: { positivo: number; neutral: number; negativo: number; scorePromedio: number }
  alertas: { clienteNombre: string; nota: string; sentimientoScore: number; fecha: string }[]
  clientes: { nombre: string; apellido: string; telefono: string; ultimaInteraccion: string; estado: string; resultado: string }[]
}

interface ReporteArea {
  tipo: 'reporte_area'
  generadoPor: { nombre: string; role: string }
  area: string
  fecha: string
  resumenSupervisores: {
    supervisor: { nombre: string; email: string }
    totalAgentes: number; presentes: number; faltas: number; tardanzas: number
    totalInteracciones: number; resueltas: number; tasaResolucion: number
    sentimientoPromedio: string; alertas: number
  }[]
  totales: Record<string, number>
}

interface ReporteEjecutivo {
  tipo: 'reporte_ejecutivo'
  empresa: { nombre: string; plan: string }
  generadoPor: { nombre: string }
  fecha: string
  resumenAreas: {
    subAdmin: { nombre: string; email: string }
    totalSupervisores: number; totalAgentes: number; presentes: number
    interacciones: number; resueltas: number; tasaResolucion: number
    sentimientoPromedio: string; alertasCriticas: number
  }[]
  kpis: { tasaAsistencia: number; tasaResolucion: number; sentimientoGeneral: string; alertasCriticas: number; agentesActivos: number; clientesAtendidos: number }
  tendencia: 'mejorando' | 'estable' | 'deteriorando'
}

interface Agente { _id: string; nombre: string; email: string }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayStr() {
  return new Date().toISOString().split('T')[0]!
}

const ASISTENCIA_BADGE: Record<string, string> = {
  jornada_activa:  'bg-green-100 text-green-700',
  finalizado:      'bg-blue-100 text-blue-700',
  en_refrigerio:   'bg-amber-100 text-amber-700',
  post_refrigerio: 'bg-cyan-100 text-cyan-700',
  falta:           'bg-red-100 text-red-700',
  falta_justificada: 'bg-orange-100 text-orange-700',
  sin_jornada:     'bg-slate-100 text-slate-600',
}

const SENTIMIENTO_EMOJI: Record<string, string> = { positivo: '😊', neutral: '😐', negativo: '😟' }
const TENDENCIA_ICON: Record<string, string> = { mejorando: '📈', estable: '📊', deteriorando: '📉' }
const TENDENCIA_COLOR: Record<string, string> = {
  mejorando:    'text-green-600 bg-green-50 border-green-200',
  estable:      'text-blue-600 bg-blue-50 border-blue-200',
  deteriorando: 'text-red-600 bg-red-50 border-red-200',
}

// ---------------------------------------------------------------------------
// SVG Bar Chart (no external libs)
// ---------------------------------------------------------------------------

interface BarData { label: string; value: number; color: string }

function BarChart({ bars, maxValue }: { bars: BarData[]; maxValue: number }) {
  const [tooltip, setTooltip] = useState<{ idx: number; x: number; y: number } | null>(null)
  const H = 160
  const barW = 36
  const gap = 20
  const paddingLeft = 10
  const totalW = bars.length * (barW + gap) + paddingLeft

  return (
    <div className="relative overflow-x-auto">
      <svg width={totalW} height={H + 40} className="overflow-visible">
        {bars.map((bar, i) => {
          const barH = maxValue > 0 ? Math.round((bar.value / maxValue) * H) : 0
          const x = paddingLeft + i * (barW + gap)
          const y = H - barH
          return (
            <g key={bar.label}
              onMouseEnter={e => setTooltip({ idx: i, x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setTooltip(null)}
              className="cursor-pointer"
            >
              <rect x={x} y={y} width={barW} height={barH || 2}
                fill={bar.color} rx={4} className="transition-opacity hover:opacity-80" />
              <text x={x + barW / 2} y={H + 16} textAnchor="middle"
                className="text-xs fill-slate-500" fontSize={10}>
                {bar.label.length > 8 ? bar.label.slice(0, 8) + '…' : bar.label}
              </text>
            </g>
          )
        })}
        {/* Y-axis line */}
        <line x1={paddingLeft - 4} y1={0} x2={paddingLeft - 4} y2={H} stroke="#e2e8f0" strokeWidth={1} />
      </svg>
      {tooltip !== null && bars[tooltip.idx] && (
        <div className="fixed z-50 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none"
          style={{ left: tooltip.x + 8, top: tooltip.y - 28 }}>
          {bars[tooltip.idx]!.label}: <strong>{bars[tooltip.idx]!.value}</strong>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sentiment bar
// ---------------------------------------------------------------------------

function SentimentBar({ label, emoji, pct, color }: { label: string; emoji: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-sm text-slate-600 shrink-0">{emoji} {label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-sm font-semibold text-slate-700">{pct}%</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Email modal
// ---------------------------------------------------------------------------

interface EmailModalProps {
  tipo: 'agente' | 'area' | 'ejecutivo'
  agentId?: string
  fecha: string
  onClose: () => void
}

function EmailModal({ tipo, agentId, fecha, onClose }: EmailModalProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    if (!email) { setError('Ingresa un email.'); return }
    setError('')
    setLoading(true)
    try {
      const url = tipo === 'agente' && agentId
        ? `/reports/agente/${agentId}/enviar?fecha=${fecha}`
        : tipo === 'area'
        ? `/reports/area/enviar?fecha=${fecha}`
        : `/reports/ejecutivo/enviar?fecha=${fecha}`
      await api.post(url, { email })
      setSent(true)
    } catch {
      setError('Error al enviar el reporte.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Mail size={18} className="text-blue-600" /> Enviar reporte por email
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
        </div>
        <div className="p-6">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 size={40} className="text-green-500" />
              <p className="font-semibold text-slate-800">✅ Reporte enviado a {email}</p>
              <button onClick={onClose} className="text-blue-600 text-sm hover:underline">Cerrar</button>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email destinatario</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="destinatario@empresa.com"
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={onClose}
                  className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                  Enviar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ReporteAgenteView
// ---------------------------------------------------------------------------

function ReporteAgenteView({ reporte }: { reporte: ReporteAgente }) {
  const badgeClass = ASISTENCIA_BADGE[reporte.asistencia.status] ?? 'bg-slate-100 text-slate-600'

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-800">{reporte.agente.nombre}</h2>
          <p className="text-slate-500 text-sm">{reporte.agente.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700 capitalize">
            {reporte.generadoPor.role}
          </span>
          <span className="text-sm text-slate-500 flex items-center gap-1">
            <Calendar size={14} /> {reporte.fecha}
          </span>
        </div>
      </div>

      {/* Attendance */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Clock size={16} className="text-blue-500" /> Asistencia
        </h3>
        <div className="flex flex-wrap gap-4 items-center">
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${badgeClass}`}>
            {reporte.asistencia.status.replace(/_/g, ' ')}
          </span>
          {reporte.asistencia.horaEntrada && (
            <span className="text-sm text-slate-600">
              Entrada: <strong>{reporte.asistencia.horaEntrada}</strong>
            </span>
          )}
          {reporte.asistencia.horaSalida && (
            <span className="text-sm text-slate-600">
              Salida: <strong>{reporte.asistencia.horaSalida}</strong>
            </span>
          )}
          {reporte.asistencia.tardanza && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              Tardanza {reporte.asistencia.minutosTardanza} min
            </span>
          )}
          <span className="text-sm text-slate-600">
            Horas trabajadas: <strong>{reporte.asistencia.horasTrabajadas.toFixed(1)} h</strong>
          </span>
        </div>
      </div>

      {/* Interactions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Phone size={16} className="text-blue-500" /> Interacciones
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: reporte.interacciones.total, color: 'bg-slate-50 border-slate-200 text-slate-700' },
            { label: 'Resueltas', value: reporte.interacciones.resueltas, color: 'bg-green-50 border-green-200 text-green-700' },
            { label: 'Pendientes', value: reporte.interacciones.pendientes, color: 'bg-amber-50 border-amber-200 text-amber-700' },
            { label: 'Sin respuesta', value: reporte.interacciones.sinRespuesta, color: 'bg-red-50 border-red-200 text-red-700' },
          ].map(card => (
            <div key={card.label} className={`rounded-xl border p-4 flex flex-col items-center ${card.color}`}>
              <span className="text-3xl font-bold">{card.value}</span>
              <span className="text-xs mt-1 font-medium">{card.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sentiment */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-blue-500" /> Sentimiento
        </h3>
        <div className="space-y-3">
          <SentimentBar label="Positivo" emoji={SENTIMIENTO_EMOJI['positivo']!} pct={reporte.sentimiento.positivo} color="bg-green-400" />
          <SentimentBar label="Neutral"  emoji={SENTIMIENTO_EMOJI['neutral']!}  pct={reporte.sentimiento.neutral}  color="bg-blue-400" />
          <SentimentBar label="Negativo" emoji={SENTIMIENTO_EMOJI['negativo']!} pct={reporte.sentimiento.negativo} color="bg-red-400" />
        </div>
      </div>

      {/* Alerts */}
      {reporte.alertas.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" /> Alertas ({reporte.alertas.length})
          </h3>
          <ul className="space-y-3">
            {reporte.alertas.map((alerta, i) => (
              <li key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <span className="font-semibold text-slate-800 text-sm">{alerta.clienteNombre}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">
                  Score: {alerta.sentimientoScore}
                </span>
                <span className="text-slate-600 text-sm flex-1">
                  {alerta.nota.length > 100 ? alerta.nota.slice(0, 100) + '…' : alerta.nota}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Clients table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Users size={16} className="text-blue-500" /> Clientes atendidos
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 px-3 text-slate-500 font-medium">Nombre</th>
                <th className="text-left py-2 px-3 text-slate-500 font-medium">Teléfono</th>
                <th className="text-left py-2 px-3 text-slate-500 font-medium">Resultado</th>
                <th className="text-left py-2 px-3 text-slate-500 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {reporte.clientes.map((c, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-3 font-medium text-slate-800">{c.nombre} {c.apellido}</td>
                  <td className="py-2 px-3 text-slate-600">{c.telefono}</td>
                  <td className="py-2 px-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium capitalize">
                      {c.resultado}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium capitalize">
                      {c.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ReporteAreaView
// ---------------------------------------------------------------------------

function ReporteAreaView({ reporte }: { reporte: ReporteArea }) {
  return (
    <div className="space-y-6">
      {/* Supervisor cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reporte.resumenSupervisores.map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            {/* Supervisor header */}
            <div>
              <p className="font-bold text-slate-800">{s.supervisor.nombre}</p>
              <p className="text-xs text-slate-500">{s.supervisor.email}</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-slate-50 rounded-lg p-2">
                <p className="text-lg font-bold text-slate-700">{s.totalAgentes}</p>
                <p className="text-xs text-slate-500">Agentes</p>
              </div>
              <div className="bg-green-50 rounded-lg p-2">
                <p className="text-lg font-bold text-green-700">{s.presentes}/{s.totalAgentes}</p>
                <p className="text-xs text-green-600">Presentes</p>
              </div>
              <div className="bg-red-50 rounded-lg p-2">
                <p className="text-lg font-bold text-red-700">{s.faltas}</p>
                <p className="text-xs text-red-600">Faltas</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-2">
                <p className="text-lg font-bold text-amber-700">{s.tardanzas}</p>
                <p className="text-xs text-amber-600">Tardanzas</p>
              </div>
            </div>

            {/* Interactions & resolution */}
            <div className="flex gap-4 text-sm">
              <span className="text-slate-600">
                Interacciones: <strong className="text-slate-800">{s.totalInteracciones}</strong>
              </span>
              <span className="text-slate-600">
                Resolución: <strong className="text-slate-800">{s.tasaResolucion}%</strong>
              </span>
            </div>

            {/* Sentiment & alerts */}
            <div className="flex items-center justify-between">
              <span className="text-sm">
                {SENTIMIENTO_EMOJI[s.sentimientoPromedio] ?? '😐'}{' '}
                <span className="capitalize text-slate-600">{s.sentimientoPromedio}</span>
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.alertas > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                {s.alertas} alerta{s.alertas !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <BarChart3 size={16} className="text-blue-500" /> Totales del área
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(reporte.totales).map(([key, val]) => (
            <div key={key} className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-slate-800">{typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(1)) : val}</p>
              <p className="text-xs text-slate-500 mt-1 capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ReporteEjecutivoView
// ---------------------------------------------------------------------------

function ReporteEjecutivoView({ reporte }: { reporte: ReporteEjecutivo }) {
  const maxInteracciones = Math.max(...reporte.resumenAreas.map(a => a.interacciones), 1)

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
          <p className="text-3xl font-bold text-blue-600">{reporte.kpis.tasaAsistencia}%</p>
          <p className="text-xs text-slate-500 mt-1">Tasa asistencia</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
          <p className="text-3xl font-bold text-green-600">{reporte.kpis.tasaResolucion}%</p>
          <p className="text-xs text-slate-500 mt-1">Tasa resolución</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
          <p className="text-3xl font-bold text-slate-700">
            {SENTIMIENTO_EMOJI[reporte.kpis.sentimientoGeneral] ?? '😐'}
          </p>
          <p className="text-xs text-slate-500 mt-1 capitalize">{reporte.kpis.sentimientoGeneral}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
          <p className={`text-3xl font-bold ${reporte.kpis.alertasCriticas > 0 ? 'text-red-600' : 'text-slate-700'}`}>
            {reporte.kpis.alertasCriticas}
          </p>
          <p className="text-xs text-slate-500 mt-1">Alertas críticas</p>
        </div>
      </div>

      {/* Tendencia badge */}
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full border ${TENDENCIA_COLOR[reporte.tendencia]}`}>
          {TENDENCIA_ICON[reporte.tendencia]} Tendencia: {reporte.tendencia}
        </span>
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <BarChart3 size={16} className="text-blue-500" /> Interacciones por área
        </h3>
        <BarChart
          bars={reporte.resumenAreas.map(a => ({
            label: a.subAdmin.nombre,
            value: a.interacciones,
            color: '#3B82F6',
          }))}
          maxValue={maxInteracciones}
        />
      </div>

      {/* Areas table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Users size={16} className="text-blue-500" /> Resumen por área
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Sub-admin', 'Supervisores', 'Agentes', 'Presentes', 'Interacciones', 'Resueltas', 'Resolución', 'Sentimiento', 'Alertas'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-slate-500 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reporte.resumenAreas.map((a, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-3 font-medium text-slate-800 whitespace-nowrap">{a.subAdmin.nombre}</td>
                  <td className="py-2 px-3 text-center text-slate-600">{a.totalSupervisores}</td>
                  <td className="py-2 px-3 text-center text-slate-600">{a.totalAgentes}</td>
                  <td className="py-2 px-3 text-center text-slate-600">{a.presentes}</td>
                  <td className="py-2 px-3 text-center text-slate-600">{a.interacciones}</td>
                  <td className="py-2 px-3 text-center text-slate-600">{a.resueltas}</td>
                  <td className="py-2 px-3 text-center">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">
                      {a.tasaResolucion}%
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    {SENTIMIENTO_EMOJI[a.sentimientoPromedio] ?? '😐'} {a.sentimientoPromedio}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${a.alertasCriticas > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                      {a.alertasCriticas}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main ReportesPage
// ---------------------------------------------------------------------------

export default function ReportesPage() {
  const { user } = useAuth()
  const role = user?.role ?? ''

  const [fecha, setFecha] = useState(todayStr())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reporte, setReporte] = useState<ReporteAgente | ReporteArea | ReporteEjecutivo | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [agentes, setAgentes] = useState<Agente[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')

  // Load agents list for supervisor role
  useEffect(() => {
    if (role !== 'supervisor') return
    api.get<{ success: boolean; data: { users: Agente[] } }>('/users')
      .then(res => {
        const all: Agente[] = res.data?.data?.users ?? (res.data?.data as unknown as Agente[]) ?? []
        const agents = all.filter((u: Agente & { role?: string }) => (u as Agente & { role?: string }).role === 'agent')
        setAgentes(agents)
        if (agents.length > 0 && !selectedAgentId) setSelectedAgentId(agents[0]!._id)
      })
      .catch(() => { /* silently ignore */ })
  }, [role])

  const loadReporte = useCallback(async (agentId?: string) => {
    const aid = agentId ?? selectedAgentId
    if (role === 'supervisor' && !aid) {
      setError('Selecciona un agente para generar el reporte.')
      return
    }
    setLoading(true)
    setError('')
    try {
      let url = ''
      if (role === 'supervisor') {
        url = `/reports/agente/${aid}?fecha=${fecha}`
      } else if (role === 'sub_admin') {
        url = `/reports/area?fecha=${fecha}`
      } else {
        url = `/reports/ejecutivo?fecha=${fecha}`
      }
      const res = await api.get(url)
      setReporte(res.data?.data ?? res.data)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Error al cargar el reporte.')
    } finally {
      setLoading(false)
    }
  }, [role, fecha, selectedAgentId])

  const downloadExcel = async (path: string) => {
    const res = await api.get(path, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-${fecha}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownload = () => {
    if (role === 'supervisor') {
      if (!selectedAgentId) return
      downloadExcel(`/reports/agente/${selectedAgentId}/excel?fecha=${fecha}`)
    } else if (role === 'sub_admin') {
      downloadExcel(`/reports/area/excel?fecha=${fecha}`)
    } else {
      downloadExcel(`/reports/ejecutivo/excel?fecha=${fecha}`)
    }
  }

  const pageTitle =
    role === 'supervisor' ? 'Reportes del Equipo' :
    role === 'sub_admin'  ? 'Reporte de mi Área' :
    'Reporte Ejecutivo'

  const emailTipo: 'agente' | 'area' | 'ejecutivo' =
    role === 'supervisor' ? 'agente' :
    role === 'sub_admin'  ? 'area' :
    'ejecutivo'

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 size={24} className="text-blue-600" /> {pageTitle}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Date picker */}
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-slate-400" />
                <input
                  type="date"
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Generate button */}
              <button
                onClick={() => loadReporte()}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <BarChart3 size={15} />}
                Generar reporte
              </button>

              {/* Download Excel */}
              {reporte && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  <Download size={15} /> Descargar Excel
                </button>
              )}

              {/* Send email */}
              {reporte && (
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  <Mail size={15} /> Enviar por email
                </button>
              )}
            </div>
          </div>

          {/* Agent selector for supervisor */}
          {role === 'supervisor' && agentes.length > 0 && (
            <div className="mt-5 pt-5 border-t border-slate-100">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Seleccionar agente
              </label>
              <div className="flex flex-wrap gap-2">
                {agentes.map(a => (
                  <button
                    key={a._id}
                    onClick={() => {
                      setSelectedAgentId(a._id)
                      setReporte(null)
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                      selectedAgentId === a._id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {a.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={32} className="animate-spin text-blue-600" />
          </div>
        )}

        {/* Empty state */}
        {!loading && !reporte && !error && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <BarChart3 size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm">
              {role === 'supervisor' && agentes.length === 0
                ? 'No tienes agentes asignados aún.'
                : 'Selecciona una fecha y haz clic en "Generar reporte".'}
            </p>
          </div>
        )}

        {/* Report content */}
        {!loading && reporte && (
          <>
            {reporte.tipo === 'reporte_agente' && (
              <ReporteAgenteView reporte={reporte as ReporteAgente} />
            )}
            {reporte.tipo === 'reporte_area' && (
              <ReporteAreaView reporte={reporte as ReporteArea} />
            )}
            {reporte.tipo === 'reporte_ejecutivo' && (
              <ReporteEjecutivoView reporte={reporte as ReporteEjecutivo} />
            )}
          </>
        )}
      </div>

      {/* Email modal */}
      {showEmailModal && (
        <EmailModal
          tipo={emailTipo}
          agentId={selectedAgentId || undefined}
          fecha={fecha}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </div>
  )
}
