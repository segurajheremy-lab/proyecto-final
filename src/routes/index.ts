import { Router } from 'express';
import authRouter from './auth.routes';

/**
 * API v1 router aggregator.
 * Register all feature routers here under /api/v1.
 */
const apiRouter = Router();

// ---------------------------------------------------------------------------
// Feature routes
// ---------------------------------------------------------------------------

apiRouter.use('/auth', authRouter);

// apiRouter.use('/users', userRouter);
// apiRouter.use('/clients', clientRouter);

export default apiRouter;
