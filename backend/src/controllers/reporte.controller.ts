import { Request, Response } from "express";
import { generarExcel } from "../services/reporte.service";
import { enviarCorreo } from "../services/email.service";

export const enviarReporte = async (req: Request, res: Response) => {
  try {
    const filePath = await generarExcel();
    await enviarCorreo(filePath);

    res.json({ message: "Reporte enviado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al enviar reporte" });
  }
};