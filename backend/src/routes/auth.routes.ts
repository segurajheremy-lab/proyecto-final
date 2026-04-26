import { Router } from 'express'
import { login, crearUsuario } from '../controllers/auth.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { authorize } from '../middlewares/permission.middleware'

const router = Router()

// Pública — cualquiera puede hacer login
router.post('/login', login)

// Protegida — solo admins crean usuarios
router.post('/users', authenticate, authorize('CREATE_USER'), crearUsuario)

export default router