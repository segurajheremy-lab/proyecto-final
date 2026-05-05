import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { User } from '../models/User.model';
import { Tenant } from '../models/Tenant.model';
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

/**
 * Verifies the Bearer JWT, loads the user + tenant from MongoDB,
 * and attaches the authenticated user to req.user.
 *
 * Responds 401 if:
 * - Authorization header is missing or malformed
 * - Token is invalid or expired
 * - User does not exist or is inactive (activo: false)
 * - Tenant does not exist or is suspended
 */
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

  // 5. Load tenant and verify it is active
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

  // 6. Attach user to request
  req.user = {
    id:       String(user._id),
    tenantId: String(user.tenantId),
    role:     user.role,
    nombre:   user.nombre,
    dominio:  tenant.dominio,
  };

  next();
}
