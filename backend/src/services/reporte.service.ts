import ExcelJS from "exceljs";
import { Attendance } from "../models/Attendance.model";

// ✅ Ahora solo recibe 'fecha' como string
export const generarExcelBuffer = async (fecha: string): Promise<Buffer> => {
  const asistencias = await Attendance.find({
    fecha: fecha, // ✅ Filtro de un solo día
  }).populate<{ userId: { nombre: string; email: string } }>(
    "userId",
    "nombre email"
  );

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Asistencia");

  sheet.columns = [
    { header: "Nombre", key: "nombre", width: 25 },
    { header: "Email", key: "email", width: 30 },
    { header: "Fecha", key: "fecha", width: 15 },
    { header: "Estado", key: "status", width: 20 },
  ];

  for (const a of asistencias) {
    const user = a.userId as any;
    sheet.addRow({
      nombre: user?.nombre ?? "Desconocido",
      email: user?.email ?? "-",
      fecha: a.fecha,
      status: a.status,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};