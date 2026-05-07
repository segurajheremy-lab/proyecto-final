import { Router } from 'express';
import {
  crearCliente,
  listarClientes,
  obtenerCliente,
  actualizarCliente,
  asignarCliente,
  cambiarEstado,
  eliminarCliente,
} from '../controllers/client.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/permission.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { crearClienteSchema } from '../validators/client.validator';

const clientRouter = Router();

// All routes require authentication
clientRouter.use(authenticate);

// ---------------------------------------------------------------------------
// Collection routes
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/clients
 * Create a new client. Only supervisors.
 */
clientRouter.post('/', authorize('CREATE_CLIENT'), validateBody(crearClienteSchema), crearCliente);

/**
 * GET /api/v1/clients
 * List clients. Scope depends on role:
 *   - agent       → VIEW_ASSIGNED_CLIENTS (only their own)
 *   - supervisor  → VIEW_TEAM_CLIENTS
 *   - sub_admin+  → VIEW_ALL_CLIENTS
 * We use VIEW_ASSIGNED_CLIENTS as the minimum permission (all roles that can
 * see any client have at least this permission).
 */
clientRouter.get('/', authorize('VIEW_ASSIGNED_CLIENTS'), listarClientes);

// ---------------------------------------------------------------------------
// Document routes
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/clients/:id
 * Full client profile + last 5 interactions.
 * Service enforces role-based access.
 */
clientRouter.get('/:id', obtenerCliente);

/**
 * PATCH /api/v1/clients/:id
 * Update client. Field restrictions enforced in service by role.
 */
clientRouter.patch('/:id', authorize('EDIT_CLIENT'), actualizarCliente);

/**
 * PATCH /api/v1/clients/:id/asignar
 * Assign/reassign client to an agent. Only supervisors.
 */
clientRouter.patch('/:id/asignar', authorize('ASSIGN_CLIENT'), asignarCliente);

/**
 * PATCH /api/v1/clients/:id/estado
 * Change client status. Restrictions enforced in service.
 */
clientRouter.patch('/:id/estado', cambiarEstado);

/**
 * DELETE /api/v1/clients/:id
 * Soft delete (sets estado to inactivo). Only admins.
 */
clientRouter.delete('/:id', authorize('DELETE_CLIENT'), eliminarCliente);

export default clientRouter;
