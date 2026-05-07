import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { Tenant } from '../models/Tenant.model';
import { User } from '../models/User.model';
import { Interaction } from '../models/Interaction.model';
import { Client } from '../models/Client.model';
import { AuditLog } from '../models/AuditLog.model';
import { AppError } from '../middlewares/errorHandler.middleware';
import { Types } from 'mongoose';

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

const filtrosTenantSchema = z.object({
  status:   z.enum(['active', 'suspended', 'trial']).optional(),
  plan:     z.enum(['trial', 'starter', 'pro', 'enterprise']).optional(),
  busqueda: z.string().max(100).trim().optional(),
  pagina:   z.coerce.number().int().min(1).default(1),
  limite:   z.coerce.number().int().min(1).max(100).default(20),
});

const updateStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'trial']),
});

const updatePlanSchema = z.object({
  plan:         z.enum(['trial', 'starter', 'pro', 'enterprise']),
  agentesLimit: z.coerce.number().int().min(1).max(10000),
});

const resetPasswordSchema = z.object({
  nuevaPassword: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/\d/, 'La contraseña debe contener al menos un número'),
});

// ---------------------------------------------------------------------------
// GET /api/v1/superadmin/tenants
// ---------------------------------------------------------------------------

export async function listarTenants(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);

    const { status, plan, busqueda, pagina, limite } = filtrosTenantSchema.parse(req.query);
    const skip = (pagina - 1) * limite;

    const filter: Record<string, unknown> = {};
    if (status)   filter.status = status;
    if (plan)     filter.plan   = plan;
    if (busqueda) {
      const regex = new RegExp(busqueda.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ nombre: regex }, { dominio: regex }];
    }

    const [tenants, total] = await Promise.all([
      Tenant.find(filter)
        .select('nombre dominio plan status agentesLimit creadoEn trialExpira createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limite)
        .lean(),
      Tenant.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        tenants,
        total,
        pagina,
        totalPaginas: Math.ceil(total / limite),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/v1/superadmin/tenants/:id
// ---------------------------------------------------------------------------

export async function obtenerTenant(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);

    const tenant = await Tenant.findById(req.params.id).lean();
    if (!tenant) throw new AppError('Tenant no encontrado.', 404);

    const tenantId = tenant._id;

    const [totalUsers, totalAgentes, totalClientes, totalInteracciones] = await Promise.all([
      User.countDocuments({ tenantId }),
      User.countDocuments({ tenantId, role: 'agent', activo: true }),
      Client.countDocuments({ tenantId }),
      Interaction.countDocuments({ tenantId }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...tenant,
        estadisticas: { totalUsers, totalAgentes, totalClientes, totalInteracciones },
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/superadmin/tenants/:id/status
// ---------------------------------------------------------------------------

export async function actualizarStatusTenant(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);

    const { status } = updateStatusSchema.parse(req.body);

    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, runValidators: true }
    ).lean();

    if (!tenant) throw new AppError('Tenant no encontrado.', 404);

    // If suspended, deactivate all users in that tenant
    if (status === 'suspended') {
      await User.updateMany({ tenantId: req.params.id }, { $set: { activo: false } });
    }

    // If reactivated, reactivate all users
    if (status === 'active' || status === 'trial') {
      await User.updateMany({ tenantId: req.params.id }, { $set: { activo: true } });
    }

    await AuditLog.create({
      tenantId:    req.params.id,
      adminId:     req.user.id,
      accion:      'UPDATE_TENANT_STATUS',
      coleccion:   'tenants',
      documentoId: new Types.ObjectId(req.params.id),
      cambios:     { despues: { status } },
      razon:       `Status del tenant actualizado a "${status}" por super_admin`,
    });

    res.status(200).json({ success: true, data: tenant });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/superadmin/tenants/:id/plan
// ---------------------------------------------------------------------------

export async function actualizarPlanTenant(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);

    const { plan, agentesLimit } = updatePlanSchema.parse(req.body);

    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { $set: { plan, agentesLimit } },
      { new: true, runValidators: true }
    ).lean();

    if (!tenant) throw new AppError('Tenant no encontrado.', 404);

    await AuditLog.create({
      tenantId:    req.params.id,
      adminId:     req.user.id,
      accion:      'UPDATE_TENANT_PLAN',
      coleccion:   'tenants',
      documentoId: new Types.ObjectId(req.params.id),
      cambios:     { despues: { plan, agentesLimit } },
      razon:       `Plan del tenant actualizado a "${plan}" (límite: ${agentesLimit}) por super_admin`,
    });

    res.status(200).json({ success: true, data: tenant });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/v1/superadmin/stats
// ---------------------------------------------------------------------------

export async function statsGlobales(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);

    const [
      totalTenants,
      tenantsActivos,
      tenantsSuspendidos,
      totalUsuarios,
      totalAgentes,
      totalInteracciones,
      tenantsPorPlan,
    ] = await Promise.all([
      Tenant.countDocuments(),
      Tenant.countDocuments({ status: { $in: ['active', 'trial'] } }),
      Tenant.countDocuments({ status: 'suspended' }),
      User.countDocuments(),
      User.countDocuments({ role: 'agent', activo: true }),
      Interaction.countDocuments(),
      Tenant.aggregate([
        { $group: { _id: '$plan', count: { $sum: 1 } } },
      ]),
    ]);

    const planCounts: Record<string, number> = { trial: 0, starter: 0, pro: 0, enterprise: 0 };
    (tenantsPorPlan as { _id: string; count: number }[]).forEach(({ _id, count }) => {
      if (_id in planCounts) planCounts[_id] = count;
    });

    res.status(200).json({
      success: true,
      data: {
        totalTenants,
        tenantsActivos,
        tenantsSuspendidos,
        totalUsuarios,
        totalAgentes,
        totalInteracciones,
        tenantsPorPlan: planCounts,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/superadmin/tenants/:id/reset-owner-password
// ---------------------------------------------------------------------------

export async function resetOwnerPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);

    const { nuevaPassword } = resetPasswordSchema.parse(req.body);

    // Find the owner of this tenant
    const owner = await User.findOne({ tenantId: req.params.id, role: 'owner' });
    if (!owner) throw new AppError('No se encontró el owner de este tenant.', 404);

    // Hash new password
    const passwordHash = await bcrypt.hash(nuevaPassword, 12);
    owner.passwordHash = passwordHash;
    await owner.save();

    // Audit log
    await AuditLog.create({
      tenantId:    req.params.id,
      adminId:     req.user.id,
      accion:      'RESET_OWNER_PASSWORD',
      coleccion:   'users',
      documentoId: owner._id,
      cambios:     { despues: { passwordHash: '[REDACTED]' } },
      razon:       'Reset de contraseña por soporte (super_admin)',
    });

    res.status(200).json({
      success: true,
      message: `Contraseña del owner "${owner.nombre}" actualizada correctamente.`,
    });
  } catch (err) {
    next(err);
  }
}
