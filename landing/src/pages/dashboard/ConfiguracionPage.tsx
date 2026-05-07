import { Settings, Bell, Shield, Key } from 'lucide-react'

export default function ConfiguracionPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Configuración</h1>
        <p className="text-slate-500 mt-1">Ajustes generales de tu cuenta y empresa.</p>
      </div>

      {[
        {
          icon: Bell,
          title: 'Notificaciones',
          items: [
            { label: 'Alertas de sentimiento negativo', desc: 'Recibe un email cuando un agente tenga interacciones negativas' },
            { label: 'Resumen diario', desc: 'Email con el resumen de operaciones del día' },
            { label: 'Nuevos usuarios', desc: 'Notificación cuando alguien acepta una invitación' },
          ],
        },
        {
          icon: Shield,
          title: 'Seguridad',
          items: [
            { label: 'Autenticación de dos factores', desc: 'Añade una capa extra de seguridad a tu cuenta' },
            { label: 'Sesiones activas', desc: 'Gestiona los dispositivos con sesión iniciada' },
          ],
        },
        {
          icon: Key,
          title: 'API & Integraciones',
          items: [
            { label: 'API Key', desc: 'Genera una clave para integrar con sistemas externos' },
            { label: 'Webhooks', desc: 'Recibe eventos en tiempo real en tu servidor' },
          ],
        },
      ].map(({ icon: Icon, title, items }) => (
        <div key={title} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-5">
            <Icon size={18} className="text-blue-600" />
            {title}
          </h2>
          <div className="space-y-4">
            {items.map(({ label, desc }) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                </label>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-5">
          <Settings size={18} className="text-blue-600" />
          Tolerancia de tardanza
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-700">Minutos de tolerancia por defecto</p>
            <p className="text-xs text-slate-400 mt-0.5">Se aplica a todos los agentes que no tengan configuración individual</p>
          </div>
          <input
            type="number"
            defaultValue={10}
            min={0}
            max={60}
            className="w-20 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-center font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  )
}
