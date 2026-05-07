import { useState } from 'react'
import {
  Users, UserPlus, TrendingUp, Clock,
  MoreVertical, BarChart3, Calendar,
  CheckCircle2, AlertTriangle,
} from 'lucide-react'

const mockSupervisors = [
  { id: '1', nombre: 'Ana Torres', email: 'ana@empresa.com', agentes: 8, activo: true },
  { id: '2', nombre: 'Pedro Vega', email: 'pedro@empresa.com', agentes: 6, activo: true },
]

const mockAgents = [
  { id: '1', nombre: 'Luis Ríos', supervisor: 'Ana Torres', asistencia: 'Presente', tardanza: false },
  { id: '2', nombre: 'Carla Díaz', supervisor: 'Ana Torres', asistencia: 'Tardanza', tardanza: true },
  { id: '3', nombre: 'Jorge Paz', supervisor: 'Pedro Vega', asistencia: 'Presente', tardanza: false },
  { id: '4', nombre: 'Rosa Lima', supervisor: 'Pedro Vega', asistencia: 'Falta', tardanza: false },
]

export default function SubAdminPage() {
  const [tab, setTab] = useState<'supervisores' | 'agentes' | 'reportes'>('supervisores')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Panel Sub Admin</h1>
          <p className="text-slate-500 mt-1">Gestiona tu área: supervisores, agentes y reportes.</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
          <UserPlus size={16} />
          Invitar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Supervisores', value: '2', color: 'bg-indigo-50 text-indigo-600' },
          { icon: Users, label: 'Agentes en área', value: '14', color: 'bg-blue-50 text-blue-600' },
          { icon: CheckCircle2, label: 'Asistencia hoy', value: '86%', color: 'bg-green-50 text-green-600' },
          { icon: TrendingUp, label: 'Interacciones', value: '124', color: 'bg-purple-50 text-purple-600' },
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
          {(['supervisores', 'agentes', 'reportes'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3.5 text-sm font-semibold capitalize transition-colors ${
                tab === t
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Supervisores tab */}
          {tab === 'supervisores' && (
            <div className="space-y-3">
              {mockSupervisors.map((s) => (
                <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                    {s.nombre.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800">{s.nombre}</p>
                    <p className="text-xs text-slate-400">{s.email}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-800">{s.agentes}</p>
                    <p className="text-xs text-slate-400">agentes</p>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${s.activo ? 'bg-green-500' : 'bg-slate-300'}`} />
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === s.id ? null : s.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {menuOpen === s.id && (
                      <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-10">
                        <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Ver equipo</button>
                        <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Editar</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Agentes tab */}
          {tab === 'agentes' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-slate-100">
                    <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Agente</th>
                    <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Supervisor</th>
                    <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Asistencia hoy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {mockAgents.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                            {a.nombre.charAt(0)}
                          </div>
                          <span className="font-medium text-slate-800">{a.nombre}</span>
                        </div>
                      </td>
                      <td className="py-3 text-slate-500 text-xs">{a.supervisor}</td>
                      <td className="py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          a.asistencia === 'Presente' ? 'bg-green-100 text-green-700' :
                          a.asistencia === 'Tardanza' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {a.asistencia}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Reportes tab */}
          {tab === 'reportes' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: BarChart3, title: 'Reporte de área', desc: 'Rendimiento general del área esta semana', color: 'text-indigo-600' },
                  { icon: Calendar, title: 'Reporte de asistencia', desc: 'Asistencia y tardanzas del mes', color: 'text-blue-600' },
                  { icon: TrendingUp, title: 'Reporte de sentimiento', desc: 'Análisis de interacciones por agente', color: 'text-green-600' },
                ].map(({ icon: Icon, title, desc, color }) => (
                  <button key={title} className="text-left p-5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group">
                    <Icon size={24} className={`${color} mb-3`} />
                    <p className="font-semibold text-slate-800 text-sm">{title}</p>
                    <p className="text-xs text-slate-500 mt-1">{desc}</p>
                    <p className="text-xs text-indigo-600 font-medium mt-3 group-hover:underline">Generar →</p>
                  </button>
                ))}
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  Los reportes se generan en formato Excel y se envían a tu correo corporativo.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
