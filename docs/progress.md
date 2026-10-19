# Progress

## Tahap A: Fondasi (19–22 Okt)

### A1 — Setup Repository & Konfigurasi Dasar ✅
**Selesai:** 2026-10-19

**Dibuat:**
- `.gitignore` — excludes node_modules, .env, .next, build, IDE, OS files
- `database/schema.sql` — 12 tabel, indeks, 2 trigger (business_date, branch limit)
- `database/functions.sql` — 3 auth helper + 6 RPC (create_sale, void_sale, restock_product, adjust_stock, transfer_stock, import_sales_batch, import_products_batch)
- `database/rls.sql` — RLS di semua tabel, column-level GRANT (stock dilindungi), policies per role
- `docs/assumptions.md` — 3 asumsi dicatat (proteksi stock, fuzzy matching, import stock)

**Belum teruji:**
- SQL belum dijalankan di Supabase (menunggu setup)
- RLS belum diuji dengan data nyata

**Asumsi yang diambil:**
- Lihat `docs/assumptions.md`

### Menunggu dari saya
- [ ] DITUNDA: Buat proyek Supabase, jalankan SQL (`schema.sql` → `functions.sql` → `rls.sql`)
- [ ] DITUNDA: Uji RLS dengan dua org berbeda, catat di `docs/rls-test.md`
- [ ] DITUNDA: Buat repo GitHub
- [ ] DITUNDA: Connect repo ke Vercel (Root Directory = `frontend`)

---

### A2 — Inisialisasi Next.js + Dependencies ✅
**Selesai:** 2026-10-19

**Dibuat:**
- Inisialisasi Next.js 14 App Router di folder `frontend/` (TypeScript strict, Tailwind CSS, ESLint)
- Instalasi dependencies terkunci PRD D13: `@supabase/ssr`, `@supabase/supabase-js`, `zod`, `react-hook-form`, `recharts`, `papaparse`, `date-fns`, `date-fns-tz`, `jspdf`, `jspdf-autotable`, `exceljs`, `clsx`, `tailwind-merge`, `lucide-react`
- Setup testing tools: Vitest (`vitest.config.ts`), `@testing-library/react`, `@testing-library/jest-dom`
- Konfigurasi `package.json` dengan script: `dev`, `build`, `start`, `lint`, `typecheck`, `test`
- Setup shadcn/ui base: `components.json`, `src/lib/utils.ts` (`cn` helper)
- Template environment variables `frontend/.env.example`

**Hasil verifikasi:**
- `npm run typecheck` : Lulus (0 error)
- `npm run lint`      : Lulus (0 warning, 0 error)
- `npm run test`      : Lulus (Vitest exit code 0)
- `npm run build`     : Lulus (produksi build Next.js sukses)

### A3 — Supabase Client Helpers ✅
**Selesai:** 2026-10-19

**Dibuat:**
- `frontend/src/lib/supabase/client.ts` — Browser client via `@supabase/ssr` `createBrowserClient`
- `frontend/src/lib/supabase/server.ts` — Server client via `@supabase/ssr` `createServerClient` dengan Next.js cookie integration
- `frontend/src/lib/supabase/admin.ts` — Server-only admin client via `@supabase/supabase-js` dengan `SUPABASE_SERVICE_ROLE_KEY` dan runtime guard
- `frontend/src/lib/supabase/middleware.ts` — Helper refresh session untuk Next.js middleware

**Hasil verifikasi:**
- `npm run typecheck` : Lulus (0 error)
- `npm run lint`      : Lulus (0 warning, 0 error)
- `npm run test`      : Lulus (Vitest exit code 0)
- `npm run build`     : Lulus (Next.js build sukses)

**Belum teruji:**
- Koneksi nyata ke Supabase live (DITUNDA, menunggu URL & key diisi)

### A4 — Utility & Helper Libraries ✅
**Selesai:** 2026-10-19

**Dibuat:**
- `frontend/src/lib/api-response.ts` — Helper standar JSON response (`apiSuccess`, `apiError`) dan mapper kode error RPC PostgreSQL per PRD §12.1
- `frontend/src/lib/format.ts` — Helper formatting Rupiah utuh (`formatRupiah`), persen (`formatPercent`), dan angka per PRD D4
- `frontend/src/lib/date.ts` — Helper kalkulasi tanggal bisnis zona WIB `Asia/Jakarta` (`getBusinessDate`, `getYesterday`, `formatDateId`) per PRD D5
- `frontend/src/middleware.ts` — Root Next.js middleware penjaga sesi auth Supabase

