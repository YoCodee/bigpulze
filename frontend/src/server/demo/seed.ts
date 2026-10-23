/**
 * Seeder data demo (PRD §11.1).
 *
 * Menghapus seluruh data bisnis org demo lalu mengisi ulang dalam satu proses:
 * 3 cabang, 12 produk per cabang, 30 hari transaksi (D-30 s.d. D-1, WIB),
 * pengeluaran harian, dan skenario uji juri S1–S4 (S5 = pola musiman mingguan,
 * S6 = leaderboard, keduanya turunan dari data).
 *
 * PRNG deterministik mulberry32 dengan seed 2026 supaya hasil konsisten
 * setiap kali seed dijalankan (tanggal selalu relatif terhadap hari ini).
 *
 * Klien: service role (PRD §12 — seed demo termasuk pemakaian service role).
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { format, subDays } from 'date-fns';
import { getBusinessDate } from '@/lib/date';

const SEED_CONSTANT = 2026;
const HISTORY_DAYS = 30;
/** Ukuran batch insert — memangkas round-trip agar seed < 15 detik (PRD §11.1). */
const BATCH_SIZE = 1000;

export interface SeedResult {
  branches: number;
  products: number;
  transactions: number;
  transaction_items: number;
  stock_movements: number;
  expenses: number;
  duration_ms: number;
}

export interface DemoSeedInput {
  orgId: string;
  actorUserId: string;
}

interface DemoBranchSpec {
  name: string;
  location: string;
  daily_target: number;
  /** Jumlah transaksi per hari pada kondisi normal (PRD: 15–30). */
  tx_base: number;
  /** Pengali permintaan cabang (menyesuaikan skala cabang). */
  demand_factor: number;
}

interface DemoProductSpec {
  sku: string;
  name: string;
  category: string;
  cost_price: number;
  selling_price: number;
  aliases: string[];
  /** Permintaan dasar per hari (unit) pada kondisi normal. */
  demand: number;
  min_stock_alert: number;
}

interface TransactionSeed {
  id: string;
  client_tx_id: string;
  branch_id: string;
  business_date: string;
  transaction_date: string;
  input_method: 'DEMO' | 'VOICE';
  payment_method: 'CASH' | 'QRIS_SIM';
  voice_transcript: string | null;
  revenue: number;
  cogs: number;
}

type ItemSeed = {
  org_id: string;
  branch_id: string;
  transaction_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
  unit_price: number;
  created_at: string;
};

/** PRNG deterministik mulberry32 (PRD §11.1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** UUID deterministik yang dibangkitkan dari PRNG (untuk client_tx_id). */
function makeUuid(rng: () => number): string {
  const hex = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      out += '-';
    } else {
      out += hex[Math.floor(rng() * 16)];
    }
  }
  return out;
}

const BRANCHES: DemoBranchSpec[] = [
  {
    name: 'Malioboro',
    location: 'Jl. Malioboro, Kraton, Yogyakarta',
    daily_target: 3_000_000,
    tx_base: 28,
    demand_factor: 1.15,
  },
  {
    name: 'Condongcatur',
    location: 'Condongcatur, Depok, Sleman, DIY',
    daily_target: 2_500_000,
    tx_base: 24,
    demand_factor: 1.0,
  },
  {
    name: 'Bantul',
    location: 'Bantul, Bantul, DIY',
    daily_target: 2_000_000,
    tx_base: 20,
    demand_factor: 0.85,
  },
];

