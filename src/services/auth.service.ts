import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { Tenant } from '../models/Tenant.model';
import { User } from '../models/User.model';
import { AppError } from '../middlewares/errorHandler.middleware';
import { canManageRole, Role } from '../config/permissions';
import type {
  RegistroEmpresaInput,
  LoginInput,
  InvitacionInput,
} from '../validators/auth.validator';

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface SessionTokenPayload {
  sub:      string;
  tenantId: string;
  role:     Role;
  dominio:  string;
}

interface InvitacionTokenPayload {
  tipo:     'invitacion';
  tenantId: string;
  role:     Role;
  email:    string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function signSessionToken(payload: SessionTokenPayload): string {
  return jwt.sign(
    {
      sub:      payload.sub,
      tenantId: payload.tenantId,
      role:     payload.role,
      dominio:  payload.dominio,
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN } as jwt.SignOptions
  );
}

function extractDomain(email: string): string {
  return email.split('@')[1]!.toLowerCase();
}

// ---------------------------------------------------------------------------
// 1. registrarEmpresaService
// ---------------------------------------------------------------------------

/**
 * Creates a new tenant and its owner user in a single operation.
 * Throws AppError 409 if the domain or slug is already taken.
 */
export async function registrarEmpresaService(data: RegistroEmpresaInput) {
  const { nombreEmpresa, dominio, slug, nombreOwner, email, password } = data;

  // Check domain uniqueness
  const dominioExiste = await Tenant.findOne({ dominio }).lean();
  if (dominioExiste) {
    throw new AppError('El dominio ya está registrado en la plataforma.', 409);
  }

  // Check slug uniqueness
  const slugExiste = await Tenant.findOne({ slug }).lean();
  if (slugExiste) {
    throw new AppError('El slug ya está en uso. Elige otro identificador.', 409);
  }

  // Create tenant
  const tenant = await Tenant.create({
    nombre:  nombreEmpresa,
    dominio,
    slug,
  });

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create owner user
  const user = await User.create({
    tenantId:     tenant._id,
    nombre:       nombreOwner,
    email,
    passwordHash,
    role:         'owner' as Role,
  });

  // Generate session token
  const token = signSessionToken({
    sub:      String(user._id),
    tenantId: String(tenant._id),
    role:     'owner',
    dominio:  tenant.dominio,
  });

  return {
    token,
    tenant: {
      nombre: tenant.nombre,
      slug:   tenant.slug,
    },
    user: {
      nombre: user.nombre,
      email:  user.email,
      role:   user.role,
    },
  };
}

// ---------------------------------------------------------------------------
// 2. loginService
// ---------------------------------------------------------------------------

/**
 * Authenticates a user by email + password.
 * Uses a generic 401 message to avoid leaking whether the domain exists.
 */
export async function loginService(data: LoginInput) {
  const { email, password } = data;
  const GENERIC_ERROR = 'Credenciales incorrectas.';

  // Derive domain from email
  const dominio = extractDomain(email);

  // Find tenant by domain
  const tenant = await Tenant.findOne({ dominio }).lean();
  if (!tenant) {
    throw new AppError(GENERIC_ERROR, 401);
  }

  // Find user within that tenant
  const user = await User.findOne({ tenantId: tenant._id, email });
  if (!user) {
    throw new AppError(GENERIC_ERROR, 401);
  }

  // Verify password
  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) {
    throw new AppError(GENERIC_ERROR, 401);
  }

  // Check user is active
  if (!user.activo) {
    throw new AppError('Tu cuenta está desactivada. Contacta a tu administrador.', 401);
  }

  // Check tenant is active
  if (tenant.status === 'suspended') {
    throw new AppError('La cuenta de tu empresa está suspendida.', 403);
  }

  // Update last login (fire-and-forget — don't block the response)
  User.findByIdAndUpdate(user._id, { ultimoLogin: new Date() }).exec();

