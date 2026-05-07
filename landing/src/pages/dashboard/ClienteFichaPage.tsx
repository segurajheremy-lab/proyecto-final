import { useState, useEffect, useCallback, FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  Phone,
  Mail,
  MapPin,
  Building2,
  Tag,
  FileText,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Smile,
  Meh,
  Frown,
  TrendingUp,
} from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { useTenant } from '../../context/TenantContext'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Cliente {
  _id: string
  nombre: string
  apellido: string
  telefono: string
  email?: string
  direccion?: string
  empresa?: string
  estado: 'activo' | 'pendiente' | 'resuelto' | 'inactivo'
  etiquetas: string[]
  notas?: string
  ultimaInteraccion?: string
  asignadoA?: { _id: string; nombre: string; email: string }
  creadoPor?: { nombre: string; email: string }
}

interface Interaccion {
  _id: string
  fecha: string
  duracionMinutos?: number
  resultado: 'resuelto' | 'pendiente' | 'sin_respuesta' | 'callback'
  nota: string
  sentimiento?: 'positivo' | 'neutral' | 'negativo'
  sentimientoScore?: number
  agentId?: { nombre: string }
}

interface Estadisticas {
  totalInteracciones: number
  resueltas: number
  pendientes: number
  sinRespuesta: number
  callbacks: number
  sentimientoPromedio: 'positivo' | 'neutral' | 'negativo'
  scorePromedio: number
}

