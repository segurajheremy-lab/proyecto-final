import { Router } from "express";
import { enviarReporte } from "../controllers/reporte.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/permission.middleware";

const router = Router();

// CORRECCIÓN: Cambiamos "/reporte" por "/" 
// Porque el prefijo "/api/reporte" ya se define en el archivo principal (app.ts o server.ts)
router.post(
  "/", 
  authenticate,
  // Si te sigue dando problemas de "Forbidden", comenta temporalmente la línea de abajo para probar
  authorize("SEND_REPORTS"), 
  enviarReporte
);

export default router;