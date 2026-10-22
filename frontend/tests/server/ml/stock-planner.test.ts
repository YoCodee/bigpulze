import { describe, it, expect } from 'vitest';
import {
  planStock,
  summarizeStockPlans,
  sortStockPlans,
  StockPlannerInput,
} from '@/server/ml/stock-planner';

function baseInput(overrides: Partial<StockPlannerInput> = {}): StockPlannerInput {
  return {
    product_id: 'prod-1',
    branch_id: 'branch-1',
    sku: 'KP-001',
    name: 'Es Kopi Susu',
    current_stock: 100,
    min_stock_alert: 10,
    cost_price: 7000,
    selling_price: 18000,
    forecast_total: 245,
    horizon_days: 7,
    ...overrides,
  };
}

describe('planStock', () => {
  it('menghitung target stok, defisit, dan cakupan sesuai rumus PRD §10.3', () => {
    const plan = planStock(baseInput());

    expect(plan.average_daily).toBe(35);
    expect(plan.days_of_cover).toBeCloseTo(2.86, 2);
    expect(plan.target_stock).toBe(255); // ceil(245) + min_stock_alert 10
    expect(plan.deficit).toBe(155);
    expect(plan.surplus).toBe(0);
    expect(plan.status).toBe('RESTOCK');
  });

  it('menandai stok kritis sebagai CRITICAL bila cakupan < 1,5 hari', () => {
    const plan = planStock(baseInput({ current_stock: 12, forecast_total: 245 }));

    expect(plan.days_of_cover).toBeCloseTo(0.34, 2);
    expect(plan.urgency).toBe('CRITICAL');
    expect(plan.deficit).toBe(243);
  });

  it('menandai stok kritis sebagai WARNING bila stok > min_stock_alert tapi cakupan < 3 hari', () => {
    const plan = planStock(
      baseInput({ current_stock: 20, forecast_total: 70, min_stock_alert: 10 })
    );

    expect(plan.urgency).toBe('WARNING');
    expect(plan.days_of_cover).toBe(2);
  });

  it('menandai CRITICAL bila stok habis', () => {
    const plan = planStock(baseInput({ current_stock: 0 }));

    expect(plan.urgency).toBe('CRITICAL');
    expect(plan.deficit).toBe(255);
  });

  it('tidak membuat defisit bila stok sudah melebihi target', () => {
    const plan = planStock(baseInput({ current_stock: 400 }));

    expect(plan.deficit).toBe(0);
    expect(plan.surplus).toBe(145);
    expect(plan.status).toBe('SURPLUS');
    expect(plan.urgency).toBe('INFO');
  });

  it('menandai status BALANCED saat stok pas dengan target', () => {
    const plan = planStock(baseInput({ current_stock: 255 }));

    expect(plan.deficit).toBe(0);
    expect(plan.surplus).toBe(0);
    expect(plan.status).toBe('BALANCED');
  });

  it('menggunakan days_of_cover null bila tidak ada riwayat penjualan', () => {
    const plan = planStock(baseInput({ current_stock: 50, forecast_total: 0 }));

    expect(plan.days_of_cover).toBeNull();
    expect(plan.average_daily).toBe(0);
    expect(plan.target_stock).toBe(10);
    expect(plan.deficit).toBe(0);
    expect(plan.status).toBe('SURPLUS');
    expect(plan.surplus).toBe(40);
  });

  it('menghitung defisit untuk stok kosong tanpa riwayat penjualan', () => {
    const plan = planStock(
      baseInput({ current_stock: 0, forecast_total: 0, min_stock_alert: 10 })
    );

    expect(plan.deficit).toBe(10);
    expect(plan.status).toBe('RESTOCK');
    expect(plan.urgency).toBe('CRITICAL');
  });

  it('menyesuaikan horizon 30 hari pada perhitungan rata-rata harian', () => {
    const plan = planStock(
      baseInput({ forecast_total: 900, horizon_days: 30, current_stock: 100 })
    );

    expect(plan.average_daily).toBe(30);
    expect(plan.target_stock).toBe(910);
    expect(plan.deficit).toBe(810);
  });

  it('menyertakan alasan berbahasa Indonesia yang menjelaskan perhitungan', () => {
    const plan = planStock(baseInput({ current_stock: 12 }));

    expect(plan.reason).toContain('Prediksi penjualan 7 hari');
    expect(plan.reason).toContain('Target stok 255 unit');
    expect(plan.reason).toContain('restock 243 unit');
  });
});

describe('summarizeStockPlans', () => {
  it('menghitung ringkasan metrik rekomendasi', () => {
    const plans = [
      planStock(baseInput({ product_id: 'p1', current_stock: 12, forecast_total: 245 })),
      planStock(baseInput({ product_id: 'p2', current_stock: 400, forecast_total: 245 })),
      planStock(baseInput({ product_id: 'p3', current_stock: 255, forecast_total: 245 })),
    ];

    const summary = summarizeStockPlans(plans);

    expect(summary.total_products).toBe(3);
    expect(summary.products_needing_restock).toBe(1);
    expect(summary.critical_count).toBe(1);
    expect(summary.surplus_count).toBe(1);
    expect(summary.total_suggested_qty).toBe(243);
    // 243 unit x Rp 7.000
    expect(summary.estimated_capital).toBe(1701000);
  });
});

describe('sortStockPlans', () => {
  it('mengurutkan item kritis lebih dulu lalu defisit terbesar', () => {
    const plans = [
      planStock(baseInput({ product_id: 'info', name: 'A', current_stock: 255, forecast_total: 245 })),
      planStock(
        baseInput({ product_id: 'warn', name: 'B', current_stock: 20, forecast_total: 70, min_stock_alert: 10 })
      ),
      planStock(baseInput({ product_id: 'crit', name: 'C', current_stock: 0, forecast_total: 245 })),
    ];

    const sorted = sortStockPlans(plans);
    expect(sorted[0].urgency).toBe('CRITICAL');
    expect(sorted[1].urgency).toBe('WARNING');
    expect(sorted[2].urgency).toBe('INFO');
  });
});
