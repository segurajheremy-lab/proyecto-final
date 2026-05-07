import { useState } from 'react'
import { UserPlus, Mail, Loader2, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react'
import { authApi } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

type InvitableRole = 'admin' | 'sub_admin' | 'supervisor' | 'agent'

const roleOptions: { value: InvitableRole; label: string; desc: string }[] = [
  { value: 'admin', label: 'Admin', desc: 'Gestiona todo el personal de la empresa' },
  { value: 'sub_admin', label: 'Sub Admin', desc: 'Líder de área, gestiona supervisores y agentes' },
  { value: 'supervisor', label: 'Supervisor', desc: 'Supervisa agentes y gestiona clientes' },
  { value: 'agent', label: 'Agente', desc: 'Marca asistencia y registra interacciones' },
]

const roleColors: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  sub_admin: 'bg-indigo-100 text-indigo-700',
  supervisor: 'bg-green-100 text-green-700',
  agent: 'bg-slate-100 text-slate-700',
}

interface InvitationResult {
  link: string
  token: string
  email: string
  role: string
}

export default function EquipoPage() {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<InvitableRole>('admin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<InvitationResult | null>(null)
  const [copied, setCopied] = useState(false)

  const handleInvitar = async () => {
    setError('')
    if (!email) { setError('Ingresa un email.'); return }
    if (!email.includes('@')) { setError('Email inválido.'); return }

    setLoading(true)
    try {
      const { data } = await authApi.invitar({ email, role })
      setResult({ ...data.data, email, role })
      setEmail('')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al generar la invitación.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    if (!result) return
    // result.link already contains the full URL from the backend
    navigator.clipboard.writeText(result.link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Roles que el owner puede invitar
  const availableRoles = roleOptions.filter((r) => {
    if (user?.role === 'owner') return true
    if (user?.role === 'admin') return ['sub_admin', 'supervisor', 'agent'].includes(r.value)
    if (user?.role === 'sub_admin') return ['supervisor', 'agent'].includes(r.value)
    return false
  })

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Gestión de Equipo</h1>
        <p className="text-slate-500 mt-1">
          Invita usuarios a tu empresa. Solo pueden unirse con emails @{user?.role === 'owner' ? 'tu dominio corporativo' : 'tu dominio'}.
        </p>
      </div>

      {/* Invite form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-5">
          <UserPlus size={18} className="text-blue-600" />
          Invitar nuevo usuario
        </h2>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
            <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
              <CheckCircle2 size={16} />
              Invitación generada para {result.email}
            </div>
            <p className="text-green-600 text-xs mb-3">
              Comparte este link. Expira en 48 horas.
            </p>
            <div className="flex items-center gap-2 bg-white border border-green-200 rounded-lg px-3 py-2">
              <code className="flex-1 text-xs text-slate-600 truncate">
                {result.link}
              </code>
              <button
                onClick={copyLink}
                className="shrink-0 text-green-600 hover:text-green-800 transition-colors"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Role selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Rol a asignar</label>
            <div className="grid grid-cols-2 gap-2">
              {availableRoles.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  className={`text-left p-3 rounded-xl border-2 transition-all ${
                    role === value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${roleColors[value]}`}>
                      {label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email corporativo del invitado
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvitar()}
                  placeholder="usuario@empresa.com"
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <button
                onClick={handleInvitar}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 shrink-0"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                Invitar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hierarchy info */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-700 text-sm mb-3">Jerarquía de roles</h3>
        <div className="space-y-2">
          {[
            { role: 'owner', label: 'Owner (tú)', desc: 'Dueño de la empresa. Crea Admins.' },
            { role: 'admin', label: 'Admin', desc: 'Gestiona todo el personal.' },
            { role: 'sub_admin', label: 'Sub Admin', desc: 'Líder de área.' },
            { role: 'supervisor', label: 'Supervisor', desc: 'Supervisa agentes.' },
            { role: 'agent', label: 'Agente', desc: 'Atención al cliente.' },
          ].map(({ role: r, label, desc }, i) => (
            <div key={r} className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: i }).map((_, j) => (
                  <div key={j} className="w-3 h-px bg-slate-300" />
                ))}
                {i > 0 && <div className="w-2 h-2 rounded-full border-2 border-slate-300" />}
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${roleColors[r]}`}>{label}</span>
              <span className="text-xs text-slate-500">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
