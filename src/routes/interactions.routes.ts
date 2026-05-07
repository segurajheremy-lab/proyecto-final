import { Router } from 'express';
import {
  crearInteraccion,
  listarInteracciones,
  fichaCliente,
} from '../controllers/interactions.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/permission.middleware';

const interactionsRouter = Router();

interactionsRouter.use(authenticate);

/**
 * POST /api/v1/interactions
 * Create a new interaction with AI sentiment analysis.
 * Only agents (CREATE_INTERACTION permission).
 */
interactionsRouter.post('/', authorize('CREATE_INTERACTION'), crearInteraccion);

/**
 * GET /api/v1/interactions
 * List interactions scoped by role.
 * Minimum permission: VIEW_OWN_INTERACTIONS (agent).
 */
interactionsRouter.get('/', authorize('VIEW_OWN_INTERACTIONS'), listarInteracciones);

/**
 * GET /api/v1/interactions/cliente/:clientId
 * Full client profile: data + last 10 interactions + statistics.
 * Access scoped by role in the service.
 */
interactionsRouter.get('/cliente/:clientId', fichaCliente);

export default interactionsRouter;