interface FichaResponse {
  success: boolean
  data: {
    cliente: Cliente
    interacciones: Interaccion[]
    estadisticas: Estadisticas
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(nombre: string, apellido?: string): string {
  const a = nombre.charAt(0).toUpperCase()
  const b = apellido ? apellido.charAt(0).toUpperCase() : ''
  return a + b
}

function formatFecha(fechaStr: string): string {
  const date = new Date(fechaStr)
  const datePart = date.toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const timePart = date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
  // Capitalize first letter
  return datePart.charAt(0).toUpperCase() + datePart.slice(1) + ' · ' + timePart
}

const ESTADO_BADGE: Record<Cliente['estado'], string> = {
  activo: 'bg-green-500/20 text-green-400 border border-green-500/30',
  pendiente: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  resuelto: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  inactivo: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
}

const RESULTADO_BADGE: Record<Interaccion['resultado'], string> = {
  resuelto: 'bg-green-500/20 text-green-400 border border-green-500/30',
  pendiente: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  sin_respuesta: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  callback: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
}

const RESULTADO_LABEL: Record<Interaccion['resultado'], string> = {
  resuelto: 'Resuelto',
  pendiente: 'Pendiente',
  sin_respuesta: 'Sin respuesta',
  callback: 'Callback',
}

const SENTIMIENTO_EMOJI: Record<string, string> = {
  positivo: '😊',
  neutral: '😐',
  negativo: '😟',
}

const SENTIMIENTO_BADGE: Record<string, string> = {
  positivo: 'bg-green-500/20 text-green-400 border border-green-500/30',
  neutral: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  negativo: 'bg-red-500/20 text-red-400 border border-red-500/30',
}

// ---------------------------------------------------------------------------
// Modal de nueva interacción
// ---------------------------------------------------------------------------

interface NuevaInteraccionModalProps {
  clienteId: string
  onClose: () => void
  onSuccess: () => void
}

function NuevaInteraccionModal({ clienteId, onClose, onSuccess }: NuevaInteraccionModalProps) {
  const [resultado, setResultado] = useState<Interaccion['resultado']>('resuelto')
  const [duracion, setDuracion] = useState<string>('')
  const [nota, setNota] = useState('')
  const [loading, setLoading] = useState(false)
  const [sentimientoDetectado, setSentimientoDetectado] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (nota.trim().length < 10) {
      setError('La nota debe tener al menos 10 caracteres.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        clientId: clienteId,
        resultado,
        nota: nota.trim(),
      }
      if (duracion !== '') payload.duracionMinutos = Number(duracion)

      const res = await api.post<{
        success: boolean
        data: { sentimiento?: string }
      }>('/interactions', payload)

      const sent = res.data?.data?.sentimiento ?? 'neutral'
      setSentimientoDetectado(sent)

      setTimeout(() => {
        onSuccess()
      }, 3000)
    } catch {
      setError('Error al registrar la interacción. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const sentimientoBannerColor =
    sentimientoDetectado === 'positivo'
      ? 'bg-green-500/20 border border-green-500/40 text-green-300'
      : sentimientoDetectado === 'negativo'
      ? 'bg-red-500/20 border border-red-500/40 text-red-300'
      : 'bg-amber-500/20 border border-amber-500/40 text-amber-300'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-white font-semibold text-lg">Registrar nueva interacción</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Modal body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Resultado */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">Resultado</label>
            <select
              value={resultado}
              onChange={(e) => setResultado(e.target.value as Interaccion['resultado'])}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="resuelto">Resuelto</option>
              <option value="pendiente">Pendiente</option>
              <option value="sin_respuesta">Sin respuesta</option>
              <option value="callback">Callback</option>
            </select>
          </div>

          {/* Duración */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">
              Duración (minutos)
            </label>
            <input
              type="number"
              min={0}
              value={duracion}
              onChange={(e) => setDuracion(e.target.value)}
              placeholder="Opcional"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* Nota */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">Nota</label>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows={4}
              placeholder="Describe qué ocurrió en la llamada..."
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              disabled={loading}
            />
            <p className="text-slate-500 text-xs mt-1">Mínimo 10 caracteres</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Sentimiento detectado */}
          {sentimientoDetectado && (
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${sentimientoBannerColor}`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Sentimiento detectado:{' '}
              <span className="capitalize">
                {SENTIMIENTO_EMOJI[sentimientoDetectado]} {sentimientoDetectado}
              </span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !!sentimientoDetectado}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analizando sentimiento con IA...
              </>
            ) : (
              'Guardar interacción'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ClienteFichaPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { colores } = useTenant()

  const [ficha, setFicha] = useState<FichaResponse['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const loadFicha = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<FichaResponse>(`/interactions/cliente/${id}`)
      setFicha(res.data.data)
    } catch {
      setError('No se pudo cargar la ficha del cliente.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadFicha()
  }, [loadFicha])

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="bg-slate-950 min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------
  if (error || !ficha) {
    return (
      <div className="bg-slate-950 min-h-screen flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-slate-300 text-lg">{error ?? 'Error desconocido'}</p>
        <button
          onClick={loadFicha}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg transition-colors"
        >
          Reintentar
        </button>
      </div>
    )
  }

  const { cliente, interacciones, estadisticas } = ficha

  // Can the current agent register a new interaction?
  const canRegister =
    user?.role === 'agent' &&
    cliente.asignadoA?._id === user?.id

  // Score bar color
  const scoreColor =
    estadisticas.scorePromedio > 70
      ? 'bg-green-500'
      : estadisticas.scorePromedio > 40
      ? 'bg-amber-500'
      : 'bg-red-500'

  return (
    <div className="bg-slate-950 min-h-screen">
      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                               */}
      {/* ------------------------------------------------------------------ */}
      <header className="bg-slate-900 sticky top-0 z-40 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
            aria-label="Volver"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Volver</span>
          </button>

          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h1 className="text-white font-semibold text-xl truncate">
              {cliente.nombre} {cliente.apellido}
            </h1>
            <span
              className={`shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${ESTADO_BADGE[cliente.estado]}`}
            >
              {cliente.estado}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* ---------------------------------------------------------------- */}
        {/* SECTION 1 — Client data card                                      */}
        {/* ---------------------------------------------------------------- */}
        <section className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* LEFT — Avatar + name + status + agent */}
            <div className="flex flex-col items-center md:items-start gap-4">
              {/* Avatar */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0"
                style={{ backgroundColor: colores.primario }}
              >
                {getInitials(cliente.nombre, cliente.apellido)}
              </div>

              {/* Name */}
              <div>
                <p className="text-white text-2xl font-bold">
                  {cliente.nombre} {cliente.apellido}
                </p>
                <span
                  className={`inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${ESTADO_BADGE[cliente.estado]}`}
                >
                  {cliente.estado}
                </span>
              </div>

              {/* Assigned agent */}
              {cliente.asignadoA && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-semibold">
                    {getInitials(cliente.asignadoA.nombre)}
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Asignado a</p>
                    <p className="text-slate-200 text-sm font-medium">{cliente.asignadoA.nombre}</p>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT — 2×3 data grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone */}
              <DataItem icon={<Phone className="w-4 h-4" />} label="Teléfono">
                {cliente.telefono ? (
                  <a
                    href={`tel:${cliente.telefono}`}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {cliente.telefono}
                  </a>
                ) : (
                  <span className="text-slate-500">—</span>
                )}
              </DataItem>

              {/* Email */}
              <DataItem icon={<Mail className="w-4 h-4" />} label="Email">
                {cliente.email ? (
                  <a
                    href={`mailto:${cliente.email}`}
                    className="text-blue-400 hover:text-blue-300 transition-colors break-all"
                  >
                    {cliente.email}
                  </a>
                ) : (
                  <span className="text-slate-500">—</span>
                )}
              </DataItem>

              {/* Address */}
              <DataItem icon={<MapPin className="w-4 h-4" />} label="Dirección">
                <span className="text-slate-200">{cliente.direccion ?? '—'}</span>
              </DataItem>

              {/* Company */}
              <DataItem icon={<Building2 className="w-4 h-4" />} label="Empresa">
                <span className="text-slate-200">{cliente.empresa ?? '—'}</span>
              </DataItem>

              {/* Tags */}
              <DataItem icon={<Tag className="w-4 h-4" />} label="Etiquetas">
                {cliente.etiquetas && cliente.etiquetas.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {cliente.etiquetas.map((tag) => (
                      <span
                        key={tag}
                        className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full border border-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-500">—</span>
                )}
              </DataItem>

              {/* Notes */}
              <DataItem icon={<FileText className="w-4 h-4" />} label="Notas">
                <span className="text-slate-200 text-sm leading-relaxed">
                  {cliente.notas ?? '—'}
                </span>
              </DataItem>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* SECTION 2 — Stats                                                 */}
        {/* ---------------------------------------------------------------- */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1 — Calls */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
              <TrendingUp className="w-4 h-4" />
              Total de llamadas
            </div>
            <p className="text-white text-3xl font-bold">{estadisticas.totalInteracciones}</p>
            <div className="flex gap-4 text-sm">
              <span>
                <span className="text-green-400 font-semibold">{estadisticas.resueltas}</span>{' '}
                <span className="text-slate-400">resueltas</span>
              </span>
              <span>
                <span className="text-amber-400 font-semibold">{estadisticas.pendientes}</span>{' '}
                <span className="text-slate-400">pendientes</span>
              </span>
            </div>
          </div>

          {/* Card 2 — Sentiment */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
              <Smile className="w-4 h-4" />
              Sentimiento promedio
            </div>
            <p className="text-4xl">
              {SENTIMIENTO_EMOJI[estadisticas.sentimientoPromedio] ?? '😐'}
            </p>
            <p className="text-slate-300 text-sm capitalize">{estadisticas.sentimientoPromedio}</p>
          </div>

          {/* Card 3 — Score */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
              <Meh className="w-4 h-4" />
              Score promedio
            </div>
            <p className="text-white text-3xl font-bold">
              {Math.round(estadisticas.scorePromedio)}
              <span className="text-slate-400 text-lg font-normal">%</span>
            </p>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${scoreColor}`}
                style={{ width: `${Math.min(100, Math.max(0, estadisticas.scorePromedio))}%` }}
              />
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* SECTION 3 — New interaction button                                */}
        {/* ---------------------------------------------------------------- */}
        {canRegister && (
          <section>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              Registrar nueva interacción
            </button>
          </section>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* SECTION 4 — Interaction history                                   */}
        {/* ---------------------------------------------------------------- */}
        <section className="space-y-4">
          <h2 className="text-white font-semibold text-lg">Historial de interacciones</h2>

          {interacciones.length === 0 ? (
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 text-center text-slate-400">
              No hay interacciones registradas aún.
            </div>
          ) : (
            interacciones.map((interaccion) => {
              const isTensa =
                interaccion.sentimiento === 'negativo' &&
                (interaccion.sentimientoScore ?? 0) > 70

              return (
                <div
                  key={interaccion._id}
                  className="bg-slate-800 rounded-2xl border border-slate-700 p-5 space-y-3"
                >
                  {/* Top row: date + badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-slate-300 text-sm font-medium">
                      {formatFecha(interaccion.fecha)}
                    </span>
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${RESULTADO_BADGE[interaccion.resultado]}`}
                    >
                      {RESULTADO_LABEL[interaccion.resultado]}
                    </span>
                    {interaccion.sentimiento && (
                      <span
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${SENTIMIENTO_BADGE[interaccion.sentimiento]}`}
                      >
                        {SENTIMIENTO_EMOJI[interaccion.sentimiento]} {interaccion.sentimiento}
                      </span>
                    )}
                    {interaccion.duracionMinutos !== undefined && (
                      <span className="text-slate-400 text-xs">
                        {interaccion.duracionMinutos} min
                      </span>
                    )}
                  </div>

                  {/* Note */}
                  <p className="text-slate-200 text-sm leading-relaxed">{interaccion.nota}</p>

                  {/* Confidence */}
                  {interaccion.sentimientoScore !== undefined && (
                    <p className="text-slate-400 text-xs">
                      Confianza: {Math.round(interaccion.sentimientoScore)}%
                    </p>
                  )}

                  {/* Tense alert */}
                  {isTensa && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-sm">
                      <Frown className="w-4 h-4 shrink-0" />
                      ⚠️ Interacción tensa detectada
                    </div>
                  )}
                </div>
              )
            })
          )}
        </section>
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* Modal                                                                */}
      {/* ------------------------------------------------------------------ */}
      {showModal && (
        <NuevaInteraccionModal
          clienteId={cliente._id}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            loadFicha()
          }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// DataItem helper component
// ---------------------------------------------------------------------------

function DataItem({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
        {icon}
        {label}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  )
}
