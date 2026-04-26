import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import {
  iniciarJornadaService,
  salirRefrigerioService,
  volverRefrigerioService,
  finalizarJornadaService,
  obtenerEstadoHoyService,
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