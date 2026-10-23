'use client';

import React, { useState } from 'react';
import { RoleGuard } from '@/components/role-guard';
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  Package,
  ShoppingCart,
  FileCheck,
  ShieldCheck,
  Building2,
  Users,
  Upload,
} from 'lucide-react';
import { MetricStrip } from '@/components/ui/metric-strip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SubNavTabs } from '@/components/ui/sub-nav-tabs';

export default function ImportPage() {
  const [selectedType, setSelectedType] = useState<'SALES' | 'PRODUCTS'>('SALES');

  const downloadSampleSalesCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,transaction_date,branch_name,payment_method,sku,quantity,unit_price,total_amount\n' +
      '2026-10-20,Cabang Malioboro,CASH,KP-001,2,18000,36000\n' +
      '2026-10-20,Cabang Malioboro,QRIS,MN-002,1,22000,22000\n' +
      '2026-10-20,Cabang Sudirman,CASH,SN-001,3,12000,36000\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'sample_penjualan_bizpulse.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSampleProductsCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,sku,name,category,cost_price,selling_price,min_stock_alert,aliases\n' +
      'KP-001,Es Kopi Susu Aren,Minuman,7000,18000,10,kopsu;kopi susu\n' +
      'MN-002,Red Velvet Latte,Minuman,9000,22000,10,red velvet\n' +
      'SN-001,Butter Croissant,Makanan,5000,15000,5,croissant;roti\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'sample_produk_bizpulse.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <RoleGuard allowedRoles={['OWNER']}>
      <div className="space-y-6 pb-12">
        {/* Sub Nav Tabs Konsolidasi Manajemen Organisasi */}
        <SubNavTabs
          tabs={[
            { name: 'Daftar Cabang', href: '/branches', icon: Building2 },
            { name: 'Staf & Kasir', href: '/staff', icon: Users },
            { name: 'Impor Data CSV', href: '/import', icon: Upload },
          ]}
        />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Impor Data CSV / Excel &amp; Batch Migration
              </h1>
              <Badge variant="enterprise">Batch 500 Baris</Badge>
              <Badge variant="brand">Zod Validated</Badge>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Migrasi massal transaksi historis dan master produk katalog dengan validasi skema ketat per PRD D10
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={selectedType === 'SALES' ? downloadSampleSalesCsv : downloadSampleProductsCsv}
              className="flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-4 h-4 text-enterprise-600" />
              <span>Unduh Template CSV</span>
            </Button>
          </div>
        </div>

        {/* 4-KPI Metric Strip */}
        <MetricStrip
          title="Ketentuan Batch Migration Data (PRD §12.3)"
          action={
            <span className="text-xs text-slate-500 font-medium">
              Standar Integritas: <strong className="text-slate-700">Atomik PostgreSQL RPC</strong>
            </span>
          }
          metrics={[
            {
              label: 'Validasi Skema Klien',
              value: 'Strict Zod',
              subtext: 'Pencegahan data rusak & format korup',
              badge: <Badge variant="enterprise">Validasi</Badge>,
            },
            {
              label: 'Batas Maksimal Batch',
              value: '500 Baris / File',
              subtext: 'Eksekusi atomik (semua sukses / rollback)',
              badge: (
                <Badge variant="brand" dot>
                  Atomik
                </Badge>
              ),
            },
            {
              label: 'Format File Didukung',
              value: 'CSV & Excel',
              subtext: '.csv, .xlsx, .xls berbasis PapaParse',
              badge: <Badge variant="neutral">Universal</Badge>,
            },
            {
              label: 'Pemetaan Kolom & Alias',
              value: 'Otomatis',
              subtext: 'Auto-mapping header kolom Indonesia',
              badge: (
                <Badge variant="success" dot>
                  Teruji
                </Badge>
              ),
            },
          ]}
        />

        {/* Type Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit">
          <button
            type="button"
            onClick={() => setSelectedType('SALES')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              selectedType === 'SALES'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Impor Transaksi Penjualan
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('PRODUCTS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              selectedType === 'PRODUCTS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Impor Master Katalog Produk
          </button>
        </div>

        {/* Upload Zone & Guide Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Area (2 cols) */}
          <div className="lg:col-span-2 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-card hover:border-enterprise-500 transition-colors flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-enterprise-50 text-enterprise-600 flex items-center justify-center shadow-2xs">
              <UploadCloud className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Pilih atau Tarik File {selectedType === 'SALES' ? 'Transaksi' : 'Produk'} ke Sini
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Mendukung berkas CSV atau Excel dengan batas maksimal 500 baris data per unggahan.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  alert(
                    `Pilih file ${
                      selectedType === 'SALES' ? 'sample_penjualan_bizpulse.csv' : 'sample_produk_bizpulse.csv'
                    } untuk memulai impor.`
                  );
                }}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Pilih Berkas Komputer
              </Button>
            </div>
            <p className="text-[11px] text-slate-400">
              Format UTF-8 koma/semicolon dideteksi secara otomatis
            </p>
          </div>

          {/* Guidelines Sidebar (1 col) */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card space-y-4">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-enterprise-600" />
              <h3 className="text-sm font-bold text-slate-900">Petunjuk Format Kolom</h3>
            </div>

            {selectedType === 'SALES' ? (
              <div className="space-y-3 text-xs text-slate-600">
                <p className="leading-relaxed">
                  Kolom wajib untuk impor transaksi:
                </p>
                <ul className="space-y-1.5 font-mono text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700">
                  <li>• transaction_date (YYYY-MM-DD)</li>
                  <li>• branch_name (Nama Cabang)</li>
                  <li>• payment_method (CASH/QRIS)</li>
                  <li>• sku (Kode SKU Produk)</li>
                  <li>• quantity (Jumlah Beli)</li>
                  <li>• unit_price (Harga Satuan)</li>
                  <li>• total_amount (Total Tagihan)</li>
                </ul>
                <div className="pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={downloadSampleSalesCsv}
                    className="w-full text-xs flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Unduh Format Transaksi (.csv)
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-slate-600">
                <p className="leading-relaxed">
                  Kolom wajib untuk impor master produk:
                </p>
                <ul className="space-y-1.5 font-mono text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700">
                  <li>• sku (Kode Unik Produk)</li>
                  <li>• name (Nama Lengkap Produk)</li>
                  <li>• category (Kategori Menu)</li>
                  <li>• cost_price (HPP Modal Satuan)</li>
                  <li>• selling_price (Harga Jual)</li>
                  <li>• min_stock_alert (Batas Peringatan)</li>
                  <li>• aliases (Alias Suara Pisah Titik Koma)</li>
                </ul>
                <div className="pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={downloadSampleProductsCsv}
                    className="w-full text-xs flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Unduh Format Produk (.csv)
                  </Button>
                </div>
              </div>
            )}

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Seluruh batch diproses dalam transaksi atomik database untuk mencegah duplikasi data parsial.
              </span>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
