import Anthropic from '@anthropic-ai/sdk';
import { Interaction } from '../models/Interaction.model';
import { Client } from '../models/Client.model';
import { User } from '../models/User.model';
import { AppError } from '../middlewares/errorHandler.middleware';
import { sendMail } from '../utils/mail.util';
import { config } from '../config/env';
import type { CrearInteraccionInput, FiltrosInteraccionInput } from '../validators/interaction.validator';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SentimientoResult {
  sentimiento: 'positivo' | 'neutral' | 'negativo';
  score: number;
  resumen: string;
}

// ---------------------------------------------------------------------------
// 1. analizarSentimientoService
// ---------------------------------------------------------------------------

/**
 * Calls Anthropic Claude to analyze the sentiment of an interaction note.
 * Returns a fallback neutral result if the API call fails.
 */
export async function analizarSentimientoService(nota: string): Promise<SentimientoResult> {
  const FALLBACK: SentimientoResult = {
    sentimiento: 'neutral',
    score: 50,
    resumen: 'Sin análisis disponible',
  };

  try {
    const client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Analiza el siguiente texto de una interacción de call center y determina el sentimiento.
Responde ÚNICAMENTE con un JSON válido sin texto adicional:
{"sentimiento": "positivo" | "neutral" | "negativo", "score": número entre 0 y 100 donde 100 es máxima confianza, "resumen": "Una oración describiendo el tono de la interacción"}

Texto a analizar: ${nota}`,
        },
      ],
    });

    const raw = message.content[0];
    if (raw?.type !== 'text') return FALLBACK;

    // Strip markdown code fences if present
    const cleaned = raw.text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    const parsed = JSON.parse(cleaned) as Partial<SentimientoResult>;

    const sentimiento = parsed.sentimiento;
    const score = parsed.score;
    const resumen = parsed.resumen;

    if (
      !sentimiento ||
      !['positivo', 'neutral', 'negativo'].includes(sentimiento) ||
      typeof score !== 'number' ||
      score < 0 ||
      score > 100 ||
      typeof resumen !== 'string'
    ) {
      return FALLBACK;
    }

    return { sentimiento, score, resumen };
  } catch (err) {
    console.error('[analizarSentimiento] Error calling Anthropic API:', err);
    return FALLBACK;
  }
}

// ---------------------------------------------------------------------------
// 2. crearInteraccionService
// ---------------------------------------------------------------------------

export async function crearInteraccionService(
  data: CrearInteraccionInput,
  agentId: string,
  tenantId: string
) {
  // DEBUG: Log input data
  console.log('[crearInteraccionService] Input data:', { ...data, agentId, tenantId });

  // Verify client belongs to this tenant
  const cliente = await Client.findOne({ _id: data.clientId, tenantId }).lean();
  if (!cliente) throw new AppError('Cliente no encontrado.', 404);

  // Verify agent is assigned to this client
  if (String(cliente.asignadoA) !== agentId) {
    throw new AppError('Solo puedes registrar interacciones de clientes asignados a ti.', 403);
  }

  // Analyze sentiment with Anthropic
  const sentimientoResult = await analizarSentimientoService(data.nota);

  // Determine if alert should be sent
  const esAlerta =
    sentimientoResult.sentimiento === 'negativo' && sentimientoResult.score > 70;

  // Create interaction
  const interaccion = await Interaction.create({
    tenantId,
    clientId:         data.clientId,
    agentId,
    duracionMinutos:  data.duracionMinutos,
    resultado:        data.resultado,
    nota:             data.nota,
    sentimiento:      sentimientoResult.sentimiento,
    sentimientoScore: sentimientoResult.score,
    alertaEnviada:    false, // cron will process if esAlerta
  });

  // Update client's last interaction timestamp
  const clientUpdates: Record<string, unknown> = { ultimaInteraccion: new Date() };

  // Auto-resolve client if agent marked it as resolved
  if (data.resultado === 'resuelto' && cliente.estado === 'pendiente') {
    clientUpdates.estado = 'resuelto';
  }

  await Client.findByIdAndUpdate(data.clientId, { $set: clientUpdates });

  // Send alert email to supervisor if negative sentiment with high confidence
  if (esAlerta && cliente.supervisorId) {
    const [agente, supervisor] = await Promise.all([
      User.findById(agentId).select('nombre email').lean(),
      User.findById(cliente.supervisorId).select('nombre email').lean(),
    ]);

    if (supervisor?.email) {
      // Fire-and-forget — don't block the response
      sendMail({
        to: supervisor.email,
        subject: '⚠️ Alerta: Interacción tensa detectada',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #ef4444; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0;">⚠️ Alerta de Sentimiento Negativo</h2>
            </div>
            <div style="background: #fff; border: 1px solid #e5e7eb; padding: 24px; border-radius: 0 0 8px 8px;">
              <p><strong>Agente:</strong> ${agente?.nombre ?? 'Desconocido'}</p>
              <p><strong>Cliente:</strong> ${cliente.nombre} ${cliente.apellido}</p>
              <p><strong>Score de confianza:</strong> ${sentimientoResult.score}%</p>
              <p><strong>Resumen IA:</strong> ${sentimientoResult.resumen}</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
              <p><strong>Nota completa del agente:</strong></p>
              <blockquote style="background: #f9fafb; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 0; border-radius: 0 4px 4px 0;">
                ${data.nota}
              </blockquote>
              <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">
                Este mensaje fue generado automáticamente por CallCenter IA.
              </p>
            </div>
          </div>
        `,
        text: `Alerta: Interacción tensa detectada.\nAgente: ${agente?.nombre}\nCliente: ${cliente.nombre} ${cliente.apellido}\nResumen: ${sentimientoResult.resumen}\nNota: ${data.nota}`,
      }).catch((err) => {
        console.error('[crearInteraccion] Error sending alert email:', err);
      });

      // Mark alert as sent
      await Interaction.findByIdAndUpdate(interaccion._id, { alertaEnviada: true });
    }
  }

  // Return populated interaction
  const result = await Interaction.findById(interaccion._id)
    .populate('clientId', 'nombre apellido telefono estado')
    .populate('agentId', 'nombre email')
    .lean();

  console.log('[crearInteraccionService] Interaccion created successfully:', result?._id);

  return result;
}

