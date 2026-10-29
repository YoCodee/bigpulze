/**
 * Tiny in-memory sliding-window rate limiter for the assistant chat endpoint.
 *
 * Per-instance only (resets on deploy/restart) — sufficient as a soft guard
 * against runaway loops; not an accounting-grade counter.
 */

const WINDOW_MS = 60_000;
const MAX_EVENTS_PER_WINDOW = 20;

const hitTimestamps = new Map<string, number[]>();

export function isRateLimited(key: string, now: number = Date.now()): boolean {
  const previous = (hitTimestamps.get(key) || []).filter(
    (timestamp) => now - timestamp < WINDOW_MS
  );

  if (previous.length >= MAX_EVENTS_PER_WINDOW) {
    hitTimestamps.set(key, previous);
    return true;
  }

  previous.push(now);
  hitTimestamps.set(key, previous);

  // Opportunistic cleanup; keeps the map small between hits.
  if (hitTimestamps.size > 10_000) {
    for (const [mapKey, timestamps] of Array.from(hitTimestamps.entries())) {
      if (timestamps[timestamps.length - 1] < now - WINDOW_MS) {
        hitTimestamps.delete(mapKey);
      }
    }
  }

  return false;
}
