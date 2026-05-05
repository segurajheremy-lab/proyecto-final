import { Request, Response, NextFunction, RequestHandler } from 'express';
import { hasPermission, Permission } from '../config/permissions';
import { Tenant } from '../models/Tenant.model';

// ---------------------------------------------------------------------------
// authorize — permission guard
// ---------------------------------------------------------------------------

/**
 * Middleware factory that checks whether the authenticated user holds
 * the required permission.
 *
 * Must be used AFTER authenticate().
 *
 * Responds 403 if the user's role does not include the permission.
 *
 * @example
 * router.get('/clients', authenticate, authorize('VIEW_ALL_CLIENTS'), handler)
 */
export function authorize(permission: Permission): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    if (!hasPermission(req.user.role, permission)) {
      res.status(403).json({
        success: false,
        message: `You do not have permission to perform this action.`,
        requiere: permission,
        tuRol: req.user.role,
      });
      return;
    }

    next();
  };
}

// ---------------------------------------------------------------------------
// requireTenant — tenant health guard
// ---------------------------------------------------------------------------

/**
 * Middleware that verifies the authenticated user's tenant is active and,
 * if on trial, that the trial period has not expired.
 *
 * Must be used AFTER authenticate().
 *
 * - 403 if tenant is suspended
 * - 402 if trial has expired
 * - 401 if tenant cannot be found
 */
export async function requireTenant(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user?.tenantId) {
    res.status(401).json({ success: false, message: 'Not authenticated.' });
    return;
  }

  const tenant = await Tenant.findById(req.user.tenantId).lean();

  if (!tenant) {
    res.status(401).json({ success: false, message: 'Tenant not found.' });
    return;
  }

  // Suspended account
  if (tenant.status === 'suspended') {
    res.status(403).json({
      success: false,
      message: 'Cuenta suspendida. Por favor contacta a soporte.',
    });
    return;
  }

  // Trial expired
  if (tenant.status === 'trial' && new Date() > tenant.trialExpira) {
    res.status(402).json({
      success: false,
      message: 'Trial expirado. Por favor actualiza tu plan para continuar.',
    });
    return;
  }

  next();
}
