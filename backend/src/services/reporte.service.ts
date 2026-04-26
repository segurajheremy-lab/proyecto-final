import ExcelJS from "exceljs";
import path from "path";

export const generarExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Asistencia");

  sheet.columns = [
    { header: "Nombre", key: "nombre", width: 20 },
    { header: "Fecha", key: "fecha", width: 15 },
    { header: "Estado", key: "estado", width: 15 },
  ];

  sheet.addRow({ nombre: "Juan", fecha: "2026-04-26", estado: "Presente" });
  sheet.addRow({ nombre: "Maria", fecha: "2026-04-26", estado: "Falta" });

  const filePath = path.join(__dirname, "../../reporte.xlsx");
  await workbook.xlsx.writeFile(filePath);

  return filePath;
};