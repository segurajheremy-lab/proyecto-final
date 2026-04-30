import { useState, useEffect } from 'react'
import { listarUsuarios, editarUsuario, desactivarUsuario, crearUsuario } from '../../../services/user.service'

interface Horario {
  entrada: string
  salidaRefrigerio: string
  vueltaRefrigerio: string
  salida: string
}

interface IUser {
  _id: string
  nombre: string
  email: string
  role: string
  horario: Horario
  toleranciaMinutos: number
  activo: boolean
}

const roleColors: Record<string, string> = {
  super_admin: 'bg-purple-500/10 text-purple-400',
  admin: 'bg-blue-500/10 text-blue-400',
  reporter: 'bg-amber-500/10 text-amber-400',
  worker: 'bg-emerald-500/10 text-emerald-400',
}

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  reporter: 'Reporter',
  worker: 'Worker',
}

const defaultHorario: Horario = {
  entrada: '08:00',
  salidaRefrigerio: '13:00',
  vueltaRefrigerio: '14:00',
  salida: '17:00',
}

export default function UsersPage() {
  const [usuarios, setUsuarios] = useState<IUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editando, setEditando] = useState<IUser | null>(null)
  const [editForm, setEditForm] = useState({
    nombre: '',
    role: 'worker',
    toleranciaMinutos: 10,
    horario: defaultHorario,
  })
  const [creando, setCreando] = useState(false)
  const [crearForm, setCrearForm] = useState({
    nombre: '',
    email: '',
    password: '',
    role: 'worker',
    toleranciaMinutos: 10,
    horario: defaultHorario,
  })

  const cargar = async () => {
    try {
      setIsLoading(true)
      const data = await listarUsuarios()
      setUsuarios(data)
    } catch {
      setError('Error al cargar usuarios')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { cargar() }, []) // eslint-disable-line

  const mostrarExito = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3000)
  }

  const abrirEditar = (user: IUser) => {
    setEditando(user)
    setEditForm({
      nombre: user.nombre,
      role: user.role,
      toleranciaMinutos: user.toleranciaMinutos,
      horario: user.horario,
    })
  }

  const guardarEdicion = async () => {
    if (!editando) return
    try {
      await editarUsuario(editando._id, editForm)
      await cargar()
      setEditando(null)
      mostrarExito('Usuario actualizado correctamente')
    } catch {
      setError('Error al editar usuario')
    }
  }

  const toggleActivar = async (user: IUser) => {
    const accion = user.activo ? 'desactivar' : 'activar'
    if (!confirm(`¿Seguro que quieres ${accion} a ${user.nombre}?`)) return
    try {
      await desactivarUsuario(user._id)
      await cargar()
      mostrarExito(`Usuario ${accion === 'desactivar' ? 'desactivado' : 'activado'} correctamente`)
    } catch {
      setError(`Error al ${accion} usuario`)
    }
  }

  const guardarNuevo = async () => {
    try {
      await crearUsuario(crearForm)
      await cargar()
      setCreando(false)
      setCrearForm({ nombre: '', email: '', password: '', role: 'worker', toleranciaMinutos: 10, horario: defaultHorario })
      mostrarExito('Usuario creado correctamente')
    } catch {
      setError('Error al crear usuario')
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Usuarios</h1>
          <p className="text-slate-400 text-sm mt-1">{usuarios.length} usuarios registrados</p>
        </div>
        <button
          onClick={() => setCreando(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
        >
          + Nuevo usuario
        </button>
      </div>

      {/* Notificaciones */}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          ✓ {success}
        </div>
      )}

      {/* Tabla */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Cargando usuarios...</div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/40">
              <tr>
                <th className="text-left text-xs text-slate-400 font-medium py-3 px-6 uppercase tracking-wider">Nombre</th>
                <th className="text-left text-xs text-slate-400 font-medium py-3 px-6 uppercase tracking-wider">Rol</th>
                <th className="text-left text-xs text-slate-400 font-medium py-3 px-6 uppercase tracking-wider">Entrada</th>
                <th className="text-left text-xs text-slate-400 font-medium py-3 px-6 uppercase tracking-wider">Salida</th>
                <th className="text-left text-xs text-slate-400 font-medium py-3 px-6 uppercase tracking-wider">Estado</th>
                <th className="text-left text-xs text-slate-400 font-medium py-3 px-6 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {usuarios.map((user) => (
                <tr key={user._id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-medium text-white">{user.nombre}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{user.email}</div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-300 font-mono text-xs">{user.horario.entrada}</td>
                  <td className="py-4 px-6 text-slate-300 font-mono text-xs">{user.horario.salida}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${user.activo ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {user.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => abrirEditar(user)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => toggleActivar(user)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${user.activo ? 'text-red-400 border-red-500/30 hover:bg-red-500/10' : 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10'}`}
                      >
                        {user.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Editar */}
      {editando && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Editar usuario</h2>
              <button onClick={() => setEditando(null)} className="text-slate-500 hover:text-slate-300 text-xl">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Nombre</label>
                <input
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  value={editForm.nombre}
                  onChange={e => setEditForm({ ...editForm, nombre: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Rol</label>
                  <select
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                    value={editForm.role}
                    onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                  >
                    <option value="worker">Worker</option>
                    <option value="admin">Admin</option>
                    <option value="reporter">Reporter</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Tolerancia (min)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                    value={editForm.toleranciaMinutos}
                    onChange={e => setEditForm({ ...editForm, toleranciaMinutos: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Horario</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'entrada', label: 'Entrada' },
                    { key: 'salidaRefrigerio', label: 'Sale refrigerio' },
                    { key: 'vueltaRefrigerio', label: 'Vuelve refrigerio' },
                    { key: 'salida', label: 'Salida' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs text-slate-500 mb-1">{label}</label>
                      <input
                        type="time"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                        value={editForm.horario[key as keyof Horario]}
                        onChange={e => setEditForm({ ...editForm, horario: { ...editForm.horario, [key]: e.target.value } })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={guardarEdicion} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition-colors">
                Guardar cambios
              </button>
              <button onClick={() => setEditando(null)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear */}
      {creando && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Nuevo trabajador</h2>
              <button onClick={() => setCreando(false)} className="text-slate-500 hover:text-slate-300 text-xl">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Nombre</label>
                <input
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="Juan Pérez"
                  value={crearForm.nombre}
                  onChange={e => setCrearForm({ ...crearForm, nombre: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="juan@empresa.com"
                  value={crearForm.email}
                  onChange={e => setCrearForm({ ...crearForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Contraseña</label>
                <input
                  type="password"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="Mínimo 6 caracteres"
                  value={crearForm.password}
                  onChange={e => setCrearForm({ ...crearForm, password: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Rol</label>
                  <select
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                    value={crearForm.role}
                    onChange={e => setCrearForm({ ...crearForm, role: e.target.value })}
                  >
                    <option value="worker">Worker</option>
                    <option value="admin">Admin</option>
                    <option value="reporter">Reporter</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Tolerancia (min)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                    value={crearForm.toleranciaMinutos}
                    onChange={e => setCrearForm({ ...crearForm, toleranciaMinutos: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Horario</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'entrada', label: 'Entrada' },
                    { key: 'salidaRefrigerio', label: 'Sale refrigerio' },
                    { key: 'vueltaRefrigerio', label: 'Vuelve refrigerio' },
                    { key: 'salida', label: 'Salida' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs text-slate-500 mb-1">{label}</label>
                      <input
                        type="time"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                        value={crearForm.horario[key as keyof Horario]}
                        onChange={e => setCrearForm({ ...crearForm, horario: { ...crearForm.horario, [key]: e.target.value } })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={guardarNuevo} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition-colors">
                Crear usuario
              </button>
              <button onClick={() => setCreando(false)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}