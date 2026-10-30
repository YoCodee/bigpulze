import { z } from 'zod';
import { makeUuid, mulberry32 } from '@/server/demo/seed';
import { describe, expect, it } from 'vitest';

describe('makeUuid (demo seeder ids)', () => {
  it('generates ids accepted by the app uuid validator (zod v4 canonical)', () => {
    const schema = z.string().uuid();
    const rng = mulberry32(42);
    for (let i = 0; i < 50; i += 1) {
      expect(schema.safeParse(makeUuid(rng)).success).toBe(true);
    }
  });
});
