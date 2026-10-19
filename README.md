# BizPulse: Smart Voice POS & Asisten Keputusan Harian UMKM

> **Karya untuk Garda Tech National Innovation Competition (GTNIC) 2026**  
> **Track:** Web Development  
> **Subtema:** Accelerating Digital Transformation for Business and SMEs  

BizPulse adalah sistem aplikasi web Point of Sale (POS) multi-cabang berbasis perintah suara Bahasa Indonesia, pembukuan otomatis (Auto-Ledger laba-rugi), dan dashboard keputusan harian pemilik usaha menggunakan analitik Machine Learning (deteksi anomali pengeluaran robust modified Z-score dan peramalan permintaan 7 hari Holt-Winters).

---

## 🛠️ Tech Stack & Arsitektur

- **Frontend & Fullstack API:** Next.js 14 (App Router, React 18, TypeScript strict), Tailwind CSS, shadcn/ui, Recharts, Lucide Icons.
- **Database & Auth:** Supabase PostgreSQL (Multi-tenant via `org_id`, Row Level Security di semua tabel, RPC atomik untuk manajemen stok).
- **ML & NLP Engine:** TypeScript murni di sisi server (`src/server/ml/` dan `src/server/parsers/`).
- **Testing:** Vitest, Testing Library.
- **Deployment:** Vercel (Root Directory = `frontend`) & Supabase.

---

## 📁 Struktur Proyek

```
bizpulse/
├── database/                   # Skrip SQL Supabase
│   ├── schema.sql              # 12 Tabel, indeks, trigger WIB & batas cabang
│   ├── functions.sql           # RPC Security Definer (create_sale, restock, dll.)
│   └── rls.sql                 # Row Level Security & column-level GRANT
├── docs/                       # Dokumentasi spesifikasi & progres
│   ├── AGENTS.md               # Aturan kerja & konvensi kode
│   ├── assumptions.md          # Log keputusan teknis
│   ├── prdBigPulze.md          # Spesifikasi lengkap (Single Source of Truth)
│   └── progress.md             # Status & tracking tugas
├── frontend/                   # Aplikasi Next.js tunggal
│   ├── src/
│   │   ├── app/                # App Router rute halaman & API
│   │   ├── lib/                # Supabase helpers, currency format, WIB date
│   │   └── server/             # Server-only ML & Parsers (Tahap D & E)
│   ├── tests/                  # Unit test (Vitest)
│   └── package.json
└── README.md
```

---

## 🚀 Panduan Memulai Cepat (Local Development)

### 1. Masuk ke folder frontend dan install dependencies
```bash
cd frontend
npm install
```

### 2. Konfigurasi Variabel Lingkungan
Salin file template `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Lengkapi nilai:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (default: `http://localhost:3000`)

### 3. Setup Database Supabase
Jalankan file SQL di Supabase SQL Editor secara berurutan:
1. `database/schema.sql`
2. `database/functions.sql`
3. `database/rls.sql`

*Pastikan email confirmation dimatikan di Supabase Auth Settings.*

### 4. Jalankan Aplikasi
```bash
npm run dev
```
Buka browser di `http://localhost:3000`.

---

## 🧪 Perintah Pengujian & Kualitas Kode

Jalankan perintah ini dari folder `frontend/`:

```bash
npm run typecheck    # Pemeriksaan tipe TypeScript
npm run lint         # Linting kode dengan ESLint
npm run test         # Menjalankan unit test dengan Vitest
npm run build        # Build produksi Next.js
```

---

## 📜 Lisensi
MIT License
