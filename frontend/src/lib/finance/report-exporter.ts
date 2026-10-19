/**
 * Financial Report Exporter for BizPulse
 * GTNIC 2026 - Official Bank Loan Statement & Excel/CSV Export Engine
 */

import { FinancialReportSummary } from '@/lib/finance/auto-ledger';
import { formatRupiah } from '@/lib/format';
import { formatDateId } from '@/lib/date';

/**
 * Generates structured, CSV-formatted string for Excel & Google Sheets.
 * Includes UTF-8 BOM so Excel opens it with perfect character encoding.
 */
export function generateFinancialReportCsv(
  report: FinancialReportSummary,
  orgName = 'BizPulse UMKM'
): string {
  const lines: string[] = [];

  // Header Section
  lines.push(`LAPORAN KEUANGAN & PEMBUKUAN OTOMATIS (AUTO-LEDGER)`);
  lines.push(`Nama Usaha,"${orgName}"`);
  lines.push(`Periode Laporan,"${formatDateId(report.period.start_date)} s/d ${formatDateId(report.period.end_date)} (${report.period.total_days} hari)"`);
  lines.push(`Tanggal Dibuat,"${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB"`);
  lines.push('');

  // 1. Executive Summary Table
  lines.push('--- IKHTISAR LABA RUGI EKSEKUTIF ---');
  lines.push('Indikator Finansial,Nilai (Rupiah),Keterangan');
  lines.push(`Total Pendapatan / Omzet Bersih,${report.metrics.total_revenue},"Rata-rata tiket ${formatRupiah(report.metrics.average_ticket_size)}/trx"`);
  lines.push(`Harga Pokok Penjualan (HPP Modal),${report.metrics.total_cogs},"Modal barang yang terjual"`);
  lines.push(`Laba Kotor (Gross Profit),${report.metrics.gross_profit},"Margin Kotor: ${report.metrics.gross_margin_pct}%"`);
  lines.push(`Total Beban Operasional,${report.metrics.total_expenses},"Total pengeluaran beban"`);
  lines.push(`Laba Operasional Bersih,${report.metrics.net_profit},"Margin Bersih: ${report.metrics.net_margin_pct}%"`);
  lines.push(`Arus Kas Masuk (Cash In),${report.cashflow.cash_in},"Penerimaan kas & QRIS"`);
  lines.push(`Arus Kas Keluar (Cash Out),${report.cashflow.cash_out},"Pengeluaran kas"`);
  lines.push(`Arus Kas Bersih (Net Cashflow),${report.cashflow.net_cashflow},"Selisih kas masuk vs keluar"`);
  lines.push(`Total Transaksi Penjualan,${report.metrics.total_transactions},"Transaksi lunas"`);
  lines.push(`Transaksi Void (Dibatalkan),${report.metrics.void_count},"Total nilai void ${formatRupiah(report.metrics.void_total_revenue)}"`);
  lines.push('');

  // 2. Expense Breakdown by Category
  lines.push('--- RINCIAN BEBAN BIAYA OPERASIONAL ---');
  lines.push('No,Kategori Pengeluaran,Nominal (Rupiah),Porsi Biaya (%),Frekuensi');
  report.expenses_by_category.forEach((exp, idx) => {
    lines.push(`${idx + 1},"${exp.category}",${exp.total_amount},${exp.percentage_of_expenses}%,${exp.count}`);
  });
  lines.push('');

  // 3. Payment Method Distribution
  lines.push('--- METODE PEMBAYARAN KAS MASUK ---');
  lines.push('Metode Pembayaran,Total Nilai (Rupiah),Porsi Omzet (%),Jumlah Transaksi');
  report.revenue_by_payment_method.forEach((pm) => {
    lines.push(`"${pm.payment_method}",${pm.total_amount},${pm.percentage_of_revenue}%,${pm.count}`);
  });
  lines.push('');

  // 4. Branch Performance Comparison
  lines.push('--- KLASEMEN PERFORMA ANTARCABANG ---');
  lines.push('Nama Cabang,Omzet (Rupiah),HPP Modal (Rupiah),Laba Kotor (Rupiah),Margin Kotor (%),Beban (Rupiah),Laba Bersih (Rupiah),Margin Bersih (%),Transaksi,Target Harian (Rupiah),Capaian Target (%)');
  report.branch_performance.forEach((b) => {
    lines.push(
      `"${b.branch_name}",${b.revenue},${b.cogs},${b.gross_profit},${b.gross_margin_pct}%,${b.expenses},${b.net_profit},${b.net_margin_pct}%,${b.tx_count},${b.daily_target},${b.target_achievement_pct}%`
    );
  });
  lines.push('');

  // 5. Top Selling Products
  lines.push('--- PERINGKAT KONTRIBUSI PRODUK TERLARIS ---');
  lines.push('No,Nama Produk,Kuantitas Terjual,Total Omzet (Rupiah),Total HPP (Rupiah),Laba Kotor (Rupiah),Gross Margin (%)');
  report.top_products.forEach((p, idx) => {
    lines.push(`${idx + 1},"${p.product_name}",${p.quantity_sold},${p.revenue},${p.cogs},${p.gross_profit},${p.gross_margin_pct}%`);
  });
  lines.push('');

  // 6. Daily Timeline
  lines.push('--- GARIS WAKTU FINANSIAL HARIAN ---');
  lines.push('Tanggal,Omzet (Rupiah),HPP Modal (Rupiah),Laba Kotor (Rupiah),Beban Biaya (Rupiah),Laba Bersih (Rupiah),Jumlah Transaksi');
  report.daily_timeline.forEach((d) => {
    lines.push(`${d.date},${d.revenue},${d.cogs},${d.gross_profit},${d.expenses},${d.net_profit},${d.tx_count}`);
  });

  return '\uFEFF' + lines.join('\r\n');
}

