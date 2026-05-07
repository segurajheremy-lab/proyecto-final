import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.model'
import { env } from '../config/env'
import { AppError } from '../middlewares/errorHandler'
import { Role } from '../config/permissions'

export const loginService = async (email: string, password: string) => {
  // 1. Buscar usuario
  const user = await User.findOne({ email, activo: true })
  if (!user) throw new AppError('Credenciales incorrectas', 401)

  // 2. Verificar contraseña
  const passwordValida = await bcrypt.compare(password, user.passwordHash)
  if (!passwordValida) throw new AppError('Credenciales incorrectas', 401)

  // 3. Generar token
  const token = jwt.sign(
    { id: user._id, role: user.role },
    env.JWT_SECRET as string,
    { expiresIn: '8h' }
  )

  return {
    token,
    user: {
      id: user._id,
      nombre: user.nombre,
      email: user.email,
      role: user.role,
      horario: user.horario,
    },
  }
}

export const crearUsuarioService = async (data: {
  nombre: string
  email: string
  password: string
  role: Role
  horario: {
    entrada: string
    salidaRefrigerio: string
    vueltaRefrigerio: string
    salida: string
  }
  toleranciaMinutos?: number
}) => {
  // Verificar si el email ya existe
  const existe = await User.findOne({ email: data.email })
  if (existe) throw new AppError('El email ya está registrado', 400)

  // Hashear contraseña
  const passwordHash = await bcrypt.hash(data.password, 12)

  const user = await User.create({
    nombre: data.nombre,
    email: data.email,
    passwordHash,
    role: data.role,
    horario: data.horario,
    toleranciaMinutos: data.toleranciaMinutos ?? 10,
  })

  return {
    id: user._id,
    nombre: user.nombre,
    email: user.email,
    role: user.role,
  }
}