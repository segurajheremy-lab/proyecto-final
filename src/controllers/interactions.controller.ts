import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middlewares/errorHandler.middleware';
import { crearInteraccionSchema, filtrosInteraccionSchema } from '../validators/interaction.validator';
import {
  crearInteraccionService,
  listarInteraccionesService,
  obtenerFichaClienteService,
} from '../services/interaction.service';

// ---------------------------------------------------------------------------
// POST /api/v1/interactions
// ---------------------------------------------------------------------------

/**
 * Creates a new interaction for an assigned client.
 * Triggers Anthropic sentiment analysis and sends alert email if negative.
 * Only agents can create interactions.
 */
export async function crearInteraccion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);

    const data = crearInteraccionSchema.parse(req.body);
    
    // DEBUG: Log input data
    console.log('[crearInteraccion] Input data:', { ...data, agentId: req.user.id, tenantId: req.user.tenantId });
    
    const interaccion = await crearInteraccionService(data, req.user.id, req.user.tenantId);

    console.log('[crearInteraccion] Interaccion created successfully:', interaccion?._id);
    res.status(201).json({ success: true, data: interaccion });
  } catch (err) {
    console.error('[crearInteraccion] Error:', err);
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/v1/interactions
// ---------------------------------------------------------------------------

/**
 * Lists interactions filtered by role scope and optional query params.
 * - agent       → only their own
 * - supervisor  → all their agents'
 * - sub_admin+  → all in tenant
 */
export async function listarInteracciones(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);

    const filtros = filtrosInteraccionSchema.parse(req.query);
    const result = await listarInteraccionesService(
      filtros,
      req.user.id,
      req.user.role,
      req.user.tenantId
    );

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/v1/interactions/cliente/:clientId
// ---------------------------------------------------------------------------

/**
 * Returns the full client profile with interaction history and statistics.
 * Access is role-scoped: agent → only assigned, supervisor → their team.
 */
export async function fichaCliente(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);

    const ficha = await obtenerFichaClienteService(
      req.params.clientId,
      req.user.id,
      req.user.role,
      req.user.tenantId
    );

    res.status(200).json({ success: true, data: ficha });
  } catch (err) {
    next(err);
  }
}
