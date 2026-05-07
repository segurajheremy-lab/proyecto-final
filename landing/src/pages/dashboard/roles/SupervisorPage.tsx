import { useState } from 'react'
import {
  Users, UserCheck, Smile, Frown, Meh,
  Clock, Phone, MoreVertical, Plus,
  TrendingUp, AlertTriangle,
} from 'lucide-react'

const mockAgents = [
  { id: '1', nombre: 'Luis Ríos', email: 'luis@empresa.com', clientes: 12, interacciones: 8, sentimiento: 'positivo', asistencia: 'Presente' },
  { id: '2', nombre: 'Carla Díaz', email: 'carla@empresa.com', clientes: 9, interacciones: 5, sentimiento: 'neutral', asistencia: 'Tardanza' },
  { id: '3', nombre: 'Jorge Paz', email: 'jorge@empresa.com', clientes: 15, interacciones: 11, sentimiento: 'negativo', asistencia: 'Presente' },
]

const mockClients = [
  { id: '1', nombre: 'Empresa ABC', telefono: '+51 987 654 321', estado: 'activo', agente: 'Luis Ríos', ultimaInteraccion: 'Hace 2h' },
  { id: '2', nombre: 'Corporación XYZ', telefono: '+51 912 345 678', estado: 'pendiente', agente: 'Carla Díaz', ultimaInteraccion: 'Hace 5h' },
  { id: '3', nombre: 'Grupo Delta', telefono: '+51 956 789 012', estado: 'resuelto', agente: 'Jorge Paz', ultimaInteraccion: 'Ayer' },
]

const sentimientoIcon = {
  positivo: <Smile size={16} className="text-green-500" />,
  neutral: <Meh size={16} className="text-blue-400" />,
  negativo: <Frown size={16} className="text-red-500" />,
}

const estadoColors: Record<string, string> = {
  activo: 'bg-green-100 text-green-700',
  pendiente: 'bg-amber-100 text-amber-700',
  resuelto: 'bg-slate-100 text-slate-600',
  inactivo: 'bg-red-100 text-red-700',
}

export default function SupervisorPage() {
  const [tab, setTab] = useState<'agentes' | 'clientes' | 'alertas'>('agentes')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Panel Supervisor</h1>
          <p className="text-slate-500 mt-1">Supervisa tu equipo y gestiona clientes asignados.</p>
        </div>
        <button className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
          <Plus size={16} />
          Nuevo cliente
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Agentes activos', value: '3/3', color: 'bg-green-50 text-green-600' },
          { icon: Phone, label: 'Clientes asignados', value: '36', color: 'bg-blue-50 text-blue-600' },
          { icon: TrendingUp, label: 'Interacciones hoy', value: '24', color: 'bg-purple-50 text-purple-600' },
          { icon: AlertTriangle, label: 'Alertas activas', value: '1', color: 'bg-amber-50 text-amber-600' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{value}</p>
            <p className="text-sm font-medium text-slate-700 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100">
          {(['agentes', 'clientes', 'alertas'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3.5 text-sm font-semibold capitalize transition-colors ${
                tab === t
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Agentes */}
          {tab === 'agentes' && (
            <div className="space-y-3">
              {mockAgents.map((a) => (
                <div key={a.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                    {a.nombre.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800">{a.nombre}</p>
                    <p className="text-xs text-slate-400">{a.email}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-center">
                    <div>
                      <p className="font-bold text-slate-800">{a.clientes}</p>
                      <p className="text-xs text-slate-400">clientes</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{a.interacciones}</p>
                      <p className="text-xs text-slate-400">interacciones</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {sentimientoIcon[a.sentimiento as keyof typeof sentimientoIcon]}
                    <span className="text-xs text-slate-500 capitalize">{a.sentimiento}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    a.asistencia === 'Presente' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {a.asistencia}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Clientes */}
          {tab === 'clientes' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-slate-100">
                    <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Cliente</th>
                    <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Teléfono</th>
                    <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Estado</th>
                    <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Agente</th>
                    <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Última interacción</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {mockClients.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-3 font-medium text-slate-800">{c.nombre}</td>
                      <td className="py-3 text-slate-500 text-xs">{c.telefono}</td>
                      <td className="py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${estadoColors[c.estado]}`}>
                          {c.estado.charAt(0).toUpperCase() + c.estado.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500 text-xs">{c.agente}</td>
                      <td className="py-3 text-slate-400 text-xs">{c.ultimaInteraccion}</td>
                      <td className="py-3">
                        <div className="relative">
                          <button
                            onClick={() => setMenuOpen(menuOpen === c.id ? null : c.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {menuOpen === c.id && (
                            <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-10">
                              <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Ver detalle</button>
                              <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Reasignar</button>
                              <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Editar</button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Alertas */}
          {tab === 'alertas' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 border border-red-200 bg-red-50 rounded-xl px-4 py-3">
                <Frown size={18} className="text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 text-sm">Jorge Paz — Sentimiento negativo</p>
                  <p className="text-xs text-slate-600 mt-0.5">Cliente "Grupo Delta" expresó insatisfacción. Score: 23%</p>
                </div>
                <span className="text-xs text-slate-400">Hace 30 min</span>
              </div>
              <div className="text-center py-8 text-slate-400 text-sm">
                <UserCheck size={32} className="mx-auto mb-2 opacity-30" />
                No hay más alertas pendientes
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
