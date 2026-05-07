import { z } from 'zod';

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'ID inválido');

// ---------------------------------------------------------------------------
// crearInteraccionSchema
// ---------------------------------------------------------------------------

export const crearInteraccionSchema = z.object({
  clientId: objectIdSchema,
  duracionMinutos: z.coerce.number().int().min(0).optional(),
  resultado: z.enum(['resuelto', 'pendiente', 'sin_respuesta', 'callback'], {
    errorMap: () => ({ message: 'Resultado inválido. Usa: resuelto, pendiente, sin_respuesta o callback' }),
  }),
  nota: z
    .string()
    .min(10, 'La nota debe tener al menos 10 caracteres para un análisis de sentimiento preciso')
    .max(1000, 'La nota no puede superar 1000 caracteres'),
});

export type CrearInteraccionInput = z.infer<typeof crearInteraccionSchema>;

// ---------------------------------------------------------------------------
// filtrosInteraccionSchema
// ---------------------------------------------------------------------------

export const filtrosInteraccionSchema = z.object({
  clientId:    objectIdSchema.optional(),
  agentId:     objectIdSchema.optional(),
  resultado:   z.enum(['resuelto', 'pendiente', 'sin_respuesta', 'callback']).optional(),
  sentimiento: z.enum(['positivo', 'neutral', 'negativo']).optional(),
  fechaDesde:  z.string().datetime({ offset: true }).optional(),
  fechaHasta:  z.string().datetime({ offset: true }).optional(),
  pagina:      z.coerce.number().int().min(1).default(1),
  limite:      z.coerce.number().int().min(1).max(100).default(20),
});

export type FiltrosInteraccionInput = z.infer<typeof filtrosInteraccionSchema>;
