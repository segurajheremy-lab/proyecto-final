import { useState } from 'react'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import RegistroModal from './RegistroModal'

export default function LeadGenSection() {
  const [email, setEmail] = useState('')
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <section className="bg-white py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 leading-tight mb-4">
              La gestión de clientes y equipos de soporte, potenciada por{' '}
              <span className="text-blue-600">datos reales.</span>
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed">
              Centraliza operaciones, mide el rendimiento de cada agente y toma decisiones
              basadas en métricas en tiempo real. Todo desde una sola plataforma.
            </p>
          </div>

          {/* Right — Card */}
          <div className="bg-white border border-slate-100 shadow-xl rounded-2xl p-8">
            <h3 className="text-xl font-bold text-slate-800 mb-1">Comienza hoy mismo</h3>
            <p className="text-slate-500 text-sm mb-6">
              Configura tu empresa en menos de 5 minutos.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Correo corporativo
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <button
                onClick={() => setShowModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-colors shadow-md shadow-blue-600/20"
              >
                Comenzar gratis
                <ArrowRight size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-2">
              {['Sin tarjeta de crédito', '14 días gratis'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {showModal && (
        <RegistroModal
          initialEmail={email}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
