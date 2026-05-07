import ExcelJS from 'exceljs';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ColumnDefinition {
  /** Column header label */
  header: string;
  /** Key used to map row data to this column */
  key: string;
  /** Column width in characters (optional) */
  width?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Sanitizes a worksheet name to comply with Excel restrictions.
 * Excel forbids: * ? : \ / [ ] in sheet names, and names cannot exceed 31 chars.
 */
function sanitizeSheetName(name: string): string {
  return name
    .replace(/[*?:\\/[\]]/g, '_')
    .slice(0, 31)
    .trim() || 'Sheet1';
}

// ---------------------------------------------------------------------------
// generateExcel — generic utility
// ---------------------------------------------------------------------------

/**
 * Generates an Excel (.xlsx) workbook from structured data and returns it as a Buffer.
 */
export async function generateExcel(
  sheetName: string,
  columns: ColumnDefinition[],
  rows: Record<string, unknown>[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sanitizeSheetName(sheetName));

  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width ?? 20,
  }));

  if (rows.length > 0) {
    worksheet.addRows(rows);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// ---------------------------------------------------------------------------
// Style constants
// ---------------------------------------------------------------------------

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1E3A5F' },
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FFFFFFFF' },
  size: 11,
};

const ROW_EVEN_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF8FAFC' },
};

const SENTIMENT_COLORS: Record<string, string> = {
  positivo: 'FF22C55E',
  neutral:  'FF94A3B8',
  negativo: 'FFEF4444',
};

function applyHeaderStyle(row: ExcelJS.Row): void {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FF1E3A5F' } },
    };
  });
  row.height = 22;
}

function applyAlternatingRow(row: ExcelJS.Row, index: number): void {
  if (index % 2 === 0) {
    row.eachCell((cell) => {
      cell.fill = ROW_EVEN_FILL;
    });
  }
  row.eachCell((cell) => {
    cell.alignment = { vertical: 'middle' };
  });
}

function addKpiCell(
  ws: ExcelJS.Worksheet,
  rowNum: number,
  col: number,
  label: string,
  value: string | number
): void {
  const labelCell = ws.getCell(rowNum, col);
  labelCell.value = label;
  labelCell.font = { bold: true, color: { argb: 'FF1E3A5F' }, size: 11 };

  const valueCell = ws.getCell(rowNum, col + 1);
  valueCell.value = value;
  valueCell.font = { size: 12, bold: true };
  valueCell.alignment = { horizontal: 'center' };
}

// ---------------------------------------------------------------------------
// generarExcelReporte — styled report workbook
// ---------------------------------------------------------------------------

type ReporteAgente = {
  tipo: 'reporte_agente';
  generadoPor: { nombre: string; role: string };
  agente: { nombre: string; email: string };
  fecha: string;
  asistencia: {
    status: string;
    horaEntrada: string | null;
    horaSalida: string | null;
    tardanza: boolean;
    minutosTardanza: number;
    horasTrabajadas: number;
    minutosRefrigerio: number;
  };
  interacciones: {
    total: number;
    resueltas: number;
    pendientes: number;
    sinRespuesta: number;
    callbacks: number;
    duracionPromedio: number;
  };
  sentimiento: { positivo: number; neutral: number; negativo: number; scorePromedio: number };
  alertas: { clienteNombre: string; nota: string; sentimientoScore: number; fecha: Date }[];
  clientes: { nombre: string; apellido: string; telefono: string; ultimaInteraccion: Date; estado: string; resultado: string }[];
};

type ReporteArea = {
  tipo: 'reporte_area';
  generadoPor: { nombre: string; role: string };
  area: string;
  fecha: string;
  resumenSupervisores: {
    supervisor: { nombre: string; email: string };
    totalAgentes: number;
    presentes: number;
    faltas: number;
    tardanzas: number;
    totalInteracciones: number;
    resueltas: number;
    tasaResolucion: number;
    sentimientoPromedio: string;
    alertas: number;
  }[];
  totales: Record<string, unknown>;
};

