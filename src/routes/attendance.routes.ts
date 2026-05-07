import { Router } from 'express';
import {
  marcarEvento,
  obtenerAsistenciaHoy,
  listarAsistencia,
  historialAsistencia,
} from '../controllers/attendance.controller';
import { authenticate } from '../middlewares/auth.middleware';

const attendanceRouter = Router();

attendanceRouter.use(authenticate);

// Agent marks their own attendance event
attendanceRouter.post('/evento', marcarEvento);

// Get today's attendance for the authenticated user
attendanceRouter.get('/hoy', obtenerAsistenciaHoy);

// Get personal attendance history (last N days)
attendanceRouter.get('/historial', historialAsistencia);

// List attendance records (filtered by role scope)
attendanceRouter.get('/', listarAsistencia);

export default attendanceRouter;