  // Generate session token
  const token = signSessionToken({
    sub:      String(user._id),
    tenantId: String(tenant._id),
    role:     user.role as Role,
    dominio:  tenant.dominio,
  });

  return {
    token,
    user: {
      nombre:   user.nombre,
      email:    user.email,
      role:     user.role,
      tenantId: String(user.tenantId),
      horario:  user.horario,
    },
  };
}

// ---------------------------------------------------------------------------
// 3. generarInvitacionService
// ---------------------------------------------------------------------------

/**
 * Generates a short-lived invitation JWT for a new user.
 * Enforces role hierarchy: the inviting user can only invite roles below theirs.
 */
export async function generarInvitacionService(
  adminId:  string,
  tenantId: string,
  targetRole: Role,
  email:    string
): Promise<{ link: string; token: string }> {
  // Load the inviting user to get their role
  const admin = await User.findById(adminId).lean();
  if (!admin) {
    throw new AppError('Usuario no encontrado.', 404);
  }

  // Enforce hierarchy
  if (!canManageRole(admin.role as Role, targetRole)) {
    throw new AppError(
      `Tu rol (${admin.role}) no puede invitar usuarios con rol "${targetRole}".`,
      403
    );
  }

  // Verify email domain matches tenant
  const tenant = await Tenant.findById(tenantId).lean();
  if (!tenant) {
    throw new AppError('Tenant no encontrado.', 404);
  }

  const emailDomain = extractDomain(email);
  if (emailDomain !== tenant.dominio) {
    throw new AppError(
      `El email debe pertenecer al dominio corporativo "${tenant.dominio}".`,
      400
    );
  }

  // Check email not already registered in this tenant
  const existe = await User.findOne({ tenantId, email }).lean();
  if (existe) {
    throw new AppError('Ya existe un usuario con ese email en esta empresa.', 409);
  }

  // Sign invitation token (48h)
  const payload: InvitacionTokenPayload = {
    tipo:     'invitacion',
    tenantId,
    role:     targetRole,
    email,
  };

  const token = jwt.sign(payload, config.JWT_SECRET, { expiresIn: '48h' } as jwt.SignOptions);

  const link = `/api/auth/aceptar-invitacion?token=${token}`;

  return { link, token };
}

// ---------------------------------------------------------------------------
// 4. aceptarInvitacionService
// ---------------------------------------------------------------------------

/**
 * Validates an invitation token and creates the new user.
 * Returns a regular session token on success.
 */
export async function aceptarInvitacionService(data: InvitacionInput) {
  const { token, nombre, password } = data;

  // Verify invitation token
  let payload: InvitacionTokenPayload;
  try {
    payload = jwt.verify(token, config.JWT_SECRET) as InvitacionTokenPayload;
  } catch {
    throw new AppError('El token de invitación es inválido o ha expirado.', 400);
  }

  if (payload.tipo !== 'invitacion') {
    throw new AppError('Token inválido.', 400);
  }

  const { tenantId, role, email } = payload;

  // Verify tenant still exists and is active
  const tenant = await Tenant.findById(tenantId).lean();
  if (!tenant || tenant.status === 'suspended') {
    throw new AppError('La empresa no está disponible.', 403);
  }

  // Verify email domain matches tenant domain
  const emailDomain = extractDomain(email);
  if (emailDomain !== tenant.dominio) {
    throw new AppError('El email no corresponde al dominio de la empresa.', 400);
  }

  // Check user doesn't already exist
  const existe = await User.findOne({ tenantId, email }).lean();
  if (existe) {
    throw new AppError('Ya existe una cuenta con ese email.', 409);
  }

  // Hash password and create user
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    tenantId,
    nombre,
    email,
    passwordHash,
    role,
  });

  // Return a regular session token
  const sessionToken = signSessionToken({
    sub:      String(user._id),
    tenantId: String(tenantId),
    role:     role as Role,
    dominio:  tenant.dominio,
  });

  return {
    token: sessionToken,
    user: {
      nombre: user.nombre,
      email:  user.email,
      role:   user.role,
    },
  };
}