const PRODUCTS: DemoProductSpec[] = [
  { sku: 'KP-001', name: 'Es Kopi Susu', category: 'Minuman', cost_price: 7000, selling_price: 18000, aliases: ['kopsu', 'kopi susu'], demand: 32, min_stock_alert: 10 },
  { sku: 'KP-002', name: 'Kopi Hitam', category: 'Minuman', cost_price: 3000, selling_price: 12000, aliases: ['kopi hitam'], demand: 12, min_stock_alert: 8 },
  { sku: 'KP-003', name: 'Americano', category: 'Minuman', cost_price: 4000, selling_price: 16000, aliases: ['americano'], demand: 10, min_stock_alert: 8 },
  { sku: 'KP-004', name: 'Latte', category: 'Minuman', cost_price: 8000, selling_price: 22000, aliases: ['latte'], demand: 14, min_stock_alert: 8 },
  { sku: 'KP-005', name: 'Matcha Latte', category: 'Minuman', cost_price: 10000, selling_price: 25000, aliases: ['matcha'], demand: 16, min_stock_alert: 8 },
  { sku: 'KP-006', name: 'Teh Manis', category: 'Minuman', cost_price: 2000, selling_price: 8000, aliases: ['teh manis'], demand: 8, min_stock_alert: 10 },
  { sku: 'KP-007', name: 'Air Mineral', category: 'Minuman', cost_price: 2000, selling_price: 5000, aliases: ['air mineral', 'air putih'], demand: 10, min_stock_alert: 12 },
  { sku: 'MK-001', name: 'Roti Bakar', category: 'Makanan', cost_price: 6000, selling_price: 15000, aliases: ['roti bakar'], demand: 9, min_stock_alert: 8 },
  { sku: 'MK-002', name: 'Kentang Goreng', category: 'Makanan', cost_price: 7000, selling_price: 18000, aliases: ['kentang', 'fries'], demand: 13, min_stock_alert: 8 },
  { sku: 'MK-003', name: 'Nasi Goreng', category: 'Makanan', cost_price: 11000, selling_price: 25000, aliases: ['nasi goreng', 'nasgor'], demand: 11, min_stock_alert: 8 },
  { sku: 'MK-004', name: 'Mie Goreng', category: 'Makanan', cost_price: 9000, selling_price: 22000, aliases: ['mie goreng', 'mieg'], demand: 7, min_stock_alert: 8 },
  { sku: 'MK-005', name: 'Pisang Goreng', category: 'Makanan', cost_price: 4000, selling_price: 12000, aliases: ['pisang goreng'], demand: 6, min_stock_alert: 10 },
];

/**
 * Faktor cakupan stok per hari untuk memvariasikan urgensi rekomendasi stok.
 * Nilai < 1,5 → CRITICAL; 1,5–7 → perlu restock; > 7 → kelebihan stok.
 * Dipilih agar tab rekomendasi memperagakan seluruh status dan urgensi.
 */
const COVER_FACTORS = [0.9, 2.6, 8.5, 1.3, 12.0, 2.2, 6.0, 10.0, 1.6, 9.0, 4.5, 15.0];

/** Faktor musiman mingguan PRD §11.1 (Sen..Min). */
const WEEKDAY_FACTORS = [0.9, 0.9, 0.95, 1.0, 1.1, 1.3, 1.25];

const EXPENSE_TEMPLATES: { category: string; description: string; amount: number }[] = [
  { category: 'Utilitas', description: 'Listrik & air harian', amount: 50_000 },
  { category: 'Gaji', description: 'Gaji harian kasir & barista', amount: 200_000 },
  { category: 'Perlengkapan Operasional', description: 'Gelas, sedotan, tisu', amount: 100_000 },
  { category: 'Transportasi', description: 'Bensin antar cabang', amount: 20_000 },
];

const VOICE_TRANSCRIPTS = [
  'kopi susu dua teh manis satu bayar tunai',
  'americano satu kentang goreng dua',
  'matcha latte dua roti bakar satu qris',
  'nasi goreng satu air mineral dua',
];

function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi.');
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

type InsertRow = Record<string, unknown>;

/** Jumlah permintaan yang dijalankan bersamaan dalam satu gelombang. */
const CONCURRENCY = 4;

function toBatches(rows: InsertRow[]): InsertRow[][] {
  const batches: InsertRow[][] = [];
  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    batches.push(rows.slice(index, index + BATCH_SIZE));
  }
  return batches;
}

/** Menjalankan gelombang-gelombang batch secara paralel (4 per gelombang). */
async function runWaves<T>(
  batches: InsertRow[][],
  work: (slice: InsertRow[]) => Promise<T>
): Promise<T[]> {
  const out: T[] = [];
  for (let index = 0; index < batches.length; index += CONCURRENCY) {
    const wave = batches.slice(index, index + CONCURRENCY);
    out.push(...(await Promise.all(wave.map(work))));
  }
  return out;
}

async function bulkInsert(
  client: SupabaseClient,
  table: string,
  rows: InsertRow[]
): Promise<void> {
  const results = await runWaves(toBatches(rows), async (slice) => {
    const { error } = await client.from(table).insert(slice);
    return error ? error.message : null;
  });
  const failed = results.find(Boolean);
  if (failed) throw new Error(`Gagal menulis ${table}: ${failed}`);
}

