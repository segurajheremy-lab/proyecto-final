import type { Role } from '../config/permissions';

// ---------------------------------------------------------------------------
// Authenticated user shape attached to every request by authenticate()
// ---------------------------------------------------------------------------

export interface AuthUser {
  /** MongoDB _id as string */
  id: string;
  /** Tenant the user belongs to. Empty string for super_admin (no tenant). */
  tenantId: string;
  /** User role */
  role: Role;
  /** Display name */
  nombre: string;
  /** Corporate email domain of the tenant. Empty string for super_admin. */
  dominio: string;
}

/**
 * Legacy JWT payload — kept for backward compatibility with existing token
 * signing utilities. New code should use AuthUser via req.user.
 */
export interface JwtPayload {
  /** User ID (subject) */
  sub: string;
  /** User email address */
  email: string;
  /** User role */
  role: Role;
  /** Issued at (Unix timestamp) */
  iat?: number;
  /** Expiration (Unix timestamp) */
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      /** Authenticated user, populated by authenticate() middleware */
      user?: AuthUser;
      /** Shortcut for req.user.tenantId, populated by tenantScope() middleware */
      tenantId?: string;
    }
  }
}