**Hasil verifikasi:**
- `npm run typecheck` : Lulus (0 error)
- `npm run lint`      : Lulus (0 warning, 0 error)
- `npm run test`      : Lulus (Vitest exit code 0)
- `npm run build`     : Lulus (Next.js build sukses dengan middleware terdaftar)

### A5 — Layout & Halaman Kosong ✅
**Selesai:** 2026-10-19

**Dibuat:**
- `frontend/src/app/(auth)/layout.tsx` — Layout khusus halaman autentikasi
- `frontend/src/app/(auth)/login/page.tsx` — Halaman login placeholder (lengkap dengan tombol quick demo 1-klik untuk juri)
- `frontend/src/app/(auth)/register/page.tsx` — Halaman pendaftaran owner placeholder
- `frontend/src/app/(app)/layout.tsx` — Layout utama aplikasi dengan sidebar desktop dan mobile drawer navigasi responsif
- 11 Halaman aplikasi grup `(app)`:
  - `dashboard/page.tsx` (3 Pertanyaan Pagi)
  - `pos/page.tsx` (Kasir / Smart Voice POS)
  - `transactions/page.tsx` (Riwayat Transaksi)
  - `expenses/page.tsx` (Pengeluaran Cabang)
  - `products/page.tsx` (Katalog Produk & Stok)
  - `stock/page.tsx` (Mutasi Stok & Log Pergerakan)
  - `reports/page.tsx` (Laba-Rugi Auto-Ledger)
  - `import/page.tsx` (Impor CSV/Excel)
  - `branches/page.tsx` (Kelola Cabang)
  - `staff/page.tsx` (Kelola Kasir)
  - `demo-guide/page.tsx` (Panduan 6 Skenario Juri)
- `frontend/src/app/page.tsx` — Landing page BizPulse terhubung ke login dan dashboard

**Hasil verifikasi:**
- `npm run typecheck` : Lulus (0 error)
- `npm run lint`      : Lulus (0 warning, 0 error)
- `npm run test`      : Lulus (Vitest exit code 0)
- `npm run build`     : Lulus (18 routes statis sukses dihasilkan)

### A6 — Unit Test Awal ✅
**Selesai:** 2026-10-19

**Dibuat:**
- `frontend/tests/lib/format.test.ts` — 9 pengujian format Rupiah utuh (D4), persen, bilangan bulat, dan null/undefined/NaN handling
- `frontend/tests/lib/date.test.ts` — 10 pengujian tanggal bisnis zona WIB `Asia/Jakarta` (D5), batas pergantian hari UTC, D-30 s/d D+6, dan format lokal ID
- `frontend/tests/lib/api-response.test.ts` — 8 pengujian struktur response JSON standar dan pemetaan kode error exception RPC PostgreSQL ke status HTTP (PRD §12.1)

**Hasil verifikasi:**
- `npm run test`      : **Lulus** (3 test files, 27 tests passed, 0 failed)
- `npm run typecheck` : **Lulus** (0 error)
- `npm run lint`      : **Lulus** (0 warning, 0 error)

### A7 — Verifikasi & Deploy ✅
**Selesai:** 2026-10-19

**Dibuat:**
- `README.md` — Dokumentasi proyek root lengkap (overview GTNIC 2026, tech stack, struktur proyek, panduan local dev & database setup, script pengujian)
- Verifikasi akhir build & linting seluruh proyek

**Hasil verifikasi:**
- `npm run typecheck` : **Lulus** (0 error)
- `npm run lint`      : **Lulus** (0 warning, 0 error)
- `npm run test`      : **Lulus** (27 tests passed)
- `npm run build`     : **Lulus** (18 static pages & middleware compiled successfully)

**Status Tahap A:** Selesai (Fondasi kode 100% siap)

---

## Tahap B: Auth dan Master Data (22–25 Okt)
**Status:** Belum dimulai (Menunggu persetujuan)