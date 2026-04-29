import { Router } from "express";
import { enviarReporte } from "../controllers/reporte.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/permission.middleware";
import { generarExcelBuffer } from "../services/reporte.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { Response, NextFunction } from "express";

const router = Router();

// Enviar reporte por correo
router.post(
  "/", 
  authenticate,
  authorize("SEND_REPORTS"), 
  enviarReporte
);

// Descargar reporte Excel directamente
router.get(
  "/download",
  authenticate,
  authorize("VIEW_REPORTS"),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const fecha = req.query.fecha as string;
      if (!fecha) {
        res.status(400).json({ message: "La fecha es requerida" });
        return;
      }
      const buffer = await generarExcelBuffer(fecha);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=reporte-${fecha}.xlsx`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
);

export default router;