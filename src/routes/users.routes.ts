import { Router } from 'express';
import {
  listarUsuarios,
  obtenerUsuario,
  actualizarUsuario,
  desactivarUsuario,
  activarUsuario,
} from '../controllers/users.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/permission.middleware';

const usersRouter = Router();

// All routes require authentication
usersRouter.use(authenticate);

// List users in the tenant (filtered by role scope)
usersRouter.get('/', authorize('VIEW_ALL_USERS'), listarUsuarios);

// Get single user
usersRouter.get('/:id', authorize('VIEW_ALL_USERS'), obtenerUsuario);

// Update user (horario, toleranciaMinutos, supervisorId, subAdminId)
usersRouter.patch('/:id', authorize('EDIT_USER'), actualizarUsuario);

// Deactivate / activate user
usersRouter.patch('/:id/desactivar', authorize('DEACTIVATE_USER'), desactivarUsuario);
usersRouter.patch('/:id/activar', authorize('DEACTIVATE_USER'), activarUsuario);

export default usersRouter;
