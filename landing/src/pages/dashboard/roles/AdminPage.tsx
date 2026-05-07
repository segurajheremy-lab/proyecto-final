import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, UserPlus, TrendingUp, Clock,
  CheckCircle2, XCircle, MoreVertical,
  BarChart3, AlertTriangle, Phone, Loader2,
} from 'lucide-react'
import { api } from '../../../lib/api'

interface Interaccion {
  _id: string
  agentId?: { nombre: string; email: string }
  clientId?: { nombre: string; apellido: string }
  sentimientoScore?: number
  nota: string
  fecha: string
}

const roleColors: Record<string, string> = {
  sub_admin: 'bg-indigo-100 text-indigo-700',
  supervisor: 'bg-green-100 text-green-700',
  agent: 'bg-slate-100 text-slate-700',
}

const roleLabels: Record<string, string> = {
  sub_admin: 'Sub Admin',
  supervisor: 'Supervisor',
  agent: 'Agente',
}

export default function AdminPage() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [alertas, setAlertas] = useState<Interaccion[]>([])
  const [loadingAlertas, setLoadingAlertas] = useState(true)
  const [clientesHoy, setClientesHoy] = useState(0)

  useEffect(() => {
    // Load critical alerts
    api.get<{ success: boolean; data: { interacciones: Interaccion[] } }>(
      '/interactions?sentimiento=negativo&limite=5'
    )
      .then(res => setAlertas(res.data.data.interacciones ?? []))
      .catch(() => {})
      .finally(() => setLoadingAlertas(false))

    // Load today's client count from stats
    api.get<{ success: boolean; data: { clientesAtendidos?: number } }>('/stats/resumen')
      .then(res => setClientesHoy(res.data.data.clientesAtendidos ?? 0))
      .catch(() => {})
  }, [])

  const kpis = [
    { icon: Users, label: 'Total usuarios', value: '—', sub: 'Ver equipo', color: 'bg-blue-50 text-blue-600' },
    { icon: CheckCircle2, label: 'Usuarios activos', value: '—', sub: 'Del tenant', color: 'bg-green-50 text-green-600' },
    { icon: TrendingUp, label: 'Interacciones hoy', value: '—', sub: 'Tiempo real', color: 'bg-purple-50 text-purple-600' },
    { icon: Phone, label: 'Clientes atendidos', value: String(clientesHoy), sub: 'Hoy', color: 'bg-amber-50 text-amber-600' },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Panel de Administración</h1>
          <p className="text-slate-500 mt-1">Gestiona todo el personal y monitorea la operación.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/dashboard/reportes')}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
          >
            <BarChart3 size={16} />
            Reportes
          </button>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
            <UserPlus size={16} />
            Invitar usuario
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{value}</p>
            <p className="text-sm font-medium text-slate-700 mt-0.5">{label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance summary */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-600" />
              Asistencia esta semana
            </h2>
            <span className="text-xs text-slate-400">Lun – Vie</span>
          </div>
          <div className="flex items-end gap-3 h-32">
            {[
              { day: 'Lun', pct: 95 },
              { day: 'Mar', pct: 88 },
              { day: 'Mié', pct: 100 },
              { day: 'Jue', pct: 75 },
              { day: 'Vie', pct: 90 },
            ].map(({ day, pct }) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-semibold text-slate-600">{pct}%</span>
                <div className="w-full rounded-t-md bg-blue-500" style={{ height: `${pct}%` }} />
                <span className="text-xs text-slate-400">{day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sentiment summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-bold text-slate-800 mb-4">Sentimiento global</h2>
          <div className="space-y-3">
            {[
              { label: 'Positivo', pct: 62, color: 'bg-green-500' },
              { label: 'Neutral', pct: 28, color: 'bg-blue-400' },
              { label: 'Negativo', pct: 10, color: 'bg-red-400' },
            ].map(({ label, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{label}</span>
                  <span className="font-semibold text-slate-800">{pct}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Users table — placeholder until real users API is wired */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Equipo</h2>
          <button
            onClick={() => navigate('/dashboard/equipo')}
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            Ver todos →
          </button>
        </div>
        <div className="px-6 py-8 text-center text-slate-400 text-sm">
          <Users size={28} className="mx-auto mb-2 opacity-30" />
          <p>Ve a <button onClick={() => navigate('/dashboard/equipo')} className="text-blue-600 hover:underline">Equipo</button> para gestionar usuarios.</p>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
          <AlertTriangle size={18} className="text-amber-500" />
          Alertas críticas del día
        </h2>
        {loadingAlertas ? (
          <div className="flex items-center justify-center h-16">
            <Loader2 size={20} className="animate-spin text-blue-600" />
          </div>
        ) : alertas.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            <CheckCircle2 size={24} className="mx-auto mb-2 text-green-400" />
            No hay alertas críticas hoy.
          </div>
        ) : (
          <div className="space-y-3">
            {alertas.map(a => {
              const agente = a.agentId as { nombre?: string } | undefined
              const cliente = a.clientId as { nombre?: string; apellido?: string } | undefined
              return (
                <div key={a._id} className="flex items-start gap-3 border border-red-200 bg-red-50 rounded-xl px-4 py-3">
                  <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {agente?.nombre ?? 'Agente'} → {cliente?.nombre ?? ''} {cliente?.apellido ?? ''}
                    </p>
                    <p className="text-xs text-slate-600 truncate">{a.nota}</p>
                  </div>
                  {a.sentimientoScore !== undefined && (
                    <span className="text-xs font-bold text-red-700 shrink-0">
                      {Math.round(a.sentimientoScore)}%
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
