/**
 * Client-side migration file parsing: CSV (Papa Parse) & Excel (ExcelJS)
 * → normalized rows → per-row validation with plain-Indonesian errors.
 *
 * Money cells accept owner-style formatting ("Rp 12.500", "12,500", "12500").
 * Dates accept YYYY-MM-DD and DD/MM/YYYY; output is YYYY-MM-DD (WIB dates).
 */

import Papa from 'papaparse';
import { z } from 'zod';
import { mapHeader, type MigrationDataType } from './templates';
import { EXPENSE_CATEGORIES } from '@/lib/validators/expenses';

export interface ParsedImportRow {
  line: number; // 1-based data line in the file (for error report)
  data: Record<string, string>;
  errors: string[];
}

export interface ParsedImportFile {
  headers: string[];
  rows: ParsedImportRow[];
  validCount: number;
  invalidCount: number;
}

export const importRowSchemas: Record<MigrationDataType, z.ZodTypeAny> = {
  PRODUCTS: z
    .object({
      sku: z.string().trim().min(1, 'SKU wajib diisi').max(50, 'SKU maksimal 50 karakter'),
      name: z.string().trim().min(2, 'Nama produk minimal 2 karakter').max(150, 'Nama maksimal 150 karakter'),
      category: z.string().trim().min(1, 'Kategori wajib diisi').max(80, 'Kategori maksimal 80 karakter'),
      cost_price: z.coerce.number({ message: 'Harga modal wajib angka' }).int().min(0, 'Harga modal tidak boleh negatif'),
      selling_price: z.coerce.number({ message: 'Harga jual wajib angka' }).int().min(1, 'Harga jual minimal 1'),
      stock: z.coerce.number({ message: 'Stok awal wajib angka' }).int().min(0, 'Stok awal tidak boleh negatif'),
      min_stock_alert: z.coerce.number({ message: 'Stok minimum wajib angka' }).int().min(0).optional(),
    })
    .strict(),
  SALES: z
    .object({
      transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal harus format YYYY-MM-DD'),
      payment_method: z.enum(['CASH', 'QRIS_SIM'], { message: 'Metode pembayaran harus CASH atau QRIS' }),
      sku: z.string().trim().min(1, 'SKU wajib diisi').max(50),
      quantity: z.coerce.number({ message: 'Jumlah wajib angka' }).int().min(1, 'Jumlah minimal 1'),
      unit_price: z.coerce.number({ message: 'Harga wajib angka' }).int().min(0, 'Harga tidak boleh negatif').optional(),
    })
    .strict(),
  EXPENSES: z
    .object({
      expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal harus format YYYY-MM-DD'),
      category: z.enum(EXPENSE_CATEGORIES, { message: 'Kategori tidak dikenal' }),
      description: z.string().trim().min(1, 'Keterangan wajib diisi').max(500, 'Keterangan maksimal 500 karakter'),
      amount: z.coerce.number({ message: 'Nominal wajib angka' }).int().min(1, 'Nominal minimal 1'),
    })
    .strict(),
};

/** "Rp 12.500", "12,500", "12.5", "12500" -> 12500 | 12.5 as number. */
export function parseMoney(raw: string): number | null {
  const cleaned = raw.replace(/rp/gi, '').replace(/\s/g, '');
  if (cleaned.length === 0) return null;
  // "12.500" / "12,500" = thousands; "12.5" / "12,5" = decimal.
  const thousands = /^[+-]?\d{1,3}([.,]\d{3})+$/;
  if (thousands.test(cleaned)) {
    return parseInt(cleaned.replace(/[.,]/g, ''), 10);
  }
  const normalized = cleaned.replace(',', '.');
  if (!/^[+-]?\d+(\.\d+)?$/.test(normalized)) return null;
  return Math.round(parseFloat(normalized));
}

/** "20/10/2026", "20-10-2026", "2026-10-20" -> "2026-10-20"; else null. */
export function parseDateCell(raw: string): string | null {
  const value = raw.trim();
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  if (iso) return normalize(iso[1], iso[2], iso[3]);
  const dmy = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/.exec(value);
  if (dmy) return normalize(dmy[3], dmy[2], dmy[1]);
  return null;
}

