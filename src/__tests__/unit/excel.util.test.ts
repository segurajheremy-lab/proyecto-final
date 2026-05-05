import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import { generateExcel, type ColumnDefinition } from '../../utils/excel.util';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const columns: ColumnDefinition[] = [
  { header: 'Name', key: 'name', width: 20 },
  { header: 'Email', key: 'email', width: 30 },
  { header: 'Age', key: 'age', width: 10 },
];

async function parseBuffer(buffer: Buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return workbook;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('generateExcel', () => {
  it('returns a non-empty Buffer when rows contain data', async () => {
    const rows = [
      { name: 'Alice', email: 'alice@example.com', age: 30 },
      { name: 'Bob', email: 'bob@example.com', age: 25 },
    ];

    const buffer = await generateExcel('Users', columns, rows);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('returns a non-empty Buffer when rows array is empty (only headers)', async () => {
    const buffer = await generateExcel('Users', columns, []);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('produces a valid .xlsx file that can be parsed by ExcelJS', async () => {
    const rows = [{ name: 'Charlie', email: 'charlie@example.com', age: 40 }];
    const buffer = await generateExcel('Sheet1', columns, rows);

    const workbook = await parseBuffer(buffer);
    expect(workbook.worksheets.length).toBeGreaterThan(0);
  });

  it('creates a worksheet with the specified sheet name', async () => {
    const buffer = await generateExcel('MySheet', columns, []);
    const workbook = await parseBuffer(buffer);

    const sheet = workbook.getWorksheet('MySheet');
    expect(sheet).toBeDefined();
  });

  it('includes the correct column headers', async () => {
    const buffer = await generateExcel('Users', columns, []);
    const workbook = await parseBuffer(buffer);
    const sheet = workbook.getWorksheet('Users');

    expect(sheet).toBeDefined();
    const headerRow = sheet!.getRow(1);
    const headers = headerRow.values as (string | undefined)[];

    // ExcelJS row values are 1-indexed (index 0 is undefined)
    expect(headers).toContain('Name');
    expect(headers).toContain('Email');
    expect(headers).toContain('Age');
  });

  it('includes the correct number of data rows', async () => {
    const rows = [
      { name: 'Alice', email: 'alice@example.com', age: 30 },
      { name: 'Bob', email: 'bob@example.com', age: 25 },
      { name: 'Charlie', email: 'charlie@example.com', age: 40 },
    ];

    const buffer = await generateExcel('Users', columns, rows);
    const workbook = await parseBuffer(buffer);
    const sheet = workbook.getWorksheet('Users');

    // Row 1 = headers, rows 2..N = data
    expect(sheet!.rowCount).toBe(rows.length + 1);
  });

  it('returns only the header row when rows array is empty', async () => {
    const buffer = await generateExcel('Empty', columns, []);
    const workbook = await parseBuffer(buffer);
    const sheet = workbook.getWorksheet('Empty');

    expect(sheet!.rowCount).toBe(1);
  });
});
