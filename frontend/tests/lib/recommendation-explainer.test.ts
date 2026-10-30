import {
  buildExpiryPhrase,
  buildWhySentence,
  formatCoverPhrase,
  formatDays,
  formatUnitCount,
  sortRecommendations,
  type RecommendationExplainerInput,
} from '@/lib/stock/recommendation-explainer';
import { describe, expect, it } from 'vitest';

const base: RecommendationExplainerInput = {
  current_stock: 12,
  min_stock_alert: 10,
  forecast_total: 34,
  days_of_cover: 2.1,
  target_stock: 44,
  suggested_qty: 32,
  surplus: 0,
  status: 'RESTOCK',
  urgency: 'WARNING',
};

const mk = (over: Partial<RecommendationExplainerInput>): RecommendationExplainerInput => ({
  ...base,
  ...over,
});

describe('format helpers', () => {
  it('formats counts in id-ID', () => {
    expect(formatUnitCount(1234)).toBe('1.234');
    expect(formatUnitCount(12)).toBe('12');
  });

  it('formats days with decimal comma', () => {
    expect(formatDays(2.1)).toBe('2,1');
  });

  it('covers the null-sales case', () => {
    expect(formatCoverPhrase(null)).toBe('belum ada penjualan');
    expect(formatCoverPhrase(2.1)).toBe('habis ±2,1 hari');
  });
});

describe('buildWhySentence', () => {
  it('explains the restock math: need = forecast + buffer; buy = need - stock', () => {
    const sentence = buildWhySentence(base, '7 hari ke depan');
    expect(sentence).toContain('Butuh 44 unit untuk 7 hari ke depan');
    expect(sentence).toContain('perkiraan terjual 34 unit + cadangan minimum 10 unit');
    expect(sentence).toContain('Stok sekarang 12 unit, jadi beli 32 unit');
  });

  it('tells the owner to do nothing when balanced', () => {
    const sentence = buildWhySentence(
      { ...base, status: 'BALANCED', suggested_qty: 0, current_stock: 50, days_of_cover: 5 },
      '7 hari ke depan'
    );
    expect(sentence).toContain('cukup');
    expect(sentence).toContain('Tidak perlu restock');
  });

  it('advises transfer/promo on surplus instead of buying', () => {
    const sentence = buildWhySentence(
      { ...base, status: 'SURPLUS', suggested_qty: 0, current_stock: 80, surplus: 36 },
      '7 hari ke depan'
    );
    expect(sentence).toContain('Tidak perlu beli');
    expect(sentence).toContain('transfer ke cabang yang butuh');
  });
});

describe('buildExpiryPhrase', () => {
  it('returns null without sales history', () => {
    expect(buildExpiryPhrase(null)).toBeNull();
  });

  it('names the expected stock-out date and urgency', () => {
    const phrase = buildExpiryPhrase(1.2);
    expect(phrase).toContain('habis dalam ±1,2 hari');
    expect(phrase).toContain('segera restock');
  });

  it('stays calm above the urgency line', () => {
    const phrase = buildExpiryPhrase(4.0);
    expect(phrase).not.toContain('segera restock');
  });
});

describe('sortRecommendations', () => {
  const mk = (over: Partial<typeof base>) => ({ ...base, ...over });
  const critical = mk({ urgency: 'CRITICAL', days_of_cover: 1.2 });
  const warningLow = mk({ urgency: 'WARNING', days_of_cover: 2.0 });
  const warningHigh = mk({ urgency: 'WARNING', days_of_cover: 2.9 });
  const info = mk({ urgency: 'INFO', days_of_cover: null, status: 'BALANCED' as const });

  it('orders critical first, then by days of cover', () => {
    const sorted = sortRecommendations([info, warningHigh, critical, warningLow]);
    expect(sorted[0]).toBe(critical);
    expect(sorted[1]).toBe(warningLow);
    expect(sorted[2]).toBe(warningHigh);
    expect(sorted[3]).toBe(info);
  });

  it('does not mutate the input array', () => {
    const items = [info, critical];
    sortRecommendations(items);
    expect(items[0]).toBe(info);
  });
});
