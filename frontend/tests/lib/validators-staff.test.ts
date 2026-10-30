import { describe, it, expect } from 'vitest';
import { createCashierSchema, updateCashierSchema } from '@/lib/validators/staff';

describe('Staff & Cashier Validators', () => {
  describe('createCashierSchema', () => {
    it('validates a correct cashier creation payload', () => {
      const valid = {
        full_name: 'Siti Barista',
        email: 'siti.barista@alur.id',
        password: 'Password123!',
        branch_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      };

      const result = createCashierSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('siti.barista@alur.id');
        expect(result.data.full_name).toBe('Siti Barista');
      }
    });

    it('rejects short names or empty fields', () => {
      const invalid = {
        full_name: 'A',
        email: 'not-an-email',
        password: '123',
        branch_id: 'invalid-uuid',
      };

      const result = createCashierSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.full_name).toBeDefined();
        expect(errors.email).toBeDefined();
        expect(errors.password).toBeDefined();
        expect(errors.branch_id).toBeDefined();
      }
    });
  });

  describe('updateCashierSchema', () => {
    it('validates partial updates', () => {
      const updateBranch = {
        branch_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      };
      expect(updateCashierSchema.safeParse(updateBranch).success).toBe(true);

      const updateStatus = {
        is_active: false,
      };
      expect(updateCashierSchema.safeParse(updateStatus).success).toBe(true);

      const updatePassword = {
        password: 'NewSecretPass123',
      };
      expect(updateCashierSchema.safeParse(updatePassword).success).toBe(true);
    });

    it('rejects short passwords in update', () => {
      const invalid = {
        password: '123',
      };
      const result = updateCashierSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
