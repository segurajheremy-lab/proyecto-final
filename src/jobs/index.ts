import cron from 'node-cron';
import { getPeruDateString, getPeruTime } from '../utils/time.util';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JobDefinition {
  /** Human-readable name for logging */
  name: string;
  /**
   * Cron expression in UTC.
   * Peru is UTC-5, so:
   *   23:59 Peru = 04:59 UTC next day  → "59 4 * * *"
   *   23:00 Peru = 04:00 UTC next day  → "0 4 * * *"
   *   every 5 min                      → "* /5 * * * *"
   */
  schedule: string;
  handler: () => Promise<void> | void;
}

// ---------------------------------------------------------------------------
// Logging helpers
// ---------------------------------------------------------------------------

function logStart(name: string): string {
  const ts = getPeruTime().toISOString();
  console.log(`\n⏰ [${ts}] ▶ JOB START: ${name}`);
  return ts;
}

function logEnd(name: string, startTs: string, summary: Record<string, unknown>): void {
  const ts = getPeruTime().toISOString();
  const elapsed = Date.now() - new Date(startTs).getTime();
  console.log(`✅ [${ts}] ■ JOB END: ${name} (${elapsed}ms)`, summary);
}

function logError(name: string, err: unknown): void {
  const ts = getPeruTime().toISOString();
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`❌ [${ts}] ✖ JOB ERROR: ${name} — ${msg}`);
}

// ---------------------------------------------------------------------------
// JOB 1: Registrar faltas automáticas
// Runs at 23:59 Peru time = 04:59 UTC
// ---------------------------------------------------------------------------

async function registrarFaltasAutomaticas(): Promise<void> {
  const startTs = logStart('registrar-faltas-automaticas');

  // Lazy imports to avoid circular dependencies at module load time
  const { User }       = await import('../models/User.model');
  const { Attendance } = await import('../models/Attendance.model');
  const { Tenant }     = await import('../models/Tenant.model');

  const fecha = getPeruDateString();
  let agentesProcessados = 0;
  let faltasRegistradas  = 0;
  let errores            = 0;

  try {
    // Get all active tenants
    const tenants = await Tenant.find({ status: { $in: ['active', 'trial'] } })
      .select('_id')
      .lean();

    for (const tenant of tenants) {
      // Get all active agents in this tenant
      const agentes = await User.find({
        tenantId: tenant._id,
        role:     'agent',
        activo:   true,
      }).select('_id').lean();

      for (const agente of agentes) {
        agentesProcessados++;
        try {
          const existing = await Attendance.findOne({
            tenantId: tenant._id,
            userId:   agente._id,
            fecha,
          });

          // Register falta if no record or still in sin_jornada
          if (!existing || existing.status === 'sin_jornada') {
            await Attendance.findOneAndUpdate(
              { tenantId: tenant._id, userId: agente._id, fecha },
              {
                $setOnInsert: {
                  tenantId: tenant._id,
                  userId:   agente._id,
                  fecha,
                  eventos:  [],
                },
                $set: { status: 'falta' },
              },
              { upsert: true, new: true }
            );
            faltasRegistradas++;
          }
        } catch (agentErr) {
          errores++;
          logError('registrar-faltas [agente]', agentErr);
        }
      }
    }
  } catch (err) {
    logError('registrar-faltas-automaticas', err);
    throw err;
  }

  logEnd('registrar-faltas-automaticas', startTs, {
    fecha,
    agentesProcessados,
    faltasRegistradas,
    errores,
  });
}

// ---------------------------------------------------------------------------
// JOB 2: Enviar reporte diario automático
// Runs at 23:00 Peru time = 04:00 UTC
// ---------------------------------------------------------------------------

