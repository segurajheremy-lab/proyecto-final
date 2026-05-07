import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { User } from '../models/User.model';
import { Tenant } from '../models/Tenant.model';
import { checkWorkSchedule } from '../utils/time.util';
import type { AuthUser, JwtPayload } from '../types/express';

// Re-export so consumers can import from a single place
export type { AuthUser };

/**
 * Extends Express Request with the authenticated user.
 * Use this type in controllers/services that require authentication.
 */
export interface AuthRequest extends Request {
  user: AuthUser; // non-optional — only use after authenticate()
}

// ---------------------------------------------------------------------------
// authenticate middleware
// ---------------------------------------------------------------------------

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // 1. Extract token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Authorization header is missing or malformed. Expected: Bearer <token>',
    });
    return;
  }

  const token = authHeader.slice(7);

  // 2. Verify JWT
  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
  } catch (error) {
    const message =
      error instanceof jwt.TokenExpiredError
        ? 'Token has expired. Please log in again.'
        : 'Invalid token. Authentication failed.';
    res.status(401).json({ success: false, message });
    return;
  }

  // 3. Load user from DB (exclude passwordHash)
  const user = await User.findById(decoded.sub).select('-passwordHash').lean();
  if (!user) {
    res.status(401).json({ success: false, message: 'User not found.' });
    return;
  }

  // 4. Check user is active
  if (!user.activo) {
    res.status(401).json({ success: false, message: 'User account is deactivated.' });
    return;
  }

  // 5. super_admin has no tenant — skip tenant checks entirely
  if (user.role === 'super_admin') {
    req.user = {
      id:       String(user._id),
      tenantId: '',   // super_admin is not scoped to any tenant
      role:     user.role,
      nombre:   user.nombre,
      dominio:  '',
    };
    next();
    return;
  }

  // 6. Load tenant and verify it is active (for all other roles)
  const tenant = await Tenant.findById(user.tenantId).lean();
  if (!tenant) {
    res.status(401).json({ success: false, message: 'Tenant not found.' });
    return;
  }

  if (tenant.status !== 'active' && tenant.status !== 'trial') {
    res.status(401).json({
      success: false,
      message: 'Your account has been suspended. Please contact support.',
    });
    return;
  }

  // 7. Work schedule enforcement for agents (Peru timezone)
  if (user.role === 'agent' && user.horario?.entrada && user.horario?.salida) {
    const scheduleCheck = checkWorkSchedule(
      { entrada: user.horario.entrada, salida: user.horario.salida },
      user.toleranciaMinutos ?? 10
    );

    if (!scheduleCheck.allowed) {
      res.status(403).json({
        success: false,
        message: scheduleCheck.reason,
        code: 'OUTSIDE_WORK_HOURS',
      });
      return;
    }
  }

  // 8. Attach user to request
  req.user = {
    id:       String(user._id),
    tenantId: String(user.tenantId),
    role:     user.role,
    nombre:   user.nombre,
    dominio:  tenant.dominio,
  };

  next();
}
