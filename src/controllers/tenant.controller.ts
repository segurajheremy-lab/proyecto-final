import { Request, Response, NextFunction } from 'express';
import { Tenant } from '../models/Tenant.model';
import { AppError } from '../middlewares/errorHandler.middleware';
import { z } from 'zod';

const updateTenantSchema = z.object({
  nombre:       z.string().min(2).trim().optional(),
  logo:         z.string().url().optional().or(z.literal('')),
  agentesLimit: z.coerce.number().int().min(1).max(500).optional(),
  colores: z.object({
    primario:   z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido'),
    secundario: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido'),
  }).optional(),
});

/** GET /api/v1/tenants/mio — returns the authenticated user's tenant */
export async function getMiTenant(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);

    const tenant = await Tenant.findById(req.user.tenantId).lean();
    if (!tenant) throw new AppError('Tenant no encontrado.', 404);

    res.status(200).json({ success: true, data: tenant });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/v1/tenants/mio — updates nombre, logo, colores, agentesLimit */
export async function updateMiTenant(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);

    // Only owner can update tenant settings
    if (req.user.role !== 'owner' && req.user.role !== 'super_admin') {
      throw new AppError('Solo el owner puede modificar la configuración de la empresa.', 403);
    }

    const updates = updateTenantSchema.parse(req.body);

    const tenant = await Tenant.findByIdAndUpdate(
      req.user.tenantId,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!tenant) throw new AppError('Tenant no encontrado.', 404);

    res.status(200).json({ success: true, data: tenant });
  } catch (err) {
    next(err);
  }
}