function normalize(y: string, m: string, d: string): string | null {
  const month = Number(m);
  const day = Number(d);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

/** Excel serial date (days since 1899-12-30) -> YYYY-MM-DD. */
export function excelSerialToISO(serial: number): string | null {
  if (!Number.isFinite(serial) || serial < 20000 || serial > 80000) return null;
  const ms = (serial - 25569) * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

/** Parses CSV text with delimiter auto-detection, maps headers to fields. */
export function parseCsvText(text: string, type: MigrationDataType): ParsedImportFile {
  const parsed = Papa.parse<Record<string, string>>(text.replace(/^\uFEFF/, ''), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => mapHeader(h) || h.trim(),
  });
  return finalizeRows(parsed.data as Record<string, string>[], type);
}

/** Parses the first worksheet of an .xlsx file. */
export async function parseExcelBuffer(buffer: ArrayBuffer, type: MigrationDataType): Promise<ParsedImportFile> {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return { headers: [], rows: [], validCount: 0, invalidCount: 0 };

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell((cell, col) => {
    headers[col] = mapHeader(String(cell.value ?? '')) || String(cell.value ?? '').trim();
  });

  const dataRows: Record<string, string>[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record: Record<string, string> = {};
    headers.forEach((field, col) => {
      if (!field) return;
      const cell = row.getCell(col);
      const value = cell.value;
      if (value === null || value === undefined) {
        record[field] = '';
      } else if (value instanceof Date) {
        record[field] = value.toISOString().slice(0, 10);
      } else if (typeof value === 'object' && 'result' in (value as object)) {
        // formula cell
        record[field] = String((value as { result: unknown }).result ?? '');
      } else if (typeof value === 'object' && 'text' in (value as object)) {
        record[field] = String((value as { text: unknown }).text ?? '');
      } else {
        record[field] = String(value);
      }
    });
    dataRows.push(record);
  });

  return finalizeRows(dataRows, type);
}

function finalizeRows(rawRows: Record<string, string>[], type: MigrationDataType): ParsedImportFile {
  const schema = importRowSchemas[type];
  const rows: ParsedImportRow[] = rawRows.map((record, i) => {
    const errors: string[] = [];
    const data: Record<string, string> = {};

    for (const [rawKey, rawValue] of Object.entries(record)) {
      const field = mapHeader(rawKey) || rawKey;
      data[field] = typeof rawValue === 'string' ? rawValue.trim() : String(rawValue ?? '');
    }

    // Normalize typed cells before validation.
    const dateField = type === 'EXPENSES' ? 'expense_date' : 'transaction_date';
    if (type !== 'PRODUCTS' && data[dateField]) {
      const iso =
        parseDateCell(data[dateField]) ??
        excelSerialToISO(Number(data[dateField]));
      if (iso) data[dateField] = iso;
      else errors.push(`Format tanggal tidak dikenal: "${data[dateField]}"`);
    }

    for (const moneyField of ['cost_price', 'selling_price', 'unit_price', 'amount']) {
      if (data[moneyField]) {
        const parsedMoney = parseMoney(data[moneyField]);
        if (parsedMoney === null) errors.push(`"${data[moneyField]}" bukan angka uang yang valid`);
        else data[moneyField] = String(parsedMoney);
      }
    }
    for (const countField of ['stock', 'min_stock_alert', 'quantity']) {
      if (data[countField]) {
        const parsedCount = parseMoney(data[countField]);
        if (parsedCount === null) errors.push(`"${data[countField]}" bukan angka yang valid`);
        else data[countField] = String(parsedCount);
      }
    }
    if (type === 'SALES' && data.payment_method) {
      const pm = data.payment_method.toUpperCase();
      data.payment_method = pm.includes('QRIS') ? 'QRIS_SIM' : pm === 'CASH' ? 'CASH' : data.payment_method;
    }

    // Drop empty cells: optional fields must stay ABSENT, not '' (which
    // would fail number coercion).
    for (const key of Object.keys(data)) {
      if (data[key] === '') delete data[key];
    }

    const result = schema.safeParse(data);
    if (!result.success) {
      const issueTexts = result.error.issues.map((issue) => {
        const path = issue.path.join('.') || 'baris';
        const message = /Invalid input.*undefined/.test(issue.message)
          ? 'kolom wajib diisi'
          : issue.message;
        return `${path}: ${message}`;
      });
      errors.push(...issueTexts);
    }

    return { line: i + 2, data, errors }; // +2: header row occupies line 1
  });

  const validCount = rows.filter((row) => row.errors.length === 0).length;
  return {
    headers: Object.keys(rows[0]?.data ?? {}),
    rows,
    validCount,
    invalidCount: rows.length - validCount,
  };
}

/** Splits an array into chunks of at most `size`. */
export function chunkRows<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/** Builds a downloadable CSV of failing rows for owner-side fixes. */
export function buildErrorCsv(rows: ParsedImportRow[]): string {
  const header = 'baris,kesalahan,' + Object.keys(rows[0]?.data ?? {}).join(',');
  const lines = rows
    .filter((row) => row.errors.length > 0)
    .map((row) =>
      [
        row.line,
        `"${row.errors.join('; ').replace(/"/g, '""')}"`,
        ...Object.values(row.data).map((v) => `"${String(v).replace(/"/g, '""')}"`),
      ].join(',')
    );
  return [header, ...lines].join('\n');
}
