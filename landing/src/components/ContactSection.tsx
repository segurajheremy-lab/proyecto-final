import { useState, FormEvent } from 'react'
import { Clock, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

const workerOptions = [
  '1 – 10 trabajadores',
  '11 – 50 trabajadores',
  '51 – 200 trabajadores',
  '201 – 500 trabajadores',
  '500+ trabajadores',
]

const countryOptions = [
  { code: '+51', flag: '🇵🇪', label: 'PE' },
  { code: '+52', flag: '🇲🇽', label: 'MX' },
  { code: '+57', flag: '🇨🇴', label: 'CO' },
  { code: '+54', flag: '🇦🇷', label: 'AR' },
  { code: '+56', flag: '🇨🇱', label: 'CL' },
  { code: '+34', flag: '🇪🇸', label: 'ES' },
]

interface DemoForm {
  nombre: string
  apellido: string
  email: string
  empresa: string
  codigoPais: string
  telefono: string
  trabajadores: string
}

const EMPTY: DemoForm = {
  nombre: '',
  apellido: '',
  email: '',
  empresa: '',
  codigoPais: '+51',
  telefono: '',
  trabajadores: '',
}

export default function ContactSection() {
  const [form, setForm] = useState<DemoForm>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const set = (field: keyof DemoForm, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const validate = (): string => {
    if (!form.nombre.trim()) return 'El nombre es requerido.'
    if (!form.apellido.trim()) return 'El apellido es requerido.'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return 'Ingresa un correo electrónico válido.'
    if (!form.empresa.trim()) return 'El nombre de empresa es requerido.'
    if (!form.telefono.trim() || !/^\d{7,15}$/.test(form.telefono.replace(/\s/g, '')))
      return 'Ingresa un número de teléfono válido.'
    if (!form.trabajadores) return 'Selecciona el número de trabajadores.'
    return ''
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      // Simula envío — aquí conectarías con tu API de CRM o email
      await new Promise((r) => setTimeout(r, 1200))
      setSuccess(true)
      setForm(EMPTY)
    } catch {
      setError('Hubo un error al enviar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-slate-900 py-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
            Contacta a nuestro equipo de ventas
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto">
            Cuéntanos sobre tu operación y te mostraremos cómo podemos ayudarte.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Left — image */}
          <div className="relative rounded-2xl overflow-hidden h-80 lg:h-full min-h-[400px]">
            <img
              src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80"
              alt="Agente de call center"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
            <div className="absolute bottom-5 right-5 bg-white rounded-xl px-4 py-3 shadow-xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                <Clock size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Tiempo promedio de respuesta</p>
                <p className="font-extrabold text-slate-800 text-sm">&lt; 30 segundos</p>
              </div>
            </div>
          </div>

          {/* Right — form */}
          <div className="bg-white rounded-2xl p-8 shadow-2xl">

            {/* Success state */}
            {success ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} className="text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">¡Solicitud enviada!</h3>
                <p className="text-slate-500 text-sm mb-6">
                  Nuestro equipo se pondrá en contacto contigo en menos de 30 minutos.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="text-blue-600 text-sm font-medium hover:underline"
                >
                  Enviar otra solicitud
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <h3 className="text-xl font-bold text-slate-800 mb-6">Solicitar una demo</h3>

                {/* Error banner */}
                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                {/* Nombre + Apellido */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.nombre}
                      onChange={(e) => set('nombre', e.target.value)}
                      placeholder="Juan"
                      className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Apellido <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.apellido}
                      onChange={(e) => set('apellido', e.target.value)}
                      placeholder="Pérez"
                      className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Correo Electrónico <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="juan@empresa.com"
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                {/* Empresa */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nombre de Empresa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.empresa}
                    onChange={(e) => set('empresa', e.target.value)}
                    placeholder="Empresa S.A."
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                {/* Teléfono */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={form.codigoPais}
                      onChange={(e) => set('codigoPais', e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                    >
                      {countryOptions.map(({ code, flag, label }) => (
                        <option key={code} value={code}>
                          {flag} {label} {code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={form.telefono}
                      onChange={(e) => set('telefono', e.target.value.replace(/[^\d\s]/g, ''))}
                      placeholder="987 654 321"
                      className="flex-1 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* Trabajadores */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Número de trabajadores <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.trabajadores}
                    onChange={(e) => set('trabajadores', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  >
                    <option value="">Selecciona un rango</option>
                    {workerOptions.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Solicitar Demo'
                  )}
                </button>

                <p className="text-xs text-slate-400 text-center mt-4 leading-relaxed">
                  Al enviar este formulario aceptas nuestra{' '}
                  <a href="#" className="underline hover:text-slate-600">Política de Privacidad</a>.
                  No compartimos tu información con terceros.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
