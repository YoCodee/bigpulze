/**
 * Formats an integer amount in whole IDR (rupiah) without decimals.
 * Follows PRD Locked Decision D4 and AGENTS.md section 6.
 * Example: 1250000 -> "Rp 1.250.000"
 */
export function formatRupiah(amount: number | bigint | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return 'Rp 0';
  }
  const numericVal = typeof amount === 'bigint' ? Number(amount) : Math.round(amount);
  const formatted = new Intl.NumberFormat('id-ID').format(numericVal);
  return `Rp ${formatted}`;
}

/**
 * Formats a decimal/percentage number to 1 decimal place.
 * Example: 12.4 -> "12,4%"
 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  return `${new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

/**
 * Formats a regular count / integer.
 * Example: 1500 -> "1.500"
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return new Intl.NumberFormat('id-ID').format(Math.round(value));
}