async function enviarReporteDiario(): Promise<void> {
  const startTs = logStart('enviar-reporte-diario');

  const { User }   = await import('../models/User.model');
  const { Tenant } = await import('../models/Tenant.model');
  const { generarReporteEjecutivoService, enviarReporteEmailService } =
    await import('../services/report.service');

  const fecha = getPeruDateString();
  let tenantsProcessados = 0;
  let exitosos           = 0;
  let errores            = 0;

  try {
    const tenants = await Tenant.find({ status: { $in: ['active', 'trial'] } }).lean();

    for (const tenant of tenants) {
      tenantsProcessados++;
      try {
        // Find all admins in this tenant
        const admins = await User.find({
          tenantId: tenant._id,
          role:     { $in: ['admin', 'owner'] },
          activo:   true,
        }).lean();

        if (admins.length === 0) continue;

        // Generate executive report for this tenant
        // Use the first admin as the "generator"
        const primerAdmin = admins[0]!;
        const reporte = await generarReporteEjecutivoService(
          String(primerAdmin._id),
          fecha,
          String(tenant._id)
        );

        // Send to all admins
        for (const admin of admins) {
          try {
            await enviarReporteEmailService(reporte, admin.email, 'reporte_ejecutivo');
            exitosos++;
            console.log(`  📧 Reporte enviado a ${admin.email} (${tenant.nombre})`);
          } catch (mailErr) {
            errores++;
            logError(`enviar-reporte-diario [email: ${admin.email}]`, mailErr);
          }
        }
      } catch (tenantErr) {
        errores++;
        logError(`enviar-reporte-diario [tenant: ${tenant.nombre}]`, tenantErr);
      }
    }
  } catch (err) {
    logError('enviar-reporte-diario', err);
    throw err;
  }

  logEnd('enviar-reporte-diario', startTs, {
    fecha,
    tenantsProcessados,
    emailsEnviados: exitosos,
    errores,
  });
}

// ---------------------------------------------------------------------------
// JOB 3: Procesar alertas de sentimiento negativo pendientes
// Runs every 5 minutes
// ---------------------------------------------------------------------------

async function procesarAlertasSentimiento(): Promise<void> {
  const startTs = logStart('procesar-alertas-sentimiento');

  const { Interaction } = await import('../models/Interaction.model');
  const { User }        = await import('../models/User.model');
  const { Client }      = await import('../models/Client.model');
  const { sendMail }    = await import('../utils/mail.util');
  const { config }      = await import('../config/env');

  let procesadas    = 0;
  let alertasEnviadas = 0;
  let errores       = 0;

  try {
    // Find all pending negative interactions
    const interacciones = await Interaction.find({
      alertaEnviada:    false,
      sentimiento:      'negativo',
      sentimientoScore: { $gt: 70 },
    })
      .limit(50) // Process in batches to avoid overloading
      .lean();

    if (interacciones.length === 0) {
      logEnd('procesar-alertas-sentimiento', startTs, { procesadas: 0, alertasEnviadas: 0 });
      return;
    }

    for (const interaccion of interacciones) {
      procesadas++;
      try {
        const [agente, cliente] = await Promise.all([
          User.findById(interaccion.agentId).select('nombre email supervisorId').lean(),
          Client.findById(interaccion.clientId).select('nombre apellido telefono').lean(),
        ]);

        if (!agente || !agente.supervisorId) {
          // No supervisor assigned — mark as sent to avoid reprocessing
          await Interaction.findByIdAndUpdate(interaccion._id, { alertaEnviada: true });
          continue;
        }

        const supervisor = await User.findById(agente.supervisorId)
          .select('nombre email')
          .lean();

        if (!supervisor?.email) {
          await Interaction.findByIdAndUpdate(interaccion._id, { alertaEnviada: true });
          continue;
        }

        const clienteNombre = cliente
          ? `${cliente.nombre} ${cliente.apellido}`
          : 'Cliente desconocido';

        const fichaLink = `${config.FRONTEND_URL}/dashboard/supervisor`;

        await sendMail({
          to:      supervisor.email,
          subject: `⚠️ Alerta: Interacción tensa detectada — ${agente.nombre}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #ef4444; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
                <h2 style="margin: 0;">⚠️ Alerta de Sentimiento Negativo</h2>
                <p style="margin: 4px 0 0; opacity: 0.9; font-size: 13px;">
                  Detectada el ${new Date(interaccion.fecha).toLocaleString('es-PE')}
                </p>
              </div>
              <div style="background: #fff; border: 1px solid #e5e7eb; padding: 24px; border-radius: 0 0 8px 8px;">
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                  <tr>
                    <td style="padding: 8px; font-weight: bold; color: #374151; width: 40%;">Agente</td>
                    <td style="padding: 8px; color: #111827;">${agente.nombre}</td>
                  </tr>
                  <tr style="background: #f9fafb;">
                    <td style="padding: 8px; font-weight: bold; color: #374151;">Cliente</td>
                    <td style="padding: 8px; color: #111827;">${clienteNombre}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; font-weight: bold; color: #374151;">Score de confianza</td>
                    <td style="padding: 8px; color: #ef4444; font-weight: bold;">${interaccion.sentimientoScore}%</td>
                  </tr>
                </table>
                <p style="font-weight: bold; color: #374151; margin-bottom: 8px;">Nota completa del agente:</p>
                <blockquote style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 0 0 16px; border-radius: 0 4px 4px 0; color: #374151;">
                  ${interaccion.nota}
                </blockquote>
                <a href="${fichaLink}" style="display: inline-block; background: #1E3A5F; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                  Ver panel de supervisión →
                </a>
                <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
                  Este mensaje fue generado automáticamente por CallCenter IA.
                </p>
              </div>
            </div>
          `,
          text: `Alerta: Interacción tensa.\nAgente: ${agente.nombre}\nCliente: ${clienteNombre}\nScore: ${interaccion.sentimientoScore}%\nNota: ${interaccion.nota}`,
        });

        // Mark as sent
        await Interaction.findByIdAndUpdate(interaccion._id, { alertaEnviada: true });
        alertasEnviadas++;
        console.log(`  🔔 Alerta enviada a ${supervisor.email} — agente: ${agente.nombre}`);
      } catch (itemErr) {
        errores++;
        logError(`procesar-alertas [interaccion: ${String(interaccion._id)}]`, itemErr);
        // Mark as sent anyway to avoid infinite retry loops on broken records
        await Interaction.findByIdAndUpdate(interaccion._id, { alertaEnviada: true }).catch(() => {});
      }
    }
  } catch (err) {
    logError('procesar-alertas-sentimiento', err);
    throw err;
  }

  logEnd('procesar-alertas-sentimiento', startTs, {
    procesadas,
    alertasEnviadas,
    errores,
  });
}

