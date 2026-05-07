import { useState, useEffect } from 'react'
import {
  Users, Building2, TrendingUp, Clock,
  ArrowRight, UserPlus, CheckCircle2,
  Loader2, Phone, BarChart3,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTenant } from '../../context/TenantContext'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OwnerStats {
  role: string
  totalUsuarios: number
  usuariosActivos: number
  agentes: number
  interaccionesHoy: number
  interaccionesMes: number
  clientesTotal: number
  asistenciaHoy: number
  sentimiento: { positivo: number; neutral: number; negativo: number }
  plan: string
  trialDaysLeft: number
  agentesLimit: number
}

interface AgentStats {
  role: string
  asistenciaHoy: string
  interaccionesHoy: number
}

interface SupervisorStats {
  role: string
  totalAgentes: number
  presentesHoy: number
  interaccionesHoy: number
  clientesActivos: number
}

type StatsData = OwnerStats | AgentStats | SupervisorStats

// ---------------------------------------------------------------------------
// Role-specific views
// ---------------------------------------------------------------------------

function OwnerResumen({ stats }: { stats: OwnerStats }) {
  const { tenant } = useTenant()
  const { user } = useAuth()

  const kpis = [
    { icon: Users, label: 'Usuarios activos', value: String(stats.usuariosActivos), sub: `de ${stats.totalUsuarios} totales`, color: 'bg-blue-50 text-blue-600' },
    { icon: Building2, label: 'Plan', value: stats.plan.charAt(0).toUpperCase() + stats.plan.slice(1), sub: stats.plan === 'trial' ? `${stats.trialDaysLeft} días restantes` : 'Activo', color: 'bg-indigo-50 text-indigo-600' },
    { icon: TrendingUp, label: 'Interacciones hoy', value: String(stats.interaccionesHoy), sub: `${stats.interaccionesMes} este mes`, color: 'bg-purple-50 text-purple-600' },
    { icon: Phone, label: 'Clientes totales', value: String(stats.clientesTotal), sub: `${stats.agentes} agentes activos`, color: 'bg-green-50 text-green-600' },
  ]

  const totalSentimiento = stats.sentimiento.positivo + stats.sentimiento.neutral + stats.sentimiento.negativo
  const pct = (n: number) => totalSentimiento > 0 ? Math.round((n / totalSentimiento) * 100) : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Bienvenido, {user?.nombre?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 mt-1">{tenant?.nombre ?? 'Tu empresa'} · Panel ejecutivo</p>
      </div>

      {/* Onboarding if no users yet */}
      {stats.totalUsuarios <= 1 && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
          <h2 className="font-bold text-lg mb-1">Configura tu empresa en 3 pasos</h2>
          <p className="text-blue-100 text-sm mb-5">Completa estos pasos para aprovechar al máximo la plataforma.</p>
          <div className="space-y-3">
            {[
              { done: true, label: 'Empresa registrada', sub: 'Tu espacio está activo' },
              { done: stats.totalUsuarios > 1, label: 'Invitar primer Admin', sub: 'Ve a Equipo → Invitar usuario' },
              { done: false, label: 'Configurar horarios', sub: 'Ve a Configuración' },
            ].map(({ done, label, sub }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${done ? 'bg-white text-blue-600' : 'bg-white/20 text-white'}`}>
                  {done ? '✓' : i + 1}
                </div>
                <div>
                  <p className={`text-sm font-medium ${done ? 'line-through text-blue-200' : 'text-white'}`}>{label}</p>
                  <p className="text-blue-200 text-xs">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Sentiment */}
      {totalSentimiento > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
            <BarChart3 size={18} className="text-blue-600" />
            Sentimiento global — últimos 30 días
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Positivo', count: stats.sentimiento.positivo, color: 'bg-green-500' },
              { label: 'Neutral', count: stats.sentimiento.neutral, color: 'bg-blue-400' },
              { label: 'Negativo', count: stats.sentimiento.negativo, color: 'bg-red-400' },
            ].map(({ label, count, color }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{label}</span>
                  <span className="font-semibold text-slate-800">{pct(count)}% ({count})</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct(count)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { to: '/dashboard/equipo', icon: UserPlus, title: 'Gestionar equipo', desc: 'Invita y administra usuarios de tu empresa.', color: 'border-blue-200 hover:border-blue-400', iconBg: 'bg-blue-50 text-blue-600' },
            { to: '/dashboard/empresa', icon: Building2, title: 'Configurar empresa', desc: 'Personaliza nombre, colores y límites.', color: 'border-indigo-200 hover:border-indigo-400', iconBg: 'bg-indigo-50 text-indigo-600' },
          ].map(({ to, icon: Icon, title, desc, color, iconBg }) => (
            <Link key={to} to={to} className={`bg-white rounded-xl border-2 ${color} p-5 flex items-start gap-4 transition-all hover:shadow-md group`}>
              <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800">{title}</p>
                <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
              </div>
              <ArrowRight size={18} className="text-slate-300 group-hover:text-slate-600 transition-colors shrink-0 mt-1" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function AgentResumen({ stats }: { stats: AgentStats }) {
  const { user } = useAuth()
  const statusLabels: Record<string, { label: string; color: string }> = {
    sin_jornada:     { label: 'Sin jornada', color: 'bg-slate-100 text-slate-600' },
    jornada_activa:  { label: 'Jornada activa', color: 'bg-green-100 text-green-700' },
    en_refrigerio:   { label: 'En refrigerio', color: 'bg-amber-100 text-amber-700' },
    post_refrigerio: { label: 'Post refrigerio', color: 'bg-blue-100 text-blue-700' },
    finalizado:      { label: 'Finalizado', color: 'bg-slate-100 text-slate-600' },
  }
  const statusCfg = statusLabels[stats.asistenciaHoy] ?? statusLabels.sin_jornada

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Hola, {user?.nombre?.split(' ')[0]} 👋</h1>
        <p className="text-slate-500 mt-1">Tu panel de trabajo del día.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs text-slate-500 mb-2">Estado de jornada</p>
          <span className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full ${statusCfg.color}`}>
            <span className="w-2 h-2 rounded-full bg-current opacity-60" />
            {statusCfg.label}
          </span>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs text-slate-500 mb-1">Interacciones hoy</p>
          <p className="text-3xl font-extrabold text-slate-800">{stats.interaccionesHoy}</p>
        </div>
      </div>

      <Link to="/dashboard/agente" className="flex items-center justify-between bg-blue-600 hover:bg-blue-500 text-white rounded-xl p-5 transition-colors group">
        <div>
          <p className="font-bold">Ir a mi panel de trabajo</p>
          <p className="text-blue-200 text-sm mt-0.5">Gestiona tu jornada, clientes e interacciones</p>
        </div>
        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  )
}

function SupervisorResumen({ stats }: { stats: SupervisorStats }) {
  const { user } = useAuth()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Hola, {user?.nombre?.split(' ')[0]} 👋</h1>
        <p className="text-slate-500 mt-1">Resumen de tu equipo hoy.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Agentes', value: String(stats.totalAgentes), color: 'bg-blue-50 text-blue-600' },
          { icon: CheckCircle2, label: 'Presentes hoy', value: String(stats.presentesHoy), color: 'bg-green-50 text-green-600' },
          { icon: TrendingUp, label: 'Interacciones hoy', value: String(stats.interaccionesHoy), color: 'bg-purple-50 text-purple-600' },
          { icon: Phone, label: 'Clientes activos', value: String(stats.clientesActivos), color: 'bg-amber-50 text-amber-600' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}><Icon size={20} /></div>
            <p className="text-2xl font-extrabold text-slate-800">{value}</p>
            <p className="text-sm font-medium text-slate-700 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      <Link to="/dashboard/supervisor" className="flex items-center justify-between bg-green-600 hover:bg-green-500 text-white rounded-xl p-5 transition-colors group">
        <div>
          <p className="font-bold">Ver panel de supervisión</p>
          <p className="text-green-200 text-sm mt-0.5">Agentes, clientes y alertas en tiempo real</p>
        </div>
        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ResumenPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get<{ success: boolean; data: StatsData }>('/stats/resumen')
        setStats(data.data)
      } catch {
        // Silently fail — show empty state
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-blue-600" />
      </div>
    )
  }

  const role = user?.role ?? 'agent'

  if (role === 'agent') {
    return <AgentResumen stats={(stats as AgentStats) ?? { role: 'agent', asistenciaHoy: 'sin_jornada', interaccionesHoy: 0 }} />
  }

  if (role === 'supervisor') {
    return <SupervisorResumen stats={(stats as SupervisorStats) ?? { role: 'supervisor', totalAgentes: 0, presentesHoy: 0, interaccionesHoy: 0, clientesActivos: 0 }} />
  }

  // owner, admin, sub_admin
  return <OwnerResumen stats={(stats as OwnerStats) ?? { role, totalUsuarios: 0, usuariosActivos: 0, agentes: 0, interaccionesHoy: 0, interaccionesMes: 0, clientesTotal: 0, asistenciaHoy: 0, sentimiento: { positivo: 0, neutral: 0, negativo: 0 }, plan: 'trial', trialDaysLeft: 0, agentesLimit: 10 }} />
}
