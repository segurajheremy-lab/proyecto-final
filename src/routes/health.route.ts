import { Router, Request, Response } from 'express';

const healthRouter = Router();

/**
 * GET /health
 * Public endpoint for load balancers and monitoring tools.
 * Does not require authentication.
 */
healthRouter.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default healthRouter;
