import { Router } from 'express';
import {
  registrarEmpresa,
  login,
  generarInvitacion,
  aceptarInvitacion,
  me,
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const authRouter = Router();

// ---------------------------------------------------------------------------
// Public routes
// ---------------------------------------------------------------------------

/** Register a new company + owner */
authRouter.post('/registro', registrarEmpresa);

/** Authenticate and receive a session token */
authRouter.post('/login', login);

/** Accept an invitation and create the user account */
authRouter.post('/aceptar-invitacion', aceptarInvitacion);

// ---------------------------------------------------------------------------
// Protected routes
// ---------------------------------------------------------------------------

/**
 * Generate an invitation link for a new user.
 * Permission is enforced inside the controller based on the target role:
 *   - owner  → can invite admin
 *   - admin  → can invite sub_admin, supervisor, agent
 *   - sub_admin → can invite supervisor, agent
 */
authRouter.post('/invitar', authenticate, generarInvitacion);

/** Return the authenticated user's profile */
authRouter.get('/me', authenticate, me);

export default authRouter;
