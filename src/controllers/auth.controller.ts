import { Request, Response, NextFunction } from 'express';
import {
  registroEmpresaSchema,
  loginSchema,
  invitacionSchema,
  generarInvitacionSchema,
} from '../validators/auth.validator';
import {
  registrarEmpresaService,
  loginService,
  generarInvitacionService,
  aceptarInvitacionService,
} from '../services/auth.service';
import { AppError } from '../middlewares/errorHandler.middleware';
import { canManageRole, Role } from '../config/permissions';
import { User } from '../models/User.model';

// ---------------------------------------------------------------------------
// POST /api/auth/registro
// ---------------------------------------------------------------------------

/**
 * Public — registers a new company (tenant) and its owner user.
 */
export async function registrarEmpresa(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = registroEmpresaSchema.parse(req.body);
    const result = await registrarEmpresaService(data);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------

/**
 * Public — authenticates a user and returns a session token.
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = loginSchema.parse(req.body);
    const result = await loginService(data);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/invitar
// ---------------------------------------------------------------------------

/**
 * Protected — generates an invitation link for a new user.
 * The caller must have the appropriate permission for the target role.
 */
export async function generarInvitacion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('No autenticado.', 401);
    }

    const { email, role: targetRole } = generarInvitacionSchema.parse(req.body);

    // Enforce hierarchy at controller level (service also checks, belt-and-suspenders)
    if (!canManageRole(req.user.role, targetRole as Role)) {
      throw new AppError(
        `Tu rol (${req.user.role}) no puede invitar usuarios con rol "${targetRole}".`,
        403
      );
    }

    const result = await generarInvitacionService(
      req.user.id,
      req.user.tenantId,
      targetRole as Role,
      email
    );

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/aceptar-invitacion
// ---------------------------------------------------------------------------

/**
 * Public — accepts an invitation token and creates the user account.
 */
export async function aceptarInvitacion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = invitacionSchema.parse(req.body);
    const result = await aceptarInvitacionService(data);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------

/**
 * Protected — returns the full profile of the authenticated user.
 */
export async function me(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('No autenticado.', 401);
    }

    const user = await User.findById(req.user.id)
      .select('-passwordHash')
      .lean();

    if (!user) {
      throw new AppError('Usuario no encontrado.', 404);
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}