type ReporteEjecutivo = {
  tipo: 'reporte_ejecutivo';
  empresa: { nombre: string; plan: string };
  generadoPor: { nombre: string };
  fecha: string;
  resumenAreas: {
    subAdmin: { nombre: string; email: string };
    totalSupervisores: number;
    totalAgentes: number;
    presentes: number;
    interacciones: number;
    resueltas: number;
    tasaResolucion: number;
    sentimientoPromedio: string;
    alertasCriticas: number;
  }[];
  kpis: Record<string, unknown>;
  tendencia: string;
};

type AnyReporte = ReporteAgente | ReporteArea | ReporteEjecutivo;

export async function generarExcelReporte(
  reporte: AnyReporte,
  tipo: 'reporte_agente' | 'reporte_area' | 'reporte_ejecutivo'
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CallCenter IA';
  workbook.created = new Date();

  // ── Hoja 1: Resumen ejecutivo ──────────────────────────────────────────

  const wsResumen = workbook.addWorksheet('Resumen');
  wsResumen.columns = [
    { key: 'label', width: 30 },
    { key: 'value', width: 25 },
    { key: 'label2', width: 30 },
    { key: 'value2', width: 25 },
  ];

  // Title
  wsResumen.mergeCells('A1:D1');
  const titleCell = wsResumen.getCell('A1');
  titleCell.value = tipo === 'reporte_agente'
    ? `Reporte de Agente — ${(reporte as ReporteAgente).agente.nombre} — ${reporte.fecha}`
    : tipo === 'reporte_area'
    ? `Reporte de Área — ${(reporte as ReporteArea).area} — ${reporte.fecha}`
    : `Reporte Ejecutivo — ${(reporte as ReporteEjecutivo).empresa.nombre} — ${reporte.fecha}`;
  titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = HEADER_FILL;
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  wsResumen.getRow(1).height = 30;

  wsResumen.addRow([]);

  if (tipo === 'reporte_agente') {
    const r = reporte as ReporteAgente;
    addKpiCell(wsResumen, 3, 1, 'Agente', r.agente.nombre);
    addKpiCell(wsResumen, 3, 3, 'Fecha', r.fecha);
    addKpiCell(wsResumen, 4, 1, 'Estado jornada', r.asistencia.status);
    addKpiCell(wsResumen, 4, 3, 'Horas trabajadas', `${r.asistencia.horasTrabajadas}h`);
    addKpiCell(wsResumen, 5, 1, 'Hora entrada', r.asistencia.horaEntrada ?? '—');
    addKpiCell(wsResumen, 5, 3, 'Hora salida', r.asistencia.horaSalida ?? '—');
    addKpiCell(wsResumen, 6, 1, 'Tardanza', r.asistencia.tardanza ? `Sí (${r.asistencia.minutosTardanza} min)` : 'No');
    addKpiCell(wsResumen, 6, 3, 'Refrigerio', `${r.asistencia.minutosRefrigerio} min`);
    wsResumen.addRow([]);
    addKpiCell(wsResumen, 8, 1, 'Total interacciones', r.interacciones.total);
    addKpiCell(wsResumen, 8, 3, 'Resueltas', r.interacciones.resueltas);
    addKpiCell(wsResumen, 9, 1, 'Pendientes', r.interacciones.pendientes);
    addKpiCell(wsResumen, 9, 3, 'Sin respuesta', r.interacciones.sinRespuesta);
    addKpiCell(wsResumen, 10, 1, 'Callbacks', r.interacciones.callbacks);
    addKpiCell(wsResumen, 10, 3, 'Duración promedio', `${r.interacciones.duracionPromedio} min`);
    wsResumen.addRow([]);
    addKpiCell(wsResumen, 12, 1, 'Sentimiento positivo', `${r.sentimiento.positivo}%`);
    addKpiCell(wsResumen, 12, 3, 'Sentimiento neutral', `${r.sentimiento.neutral}%`);
    addKpiCell(wsResumen, 13, 1, 'Sentimiento negativo', `${r.sentimiento.negativo}%`);
    addKpiCell(wsResumen, 13, 3, 'Score promedio', `${r.sentimiento.scorePromedio}%`);
    addKpiCell(wsResumen, 14, 1, 'Alertas críticas', r.alertas.length);
  } else if (tipo === 'reporte_area') {
    const r = reporte as ReporteArea;
    const t = r.totales as Record<string, number>;
    addKpiCell(wsResumen, 3, 1, 'Área', r.area);
    addKpiCell(wsResumen, 3, 3, 'Fecha', r.fecha);
    addKpiCell(wsResumen, 4, 1, 'Total agentes', t.agentes ?? 0);
    addKpiCell(wsResumen, 4, 3, 'Presentes', t.presentes ?? 0);
    addKpiCell(wsResumen, 5, 1, 'Faltas', t.faltas ?? 0);
    addKpiCell(wsResumen, 5, 3, 'Tardanzas', t.tardanzas ?? 0);
    addKpiCell(wsResumen, 6, 1, 'Total interacciones', t.interacciones ?? 0);
    addKpiCell(wsResumen, 6, 3, 'Tasa resolución', `${t.tasaResolucion ?? 0}%`);
    addKpiCell(wsResumen, 7, 1, 'Alertas críticas', t.alertasCriticas ?? 0);
    addKpiCell(wsResumen, 7, 3, 'Sentimiento general', String(t.sentimientoGeneral ?? '—'));
  } else {
    const r = reporte as ReporteEjecutivo;
    const k = r.kpis as Record<string, unknown>;
    addKpiCell(wsResumen, 3, 1, 'Empresa', r.empresa.nombre);
    addKpiCell(wsResumen, 3, 3, 'Plan', r.empresa.plan);
    addKpiCell(wsResumen, 4, 1, 'Tasa asistencia', `${k.tasaAsistencia ?? 0}%`);
    addKpiCell(wsResumen, 4, 3, 'Tasa resolución', `${k.tasaResolucion ?? 0}%`);
    addKpiCell(wsResumen, 5, 1, 'Agentes activos', String(k.agentesActivos ?? 0));
    addKpiCell(wsResumen, 5, 3, 'Clientes atendidos', String(k.clientesAtendidos ?? 0));
    addKpiCell(wsResumen, 6, 1, 'Alertas críticas', String(k.alertasCriticas ?? 0));
    addKpiCell(wsResumen, 6, 3, 'Tendencia', r.tendencia);
    addKpiCell(wsResumen, 7, 1, 'Sentimiento general', String(k.sentimientoGeneral ?? '—'));
  }

  // ── Hoja 2: Detalle ────────────────────────────────────────────────────

  const wsDetalle = workbook.addWorksheet('Detalle');

  if (tipo === 'reporte_agente') {
    const r = reporte as ReporteAgente;
    wsDetalle.columns = [
      { header: 'Tipo', key: 'tipo', width: 22 },
      { header: 'Hora', key: 'hora', width: 12 },
    ];
    applyHeaderStyle(wsDetalle.getRow(1));
    r.asistencia && [
      { tipo: 'Inicio jornada', hora: r.asistencia.horaEntrada ?? '—' },
      { tipo: 'Fin jornada', hora: r.asistencia.horaSalida ?? '—' },
    ].forEach((row, i) => {
      const r2 = wsDetalle.addRow(row);
      applyAlternatingRow(r2, i);
    });

    // Alertas
    if (r.alertas.length > 0) {
      wsDetalle.addRow([]);
      const alertHeader = wsDetalle.addRow(['ALERTAS CRÍTICAS', '', '']);
      alertHeader.getCell(1).font = { bold: true, color: { argb: 'FFEF4444' } };

      const alertCols = wsDetalle.addRow(['Cliente', 'Score', 'Nota']);
      applyHeaderStyle(alertCols);

      r.alertas.forEach((a, i) => {
        const row = wsDetalle.addRow([a.clienteNombre, `${a.sentimientoScore}%`, a.nota]);
        applyAlternatingRow(row, i);
        row.getCell(2).font = { color: { argb: SENTIMENT_COLORS.negativo }, bold: true };
      });
    }
  } else if (tipo === 'reporte_area') {
    const r = reporte as ReporteArea;
    wsDetalle.columns = [
      { header: 'Supervisor', key: 'supervisor', width: 25 },
      { header: 'Agentes', key: 'agentes', width: 10 },
      { header: 'Presentes', key: 'presentes', width: 12 },
      { header: 'Faltas', key: 'faltas', width: 10 },
      { header: 'Tardanzas', key: 'tardanzas', width: 12 },
      { header: 'Interacciones', key: 'interacciones', width: 15 },
      { header: 'Resueltas', key: 'resueltas', width: 12 },
      { header: 'Tasa %', key: 'tasa', width: 10 },
      { header: 'Sentimiento', key: 'sentimiento', width: 14 },
      { header: 'Alertas', key: 'alertas', width: 10 },
    ];
    applyHeaderStyle(wsDetalle.getRow(1));
    r.resumenSupervisores.forEach((s, i) => {
      const row = wsDetalle.addRow({
        supervisor:    s.supervisor.nombre,
        agentes:       s.totalAgentes,
        presentes:     s.presentes,
        faltas:        s.faltas,
        tardanzas:     s.tardanzas,
        interacciones: s.totalInteracciones,
        resueltas:     s.resueltas,
        tasa:          `${s.tasaResolucion}%`,
        sentimiento:   s.sentimientoPromedio,
        alertas:       s.alertas,
      });
      applyAlternatingRow(row, i);
      const sentCell = row.getCell(9);
      sentCell.font = { color: { argb: SENTIMENT_COLORS[s.sentimientoPromedio] ?? 'FF000000' }, bold: true };
    });
  } else {
    const r = reporte as ReporteEjecutivo;
    wsDetalle.columns = [
      { header: 'Área (Sub Admin)', key: 'area', width: 25 },
      { header: 'Supervisores', key: 'supervisores', width: 14 },
      { header: 'Agentes', key: 'agentes', width: 10 },
      { header: 'Presentes', key: 'presentes', width: 12 },
      { header: 'Interacciones', key: 'interacciones', width: 15 },
      { header: 'Resueltas', key: 'resueltas', width: 12 },
      { header: 'Tasa %', key: 'tasa', width: 10 },
      { header: 'Sentimiento', key: 'sentimiento', width: 14 },
      { header: 'Alertas', key: 'alertas', width: 10 },
    ];
    applyHeaderStyle(wsDetalle.getRow(1));
    r.resumenAreas.forEach((a, i) => {
      const row = wsDetalle.addRow({
        area:          a.subAdmin.nombre,
        supervisores:  a.totalSupervisores,
        agentes:       a.totalAgentes,
        presentes:     a.presentes,
        interacciones: a.interacciones,
        resueltas:     a.resueltas,
        tasa:          `${a.tasaResolucion}%`,
        sentimiento:   a.sentimientoPromedio,
        alertas:       a.alertasCriticas,
      });
      applyAlternatingRow(row, i);
      const sentCell = row.getCell(8);
      sentCell.font = { color: { argb: SENTIMENT_COLORS[a.sentimientoPromedio] ?? 'FF000000' }, bold: true };
    });
  }

  // ── Hoja 3: Clientes (solo reporte_agente) ─────────────────────────────

  if (tipo === 'reporte_agente') {
    const r = reporte as ReporteAgente;
    const wsClientes = workbook.addWorksheet('Clientes Atendidos');
    wsClientes.columns = [
      { header: 'Nombre', key: 'nombre', width: 20 },
      { header: 'Apellido', key: 'apellido', width: 20 },
      { header: 'Teléfono', key: 'telefono', width: 18 },
      { header: 'Estado', key: 'estado', width: 14 },
      { header: 'Resultado', key: 'resultado', width: 16 },
      { header: 'Última interacción', key: 'ultimaInteraccion', width: 22 },
    ];
    applyHeaderStyle(wsClientes.getRow(1));
    r.clientes.forEach((c, i) => {
      const row = wsClientes.addRow({
        nombre:            c.nombre,
        apellido:          c.apellido,
        telefono:          c.telefono,
        estado:            c.estado,
        resultado:         c.resultado,
        ultimaInteraccion: new Date(c.ultimaInteraccion).toLocaleString('es-PE'),
      });
      applyAlternatingRow(row, i);
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
