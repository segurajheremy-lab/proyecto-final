import { Router } from 'express';
import {
  reporteAgente, enviarReporteAgente, descargarExcelAgente,
  reporteArea, enviarReporteArea, descargarExcelArea,
  reporteEjecutivo, enviarReporteEjecutivo, descargarExcelEjecutivo,
} from '../controllers/report.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/permission.middleware';

const reportRouter = Router();

reportRouter.use(authenticate);

// ---------------------------------------------------------------------------
// Nivel 1 — Reporte de Agente (supervisor)
// ---------------------------------------------------------------------------

reportRouter.get('/agente/:agentId',         authorize('GENERATE_TEAM_REPORT'), reporteAgente);
reportRouter.post('/agente/:agentId/enviar',  authorize('GENERATE_TEAM_REPORT'), enviarReporteAgente);
reportRouter.get('/agente/:agentId/excel',    authorize('GENERATE_TEAM_REPORT'), descargarExcelAgente);

// ---------------------------------------------------------------------------
// Nivel 2 — Reporte de Área (sub_admin)
// ---------------------------------------------------------------------------

reportRouter.get('/area',         authorize('GENERATE_AREA_REPORT'), reporteArea);
reportRouter.post('/area/enviar', authorize('GENERATE_AREA_REPORT'), enviarReporteArea);
reportRouter.get('/area/excel',   authorize('GENERATE_AREA_REPORT'), descargarExcelArea);

// ---------------------------------------------------------------------------
// Nivel 3 — Reporte Ejecutivo (admin / owner)
// ---------------------------------------------------------------------------

reportRouter.get('/ejecutivo',         authorize('GENERATE_FULL_REPORT'), reporteEjecutivo);
reportRouter.post('/ejecutivo/enviar', authorize('GENERATE_FULL_REPORT'), enviarReporteEjecutivo);
reportRouter.get('/ejecutivo/excel',   authorize('GENERATE_FULL_REPORT'), descargarExcelEjecutivo);

export default reportRouter;
