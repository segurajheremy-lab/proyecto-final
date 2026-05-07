import { useState, useEffect } from 'react'
import {
  Building2, Globe, Hash, Palette,
  CheckCircle2, Loader2, AlertCircle, RefreshCw,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'

interface TenantData {
  _id: string
  nombre: string
  dominio: string
  slug: string
  logo?: string
  colores: { primario: string; secundario: string }
  plan: string
  status: string
  trialExpira: string
  agentesLimit: number
}

const PLAN_LABELS: Record<string, string> = {
  trial: 'Trial',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

export default function EmpresaPage() {
  const { user } = useAuth()

  // Remote state
  const [tenant, setTenant] = useState<TenantData | null>(null)
  const [loadingTenant, setLoadingTenant] = useState(true)
  const [loadError, setLoadError] = useState('')

  // Form state (controlled)
  const [nombre, setNombre] = useState('')
  const [agentesLimit, setAgentesLimit] = useState(10)
  const [colores, setColores] = useState({ primario: '#3B82F6', secundario: '#1E293B' })

  // Save state
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Load tenant on mount
  useEffect(() => {
    const load = async () => {
      setLoadingTenant(true)
      setLoadError('')
      try {
        const { data } = await api.get<{ success: boolean; data: TenantData }>('/tenants/mio')
        const t = data.data
        setTenant(t)
        setNombre(t.nombre)
        setAgentesLimit(t.agentesLimit)
        setColores(t.colores)
      } catch {
        setLoadError('No se pudo cargar la información de la empresa.')
      } finally {
        setLoadingTenant(false)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    setSaveError('')
    try {
      const { data } = await api.patch<{ success: boolean; data: TenantData }>('/tenants/mio', {
        nombre,
        agentesLimit,
        colores,
      })
      setTenant(data.data)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al guardar los cambios.'
      setSaveError(msg)
    } finally {
      setSaving(false)
    }
  }

  // Days remaining in trial
  const trialDaysLeft = tenant
    ? Math.max(0, Math.ceil((new Date(tenant.trialExpira).getTime() - Date.now()) / 86400000))
    : 0

  if (loadingTenant) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-blue-600" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700">{loadError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 flex items-center gap-1.5 text-sm text-red-600 hover:underline"
            >
              <RefreshCw size={14} /> Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Mi Empresa</h1>
        <p className="text-slate-500 mt-1">Configura la información y apariencia de tu espacio.</p>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <Building2 size={18} className="text-blue-600" />
          Información de la empresa
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nombre — editable */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre de la empresa
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Dominio — readonly */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
              <Globe size={13} />
              Dominio corporativo
            </label>
            <input
              type="text"
              value={tenant?.dominio ?? ''}
              disabled
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-400 bg-slate-50 text-sm cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">El dominio no se puede cambiar</p>
          </div>

          {/* Slug — readonly */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
              <Hash size={13} />
              Slug (URL)
            </label>
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
              <span className="px-3 py-2.5 text-slate-400 text-xs border-r border-slate-200 shrink-0">
                callcenter-ia.app/
              </span>
              <input
                type="text"
                value={tenant?.slug ?? ''}
                disabled
                className="flex-1 px-3 py-2.5 text-slate-400 text-sm cursor-not-allowed bg-slate-50"
              />
            </div>
          </div>

          {/* Límite de agentes — editable */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Límite de agentes
            </label>
            <input
              type="number"
              min={1}
              max={500}
              value={agentesLimit}
              onChange={(e) => setAgentesLimit(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">Máximo de agentes activos simultáneos</p>
          </div>
        </div>
      </div>

      {/* Colors */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <Palette size={18} className="text-indigo-600" />
          Colores de marca
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {([
            { key: 'primario' as const, label: 'Color primario' },
            { key: 'secundario' as const, label: 'Color secundario' },
          ]).map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colores[key]}
                  onChange={(e) => setColores((c) => ({ ...c, [key]: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={colores[key]}
                  onChange={(e) => setColores((c) => ({ ...c, [key]: e.target.value }))}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Live preview */}
        <div className="rounded-xl overflow-hidden border border-slate-200">
          <div className="h-10 flex items-center px-4 gap-2" style={{ backgroundColor: colores.secundario }}>
            <div className="w-4 h-4 rounded" style={{ backgroundColor: colores.primario }} />
            <span className="text-white text-xs font-medium">Vista previa del navbar</span>
          </div>
          <div className="bg-white p-4 flex gap-2">
            <button className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: colores.primario }}>
              Botón primario
            </button>
            <button className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: colores.secundario }}>
              Botón secundario
            </button>
          </div>
        </div>
      </div>

      {/* Plan info */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-blue-100 text-sm font-medium mb-1">Plan actual</p>
            <p className="text-2xl font-extrabold">{PLAN_LABELS[tenant?.plan ?? 'trial']}</p>
            {tenant?.plan === 'trial' && (
              <p className="text-blue-200 text-sm mt-1">
                {trialDaysLeft} días restantes · Hasta {agentesLimit} agentes
              </p>
            )}
            {tenant?.plan !== 'trial' && (
              <p className="text-blue-200 text-sm mt-1">Hasta {agentesLimit} agentes</p>
            )}
          </div>
          {tenant?.plan === 'trial' && (
            <button className="bg-white text-blue-700 font-bold px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors text-sm shrink-0">
              Actualizar plan
            </button>
          )}
        </div>
      </div>

      {/* Save feedback */}
      {saveError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          {saveError}
        </div>
      )}

      {/* Save button */}
      <div className="flex items-center justify-end gap-3">
        {saved && (
          <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
            <CheckCircle2 size={16} />
            Cambios guardados
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : null}
          Guardar cambios
        </button>
      </div>

      {/* Owner info */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Tu cuenta de Owner</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
            {user?.nombre?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{user?.nombre}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
          <span className="ml-auto text-xs font-bold bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full">
            Owner
          </span>
        </div>
      </div>
    </div>
  )
}
