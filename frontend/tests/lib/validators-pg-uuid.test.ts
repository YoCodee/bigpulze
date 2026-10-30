import { pgUuid } from '@/lib/validators/pg-uuid';
import { describe, expect, it } from 'vitest';

const MSG = 'Format ID produk tidak valid';

describe('pgUuid', () => {
  it('accepts canonical v4 uuids', () => {
    expect(pgUuid(MSG).safeParse('3f7a6b32-8e15-4c7e-9d2b-1a34fc00aa11').success).toBe(true);
  });

  it('accepts legacy seeded ids (non-canonical version/variant) that Postgres accepts', () => {
    // Pre-fix demo seeder: random version nibble (7) and variant (0).
    expect(pgUuid(MSG).safeParse('104ca645-7eea-8a19-7482-44b95c74aef5').success).toBe(true);
    expect(pgUuid(MSG).safeParse('2aa94f41-7506-a656-3b7d-f2272fd2e132').success).toBe(true);
  });

  it('accepts uppercase hex', () => {
    expect(pgUuid(MSG).safeParse('104CA645-7EEA-8A19-7482-44B95C74AEF5').success).toBe(true);
  });

  it('rejects non-uuid strings', () => {
    expect(pgUuid(MSG).safeParse('SKU-001').success).toBe(false);
    expect(pgUuid(MSG).safeParse('104ca6457eea8a19748244b95c74aef5').success).toBe(false);
    expect(pgUuid(MSG).safeParse('').success).toBe(false);
  });
});
