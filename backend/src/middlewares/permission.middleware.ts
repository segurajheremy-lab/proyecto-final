import { Response, NextFunction } from 'express'
import { PERMISSIONS, Permission } from '../config/permissions'
import { AuthRequest } from './auth.middleware'

export const authorize = (permission: Permission) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'No autenticado' })
      return
    }

    const rolesPermitidos = PERMISSIONS[permission]
    const tienePermiso = rolesPermitidos.includes(req.user.role as never)

    if (!tienePermiso) {
      res.status(403).json({
        message: `No tienes permiso para realizar esta acción`,
        requiere: permission,
        tuRol: req.user.role,
      })
      return
    }

    next()
  }
}