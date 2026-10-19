import { describe, it, expect } from 'vitest';
import { formatRupiah, formatPercent, formatNumber } from '@/lib/format';

describe('formatRupiah', () => {
  it('formats whole rupiah correctly according to PRD D4', () => {
    // Note: Intl id-ID uses non-breaking space (char code 160) or standard space between Rp and digits depending on ICU
    const formatted = formatRupiah(1250000).replace(/\u00a0/g, ' ');
    expect(formatted).toBe('Rp 1.250.000');
  });

  it('handles zero correctly', () => {
    const formatted = formatRupiah(0).replace(/\u00a0/g, ' ');
    expect(formatted).toBe('Rp 0');
  });

  it('handles bigint values', () => {
    const formatted = formatRupiah(BigInt(50000000)).replace(/\u00a0/g, ' ');
    expect(formatted).toBe('Rp 50.000.000');
  });

  it('rounds floating numbers to nearest integer rupiah', () => {
    const formatted = formatRupiah(15000.75).replace(/\u00a0/g, ' ');
    expect(formatted).toBe('Rp 15.001');
  });

  it('handles null, undefined, and NaN gracefully', () => {
    expect(formatRupiah(null).replace(/\u00a0/g, ' ')).toBe('Rp 0');
    expect(formatRupiah(undefined).replace(/\u00a0/g, ' ')).toBe('Rp 0');
    expect(formatRupiah(NaN).replace(/\u00a0/g, ' ')).toBe('Rp 0');
  });
});

describe('formatPercent', () => {
  it('formats percentages with Indonesian decimal comma', () => {
    const formatted = formatPercent(12.4).replace(/\u00a0/g, ' ');
    expect(formatted).toBe('12,4%');
  });

  it('formats whole percentage without unnecessary decimal', () => {
    const formatted = formatPercent(50).replace(/\u00a0/g, ' ');
    expect(formatted).toBe('50%');
  });

  it('handles null and undefined', () => {
    expect(formatPercent(null)).toBe('0%');
    expect(formatPercent(undefined)).toBe('0%');
  });
});

describe('formatNumber', () => {
  it('formats integers with thousand separators', () => {
    const formatted = formatNumber(15000).replace(/\u00a0/g, ' ');
    expect(formatted).toBe('15.000');
  });
});
