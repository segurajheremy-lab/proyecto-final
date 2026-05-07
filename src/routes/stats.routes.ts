import { Router } from 'express';
import { getDashboardStats, getOwnerStats } from '../controllers/stats.controller';
import { authenticate } from '../middlewares/auth.middleware';

const statsRouter = Router();

statsRouter.use(authenticate);

// General stats for the tenant (owner/admin)
statsRouter.get('/dashboard', getOwnerStats);

// Role-scoped stats
statsRouter.get('/resumen', getDashboardStats);

export default statsRouter;
