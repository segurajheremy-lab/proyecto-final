import { useState, useEffect, useCallback, useRef, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Plus, Phone, ChevronLeft, ChevronRight,
  Loader2, AlertCircle, X, UserPlus,
} from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { useTenant } from '../../context/TenantContext'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClienteRow {
  _id: string
  nombre: string
  apellido: string
  telefono: string
  email?: string
  estado: 'activo' | 'pendiente' | 'resuelto' | 'inactivo'
  asignadoA?: { _id: string; nombre: string; email: string }
  ultimaInteraccion?: string
  // last interaction sentiment (from populate or stats — may not be present)
  sentimiento?: 'positivo' | 'neutral' | 'negativo'
  sentimientoScore?: number
}

interface Agente {
  _id: string
  nombre: string
  email: string
}

type EstadoFiltro = '' | 'activo' | 'pendiente' | 'resuelto' | 'inactivo'
type SentimientoFiltro = '' | 'positivo' | 'neutral' | 'negativo'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ESTADO_BADGE: Record<string, string> = {
  activo:   'bg-green-100 text-green-700',
  pendiente:'bg-amber-100 text-amber-700',
  resuelto: 'bg-blue-100 text-blue-700',
  inactivo: 'bg-slate-100 text-slate-600',
}

const SENTIMIENTO_EMOJI: Record<string, string> = {
  positivo: '😊',
  neutral:  '😐',
  negativo: '😟',
}

const ESTADO_CHIPS: { value: EstadoFiltro; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'activo', label: 'Activo' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'resuelto', label: 'Resuelto' },
  { value: 'inactivo', label: 'Inactivo' },
]

