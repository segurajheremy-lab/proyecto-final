import { BarChart3 } from 'lucide-react'

export default function ImpactBanner() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-blue-800 rounded-2xl px-10 py-12 relative overflow-hidden">
          {/* Decorative large icon */}
          <BarChart3
            size={180}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-white/10"
            strokeWidth={1}
          />

          <div className="relative z-10 max-w-lg">
            <span className="inline-block w-8 h-1 bg-blue-400 rounded mb-5" />
            <h3 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-4">
              Reduce hasta{' '}
              <span className="text-blue-300">60%</span>{' '}
              el tiempo de respuesta
            </h3>
            <p className="text-blue-200 leading-relaxed mb-8">
              Las empresas que implementan nuestra plataforma reportan una reducción
              significativa en tiempos de espera y un aumento del 40% en la resolución
              en el primer contacto.
            </p>
            <button className="bg-white text-blue-800 font-bold px-7 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-lg">
              Ver casos de éxito
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
