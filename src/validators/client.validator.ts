import { z } from 'zod';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Phone: digits, spaces, hyphens, optional leading + for country code.
 * e.g. "+51 987 654 321", "987654321", "+1-800-555-0100"
 */
const telefonoSchema = z
  .string()
  .min(6, 'El teléfono debe tener al menos 6 caracteres')
  .max(20, 'El teléfono no puede superar 20 caracteres')
  .regex(
    /^\+?[\d\s\-().]{6,20}$/,
    'Formato de teléfono inválido. Usa dígitos, espacios, guiones o código de país (+51)'
  );

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'ID inválido');

// ---------------------------------------------------------------------------
// crearClienteSchema
// ---------------------------------------------------------------------------

export const crearClienteSchema = z.object({
  nombre:     z.string().min(2, 'El nombre debe tener al menos 2 caracteres').trim(),
  apellido:   z.string().min(2, 'El apellido debe tener al menos 2 caracteres').trim(),
  telefono:   telefonoSchema,
  email:      z.string().email('Email inválido').toLowerCase().trim().optional(),
  direccion:  z.string().max(200).trim().optional(),
  empresa:    z.string().max(100).trim().optional(),
  etiquetas:  z
    .array(z.string().min(1).max(30).trim())
    .max(5, 'Máximo 5 etiquetas')
    .optional()
    .default([]),
  notas:      z.string().max(500, 'Las notas no pueden superar 500 caracteres').optional(),
  asignadoA:  z.string().refine(
    (val) => !val || /^[a-f\d]{24}$/i.test(val),
    'ID de agente inválido'
  ).optional(),
});

export type CrearClienteInput = z.infer<typeof crearClienteSchema>;

// ---------------------------------------------------------------------------
// actualizarClienteSchema
// All fields optional — service enforces role-based field restrictions
// ---------------------------------------------------------------------------

export const actualizarClienteSchema = z.object({
  nombre:     z.string().min(2).trim().optional(),
  apellido:   z.string().min(2).trim().optional(),
  telefono:   telefonoSchema.optional(),
  email:      z.string().email('Email inválido').toLowerCase().trim().optional(),
  direccion:  z.string().max(200).trim().optional(),
  empresa:    z.string().max(100).trim().optional(),
  etiquetas:  z.array(z.string().min(1).max(30).trim()).max(5).optional(),
  notas:      z.string().max(500).optional(),
  asignadoA:  objectIdSchema.optional().nullable(),
});

export type ActualizarClienteInput = z.infer<typeof actualizarClienteSchema>;

// ---------------------------------------------------------------------------
// filtrosClienteSchema
// ---------------------------------------------------------------------------

export const filtrosClienteSchema = z.object({
  estado: z
    .enum(['activo', 'pendiente', 'resuelto', 'inactivo'])
    .optional(),
  asignadoA: objectIdSchema.optional(),
  busqueda:  z.string().max(100).trim().optional(),
  pagina:    z.coerce.number().int().min(1).default(1),
  limite:    z.coerce.number().int().min(1).max(100).default(20),
});

export type FiltrosClienteInput = z.infer<typeof filtrosClienteSchema>;

// ---------------------------------------------------------------------------
// asignarClienteSchema
// ---------------------------------------------------------------------------

export const asignarClienteSchema = z.object({
  agenteId: objectIdSchema,
});

// ---------------------------------------------------------------------------
// cambiarEstadoSchema
// ---------------------------------------------------------------------------

export const cambiarEstadoSchema = z.object({
  estado: z.enum(['activo', 'pendiente', 'resuelto', 'inactivo']),
});
