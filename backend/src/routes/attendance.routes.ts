import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware'
import { authorize } from '../middlewares/permission.middleware'
import {
  iniciarJornada,
  salirRefrigerio,
  volverRefrigerio,
  finalizarJornada,
  obtenerEstadoHoy,
  obtenerHistorial,
  obtenerResumen,
} from '../controllers/attendance.controller'

const router = Router()

// Todas requieren estar autenticado
router.use(authenticate)

// Rutas Admin
router.get('/resumen', authorize('VIEW_ALL_ATTENDANCE'), obtenerResumen)

// Solo workers marcan asistencia
router.get('/hoy', authorize('VIEW_OWN_ATTENDANCE'), obtenerEstadoHoy)
router.post('/iniciar', authorize('MARK_ATTENDANCE'), iniciarJornada)
router.post('/refrigerio/salir', authorize('MARK_ATTENDANCE'), salirRefrigerio)
router.post('/refrigerio/volver', authorize('MARK_ATTENDANCE'), volverRefrigerio)
router.post('/finalizar', authorize('MARK_ATTENDANCE'), finalizarJornada)
router.get('/historial', authorize('VIEW_OWN_ATTENDANCE'), obtenerHistorial)

export default router