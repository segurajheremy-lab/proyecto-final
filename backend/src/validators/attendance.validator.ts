import { z } from 'zod'

export const editarAsistenciaSchema = z.object({
  status: z.enum([
    'sin_jornada',
    'jornada_activa',
    'en_refrigerio',
    'post_refrigerio',
    'finalizado',
    'falta',
    'falta_justificada'
  ]),
  tardanza: z.boolean(),
  minutosTardanza: z.number().min(0),
  razon: z.string().min(5, 'La razón debe tener al menos 5 caracteres'),
})
