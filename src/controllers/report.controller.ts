import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../middlewares/errorHandler.middleware';
import {
  generarReporteAgenteService,
  generarReporteAreaService,
  generarReporteEjecutivoService,
  generarExcelReporteService,
  enviarReporteEmailService,
} from '../services/report.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fechaSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD')
  .default(() => new Date().toISOString().split('T')[0]!);

const emailSchema = z.string().email('Email inválido');

function getFecha(query: Record<string, unknown>): string {
  return fechaSchema.parse(query.fecha);
}

// ---------------------------------------------------------------------------
// NIVEL 1 — Reporte de Agente
// ---------------------------------------------------------------------------

export async function reporteAgente(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);
    const fecha = getFecha(req.query as Record<string, unknown>);
    const reporte = await generarReporteAgenteService(req.params.agentId, fecha, req.user.id, req.user.tenantId);
    res.status(200).json({ success: true, data: reporte });
  } catch (err) { next(err); }
}

export async function enviarReporteAgente(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);
    const fecha = getFecha(req.query as Record<string, unknown>);
    const email = emailSchema.parse(req.body.email);
    const reporte = await generarReporteAgenteService(req.params.agentId, fecha, req.user.id, req.user.tenantId);
    await enviarReporteEmailService(reporte, email, 'reporte_agente');
    res.status(200).json({ success: true, message: `Reporte enviado a ${email}` });
  } catch (err) { next(err); }
}

export async function descargarExcelAgente(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);
    const fecha = getFecha(req.query as Record<string, unknown>);
    const reporte = await generarReporteAgenteService(req.params.agentId, fecha, req.user.id, req.user.tenantId);
    const buffer = await generarExcelReporteService(reporte, 'reporte_agente');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="reporte-agente-${fecha}.xlsx"`);
    res.send(buffer);
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------------------
// NIVEL 2 — Reporte de Área
// ---------------------------------------------------------------------------

export async function reporteArea(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);
    const fecha = getFecha(req.query as Record<string, unknown>);
    const reporte = await generarReporteAreaService(req.user.id, fecha, req.user.tenantId);
    res.status(200).json({ success: true, data: reporte });
  } catch (err) { next(err); }
}

export async function enviarReporteArea(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);
    const fecha = getFecha(req.query as Record<string, unknown>);
    const email = emailSchema.parse(req.body.email);
    const reporte = await generarReporteAreaService(req.user.id, fecha, req.user.tenantId);
    await enviarReporteEmailService(reporte, email, 'reporte_area');
    res.status(200).json({ success: true, message: `Reporte enviado a ${email}` });
  } catch (err) { next(err); }
}

export async function descargarExcelArea(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);
    const fecha = getFecha(req.query as Record<string, unknown>);
    const reporte = await generarReporteAreaService(req.user.id, fecha, req.user.tenantId);
    const buffer = await generarExcelReporteService(reporte, 'reporte_area');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="reporte-area-${fecha}.xlsx"`);
    res.send(buffer);
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------------------
// NIVEL 3 — Reporte Ejecutivo
// ---------------------------------------------------------------------------

export async function reporteEjecutivo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);
    const fecha = getFecha(req.query as Record<string, unknown>);
    const reporte = await generarReporteEjecutivoService(req.user.id, fecha, req.user.tenantId);
    res.status(200).json({ success: true, data: reporte });
  } catch (err) { next(err); }
}

export async function enviarReporteEjecutivo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);
    const fecha = getFecha(req.query as Record<string, unknown>);
    const email = emailSchema.parse(req.body.email);
    const reporte = await generarReporteEjecutivoService(req.user.id, fecha, req.user.tenantId);
    await enviarReporteEmailService(reporte, email, 'reporte_ejecutivo');
    res.status(200).json({ success: true, message: `Reporte enviado a ${email}` });
  } catch (err) { next(err); }
}

export async function descargarExcelEjecutivo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('No autenticado.', 401);
    const fecha = getFecha(req.query as Record<string, unknown>);
    const reporte = await generarReporteEjecutivoService(req.user.id, fecha, req.user.tenantId);
    const buffer = await generarExcelReporteService(reporte, 'reporte_ejecutivo');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="reporte-ejecutivo-${fecha}.xlsx"`);
    res.send(buffer);
  } catch (err) { next(err); }
}