const SENTIMIENTO_CHIPS: { value: SentimientoFiltro; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'positivo', label: '😊 Positivo' },
  { value: 'neutral',  label: '😐 Neutral' },
  { value: 'negativo', label: '😟 Negativo' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(nombre: string, apellido?: string): string {
  return (nombre.charAt(0) + (apellido?.charAt(0) ?? '')).toUpperCase()
}

function tiempoRelativo(fechaStr?: string): string {
  if (!fechaStr) return '—'
  const diff = Date.now() - new Date(fechaStr).getTime()
  const min  = Math.floor(diff / 60000)
  const h    = Math.floor(diff / 3600000)
  const d    = Math.floor(diff / 86400000)
  if (min < 60)  return `hace ${min} min`
  if (h < 24)    return `hace ${h}h`
  if (d === 1)   return 'ayer'
  if (d < 7)     return `hace ${d} días`
  return new Date(fechaStr).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
}

// ---------------------------------------------------------------------------
// Modal Nuevo Cliente
// ---------------------------------------------------------------------------

interface NuevoClienteModalProps {
  agentes: Agente[]
  onClose: () => void
  onCreated: () => void
}

function NuevoClienteModal({ agentes, onClose, onCreated }: NuevoClienteModalProps) {
  const [form, setForm] = useState({
    nombre: '', apellido: '', telefono: '', email: '',
    direccion: '', empresa: '', asignadoA: '', notas: '',
  })
  const [etiquetas, setEtiquetas] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const addTag = () => {
    const t = tagInput.trim()
    if (t && etiquetas.length < 5 && !etiquetas.includes(t)) {
      setEtiquetas(e => [...e, t])
      setTagInput('')
    }
  }

  const removeTag = (t: string) => setEtiquetas(e => e.filter(x => x !== t))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    
    console.log('[NuevoClienteModal] Form submitted')
    console.log('[NuevoClienteModal] Form data:', form)
    console.log('[NuevoClienteModal] Etiquetas:', etiquetas)
    
    if (!form.nombre || !form.apellido || !form.telefono) {
      const errorMsg = 'Nombre, apellido y teléfono son obligatorios.'
      console.error('[NuevoClienteModal] Validation error:', errorMsg)
      setError(errorMsg)
      return
    }
    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        nombre: form.nombre, apellido: form.apellido, telefono: form.telefono,
      }
      if (form.email)     payload.email     = form.email
      if (form.direccion) payload.direccion = form.direccion
      if (form.empresa)   payload.empresa   = form.empresa
      if (form.asignadoA) payload.asignadoA = form.asignadoA
      if (form.notas)     payload.notas     = form.notas
      if (etiquetas.length) payload.etiquetas = etiquetas

      console.log('[NuevoClienteModal] Sending payload:', payload)
      
      const response = await api.post('/clients', payload)
      
      console.log('[NuevoClienteModal] Success response:', response.data)
      onCreated()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Error al crear el cliente.'
      console.error('[NuevoClienteModal] Error:', err)
      console.error('[NuevoClienteModal] Error message:', msg)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserPlus size={20} className="text-blue-600" />
            Nuevo cliente
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* 2-column grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left */}
            <div className="space-y-4">
              <Field label="Nombre *">
                <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
                  placeholder="Juan" required
                  className="input" />
              </Field>
              <Field label="Apellido *">
                <input value={form.apellido} onChange={e => set('apellido', e.target.value)}
                  placeholder="Pérez" required
                  className="input" />
              </Field>
              <Field label="Teléfono *">
                <input value={form.telefono} onChange={e => set('telefono', e.target.value)}
                  placeholder="+51 987 654 321" required
                  className="input" />
              </Field>
              <Field label="Email">
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  placeholder="cliente@empresa.com"
                  className="input" />
              </Field>
            </div>

            {/* Right */}
            <div className="space-y-4">
              <Field label="Dirección">
                <input value={form.direccion} onChange={e => set('direccion', e.target.value)}
                  placeholder="Av. Principal 123"
                  className="input" />
              </Field>
              <Field label="Empresa">
                <input value={form.empresa} onChange={e => set('empresa', e.target.value)}
                  placeholder="Empresa S.A."
                  className="input" />
              </Field>
              <Field label="Asignar a">
                <select value={form.asignadoA} onChange={e => set('asignadoA', e.target.value)}
                  className="input bg-white">
                  <option value="">Sin asignar</option>
                  {agentes.map(a => (
                    <option key={a._id} value={a._id}>{a.nombre}</option>
                  ))}
                </select>
              </Field>
              <Field label={`Etiquetas (${etiquetas.length}/5)`}>
                <div className="flex gap-2">
                  <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                    placeholder="Escribe y presiona Enter"
                    className="input flex-1"
                    disabled={etiquetas.length >= 5}
                  />
                  <button type="button" onClick={addTag}
                    disabled={etiquetas.length >= 5}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 text-sm transition-colors disabled:opacity-40">
                    +
                  </button>
                </div>
                {etiquetas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {etiquetas.map(t => (
                      <span key={t} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full border border-blue-200">
                        {t}
                        <button type="button" onClick={() => removeTag(t)} className="hover:text-blue-900">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </Field>
            </div>
          </div>

          {/* Full-width notes */}
          <Field label="Notas">
            <textarea value={form.notas} onChange={e => set('notas', e.target.value)}
              rows={3} placeholder="Información adicional sobre el cliente..."
              className="input resize-none" />
          </Field>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 font-medium py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              Crear cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ClientesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { colores } = useTenant()

  const [clientes, setClientes] = useState<ClienteRow[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>('')
  const [sentimientoFiltro, setSentimientoFiltro] = useState<SentimientoFiltro>('')

  const [showModal, setShowModal] = useState(false)
  const [agentes, setAgentes] = useState<Agente[]>([])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ---------------------------------------------------------------------------
  // Load clients
  // ---------------------------------------------------------------------------

  const loadClientes = useCallback(async (page: number, search: string, estado: string, sentimiento: string) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.set('pagina', String(page))
      params.set('limite', '20')
      if (search)     params.set('busqueda', search)
      if (estado)     params.set('estado', estado)
      if (sentimiento) params.set('sentimiento', sentimiento)

      const { data } = await api.get<{
        success: boolean
        data: { clientes: ClienteRow[]; total: number; pagina: number; totalPaginas: number }
      }>(`/clients?${params.toString()}`)

      setClientes(data.data.clientes)
      setTotal(data.data.total)
      setPagina(data.data.pagina)
      setTotalPaginas(data.data.totalPaginas)
    } catch {
      setError('No se pudieron cargar los clientes.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load agents for the modal (supervisor only)
  useEffect(() => {
    if (user?.role === 'supervisor') {
      console.log('[ClientesPage] Loading agents for supervisor')
      api.get<{ success: boolean; data: Agente[] }>('/users')
        .then(({ data }) => {
          const agents = data.data.filter(u => (u as unknown as { role: string }).role === 'agent')
          console.log('[ClientesPage] Agents loaded:', agents)
          setAgentes(agents)
        })
        .catch((err) => {
          console.error('[ClientesPage] Error loading agents:', err)
        })
    }
  }, [user?.role])

  // Initial load
  useEffect(() => {
    loadClientes(1, busqueda, estadoFiltro, sentimientoFiltro)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  const handleSearch = (value: string) => {
    setBusqueda(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPagina(1)
      loadClientes(1, value, estadoFiltro, sentimientoFiltro)
    }, 300)
  }

  const handleEstado = (v: EstadoFiltro) => {
    setEstadoFiltro(v)
    setPagina(1)
    loadClientes(1, busqueda, v, sentimientoFiltro)
  }

  const handleSentimiento = (v: SentimientoFiltro) => {
    setSentimientoFiltro(v)
    setPagina(1)
    loadClientes(1, busqueda, estadoFiltro, v)
  }

  const handlePage = (p: number) => {
    setPagina(p)
    loadClientes(p, busqueda, estadoFiltro, sentimientoFiltro)
  }

  const isSupervisor = user?.role === 'supervisor'

  // DEBUG: Log para verificar rol
  useEffect(() => {
    console.log('[ClientesPage] User role:', user?.role)
    console.log('[ClientesPage] Is supervisor:', isSupervisor)
  }, [user?.role, isSupervisor])

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">
            Gestión de Clientes
            {total > 0 && (
              <span className="ml-2 text-base font-normal text-slate-400">({total})</span>
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {isSupervisor ? 'Clientes de tu equipo' : 'Todos los clientes del tenant'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Buscar por nombre, teléfono o email..."
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>

          {/* New client button — supervisor only */}
          {isSupervisor ? (
            <button
              onClick={() => {
                console.log('[ClientesPage] Opening NuevoClienteModal')
                setShowModal(true)
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <Plus size={16} />
              Nuevo cliente
            </button>
          ) : (
            <div className="text-sm text-slate-500">
              Solo supervisores pueden crear clientes
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* FILTERS                                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-wrap gap-4">
        {/* Estado chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">Estado:</span>
          {ESTADO_CHIPS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleEstado(value)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                estadoFiltro === value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sentimiento chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">Sentimiento:</span>
          {SENTIMIENTO_CHIPS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleSentimiento(value)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                sentimientoFiltro === value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* TABLE                                                                */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-500">
            <AlertCircle size={28} className="text-red-400" />
            <p className="text-sm">{error}</p>
            <button onClick={() => loadClientes(pagina, busqueda, estadoFiltro, sentimientoFiltro)}
              className="text-blue-600 text-sm hover:underline">
              Reintentar
            </button>
          </div>
        ) : clientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400">
            <p className="text-sm">No se encontraron clientes.</p>
            {(busqueda || estadoFiltro || sentimientoFiltro) && (
              <button
                onClick={() => { setBusqueda(''); setEstadoFiltro(''); setSentimientoFiltro(''); loadClientes(1, '', '', '') }}
                className="text-blue-600 text-sm hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left border-b border-slate-100">
                  {['Cliente', 'Teléfono', 'Estado', 'Asignado a', 'Última interacción', 'Sentimiento', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {clientes.map(c => (
                  <tr
                    key={c._id}
                    onClick={() => navigate(`/dashboard/clientes/${c._id}`)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    {/* Cliente */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: colores.primario }}
                        >
                          {getInitials(c.nombre, c.apellido)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">
                            {c.nombre} {c.apellido}
                          </p>
                          {c.email && (
                            <p className="text-xs text-slate-400 truncate">{c.email}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Teléfono */}
                    <td className="px-5 py-4">
                      <a
                        href={`tel:${c.telefono}`}
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Phone size={13} />
                        <span className="text-xs">{c.telefono}</span>
                      </a>
                    </td>

                    {/* Estado */}
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${ESTADO_BADGE[c.estado]}`}>
                        {c.estado}
                      </span>
                    </td>

                    {/* Asignado a */}
                    <td className="px-5 py-4">
                      {c.asignadoA ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-semibold">
                            {c.asignadoA.nombre.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-slate-700 text-xs">{c.asignadoA.nombre}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Sin asignar</span>
                      )}
                    </td>

                    {/* Última interacción */}
                    <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">
                      {tiempoRelativo(c.ultimaInteraccion)}
                    </td>

                    {/* Sentimiento */}
                    <td className="px-5 py-4">
                      {c.sentimiento ? (
                        <span className="flex items-center gap-1 text-xs text-slate-600">
                          {SENTIMIENTO_EMOJI[c.sentimiento]}
                          {c.sentimientoScore !== undefined && (
                            <span className="text-slate-400">{Math.round(c.sentimientoScore)}%</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/dashboard/clientes/${c._id}`) }}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap"
                      >
                        Ver ficha →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPaginas > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Página {pagina} de {totalPaginas} · {total} clientes
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePage(pagina - 1)}
                disabled={pagina <= 1}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} /> Anterior
              </button>
              <button
                onClick={() => handlePage(pagina + 1)}
                disabled={pagina >= totalPaginas}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <NuevoClienteModal
          agentes={agentes}
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false)
            loadClientes(1, busqueda, estadoFiltro, sentimientoFiltro)
          }}
        />
      )}
    </div>
  )
}
