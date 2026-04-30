import { User } from '../models/User.model'
import { AppError } from '../middlewares/errorHandler'
import { Role } from '../config/permissions'

export const listarUsuariosService = async () => {
  const usuarios = await User.find().select('-passwordHash').sort({ createdAt: -1 })
  return usuarios
}

export const obtenerUsuarioService = async (id: string) => {
  const usuario = await User.findById(id).select('-passwordHash')
  if (!usuario) throw new AppError('Usuario no encontrado', 404)
  return usuario
}

export const editarUsuarioService = async (
  id: string,
  data: {
    nombre?: string
    role?: Role
    toleranciaMinutos?: number
    horario?: {
      entrada: string
      salidaRefrigerio: string
      vueltaRefrigerio: string
      salida: string
    }
  }
) => {
  const usuario = await User.findById(id)
  if (!usuario) throw new AppError('Usuario no encontrado', 404)

  if (data.nombre) usuario.nombre = data.nombre
  if (data.role) usuario.role = data.role
  if (data.toleranciaMinutos !== undefined) usuario.toleranciaMinutos = data.toleranciaMinutos
  if (data.horario) usuario.horario = data.horario

  await usuario.save()

  return {
    id: usuario._id,
    nombre: usuario.nombre,
    email: usuario.email,
    role: usuario.role,
    horario: usuario.horario,
    toleranciaMinutos: usuario.toleranciaMinutos,
    activo: usuario.activo,
  }
}

export const desactivarUsuarioService = async (id: string) => {
  const usuario = await User.findById(id)
  if (!usuario) throw new AppError('Usuario no encontrado', 404)

  usuario.activo = !usuario.activo
  await usuario.save()

  return {
    mensaje: usuario.activo ? 'Usuario activado' : 'Usuario desactivado',
    activo: usuario.activo,
  }
}