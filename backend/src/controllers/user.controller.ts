import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import {
  listarUsuariosService,
  obtenerUsuarioService,
  editarUsuarioService,
  desactivarUsuarioService,
} from '../services/user.service'
import { editarUsuarioSchema } from '../validators/user.validator'

export const listarUsuarios = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const usuarios = await listarUsuariosService()
    res.json(usuarios)
  } catch (error) {
    next(error)
  }
}

export const obtenerUsuario = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const usuario = await obtenerUsuarioService(req.params.id as string)
    res.json(usuario)
  } catch (error) {
    next(error)
  }
}

export const editarUsuario = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = editarUsuarioSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors })
      return
    }
    const usuario = await editarUsuarioService(req.params.id as string, parsed.data)
    res.json(usuario)
  } catch (error) {
    next(error)
  }
}

export const desactivarUsuario = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await desactivarUsuarioService(req.params.id as string)
    res.json(result)
  } catch (error) {
    next(error)
  }
}