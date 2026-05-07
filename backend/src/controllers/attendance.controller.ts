import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import {
  iniciarJornadaService,
  salirRefrigerioService,
  volverRefrigerioService,
  finalizarJornadaService,
  obtenerEstadoHoyService,
  obtenerHistorialService,
  obtenerResumenService
} from '../services/attendance.service'

export const iniciarJornada = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await iniciarJornadaService(req.user!.id)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const salirRefrigerio = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await salirRefrigerioService(req.user!.id)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const volverRefrigerio = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await volverRefrigerioService(req.user!.id)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const finalizarJornada = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await finalizarJornadaService(req.user!.id)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const obtenerEstadoHoy = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await obtenerEstadoHoyService(req.user!.id)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

//HISTORIAL DEL TRABAJADOR
export const obtenerHistorial = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await obtenerHistorialService(req.user!.id)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

// RESUMEN PARA EL ADMIN
export const obtenerResumen = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const fecha = req.query.fecha as string
    if (!fecha) {
      res.status(400).json({ message: 'La fecha es obligatoria (YYYY-MM-DD)' })
      return
    }
    const result = await obtenerResumenService(fecha)
    res.json(result)
  } catch (error) {
    next(error)
  }
}