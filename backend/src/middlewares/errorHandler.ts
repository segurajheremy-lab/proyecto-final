import { Request, Response, NextFunction } from 'express'

export class AppError extends Error {
  statusCode: number
  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message })
    return
  }

  console.error('Error no controlado:', err)
  res.status(500).json({ message: 'Error interno del servidor' })
}