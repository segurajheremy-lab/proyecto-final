import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { User } from '../models/User.model';
import { AppError } from '../middlewares/errorHandler.middleware';

const updateUserSchema = z.object({
  nombre:            z.string().min(2).trim().optional(),
  toleranciaMinutos: z.coerce.number().int().min(0).max(60).optional(),
  supervisorId:      z.string().optional().nullable(),
  subAdminId:        z.string().optional().nullable(),
  horario: z.object({
    entrada:          z.string().regex(/^\d{2}:\d{2}$/).optional(),
    salidaRefrigerio: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    vueltaRefrigerio: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    salida:           z.string().regex(/^\d{2}:\d{2}$/).optional(),
  }).optional(),
});

/** GET /api/v1/users — list users in the tenant, scoped by role */
export async function listarUsuarios(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);

    const { role, tenantId, id } = req.user;
    let query: Record<string, unknown> = { tenantId };

    // sub_admin only sees users under their scope
    if (role === 'sub_admin') {
      query = { tenantId, $or: [{ subAdminId: id }, { supervisorId: { $exists: false } }] };
    }
    // supervisor only sees their agents
    if (role === 'supervisor') {
      query = { tenantId, supervisorId: id };
    }

    const users = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: users });
  } catch (err) { next(err); }
}

/** GET /api/v1/users/:id */
export async function obtenerUsuario(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);

    const user = await User.findOne({ _id: req.params.id, tenantId: req.user.tenantId })
      .select('-passwordHash')
      .lean();

    if (!user) throw new AppError('Usuario no encontrado.', 404);
    res.status(200).json({ success: true, data: user });
  } catch (err) { next(err); }
}

/** PATCH /api/v1/users/:id */
export async function actualizarUsuario(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);

    const updates = updateUserSchema.parse(req.body);

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-passwordHash').lean();

    if (!user) throw new AppError('Usuario no encontrado.', 404);
    res.status(200).json({ success: true, data: user });
  } catch (err) { next(err); }
}

/** PATCH /api/v1/users/:id/desactivar */
export async function desactivarUsuario(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { $set: { activo: false } },
      { new: true }
    ).select('-passwordHash').lean();

    if (!user) throw new AppError('Usuario no encontrado.', 404);
    res.status(200).json({ success: true, data: user });
  } catch (err) { next(err); }
}

/** PATCH /api/v1/users/:id/activar */
export async function activarUsuario(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { $set: { activo: true } },
      { new: true }
    ).select('-passwordHash').lean();

    if (!user) throw new AppError('Usuario no encontrado.', 404);
    res.status(200).json({ success: true, data: user });
  } catch (err) { next(err); }
}
