import { describe, it, expect } from 'vitest';
import { createSaleSchema, voidSaleSchema } from '@/lib/validators/transactions';
import { restockProductSchema, adjustStockSchema, transferStockSchema } from '@/lib/validators/stock';
import { createExpenseSchema, updateExpenseSchema } from '@/lib/validators/expenses';

describe('Transaction Validators', () => {
  const sampleBranchId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const sampleProdId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  it('validates correct createSale payload', () => {
    const valid = {
      branch_id: sampleBranchId,
      items: [
        { product_id: sampleProdId, quantity: 2 },
      ],
      payment_method: 'CASH',
      input_method: 'MANUAL',
      client_tx_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      cash_tendered: 50000,
    };
    const res = createSaleSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('rejects createSale with empty items array', () => {
    const invalid = {
      branch_id: sampleBranchId,
      items: [],
      payment_method: 'CASH',
    };
    const res = createSaleSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it('rejects item with zero or negative quantity', () => {
    const invalid = {
      branch_id: sampleBranchId,
      items: [{ product_id: sampleProdId, quantity: 0 }],
    };
    const res = createSaleSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it('validates voidSale with reason', () => {
    const valid = { reason: 'Pelanggan salah pesan dan belum diminum' };
    const res = voidSaleSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('rejects voidSale with empty reason', () => {
    const invalid = { reason: '  ' };
    const res = voidSaleSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });
});

describe('Stock Validators', () => {
  const prodId1 = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  const prodId2 = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';

  it('validates restockProduct payload', () => {
    const valid = {
      product_id: prodId1,
      quantity: 50,
      unit_cost: 8000,
      note: 'Kulakan dari distributor utama',
    };
    const res = restockProductSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('rejects restock with zero or negative quantity', () => {
    const invalid = {
      product_id: prodId1,
      quantity: 0,
    };
    const res = restockProductSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it('validates adjustStock payload', () => {
    const valid = {
      product_id: prodId1,
      new_stock: 12,
      reason: 'Hasil stock opname fisik',
    };
    const res = adjustStockSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('rejects adjustStock with negative stock', () => {
    const invalid = {
      product_id: prodId1,
      new_stock: -5,
      reason: 'Alasan opname',
    };
    const res = adjustStockSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it('validates transferStock between different products', () => {
    const valid = {
      from_product_id: prodId1,
      to_product_id: prodId2,
      quantity: 10,
    };
    const res = transferStockSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('rejects transferStock if source and target products are identical', () => {
    const invalid = {
      from_product_id: prodId1,
      to_product_id: prodId1,
      quantity: 10,
    };
    const res = transferStockSchema.safeParse(invalid);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toContain('tidak boleh sama');
    }
  });
});

describe('Expense Validators', () => {
  const branchId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  it('validates correct expense creation', () => {
    const valid = {
      branch_id: branchId,
      category: 'Utilitas',
      description: 'Bayar tagihan listrik PLN bulan Oktober',
      amount: 450000,
      expense_date: '2026-10-19',
    };
    const res = createExpenseSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('rejects invalid expense category', () => {
    const invalid = {
      branch_id: branchId,
      category: 'KategoriTidakValid',
      description: 'Belanja tak jelas',
      amount: 50000,
    };
    const res = createExpenseSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it('rejects zero or negative expense amount', () => {
    const invalid = {
      branch_id: branchId,
      category: 'Sewa',
      description: 'Sewa ruko',
      amount: 0,
    };
    const res = createExpenseSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it('validates partial update expense', () => {
    const valid = {
      amount: 600000,
      description: 'Revisi tagihan listrik PLN',
    };
    const res = updateExpenseSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });
});
