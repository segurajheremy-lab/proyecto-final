import { Request, Response, NextFunction } from 'express'
import { loginSchema, crearUsuarioSchema } from '../validators/user.validator'
import { loginService, crearUsuarioService } from '../services/auth.service'
import { AuthRequest } from '../middlewares/auth.middleware'

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors })
      return
    }

    const result = await loginService(parsed.data.email, parsed.data.password)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const crearUsuario = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = crearUsuarioSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors })
      return
    }

    const result = await crearUsuarioService(parsed.data)
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}