// ---------------------------------------------------------------------------
// Job registry
// ---------------------------------------------------------------------------

/**
 * All registered job definitions.
 *
 * Cron expressions are in UTC (node-cron default).
 * Peru = UTC-5, so:
 *   23:59 Peru -> 04:59 UTC  -> "59 4 * * *"
 *   23:00 Peru -> 04:00 UTC  -> "0 4 * * *"
 *   every 5 min              -> "star/5 * * * *"
 */
const jobs: JobDefinition[] = [
  {
    name:     'registrar-faltas-automaticas',
    schedule: '59 4 * * *',   // 23:59 Peru (UTC-5)
    handler:  registrarFaltasAutomaticas,
  },
  {
    name:     'enviar-reporte-diario',
    schedule: '0 4 * * *',    // 23:00 Peru (UTC-5)
    handler:  enviarReporteDiario,
  },
  {
    name:     'procesar-alertas-sentimiento',
    schedule: '*/5 * * * *',  // Every 5 minutes
    handler:  procesarAlertasSentimiento,
  },
];

// ---------------------------------------------------------------------------
// Scheduler
// ---------------------------------------------------------------------------

/**
 * Initializes all registered cron jobs.
 * Each job is wrapped with logging and error handling so that a failing
 * handler does not stop future executions.
 *
 * Must be called after the database connection is established.
 */
export function initJobs(): void {
  if (jobs.length === 0) {
    console.log('ℹ️  No cron jobs registered.');
    return;
  }

  jobs.forEach((job) => {
    if (!cron.validate(job.schedule)) {
      console.error(`❌ Invalid cron expression for job "${job.name}": ${job.schedule}`);
      return;
    }

    cron.schedule(job.schedule, async () => {
      try {
        await job.handler();
      } catch (error) {
        // Top-level catch — handler already logged the error, this prevents
        // the cron scheduler from crashing
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`❌ [${getPeruTime().toISOString()}] Unhandled error in job "${job.name}": ${msg}`);
      }
    });

    console.log(`📅 Scheduled job: ${job.name} (${job.schedule} UTC)`);
  });

  console.log(`\n🚀 ${jobs.length} cron jobs initialized.\n`);
}

// ---------------------------------------------------------------------------
// Exports for testing
// ---------------------------------------------------------------------------

export { jobs };
export {
  registrarFaltasAutomaticas,
  enviarReporteDiario,
  procesarAlertasSentimiento,
};
