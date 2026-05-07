import { useState, useEffect, FormEvent } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { PhoneCall, Eye, EyeOff, CheckCircle2, Loader2, AlertCircle, XCircle } from 'lucide-react'
import { authApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'

// Decode JWT payload without verifying (verification happens on the server)
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1]
    if (!base64) return null
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  sub_admin: 'Sub Admin',
  supervisor: 'Supervisor',
  agent: 'Agente',
}

export default function AceptarInvitacionPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()

  const token = searchParams.get('token') ?? ''

  const [nombre, setNombre] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Decode token to show context to the user
  const payload = token ? decodeJwtPayload(token) : null
  const invitedEmail = payload?.email as string | undefined
  const invitedRole = payload?.role as string | undefined
  const exp = payload?.exp as number | undefined
  const isExpired = exp ? Date.now() / 1000 > exp : false

  useEffect(() => {
    if (!token) {
      setError('No se encontró el token de invitación en la URL.')
    }
  }, [token])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!nombre.trim()) { setError('Ingresa tu nombre completo.'); return }
    if (password.length < 8 || !/\d/.test(password)) {
      setError('La contraseña debe tener al menos 8 caracteres y un número.')
      return
    }

    setLoading(true)
    try {
      const { data } = await authApi.aceptarInvitacion({ token, nombre, password })
      login(data.data.token, data.data.user)
      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al aceptar la invitación.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <PhoneCall size={20} className="text-white" />
            </div>
            <span className="font-extrabold text-slate-800 text-xl">CallCenter IA</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">

          {/* No token */}
          {!token && (
            <div className="text-center py-6">
              <XCircle size={40} className="text-red-400 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-slate-800 mb-2">Link inválido</h2>
              <p className="text-slate-500 text-sm">Este link de invitación no es válido o está incompleto.</p>
              <Link to="/" className="mt-4 inline-block text-blue-600 text-sm font-medium hover:underline">
                Volver al inicio
              </Link>
            </div>
          )}

          {/* Expired token */}
          {token && isExpired && (
            <div className="text-center py-6">
              <XCircle size={40} className="text-amber-400 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-slate-800 mb-2">Invitación expirada</h2>
              <p className="text-slate-500 text-sm">
                Este link de invitación expiró. Pide a tu administrador que genere uno nuevo.
              </p>
              <Link to="/login" className="mt-4 inline-block text-blue-600 text-sm font-medium hover:underline">
                Ir al login
              </Link>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="text-center py-6">
              <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-slate-800 mb-2">¡Cuenta creada!</h2>
              <p className="text-slate-500 text-sm">Redirigiendo a tu panel...</p>
              <Loader2 size={20} className="animate-spin text-blue-600 mx-auto mt-3" />
            </div>
          )}

          {/* Form */}
          {token && !isExpired && !success && (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-slate-800 mb-1">Acepta tu invitación</h1>
                <p className="text-slate-500 text-sm">Crea tu cuenta para acceder a la plataforma.</p>
              </div>

              {/* Invitation context */}
              {invitedEmail && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5">
                  <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">
                    Invitación para
                  </p>
                  <p className="text-sm font-semibold text-slate-800">{invitedEmail}</p>
                  {invitedRole && (
                    <span className="inline-block mt-1 text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full">
                      Rol: {roleLabels[invitedRole] ?? invitedRole}
                    </span>
                  )}
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tu nombre completo
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Juan Pérez"
                    autoFocus
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  />
                </div>

                {/* Email — readonly, from token */}
                {invitedEmail && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email corporativo
                    </label>
                    <input
                      type="email"
                      value={invitedEmail}
                      disabled
                      className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-400 bg-slate-50 text-sm cursor-not-allowed"
                    />
                  </div>
                )}

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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

                  {/* Password hints */}
                  <div className="flex gap-4 mt-2">
                    {[
                      { ok: password.length >= 8, label: '8+ caracteres' },
                      { ok: /\d/.test(password), label: '1 número' },
                    ].map(({ ok, label }) => (
                      <div key={label} className={`flex items-center gap-1 text-xs ${ok ? 'text-green-600' : 'text-slate-400'}`}>
                        <CheckCircle2 size={12} />
                        {label}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> Creando cuenta...</>
                  ) : (
                    'Crear mi cuenta'
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}
