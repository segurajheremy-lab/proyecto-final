import { Router } from 'express';
import { getDailySummary } from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/permission.middleware';

const router = Router();

// Endpoint para el panel principal del admin
router.get('/summary', authenticate, authorize('VIEW_ALL_ATTENDANCE'), getDailySummary);

export default router;
