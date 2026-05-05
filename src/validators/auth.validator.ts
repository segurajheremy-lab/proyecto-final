import { z } from 'zod';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Validates a domain string: lowercase letters, digits, dots and hyphens.
 * No @ symbol, no protocol prefix.
 * e.g. "empresa.com", "mi-empresa.co.pe"
 */
const dominioSchema = z
  .string()
  .min(3, 'El dominio debe tener al menos 3 caracteres')
  .regex(
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/,
    'Dominio inválido. Usa el formato "empresa.com" sin @ ni protocolo'
  );

/**
 * Slug: only lowercase letters and hyphens, no leading/trailing hyphens.
 * e.g. "empresa-alpha", "mi-empresa"
 */
const slugSchema = z
  .string()
  .min(2, 'El slug debe tener al menos 2 caracteres')
  .max(60, 'El slug no puede superar 60 caracteres')
  .regex(
    /^[a-z][a-z0-9-]*[a-z0-9]$|^[a-z]$/,
    'El slug solo puede contener letras minúsculas, números y guiones, y debe comenzar con una letra'
  );

/**
 * Password: min 8 chars, at least one digit.
 */
const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/\d/, 'La contraseña debe contener al menos un número');

// ---------------------------------------------------------------------------
// registroEmpresaSchema
// ---------------------------------------------------------------------------

export const registroEmpresaSchema = z
  .object({
    nombreEmpresa: z.string().min(2, 'El nombre de la empresa es requerido').trim(),
    dominio:       dominioSchema,
    slug:          slugSchema,
    nombreOwner:   z.string().min(2, 'El nombre del owner es requerido').trim(),
    email:         z.string().email('Email inválido').toLowerCase().trim(),
    password:      passwordSchema,
  })
  .refine(
    (data) => {
      // email must end with @<dominio>
      const emailDomain = data.email.split('@')[1];
      return emailDomain === data.dominio;
    },
    {
      message: 'El email debe pertenecer al dominio corporativo registrado',
      path: ['email'],
    }
  );

export type RegistroEmpresaInput = z.infer<typeof registroEmpresaSchema>;

// ---------------------------------------------------------------------------
// loginSchema
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email:    z.string().email('Email inválido').toLowerCase().trim(),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// invitacionSchema
// ---------------------------------------------------------------------------

export const invitacionSchema = z.object({
  token:    z.string().min(1, 'El token de invitación es requerido'),
  nombre:   z.string().min(2, 'El nombre es requerido').trim(),
  password: passwordSchema,
});

export type InvitacionInput = z.infer<typeof invitacionSchema>;

// ---------------------------------------------------------------------------
// generarInvitacionSchema
// ---------------------------------------------------------------------------

export const generarInvitacionSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase().trim(),
  role:  z.enum(['admin', 'sub_admin', 'supervisor', 'agent'], {
    errorMap: () => ({ message: 'Rol inválido para invitación' }),
  }),
});

export type GenerarInvitacionInput = z.infer<typeof generarInvitacionSchema>;
