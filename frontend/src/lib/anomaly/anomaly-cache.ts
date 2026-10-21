// Global memory cache for resolved live anomalies within server session
export const resolvedLiveAnomalies = new Map<string, { resolved_at: string; note?: string }>();

export function markLiveAnomalyResolved(id: string, note?: string) {
  resolvedLiveAnomalies.set(id, {
    resolved_at: new Date().toISOString(),
    note,
  });
}

export function isLiveAnomalyResolved(id: string): boolean {
  return resolvedLiveAnomalies.has(id);
}
