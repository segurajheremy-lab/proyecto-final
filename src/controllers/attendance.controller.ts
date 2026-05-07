import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Attendance } from '../models/Attendance.model';
import { User } from '../models/User.model';
import { AppError } from '../middlewares/errorHandler.middleware';
import { getPeruDateString, getPeruTime, parseHHMM } from '../utils/time.util';

const eventoSchema = z.object({
  tipo: z.enum(['inicio', 'salida_refrigerio', 'vuelta_refrigerio', 'fin']),
  metodo: z.enum(['manual', 'biometria']).default('manual'),
});

// ---------------------------------------------------------------------------
// POST /api/v1/attendance/evento
// ---------------------------------------------------------------------------

/** Agent marks their own attendance event. Creates the record if it doesn't exist. */
export async function marcarEvento(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);

    const { tipo, metodo } = eventoSchema.parse(req.body);
    const fecha = getPeruDateString();
    const now = new Date();

    const user = await User.findById(req.user.id).lean();
    if (!user) throw new AppError('Usuario no encontrado.', 404);

    // Find or create today's record
    let attendance = await Attendance.findOne({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      fecha,
    });

    if (!attendance) {
      attendance = new Attendance({
        tenantId: req.user.tenantId,
        userId: req.user.id,
        fecha,
        status: 'sin_jornada',
        eventos: [],
      });
    }

    // Validate transition
    const validTransitions: Record<string, string[]> = {
      inicio:            ['sin_jornada', 'falta'],
      salida_refrigerio: ['jornada_activa'],
      vuelta_refrigerio: ['en_refrigerio'],
      fin:               ['jornada_activa', 'post_refrigerio'],
    };

    if (!validTransitions[tipo]?.includes(attendance.status)) {
      throw new AppError(
        `No puedes registrar "${tipo}" cuando el estado es "${attendance.status}".`,
        400
      );
    }

    // Tardiness check on "inicio"
    let tardanza = false;
    let minutosTardanza = 0;

    if (tipo === 'inicio' && user.horario?.entrada) {
      const [horaEntrada, minEntrada] = parseHHMM(user.horario.entrada);
      const tolerancia = user.toleranciaMinutos ?? 10;
      const peruTime = getPeruTime();
      const minutosActual = peruTime.getUTCHours() * 60 + peruTime.getUTCMinutes();
      const minutosEntrada = horaEntrada * 60 + minEntrada + tolerancia;

      if (minutosActual > minutosEntrada) {
        tardanza = true;
        minutosTardanza = minutosActual - (horaEntrada * 60 + minEntrada);
      }
    }

    // Push event
    attendance.eventos.push({ tipo, timestamp: now, metodo });

    // Update status
    const statusMap: Record<string, typeof attendance.status> = {
      inicio:            'jornada_activa',
      salida_refrigerio: 'en_refrigerio',
      vuelta_refrigerio: 'post_refrigerio',
      fin:               'finalizado',
    };
    attendance.status = statusMap[tipo];

    if (tardanza) {
      attendance.tardanza = true;
      attendance.minutosTardanza = minutosTardanza;
    }

    // Calculate hours worked on "fin"
    if (tipo === 'fin') {
      const inicioEvento = attendance.eventos.find((e) => e.tipo === 'inicio');
      if (inicioEvento) {
        const ms = now.getTime() - inicioEvento.timestamp.getTime();
        attendance.horasTrabajadas = Math.round((ms / 3600000) * 100) / 100;
      }

      // Calculate break time
      const salidaRef = attendance.eventos.find((e) => e.tipo === 'salida_refrigerio');
      const vueltaRef = attendance.eventos.find((e) => e.tipo === 'vuelta_refrigerio');
      if (salidaRef && vueltaRef) {
        const msRef = vueltaRef.timestamp.getTime() - salidaRef.timestamp.getTime();
        attendance.minutosRefrigerio = Math.round(msRef / 60000);
      }
    }

    await attendance.save();
    res.status(200).json({ success: true, data: attendance });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/v1/attendance/hoy
// ---------------------------------------------------------------------------

/** Returns today's attendance record for the authenticated user (or null). */
export async function obtenerAsistenciaHoy(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);

    const fecha = getPeruDateString();
    const attendance = await Attendance.findOne({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      fecha,
    }).lean();

    res.status(200).json({ success: true, data: attendance ?? null });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/v1/attendance/historial
// ---------------------------------------------------------------------------

/** Returns the personal attendance history for the authenticated user. */
export async function historialAsistencia(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);

    const { tenantId, id } = req.user;
    const { dias = '30' } = req.query as Record<string, string>;
    const limitDias = Math.min(parseInt(dias) || 30, 90);

    const desde = new Date();
    desde.setDate(desde.getDate() - limitDias);
    const desdeStr = desde.toISOString().split('T')[0];

    const records = await Attendance.find({
      tenantId,
      userId: id,
      fecha: { $gte: desdeStr },
    })
      .sort({ fecha: -1 })
      .lean();

    const total      = records.length;
    const presentes  = records.filter((r) => ['jornada_activa', 'post_refrigerio', 'finalizado'].includes(r.status)).length;
    const tardanzas  = records.filter((r) => r.tardanza).length;
    const faltas     = records.filter((r) => ['falta', 'falta_justificada'].includes(r.status)).length;
    const horasTotales = records.reduce((acc, r) => acc + (r.horasTrabajadas ?? 0), 0);

    res.status(200).json({
      success: true,
      data: {
        records,
        resumen: { total, presentes, tardanzas, faltas, horasTotales: Math.round(horasTotales * 100) / 100 },
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/v1/attendance
// ---------------------------------------------------------------------------

/** Lists attendance records scoped by the caller's role. */
export async function listarAsistencia(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);

    const { role, tenantId, id } = req.user;
    const { fecha, userId } = req.query as Record<string, string>;

    let filter: Record<string, unknown> = { tenantId };

    if (role === 'agent') {
      filter.userId = id;
    } else if (role === 'supervisor') {
      const agents = await User.find({ tenantId, supervisorId: id }).select('_id').lean();
      filter.userId = { $in: agents.map((a) => a._id) };
    }

    if (fecha) filter.fecha = fecha;
    if (userId && role !== 'agent') filter.userId = userId;

    const records = await Attendance.find(filter)
      .populate('userId', 'nombre email role')
      .sort({ fecha: -1, createdAt: -1 })
      .limit(100)
      .lean();

    res.status(200).json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
}
