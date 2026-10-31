import {
  buildErrorCsv,
  chunkRows,
  excelSerialToISO,
  parseCsvText,
  parseDateCell,
  parseMoney,
} from '@/lib/import/csv-parser';
import { mapHeader } from '@/lib/import/templates';
import { describe, expect, it } from 'vitest';

describe('mapHeader', () => {
  it('maps common Indonesian headers', () => {
    expect(mapHeader('Nama Produk')).toBe('name');
    expect(mapHeader('Harga Jual')).toBe('selling_price');
    expect(mapHeader('HPP')).toBe('cost_price');
    expect(mapHeader('stok awal')).toBe('stock');
    expect(mapHeader('Tanggal Transaksi')).toBe('transaction_date');
    expect(mapHeader('Metode Pembayaran')).toBe('payment_method');
    expect(mapHeader('Nominal')).toBe('amount');
  });

  it('returns null for unknown columns', () => {
    expect(mapHeader('kolom misterius')).toBeNull();
  });
});

describe('parseMoney', () => {
  it('handles owner-style money formatting', () => {
    expect(parseMoney('Rp 12.500')).toBe(12500);
    expect(parseMoney('12.500')).toBe(12500);
    expect(parseMoney('12,500')).toBe(12500);
    expect(parseMoney('12500')).toBe(12500);
    expect(parseMoney('12.5')).toBe(13); // decimal, rounded to rupiah
  });

  it('returns null for junk', () => {
    expect(parseMoney('abtran')).toBeNull();
    expect(parseMoney('')).toBeNull();
  });
});

describe('parseDateCell', () => {
  it('normalizes common date formats', () => {
    expect(parseDateCell('2026-10-20')).toBe('2026-10-20');
    expect(parseDateCell('20/10/2026')).toBe('2026-10-20');
    expect(parseDateCell('20-10-2026')).toBe('2026-10-20');
  });

  it('rejects impossible dates', () => {
    expect(parseDateCell('32/13/2026')).toBeNull();
    expect(parseDateCell('besok')).toBeNull();
  });
});

describe('excelSerialToISO', () => {
  it('converts excel serial dates', () => {
    expect(excelSerialToISO(46250)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(excelSerialToISO(1)).toBeNull();
  });
});

describe('parseCsvText', () => {
  it('parses products with aliases and money formatting', () => {
    const csv = 'Kode Produk;Nama;Kategori;Harga Modal;Harga Jual;Stok\nKP-001;Es Kopi Susu;Minuman;Rp 7.000;Rp 18.000;24\n';
    const result = parseCsvText(csv, 'PRODUCTS');
    expect(result.validCount).toBe(1);
    expect(result.rows[0].data.sku).toBe('KP-001');
    expect(result.rows[0].data.cost_price).toBe('7000');
    expect(result.rows[0].data.stock).toBe('24');
  });

  it('flags invalid rows with Indonesian errors', () => {
    const csv = 'sku,name,category,cost_price,selling_price,stock\n,Bad Row,Minuman,x,-5,abc\n';
    const result = parseCsvText(csv, 'PRODUCTS');
    expect(result.validCount).toBe(0);
    expect(result.invalidCount).toBe(1);
    const errors = result.rows[0].errors.join(' ');
    expect(errors).toContain('sku: kolom wajib diisi');
    expect(errors).toContain('Harga modal');
  });

  it('normalizes QRIS payment values', () => {
    const csv = 'transaction_date,payment_method,sku,quantity,unit_price\n2026-10-20,qris,KP-001,1,\n';
    const result = parseCsvText(csv, 'SALES');
    expect(result.rows[0].data.payment_method).toBe('QRIS_SIM');
    // trailing comma produces an empty unit_price cell -> optional, valid
    expect(result.rows[0].errors.length).toBe(0);
  });
});

describe('chunkRows', () => {
  it('splits into batches of max size', () => {
    const items = Array.from({ length: 1201 }, (_, i) => i);
    const chunks = chunkRows(items, 500);
    expect(chunks.map((c) => c.length)).toEqual([500, 500, 201]);
  });
});

describe('buildErrorCsv', () => {
  it('includes line numbers, errors and original data', () => {
    const parsed = parseCsvText('sku,name,category,cost_price,selling_price,stock\n,Bad,Minuman,x,-5,abc\n', 'PRODUCTS');
    const csv = buildErrorCsv(parsed.rows);
    expect(csv.split('\n')[0]).toContain('baris,kesalahan');
    expect(csv).toContain('Bad');
  });
});
