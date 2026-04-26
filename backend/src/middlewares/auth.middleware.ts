import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { User } from '../models/User.model'
import { Role } from '../config/permissions'

export interface AuthRequest extends Request {
  user?: {
    id: string
    role: Role
    nombre: string
  }
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Token no proporcionado' })
      return
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string
      role: Role
    }

    const user = await User.findById(decoded.id).select('-passwordHash')

    if (!user || !user.activo) {
      res.status(401).json({ message: 'Usuario no autorizado o inactivo' })
      return
    }

    req.user = { id: decoded.id, role: user.role, nombre: user.nombre }
    next()
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' })
  }
}