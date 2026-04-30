import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import {
  iniciarJornadaService,
  salirRefrigerioService,
  volverRefrigerioService,
  finalizarJornadaService,
  obtenerEstadoHoyService,
  listarAsistenciaPorFechaService,
  editarAsistenciaService,
} from '../services/attendance.service'
import { getFechaHoy } from '../utils/dates'
import { editarAsistenciaSchema } from '../validators/attendance.validator'

export const iniciarJornada = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await iniciarJornadaService(req.user!.id)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const listarAsistenciaPorFecha = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const fecha = (req.query.fecha as string) || getFechaHoy()
    const result = await listarAsistenciaPorFechaService(fecha)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const editarAsistencia = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = editarAsistenciaSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors })
      return
    }

    const { id } = req.params as { id: string }
    const { razon, ...cambios } = parsed.data
    const adminId = req.user!.id as string

    const result = await editarAsistenciaService(id, adminId, cambios, razon)
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
