import { Router } from 'express';
import { getMiTenant, updateMiTenant } from '../controllers/tenant.controller';
import { authenticate } from '../middlewares/auth.middleware';

const tenantRouter = Router();

tenantRouter.get('/mio', authenticate, getMiTenant);
tenantRouter.patch('/mio', authenticate, updateMiTenant);

export default tenantRouter;
