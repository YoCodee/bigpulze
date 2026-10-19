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

### B1 — Skema Validasi Zod (Master Data & Auth) ✅
**Selesai:** 2026-10-19

**Dibuat:**
- `frontend/src/lib/validators/auth.ts` — Skema registrasi owner & login
- `frontend/src/lib/validators/branches.ts` — Skema create & update cabang (`daily_target >= 0`, soft-delete)
- `frontend/src/lib/validators/products.ts` — Skema create & update produk (`cost_price >= 0`, `selling_price >= 0`, `aliases`, `min_stock_alert`)
- `frontend/tests/lib/validators.test.ts` — 9 unit test pengujian skema validasi

**Hasil verifikasi:**
- `npm run test`      : **Lulus** (4 test files, 36 tests passed, 0 failed)
- `npm run typecheck` : **Lulus** (0 error)
- `npm run lint`      : **Lulus** (0 warning, 0 error)

---

### B2 — Autentikasi & Multi-Role ✅
**Selesai:** 2026-10-19

**Dibuat:**
- `frontend/src/app/api/auth/register/route.ts` — Endpoint registrasi owner: pembuatan akun auth auto-confirm, organisasi usaha (tenant), dan profile owner
- `frontend/src/app/api/auth/login/route.ts` — Endpoint login kredensial email & password berbasis cookie session + fetch data profile/org
- `frontend/src/app/api/auth/logout/route.ts` — Endpoint logout (pembersihan cookie auth)
- `frontend/src/app/api/auth/me/route.ts` — Endpoint session check current user profile & org
- `frontend/src/app/(auth)/login/page.tsx` — UI login interaktif dengan tombol quick demo 1-klik untuk Owner Demo & Kasir Demo serta redirect sesuai role
- `frontend/src/app/(auth)/register/page.tsx` — UI pendaftaran pemilik usaha interaktif dengan auto-login ke dashboard
- `frontend/scripts/create-demo-users.ts` — Skrip inisialisasi user demo ("Kopi Senja", 3 cabang, akun Owner Demo & Kasir Demo)

**Hasil verifikasi:**
- `npm run typecheck` : **Lulus** (0 error)
- `npm run lint`      : **Lulus** (0 warning, 0 error)
- `npm run test`      : **Lulus** (36 tests passed)
- `npm run build`     : **Lulus** (22 routes static & dynamic compiled)

---

### B3 — Role Guard & Layout Filter ✅
**Selesai:** 2026-10-19

**Dibuat:**
- `frontend/src/app/(app)/forbidden/page.tsx` — Halaman ramah 403 Akses Ditolak untuk kasir yang mencoba mengakses URL owner secara langsung
- `frontend/src/components/role-guard.tsx` — Komponen Client RoleGuard untuk memproteksi halaman privat owner
- `frontend/src/app/(app)/layout.tsx` — Filter menu dinamis (Kasir hanya melihat POS, Transaksi, Pengeluaran, Stok, Demo Guide), badge role, profile info, banner "Mode Demo", dan tombol logout
- Pemasangan `<RoleGuard allowedRoles={['OWNER']}>` pada 6 halaman khusus owner: `dashboard`, `reports`, `branches`, `staff`, `import`, `stock`

**Hasil verifikasi:**
- `npm run typecheck` : **Lulus** (0 error)
- `npm run lint`      : **Lulus** (0 warning, 0 error)
- `npm run test`      : **Lulus** (36 tests passed)
- `npm run build`     : **Lulus** (23 static & dynamic routes compiled)

---

### B4 — CRUD Cabang (Branch Management) ✅
**Selesai:** 2026-10-19

**Dibuat:**
- `frontend/src/app/api/branches/route.ts` — Endpoint GET (daftar cabang aktif) dan POST (tambah cabang dengan validasi Zod & guard 5 cabang per org)
- `frontend/src/app/api/branches/[id]/route.ts` — Endpoint PATCH (edit nama, lokasi, target omzet) dan DELETE (soft-delete is_active = false per PRD D9)
- `frontend/src/app/(app)/branches/page.tsx` — UI antarmuka lengkap kelola cabang (kartu cabang, target harian format Rupiah, modal tambah/edit, modal konfirmasi nonaktifkan, counter X/5 cabang aktif)

**Hasil verifikasi:**
- `npm run typecheck` : **Lulus** (0 error)
- `npm run lint`      : **Lulus** (0 warning, 0 error)
- `npm run test`      : **Lulus** (36 tests passed)
- `npm run build`     : **Lulus** (24 static & dynamic routes compiled)

