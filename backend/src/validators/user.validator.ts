import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

const horarioSchema = z.object({
  entrada: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  salidaRefrigerio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  vueltaRefrigerio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  salida: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
})

export const crearUsuarioSchema = z.object({
  nombre: z.string().min(2, 'Nombre muy corto'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  role: z.enum(['super_admin', 'admin', 'reporter', 'worker']),
  horario: horarioSchema,
  toleranciaMinutos: z.number().min(0).max(30).optional(),
})

export const editarUsuarioSchema = z.object({
  nombre: z.string().min(2, 'Nombre muy corto').optional(),
  role: z.enum(['super_admin', 'admin', 'reporter', 'worker']).optional(),
  toleranciaMinutos: z.number().min(0).max(30).optional(),
  horario: z.object({
    entrada: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
    salidaRefrigerio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
    vueltaRefrigerio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
    salida: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  }).optional(),
})