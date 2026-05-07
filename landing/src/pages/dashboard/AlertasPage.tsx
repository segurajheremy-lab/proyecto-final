import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, Frown, Loader2, AlertCircle,
  ChevronDown, ChevronUp, ExternalLink, Calendar,
} from 'lucide-react'
import { api } from '../../lib/api'

interface Alerta {
  _id: string
  agentId?: { _id: string; nombre: string; email: string }
  clientId?: { _id: string; nombre: string; apellido: string }
  sentimientoScore?: number
  nota: string
  fecha: string
  alertaEnviada: boolean
}

function tiempoRelativo(fechaStr: string): string {
  const diff = Date.now() - new Date(fechaStr).getTime()
  const min = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  if (min < 60) return `hace ${min} min`
  if (h < 24) return `hace ${h}h`
  return new Date(fechaStr).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
}

function todayStr() {
  return new Date().toISOString().split('T')[0]!
}

export default function AlertasPage() {
  const navigate = useNavigate()
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [fecha, setFecha] = useState(todayStr())

  const loadAlertas = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.set('sentimiento', 'negativo')
      params.set('limite', '50')
      if (fecha) {
        params.set('fechaDesde', `${fecha}T00:00:00.000Z`)
        params.set('fechaHasta', `${fecha}T23:59:59.999Z`)
      }
      const res = await api.get<{
        success: boolean
        data: { interacciones: Alerta[] }
      }>(`/interactions?${params.toString()}`)
      const all = res.data.data.interacciones ?? []
      // Filter score > 70
      setAlertas(all.filter(a => (a.sentimientoScore ?? 0) > 70))
    } catch {
      setError('No se pudieron cargar las alertas.')
    } finally {
      setLoading(false)
    }
  }, [fecha])

  useEffect(() => { loadAlertas() }, [loadAlertas])

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle size={22} className="text-red-500" />
            Alertas IA
            {alertas.length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {alertas.length}
              </span>
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Interacciones con sentimiento negativo y score &gt; 70%
          </p>
        </div>

        {/* Date filter */}
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-slate-400" />
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={28} className="animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          <AlertCircle size={15} />
          {error}
          <button onClick={loadAlertas} className="ml-auto text-blue-600 hover:underline text-xs">
            Reintentar
          </button>
        </div>
      ) : alertas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <AlertTriangle size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">No hay alertas críticas para esta fecha.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alertas.map(a => {
            const agente = a.agentId
            const cliente = a.clientId
            const isExpanded = expanded.has(a._id)

            return (
              <div key={a._id} className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
                {/* Main row */}
                <div className="flex items-start gap-4 p-5">
                  {/* Agent avatar */}
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-sm shrink-0">
                    {agente?.nombre?.charAt(0).toUpperCase() ?? '?'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-800 text-sm">
                        {agente?.nombre ?? 'Agente desconocido'}
                      </span>
                      <span className="text-slate-400 text-xs">→</span>
                      <span className="text-slate-700 text-sm">
                        {cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Cliente desconocido'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-400">{tiempoRelativo(a.fecha)}</span>
                      {a.sentimientoScore !== undefined && (
                        <span className="flex items-center gap-1 text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          <Frown size={11} />
                          Score: {Math.round(a.sentimientoScore)}%
                        </span>
                      )}
                    </div>

                    {/* Note preview */}
                    <p className={`text-sm text-slate-600 mt-2 ${isExpanded ? '' : 'line-clamp-2'}`}>
                      {a.nota}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {cliente && (
                      <button
                        onClick={() => navigate(`/dashboard/clientes/${cliente._id}`)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Ver ficha <ExternalLink size={11} />
                      </button>
                    )}
                    <button
                      onClick={() => toggleExpand(a._id)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
                    >
                      {isExpanded ? (
                        <><ChevronUp size={13} /> Menos</>
                      ) : (
                        <><ChevronDown size={13} /> Más</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
