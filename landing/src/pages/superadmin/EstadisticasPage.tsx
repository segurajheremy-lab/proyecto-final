import { useState, useEffect } from 'react'
import { Building2, Users, TrendingUp, AlertTriangle, Loader2, AlertCircle } from 'lucide-react'
import { api } from '../../lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GlobalStats {
  totalTenants: number
  tenantsActivos: number
  tenantsSuspendidos: number
  totalUsuarios: number
  totalAgentes: number
  totalInteracciones: number
  tenantsPorPlan: { trial: number; starter: number; pro: number; enterprise: number }
}

interface Tenant {
  _id: string
  nombre: string
  dominio: string
  plan: string
  status: string
  trialExpira: string
  agentesLimit: number
  creadoEn: string
  estadisticas?: {
    totalInteracciones: number
    totalUsers: number
    totalAgentes: number
    totalClientes: number
  }
}

// ---------------------------------------------------------------------------
// SVG Bar Chart
// ---------------------------------------------------------------------------

interface BarData { label: string; value: number; color: string }

function BarChart({ bars, maxValue }: { bars: BarData[]; maxValue: number }) {
  const [tooltip, setTooltip] = useState<{ idx: number; x: number; y: number } | null>(null)
  const H = 140
  const barW = 48
  const gap = 24
  const totalW = bars.length * (barW + gap) + 16

  return (
    <div className="relative overflow-x-auto">
      <svg width={totalW} height={H + 36} className="overflow-visible">
        {bars.map((bar, i) => {
          const barH = maxValue > 0 ? Math.round((bar.value / maxValue) * H) : 0
          const x = 8 + i * (barW + gap)
          const y = H - barH
          return (
            <g key={bar.label}
              onMouseEnter={e => setTooltip({ idx: i, x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setTooltip(null)}
              className="cursor-pointer"
            >
              <rect x={x} y={y} width={barW} height={barH || 2} fill={bar.color} rx={6} className="hover:opacity-80 transition-opacity" />
              <text x={x + barW / 2} y={H + 18} textAnchor="middle" fontSize={11} fill="#94a3b8">{bar.label}</text>
              <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize={11} fill="#e2e8f0" fontWeight="600">{bar.value}</text>
            </g>
          )
        })}
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
// Helpers
// ---------------------------------------------------------------------------

function daysUntil(dateStr: string): number {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000))
}

function relativeDate(dateStr: string): string {
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (d === 0) return 'hoy'
  if (d === 1) return 'ayer'
  if (d < 30) return `hace ${d} días`
  return new Date(dateStr).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function EstadisticasPage() {
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [statsRes, tenantsRes] = await Promise.all([
          api.get<{ success: boolean; data: GlobalStats }>('/superadmin/stats'),
          api.get<{ success: boolean; data: { tenants: Tenant[] } }>('/superadmin/tenants?limite=100'),
        ])
        setStats(statsRes.data.data)
        setTenants(tenantsRes.data.data.tenants)
      } catch {
        setError('No se pudieron cargar las estadísticas.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-red-500" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="flex items-center gap-2 bg-red-900/20 border border-red-700/40 text-red-400 rounded-xl px-4 py-3">
        <AlertCircle size={16} /> {error}
      </div>
    )
  }

  const planBars: BarData[] = [
    { label: 'Trial',      value: stats.tenantsPorPlan.trial,      color: '#64748b' },
    { label: 'Starter',    value: stats.tenantsPorPlan.starter,    color: '#3b82f6' },
    { label: 'Pro',        value: stats.tenantsPorPlan.pro,        color: '#8b5cf6' },
    { label: 'Enterprise', value: stats.tenantsPorPlan.enterprise, color: '#f59e0b' },
  ]
  const maxPlan = Math.max(...planBars.map(b => b.value), 1)

  // Top 5 by interactions (approximate from tenant list)
  const trialExpiring = tenants
    .filter(t => t.status === 'trial')
    .sort((a, b) => new Date(a.trialExpira).getTime() - new Date(b.trialExpira).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { icon: Building2, label: 'Total empresas',    value: stats.totalTenants,       color: 'bg-slate-800 border-slate-700', iconColor: 'text-slate-400', iconBg: 'bg-slate-700' },
          { icon: Building2, label: 'Empresas activas',  value: stats.tenantsActivos,     color: 'bg-green-900/30 border-green-700/40', iconColor: 'text-green-400', iconBg: 'bg-green-800/40' },
          { icon: Users,     label: 'Total usuarios',    value: stats.totalUsuarios,      color: 'bg-blue-900/30 border-blue-700/40', iconColor: 'text-blue-400', iconBg: 'bg-blue-800/40' },
          { icon: TrendingUp,label: 'Interacciones',     value: stats.totalInteracciones, color: 'bg-purple-900/30 border-purple-700/40', iconColor: 'text-purple-400', iconBg: 'bg-purple-800/40' },
        ].map(({ icon: Icon, label, value, color, iconColor, iconBg }) => (
          <div key={label} className={`rounded-2xl border p-6 ${color}`}>
            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-4`}>
              <Icon size={20} className={iconColor} />
            </div>
            <p className="text-3xl font-extrabold text-white">{value.toLocaleString()}</p>
            <p className="text-slate-400 text-sm mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Plan distribution */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
        <h2 className="text-white font-semibold mb-6">Distribución por plan</h2>
        <BarChart bars={planBars} maxValue={maxPlan} />
      </div>

      {/* Trial expiring soon */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-400" />
          Trials próximos a expirar
        </h2>
        {trialExpiring.length === 0 ? (
          <p className="text-slate-400 text-sm">No hay trials próximos a expirar.</p>
        ) : (
          <div className="space-y-3">
            {trialExpiring.map(t => {
              const days = daysUntil(t.trialExpira)
              return (
                <div key={t._id} className="flex items-center gap-4 bg-slate-900/50 rounded-xl px-4 py-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {t.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{t.nombre}</p>
                    <p className="text-slate-400 text-xs">{t.dominio}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    days <= 3 ? 'bg-red-900/40 text-red-400 border border-red-700/40'
                    : days <= 7 ? 'bg-amber-900/40 text-amber-400 border border-amber-700/40'
                    : 'bg-slate-700 text-slate-300'
                  }`}>
                    {days === 0 ? 'Hoy' : `${days} días`}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent tenants */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
        <h2 className="text-white font-semibold mb-4">Empresas recientes</h2>
        <div className="space-y-3">
          {tenants.slice(0, 5).map(t => (
            <div key={t._id} className="flex items-center gap-4 bg-slate-900/50 rounded-xl px-4 py-3">
              <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {t.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{t.nombre}</p>
                <p className="text-slate-400 text-xs">{t.dominio}</p>
              </div>
              <span className="text-slate-400 text-xs">{relativeDate(t.creadoEn)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
