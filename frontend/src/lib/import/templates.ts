/**
 * Migration templates: column specs for the three importable datasets.
 * Column aliases cover common Indonesian headers found in owner spreadsheets.
 */

export type MigrationDataType = 'PRODUCTS' | 'SALES' | 'EXPENSES';

export interface TemplateSpec {
  type: MigrationDataType;
  /** Primary headers written into the downloadable template. */
  columns: string[];
  /** Canonical field each column maps to. */
  fields: string[];
  sampleRows: string[][];
  needsBranch: boolean;
}

export const MIGRATION_TEMPLATES: Record<MigrationDataType, TemplateSpec> = {
  PRODUCTS: {
    type: 'PRODUCTS',
    columns: ['sku', 'name', 'category', 'cost_price', 'selling_price', 'stock', 'min_stock_alert'],
    fields: ['sku', 'name', 'category', 'cost_price', 'selling_price', 'stock', 'min_stock_alert'],
    sampleRows: [
      ['KP-001', 'Es Kopi Susu Aren', 'Minuman', '7000', '18000', '24', '10'],
      ['MN-002', 'Red Velvet Latte', 'Minuman', '9000', '22000', '15', '10'],
      ['SN-001', 'Butter Croissant', 'Makanan', '5000', '15000', '8', '5'],
    ],
    needsBranch: true,
  },
  SALES: {
    type: 'SALES',
    columns: ['transaction_date', 'payment_method', 'sku', 'quantity', 'unit_price'],
    fields: ['transaction_date', 'payment_method', 'sku', 'quantity', 'unit_price'],
    sampleRows: [
      ['2026-10-20', 'CASH', 'KP-001', '2', '18000'],
      ['2026-10-20', 'CASH', 'SN-001', '1', '15000'],
      ['2026-10-21', 'QRIS', 'MN-002', '3', '22000'],
    ],
    needsBranch: true,
  },
  EXPENSES: {
    type: 'EXPENSES',
    columns: ['expense_date', 'category', 'description', 'amount'],
    fields: ['expense_date', 'category', 'description', 'amount'],
    sampleRows: [
      ['2026-10-20', 'Utilitas', 'Listrik warung bulan Oktober', '350000'],
      ['2026-10-21', 'Bahan Baku', 'Belanja susu & sirup', '780000'],
    ],
    needsBranch: true,
  },
};

/** Maps localized/aliased spreadsheet headers onto canonical fields. */
const HEADER_ALIASES: Record<string, string[]> = {
  sku: ['sku', 'kode', 'kode produk', 'kodeproduk', 'kode sku'],
  name: ['name', 'nama', 'nama produk', 'namaproduk', 'item'],
  category: ['category', 'kategori', 'jenis'],
  cost_price: ['cost_price', 'harga modal', 'hargamodal', 'hpp', 'modal', 'harga beli'],
  selling_price: ['selling_price', 'harga jual', 'hargajual', 'harga', 'harga satuan'],
  stock: ['stock', 'stok', 'stok awal', 'stokawal', 'jumlah stok', 'sisa stok'],
  min_stock_alert: ['min_stock_alert', 'stok minimum', 'stokminimum', 'batas minimum', 'alert minimum'],
  transaction_date: ['transaction_date', 'tanggal', 'tanggal transaksi', 'tanggaltransaksi', 'tgl'],
  payment_method: ['payment_method', 'metode pembayaran', 'metodepembayaran', 'pembayaran', 'bayar'],
  quantity: ['quantity', 'jumlah', 'qty', 'banyak', 'terjual'],
  unit_price: ['unit_price', 'harga satuan', 'hargasatuan', 'harga'],
  expense_date: ['expense_date', 'tanggal', 'tanggal pengeluaran', 'tanggalpengeluaran', 'tgl'],
  description: ['description', 'deskripsi', 'keterangan', 'catatan', 'uraian'],
  amount: ['amount', 'jumlah (rp)', 'jumlah rp', 'nominal', 'total', 'biaya', 'pengeluaran'],
};

/**
 * Normalizes a raw spreadsheet header into a canonical field name.
 * Returns null for unrecognized columns (they are dropped).
 */
export function mapHeader(rawHeader: string): string | null {
  const normalized = rawHeader.toLowerCase().replace(/[^a-z0-9( )]/g, ' ').replace(/\s+/g, ' ').trim();
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.includes(normalized)) return field;
  }
  return null;
}
