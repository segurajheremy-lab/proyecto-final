import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import ExcelJS from 'exceljs';
import { generateExcel, type ColumnDefinition } from '../../utils/excel.util';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

// Sheet names: alphanumeric + spaces only — no Excel-forbidden chars (* ? : \ / [ ])
const safeSheetNameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{0,29}$/);

const columnArb = fc.record({
  header: fc.string({ minLength: 1, maxLength: 30 }),
  key: fc.stringMatching(/^[a-z][a-zA-Z0-9]{0,19}$/),
  width: fc.option(fc.integer({ min: 5, max: 50 }), { nil: undefined }),
});

const rowValueArb = fc.oneof(
  fc.string({ maxLength: 50 }),
  fc.integer(),
  fc.boolean()
);

// ---------------------------------------------------------------------------
// Property 7: ExcelService genera buffer válido para cualquier conjunto de filas
// Validates: Requirements 8.2, 8.3
// ---------------------------------------------------------------------------

describe('Property 7: ExcelService genera buffer válido para cualquier conjunto de filas', () => {
  it('retorna un Buffer no vacío para cualquier nombre de hoja, columnas y filas (incluyendo vacío)', async () => {
    await fc.assert(
      fc.asyncProperty(
        safeSheetNameArb,
        fc.array(columnArb, { minLength: 1, maxLength: 5 }),
        fc.array(
          fc.record({ value: rowValueArb }),
          { maxLength: 20 }
        ),
        async (sheetName, columns, rawRows) => {
          // Build rows using the column keys
          const rows = rawRows.map((r) =>
            Object.fromEntries(columns.map((col) => [col.key, r.value]))
          );

          const buffer = await generateExcel(sheetName, columns as ColumnDefinition[], rows);

          // Property: buffer must be non-empty
          expect(Buffer.isBuffer(buffer)).toBe(true);
          expect(buffer.length).toBeGreaterThan(0);

          // Property: buffer must be a valid .xlsx file
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(buffer);

          // The sheet name may be sanitized (trimmed to 31 chars), so look it up
          expect(workbook.worksheets.length).toBeGreaterThan(0);

          // Property: header row must always be present
          const sheet = workbook.worksheets[0];
          const headerRow = sheet.getRow(1);
          const headers = (headerRow.values as (string | undefined)[]).filter(Boolean);
          expect(headers.length).toBe(columns.length);
        }
      ),
      { numRuns: 50 } // reduced because each run creates a real xlsx buffer
    );
  });

  it('retorna un Buffer no vacío incluso cuando el array de filas está vacío', async () => {
    await fc.assert(
      fc.asyncProperty(
        safeSheetNameArb,
        fc.array(columnArb, { minLength: 1, maxLength: 5 }),
        async (sheetName, columns) => {
          const buffer = await generateExcel(sheetName, columns as ColumnDefinition[], []);

          expect(Buffer.isBuffer(buffer)).toBe(true);
          expect(buffer.length).toBeGreaterThan(0);

          // Verify it's a valid xlsx with only the header row
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(buffer);
          expect(workbook.worksheets.length).toBeGreaterThan(0);

          const sheet = workbook.worksheets[0];
          expect(sheet.rowCount).toBe(1);
        }
      ),
      { numRuns: 50 }
    );
  });
});