// ---------------------------------------------------------------------------
// 3. listarInteraccionesService
// ---------------------------------------------------------------------------

export async function listarInteraccionesService(
  filtros: FiltrosInteraccionInput,
  userId: string,
  role: string,
  tenantId: string
) {
  const { clientId, agentId, resultado, sentimiento, fechaDesde, fechaHasta, pagina, limite } = filtros;
  const skip = (pagina - 1) * limite;

  // CRITICAL: Base filter — always scoped to tenant BEFORE any other filters
  const filter: Record<string, unknown> = { tenantId };

  // Role-based scope (AFTER tenantId is set)
  if (role === 'agent') {
    filter.agentId = userId;
  } else if (role === 'supervisor') {
    const agentes = await User.find({ tenantId, supervisorId: userId }).select('_id').lean();
    filter.agentId = { $in: agentes.map((a) => a._id) };
  }
  // sub_admin, admin, owner → no additional scope

  // Optional filters
  if (clientId) filter.clientId = clientId;
  if (agentId && role !== 'agent') filter.agentId = agentId;
  if (resultado) filter.resultado = resultado;
  if (sentimiento) filter.sentimiento = sentimiento;

  if (fechaDesde || fechaHasta) {
    const fechaFilter: Record<string, Date> = {};
    if (fechaDesde) fechaFilter.$gte = new Date(fechaDesde);
    if (fechaHasta) fechaFilter.$lte = new Date(fechaHasta);
    filter.fecha = fechaFilter;
  }

  // DEBUG: Log final filter before executing query
  console.log('[listarInteraccionesService] Final filter:', JSON.stringify(filter, null, 2));

  const [interacciones, total] = await Promise.all([
    Interaction.find(filter)
      .populate('clientId', 'nombre apellido telefono estado')
      .populate('agentId', 'nombre email')
      .sort({ fecha: -1 })
      .skip(skip)
      .limit(limite)
      .lean(),
    Interaction.countDocuments(filter),
  ]);

  console.log(`[listarInteraccionesService] Found ${interacciones.length} interactions out of ${total} total`);

  return {
    interacciones,
    total,
    pagina,
    totalPaginas: Math.ceil(total / limite),
  };
}

// ---------------------------------------------------------------------------
// 4. obtenerFichaClienteService
// ---------------------------------------------------------------------------

export async function obtenerFichaClienteService(
  clientId: string,
  userId: string,
  role: string,
  tenantId: string
) {
  // Verify client belongs to tenant
  const cliente = await Client.findOne({ _id: clientId, tenantId })
    .populate('asignadoA', 'nombre email')
    .populate('creadoPor', 'nombre email')
    .lean();

  if (!cliente) throw new AppError('Cliente no encontrado.', 404);

  // Role-based access check
  if (role === 'agent' && String(cliente.asignadoA?._id ?? cliente.asignadoA) !== userId) {
    throw new AppError('No tienes acceso a este cliente.', 403);
  }
  if (role === 'supervisor') {
    const agentes = await User.find({ tenantId, supervisorId: userId }).select('_id').lean();
    const agenteIds = agentes.map((a) => String(a._id));
    const asignadoId = String(cliente.asignadoA?._id ?? cliente.asignadoA ?? '');
    if (asignadoId && !agenteIds.includes(asignadoId)) {
      throw new AppError('No tienes acceso a este cliente.', 403);
    }
  }

  // Last 10 interactions
  const interacciones = await Interaction.find({ tenantId, clientId })
    .populate('agentId', 'nombre')
    .sort({ fecha: -1 })
    .limit(10)
    .lean();

  // Statistics
  const total = interacciones.length;
  const resueltas    = interacciones.filter((i) => i.resultado === 'resuelto').length;
  const pendientes   = interacciones.filter((i) => i.resultado === 'pendiente').length;
  const sinRespuesta = interacciones.filter((i) => i.resultado === 'sin_respuesta').length;
  const callbacks    = interacciones.filter((i) => i.resultado === 'callback').length;

  const conScore = interacciones.filter((i) => i.sentimientoScore !== undefined);
  const scorePromedio = conScore.length > 0
    ? Math.round(conScore.reduce((acc, i) => acc + (i.sentimientoScore ?? 0), 0) / conScore.length)
    : 0;

  const sentimientoCounts = { positivo: 0, neutral: 0, negativo: 0 };
  interacciones.forEach((i) => {
    if (i.sentimiento && i.sentimiento in sentimientoCounts) {
      sentimientoCounts[i.sentimiento as keyof typeof sentimientoCounts]++;
    }
  });
  const sentimientoPromedio = (
    Object.entries(sentimientoCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'neutral'
  ) as 'positivo' | 'neutral' | 'negativo';

  return {
    cliente,
    interacciones,
    estadisticas: {
      totalInteracciones: total,
      resueltas,
      pendientes,
      sinRespuesta,
      callbacks,
      sentimientoPromedio,
      scorePromedio,
    },
  };
}
