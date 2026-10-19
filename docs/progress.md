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

### A4 — Utility & Helper Libraries
**Status:** Belum dimulai

### A5 — Layout & Halaman Kosong
**Status:** Belum dimulai

### A6 — Unit Test Awal
**Status:** Belum dimulai

### A7 — Verifikasi & Deploy
**Status:** Belum dimulai