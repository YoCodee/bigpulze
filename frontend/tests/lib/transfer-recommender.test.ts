import { describe, it, expect } from 'vitest';
import {
  calculateDaysOfSupply,
  generateStockTransferRecommendations,
  BranchProductStock,
} from '@/lib/stock/transfer-recommender';

describe('calculateDaysOfSupply', () => {
  it('calculates days of supply accurately', () => {
    expect(calculateDaysOfSupply(50, 10)).toBe(5);
    expect(calculateDaysOfSupply(15, 6)).toBe(2.5);
    expect(calculateDaysOfSupply(0, 5)).toBe(0);
    expect(calculateDaysOfSupply(100, 0)).toBe(999);
  });
});

describe('generateStockTransferRecommendations', () => {
  it('generates stock transfer recommendation when recipient is critical and donor has surplus', () => {
    const catalog: BranchProductStock[] = [
      {
        product_id: 'prod-thamrin-kopsu',
        branch_id: 'branch-thamrin',
        branch_name: 'Cabang Thamrin',
        sku: 'KOPSU-001',
        name: 'Es Kopi Susu',
        category: 'Coffee',
        selling_price: 25000,
        cost_price: 10000,
        current_stock: 2, // Critical (< min alert 10 and < 3 days)
        min_stock_alert: 10,
        daily_sales_velocity: 4,
      },
      {
        product_id: 'prod-sudirman-kopsu',
        branch_id: 'branch-sudirman',
        branch_name: 'Cabang Sudirman',
        sku: 'KOPSU-001',
        name: 'Es Kopi Susu',
        category: 'Coffee',
        selling_price: 25000,
        cost_price: 10000,
        current_stock: 60, // Large surplus
        min_stock_alert: 10,
        daily_sales_velocity: 2,
      },
    ];

    const recommendations = generateStockTransferRecommendations(catalog);

    expect(recommendations.length).toBe(1);
    const rec = recommendations[0];

    expect(rec.from_branch_id).toBe('branch-sudirman');
    expect(rec.to_branch_id).toBe('branch-thamrin');
    expect(rec.sku).toBe('KOPSU-001');
    expect(rec.transfer_qty).toBeGreaterThan(0);
    expect(rec.from_stock_after).toBeGreaterThanOrEqual(15); // Donor safe buffer preserved
    expect(rec.to_stock_after).toBe(rec.to_current_stock + rec.transfer_qty);
    expect(rec.net_benefit).toBe(rec.estimated_gross_profit);
    expect(rec.net_benefit).toBeGreaterThan(0);
    expect(rec.urgency).toBe('CRITICAL');
  });

  it('recommends even small-margin transfers (logistics cost excluded)', () => {
    const catalog: BranchProductStock[] = [
      {
        product_id: 'prod-t1',
        branch_id: 'b1',
        branch_name: 'Cabang 1',
        sku: 'TISSUE-01',
        name: 'Tissue Pack',
        category: 'Supplies',
        selling_price: 3500,
        cost_price: 3200, // Margin is only Rp 300 per unit
        current_stock: 1,
        min_stock_alert: 5,
        daily_sales_velocity: 1,
      },
      {
        product_id: 'prod-t2',
        branch_id: 'b2',
        branch_name: 'Cabang 2',
        sku: 'TISSUE-01',
        name: 'Tissue Pack',
        category: 'Supplies',
        selling_price: 3500,
        cost_price: 3200,
        current_stock: 25,
        min_stock_alert: 5,
        daily_sales_velocity: 1,
      },
    ];

    // Transferring ~9 units yields only 9 * 300 = Rp 2.700 gross profit.
    // Logistics cost is no longer subtracted, so the move stays recommendable.
    const recommendations = generateStockTransferRecommendations(catalog);

    expect(recommendations.length).toBe(1);
    expect(recommendations[0].net_benefit).toBe(2700);
  });

  it('does not generate recommendation if donor has no surplus above safe reserve', () => {
    const catalog: BranchProductStock[] = [
      {
        product_id: 'prod-1',
        branch_id: 'b1',
        branch_name: 'Cabang 1',
        sku: 'MATCHA-01',
        name: 'Matcha Latte',
        category: 'Tea',
        selling_price: 30000,
        cost_price: 15000,
        current_stock: 2,
        min_stock_alert: 10,
        daily_sales_velocity: 3,
      },
      {
        product_id: 'prod-2',
        branch_id: 'b2',
        branch_name: 'Cabang 2',
        sku: 'MATCHA-01',
        name: 'Matcha Latte',
        category: 'Tea',
        selling_price: 30000,
        cost_price: 15000,
        current_stock: 12, // Needs 1.5 * 10 = 15 or 5*2=10 safe reserve -> surplus is 0
        min_stock_alert: 10,
        daily_sales_velocity: 2,
      },
    ];

    const recommendations = generateStockTransferRecommendations(catalog);
    expect(recommendations.length).toBe(0);
  });

  it('selects donor with highest surplus when multiple donor candidates exist', () => {
    const catalog: BranchProductStock[] = [
      {
        product_id: 'prod-recipient',
        branch_id: 'b-rec',
        branch_name: 'Cabang Kritis',
        sku: 'CROISSANT-01',
        name: 'Butter Croissant',
        category: 'Pastry',
        selling_price: 22000,
        cost_price: 8000,
        current_stock: 1,
        min_stock_alert: 8,
        daily_sales_velocity: 5,
      },
      {
        product_id: 'prod-donor-1',
        branch_id: 'b-donor-1',
        branch_name: 'Cabang Donor Sedang',
        sku: 'CROISSANT-01',
        name: 'Butter Croissant',
        category: 'Pastry',
        selling_price: 22000,
        cost_price: 8000,
        current_stock: 25, // Surplus ~10
        min_stock_alert: 8,
        daily_sales_velocity: 2,
      },
      {
        product_id: 'prod-donor-2',
        branch_id: 'b-donor-2',
        branch_name: 'Cabang Donor Kaya',
        sku: 'CROISSANT-01',
        name: 'Butter Croissant',
        category: 'Pastry',
        selling_price: 22000,
        cost_price: 8000,
        current_stock: 80, // Surplus ~65 (Largest surplus)
        min_stock_alert: 8,
        daily_sales_velocity: 2,
      },
    ];

    const recommendations = generateStockTransferRecommendations(catalog);
    expect(recommendations.length).toBe(1);
    expect(recommendations[0].from_branch_id).toBe('b-donor-2');
  });

  it('does not cross-match products with different SKUs', () => {
    const catalog: BranchProductStock[] = [
      {
        product_id: 'prod-1',
        branch_id: 'b1',
        branch_name: 'Cabang 1',
        sku: 'SKU-AAA',
        name: 'Produk A',
        category: 'Cat',
        selling_price: 50000,
        cost_price: 20000,
        current_stock: 0,
        min_stock_alert: 10,
        daily_sales_velocity: 2,
      },
      {
        product_id: 'prod-2',
        branch_id: 'b2',
        branch_name: 'Cabang 2',
        sku: 'SKU-BBB', // Different SKU
        name: 'Produk B',
        category: 'Cat',
        selling_price: 50000,
        cost_price: 20000,
        current_stock: 100,
        min_stock_alert: 10,
        daily_sales_velocity: 2,
      },
    ];

    const recommendations = generateStockTransferRecommendations(catalog);
    expect(recommendations.length).toBe(0);
  });
});
