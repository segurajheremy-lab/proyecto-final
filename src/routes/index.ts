import { Router } from 'express';
import authRouter from './auth.routes';
import tenantRouter from './tenant.routes';
import usersRouter from './users.routes';
import attendanceRouter from './attendance.routes';
import interactionsRouter from './interactions.routes';
import statsRouter from './stats.routes';
import clientRouter from './client.routes';
import reportRouter from './report.routes';
import debugRouter from './debug.routes';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/tenants', tenantRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/attendance', attendanceRouter);
apiRouter.use('/interactions', interactionsRouter);
apiRouter.use('/stats', statsRouter);
apiRouter.use('/clients', clientRouter);
apiRouter.use('/reports', reportRouter);

// DEBUG endpoint — only in development
if (process.env.NODE_ENV === 'development') {
  apiRouter.use('/debug', debugRouter);
}

export default apiRouter;
