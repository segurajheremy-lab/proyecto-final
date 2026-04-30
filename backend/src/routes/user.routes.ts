import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware'
import { authorize } from '../middlewares/permission.middleware'
import {
  listarUsuarios,
  obtenerUsuario,
  editarUsuario,
  desactivarUsuario,
} from '../controllers/user.controller'

const router = Router()

router.use(authenticate)

router.get('/', authorize('VIEW_USERS'), listarUsuarios)
router.get('/:id', authorize('VIEW_USERS'), obtenerUsuario)
router.put('/:id', authorize('EDIT_USER'), editarUsuario)
router.delete('/:id', authorize('DELETE_USER'), desactivarUsuario)

export default router