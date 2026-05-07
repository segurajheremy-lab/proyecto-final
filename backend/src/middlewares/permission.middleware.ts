import { Request, Response, NextFunction } from 'express';
import { PERMISSIONS, Permission } from '../config/permissions';

export const authorize = (requiredPermission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role; // Esto viene de tu middleware 'authenticate'

    // Buscamos si el rol del usuario está permitido para ese permiso
    const allowedRoles = PERMISSIONS[requiredPermission] as readonly string[];

    if (allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({ 
      message: "No tienes permiso para realizar esta acción." 
    });
  };
};