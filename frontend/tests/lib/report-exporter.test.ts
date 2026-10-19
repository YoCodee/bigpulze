import { describe, it, expect } from 'vitest';
import {
  generateFinancialReportCsv,
  generatePrintableReportHtml,
} from '@/lib/finance/report-exporter';
import { FinancialReportSummary } from '@/lib/finance/auto-ledger';

describe('Financial Report Exporter (report-exporter.ts)', () => {
  const mockReport: FinancialReportSummary = {
    period: {
      start_date: '2026-10-01',
      end_date: '2026-10-15',
      total_days: 15,
    },
    metrics: {
      total_revenue: 15000000,
      total_cogs: 9000000,
      gross_profit: 6000000,
      gross_margin_pct: 40.0,
      total_expenses: 3000000,
      net_profit: 3000000,
      net_margin_pct: 20.0,
      total_transactions: 350,
      average_ticket_size: 42857,
      void_count: 2,
      void_total_revenue: 85000,
    },
    cashflow: {
      cash_in: 15000000,
      cash_out: 3000000,
      net_cashflow: 12000000,
    },
    expenses_by_category: [
      { category: 'Gaji', total_amount: 2000000, percentage_of_expenses: 66.67, count: 4 },
      { category: 'Utilitas', total_amount: 1000000, percentage_of_expenses: 33.33, count: 2 },
    ],
    revenue_by_payment_method: [
      { payment_method: 'CASH', total_amount: 10000000, percentage_of_revenue: 66.67, count: 250 },
      { payment_method: 'QRIS_SIM', total_amount: 5000000, percentage_of_revenue: 33.33, count: 100 },
    ],
    branch_performance: [
      {
        branch_id: 'b1',
        branch_name: 'Cabang Pusat',
        daily_target: 1000000,
        revenue: 15000000,
        cogs: 9000000,
        gross_profit: 6000000,
        gross_margin_pct: 40.0,
        expenses: 3000000,
        net_profit: 3000000,
        net_margin_pct: 20.0,
        tx_count: 350,
        average_ticket: 42857,
        target_achievement_pct: 100.0,
      },
    ],
    daily_timeline: [
      {
        date: '2026-10-01',
        revenue: 1000000,
        cogs: 600000,
        gross_profit: 400000,
        expenses: 200000,
        net_profit: 200000,
        tx_count: 25,
      },
    ],
    top_products: [
      {
        product_id: 'p1',
        product_name: 'Kopi Susu Gula Aren',
        quantity_sold: 150,
        revenue: 3000000,
        cogs: 1500000,
        gross_profit: 1500000,
        gross_margin_pct: 50.0,
      },
    ],
  };

  it('generates valid UTF-8 BOM CSV containing all essential financial tables', () => {
    const csv = generateFinancialReportCsv(mockReport, 'Kopi Nusantara');

    // Must start with UTF-8 BOM \uFEFF for proper Excel loading
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('LAPORAN KEUANGAN & PEMBUKUAN OTOMATIS (AUTO-LEDGER)');
    expect(csv).toContain('Kopi Nusantara');
    expect(csv).toContain('Total Pendapatan / Omzet Bersih,15000000');
    expect(csv).toContain('Laba Operasional Bersih,3000000');
    expect(csv).toContain('"Gaji",2000000,66.67%,4');
    expect(csv).toContain('"CASH",10000000,66.67%,250');
    expect(csv).toContain('"Cabang Pusat",15000000,9000000,6000000,40%');
    expect(csv).toContain('"Kopi Susu Gula Aren",150,3000000,1500000,1500000,50%');
  });

  it('generates bank-ready printable HTML document with legal bank disclaimer and signatures', () => {
    const html = generatePrintableReportHtml(mockReport, 'Kopi Nusantara', 'Cabang Pusat');

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Laporan Laba Rugi - Kopi Nusantara');
    expect(html).toContain('Kopi Nusantara');
    expect(html).toContain('Laporan Laba Rugi &amp; Arus Kas Operasional');
    expect(html).toContain('KETERANGAN RESMI UNTUK KEPERLUAN PENGAJUAN PINJAMAN BANK / KUR / INVESTOR:');
    expect(html).toContain('Diverifikasi Sistem:');
    expect(html).toContain('Pemilik Usaha (Owner)');
    expect(html).toContain('window.print()');
  });
});
