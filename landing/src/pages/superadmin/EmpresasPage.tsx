import { useState, useEffect, useCallback, useRef, FormEvent } from 'react'
import {
  Search, ChevronLeft, ChevronRight, Loader2,
  AlertCircle, X, CheckCircle2, Eye, EyeOff,
  Building2, Users, Phone, TrendingUp,
} from 'lucide-react'
import { api } from '../../lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Tenant {
  _id: string
  nombre: string
  dominio: string
  logo?: string
  plan: 'trial' | 'starter' | 'pro' | 'enterprise'
  status: 'active' | 'suspended' | 'trial'
  agentesLimit: number
  creadoEn: string
  trialExpira: string
  estadisticas?: {
    totalUsers: number
    totalAgentes: number
    totalClientes: number
    totalInteracciones: number
  }
}

type StatusFiltro = '' | 'active' | 'suspended' | 'trial'
type PlanFiltro   = '' | 'trial' | 'starter' | 'pro' | 'enterprise'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLAN_BADGE: Record<string, string> = {
  trial:      'bg-slate-700 text-slate-300 border-slate-600',
  starter:    'bg-blue-900/40 text-blue-400 border-blue-700/40',
  pro:        'bg-purple-900/40 text-purple-400 border-purple-700/40',
  enterprise: 'bg-amber-900/40 text-amber-400 border-amber-700/40',
}

const STATUS_BADGE: Record<string, string> = {
  active:    'bg-green-900/40 text-green-400 border-green-700/40',
  trial:     'bg-amber-900/40 text-amber-400 border-amber-700/40',
  suspended: 'bg-red-900/40 text-red-400 border-red-700/40',
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Activa', trial: 'Trial', suspended: 'Suspendida',
}

