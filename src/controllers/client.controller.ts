import { Request, Response, NextFunction } from 'express';
import {
  crearClienteSchema,
  actualizarClienteSchema,
  filtrosClienteSchema,
  asignarClienteSchema,
  cambiarEstadoSchema,
} from '../validators/client.validator';
import {
  crearClienteService,
  listarClientesService,
  obtenerClienteService,
  actualizarClienteService,
  asignarClienteService,
  cambiarEstadoClienteService,
  eliminarClienteService,
} from '../services/client.service';
import { AppError } from '../middlewares/errorHandler.middleware';

// ---------------------------------------------------------------------------
// POST /api/v1/clients
// ---------------------------------------------------------------------------

/** Creates a new client. Only supervisors can create clients. */
export async function crearCliente(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);

    const data = crearClienteSchema.parse(req.body);
    
    // DEBUG: Log input data
    console.log('[crearCliente] Input data:', { ...data, tenantId: req.user.tenantId, creadorId: req.user.id });
    
    const cliente = await crearClienteService(data, req.user.id, req.user.tenantId);

    console.log('[crearCliente] Cliente created successfully:', cliente?._id);
    res.status(201).json({ success: true, data: cliente });
  } catch (err) {
    console.error('[crearCliente] Error:', err);
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/v1/clients
// ---------------------------------------------------------------------------

/** Lists clients filtered by role scope and optional query params. */
export async function listarClientes(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);

    const filtros = filtrosClienteSchema.parse(req.query);
    const result = await listarClientesService(
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
// GET /api/v1/clients/:id
// ---------------------------------------------------------------------------

/** Returns a single client with full details + last 5 interactions. */
export async function obtenerCliente(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);

    const cliente = await obtenerClienteService(
      req.params.id,
      req.user.id,
      req.user.role,
      req.user.tenantId
    );

    res.status(200).json({ success: true, data: cliente });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/clients/:id
// ---------------------------------------------------------------------------

/** Updates a client. Field restrictions enforced by role in the service. */
export async function actualizarCliente(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);

    const data = actualizarClienteSchema.parse(req.body);
    const cliente = await actualizarClienteService(
      req.params.id,
      data,
      req.user.id,
      req.user.role,
      req.user.tenantId
    );

    res.status(200).json({ success: true, data: cliente });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/clients/:id/asignar
// ---------------------------------------------------------------------------

/** Assigns or reassigns a client to an agent. Only supervisors. */
export async function asignarCliente(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);

    const { agenteId } = asignarClienteSchema.parse(req.body);
    const cliente = await asignarClienteService(
      req.params.id,
      agenteId,
      req.user.id,
      req.user.tenantId
    );

    res.status(200).json({ success: true, data: cliente });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/clients/:id/estado
// ---------------------------------------------------------------------------

/** Changes the client status. Role restrictions enforced in the service. */
export async function cambiarEstado(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);

    const { estado } = cambiarEstadoSchema.parse(req.body);
    const cliente = await cambiarEstadoClienteService(
      req.params.id,
      estado,
      req.user.id,
      req.user.role,
      req.user.tenantId
    );

    res.status(200).json({ success: true, data: cliente });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/clients/:id
// ---------------------------------------------------------------------------

/** Soft-deletes a client (sets estado to inactivo). Only admins. */
export async function eliminarCliente(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);

    const result = await eliminarClienteService(
      req.params.id,
      req.user.id,
      req.user.tenantId
    );

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
