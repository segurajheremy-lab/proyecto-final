import { Smile, LayoutDashboard, Users } from 'lucide-react'

const features = [
  {
    accent: 'bg-blue-600',
    icon: Smile,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    title: 'Análisis de Sentimiento IA',
    desc: 'Nuestra IA analiza cada interacción en tiempo real, clasificando el sentimiento del cliente como positivo, neutral o negativo. Recibe alertas automáticas cuando una conversación requiere intervención.',
    bullets: ['Detección en tiempo real', 'Alertas automáticas al supervisor', 'Score de confianza por interacción'],
  },
  {
    accent: 'bg-green-500',
    icon: LayoutDashboard,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
    title: 'Gestión Centralizada',
    desc: 'Un único panel para gestionar clientes, asistencia, interacciones y reportes. Elimina las hojas de cálculo y los sistemas desconectados que ralentizan tu operación.',
    bullets: ['Panel unificado multi-área', 'Reportes exportables a Excel', 'Historial completo de clientes'],
  },
  {
    accent: 'bg-indigo-500',
    icon: Users,
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    title: 'Control de Roles',
    desc: 'Sistema jerárquico de permisos que garantiza que cada persona vea y haga exactamente lo que le corresponde. Desde el super admin hasta el agente de primera línea.',
    bullets: ['6 niveles de acceso', 'Invitaciones por email corporativo', 'Auditoría completa de acciones'],
  },
]

export default function QueOfrecemosSection() {
  return (
    <section className="bg-white py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="max-w-2xl mb-14">
          <span className="inline-block bg-slate-100 text-slate-600 text-xs font-semibold tracking-wider uppercase px-4 py-2 rounded-full mb-5">
            ¿Qué Ofrecemos?
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 leading-tight mb-4">
            Una plataforma completa para mejorar cada aspecto de tu operación
          </h2>
          <p className="text-slate-500 leading-relaxed">
            Desde el primer contacto con el cliente hasta el reporte final del mes, cubrimos
            cada etapa del ciclo operativo de tu call center.
          </p>
        </div>

        {/* 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map(({ accent, icon: Icon, iconBg, iconColor, title, desc, bullets }) => (
            <div key={title} className="rounded-xl border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Top accent bar */}
              <div className={`${accent} h-1.5 w-full`} />
              <div className="p-7">
                <div className={`${iconBg} w-11 h-11 rounded-lg flex items-center justify-center mb-5`}>
                  <Icon size={22} className={iconColor} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-3">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-5">{desc}</p>
                <ul className="space-y-2">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
