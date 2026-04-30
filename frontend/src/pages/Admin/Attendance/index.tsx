import { useState, useEffect, useCallback } from 'react'
import { listarAsistenciaPorFecha, editarAsistencia } from '../../../services/attendance.admin.service'
import axios from 'axios'

interface IAttendance {
  _id: string
  userId: {
    nombre: string
    email: string
  }
  fecha: string
  status: string
  tardanza: boolean
  minutosTardanza: number
  minutosRefrigerio: number | null
  horasTrabajadas: number | null
}

const statusColors: Record<string, string> = {
  jornada_activa: 'bg-green-500/20 text-green-400 border-green-500/50',
  en_refrigerio: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  post_refrigerio: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  finalizado: 'bg-slate-500/20 text-slate-400 border-slate-500/50',
  falta: 'bg-red-500/20 text-red-400 border-red-500/50',
  falta_justificada: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  sin_jornada: 'bg-slate-800/40 text-slate-500 border-slate-700/50',
}

export default function AdminAttendance() {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [asistencias, setAsistencias] = useState<IAttendance[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<IAttendance | null>(null)
  const [showModal, setShowModal] = useState(false)
  
  // Form state
  const [editStatus, setEditStatus] = useState('')
  const [editTardanza, setEditTardanza] = useState(false)
  const [editMinutos, setEditMinutos] = useState(0)
  const [editRazon, setEditRazon] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchAsistencias = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listarAsistenciaPorFecha(fecha)
      setAsistencias(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [fecha])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAsistencias()
  }, [fetchAsistencias])

  const handleEdit = (record: IAttendance) => {
    setSelectedRecord(record)
    setEditStatus(record.status)
    setEditTardanza(record.tardanza)
    setEditMinutos(record.minutosTardanza)
    setEditRazon('')
    setError('')
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRecord) return
    if (!editRazon || editRazon.length < 5) {
      setError('La razón es obligatoria (mínimo 5 caracteres)')
      return
    }

    setSubmitting(true)
    try {
      await editarAsistencia(selectedRecord._id, {
        status: editStatus,
        tardanza: editTardanza,
        minutosTardanza: editMinutos,
        razon: editRazon,
      })
      setShowModal(false)
      fetchAsistencias()
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al actualizar')
      } else {
        setError('Ocurrió un error inesperado')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Control de Asistencia</h1>
            <p className="text-slate-400 mt-1">Panel de administración y auditoría</p>
          </div>
          <div className="flex items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
            <label className="text-sm font-medium text-slate-400">Filtrar por fecha:</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </header>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-800">
                  <th className="px-6 py-4 text-sm font-semibold text-slate-300">Colaborador</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-300">Estado</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-300">Tardanza</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-300">Min. Tardanza</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-300">Min. Refrigerio</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-300">Horas</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-300">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      Cargando registros...
                    </td>
                  </tr>
                ) : asistencias.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      No hay registros para esta fecha
                    </td>
                  </tr>
                ) : (
                  asistencias.map((record) => (
                    <tr key={record._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{record.userId.nombre}</div>
                        <div className="text-xs text-slate-500">{record.userId.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[record.status]}`}>
                          {record.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {record.tardanza ? (
                          <span className="text-red-400 text-sm font-medium">SÍ</span>
                        ) : (
                          <span className="text-slate-500 text-sm">NO</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {record.minutosTardanza} min
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {record.minutosRefrigerio !== null ? `${record.minutosRefrigerio} min` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {record.horasTrabajadas !== null ? `${record.horasTrabajadas.toFixed(2)} hrs` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleEdit(record)}
                          className="text-blue-400 hover:text-blue-300 text-sm font-semibold hover:underline"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Edición */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">Editar Asistencia</h2>
              <p className="text-slate-400 text-sm mt-1">
                Colaborador: {selectedRecord?.userId.nombre}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Estado</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-slate-800 border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="sin_jornada">SIN JORNADA</option>
                  <option value="jornada_activa">JORNADA ACTIVA</option>
                  <option value="en_refrigerio">EN REFRIGERIO</option>
                  <option value="post_refrigerio">POST REFRIGERIO</option>
                  <option value="finalizado">FINALIZADO</option>
                  <option value="falta">FALTA</option>
                  <option value="falta_justificada">FALTA JUSTIFICADA</option>
                </select>
              </div>

              <div className="flex items-center gap-4 py-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editTardanza}
                    onChange={(e) => setEditTardanza(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-300">¿Tiene tardanza?</span>
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Minutos de Tardanza</label>
                <input
                  type="number"
                  value={editMinutos}
                  onChange={(e) => setEditMinutos(Number(e.target.value))}
                  min="0"
                  className="w-full bg-slate-800 border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Razón de la edición (Obligatorio)</label>
                <textarea
                  value={editRazon}
                  onChange={(e) => setEditRazon(e.target.value)}
                  placeholder="Explica el motivo del cambio..."
                  className="w-full bg-slate-800 border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors font-medium disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
