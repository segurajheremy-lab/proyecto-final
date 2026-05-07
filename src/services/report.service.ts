import { User } from '../models/User.model';
import { Attendance } from '../models/Attendance.model';
import { Interaction } from '../models/Interaction.model';
import { Client } from '../models/Client.model';
import { Tenant } from '../models/Tenant.model';
import { AppError } from '../middlewares/errorHandler.middleware';
import { sendMail } from '../utils/mail.util';
import { generarExcelReporte } from '../utils/excel.util';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Extracts HH:MM from a Date event timestamp */
function horaDeEvento(eventos: { tipo: string; timestamp: Date }[], tipo: string): string | null {
  const ev = eventos.find((e) => e.tipo === tipo);
  if (!ev) return null;
  const d = new Date(ev.timestamp);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Calculates sentiment percentages from an array of interactions */
function calcularSentimiento(interacciones: { sentimiento?: string; sentimientoScore?: number }[]) {
  const total = interacciones.length;
  if (total === 0) return { positivo: 0, neutral: 0, negativo: 0, scorePromedio: 0 };

  const counts = { positivo: 0, neutral: 0, negativo: 0 };
  let scoreSum = 0;
  let scoreCount = 0;

  for (const i of interacciones) {
    if (i.sentimiento && i.sentimiento in counts) {
      counts[i.sentimiento as keyof typeof counts]++;
    }
    if (i.sentimientoScore !== undefined) {
      scoreSum += i.sentimientoScore;
      scoreCount++;
    }
  }

  return {
    positivo:     Math.round((counts.positivo / total) * 100),
    neutral:      Math.round((counts.neutral / total) * 100),
    negativo:     Math.round((counts.negativo / total) * 100),
    scorePromedio: scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0,
  };
}

/** Returns the dominant sentiment label */
function sentimientoGeneral(
  positivo: number,
  neutral: number,
  negativo: number
): 'positivo' | 'neutral' | 'negativo' {
  if (positivo >= neutral && positivo >= negativo) return 'positivo';
  if (negativo > positivo && negativo > neutral) return 'negativo';
  return 'neutral';
}

// ---------------------------------------------------------------------------
// NIVEL 1 — Reporte de Agente
// ---------------------------------------------------------------------------

export async function generarReporteAgenteService(
  agentId: string,
  fecha: string,
  supervisorId: string,
  tenantId: string
) {
  // Verify agent belongs to this supervisor
  const [agente, supervisor] = await Promise.all([
    User.findOne({ _id: agentId, tenantId, role: 'agent' }).lean(),
    User.findById(supervisorId).lean(),
  ]);

  if (!agente) throw new AppError('Agente no encontrado.', 404);
  if (!supervisor) throw new AppError('Supervisor no encontrado.', 404);
  if (String(agente.supervisorId) !== supervisorId) {
    throw new AppError('Este agente no reporta a tu supervisión.', 403);
  }

  // Attendance for the day
  const asistencia = await Attendance.findOne({ tenantId, userId: agentId, fecha }).lean();

  // Interactions for the day
  const fechaInicio = new Date(`${fecha}T00:00:00.000Z`);
  const fechaFin    = new Date(`${fecha}T23:59:59.999Z`);

  const interacciones = await Interaction.find({
    tenantId,
    agentId,
    fecha: { $gte: fechaInicio, $lte: fechaFin },
  })
    .populate('clientId', 'nombre apellido telefono estado')
    .lean();

  // Clients attended
  const clientesAtendidos = interacciones.map((i) => {
    const c = i.clientId as unknown as { nombre?: string; apellido?: string; telefono?: string; estado?: string } | null;
    return {
      nombre:            String(c?.nombre ?? ''),
      apellido:          String(c?.apellido ?? ''),
      telefono:          String(c?.telefono ?? ''),
      ultimaInteraccion: i.fecha,
      estado:            String(c?.estado ?? ''),
      resultado:         i.resultado,
    };
  });

  // Alerts (negative score > 70)
  const alertas = interacciones
    .filter((i) => i.sentimiento === 'negativo' && (i.sentimientoScore ?? 0) > 70)
    .map((i) => {
      const c = i.clientId as unknown as { nombre?: string; apellido?: string } | null;
      return {
        clienteNombre:    `${c?.nombre ?? ''} ${c?.apellido ?? ''}`.trim(),
        nota:             i.nota,
        sentimientoScore: i.sentimientoScore ?? 0,
        fecha:            i.fecha,
      };
    });

  // Duration average
  const conDuracion = interacciones.filter((i) => i.duracionMinutos !== undefined);
  const duracionPromedio = conDuracion.length > 0
    ? Math.round(conDuracion.reduce((acc, i) => acc + (i.duracionMinutos ?? 0), 0) / conDuracion.length)
    : 0;

  const sentimiento = calcularSentimiento(interacciones);

  return {
    tipo: 'reporte_agente' as const,
    generadoPor: { nombre: supervisor.nombre, role: supervisor.role },
    agente:      { nombre: agente.nombre, email: agente.email },
    fecha,
    asistencia: {
      status:           asistencia?.status ?? 'sin_jornada',
      horaEntrada:      asistencia ? horaDeEvento(asistencia.eventos, 'inicio') : null,
      horaSalida:       asistencia ? horaDeEvento(asistencia.eventos, 'fin') : null,
      tardanza:         asistencia?.tardanza ?? false,
      minutosTardanza:  asistencia?.minutosTardanza ?? 0,
      horasTrabajadas:  asistencia?.horasTrabajadas ?? 0,
      minutosRefrigerio: asistencia?.minutosRefrigerio ?? 0,
    },
    interacciones: {
      total:           interacciones.length,
      resueltas:       interacciones.filter((i) => i.resultado === 'resuelto').length,
      pendientes:      interacciones.filter((i) => i.resultado === 'pendiente').length,
      sinRespuesta:    interacciones.filter((i) => i.resultado === 'sin_respuesta').length,
      callbacks:       interacciones.filter((i) => i.resultado === 'callback').length,
      duracionPromedio,
    },
    sentimiento,
    alertas,
    clientes: clientesAtendidos,
  };
}

// ---------------------------------------------------------------------------
// NIVEL 2 — Reporte de Área
// ---------------------------------------------------------------------------

export async function generarReporteAreaService(
  subAdminId: string,
  fecha: string,
  tenantId: string
) {
  const subAdmin = await User.findOne({ _id: subAdminId, tenantId }).lean();
  if (!subAdmin) throw new AppError('Sub Admin no encontrado.', 404);

  // Get supervisors under this sub_admin
  const supervisores = await User.find({ tenantId, subAdminId, role: 'supervisor' }).lean();

  const fechaInicio = new Date(`${fecha}T00:00:00.000Z`);
  const fechaFin    = new Date(`${fecha}T23:59:59.999Z`);

  const resumenSupervisores = await Promise.all(
    supervisores.map(async (sup) => {
      const agentes = await User.find({ tenantId, supervisorId: String(sup._id), role: 'agent' }).lean();
      const agenteIds = agentes.map((a) => a._id);

      const [asistencias, interacciones] = await Promise.all([
        Attendance.find({ tenantId, userId: { $in: agenteIds }, fecha }).lean(),
        Interaction.find({ tenantId, agentId: { $in: agenteIds }, fecha: { $gte: fechaInicio, $lte: fechaFin } }).lean(),
      ]);

      const presentes  = asistencias.filter((a) => ['jornada_activa', 'post_refrigerio', 'finalizado'].includes(a.status)).length;
      const faltas     = asistencias.filter((a) => ['falta', 'falta_justificada'].includes(a.status)).length;
      const tardanzas  = asistencias.filter((a) => a.tardanza).length;
      const resueltas  = interacciones.filter((i) => i.resultado === 'resuelto').length;
      const alertas    = interacciones.filter((i) => i.sentimiento === 'negativo' && (i.sentimientoScore ?? 0) > 70).length;
      const sentimiento = calcularSentimiento(interacciones);

      return {
        supervisor:          { nombre: sup.nombre, email: sup.email },
        totalAgentes:        agentes.length,
        presentes,
        faltas,
        tardanzas,
        totalInteracciones:  interacciones.length,
        resueltas,
        tasaResolucion:      interacciones.length > 0 ? Math.round((resueltas / interacciones.length) * 100) : 0,
        sentimientoPromedio: sentimientoGeneral(sentimiento.positivo, sentimiento.neutral, sentimiento.negativo),
        alertas,
      };
    })
  );

  // Totals
  const totales = resumenSupervisores.reduce(
    (acc, s) => ({
      agentes:       acc.agentes + s.totalAgentes,
      presentes:     acc.presentes + s.presentes,
      faltas:        acc.faltas + s.faltas,
      tardanzas:     acc.tardanzas + s.tardanzas,
      interacciones: acc.interacciones + s.totalInteracciones,
      resueltas:     acc.resueltas + s.resueltas,
      alertasCriticas: acc.alertasCriticas + s.alertas,
    }),
    { agentes: 0, presentes: 0, faltas: 0, tardanzas: 0, interacciones: 0, resueltas: 0, alertasCriticas: 0 }
  );

  const tasaResolucion = totales.interacciones > 0
    ? Math.round((totales.resueltas / totales.interacciones) * 100)
    : 0;

  // Overall sentiment
  const allInteracciones = await Interaction.find({
    tenantId,
    fecha: { $gte: fechaInicio, $lte: fechaFin },
  }).lean();
  const sentGlobal = calcularSentimiento(allInteracciones);

  return {
    tipo: 'reporte_area' as const,
    generadoPor: { nombre: subAdmin.nombre, role: subAdmin.role },
    area:        `Área de ${subAdmin.nombre}`,
    fecha,
    resumenSupervisores,
    totales: {
      ...totales,
      tasaResolucion,
      sentimientoGeneral: sentimientoGeneral(sentGlobal.positivo, sentGlobal.neutral, sentGlobal.negativo),
    },
  };
}

// ---------------------------------------------------------------------------
// NIVEL 3 — Reporte Ejecutivo
// ---------------------------------------------------------------------------

export async function generarReporteEjecutivoService(
  adminId: string,
  fecha: string,
  tenantId: string
) {
  const [admin, tenant] = await Promise.all([
    User.findById(adminId).lean(),
    Tenant.findById(tenantId).lean(),
  ]);

  if (!admin) throw new AppError('Admin no encontrado.', 404);
  if (!tenant) throw new AppError('Tenant no encontrado.', 404);

  const fechaInicio = new Date(`${fecha}T00:00:00.000Z`);
  const fechaFin    = new Date(`${fecha}T23:59:59.999Z`);

  // Sub admins
  const subAdmins = await User.find({ tenantId, role: 'sub_admin' }).lean();

  const resumenAreas = await Promise.all(
    subAdmins.map(async (sa) => {
      const supervisores = await User.find({ tenantId, subAdminId: String(sa._id) }).lean();
      const supIds = supervisores.map((s) => s._id);
      const agentes = await User.find({ tenantId, supervisorId: { $in: supIds }, role: 'agent' }).lean();
      const agenteIds = agentes.map((a) => a._id);

      const [asistencias, interacciones] = await Promise.all([
        Attendance.find({ tenantId, userId: { $in: agenteIds }, fecha }).lean(),
        Interaction.find({ tenantId, agentId: { $in: agenteIds }, fecha: { $gte: fechaInicio, $lte: fechaFin } }).lean(),
      ]);

      const presentes = asistencias.filter((a) => ['jornada_activa', 'post_refrigerio', 'finalizado'].includes(a.status)).length;
      const resueltas = interacciones.filter((i) => i.resultado === 'resuelto').length;
      const alertas   = interacciones.filter((i) => i.sentimiento === 'negativo' && (i.sentimientoScore ?? 0) > 70).length;
      const sent      = calcularSentimiento(interacciones);

      return {
        subAdmin:           { nombre: sa.nombre, email: sa.email },
        totalSupervisores:  supervisores.length,
        totalAgentes:       agentes.length,
        presentes,
        interacciones:      interacciones.length,
        resueltas,
        tasaResolucion:     interacciones.length > 0 ? Math.round((resueltas / interacciones.length) * 100) : 0,
        sentimientoPromedio: sentimientoGeneral(sent.positivo, sent.neutral, sent.negativo),
        alertasCriticas:    alertas,
      };
    })
  );

  // Global KPIs
  const [totalAgentes, asistenciasHoy, interaccionesHoy, clientesAtendidos] = await Promise.all([
    User.countDocuments({ tenantId, role: 'agent', activo: true }),
    Attendance.find({ tenantId, fecha }).lean(),
    Interaction.find({ tenantId, fecha: { $gte: fechaInicio, $lte: fechaFin } }).lean(),
    Client.countDocuments({ tenantId, ultimaInteraccion: { $gte: fechaInicio, $lte: fechaFin } }),
  ]);

  const presentesHoy = asistenciasHoy.filter((a) => ['jornada_activa', 'post_refrigerio', 'finalizado'].includes(a.status)).length;
  const resueltasHoy = interaccionesHoy.filter((i) => i.resultado === 'resuelto').length;
  const alertasCriticas = interaccionesHoy.filter((i) => i.sentimiento === 'negativo' && (i.sentimientoScore ?? 0) > 70).length;
  const sentGlobal = calcularSentimiento(interaccionesHoy);

  // Tendencia: compare with yesterday
  const ayer = new Date(fecha);
  ayer.setDate(ayer.getDate() - 1);
  const ayerStr = ayer.toISOString().split('T')[0];
  const interaccionesAyer = await Interaction.find({
    tenantId,
    fecha: { $gte: new Date(`${ayerStr}T00:00:00.000Z`), $lte: new Date(`${ayerStr}T23:59:59.999Z`) },
  }).lean();

  const sentAyer = calcularSentimiento(interaccionesAyer);
  let tendencia: 'mejorando' | 'estable' | 'deteriorando' = 'estable';
  if (sentGlobal.positivo > sentAyer.positivo + 5) tendencia = 'mejorando';
  else if (sentGlobal.negativo > sentAyer.negativo + 5) tendencia = 'deteriorando';

  return {
    tipo: 'reporte_ejecutivo' as const,
    empresa:     { nombre: tenant.nombre, plan: tenant.plan },
    generadoPor: { nombre: admin.nombre },
    fecha,
    resumenAreas,
    kpis: {
      tasaAsistencia:    totalAgentes > 0 ? Math.round((presentesHoy / totalAgentes) * 100) : 0,
      tasaResolucion:    interaccionesHoy.length > 0 ? Math.round((resueltasHoy / interaccionesHoy.length) * 100) : 0,
      sentimientoGeneral: sentimientoGeneral(sentGlobal.positivo, sentGlobal.neutral, sentGlobal.negativo),
      alertasCriticas,
      agentesActivos:    presentesHoy,
      clientesAtendidos,
    },
    tendencia,
  };
}

// ---------------------------------------------------------------------------
// Excel generation
// ---------------------------------------------------------------------------

export async function generarExcelReporteService(
  reporte: Awaited<ReturnType<typeof generarReporteAgenteService>>
    | Awaited<ReturnType<typeof generarReporteAreaService>>
    | Awaited<ReturnType<typeof generarReporteEjecutivoService>>,
  tipo: 'reporte_agente' | 'reporte_area' | 'reporte_ejecutivo'
): Promise<Buffer> {
  return generarExcelReporte(reporte, tipo);
}

// ---------------------------------------------------------------------------
// Email sending
// ---------------------------------------------------------------------------

export async function enviarReporteEmailService(
  reporte: Awaited<ReturnType<typeof generarReporteAgenteService>>
    | Awaited<ReturnType<typeof generarReporteAreaService>>
    | Awaited<ReturnType<typeof generarReporteEjecutivoService>>,
  destinatarioEmail: string,
  tipo: 'reporte_agente' | 'reporte_area' | 'reporte_ejecutivo'
): Promise<void> {
  const buffer = await generarExcelReporte(reporte, tipo);

  const asuntos: Record<string, string> = {
    reporte_agente:    `📊 Reporte de Agente - ${(reporte as { agente?: { nombre: string } }).agente?.nombre ?? ''} - ${reporte.fecha}`,
    reporte_area:      `📊 Reporte de Área - ${reporte.fecha}`,
    reporte_ejecutivo: `📊 Reporte Ejecutivo - ${(reporte as { empresa?: { nombre: string } }).empresa?.nombre ?? ''} - ${reporte.fecha}`,
  };

  const transporter = (await import('nodemailer')).default.createTransport({
    host:   (await import('../config/env')).config.MAIL_HOST,
    port:   (await import('../config/env')).config.MAIL_PORT,
    secure: (await import('../config/env')).config.MAIL_PORT === 465,
    auth: {
      user: (await import('../config/env')).config.MAIL_USER,
      pass: (await import('../config/env')).config.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from:    (await import('../config/env')).config.MAIL_FROM,
    to:      destinatarioEmail,
    subject: asuntos[tipo] ?? `📊 Reporte - ${reporte.fecha}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1E3A5F; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">📊 ${asuntos[tipo]}</h2>
        </div>
        <div style="background: #fff; border: 1px solid #e5e7eb; padding: 24px; border-radius: 0 0 8px 8px;">
          <p>Adjunto encontrarás el reporte en formato Excel.</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">
            Generado automáticamente por CallCenter IA.
          </p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename:    `${tipo}-${reporte.fecha}.xlsx`,
        content:     buffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    ],
  });
}
