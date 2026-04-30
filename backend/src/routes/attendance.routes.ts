import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware'
import { authorize } from '../middlewares/permission.middleware'
import {
  iniciarJornada,
  salirRefrigerio,
  volverRefrigerio,
  finalizarJornada,
  obtenerEstadoHoy,
  listarAsistenciaPorFecha,
  editarAsistencia,
} from '../controllers/attendance.controller'

const router = Router()

// Todas requieren estar autenticado
router.use(authenticate)

// Solo workers marcan asistencia
router.get('/hoy', authorize('VIEW_OWN_ATTENDANCE'), obtenerEstadoHoy)
router.post('/iniciar', authorize('MARK_ATTENDANCE'), iniciarJornada)
router.post('/refrigerio/salir', authorize('MARK_ATTENDANCE'), salirRefrigerio)
router.post('/refrigerio/volver', authorize('MARK_ATTENDANCE'), volverRefrigerio)
router.post('/finalizar', authorize('MARK_ATTENDANCE'), finalizarJornada)

// Administración
router.get('/admin', authorize('VIEW_ALL_ATTENDANCE'), listarAsistenciaPorFecha)
router.put('/admin/:id', authorize('EDIT_ATTENDANCE'), editarAsistencia)

export default router