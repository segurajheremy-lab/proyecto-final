import { Building2, Brain, ShieldCheck, TrendingUp } from 'lucide-react'

const cards = [
  {
    icon: Building2,
    bg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    title: 'Enfoque empresarial',
    desc: 'Soluciones diseñadas para las necesidades reales de call centers B2B de cualquier tamaño.',
  },
  {
    icon: Brain,
    bg: 'bg-yellow-50',
    iconColor: 'text-yellow-600',
    title: 'IA predictiva',
    desc: 'Algoritmos de análisis de sentimiento que anticipan problemas antes de que escalen.',
  },
  {
    icon: TrendingUp,
    bg: 'bg-green-50',
    iconColor: 'text-green-600',
    title: 'Métricas en tiempo real',
    desc: 'Dashboards actualizados al instante para decisiones ágiles y basadas en datos.',
  },
  {
    icon: ShieldCheck,
    bg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    title: 'Seguridad y cumplimiento',
    desc: 'Arquitectura multi-tenant con aislamiento de datos y cumplimiento GDPR.',
  },
]

export default function QuienesSomosSection() {
  return (
    <section className="bg-white py-20 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        {/* Left */}
        <div>
          <span className="inline-block bg-blue-50 text-blue-600 text-xs font-semibold tracking-wider uppercase px-4 py-2 rounded-full mb-5">
            ¿Quiénes Somos?
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 leading-tight mb-5">
            Expertos en optimización de operaciones de atención al cliente
          </h2>
          <p className="text-slate-500 leading-relaxed mb-4">
            Somos un equipo de ingenieros, analistas de datos y especialistas en experiencia
            del cliente que llevan más de una década transformando la forma en que las empresas
            gestionan sus equipos de soporte.
          </p>
          <p className="text-slate-500 leading-relaxed mb-10">
            Nuestra plataforma nació de la frustración de ver cómo las empresas perdían
            oportunidades por falta de visibilidad en tiempo real. Hoy, ayudamos a cientos
            de organizaciones a tomar mejores decisiones, más rápido.
          </p>

          {/* Metrics */}
          <div className="flex gap-10">
            <div>
              <p className="text-4xl font-extrabold text-blue-600">500+</p>
              <p className="text-slate-500 text-sm mt-1">Empresas confían en nosotros</p>
            </div>
            <div className="border-l border-slate-200 pl-10">
              <p className="text-4xl font-extrabold text-blue-600">98%</p>
              <p className="text-slate-500 text-sm mt-1">Satisfacción del cliente</p>
            </div>
          </div>
        </div>

        {/* Right — 2x2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {cards.map(({ icon: Icon, bg, iconColor, title, desc }) => (
            <div
              key={title}
              className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <div className={`${bg} w-10 h-10 rounded-lg flex items-center justify-center mb-4`}>
                <Icon size={20} className={iconColor} />
              </div>
              <h4 className="font-bold text-slate-800 mb-1">{title}</h4>
              <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