async function bulkInsertReturning<R>(
  client: SupabaseClient,
  table: string,
  rows: InsertRow[]
): Promise<R[]> {
  const results = await runWaves(toBatches(rows), async (slice) => {
    const { data, error } = await client.from(table).insert(slice).select();
    if (error) return { error: error.message, rows: [] as R[] };
    return { error: null, rows: (data ?? []) as unknown as R[] };
  });

  const failed = results.find((result) => result.error);
  if (failed) throw new Error(`Gagal menulis ${table}: ${failed.error}`);

  return results.flatMap((result) => result.rows);
}

/**
 * Menjalankan seed ulang data demo untuk sebuah org.
 * Menghapus data bisnis lama lalu mengisi ulang sesuai PRD §11.1.
 */
export async function seedDemoData(input: DemoSeedInput): Promise<SeedResult> {
  const startedAt = Date.now();
  const client = createAdminClient();
  const rng = mulberry32(SEED_CONSTANT);
  const { orgId, actorUserId } = input;

  // ---------------------------------------------------------------- 1. Reset
  // Data bisnis org demo dihapus (kecuali organizations dan profiles).
  // Bertahap sesuai ketergantungan FK — tabel anak pada gelombang pertama,
  // transaksi & produk pada gelombang kedua; tiap gelombang paralel.
  const deleteWaves: [string, string][][] = [
    [
      ['transaction_items', 'org_id'],
      ['stock_transfers', 'org_id'],
      ['stock_movements', 'org_id'],
      ['forecasts', 'org_id'],
      ['ml_recommendations', 'org_id'],
      ['import_jobs', 'org_id'],
      ['expenses', 'org_id'],
    ],
    [
      ['transactions', 'org_id'],
      ['products', 'org_id'],
    ],
  ];

  for (const wave of deleteWaves) {
    const results = await Promise.all(
      wave.map(async ([table, column]) => {
        const { error } = await client.from(table).delete().eq(column, orgId);
        return error ? `${table}: ${error.message}` : null;
      })
    );
    const failed = results.find(Boolean);
    if (failed) throw new Error(`Gagal mereset ${failed}`);
  }

  // ------------------------------------------------- 2. Cabang sesuai PRD
  const { data: existingBranches, error: branchListError } = await client
    .from('branches')
    .select('id, name')
    .eq('org_id', orgId);
  if (branchListError) throw new Error(branchListError.message);

  const branchIds = new Map<string, string>();
  for (const spec of BRANCHES) {
    const found = (existingBranches || []).find((b) => b.name === spec.name);
    if (found) {
      branchIds.set(spec.name, found.id);
      const { error } = await client
        .from('branches')
        .update({ location: spec.location, daily_target: spec.daily_target, is_active: true })
        .eq('id', found.id);
      if (error) throw new Error(`Gagal memperbarui cabang ${spec.name}: ${error.message}`);
    } else {
      const { data, error } = await client
        .from('branches')
        .insert({
          org_id: orgId,
          name: spec.name,
          location: spec.location,
          daily_target: spec.daily_target,
          is_active: true,
        })
        .select('id')
        .single();
      if (error || !data) throw new Error(`Gagal membuat cabang ${spec.name}: ${error?.message}`);
      branchIds.set(spec.name, data.id);
    }
  }

  // Kasir demo diarahkan ke Malioboro (PRD §11.1) SEBELUM cabang lama dihapus,
  // karena profiles.branch_id bertipe RESTRICT + check role CASHIER wajib terisi.
  const { error: cashierError } = await client
    .from('profiles')
    .update({
      branch_id: branchIds.get('Malioboro'),
      full_name: 'Siti Rahma (Kasir Malioboro)',
    })
    .eq('org_id', orgId)
    .eq('role', 'CASHIER');
  if (cashierError) throw new Error(cashierError.message);

  // Cabang lama yang tidak ada di spesifikasi PRD dihapus.
  const prdNames = new Set(BRANCHES.map((b) => b.name));
  const staleBranchIds = (existingBranches || [])
    .filter((b) => !prdNames.has(b.name))
    .map((b) => b.id);
  if (staleBranchIds.length > 0) {
    const { error } = await client
      .from('branches')
      .delete()
      .in('id', staleBranchIds)
      .eq('org_id', orgId);
    if (error) throw new Error(`Gagal menghapus cabang lama: ${error.message}`);
  }

  // ------------------------------------------------------- 3. Produk & stok
  interface ProductRow {
    id: string;
    branch_id: string;
    sku: string;
    name: string;
    cost_price: number;
    selling_price: number;
    demand_per_day: number;
  }

  const productRows: {
    id: string;
    org_id: string;
    branch_id: string;
    sku: string;
    name: string;
    category: string;
    cost_price: number;
    selling_price: number;
    stock: number;
    min_stock_alert: number;
    aliases: string[];
    is_active: boolean;
  }[] = [];
  const productsByBranch = new Map<string, ProductRow[]>();

  BRANCHES.forEach((branchSpec, branchIndex) => {
    const branchId = branchIds.get(branchSpec.name);
    if (!branchId) return;
    const list: ProductRow[] = [];

    PRODUCTS.forEach((productSpec, productIndex) => {
      const dailyDemand = Math.round(productSpec.demand * branchSpec.demand_factor);
      let stock = Math.max(1, Math.round(dailyDemand * COVER_FACTORS[productIndex]));

      // Skenario penerimaan S2 & S3 (PRD §11.3): Bantul kritis, Malioboro surplus.
      if (productSpec.sku === 'KP-001' && branchSpec.name === 'Malioboro') stock = 220;
      if (productSpec.sku === 'KP-001' && branchSpec.name === 'Bantul') stock = 12;
      if (productSpec.sku === 'KP-001' && branchSpec.name === 'Condongcatur') {
        stock = Math.round(dailyDemand * 2.2);
      }
      // Cabang berbeda mendapat level stok berbeda agar variasi urgensi kaya.
      if (productSpec.sku !== 'KP-001' && branchIndex === 1 && productIndex % 2 === 0) {
        stock = Math.max(1, Math.round(stock * 0.55));
      }
      if (productSpec.sku !== 'KP-001' && branchIndex === 2 && productIndex % 3 === 0) {
        stock = Math.round(stock * 1.9);
      }

      const productId = makeUuid(rng);
      productRows.push({
        id: productId,
        org_id: orgId,
        branch_id: branchId,
        sku: productSpec.sku,
        name: productSpec.name,
        category: productSpec.category,
        cost_price: productSpec.cost_price,
        selling_price: productSpec.selling_price,
        stock,
        min_stock_alert: productSpec.min_stock_alert,
        aliases: productSpec.aliases,
        is_active: true,
      });

      list.push({
        id: productId,
        branch_id: branchId,
        sku: productSpec.sku,
        name: productSpec.name,
        cost_price: productSpec.cost_price,
        selling_price: productSpec.selling_price,
        demand_per_day: dailyDemand,
      });
    });

    productsByBranch.set(branchSpec.name, list);
  });

  // Id produk dibangkitkan deterministik supaya pemetaan id tidak bergantung
  // pada urutan hasil insert.
  const insertedProductCount = await bulkInsertReturning<{ id: string }>(
    client,
    'products',
    productRows
  );
  if (insertedProductCount.length !== productRows.length) {
    throw new Error('Jumlah produk yang tersimpan tidak sesuai.');
  }

  const catalog = new Map<string, ProductRow[]>();
  for (const branchSpec of BRANCHES) {
    const list = productsByBranch.get(branchSpec.name) || [];
    catalog.set(branchSpec.name, list);
  }

  // ------------------------------------------- 4. Transaksi 30 hari (D-30..D-1)
  const today = getBusinessDate();
  const transactions: TransactionSeed[] = [];
  const items: ItemSeed[] = [];

  for (let dayOffset = HISTORY_DAYS; dayOffset >= 1; dayOffset--) {
    const day = subDays(new Date(`${today}T12:00:00Z`), dayOffset);
    const businessDate = format(day, 'yyyy-MM-dd');
    // 0 = Senin .. 6 = Minggu
    const weekday = (day.getUTCDay() + 6) % 7;
    const weekFactor = WEEKDAY_FACTORS[weekday];

    for (const branchSpec of BRANCHES) {
      const branchId = branchIds.get(branchSpec.name);
      const branchCatalog = catalog.get(branchSpec.name) || [];
      if (!branchId || branchCatalog.length === 0) continue;

      // Skenario S4: omzet Condongcatur D-1 ± 55% dari normal.
      const scenarioFactor =
        branchSpec.name === 'Condongcatur' && dayOffset === 1 ? 0.55 : 1;

      const noise = 1 + (rng() - 0.5) * 0.3; // ±15%
      const txCount = Math.max(
        15,
        Math.min(30, Math.round(branchSpec.tx_base * weekFactor * noise * scenarioFactor))
      );

      // Slot menit genap unik 08.00–20.00 (selisih ≥ 2 menit antar transaksi
      // pada cabang yang sama), diacak tanpa pengulangan: detektor "transaksi
      // ganda" membandingkan created_at dalam jendela 60 detik, sehingga data
      // seeder tidak pernah memicu alarm untuk transaksi yang memang dibuat
      // terpisah oleh seeder.
      const minuteSlots = Array.from({ length: 6 * 60 }, (_, index) => index * 2);
      for (let index = minuteSlots.length - 1; index > 0; index--) {
        const swapWith = Math.floor(rng() * (index + 1));
        const temp = minuteSlots[index];
        minuteSlots[index] = minuteSlots[swapWith];
        minuteSlots[swapWith] = temp;
      }

      // Qty harian per produk dibentuk dari pola PRD (musiman mingguan +
      // noise ±15%) lalu dibagi ke dalam transaksi, sehingga deret harian
      // tetap terbaca model dan WAPE memenuhi target < 25% (PRD §11.3 S5).
      const dailyTargets = branchCatalog.map((product) => {
        const productNoise = 1 + (rng() - 0.5) * 0.3;
        const target = Math.round(
          product.demand_per_day * weekFactor * productNoise * scenarioFactor
        );
        return { product, quantity: Math.max(0, target) };
      });

      const transactionItemsByIndex = new Map<
        number,
        { product: ProductRow; quantity: number }[]
      >();
      let cursor = Math.floor(rng() * txCount);
      dailyTargets.forEach(({ product, quantity }) => {
        let remaining = quantity;
        while (remaining > 0) {
          const chunk = Math.min(remaining, 1 + Math.floor(rng() * 3));
          const txIndex = cursor++ % txCount;
          const bucket = transactionItemsByIndex.get(txIndex) || [];
          bucket.push({ product, quantity: chunk });
          transactionItemsByIndex.set(txIndex, bucket);
          remaining -= chunk;
        }
      });

      for (let txIndex = 0; txIndex < txCount; txIndex++) {
        const bucket = transactionItemsByIndex.get(txIndex);
        if (!bucket || bucket.length === 0) continue;

        const clientId = makeUuid(rng);
        const minuteSlot = minuteSlots[txIndex] ?? 0;
        const hour = 8 + Math.floor(minuteSlot / 60); // 08.00–20.00 WIB
        const minute = minuteSlot % 60;
        const transactionDate = `${businessDate}T${String(hour).padStart(2, '0')}:${String(
          minute
        ).padStart(2, '0')}:00+07:00`;

        // 10% transaksi input voice (PRD §11.1: sebagian kecil VOICE).
        const isVoice = rng() < 0.1;
        // 70% tunai, 30% QRIS (PRD §11.1).
        const isQris = rng() < 0.3;

        const tx: TransactionSeed = {
          id: makeUuid(rng),
          client_tx_id: clientId,
          branch_id: branchId,
          business_date: businessDate,
          transaction_date: transactionDate,
          input_method: isVoice ? 'VOICE' : 'DEMO',
          payment_method: isQris ? 'QRIS_SIM' : 'CASH',
          voice_transcript: isVoice
            ? VOICE_TRANSCRIPTS[Math.floor(rng() * VOICE_TRANSCRIPTS.length)]
            : null,
          revenue: 0,
          cogs: 0,
        };

        bucket.forEach(({ product, quantity }) => {
          tx.revenue += quantity * product.selling_price;
          tx.cogs += quantity * product.cost_price;

          items.push({
            org_id: orgId,
            branch_id: branchId,
            transaction_id: tx.id,
            product_id: product.id,
            product_name: product.name,
            quantity,
            unit_cost: product.cost_price,
            unit_price: product.selling_price,
            created_at: transactionDate,
          });
        });

        transactions.push(tx);
      }
    }
  }

  // Simpan transaksi dalam batch, lalu cocokkan id hasil insert dengan client_tx_id.
  const insertedTx = await bulkInsertReturning<{ id: string; client_tx_id: string }>(
    client,
    'transactions',
    transactions.map((tx) => ({
      org_id: orgId,
      branch_id: tx.branch_id,
      created_by: actorUserId,
      client_tx_id: tx.client_tx_id,
      transaction_date: tx.transaction_date,
      business_date: tx.business_date,
      // created_at diisi sama dengan waktu penjualan (bukan waktu seed)
      // agar riwayat waktu yang dibaca detektor anomali & daftar transaksi
      // konsisten dengan tanggal transaksinya.
      created_at: tx.transaction_date,
      input_method: tx.input_method,
      payment_method: tx.payment_method,
      status: 'COMPLETED',
      total_revenue: tx.revenue,
      total_cogs: tx.cogs,
      voice_transcript: tx.voice_transcript,
    }))
  );
  if (insertedTx.length !== transactions.length) {
    throw new Error('Sebagian transaksi demo gagal tersimpan.');
  }

  const idByClientTxId = new Map<string, string>();
  insertedTx.forEach((row) => idByClientTxId.set(row.client_tx_id, row.id));

  const dbIdByLocalTxId = new Map<string, string>();
  transactions.forEach((tx) => {
    const dbId = idByClientTxId.get(tx.client_tx_id);
    if (dbId) dbIdByLocalTxId.set(tx.id, dbId);
  });

  const itemsWithDbId = items
    .map((item) => {
      const dbId = dbIdByLocalTxId.get(item.transaction_id);
      return dbId ? { ...item, transaction_id: dbId } : null;
    })
    .filter((item): item is ItemSeed => item !== null);

  if (itemsWithDbId.length !== items.length) {
    throw new Error('Sebagian item transaksi gagal dipetakan ke transaksi induk.');
  }

  // transaction_items tidak memiliki kolom created_at — waktu dipakai untuk
  // timestamp mutasi stok saja.
  await bulkInsert(
    client,
    'transaction_items',
    itemsWithDbId.map((item) => ({
      org_id: item.org_id,
      branch_id: item.branch_id,
      transaction_id: item.transaction_id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      unit_price: item.unit_price,
    }))
  );

  // ------------------------------------- 5. Mutasi stok SALE (kartu stok riil)
  // Mutasi direkap per produk per hari (bukan per transaksi): deret riwayat
  // log stok tetap utuh untuk 30 hari sementara jumlah baris jauh lebih
  // sedikit, sehingga seed jauh di bawah target 15 detik (PRD §11.1).
  const totalSoldByProduct = new Map<string, number>();
  const soldByProductDay = new Map<
    string,
    Map<string, { day: string; branch_id: string; quantity: number; unit_cost: number; name: string }>
  >();

  itemsWithDbId.forEach((item) => {
    const day = item.created_at.slice(0, 10);
    totalSoldByProduct.set(
      item.product_id,
      (totalSoldByProduct.get(item.product_id) || 0) + item.quantity
    );

    let byDay = soldByProductDay.get(item.product_id);
    if (!byDay) {
      byDay = new Map();
      soldByProductDay.set(item.product_id, byDay);
    }
    const existing = byDay.get(day);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      byDay.set(day, {
        day,
        branch_id: item.branch_id,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        name: item.product_name,
      });
    }
  });

  const movementRows: {
    org_id: string;
    branch_id: string;
    product_id: string;
    movement_type: string;
    quantity_change: number;
    stock_after: number;
    unit_cost: number | null;
    reference_type: string | null;
    reference_id: string | null;
    note: string | null;
    created_by: string;
    created_at: string;
  }[] = [];

  // Stok awal = stok akhir + total terjual, lalu dijalankan maju per hari agar
  // kolom stock_after konsisten dengan stok akhir produk.
  productRows.forEach((product) => {
    const byDay = soldByProductDay.get(product.id);
    if (!byDay) return;

    const days = Array.from(byDay.values()).sort((a, b) => (a.day < b.day ? -1 : 1));
    let running = product.stock + (totalSoldByProduct.get(product.id) || 0);

    days.forEach((entry) => {
      running = Math.max(0, running - entry.quantity);
      movementRows.push({
        org_id: orgId,
        branch_id: entry.branch_id,
        product_id: product.id,
        movement_type: 'SALE',
        quantity_change: -entry.quantity,
        stock_after: running,
        unit_cost: entry.unit_cost,
        reference_type: null,
        reference_id: null,
        note: `Rekap penjualan harian ${entry.name} (${entry.quantity} unit)`,
        created_by: actorUserId,
        created_at: `${entry.day}T23:59:00+07:00`,
      });
    });
  });

  await bulkInsert(client, 'stock_movements', movementRows);

  // ------------------------------------------------- 6. Pengeluaran harian
  const expenses: {
    org_id: string;
    branch_id: string;
    created_by: string;
    expense_date: string;
    category: string;
    description: string;
    amount: number;
    input_method: string;
    voice_transcript: string | null;
    is_anomaly: boolean;
    anomaly_score: number;
    anomaly_reason: string | null;
  }[] = [];

  for (let dayOffset = HISTORY_DAYS; dayOffset >= 1; dayOffset--) {
    const day = subDays(new Date(`${today}T12:00:00Z`), dayOffset);
    const businessDate = format(day, 'yyyy-MM-dd');

    for (const branchSpec of BRANCHES) {
      const branchId = branchIds.get(branchSpec.name);
      if (!branchId) continue;

      for (const template of EXPENSE_TEMPLATES) {
        const variation = 1 + (rng() - 0.5) * 0.4; // ±20%
        let amount = Math.round((template.amount * variation) / 1000) * 1000;

        // Skenario S1: pengeluaran Perlengkapan Operasional Condongcatur D-1
        // melonjak menjadi Rp 850.000 (normal ± Rp 100.000).
        if (
          template.category === 'Perlengkapan Operasional' &&
          branchSpec.name === 'Condongcatur' &&
          dayOffset === 1
        ) {
          amount = 850_000;
        }

        expenses.push({
          org_id: orgId,
          branch_id: branchId,
          created_by: actorUserId,
          expense_date: businessDate,
          category: template.category,
          description: template.description,
          amount,
          input_method: 'DEMO',
          voice_transcript: null,
          is_anomaly: false,
          anomaly_score: 0,
          anomaly_reason: null,
        });
      }
    }
  }

  // Skenario S1: lonjakan biaya Perlengkapan Operasional Condongcatur D-1
  // ditandai sebagai anomali terbuka. Baseline dihitung saat ini juga dari
  // pengeluaran kategori & cabang yang sama, dengan format penulisan yang sama
  // dengan detektor anomali aplikasi.
  const scenarioExpense = expenses.find(
    (expense) =>
      expense.category === 'Perlengkapan Operasional' && expense.amount === 850_000
  );
  if (scenarioExpense) {
    const baseline = expenses.filter(
      (expense) =>
        expense.branch_id === scenarioExpense.branch_id &&
        expense.category === scenarioExpense.category &&
        expense !== scenarioExpense
    );
    const mean =
      baseline.reduce((sum, expense) => sum + expense.amount, 0) / Math.max(1, baseline.length);
    const variance =
      baseline.length > 1
        ? baseline.reduce((sum, expense) => sum + (expense.amount - mean) ** 2, 0) /
          (baseline.length - 1)
        : 0;
    const stdDev = Math.sqrt(variance) || mean * 0.3;
    const zScore = (scenarioExpense.amount - mean) / stdDev;
    const ratio = Math.round((scenarioExpense.amount / mean) * 10) / 10;

    scenarioExpense.is_anomaly = true;
    scenarioExpense.anomaly_score = Math.min(99.99, Math.round(zScore * 100) / 100);
    scenarioExpense.anomaly_reason = `Rp ${scenarioExpense.amount.toLocaleString(
      'id-ID'
    )}, sekitar ${ratio}x dari rata-rata biasanya (Rp ${Math.round(mean).toLocaleString(
      'id-ID'
    )}) untuk kategori ${scenarioExpense.category}.`;
  }

  await bulkInsert(client, 'expenses', expenses);

  const durationMs = Date.now() - startedAt;

  return {
    branches: BRANCHES.length,
    products: productRows.length,
    transactions: insertedTx.length,
    transaction_items: itemsWithDbId.length,
    stock_movements: movementRows.length,
    expenses: expenses.length,
    duration_ms: durationMs,
  };
}
