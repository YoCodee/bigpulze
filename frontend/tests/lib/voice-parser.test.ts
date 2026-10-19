import { describe, it, expect } from 'vitest';
import {
  parseIndonesianNumber,
  extractPaymentMethod,
  parseVoiceOrder,
  ProductCandidate,
} from '@/lib/voice/voice-parser';

describe('Indonesian Number Parsing', () => {
  it('parses basic digits and word numbers', () => {
    expect(parseIndonesianNumber('1')).toBe(1);
    expect(parseIndonesianNumber('5')).toBe(5);
    expect(parseIndonesianNumber('satu')).toBe(1);
    expect(parseIndonesianNumber('dua')).toBe(2);
    expect(parseIndonesianNumber('tiga')).toBe(3);
    expect(parseIndonesianNumber('sepuluh')).toBe(10);
    expect(parseIndonesianNumber('dua belas')).toBe(12);
  });

  it('parses tens and compound numbers', () => {
    expect(parseIndonesianNumber('dua puluh')).toBe(20);
    expect(parseIndonesianNumber('dua puluh lima')).toBe(25);
    expect(parseIndonesianNumber('tiga puluh')).toBe(30);
  });

  it('parses Indonesian colloquial quantity expressions', () => {
    expect(parseIndonesianNumber('setengah lusin')).toBe(6);
    expect(parseIndonesianNumber('selusin')).toBe(12);
    expect(parseIndonesianNumber('dua lusin')).toBe(24);
    expect(parseIndonesianNumber('segelas')).toBe(1);
    expect(parseIndonesianNumber('seporsi')).toBe(1);
  });

  it('returns null for invalid numbers', () => {
    expect(parseIndonesianNumber('bukan-angka')).toBeNull();
    expect(parseIndonesianNumber('')).toBeNull();
  });
});

describe('Payment Method Extraction', () => {
  it('detects cash payment phrases', () => {
    const res1 = extractPaymentMethod('pesan kopi bayar tunai');
    expect(res1.payment_method).toBe('CASH');

    const res2 = extractPaymentMethod('donat dua cash');
    expect(res2.payment_method).toBe('CASH');

    const res3 = extractPaymentMethod('bayar uang pas');
    expect(res3.payment_method).toBe('CASH');
  });

  it('detects QRIS payment phrases', () => {
    const res1 = extractPaymentMethod('kopi susu satu bayar qris');
    expect(res1.payment_method).toBe('QRIS_SIM');

    const res2 = extractPaymentMethod('dua americano scan qris');
    expect(res2.payment_method).toBe('QRIS_SIM');
  });

  it('returns null when no payment method is stated', () => {
    const res = extractPaymentMethod('kopi susu dua dan donat satu');
    expect(res.payment_method).toBeNull();
  });
});

describe('Voice Order Parsing', () => {
  const sampleProducts: ProductCandidate[] = [
    {
      id: 'prod-1',
      name: 'Es Kopi Susu',
      sku: 'KP-001',
      category: 'Minuman',
      aliases: ['kopsu', 'kopi susu', 'es kopi'],
      selling_price: 18000,
      cost_price: 7000,
      stock: 50,
    },
    {
      id: 'prod-2',
      name: 'Americano',
      sku: 'KP-002',
      category: 'Minuman',
      aliases: ['kopi hitam', 'americano panas'],
      selling_price: 15000,
      cost_price: 5000,
      stock: 40,
    },
    {
      id: 'prod-3',
      name: 'Donat Coklat',
      sku: 'SN-001',
      category: 'Makanan',
      aliases: ['donat', 'roti donat'],
      selling_price: 10000,
      cost_price: 4000,
      stock: 25,
    },
  ];

  it('parses single item with postfix quantity', () => {
    const res = parseVoiceOrder('es kopi susu dua', sampleProducts);
    expect(res.items.length).toBe(1);
    expect(res.items[0].product_id).toBe('prod-1');
    expect(res.items[0].quantity).toBe(2);
    expect(res.items[0].subtotal).toBe(36000);
  });

  it('parses single item with prefix quantity', () => {
    const res = parseVoiceOrder('tiga americano', sampleProducts);
    expect(res.items.length).toBe(1);
    expect(res.items[0].product_id).toBe('prod-2');
    expect(res.items[0].quantity).toBe(3);
    expect(res.items[0].subtotal).toBe(45000);
  });

  it('parses alias correctly', () => {
    const res = parseVoiceOrder('kopsu lima', sampleProducts);
    expect(res.items.length).toBe(1);
    expect(res.items[0].product_id).toBe('prod-1');
    expect(res.items[0].quantity).toBe(5);
    expect(res.items[0].matched_by).toBe('alias');
  });

  it('parses multiple compound items with conjunctions and payment method', () => {
    const transcript = 'kopi susu dua dan donat coklat satu bayar tunai';
    const res = parseVoiceOrder(transcript, sampleProducts);

    expect(res.payment_method).toBe('CASH');
    expect(res.items.length).toBe(2);

    const kopiItem = res.items.find((i) => i.product_id === 'prod-1');
    const donatItem = res.items.find((i) => i.product_id === 'prod-3');

    expect(kopiItem).toBeDefined();
    expect(kopiItem?.quantity).toBe(2);

    expect(donatItem).toBeDefined();
    expect(donatItem?.quantity).toBe(1);
    expect(res.confidence).toBeGreaterThan(0.8);
  });

  it('captures unmatched phrases gracefully', () => {
    const transcript = 'kopi susu satu dan martabak alien lima';
    const res = parseVoiceOrder(transcript, sampleProducts);

    expect(res.items.length).toBe(1);
    expect(res.items[0].product_id).toBe('prod-1');
    expect(res.unmatched_phrases.length).toBeGreaterThan(0);
    expect(res.unmatched_phrases.some((p) => p.includes('martabak alien'))).toBe(true);
  });

  it('handles empty transcript', () => {
    const res = parseVoiceOrder('', sampleProducts);
    expect(res.items.length).toBe(0);
    expect(res.confidence).toBe(0);
  });
});
