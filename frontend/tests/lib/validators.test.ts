import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '@/lib/validators/auth';
import { createBranchSchema, updateBranchSchema } from '@/lib/validators/branches';
import { createProductSchema, updateProductSchema } from '@/lib/validators/products';

describe('Auth Validators', () => {
  it('validates correct registration payload', () => {
    const valid = {
      org_name: 'Kopi Nusantara',
      full_name: 'Budi Santoso',
      email: 'owner@kopi.id',
      password: 'password123',
    };
    const res = registerSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('rejects short passwords and invalid emails', () => {
    const invalid = {
      org_name: 'K',
      full_name: 'B',
      email: 'bukan-email',
      password: '123',
    };
    const res = registerSchema.safeParse(invalid);
    expect(res.success).toBe(false);
    if (!res.success) {
      const fieldErrors = res.error.flatten().fieldErrors;
      expect(fieldErrors.email).toBeDefined();
      expect(fieldErrors.password).toBeDefined();
      expect(fieldErrors.org_name).toBeDefined();
    }
  });

  it('validates login payload', () => {
    const res = loginSchema.safeParse({ email: 'owner@kopi.id', password: 'secret' });
    expect(res.success).toBe(true);
  });
});

describe('Branch Validators', () => {
  it('validates correct branch creation payload', () => {
    const valid = {
      name: 'Cabang Malioboro',
      location: 'Jl. Malioboro No. 12, Yogyakarta',
      daily_target: 3000000,
    };
    const res = createBranchSchema.safeParse(valid);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.daily_target).toBe(3000000);
    }
  });

  it('rejects negative daily target', () => {
    const invalid = {
      name: 'Cabang Malioboro',
      location: 'Jl. Malioboro No. 12',
      daily_target: -500000,
    };
    const res = createBranchSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it('allows partial update for branches', () => {
    const update = {
      daily_target: 4000000,
      is_active: false,
    };
    const res = updateBranchSchema.safeParse(update);
    expect(res.success).toBe(true);
  });
});

describe('Product Validators', () => {
  it('validates correct product creation payload', () => {
    const valid = {
      branch_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      sku: 'KP-001',
      name: 'Es Kopi Susu',
      category: 'Minuman',
      cost_price: 7000,
      selling_price: 18000,
      min_stock_alert: 10,
      aliases: ['kopsu', 'kopi susu'],
    };
    const res = createProductSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('rejects negative cost price or selling price', () => {
    const invalid = {
      branch_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      sku: 'KP-001',
      name: 'Es Kopi Susu',
      category: 'Minuman',
      cost_price: -1000,
      selling_price: 18000,
    };
    const res = createProductSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it('rejects invalid UUID branch_id', () => {
    const invalid = {
      branch_id: 'bukan-uuid',
      sku: 'KP-001',
      name: 'Es Kopi Susu',
      category: 'Minuman',
      cost_price: 7000,
      selling_price: 18000,
    };
    const res = createProductSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });
});
