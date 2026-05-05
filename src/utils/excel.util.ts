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
// generateExcel
// ---------------------------------------------------------------------------

/**
 * Generates an Excel (.xlsx) workbook from structured data and returns it as a Buffer.
 *
 * @param sheetName - Name of the worksheet (sanitized automatically)
 * @param columns - Column definitions (header, key, optional width)
 * @param rows - Array of row data objects. If empty, only the header row is included.
 * @returns Buffer containing the .xlsx file content
 */
export async function generateExcel(
  sheetName: string,
  columns: ColumnDefinition[],
  rows: Record<string, unknown>[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sanitizeSheetName(sheetName));

  // Define columns
  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width ?? 20,
  }));

  // Add rows (if any)
  if (rows.length > 0) {
    worksheet.addRows(rows);
  }

  // Write to buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
