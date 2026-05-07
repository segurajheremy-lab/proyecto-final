import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { getCollectionCounts } from '../controllers/debug.controller';

const router = Router();

// GET /api/v1/debug/collections — returns document counts per collection for the current tenant
router.get('/collections', authenticate, getCollectionCounts);

export default router;