---

### B5 — CRUD Produk per Cabang ✅
**Selesai:** 2026-10-19

**Dibuat:**
- `frontend/src/app/api/products/route.ts` — Endpoint GET (daftar produk aktif dengan filter `branch_id`, pencarian nama/SKU `q`, kategori) dan POST (tambah produk dengan validasi Zod, inisialisasi `stock = 0`, validasi duplikasi SKU per cabang)
- `frontend/src/app/api/products/[id]/route.ts` — Endpoint PATCH (edit field non-stock: nama, SKU, kategori, harga modal/jual, aliases, status aktif; `stock` dilarang diubah langsung sesuai aturan proteksi stok) dan DELETE (soft-delete `is_active = false`)
- `frontend/src/app/(app)/products/page.tsx` — UI katalog produk komprehensif: pemilih cabang, tab kategori, pencarian real-time, tabel produk interaktif, modal tambah/edit produk dengan input multi-alias tag, modal konfirmasi hapus (soft delete), serta warning proteksi HPP > Harga Jual dan badge indikator stok tipis

**Hasil verifikasi:**
- `npm run typecheck` : **Lulus** (0 error)
- `npm run lint`      : **Lulus** (0 warning, 0 error)
- `npm run test`      : **Lulus** (4 test files, 36 tests passed, 0 failed)
- `npm run build`     : **Lulus** (25 static & dynamic routes compiled)

**Status Tahap B:** Selesai (Autentikasi & Master Data 100% siap)

---

## Tahap C: Transaksi Inti (25–28 Okt)

### C1 — Skema Validasi Zod (Transaksi, Keranjang, Restock, Adjust, Transfer, Pengeluaran) ✅
**Selesai:** 2026-10-19

**Dibuat:**
- `frontend/src/lib/validators/transactions.ts` — Skema validasi item transaksi (`quantity >= 1`), create sale (`branch_id`, array `items`, `payment_method` CASH/QRIS_SIM, `input_method`, `client_tx_id` UUIDv4 idempotency, `cash_tendered`), dan void sale (`reason` min 3 karakter)
- `frontend/src/lib/validators/stock.ts` — Skema validasi restock (`quantity > 0`, `unit_cost >= 0`, `note`), adjust stock opname (`new_stock >= 0`, `reason`), dan transfer antarcabang (`from_product_id != to_product_id`, `quantity > 0`)
- `frontend/src/lib/validators/expenses.ts` — Skema validasi pengeluaran operasional cabang (`branch_id`, 8 kategori standar PRD, `amount > 0`, `expense_date` YYYY-MM-DD, `description`) dan skema update
- `frontend/tests/lib/validators-transactions.test.ts` — 15 unit test komprehensif menguji skema transaksi, mutasi stok, dan pengeluaran

**Hasil verifikasi:**
- `npm run test`      : **Lulus** (5 test files, 51 tests passed, 0 failed)
- `npm run typecheck` : **Lulus** (0 error)
- `npm run lint`      : **Lulus** (0 warning, 0 error)

---

### C2 — POS & Transaksi Penjualan ✅
**Selesai:** 2026-10-19

**Dibuat:**
- `frontend/src/app/api/transactions/route.ts` — Endpoint `POST` (memanggil RPC `create_sale` Supabase dengan validasi item Zod, idempotency `client_tx_id`, kalkulasi uang diterima dan kembalian, serta mengembalikan data transaksi lengkap dengan rincian item) & Endpoint `GET` (daftar riwayat transaksi dengan filter cabang, tanggal bisnis, status, dan pagination)
- `frontend/src/app/(app)/pos/page.tsx` — UI antarmuka kasir modern: selector cabang aktif, pencarian produk real-time, tab filter kategori, kartu katalog produk dengan status stok habis/menipis, panel keranjang dinamis dengan stepper kuantitas dan guard stok maksimum, modal pembayaran Tunai dengan tombol saran pecahan uang pas dan kalkulasi kembalian otomatis, modal QRIS simulasi dengan auto-confirm countdown, serta modal cetak struk/nota sah transaksi berhasil

**Hasil verifikasi:**
- `npm run typecheck` : **Lulus** (0 error)
- `npm run lint`      : **Lulus** (0 warning, 0 error)
- `npm run test`      : **Lulus** (51 tests passed)
- `npm run build`     : **Lulus** (26 static & dynamic routes compiled)