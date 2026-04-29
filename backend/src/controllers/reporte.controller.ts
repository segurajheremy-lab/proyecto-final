import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { generarExcelBuffer } from "../services/reporte.service";
import { enviarCorreo } from "../services/email.service";

export const enviarReporte = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Ahora solo esperamos 'fecha' y 'destinatario'
    const { fecha, destinatario } = req.body;

    // 2. Esta es la validación que te mandaba el error rojo. ¡Ya está arreglada!
    if (!fecha || !destinatario) {
      res.status(400).json({
        message: "La fecha y el destinatario son requeridos",
      });
      return;
    }

    // 3. Llamamos al servicio pasando solo la fecha única
    const buffer = await generarExcelBuffer(fecha);
    
    await enviarCorreo(buffer, destinatario);

    res.json({ message: "Reporte enviado correctamente" });
  } catch (error: any) {
    next(error);
  }
};