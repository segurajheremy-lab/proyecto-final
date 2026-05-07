import { useState, FormEvent } from 'react'
import { X, Eye, EyeOff, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { authApi, type RegistroPayload } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

interface Props {
  onClose: () => void
  initialEmail?: string
}

type Step = 'empresa' | 'owner'

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

export default function RegistroModal({ onClose, initialEmail = '' }: Props) {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('empresa')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<RegistroPayload>({
    nombreEmpresa: '',
    dominio: '',
    slug: '',
    nombreOwner: '',
    email: initialEmail,
    password: '',
  })

  const set = (field: keyof RegistroPayload, value: string) => {
    setForm((f) => {
      const next = { ...f, [field]: value }
      // Auto-generate slug from company name
      if (field === 'nombreEmpresa') next.slug = slugify(value)
      // Auto-extract domain from email
      if (field === 'email' && value.includes('@')) {
        const parts = value.split('@')
        if (parts[1]) next.dominio = parts[1].toLowerCase()
      }
      return next
    })
  }

  const handleNextStep = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.nombreEmpresa || !form.dominio || !form.slug) {
      setError('Completa todos los campos de la empresa.')
      return
    }
    setStep('owner')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.nombreOwner || !form.email || !form.password) {
      setError('Completa todos los campos.')
      return
    }
    if (form.password.length < 8 || !/\d/.test(form.password)) {
      setError('La contraseña debe tener al menos 8 caracteres y un número.')
      return
    }

    const emailDomain = form.email.split('@')[1]?.toLowerCase()
    if (emailDomain !== form.dominio) {
      setError(`El email debe terminar en @${form.dominio}`)
      return
    }

    setLoading(true)
    try {
      const { data } = await authApi.registro(form)
      login(data.data.token, {
        ...data.data.user,
        tenantId: data.data.user.tenantId,
      })
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al registrar. Intenta de nuevo.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex gap-1.5">
              {(['empresa', 'owner'] as Step[]).map((s, i) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all ${
                    step === s ? 'w-8 bg-white' : i < (['empresa', 'owner'] as Step[]).indexOf(step) ? 'w-4 bg-white/60' : 'w-4 bg-white/30'
                  }`}
                />
              ))}
            </div>
            <span className="text-white/70 text-xs">
              Paso {step === 'empresa' ? '1' : '2'} de 2
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">
            {step === 'empresa' ? 'Datos de tu empresa' : 'Tu cuenta de Owner'}
          </h2>
          <p className="text-blue-100 text-sm mt-0.5">
            {step === 'empresa'
              ? 'Configura el espacio de trabajo de tu empresa'
              : 'Crea las credenciales del dueño de la plataforma'}
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {step === 'empresa' ? (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre de la empresa
                </label>
                <input
                  type="text"
                  value={form.nombreEmpresa}
                  onChange={(e) => set('nombreEmpresa', e.target.value)}
                  placeholder="Empresa S.A."
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Dominio corporativo
                  <span className="text-slate-400 font-normal ml-1">(sin @)</span>
                </label>
                <input
                  type="text"
                  value={form.dominio}
                  onChange={(e) => set('dominio', e.target.value.toLowerCase())}
                  placeholder="empresa.com"
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                  required
                />
                <p className="text-xs text-slate-400 mt-1">
                  Solo los emails @{form.dominio || 'tudominio.com'} podrán unirse
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Slug (URL de tu espacio)
                </label>
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                  <span className="bg-slate-50 px-3 py-2.5 text-slate-400 text-sm border-r border-slate-200 shrink-0">
                    callcenter-ia.app/
                  </span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="mi-empresa"
                    className="flex-1 px-3 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none text-sm font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors mt-2"
              >
                Continuar →
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tu nombre completo
                </label>
                <input
                  type="text"
                  value={form.nombreOwner}
                  onChange={(e) => set('nombreOwner', e.target.value)}
                  placeholder="Juan Pérez"
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email corporativo
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder={`owner@${form.dominio || 'empresa.com'}`}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
                <p className="text-xs text-slate-400 mt-1">
                  Debe terminar en @{form.dominio}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    placeholder="Mínimo 8 caracteres y 1 número"
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 pr-10 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Password hints */}
              <div className="flex gap-4 text-xs">
                {[
                  { ok: form.password.length >= 8, label: '8+ caracteres' },
                  { ok: /\d/.test(form.password), label: '1 número' },
                ].map(({ ok, label }) => (
                  <div key={label} className={`flex items-center gap-1 ${ok ? 'text-green-600' : 'text-slate-400'}`}>
                    <CheckCircle2 size={12} />
                    {label}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setStep('empresa')}
                  className="flex-1 border border-slate-200 text-slate-600 font-medium py-3 rounded-xl hover:bg-slate-50 transition-colors text-sm"
                >
                  ← Atrás
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creando...
                    </>
                  ) : (
                    'Crear empresa'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