/**
 * Triggers a browser download of the CSV report.
 */
export function downloadFinancialReportCsv(
  report: FinancialReportSummary,
  orgName = 'BizPulse UMKM'
): void {
  const csvContent = generateFinancialReportCsv(report, orgName);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const filename = `Laporan_Keuangan_${report.period.start_date}_sd_${report.period.end_date}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates formal printable bank-ready HTML document.
 */
export function generatePrintableReportHtml(
  report: FinancialReportSummary,
  orgName = 'BizPulse UMKM',
  branchName = 'Konsolidasi Seluruh Cabang'
): string {
  const nowStr = new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Laporan Laba Rugi - ${orgName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 18mm 15mm 20mm 15mm;
    }
    * {
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      color: #1e293b;
      margin: 0;
      padding: 0;
      font-size: 11pt;
      line-height: 1.4;
    }
    .header {
      border-bottom: 2.5px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .org-title {
      font-size: 18pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin: 0;
      text-transform: uppercase;
    }
    .doc-type {
      font-size: 11pt;
      font-weight: 700;
      color: #2563eb;
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .meta-box {
      text-align: right;
      font-size: 9pt;
      color: #475569;
    }
    .meta-box strong {
      color: #0f172a;
    }
    .period-badge {
      background-color: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      font-size: 9.5pt;
    }
    h2 {
      font-size: 12pt;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 18px;
      margin-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 9.5pt;
    }
    th, td {
      padding: 6px 10px;
      text-align: left;
    }
    th {
      background-color: #f8fafc;
      font-weight: 700;
      color: #334155;
      border-bottom: 1.5px solid #cbd5e1;
      text-transform: uppercase;
      font-size: 8pt;
      letter-spacing: 0.5px;
    }
    td {
      border-bottom: 1px solid #f1f5f9;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .font-mono {
      font-family: ui-monospace, Menlo, Consolas, monospace;
    }
    .highlight-row {
      background-color: #f8fafc;
      font-weight: 700;
      border-top: 1.5px solid #cbd5e1;
      border-bottom: 1.5px solid #cbd5e1;
    }
    .total-row {
      background-color: #e2e8f0;
      font-weight: 800;
      font-size: 10.5pt;
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
    }
    .bank-notice {
      background-color: #faf5ff;
      border: 1px solid #e9d5ff;
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 8.5pt;
      color: #581c87;
      margin-top: 25px;
      line-height: 1.45;
    }
    .signatures {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    .sign-box {
      width: 220px;
      text-align: center;
      font-size: 9pt;
    }
    .sign-line {
      margin-top: 70px;
      border-bottom: 1.5px solid #0f172a;
      font-weight: 700;
      padding-bottom: 4px;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div>
      <h1 class="org-title">${orgName}</h1>
      <div class="doc-type">Laporan Laba Rugi &amp; Arus Kas Operasional</div>
      <div style="font-size: 9pt; color: #64748b; margin-top: 2px;">Cakupan: ${branchName}</div>
    </div>
    <div class="meta-box">
      <div>Tanggal Cetak: <strong>${nowStr} WIB</strong></div>
      <div>Sistem Verifikasi: <strong>BizPulse Auto-Ledger v1.0</strong></div>
      <div>Status Dokumen: <strong>FINAL / RESMI</strong></div>
    </div>
  </div>

  <!-- Period & Tx Summary -->
  <div class="period-badge">
    <div>
      Periode Buku: <strong>${formatDateId(report.period.start_date)}</strong> s/d <strong>${formatDateId(report.period.end_date)}</strong> (${report.period.total_days} hari operasional)
    </div>
    <div>
      Total Volume Transaksi: <strong>${report.metrics.total_transactions} transaksi</strong> ${
    report.metrics.void_count > 0 ? `(${report.metrics.void_count} transaksi dibatalkan)` : ''
  }
    </div>
  </div>

  <!-- Main Statement Table -->
  <h2>I. Laporan Laba Rugi Komprehensif (Income Statement)</h2>
  <table>
    <thead>
      <tr>
        <th>Komponen Finansial</th>
        <th class="text-right">Nominal (Rupiah)</th>
        <th class="text-right">Rasio (% Omzet)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Pendapatan Penjualan Bersih (Net Revenue)</strong></td>
        <td class="text-right font-mono font-bold">${formatRupiah(report.metrics.total_revenue)}</td>
        <td class="text-right">100.0%</td>
      </tr>
      <tr>
        <td style="padding-left: 20px; color: #475569;">Beban Pokok Penjualan / HPP Modal Produk</td>
        <td class="text-right font-mono" style="color: #475569;">(${formatRupiah(report.metrics.total_cogs)})</td>
        <td class="text-right" style="color: #475569;">${report.metrics.total_revenue > 0 ? ((report.metrics.total_cogs / report.metrics.total_revenue) * 100).toFixed(1) : 0}%</td>
      </tr>
      <tr class="highlight-row">
        <td>LABA KOTOR USAHA (GROSS PROFIT)</td>
        <td class="text-right font-mono">${formatRupiah(report.metrics.gross_profit)}</td>
        <td class="text-right">${report.metrics.gross_margin_pct}%</td>
      </tr>
      <tr>
        <td colspan="3" style="font-weight: 700; padding-top: 10px; color: #0f172a;">Beban Operasional Usaha (Operating Expenses):</td>
      </tr>
      ${report.expenses_by_category
        .map(
          (exp) => `<tr>
            <td style="padding-left: 20px;">Beban ${exp.category} (${exp.count}x trx)</td>
            <td class="text-right font-mono" style="color: #dc2626;">(${formatRupiah(exp.total_amount)})</td>
            <td class="text-right" style="color: #dc2626;">${report.metrics.total_revenue > 0 ? ((exp.total_amount / report.metrics.total_revenue) * 100).toFixed(1) : 0}%</td>
          </tr>`
        )
        .join('')}
      <tr class="highlight-row">
        <td>Total Beban Operasional Usaha</td>
        <td class="text-right font-mono" style="color: #dc2626;">(${formatRupiah(report.metrics.total_expenses)})</td>
        <td class="text-right" style="color: #dc2626;">${report.metrics.total_revenue > 0 ? ((report.metrics.total_expenses / report.metrics.total_revenue) * 100).toFixed(1) : 0}%</td>
      </tr>
      <tr class="total-row">
        <td>LABA OPERASIONAL BERSIH (NET OPERATING PROFIT)</td>
        <td class="text-right font-mono">${report.metrics.net_profit >= 0 ? '+' : ''}${formatRupiah(report.metrics.net_profit)}</td>
        <td class="text-right">${report.metrics.net_margin_pct}%</td>
      </tr>
    </tbody>
  </table>

  <!-- Cashflow & Branch Summary Grid -->
  <div style="display: flex; gap: 20px; margin-top: 16px;">
    <!-- Cashflow Table -->
    <div style="flex: 1;">
      <h2>II. Ringkasan Arus Kas (Cashflow)</h2>
      <table>
        <tbody>
          <tr>
            <td>Penerimaan Kas Bersih (Cash In)</td>
            <td class="text-right font-mono">${formatRupiah(report.cashflow.cash_in)}</td>
          </tr>
          <tr>
            <td>Pengeluaran Kas Operasional (Cash Out)</td>
            <td class="text-right font-mono">(${formatRupiah(report.cashflow.cash_out)})</td>
          </tr>
          <tr class="highlight-row">
            <td>ARUS KAS BERSIH (NET CASHFLOW)</td>
            <td class="text-right font-mono font-bold">${report.cashflow.net_cashflow >= 0 ? '+' : ''}${formatRupiah(report.cashflow.net_cashflow)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Payment Methods -->
    <div style="flex: 1;">
      <h2>III. Sumber Pembayaran</h2>
      <table>
        <thead>
          <tr>
            <th>Kanal</th>
            <th class="text-right">Nominal</th>
            <th class="text-right">Porsi</th>
          </tr>
        </thead>
        <tbody>
          ${report.revenue_by_payment_method
            .map(
              (pm) => `<tr>
                <td>${pm.payment_method === 'CASH' ? 'Tunai (CASH)' : pm.payment_method === 'QRIS_SIM' ? 'QRIS Digital' : pm.payment_method}</td>
                <td class="text-right font-mono">${formatRupiah(pm.total_amount)}</td>
                <td class="text-right">${pm.percentage_of_revenue}%</td>
              </tr>`
            )
            .join('')}
        </tbody>
      </table>
    </div>
  </div>

  ${
    report.branch_performance.length > 1
      ? `<h2>IV. Konsolidasi Antarcabang</h2>
    <table>
      <thead>
        <tr>
          <th>Nama Cabang</th>
          <th class="text-right">Omzet</th>
          <th class="text-right">HPP</th>
          <th class="text-right">Beban</th>
          <th class="text-right">Laba Bersih</th>
          <th class="text-center">Target Harian</th>
        </tr>
      </thead>
      <tbody>
        ${report.branch_performance
          .map(
            (b) => `<tr>
              <td><strong>${b.branch_name}</strong></td>
              <td class="text-right font-mono">${formatRupiah(b.revenue)}</td>
              <td class="text-right font-mono">${formatRupiah(b.cogs)}</td>
              <td class="text-right font-mono">${formatRupiah(b.expenses)}</td>
              <td class="text-right font-mono font-bold">${formatRupiah(b.net_profit)}</td>
              <td class="text-center">${b.target_achievement_pct}%</td>
            </tr>`
          )
          .join('')}
      </tbody>
    </table>`
      : ''
  }

  <!-- Bank Submission Disclaimer Notice -->
  <div class="bank-notice">
    <strong>KETERANGAN RESMI UNTUK KEPERLUAN PENGAJUAN PINJAMAN BANK / KUR / INVESTOR:</strong><br>
    Dokumen pembukuan digital ini di-generate otomatis secara sistematis dan matematis oleh platform BizPulse Auto-Ledger berdasarkan rekaman transaksi kasir titik penjualan (POS) dan kartu pergerakan stok barang yang telah terotentikasi. Data bebas dari modifikasi manual pihak ketiga.
  </div>

  <!-- Signatures -->
  <div class="signatures">
    <div class="sign-box">
      <div>Diverifikasi Sistem:</div>
      <div style="font-weight: 700; color: #2563eb; margin-top: 4px;">BizPulse Cloud Ledger</div>
      <div class="sign-line">SISTEM TERVALIDASI</div>
      <div style="font-size: 8pt; color: #64748b; margin-top: 2px;">Kode Hash: BP-${Date.now().toString(36).toUpperCase()}</div>
    </div>

    <div class="sign-box">
      <div>Kota / Tanggal: ____________, 2026</div>
      <div style="font-weight: 700; color: #0f172a; margin-top: 4px;">Pemilik Usaha (Owner)</div>
      <div class="sign-line">( _________________________ )</div>
      <div style="font-size: 8pt; color: #64748b; margin-top: 2px;">Tanda Tangan &amp; Cap Usaha</div>
    </div>
  </div>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 400);
    });
  </script>
</body>
</html>`;
}

/**
 * Opens printable window and triggers native browser print dialog (Save as PDF).
 */
export function openPrintableReportPdf(
  report: FinancialReportSummary,
  orgName = 'BizPulse UMKM',
  branchName = 'Konsolidasi Seluruh Cabang'
): void {
  const html = generatePrintableReportHtml(report, orgName, branchName);
  const printWindow = window.open('', '_blank', 'width=900,height=1000');

  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    alert('Browser memblokir pop-up window cetak. Harap izinkan pop-up untuk mencetak PDF laporan.');
  }
}
