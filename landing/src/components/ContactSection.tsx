import { Clock } from 'lucide-react'

const workerOptions = [
  '1 – 10 trabajadores',
  '11 – 50 trabajadores',
  '51 – 200 trabajadores',
  '201 – 500 trabajadores',
  '500+ trabajadores',
]

export default function ContactSection() {
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

            {/* Response time badge */}
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
            <h3 className="text-xl font-bold text-slate-800 mb-6">Solicitar una demo</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  placeholder="Juan"
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Apellido</label>
                <input
                  type="text"
                  placeholder="Pérez"
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
              <input
                type="email"
                placeholder="juan@empresa.com"
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de Empresa</label>
              <input
                type="text"
                placeholder="Empresa S.A."
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
              <div className="flex gap-2">
                <select className="border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                  <option>🇵🇪 +51</option>
                  <option>🇲🇽 +52</option>
                  <option>🇨🇴 +57</option>
                  <option>🇦🇷 +54</option>
                  <option>🇨🇱 +56</option>
                  <option>🇪🇸 +34</option>
                </select>
                <input
                  type="tel"
                  placeholder="987 654 321"
                  className="flex-1 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">Número de trabajadores</label>
              <select className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                <option value="">Selecciona un rango</option>
                {workerOptions.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>

            <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-colors shadow-lg">
              Solicitar Demo
            </button>

            <p className="text-xs text-slate-400 text-center mt-4 leading-relaxed">
              Al enviar este formulario aceptas nuestra{' '}
              <a href="#" className="underline hover:text-slate-600">Política de Privacidad</a>.
              No compartimos tu información con terceros.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
