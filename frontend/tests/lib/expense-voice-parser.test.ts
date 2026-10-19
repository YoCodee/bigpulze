import { describe, it, expect } from 'vitest';
import {
  extractExpenseAmount,
  categorizeExpense,
  cleanExpenseDescription,
  parseVoiceExpense,
} from '@/lib/voice/expense-voice-parser';

describe('extractExpenseAmount', () => {
  it('extracts thousands from Indonesian number words', () => {
    expect(extractExpenseAmount('beli galon air dua puluh ribu').amount).toBe(20000);
    expect(extractExpenseAmount('bayar listrik seratus lima puluh ribu').amount).toBe(150000);
    expect(extractExpenseAmount('beli kresek lima belas ribu').amount).toBe(15000);
    expect(extractExpenseAmount('servis mesin espresso tiga ratus lima puluh ribu').amount).toBe(350000);
    expect(extractExpenseAmount('beli lakban dua belas ribu').amount).toBe(12000);
  });

  it('extracts millions from spoken Indonesian phrases', () => {
    expect(extractExpenseAmount('sewa lapak satu juta lima ratus ribu').amount).toBe(1500000);
    expect(extractExpenseAmount('kontrak ruko dua juta').amount).toBe(2000000);
    expect(extractExpenseAmount('uang kas setengah juta').amount).toBe(500000);
  });

  it('extracts amount from colloquial suffixes (rb, k, jt)', () => {
    expect(extractExpenseAmount('beli bensin 25rb').amount).toBe(25000);
    expect(extractExpenseAmount('iklan instagram 50k').amount).toBe(50000);
    expect(extractExpenseAmount('servis ac 150 k').amount).toBe(150000);
    expect(extractExpenseAmount('sewa ruko 1.5jt').amount).toBe(1500000);
  });

  it('extracts amount from standard formatted currency and plain digits', () => {
    expect(extractExpenseAmount('beli tissue Rp 25.000').amount).toBe(25000);
    expect(extractExpenseAmount('ongkir kurir 15000').amount).toBe(15000);
    expect(extractExpenseAmount('sewa tempat Rp 1.500.000').amount).toBe(1500000);
  });

  it('returns null amount when no currency is present', () => {
    expect(extractExpenseAmount('hanya mencatat tanpa angka').amount).toBeNull();
  });
});

describe('categorizeExpense', () => {
  it('categorizes correctly based on keywords', () => {
    expect(categorizeExpense('beli galon air aqua').category).toBe('Utilitas');
    expect(categorizeExpense('bayar tagihan listrik pln').category).toBe('Utilitas');
    expect(categorizeExpense('gaji barista paruh waktu').category).toBe('Gaji');
    expect(categorizeExpense('bayar sewa lapak ruko').category).toBe('Sewa');
    expect(categorizeExpense('isi bensin motor delivery').category).toBe('Transportasi');
    expect(categorizeExpense('ongkos kirim paket bahan jne').category).toBe('Transportasi');
    expect(categorizeExpense('pasang iklan instagram dan cetak flyer').category).toBe('Pemasaran');
    expect(categorizeExpense('servis mesin espresso rusak').category).toBe('Perawatan');
    expect(categorizeExpense('beli cup plastik dan sedotan').category).toBe('Perlengkapan Operasional');
    expect(categorizeExpense('iuran sampah bulanan').category).toBe('Lainnya');
  });

  it('respects explicit category instructions', () => {
    const result = categorizeExpense('beli meja kasir kategori perawatan');
    expect(result.category).toBe('Perawatan');
    expect(result.category_matched_by).toBe('explicit');

    const result2 = categorizeExpense('iuran festival masuk kategori pemasaran');
    expect(result2.category).toBe('Pemasaran');
    expect(result2.category_matched_by).toBe('explicit');
  });
});

describe('cleanExpenseDescription', () => {
  it('strips command prefixes and amount from description', () => {
    const desc = cleanExpenseDescription('catat beli galon air dua puluh ribu', 'dua puluh ribu');
    expect(desc).toBe('Beli galon air');
  });

  it('strips explicit category tags', () => {
    const desc = cleanExpenseDescription(
      'tolong masukkan biaya servis ac kantor kategori perawatan 150rb',
      '150rb'
    );
    expect(desc).toBe('Servis ac kantor');
  });
});

describe('parseVoiceExpense', () => {
  it('parses complete voice expense utterance accurately', () => {
    const res = parseVoiceExpense('catat beli galon air dua puluh ribu');
    expect(res.amount).toBe(20000);
    expect(res.category).toBe('Utilitas');
    expect(res.description).toBe('Beli galon air');
    expect(res.confidence).toBeGreaterThanOrEqual(0.8);
    expect(res.category_matched_by).toBe('keyword');
  });

  it('parses operational supplies with slang number', () => {
    const res = parseVoiceExpense('beli kresek dan sedotan 25rb');
    expect(res.amount).toBe(25000);
    expect(res.category).toBe('Perlengkapan Operasional');
    expect(res.description).toBe('Beli kresek dan sedotan');
  });

  it('parses salary expense with full Indonesian number words', () => {
    const res = parseVoiceExpense('catat gaji harian barista seratus ribu');
    expect(res.amount).toBe(100000);
    expect(res.category).toBe('Gaji');
    expect(res.description).toBe('Gaji harian barista');
  });

  it('handles empty or unrecognized transcript gracefully', () => {
    const res = parseVoiceExpense('');
    expect(res.amount).toBe(0);
    expect(res.confidence).toBe(0);
    expect(res.category).toBe('Lainnya');
  });
});