const PLAN_LABEL: Record<string, string> = {
  trial: 'Trial', starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeDate(dateStr: string): string {
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (d === 0) return 'hoy'
  if (d === 1) return 'ayer'
  if (d < 30) return `hace ${d} días`
  return new Date(dateStr).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
}

function trialDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 'N/A'
  return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ---------------------------------------------------------------------------
// Reset password modal
// ---------------------------------------------------------------------------

function ResetPasswordModal({ tenantId, onClose }: { tenantId: string; onClose: () => void }) {
  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (pass.length < 8) { setError('Mínimo 8 caracteres.'); return }
    if (pass !== confirm) { setError('Las contraseñas no coinciden.'); return }
    setError('')
    setLoading(true)
    try {
      await api.post(`/superadmin/tenants/${tenantId}/reset-owner-password`, { nuevaPassword: pass })
      setDone(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Error al resetear la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700">
          <h3 className="text-white font-semibold">Resetear contraseña del Owner</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-6">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 size={40} className="text-green-400" />
              <p className="text-white font-semibold">Contraseña actualizada correctamente</p>
              <button onClick={onClose} className="text-blue-400 text-sm hover:underline">Cerrar</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1">Nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={pass}
                    onChange={e => setPass(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm pr-10"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1">Confirmar contraseña</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 border border-slate-600 text-slate-300 py-2.5 rounded-xl text-sm hover:bg-slate-700 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                  Resetear
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
// Side panel
// ---------------------------------------------------------------------------

function GestionPanel({ tenant, onClose, onUpdated }: {
  tenant: Tenant
  onClose: () => void
  onUpdated: () => void
}) {
  const [status, setStatus] = useState(tenant.status)
  const [plan, setPlan] = useState(tenant.plan)
  const [agentesLimit, setAgentesLimit] = useState(tenant.agentesLimit)
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [successStatus, setSuccessStatus] = useState(false)
  const [successPlan, setSuccessPlan] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [detail, setDetail] = useState<Tenant | null>(null)

  useEffect(() => {
    api.get<{ success: boolean; data: Tenant }>(`/superadmin/tenants/${tenant._id}`)
      .then(res => setDetail(res.data.data))
      .catch(() => {})
  }, [tenant._id])

  const updateStatus = async () => {
    setLoadingStatus(true)
    try {
      await api.patch(`/superadmin/tenants/${tenant._id}/status`, { status })
      setSuccessStatus(true)
      setTimeout(() => setSuccessStatus(false), 2500)
      onUpdated()
    } catch { /* silently fail */ } finally { setLoadingStatus(false) }
  }

  const updatePlan = async () => {
    setLoadingPlan(true)
    try {
      await api.patch(`/superadmin/tenants/${tenant._id}/plan`, { plan, agentesLimit })
      setSuccessPlan(true)
      setTimeout(() => setSuccessPlan(false), 2500)
      onUpdated()
    } catch { /* silently fail */ } finally { setLoadingPlan(false) }
  }

  const stats = detail?.estadisticas

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <div>
            <h2 className="text-white font-bold text-lg">{tenant.nombre}</h2>
            <p className="text-slate-400 text-sm">{tenant.dominio}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6">
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Users,     label: 'Usuarios',      value: stats.totalUsers },
                { icon: Phone,     label: 'Agentes',       value: stats.totalAgentes },
                { icon: Building2, label: 'Clientes',      value: stats.totalClientes },
                { icon: TrendingUp,label: 'Interacciones', value: stats.totalInteracciones },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex items-center gap-3">
                  <Icon size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="text-white font-bold text-lg leading-none">{value}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Change status */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-3">
            <h3 className="text-white font-semibold text-sm">Cambiar Status</h3>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as typeof status)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="active">Activo</option>
              <option value="trial">Trial</option>
              <option value="suspended">Suspendido</option>
            </select>
            <button
              onClick={updateStatus}
              disabled={loadingStatus}
              className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
            >
              {loadingStatus ? <Loader2 size={14} className="animate-spin" /> : null}
              {successStatus ? '✅ Actualizado' : 'Actualizar status'}
            </button>
          </div>

          {/* Change plan */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-3">
            <h3 className="text-white font-semibold text-sm">Cambiar Plan</h3>
            <select
              value={plan}
              onChange={e => setPlan(e.target.value as typeof plan)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="trial">Trial</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Límite de agentes</label>
              <input
                type="number"
                min={1}
                max={10000}
                value={agentesLimit}
                onChange={e => setAgentesLimit(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <button
              onClick={updatePlan}
              disabled={loadingPlan}
              className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
            >
              {loadingPlan ? <Loader2 size={14} className="animate-spin" /> : null}
              {successPlan ? '✅ Actualizado' : 'Actualizar plan'}
            </button>
          </div>

          {/* Support */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-3">
            <h3 className="text-white font-semibold text-sm">Soporte</h3>
            <button
              onClick={() => setShowResetModal(true)}
              className="w-full border border-red-700/50 text-red-400 hover:bg-red-900/20 font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              🔑 Resetear contraseña del Owner
            </button>
          </div>
        </div>
      </div>

      {showResetModal && (
        <ResetPasswordModal tenantId={tenant._id} onClose={() => setShowResetModal(false)} />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function EmpresasPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [busqueda, setBusqueda] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>('')
  const [planFiltro, setPlanFiltro] = useState<PlanFiltro>('')

  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadTenants = useCallback(async (page: number, search: string, status: string, plan: string) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.set('pagina', String(page))
      params.set('limite', '20')
      if (search) params.set('busqueda', search)
      if (status) params.set('status', status)
      if (plan)   params.set('plan', plan)

      const { data } = await api.get<{
        success: boolean
        data: { tenants: Tenant[]; total: number; pagina: number; totalPaginas: number }
      }>(`/superadmin/tenants?${params.toString()}`)

      setTenants(data.data.tenants)
      setTotal(data.data.total)
      setPagina(data.data.pagina)
      setTotalPaginas(data.data.totalPaginas)
    } catch {
      setError('No se pudieron cargar las empresas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadTenants(1, '', '', '') }, [loadTenants])

  const handleSearch = (v: string) => {
    setBusqueda(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => loadTenants(1, v, statusFiltro, planFiltro), 300)
  }

  const handleStatus = (v: StatusFiltro) => { setStatusFiltro(v); loadTenants(1, busqueda, v, planFiltro) }
  const handlePlan   = (v: PlanFiltro)   => { setPlanFiltro(v);   loadTenants(1, busqueda, statusFiltro, v) }
  const handlePage   = (p: number)       => { setPagina(p);       loadTenants(p, busqueda, statusFiltro, planFiltro) }

  const STATUS_CHIPS: { value: StatusFiltro; label: string }[] = [
    { value: '', label: 'Todas' },
    { value: 'active', label: 'Activas' },
    { value: 'trial', label: 'Trial' },
    { value: 'suspended', label: 'Suspendidas' },
  ]

  const PLAN_CHIPS: { value: PlanFiltro; label: string }[] = [
    { value: '', label: 'Todos' },
    { value: 'trial', label: 'Trial' },
    { value: 'starter', label: 'Starter' },
    { value: 'pro', label: 'Pro' },
    { value: 'enterprise', label: 'Enterprise' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">
            Empresas registradas
            {total > 0 && <span className="ml-2 text-base font-normal text-slate-400">({total})</span>}
          </h1>
        </div>
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Buscar por nombre o dominio..."
            className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 w-64"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          {STATUS_CHIPS.map(({ value, label }) => (
            <button key={value} onClick={() => handleStatus(value)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                statusFiltro === value
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-red-600/50'
              }`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">Plan:</span>
          {PLAN_CHIPS.map(({ value, label }) => (
            <button key={value} onClick={() => handlePlan(value)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                planFiltro === value
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-red-600/50'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin text-red-500" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-red-400 text-sm p-6">
            <AlertCircle size={16} /> {error}
          </div>
        ) : tenants.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">No se encontraron empresas.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/50">
                  {['Empresa', 'Plan', 'Status', 'Agentes', 'Creada', 'Trial expira', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {tenants.map(t => (
                  <tr key={t._id} className="hover:bg-slate-700/30 transition-colors">
                    {/* Empresa */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {t.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-semibold truncate">{t.nombre}</p>
                          <p className="text-slate-400 text-xs truncate">{t.dominio}</p>
                        </div>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${PLAN_BADGE[t.plan]}`}>
                        {PLAN_LABEL[t.plan]}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_BADGE[t.status]}`}>
                        {STATUS_LABEL[t.status]}
                      </span>
                    </td>

                    {/* Agentes */}
                    <td className="px-5 py-4 text-slate-300 text-xs">
                      — / {t.agentesLimit}
                    </td>

                    {/* Creada */}
                    <td className="px-5 py-4 text-slate-400 text-xs whitespace-nowrap">
                      {relativeDate(t.creadoEn)}
                    </td>

                    {/* Trial expira */}
                    <td className="px-5 py-4 text-slate-400 text-xs whitespace-nowrap">
                      {t.status === 'trial' ? trialDate(t.trialExpira) : 'N/A'}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setSelectedTenant(t)}
                        className="flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-300 border border-red-700/40 hover:border-red-500/60 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Eye size={13} /> Gestionar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPaginas > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700">
            <p className="text-xs text-slate-500">Página {pagina} de {totalPaginas} · {total} empresas</p>
            <div className="flex gap-2">
              <button onClick={() => handlePage(pagina - 1)} disabled={pagina <= 1}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-400 border border-slate-700 rounded-lg hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft size={13} /> Anterior
              </button>
              <button onClick={() => handlePage(pagina + 1)} disabled={pagina >= totalPaginas}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-400 border border-slate-700 rounded-lg hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Siguiente <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Side panel */}
      {selectedTenant && (
        <GestionPanel
          tenant={selectedTenant}
          onClose={() => setSelectedTenant(null)}
          onUpdated={() => loadTenants(pagina, busqueda, statusFiltro, planFiltro)}
        />
      )}
    </div>
  )
}
