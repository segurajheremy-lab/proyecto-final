import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.model';
import { Attendance } from '../models/Attendance.model';
import { Interaction } from '../models/Interaction.model';
import { Client } from '../models/Client.model';
import { Tenant } from '../models/Tenant.model';
import { AppError } from '../middlewares/errorHandler.middleware';
import { getPeruDateString } from '../utils/time.util';

/** GET /api/v1/stats/resumen — role-scoped summary */
export async function getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);

    const { role, tenantId, id } = req.user;
    const today = getPeruDateString();

    // Agent: only their own data
    if (role === 'agent') {
      const [asistenciaHoy, interaccionesHoy] = await Promise.all([
        Attendance.findOne({ tenantId, userId: id, fecha: today }).lean(),
        Interaction.countDocuments({ tenantId, agentId: id, fecha: { $gte: new Date(today) } }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          role,
          asistenciaHoy: asistenciaHoy?.status ?? 'sin_jornada',
          interaccionesHoy,
        },
      });
      return;
    }

    // Supervisor: their team
    if (role === 'supervisor') {
      const agents = await User.find({ tenantId, supervisorId: id, activo: true }).select('_id').lean();
      const agentIds = agents.map((a) => a._id);

      const [presentesHoy, interaccionesHoy, clientesActivos] = await Promise.all([
        Attendance.countDocuments({ tenantId, userId: { $in: agentIds }, fecha: today, status: { $in: ['jornada_activa', 'post_refrigerio', 'finalizado'] } }),
        Interaction.countDocuments({ tenantId, agentId: { $in: agentIds }, fecha: { $gte: new Date(today) } }),
        Client.countDocuments({ tenantId, asignadoA: { $in: agentIds }, estado: 'activo' }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          role,
          totalAgentes: agents.length,
          presentesHoy,
          interaccionesHoy,
          clientesActivos,
        },
      });
      return;
    }

    // Owner / Admin / Sub Admin: full tenant stats
    const [
      totalUsuarios,
      usuariosActivos,
      agentes,
      interaccionesHoy,
      interaccionesMes,
      clientesTotal,
      asistenciaHoy,
      sentimientoStats,
      tenant,
    ] = await Promise.all([
      User.countDocuments({ tenantId }),
      User.countDocuments({ tenantId, activo: true }),
      User.countDocuments({ tenantId, role: 'agent', activo: true }),
      Interaction.countDocuments({ tenantId, fecha: { $gte: new Date(today) } }),
      Interaction.countDocuments({
        tenantId,
        fecha: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      }),
      Client.countDocuments({ tenantId }),
      Attendance.countDocuments({ tenantId, fecha: today, status: { $in: ['jornada_activa', 'post_refrigerio', 'finalizado'] } }),
      Interaction.aggregate([
        { $match: { tenantId: { $toString: tenantId }, fecha: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } },
        { $group: { _id: '$sentimiento', count: { $sum: 1 } } },
      ]),
      Tenant.findById(tenantId).lean(),
    ]);

    const sentimiento = { positivo: 0, neutral: 0, negativo: 0 };
    sentimientoStats.forEach((s: { _id: string; count: number }) => {
      if (s._id in sentimiento) sentimiento[s._id as keyof typeof sentimiento] = s.count;
    });

    const trialDaysLeft = tenant
      ? Math.max(0, Math.ceil((new Date(tenant.trialExpira).getTime() - Date.now()) / 86400000))
      : 0;

    res.status(200).json({
      success: true,
      data: {
        role,
        totalUsuarios,
        usuariosActivos,
        agentes,
        interaccionesHoy,
        interaccionesMes,
        clientesTotal,
        asistenciaHoy,
        sentimiento,
        plan: tenant?.plan ?? 'trial',
        trialDaysLeft,
        agentesLimit: tenant?.agentesLimit ?? 10,
        colores: tenant?.colores ?? { primario: '#3B82F6', secundario: '#1E293B' },
      },
    });
  } catch (err) { next(err); }
}

/** GET /api/v1/stats/dashboard — owner/admin full dashboard */
export async function getOwnerStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);

    const { tenantId } = req.user;
    const today = getPeruDateString();

    // Last 7 days attendance rate
    const last7Days: { fecha: string; presentes: number; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const fechaStr = d.toISOString().split('T')[0];
      const [presentes, total] = await Promise.all([
        Attendance.countDocuments({ tenantId, fecha: fechaStr, status: { $in: ['jornada_activa', 'post_refrigerio', 'finalizado'] } }),
        User.countDocuments({ tenantId, role: 'agent', activo: true }),
      ]);
      last7Days.push({ fecha: fechaStr, presentes, total });
    }

    // Sentiment last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sentimientoRaw = await Interaction.aggregate([
      { $match: { tenantId, fecha: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$sentimiento', count: { $sum: 1 } } },
    ]);

    const sentimiento = { positivo: 0, neutral: 0, negativo: 0 };
    sentimientoRaw.forEach((s: { _id: string; count: number }) => {
      if (s._id && s._id in sentimiento) sentimiento[s._id as keyof typeof sentimiento] = s.count;
    });

    res.status(200).json({
      success: true,
      data: { asistenciaSemanal: last7Days, sentimiento },
    });
  } catch (err) { next(err); }
}
