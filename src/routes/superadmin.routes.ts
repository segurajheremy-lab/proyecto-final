import { Router } from 'express';
import {
  listarTenants,
  obtenerTenant,
  actualizarStatusTenant,
  actualizarPlanTenant,
  statsGlobales,
  resetOwnerPassword,
} from '../controllers/superadmin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/permission.middleware';

const superAdminRouter = Router();

// All routes require authentication + MANAGE_TENANT or VIEW_ALL_TENANTS permission
// Both permissions are exclusive to super_admin
superAdminRouter.use(authenticate);

// ---------------------------------------------------------------------------
// Tenant listing & detail
// ---------------------------------------------------------------------------

/** GET /api/v1/superadmin/tenants — list all tenants with filters */
superAdminRouter.get('/tenants', authorize('VIEW_ALL_TENANTS'), listarTenants);

/** GET /api/v1/superadmin/tenants/:id — full tenant detail + stats */
superAdminRouter.get('/tenants/:id', authorize('VIEW_ALL_TENANTS'), obtenerTenant);

// ---------------------------------------------------------------------------
// Tenant management
// ---------------------------------------------------------------------------

/** PATCH /api/v1/superadmin/tenants/:id/status — activate / suspend / trial */
superAdminRouter.patch('/tenants/:id/status', authorize('MANAGE_TENANT'), actualizarStatusTenant);

/** PATCH /api/v1/superadmin/tenants/:id/plan — change plan + agentesLimit */
superAdminRouter.patch('/tenants/:id/plan', authorize('MANAGE_TENANT'), actualizarPlanTenant);

/** POST /api/v1/superadmin/tenants/:id/reset-owner-password — support password reset */
superAdminRouter.post('/tenants/:id/reset-owner-password', authorize('MANAGE_TENANT'), resetOwnerPassword);

// ---------------------------------------------------------------------------
// Platform-wide statistics
// ---------------------------------------------------------------------------

/** GET /api/v1/superadmin/stats — global platform KPIs */
superAdminRouter.get('/stats', authorize('VIEW_ALL_TENANTS'), statsGlobales);

export default superAdminRouter;
