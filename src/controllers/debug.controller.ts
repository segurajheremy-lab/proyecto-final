import { Request, Response, NextFunction } from 'express';
import { Client } from '../models/Client.model';
import { Interaction } from '../models/Interaction.model';
import { User } from '../models/User.model';
import { Attendance } from '../models/Attendance.model';
import { AuditLog } from '../models/AuditLog.model';
import { AppError } from '../middlewares/errorHandler.middleware';

/**
 * GET /api/v1/debug/collections
 * Returns document counts for each collection in the current tenant.
 * Only available in development environment.
 */
export async function getCollectionCounts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);

    const tenantId = req.user.tenantId;

    // Count documents in each collection for this tenant
    const [clients, interactions, users, attendance, auditLogs] = await Promise.all([
      Client.countDocuments({ tenantId }),
      Interaction.countDocuments({ tenantId }),
      User.countDocuments({ tenantId }),
      Attendance.countDocuments({ tenantId }),
      AuditLog.countDocuments({ tenantId }),
    ]);

    console.log('[getCollectionCounts] Collection counts for tenant:', tenantId, {
      clients,
      interactions,
      users,
      attendance,
      auditLogs,
    });

    res.status(200).json({
      success: true,
      data: {
        tenantId,
        collections: {
          clients,
          interactions,
          users,
          attendance,
          auditLogs,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[getCollectionCounts] Error:', err);
    next(err);
  }
}
