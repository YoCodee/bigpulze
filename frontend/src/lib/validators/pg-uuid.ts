import { z } from 'zod';

/**
 * Matches every id PostgreSQL's uuid type accepts (8-4-4-4-12 hex).
 *
 * Intentionally looser than `z.string().uuid()`, which demands canonical
 * RFC 9562 version/variant nibbles and rejects legacy ids (e.g. products
 * seeded before the seeder emitted canonical v4) that Postgres itself stores
 * without complaint. The database is the format authority here.
 */
const PG_UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function pgUuid(message: string) {
  return z.string().regex(PG_UUID_PATTERN, message);
}
