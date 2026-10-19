# PRD: BizPulse

**BizPulse: Sistem Web Point of Sale Berbasis Suara, Otomatisasi Pembukuan Multi-Cabang, dan Asisten Keputusan Harian UMKM Menggunakan Machine Learning**

| | |
|---|---|
| **Kompetisi** | Garda Tech National Innovation Competition (GTNIC) 2026, Web Development Track |
| **Subtema** | Accelerating Digital Transformation for Business and SMEs |
| **Fokus industri** | Business, UMKM, Digital Economy |
| **Scope karya** | Gabungan POS/Transaksi, Inventory Management, dan Dashboard Bisnis |
| **Masa pengerjaan** | 19 Oktober sampai 10 November 2026 (deadline 10 Nov 2026, 23.59 WIB) |
| **Versi dokumen** | 2.0 (versi lengkap untuk AI agent) |

---

## 0. Cara Memakai Dokumen Ini (WAJIB DIBACA AI AGENT)

Dokumen ini adalah **sumber kebenaran tunggal**. Ikuti aturan berikut agar tidak ada keputusan yang ditebak.

1. **Baca bagian 0 sampai 4 dulu**, lalu kerjakan sesuai urutan di bagian 17 (Urutan Pembangunan).
2. **Keputusan di bagian 3 (Keputusan Teknis Terkunci) tidak boleh diubah** tanpa persetujuan manusia.
3. Setiap fitur punya **ID (FR-x.x)**, **prioritas**, dan **kriteria penerimaan**. Fitur dianggap selesai hanya jika semua kriteria terpenuhi.
4. Prioritas: **P0** = wajib ada di versi yang dikumpulkan, **P1** = dikerjakan setelah semua P0 selesai, **P2** = hanya jika waktu sisa.
5. Jika ada hal yang tidak diatur dokumen ini, pilih opsi **paling sederhana yang konsisten dengan bagian 3**, lalu catat asumsi di `docs/assumptions.md` (format: tanggal, konteks, keputusan). Jangan berhenti untuk bertanya kecuali menyangkut keamanan atau kehilangan data.
6. **Definisi selesai (Definition of Done)** untuk setiap tugas:
   - `npm run typecheck`, `npm run lint`, dan `npm run test` lulus.
   - Semua input divalidasi dengan Zod di server.
   - Ada state loading, error, dan kosong (empty) pada setiap halaman data.
   - Tampil baik di lebar 360 px, 768 px, dan 1280 px.
   - Tidak ada error di console browser pada alur utama.
   - Tidak ada secret atau file `.env` yang ter-commit.
7. **Bahasa:** teks antarmuka dalam Bahasa Indonesia. Kode, nama variabel, nama tabel, dan komentar kode dalam Bahasa Inggris.
8. **Jangan menambah fitur di luar dokumen ini.** Fitur di bagian 5.2 (Non-Goals) tidak boleh dibuat.

### Glosarium

| Istilah | Arti |
|---|---|
| UMKM | Usaha Mikro, Kecil, dan Menengah |
| Org | Satu usaha (tenant). Satu org punya 1 sampai 5 cabang |
| Owner | Pemilik usaha, akses semua cabang dan dashboard |
| Cashier | Kasir atau kepala cabang, akses POS dan stok cabangnya saja |
| HPP / COGS | Harga Pokok Penjualan (modal per unit) |
| WIB | Zona waktu Asia/Jakarta (UTC+7) |
| Hari bisnis (`business_date`) | Tanggal transaksi menurut WIB |
| "Kemarin" | Hari bisnis sebelum hari ini (WIB) |
| WAPE | Weighted Absolute Percentage Error, metrik akurasi forecast |
| Seed | Data contoh demo yang dimuat otomatis |

---

## 1. Ringkasan Produk

BizPulse membantu pemilik UMKM dengan 1 sampai 5 cabang menjawab tiga pertanyaan setiap pagi: **kemarin untung atau rugi, apa yang harus diperhatikan, dan apa yang harus dilakukan hari ini**. Datanya berasal dari kasir cabang yang bisa mencatat penjualan dan pengeluaran **lewat suara atau impor Excel/CSV**, lalu dihitung otomatis menjadi laba-rugi. Lapisan analitik (deteksi anomali pengeluaran dan prediksi permintaan 7 hari) mengubah data historis menjadi daftar tindakan.

**Prinsip:** satu alur utama yang berjalan penuh (catat, hitung, analisis, rekomendasi, tindakan), bukan banyak fitur setengah jadi. Alur ini harus bisa diuji juri tanpa persiapan lewat **Demo Mode**.

---

## 2. Latar Belakang dan Alur Masalah

| Tahap | Isi |
|---|---|
| **01 Masalah** | UMKM multi-cabang mencatat transaksi kasir, pengeluaran harian, dan stok di buku tulis atau Excel terpisah. Rekap lambat dan rawan salah. Pemilik tidak tahu pasti untung atau rugi tiap pagi, terlambat sadar ada kebocoran kas di cabang, dan sering salah memperkirakan belanja stok. |
| **02 Pengguna** | **Owner UMKM** (1 sampai 5 cabang: kafe, rumah makan, toko kelontong, laundry, fesyen) yang butuh ringkasan keputusan pagi hari. **Kasir/Kepala Cabang** yang butuh input transaksi dan pengeluaran sangat cepat tanpa mengganggu pelayanan. |
| **03 Solusi** | Aplikasi web Next.js + Supabase dengan Smart Voice POS, Import Excel/CSV, Auto-Ledger laba-rugi, dan dashboard "3 Pertanyaan Pagi" berbasis analitik ML (anomali dan forecast). |
| **04 Dampak** | **Lebih cepat:** input suara dan migrasi instan dari Excel. **Lebih mudah:** laba-rugi per cabang dan gabungan tersusun otomatis tanpa keahlian akuntansi. **Lebih terukur:** tiga jawaban pagi dengan dukungan anomali dan prediksi. |

> **Catatan klaim:** angka seperti "3x lebih cepat" HARUS diukur dulu (uji waktu 5 sampai 10 transaksi manual vs suara) dan dicatat di `docs/evaluation.md`. Jika tidak diukur, jangan ditulis sebagai angka di proposal.

### 2.1 Tujuan
1. Sistem web fungsional untuk transaksi, stok lintas cabang, dan keputusan harian.
2. Pembukuan otomatis dari transaksi menjadi laporan laba-rugi yang dapat dilampirkan untuk pengajuan pembiayaan.
3. Analitik ML untuk peringatan dini anomali pengeluaran dan prediksi 7 hari.
4. Pengalaman juri yang instan: Demo Mode, login satu klik, dan sampel suara.

### 2.2 Keunikan Dibanding Sistem Serupa

| Aspek | POS/Akuntansi konvensional | BizPulse |
|---|---|---|
| Input kasir | Ketik dan cari produk satu per satu | **Smart Voice POS** (suara Bahasa Indonesia, dengan fallback ketik) + **Excel/CSV Importer** |
| Dashboard owner | Puluhan grafik akuntansi rumit | **3 Pertanyaan Pagi**: tiga kartu keputusan |
| Analitik | Laporan historis saja | **Prescriptive**: anomali biaya, forecast 7 hari, rekomendasi restock dan mutasi antar cabang yang bisa langsung dieksekusi |
| Pengujian juri | Perlu input data manual lama | **Demo Mode**: seed 1 klik, login demo, sampel suara |

> **Catatan kejujuran teknis untuk proposal:** komponen ML yang diimplementasikan adalah **deteksi anomali statistik robust (modified Z-score)** dan **time-series forecasting (Holt-Winters)**. Parser suara adalah **NLP berbasis aturan + fuzzy matching**, bukan model ML. Tulis seperti ini di proposal. Isolation Forest masuk rencana pengembangan.

---

## 3. Keputusan Teknis Terkunci

| # | Keputusan | Alasan |
|---|---|---|
| D1 | **Satu proyek Next.js 14 (App Router, React 18, TypeScript strict)** di folder `frontend/` berisi UI dan API (Route Handlers). Tidak ada server Python atau layanan terpisah. | Deployment tunggal di Vercel, minim titik gagal |
| D2 | Seluruh ML dan parser ditulis **TypeScript, server-side** (`frontend/src/server/`). | Tanpa infrastruktur ML terpisah, mudah diuji |
| D3 | Database **Supabase PostgreSQL** dengan **Row Level Security** di semua tabel. Multi-tenant lewat kolom `org_id`. | Isolasi data antar usaha |
| D4 | **Semua uang disimpan sebagai `BIGINT` rupiah utuh** (tanpa desimal). Format tampilan `Intl.NumberFormat('id-ID')`. | Menghindari error pembulatan |
| D5 | **Zona waktu bisnis = `Asia/Jakarta`.** `business_date` dan "kemarin" dihitung dengan WIB, bukan UTC. | Konsistensi laporan harian |
| D6 | **Stok hanya boleh berubah lewat fungsi database (RPC)** yang atomik dan mencatat `stock_movements`. Dilarang `UPDATE products SET stock` dari kode aplikasi. | Mencegah race condition dan stok tidak terlacak |
| D7 | **Pembelian stok dagang TIDAK dicatat sebagai `expenses`.** Biaya barang sudah masuk lewat HPP saat terjual. Pembelian stok dicatat lewat fitur **Restock**. | Menghindari penghitungan ganda (double counting) di laba-rugi |
| D8 | **Voice input memakai Web Speech API** (`id-ID`) pada browser yang mendukung, dengan **fallback kotak teks** dan **sampel suara juri berbasis transkrip tersimpan** (lihat FR-2.2 dan FR-2.4). | Firefox tidak mendukung Web Speech API; juri harus tetap bisa menguji |
| D9 | **Soft delete:** cabang dan produk dinonaktifkan (`is_active = false`), tidak dihapus permanen jika sudah punya transaksi. | Menjaga integritas laporan |
| D10 | **Email confirmation Supabase dimatikan** agar pendaftaran dan demo tidak terhambat. | Pengalaman juri |
| D11 | **Seed demo memakai tanggal relatif** terhadap hari ini (D-30 sampai D-1), bukan tanggal tetap. | "Kemarin" harus selalu berisi data |
| D12 | **Format JSON API memakai `snake_case`**, kode TypeScript `camelCase`, rute URL `kebab-case`. | Konsistensi |
| D13 | Library: Tailwind CSS, shadcn/ui, Recharts, `@supabase/ssr`, `@supabase/supabase-js`, Zod, React Hook Form, `papaparse`, `jspdf` + `jspdf-autotable`, `date-fns` + `date-fns-tz`, Vitest. Excel: `exceljs` atau SheetJS dari distribusi resmi `cdn.sheetjs.com` (bukan paket npm `xlsx` 0.18.5 yang memiliki kerentanan diketahui). | Stabil dan aman |
| D14 | Deployment: **Vercel** (Root Directory = `frontend`) dan **Supabase**. | Gratis, publik |

---

## 4. Peran dan Hak Akses

| Resource | Owner | Cashier (cabangnya saja) | Publik |
|---|---|---|---|
| Landing, login, register | ya | ya | ya |
| Dashboard 3 Pertanyaan Pagi | ya | tidak | tidak |
| CRUD cabang | ya | tidak | tidak |
| CRUD produk | ya | hanya lihat | tidak |
| Restock, penyesuaian, mutasi stok | ya | restock dan penyesuaian cabang sendiri | tidak |
| POS (buat transaksi) | ya (pilih cabang) | ya (cabang sendiri) | tidak |
| Void transaksi | ya | tidak | tidak |
| Catat pengeluaran | ya | ya (cabang sendiri) | tidak |
| Laporan laba-rugi | ya | tidak | tidak |
| Impor CSV/Excel | ya | tidak | tidak |
| Kelola akun kasir | ya | tidak | tidak |
| Reset data demo | owner org demo saja | tidak | tidak |

---

## 5. Ruang Lingkup

### 5.1 Termasuk
Autentikasi multi-peran, CRUD cabang dan produk, POS visual, Smart Voice POS, pencatatan pengeluaran, restock dan mutasi stok, Auto-Ledger laba-rugi dengan ekspor PDF, impor CSV/Excel, dashboard 3 Pertanyaan Pagi (anomali, forecast, rekomendasi), Demo Mode.

### 5.2 Non-Goals (DILARANG dibuat)
Payment gateway nyata (QRIS hanya simulasi), cetak struk fisik atau printer, mode offline atau PWA, pajak (PPN) dan multi-mata-uang, shift kasir dan loyalty pelanggan, notifikasi WhatsApp/email, integrasi marketplace, retur parsial, Isolation Forest atau model deep learning, aplikasi mobile native, admin platform.

---

## 6. Spesifikasi Fitur Fungsional

### Modul 1: Multi-Cabang, Inventori, dan Data

| ID | Prio | Fitur | Kriteria penerimaan |
|---|---|---|---|
| FR-1.1 | P0 | **Autentikasi dan role.** Register owner (membuat user, org, dan profile sekaligus lewat server dengan service role), login, logout. Tombol **"Masuk sebagai Owner Demo"** dan **"Masuk sebagai Kasir Demo"** di halaman login. | Owner baru langsung masuk ke dashboard tanpa verifikasi email. Cashier hanya melihat menu POS, Stok cabangnya, Pengeluaran. Akses langsung ke URL yang dilarang menampilkan halaman 403. Kedua tombol demo berfungsi satu klik. |
| FR-1.2 | P0 | **CRUD cabang (1 sampai 5).** Field: `name` (wajib, unik per org), `location` (wajib), `daily_target` (bilangan bulat ≥ 0), `is_active`. "Hapus" = nonaktifkan. | Cabang ke-6 ditolak dengan pesan jelas. Cabang nonaktif tidak muncul di POS dan dashboard. Cabang yang punya transaksi tidak bisa dihapus permanen. |
| FR-1.3 | P0 | **CRUD produk per cabang:** `sku`, `name`, `category`, `cost_price` (HPP), `selling_price`, `stock`, `min_stock_alert`, `aliases` (nama panggilan untuk suara, contoh: "kopsu"). SKU unik per cabang. | Validasi: harga ≥ 0, stok bilangan bulat ≥ 0, SKU wajib unik. Harga jual di bawah HPP menampilkan peringatan (bukan error). Pencarian dan filter kategori berfungsi. |
| FR-1.4 | P1 | **Salin katalog ke cabang lain** (produk tanpa stok). | Produk dengan SKU yang sudah ada di cabang tujuan dilewati dan dilaporkan. |
| FR-1.5 | P1 | **Kelola akun kasir** oleh owner: buat (email, nama, password awal, cabang), nonaktifkan, ganti cabang. Dibuat lewat server dengan service role. | Kasir baru bisa login dan hanya melihat cabangnya. |
| FR-1.6 | P0 | **Impor CSV/Excel** (lihat bagian 8). | Semua kriteria di bagian 8 terpenuhi. |
| FR-1.7 | P0 | **Demo Mode:** tombol **"Reset & Muat Data Demo 3 Cabang"** (khusus org demo). | Data demo termuat < 15 detik. Setelah itu dashboard menampilkan skenario di bagian 11.3. Tombol tidak muncul untuk org non-demo. |
| FR-1.8 | P0 | **Restock, penyesuaian, dan mutasi stok.** **Restock:** tambah qty dengan `unit_cost` opsional. **Penyesuaian (opname):** set stok ke angka hasil hitung fisik dengan alasan wajib. **Mutasi antar cabang:** pilih SKU, cabang asal, cabang tujuan, qty (langsung selesai, tanpa status "dalam perjalanan"). Semuanya lewat RPC dan tercatat di `stock_movements`. | Mutasi melebihi stok asal ditolak. Setelah mutasi, stok kedua cabang berubah dan ada 2 baris `stock_movements` (`TRANSFER_OUT` dan `TRANSFER_IN`). Riwayat pergerakan stok dapat dilihat per produk. |

### Modul 2: Smart Voice POS dan Pengeluaran

| ID | Prio | Fitur | Kriteria penerimaan |
|---|---|---|---|
| FR-2.1 | P0 | **POS visual.** Grid produk (cari + filter kategori), keranjang dengan stepper qty, pilihan bayar **Tunai** atau **QRIS (Simulasi)**, tombol "Bayar & Simpan". QRIS simulasi menampilkan kode QR dummy dan tombol "Tandai Lunas", diberi label jelas "Simulasi". | Produk stok 0 tidak bisa ditambahkan. Simpan memanggil `POST /api/transactions` dengan `client_tx_id` (cegah dobel kirim). Setelah sukses: toast, keranjang kosong, peringatan jika stok produk ≤ `min_stock_alert`. Kasir hanya melihat produk cabangnya. Owner memilih cabang lebih dulu. |
| FR-2.2 | P0 | **Input perintah suara.** Tombol mikrofon memakai Web Speech API (`lang = 'id-ID'`) bila tersedia. Jika tidak tersedia (mis. Firefox) atau izin ditolak, tampil **kotak teks "Ketik atau tempel perintah"** yang memakai alur parser yang sama. Suara dapat berisi penjualan maupun pengeluaran. | Status UI: idle, mendengarkan (indikator + transkrip sementara), memproses, konfirmasi, error. Pesan jelas untuk: tidak ada suara, izin mikrofon ditolak, browser tidak didukung. Transkrip dikirim ke `POST /api/voice-parse`. |
| FR-2.3 | P0 | **Modal konfirmasi.** Hasil parser tampil sebagai daftar item (nama, qty, harga, bisa diedit atau dihapus) dan/atau draf pengeluaran (kategori, deskripsi, nominal). Item dengan `confidence < 0.6` diberi tanda "perlu dicek" dan dropdown pilih produk. Baris tidak dikenali ditampilkan dan bisa dipetakan manual. Tidak ada data tersimpan sebelum pengguna menekan "Simpan". | Menyimpan lewat endpoint yang sama dengan input manual (`input_method = 'VOICE'`, `voice_transcript` terisi). Membatalkan tidak menyimpan apa pun. |
| FR-2.4 | P0 | **Judge Audio Tester.** Tiga tombol sampel di halaman POS. Tombol memutar file audio sampel dan menjalankan **transkrip tersimpan** milik sampel itu melalui parser (bukan pengenalan ucapan real-time). Label di UI: "Sampel demo: transkrip tersimpan". | Ketiga sampel menghasilkan hasil yang sesuai tabel di bagian 9.3. Tetap berjalan walau audio gagal diputar (parser tetap dijalankan). |
| FR-2.5 | P0 | **Riwayat transaksi** per cabang dengan filter tanggal, metode input, status. Detail menampilkan item. | Paginasi 20 baris. Owner melihat semua cabang. |
| FR-2.6 | P1 | **Void transaksi** (owner): status menjadi `VOID`, stok dikembalikan (movement `VOID_RETURN`), dikeluarkan dari laporan. Alasan wajib. Lewat RPC `void_sale`. | Void dua kali ditolak. Laba-rugi tidak lagi memasukkan transaksi VOID. |

### Modul 3: Auto-Ledger

| ID | Prio | Fitur | Kriteria penerimaan |
|---|---|---|---|
| FR-3.1 | P0 | **HPP dan pemotongan stok otomatis.** Setiap transaksi (RPC `create_sale`) memotong stok, menyimpan `unit_cost` dan `unit_price` per item (snapshot), serta menghitung `total_cogs` dan `gross_profit`. | Mengubah HPP produk setelahnya tidak mengubah transaksi lama. |
| FR-3.2 | P0 | **CRUD pengeluaran cabang.** Kategori tetap: `Utilitas`, `Gaji`, `Sewa`, `Transportasi`, `Pemasaran`, `Perawatan`, `Perlengkapan Operasional`, `Lainnya`. Tidak ada kategori "Bahan Baku" (lihat D7). Saat disimpan, server menghitung skor anomali (bagian 10.1) dan mengisi `is_anomaly`, `anomaly_score`, `anomaly_reason`. | Nominal bilangan bulat > 0. Pengeluaran anomali menampilkan badge dan alasan di daftar. Kasir hanya bisa mengelola pengeluaran cabangnya. |
| FR-3.3 | P0 | **Laporan Laba-Rugi.** Filter: cabang (satu atau gabungan), periode (preset: Kemarin, 7 hari, 30 hari, Bulan ini, dan rentang kustom). Tabel: Pendapatan, HPP, Laba Kotor, Beban per kategori, **Laba Bersih = Pendapatan − HPP − Beban**, margin bersih (%). Grafik harian. | Angka konsisten dengan data mentah (uji dengan seed). Transaksi VOID tidak dihitung. |
| FR-3.4 | P0 | **Ekspor PDF laba-rugi** (client-side `jspdf`): kop (nama usaha, cabang, periode, tanggal cetak), tabel, dan catatan kaki "Dibuat otomatis oleh BizPulse. Format dan penerimaan oleh lembaga pembiayaan ditentukan masing-masing lembaga." | File terunduh dengan nama `LabaRugi_<usaha>_<periode>.pdf`. Jangan mengklaim "pasti diterima KUR". |
| FR-3.5 | P1 | **Ringkasan arus kas sederhana:** kas masuk = pendapatan, kas keluar = beban + biaya restock (`qty × unit_cost` dari movement `RESTOCK`), selisih kas bersih. | Label jelas "Ringkasan sederhana, bukan laporan arus kas akuntansi penuh". |

### Modul 4: Dashboard "3 Pertanyaan Pagi" (khusus Owner)

| ID | Prio | Fitur | Kriteria penerimaan |
|---|---|---|---|
| FR-4.1 | P0 | **Panel 1, "Kemarin untung atau rugi?"**: laba/rugi bersih kemarin, margin, perbandingan dengan hari sebelumnya (%), **Branch Leaderboard** (peringkat laba bersih + persen capaian `daily_target`), dan status kesehatan (aturan di 10.4). | Angka sama dengan laporan laba-rugi periode "Kemarin". |
| FR-4.2 | P0 | **Panel 2, "Apa yang harus saya perhatikan?"**: daftar anomali pengeluaran (10.1), peringatan omzet turun (10.2, P1), dan stok kritis (10.4). Urut berdasarkan tingkat keparahan. | Setiap kartu menampilkan cabang, judul, penjelasan satu kalimat, dan tautan ke data terkait. |
| FR-4.3 | P0 | **Panel 3, "Apa yang harus saya lakukan?"**: grafik prediksi omzet 7 hari (garis + pita interval), metrik akurasi (WAPE), dan **To-Do rekomendasi** (restock dan mutasi antar cabang, 10.3). Tombol **"Terapkan"** pada rekomendasi mutasi membuka konfirmasi lalu memanggil RPC mutasi dan menandai rekomendasi selesai. Rekomendasi restock memiliki tombol "Catat restock" yang membuka form Restock terisi qty usulan. Tombol "Tandai selesai" untuk semua rekomendasi. | Rekomendasi yang diterapkan tidak muncul lagi di daftar aktif. |
| FR-4.4 | P0 | Tombol **"Segarkan analisis"** memanggil `POST /api/ml/run-forecast`. Briefing otomatis dihitung saat dashboard pertama dibuka pada hari itu bila belum ada. | Hasil analisis hari yang sama dipakai ulang (cache) sampai di-refresh. |
| FR-4.5 | P1 | Filter cabang (Semua / satu cabang) dan tren 14 hari per cabang. | |

### Modul 5: Pengalaman Juri dan Umum

| ID | Prio | Fitur |
|---|---|---|
| FR-5.1 | P0 | **Halaman `/demo-guide`**: langkah uji 6 skenario (bagian 11.2) dengan tautan langsung ke tiap halaman, serta daftar akun demo. |
| FR-5.2 | P0 | **Banner "Mode Demo"** di semua halaman org demo. |
| FR-5.3 | P0 | Landing page (masalah, solusi, 3 Pertanyaan Pagi, tombol "Coba Demo" dan "Masuk"). |
| FR-5.4 | P0 | Semua halaman responsif, state loading (skeleton), kosong, dan error yang ramah, toast sukses/gagal. |

---

## 7. Skema Database (Supabase PostgreSQL)

> Simpan di `database/schema.sql`, `database/functions.sql`, `database/rls.sql`. Jalankan berurutan. Semua kolom uang `BIGINT` (rupiah).

### 7.1 `schema.sql`

```sql
create extension if not exists pgcrypto;

-- WIB helper (STABLE; dipakai di trigger, bukan di generated column)
create or replace function wib_date(ts timestamptz) returns date
language sql stable as $$ select (ts at time zone 'Asia/Jakarta')::date $$;

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table branches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name varchar(100) not null,
  location text not null,
  daily_target bigint not null default 0 check (daily_target >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (org_id, name)
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  full_name varchar(100) not null,
  role text not null check (role in ('OWNER','CASHIER')),
  branch_id uuid references branches(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (role = 'OWNER' or branch_id is not null)
);

create table products (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  sku varchar(50) not null,
  name varchar(150) not null,
  category varchar(80) not null,
  cost_price bigint not null check (cost_price >= 0),
  selling_price bigint not null check (selling_price >= 0),
  stock int not null default 0 check (stock >= 0),
  min_stock_alert int not null default 10 check (min_stock_alert >= 0),
  aliases text[] not null default '{}',
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (branch_id, sku)
);
create index idx_products_branch on products(branch_id) where is_active;

create table transactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete restrict,
  created_by uuid references auth.users(id),
  client_tx_id uuid,
  transaction_date timestamptz not null default now(),
  business_date date not null,                       -- diisi trigger (WIB)
  input_method text not null default 'MANUAL' check (input_method in ('MANUAL','VOICE','IMPORT','DEMO')),
  payment_method text not null default 'CASH' check (payment_method in ('CASH','QRIS_SIM')),
  status text not null default 'COMPLETED' check (status in ('COMPLETED','VOID')),
  total_revenue bigint not null default 0 check (total_revenue >= 0),
  total_cogs bigint not null default 0 check (total_cogs >= 0),
  gross_profit bigint generated always as (total_revenue - total_cogs) stored,
  voice_transcript text,
  voided_at timestamptz,
  voided_by uuid references auth.users(id),
  void_reason text,
  created_at timestamptz not null default now()
);
create unique index uq_tx_client on transactions(branch_id, client_tx_id) where client_tx_id is not null;
create index idx_tx_branch_date on transactions(branch_id, business_date);
create index idx_tx_org_date on transactions(org_id, business_date);

create table transaction_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete restrict,
  transaction_id uuid not null references transactions(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  product_name varchar(150) not null,                -- snapshot
  quantity int not null check (quantity > 0),
  unit_cost bigint not null check (unit_cost >= 0),
  unit_price bigint not null check (unit_price >= 0),
  subtotal bigint generated always as (quantity * unit_price) stored
);
create index idx_items_tx on transaction_items(transaction_id);
create index idx_items_product on transaction_items(product_id);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete restrict,
  created_by uuid references auth.users(id),
  expense_date date not null default wib_date(now()),
  category text not null check (category in
    ('Utilitas','Gaji','Sewa','Transportasi','Pemasaran','Perawatan','Perlengkapan Operasional','Lainnya')),
  description text not null,
  amount bigint not null check (amount > 0),
  input_method text not null default 'MANUAL' check (input_method in ('MANUAL','VOICE','IMPORT','DEMO')),
  voice_transcript text,
  is_anomaly boolean not null default false,
  anomaly_score numeric(6,2) not null default 0,
  anomaly_reason text,
  created_at timestamptz not null default now()
);
create index idx_exp_branch_date on expenses(branch_id, expense_date);

create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete restrict,
  product_id uuid not null references products(id) on delete restrict,
  movement_type text not null check (movement_type in
    ('SALE','VOID_RETURN','RESTOCK','ADJUSTMENT','TRANSFER_OUT','TRANSFER_IN','IMPORT')),
  quantity_change int not null,                      -- bertanda (+/-)
  stock_after int not null check (stock_after >= 0),
  unit_cost bigint,                                  -- diisi untuk RESTOCK
  reference_type text,                               -- 'TRANSACTION' | 'TRANSFER' | null
  reference_id uuid,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index idx_mov_product on stock_movements(product_id, created_at desc);

create table stock_transfers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  from_branch_id uuid not null references branches(id),
  to_branch_id uuid not null references branches(id),
  from_product_id uuid not null references products(id),
  to_product_id uuid not null references products(id),
  quantity int not null check (quantity > 0),
  status text not null default 'COMPLETED' check (status in ('COMPLETED','CANCELLED')),
  source_recommendation_id uuid,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  check (from_branch_id <> to_branch_id)
);

create table forecasts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,   -- null = omzet cabang
  forecast_date date not null,
  predicted_value numeric(14,2) not null,
  lower_bound numeric(14,2) not null,
  upper_bound numeric(14,2) not null,
  model text not null,                               -- 'holt_winters_7' | 'seasonal_naive' | 'moving_avg'
  generated_on date not null default wib_date(now())
);
create index idx_fc_branch on forecasts(branch_id, generated_on, forecast_date);

create table ml_recommendations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid references branches(id) on delete cascade,    -- null = seluruh usaha
  briefing_date date not null default wib_date(now()),
  question_category text not null check (question_category in ('PROFIT','ATTENTION','ACTION')),
  rec_type text not null check (rec_type in
    ('ANOMALY_EXPENSE','REVENUE_DROP','STOCK_CRITICAL','RESTOCK','TRANSFER','HEALTH_SUMMARY')),
  severity text not null default 'INFO' check (severity in ('INFO','WARNING','CRITICAL')),
  title varchar(200) not null,
  description text not null,
  payload jsonb not null default '{}',               -- skema per rec_type di bagian 10.5
  predicted_value numeric(14,2),
  is_resolved boolean not null default false,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_rec_org_date on ml_recommendations(org_id, briefing_date);

create table import_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid references branches(id),
  created_by uuid references auth.users(id),
  import_type text not null check (import_type in ('SALES','PRODUCTS')),
  file_name text not null,
  status text not null default 'COMPLETED' check (status in ('COMPLETED','FAILED')),
  total_rows int not null default 0,
  success_rows int not null default 0,
  error_rows int not null default 0,
  error_report jsonb not null default '[]',
  created_at timestamptz not null default now()
);

-- Trigger: isi business_date (WIB)
create or replace function set_business_date() returns trigger language plpgsql as $$
begin
  new.business_date := wib_date(new.transaction_date);
  return new;
end $$;
create trigger trg_tx_business_date before insert or update of transaction_date on transactions
  for each row execute function set_business_date();

-- Trigger: maksimum 5 cabang aktif per org
create or replace function enforce_branch_limit() returns trigger language plpgsql as $$
begin
  if (select count(*) from branches where org_id = new.org_id and is_active) >= 5 then
    raise exception 'BRANCH_LIMIT_REACHED';
  end if;
  return new;
end $$;
create trigger trg_branch_limit before insert on branches
  for each row execute function enforce_branch_limit();
```

### 7.2 `functions.sql` (helper dan RPC)

Semua RPC adalah `SECURITY DEFINER` dengan `set search_path = public`, **wajib memeriksa org dan role sendiri** (karena melewati RLS), dan di-`GRANT EXECUTE` hanya ke `authenticated`.

```sql
create or replace function auth_org_id() returns uuid
language sql stable security definer set search_path = public as
$$ select org_id from profiles where id = auth.uid() and is_active $$;

create or replace function auth_role() returns text
language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() and is_active $$;

create or replace function auth_branch_id() returns uuid
language sql stable security definer set search_path = public as
$$ select branch_id from profiles where id = auth.uid() and is_active $$;

-- RPC referensi (POLA YANG WAJIB DIIKUTI semua RPC lain)
create or replace function create_sale(
  p_branch_id uuid,
  p_items jsonb,                    -- [{"product_id":"<uuid>","quantity":2}]
  p_payment_method text default 'CASH',
  p_input_method text default 'MANUAL',
  p_voice_transcript text default null,
  p_client_tx_id uuid default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid := auth_org_id();
  v_role text := auth_role();
  v_tx uuid; v_item jsonb; v_prod products%rowtype;
  v_qty int; v_rev bigint := 0; v_cogs bigint := 0;
begin
  if v_org is null then raise exception 'UNAUTHENTICATED'; end if;
  if not exists (select 1 from branches b
                 where b.id = p_branch_id and b.org_id = v_org and b.is_active) then
    raise exception 'BRANCH_NOT_FOUND';
  end if;
  if v_role <> 'OWNER' and p_branch_id is distinct from auth_branch_id() then
    raise exception 'FORBIDDEN';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;
  -- idempotensi: kirim ulang dengan client_tx_id sama mengembalikan transaksi lama
  if p_client_tx_id is not null then
    select id into v_tx from transactions
      where branch_id = p_branch_id and client_tx_id = p_client_tx_id;
    if found then return v_tx; end if;
  end if;

  insert into transactions (org_id, branch_id, created_by, payment_method, input_method,
                            voice_transcript, client_tx_id)
  values (v_org, p_branch_id, auth.uid(), p_payment_method, p_input_method,
          p_voice_transcript, p_client_tx_id)
  returning id into v_tx;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    if v_qty is null or v_qty <= 0 then raise exception 'INVALID_QTY'; end if;

    select * into v_prod from products
      where id = (v_item->>'product_id')::uuid and branch_id = p_branch_id and is_active
      for update;                                    -- kunci baris, cegah race condition
    if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
    if v_prod.stock < v_qty then raise exception 'INSUFFICIENT_STOCK:%', v_prod.name; end if;

    insert into transaction_items (org_id, branch_id, transaction_id, product_id,
                                   product_name, quantity, unit_cost, unit_price)
    values (v_org, p_branch_id, v_tx, v_prod.id, v_prod.name, v_qty,
            v_prod.cost_price, v_prod.selling_price);

    update products set stock = stock - v_qty, updated_at = now() where id = v_prod.id;

    insert into stock_movements (org_id, branch_id, product_id, movement_type,
                                 quantity_change, stock_after, reference_type, reference_id, created_by)
    values (v_org, p_branch_id, v_prod.id, 'SALE', -v_qty, v_prod.stock - v_qty,
            'TRANSACTION', v_tx, auth.uid());

    v_rev  := v_rev  + v_qty * v_prod.selling_price;
    v_cogs := v_cogs + v_qty * v_prod.cost_price;
  end loop;

  update transactions set total_revenue = v_rev, total_cogs = v_cogs where id = v_tx;
  return v_tx;
end $$;

revoke all on function create_sale(uuid, jsonb, text, text, text, uuid) from public;
grant execute on function create_sale(uuid, jsonb, text, text, text, uuid) to authenticated;
```

**RPC lain yang WAJIB dibuat dengan pola yang sama** (cek org, role, cabang; kunci baris `FOR UPDATE`; catat `stock_movements`):

| RPC | Siapa | Perilaku |
|---|---|---|
| `void_sale(p_tx_id uuid, p_reason text)` | owner | Status `VOID`, kembalikan stok (`VOID_RETURN`), tolak jika sudah VOID |
| `restock_product(p_product_id uuid, p_qty int, p_unit_cost bigint default null, p_note text default null)` | owner, cashier (cabang sendiri) | Tambah stok, movement `RESTOCK` |
| `adjust_stock(p_product_id uuid, p_new_stock int, p_reason text)` | owner, cashier (cabang sendiri) | Set stok, movement `ADJUSTMENT` dengan selisih bertanda |
| `transfer_stock(p_from_product_id uuid, p_to_product_id uuid, p_qty int, p_recommendation_id uuid default null)` | owner | Kunci kedua produk (urut berdasarkan id agar tidak deadlock), validasi SKU sama dan cabang berbeda dalam org yang sama, kurangi dan tambah stok, buat `stock_transfers`, 2 movement, tandai rekomendasi selesai bila ada |
| `import_sales_batch(p_branch_id uuid, p_rows jsonb, p_deduct_stock boolean default false)` | owner | Buat transaksi historis (`input_method = 'IMPORT'`), `transaction_date` dari file |
| `import_products_batch(p_branch_id uuid, p_rows jsonb)` | owner | Upsert produk berdasarkan (`branch_id`, `sku`) |

Kode error RPC dilempar sebagai `raise exception '<KODE>[:detail]'` dan dipetakan di API (bagian 12.1).

### 7.3 `rls.sql` (Row Level Security)

Aktifkan RLS di **semua** tabel. Pola kebijakan:

```sql
-- Contoh: tabel bercabang (branch-scoped). Terapkan ke: products, transactions,
-- transaction_items, expenses, stock_movements, stock_transfers(from_branch_id), forecasts, import_jobs
alter table products enable row level security;

create policy products_select on products for select using (
  org_id = auth_org_id() and (auth_role() = 'OWNER' or branch_id = auth_branch_id())
);
create policy products_write_owner on products for all
  using (org_id = auth_org_id() and auth_role() = 'OWNER')
  with check (org_id = auth_org_id() and auth_role() = 'OWNER');

-- Contoh: expenses boleh ditulis kasir pada cabangnya
alter table expenses enable row level security;
create policy expenses_select on expenses for select using (
  org_id = auth_org_id() and (auth_role() = 'OWNER' or branch_id = auth_branch_id())
);
create policy expenses_write on expenses for all
  using (org_id = auth_org_id() and (auth_role() = 'OWNER' or branch_id = auth_branch_id()))
  with check (org_id = auth_org_id() and (auth_role() = 'OWNER' or branch_id = auth_branch_id()));
```

Aturan tiap tabel:

| Tabel | SELECT | INSERT/UPDATE/DELETE langsung |
|---|---|---|
| `organizations` | anggota org | tidak ada (hanya server/service role) |
| `profiles` | diri sendiri; owner melihat seluruh org | tidak ada (hanya server) |
| `branches` | owner: semua org; cashier: cabangnya | owner |
| `products` | seperti pola di atas | owner (stok diubah **hanya** lewat RPC) |
| `transactions`, `transaction_items`, `stock_movements`, `stock_transfers` | pola branch-scoped | **tidak ada** (hanya lewat RPC) |
| `expenses` | pola branch-scoped | owner dan cashier cabang sendiri |
| `forecasts`, `ml_recommendations` | owner (`branch_id` null hanya owner) | tidak ada (hanya server dengan service role) |
| `import_jobs` | owner | tidak ada (lewat RPC/server) |

**Wajib diuji:** dengan dua org berbeda, org A tidak bisa membaca atau menulis data org B. Cashier cabang X tidak bisa membaca cabang Y. Simpan hasil uji di `docs/rls-test.md`.

---

## 8. Spesifikasi Impor CSV/Excel (FR-1.6)

**Alur:** unggah file, parse di klien (`papaparse` untuk CSV, `exceljs`/SheetJS untuk Excel), validasi tiap baris dengan Zod, **pratinjau** (tabel dengan baris error ditandai merah), konfirmasi, kirim bertahap (500 baris per request), ringkasan hasil, unduh laporan error (CSV).

| Aturan | Nilai |
|---|---|
| Format | `.csv`, `.xlsx`, `.xls` |
| Batas | 5 MB dan 5.000 baris |
| Header | Tidak peka huruf besar/kecil, spasi dipangkas |
| Penanganan error | Baris valid tetap diimpor, baris invalid dilaporkan beserta nomor baris dan alasan |
| Template | Tersedia di `frontend/public/templates/` dan tombol unduh di halaman impor |

**Template penjualan** (`template_penjualan.csv`):

| Kolom | Wajib | Aturan |
|---|---|---|
| `tanggal` | ya | `YYYY-MM-DD` atau `DD/MM/YYYY` (opsional `HH:mm`), dibaca sebagai WIB, tidak boleh di masa depan |
| `cabang` | ya | Harus cocok dengan nama cabang aktif |
| `sku` | ya | Harus ada di produk cabang |
| `qty` | ya | Bilangan bulat > 0 |
| `harga_satuan` | tidak | Default = harga jual produk |
| `metode_bayar` | tidak | `CASH` atau `QRIS`, default `CASH` |
| `no_struk` | tidak | Baris dengan (`tanggal`, `cabang`, `no_struk`) sama digabung menjadi satu transaksi. Kosong = satu baris satu transaksi |

Opsi **"Kurangi stok produk"**: default **MATI** (impor adalah data historis). Jika dinyalakan dan stok tidak cukup, baris dilaporkan sebagai error.

**Template produk** (`template_produk.csv`): `cabang, sku, nama, kategori, hpp, harga_jual, stok, stok_minimum, alias` (`alias` dipisah `|`). Upsert berdasarkan (`cabang`, `sku`).

**Kriteria penerimaan:** impor 500 baris contoh selesai < 10 detik; baris salah muncul di pratinjau dengan alasan; hasil impor tampil di laporan laba-rugi; riwayat impor tersimpan di `import_jobs`.

---

## 9. Spesifikasi Smart Voice POS

### 9.1 Pipeline
1. **Capture:** Web Speech API (`SpeechRecognition` atau `webkitSpeechRecognition`, `lang='id-ID'`, `interimResults=true`). Dukungan: Chrome dan Edge (utama), Safari (sebagian), Firefox tidak. Wajib HTTPS (Vercel sudah HTTPS). Tampilkan catatan privasi singkat: audio diproses oleh layanan pengenalan suara milik browser.
2. **Parse:** `POST /api/voice-parse` dengan `{ transcript, branch_id }`. Server memuat produk aktif cabang, menjalankan `voiceParser.parse()`.
3. **Konfirmasi:** modal FR-2.3, lalu simpan lewat `POST /api/transactions` dan/atau `POST /api/expenses`.

### 9.2 Aturan parser (rule-based, deterministik)
Folder: `frontend/src/server/parsers/`.

1. **Normalisasi:** huruf kecil, hapus tanda baca kecuali digit dan titik ribuan, rapikan spasi.
2. **Segmentasi:** pecah transkrip pada kata `lalu`, `kemudian`, `terus` menjadi segmen. Satu segmen = satu niat.
3. **Niat per segmen:**
   - `EXPENSE` jika mengandung: `bayar`, `beli`, `belanja`, `pengeluaran`, `keluar`, `ongkos`, `biaya`, `gaji`, `isi` (mis. isi pulsa) **dan** ada nominal uang.
   - Selain itu, jika ada produk yang cocok: `SALE`.
   - Kata `jual`/`terjual`/`pesan`/`pesanan` memperkuat `SALE` dan dibuang dari teks produk.
4. **Angka (`number-id.ts`)**, wajib mendukung:
   - Digit: `2`, `15000`, `15.000`, `15rb`, `15 ribu`, `15k`, `1,5 juta`, `1.5jt`.
   - Kata: `nol`..`sembilan`, `sepuluh`, `sebelas`, `X belas`, `X puluh`, `seratus`, `X ratus`, `seribu`, `X ribu`, `sejuta`, `X juta`, `setengah`, dan gabungannya (contoh: "seratus lima puluh ribu" = 150000, "dua puluh lima ribu" = 25000, "satu setengah juta" = 1500000).
5. **Kuantitas penjualan:** angka atau kata bilangan yang langsung mendahului nama produk. Jika tidak ada, qty = 1. Qty harus bilangan bulat 1..999.
6. **Pencocokan produk:** untuk setiap kandidat frasa, coba berurutan: (a) kecocokan persis dengan `name`/`aliases` (frasa terpanjang lebih dulu), (b) fuzzy: Dice coefficient pada trigram karakter atau rasio Levenshtein. Ambang: skor ≥ 0.6 diterima, di bawahnya masuk `unmatched`. `confidence` = skor kecocokan.
7. **Metode bayar (SALE):** `qris`/`non tunai`/`transfer` → `QRIS_SIM`; `tunai`/`cash` atau tidak disebut → `CASH`.
8. **Pengeluaran:** nominal = angka uang dalam segmen. Kategori dari kata kunci:

| Kata kunci | Kategori |
|---|---|
| listrik, air, wifi, internet, pulsa, token | Utilitas |
| gaji, upah, lembur, honor | Gaji |
| sewa, kontrak | Sewa |
| parkir, bensin, ongkir, transport, ojek | Transportasi |
| iklan, promo, endorse, banner | Pemasaran |
| servis, perbaikan, reparasi, perawatan | Perawatan |
| plastik, cup, sabun, gas, kertas, tisu, kantong | Perlengkapan Operasional |
| lainnya | Lainnya |

   `description` = teks segmen yang sudah dibersihkan dari kata niat dan nominal.
9. **Batasan:** parser tidak menebak jika nominal pengeluaran tidak ada (segmen dilaporkan di `warnings`).

### 9.3 Sampel juri dan hasil yang diharapkan (juga menjadi test case Vitest)

Sampel disimpan di `frontend/src/lib/voice-fixtures.ts`, audio di `frontend/public/audio-samples/` (rekam sendiri oleh tim; jangan memakai suara berhak cipta).

| Sampel | Transkrip | Hasil yang diharapkan |
|---|---|---|
| 1 | "dua es kopi susu satu roti bakar bayar tunai" | SALE: Es Kopi Susu ×2, Roti Bakar ×1, CASH |
| 2 | "tiga nasi goreng satu teh manis pakai qris" | SALE: Nasi Goreng ×3, Teh Manis ×1, QRIS_SIM |
| 3 | "jual lima pisang goreng lalu bayar parkir lima ribu" | SALE: Pisang Goreng ×5 dan EXPENSE: Transportasi, "parkir", 5000 |

Test tambahan wajib: "bayar listrik seratus lima puluh ribu" → Utilitas 150000; "beli plastik cup dua puluh lima ribu" → Perlengkapan Operasional 25000; "bayar gaji harian 200 ribu" → Gaji 200000; "dua kopsu" (alias) → cocok ke produk beralias "kopsu"; "tiga produk xyz" → `unmatched`.

---

## 10. Spesifikasi Analitik ML

Folder: `frontend/src/server/ml/`. Semua fungsi **murni (pure functions)** sehingga mudah diuji. Orkestrasi dan akses database ada di `briefing.ts`.

### 10.1 Deteksi anomali pengeluaran (`anomaly.ts`)

**Metode:** modified Z-score berbasis median dan MAD (robust terhadap outlier).

- **Level 1, per pengeluaran:** saat `POST /api/expenses`, bandingkan `amount` dengan riwayat pengeluaran **cabang dan kategori yang sama dalam 30 hari terakhir** (tanpa pengeluaran itu sendiri).
- **Level 2, total harian cabang:** saat analisis pagi, bandingkan total pengeluaran kemarin per cabang dengan total harian 30 hari sebelumnya.
- Rumus: `M = 0.6745 × (x − median) / MAD`.
  - Jika `MAD = 0`: gunakan `M = (x − median) / (1.253314 × meanAbsDev)`; jika `meanAbsDev = 0` juga, tandai anomali bila `x > 1.5 × median`, dengan `M = 3.5` bila dipicu.
- **Syarat data:** minimal **8** observasi historis. Jika kurang: tidak dinilai (`anomaly_score = 0`, alasan "Data riwayat belum cukup").
- **Ambang:** hanya arah naik (`x > median`). `M ≥ 3.5` → `WARNING`; `M ≥ 5` → `CRITICAL`. Skor disimpan terpotong maksimum 99.99.
- **`anomaly_reason`** (kalimat Indonesia), contoh: "Rp 850.000, sekitar 8,5× dari biasanya (Rp 100.000) untuk kategori Perlengkapan Operasional."

### 10.2 Peringatan omzet turun (P1)
Jika omzet kemarin sebuah cabang **< batas bawah interval** forecast untuk tanggal itu (atau < 60% dari prediksi), buat rekomendasi `REVENUE_DROP` (`WARNING`). Forecast untuk "kemarin" dihitung dari data **sebelum** kemarin.

### 10.3 Forecast dan perencanaan stok

**Forecast (`forecast.ts`):**
- Deret: omzet harian per cabang, dan qty terjual harian per produk per cabang. Hari tanpa penjualan diisi 0, rentang dari tanggal transaksi pertama sampai kemarin (WIB). Transaksi `VOID` dikecualikan.
- **Model utama:** Holt-Winters aditif, periode 7, parameter awal α = 0.3, β = 0.05, γ = 0.2 (parameter tetap, boleh dioptimalkan dengan grid kecil minimal SSE).
- **Fallback bertingkat:** riwayat ≥ 21 hari → Holt-Winters; 7 sampai 20 hari → seasonal naive (rata-rata hari-minggu yang sama); < 7 hari → rata-rata bergerak.
- **Horizon:** 7 hari, mulai **hari ini** sampai hari ini + 6 (WIB). Nilai dipotong minimal 0.
- **Interval:** `prediksi ± 1.28 × σ residual` (kira-kira 80%).
- **Backtest:** latih tanpa 7 hari terakhir, prediksi 7 hari itu, hitung `WAPE = Σ|aktual − prediksi| / Σ aktual`. Simpan dan tampilkan di Panel 3. (P1: tampilkan pembanding terhadap rata-rata bergerak 7 hari.)

**Perencanaan stok (`stock-planner.ts`):** untuk setiap produk aktif per cabang:
```
forecast_7d      = jumlah prediksi qty 7 hari ke depan
avg_daily        = forecast_7d / 7
days_of_cover    = avg_daily > 0 ? stock / avg_daily : Infinity
target_stock     = ceil(forecast_7d) + min_stock_alert
deficit          = max(0, target_stock - stock)
surplus          = max(0, stock - target_stock)
```
- **Stok kritis** (`STOCK_CRITICAL`): `stock ≤ min_stock_alert` **atau** `days_of_cover < 3`. Keparahan: `CRITICAL` jika `days_of_cover < 1.5` atau `stock = 0`, selain itu `WARNING`.
- **Mutasi (`TRANSFER`)**, diproses **sebelum** restock: untuk setiap SKU (cocokkan SKU tidak peka huruf besar/kecil antar cabang), pasangkan cabang `deficit > 0` dengan cabang `surplus > 0`. `qty = min(deficit_A, surplus_B)`, minimal 1. Satu cabang sumber boleh melayani beberapa cabang tujuan sampai surplus habis. Urutkan pasangan berdasarkan `days_of_cover` terendah lebih dulu.
- **Restock (`RESTOCK`)**: sisa `deficit` setelah mutasi. Usulan `qty = sisa deficit`.
- Rekomendasi hanya dibuat jika `qty ≥ 1`.

### 10.4 Status kesehatan dan stok (aturan tetap)
Berlaku untuk gabungan seluruh cabang dan per cabang, dihitung dari data kemarin:

| Status | Aturan |
|---|---|
| **SEHAT** | `net_profit > 0` dan `net_margin ≥ 10%` |
| **WASPADA** | `net_profit > 0` dan `net_margin < 10%` |
| **MERUGI** | `net_profit ≤ 0` |

`net_profit = pendapatan − HPP − beban`, `net_margin = net_profit / pendapatan` (jika pendapatan 0 maka margin 0 dan status mengikuti `net_profit`).
**Keterbatasan MVP (tulis di proposal):** beban bulanan besar (mis. sewa) dicatat pada tanggal bayar dan tidak diamortisasi harian.

### 10.5 Skema `payload` rekomendasi

| `rec_type` | `payload` |
|---|---|
| `ANOMALY_EXPENSE` | `{ "expense_id": uuid \| null, "category": str, "amount": int, "baseline_median": int, "score": number, "level": "EXPENSE" \| "DAILY_TOTAL" }` |
| `REVENUE_DROP` | `{ "date": "YYYY-MM-DD", "actual": int, "predicted": int, "lower": int }` |
| `STOCK_CRITICAL` | `{ "product_id": uuid, "sku": str, "stock": int, "min_stock_alert": int, "days_of_cover": number }` |
| `RESTOCK` | `{ "product_id": uuid, "sku": str, "suggested_qty": int, "forecast_7d": number, "stock": int }` |
| `TRANSFER` | `{ "sku": str, "from_branch_id": uuid, "to_branch_id": uuid, "from_product_id": uuid, "to_product_id": uuid, "suggested_qty": int }` |
| `HEALTH_SUMMARY` | `{ "status": "SEHAT" \| "WASPADA" \| "MERUGI", "net_profit": int, "net_margin_pct": number }` |

### 10.6 Orkestrasi (`POST /api/ml/run-forecast`)
1. Ambil data (RLS-aware untuk validasi akses, lalu query agregat dengan service role bila perlu).
2. Hapus `ml_recommendations` hari ini yang `is_resolved = false` dan `forecasts` hari ini untuk cakupan yang sama.
3. Hitung forecast, perencanaan stok, anomali, dan ringkasan kesehatan; simpan ke `forecasts` dan `ml_recommendations`.
4. Kembalikan ringkasan jumlah rekomendasi dan WAPE. Target waktu < 5 detik untuk data seed.

---

## 11. Data Demo dan Skenario Uji Juri

### 11.1 Seeder (`frontend/src/server/demo/seed.ts`, endpoint `POST /api/demo/seed`)
- Hanya bisa dipanggil oleh **owner org demo** (`organizations.is_demo = true`), dibatasi 1 kali per menit, `export const maxDuration = 30`.
- Menghapus seluruh data bisnis org demo (kecuali `organizations` dan `profiles`) lalu mengisi ulang dalam satu proses. Target < 15 detik (boleh bulk insert TypeScript bertahap atau fungsi SQL).
- Memakai **PRNG deterministik** (mis. mulberry32, seed 2026) supaya hasil konsisten, dengan **tanggal relatif**: D-30 sampai D-1 (WIB).
- Akun demo dibuat sekali lewat skrip `scripts/create-demo-users.ts` (service role): `owner.demo`, `kasir.demo` (terikat ke cabang Malioboro). Kredensial demo sengaja publik dan hanya mengakses org demo.

**Usaha demo:** "Kopi Senja", 3 cabang: **Malioboro**, **Condongcatur**, **Bantul**. Target harian: 3.000.000 / 2.500.000 / 2.000.000.

**Produk (SKU sama di ketiga cabang; harga dalam rupiah):**

| SKU | Nama | Kategori | HPP | Jual | Alias |
|---|---|---|---|---|---|
| KP-001 | Es Kopi Susu | Minuman | 7.000 | 18.000 | kopsu, kopi susu |
| KP-002 | Kopi Hitam | Minuman | 3.000 | 12.000 | |
| KP-003 | Americano | Minuman | 4.000 | 16.000 | |
| KP-004 | Latte | Minuman | 8.000 | 22.000 | |
| KP-005 | Matcha Latte | Minuman | 10.000 | 25.000 | |
| KP-006 | Teh Manis | Minuman | 2.000 | 8.000 | |
| KP-007 | Air Mineral | Minuman | 2.000 | 5.000 | |
| MK-001 | Roti Bakar | Makanan | 6.000 | 15.000 | |
| MK-002 | Kentang Goreng | Makanan | 7.000 | 18.000 | |
| MK-003 | Nasi Goreng | Makanan | 11.000 | 25.000 | |
| MK-004 | Mie Goreng | Makanan | 9.000 | 22.000 | |
| MK-005 | Pisang Goreng | Makanan | 4.000 | 12.000 | |

**Pola transaksi:** 15 sampai 30 transaksi per hari per cabang; musiman mingguan (Senin 0.9, Selasa 0.9, Rabu 0.95, Kamis 1.0, Jumat 1.1, Sabtu 1.3, Minggu 1.25); noise acak ±15%; metode bayar 70% tunai, 30% QRIS_SIM; `input_method = 'DEMO'` (sebagian kecil `VOICE`).
**Pengeluaran harian normal per cabang:** Utilitas ~50.000, Gaji ~200.000, Perlengkapan Operasional ~100.000 (variasi ±20%), Transportasi ~20.000. Setiap kategori minimal 8 observasi dalam 30 hari.

### 11.2 Enam skenario uji juri (`/demo-guide`)
1. **Login satu klik** sebagai Owner Demo, dashboard terisi.
2. **Muat ulang data demo**, data kembali segar dalam < 15 detik.
3. **Kasir Demo → POS:** jual 2 produk lewat keranjang, lalu catat 1 pengeluaran manual.
4. **Smart Voice POS:** tekan sampel suara 1 dan 3, cek modal konfirmasi, simpan. (Opsional: bicara langsung di Chrome.)
5. **Impor CSV:** unggah `template_penjualan.csv` contoh, lihat pratinjau dan hasil.
6. **Dashboard 3 Pertanyaan Pagi + Laporan:** lihat anomali, stok kritis, forecast, terapkan 1 rekomendasi mutasi, unduh PDF laba-rugi.

### 11.3 Hasil yang HARUS muncul setelah seed (uji penerimaan)

| # | Skenario yang disuntikkan seed | Hasil yang diharapkan di dashboard |
|---|---|---|
| S1 | **Condongcatur**, D-1: pengeluaran *Perlengkapan Operasional* Rp 850.000 (normal ~100.000) | Panel 2: anomali `CRITICAL`; `anomaly_reason` menyebut kategori dan kelipatannya. Pada Panel 1 cabang ini berstatus **MERUGI** atau **WASPADA** |
| S2 | **Bantul**: stok *Es Kopi Susu* (KP-001) = 12 sementara permintaan ±35/hari | Panel 2: stok kritis (`days_of_cover < 1.5`, `CRITICAL`) |
| S3 | **Malioboro**: stok *Es Kopi Susu* = 220 (surplus) | Panel 3: rekomendasi `TRANSFER` KP-001 dari Malioboro ke Bantul dengan `suggested_qty ≥ 1`; tombol "Terapkan" berhasil dan stok kedua cabang berubah |
| S4 | **Condongcatur**, D-1: omzet sekitar 55% dari normal | Panel 2: `REVENUE_DROP` (`WARNING`) (P1) |
| S5 | Data 30 hari dengan pola akhir pekan lebih ramai | Panel 3: grafik 7 hari menunjukkan lonjakan Sabtu/Minggu; WAPE tampil (target < 25%) |
| S6 | Semua cabang | Branch Leaderboard terurut berdasarkan laba bersih kemarin |

---

## 12. Spesifikasi API

**Autentikasi:** sesi Supabase lewat cookie (`@supabase/ssr`). Route handler memakai **client server berbasis sesi pengguna** sehingga RLS berlaku. **Service role** hanya dipakai di: register, kelola kasir, seed demo, tulis `forecasts`/`ml_recommendations`, dan hanya di server (tidak pernah dikirim ke browser, tidak berawalan `NEXT_PUBLIC_`).

**Validasi:** semua body dan query divalidasi Zod. Skema dibagi antara klien dan server (`src/lib/validators/`).

### 12.1 Format respons dan kode error

Sukses: `{ "data": <objek|array>, "meta"?: { "page": 1, "page_size": 20, "total": 134 } }`
Gagal: `{ "error": { "code": "<KODE>", "message": "<pesan Indonesia>", "details"?: <object> } }`

| Kode | HTTP | Keterangan |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Input tidak valid (`details` berisi error per field) |
| `UNAUTHENTICATED` | 401 | Belum login |
| `FORBIDDEN` | 403 | Role/cabang tidak berhak |
| `NOT_FOUND` | 404 | Data tidak ada |
| `CONFLICT` | 409 | Duplikat (SKU, nama cabang) |
| `INSUFFICIENT_STOCK` | 409 | Stok tidak cukup (sertakan nama produk) |
| `BRANCH_LIMIT_REACHED` | 409 | Cabang melebihi 5 |
| `RATE_LIMITED` | 429 | Terlalu sering memanggil |
| `INTERNAL_ERROR` | 500 | Kesalahan server (jangan bocorkan detail internal) |

RPC melempar `raise exception 'KODE:detail'`. Layer API mengurai awalan kode tersebut menjadi kode di atas.

### 12.2 Daftar endpoint

| Method | Endpoint | Role | Fungsi |
|---|---|---|---|
| POST | `/api/auth/register` | publik | Buat user + org + profile owner (service role) |
| GET/POST | `/api/branches` | owner | Daftar dan buat cabang |
| PATCH/DELETE | `/api/branches/[id]` | owner | Ubah dan nonaktifkan |
| GET/POST | `/api/products` | owner (GET: semua role) | Query: `branch_id`, `q`, `category`, `include_inactive` |
| PATCH/DELETE | `/api/products/[id]` | owner | Ubah dan nonaktifkan |
| POST | `/api/products/[id]/restock` | owner, cashier | Restock (RPC) |
| POST | `/api/products/[id]/adjust` | owner, cashier | Penyesuaian stok (RPC) |
| POST | `/api/stock/transfers` | owner | Mutasi antar cabang (RPC) |
| GET | `/api/stock/movements` | semua | Riwayat pergerakan stok, filter `product_id` |
| POST | `/api/voice-parse` | owner, cashier | Parse transkrip menjadi draf |
| POST | `/api/transactions` | owner, cashier | Buat transaksi (RPC `create_sale`) |
| GET | `/api/transactions` | semua | Query: `branch_id`, `from`, `to`, `status`, `page` |
| POST | `/api/transactions/[id]/void` | owner | Void (RPC) |
| GET/POST | `/api/expenses` | semua | POST menghitung skor anomali |
| PATCH/DELETE | `/api/expenses/[id]` | owner, cashier (cabang sendiri) | Ubah dan hapus (skor dihitung ulang) |
| POST | `/api/import/sales` | owner | Batch penjualan (maks 500 baris/request) |
| POST | `/api/import/products` | owner | Batch produk |
| GET | `/api/reports/profit-loss` | owner | Query: `branch_id` (opsional), `from`, `to` |
| GET | `/api/morning-briefing` | owner | Query: `branch_id` (opsional) |
| POST | `/api/ml/run-forecast` | owner | Hitung ulang analisis |
| POST | `/api/recommendations/[id]/resolve` | owner | Tandai selesai |
| POST | `/api/staff` | owner | Buat akun kasir (service role) |
| POST | `/api/demo/seed` | owner org demo | Reset dan muat data demo |

### 12.3 Kontrak utama

**`POST /api/transactions`**
```json
{
  "branch_id": "uuid",
  "client_tx_id": "uuid",
  "payment_method": "CASH",
  "input_method": "MANUAL",
  "voice_transcript": null,
  "items": [ { "product_id": "uuid", "quantity": 2 } ]
}
```
Respons `201`: `{ "data": { "id": "uuid", "business_date": "2026-11-03", "total_revenue": 36000, "total_cogs": 14000, "gross_profit": 22000, "low_stock": [ { "product_id": "uuid", "name": "Es Kopi Susu", "stock": 8 } ] } }`

**`POST /api/voice-parse`**
```json
{ "transcript": "jual lima pisang goreng lalu bayar parkir lima ribu", "branch_id": "uuid" }
```
Respons `200`:
```json
{
  "data": {
    "transcript": "jual lima pisang goreng lalu bayar parkir lima ribu",
    "segments": [
      { "intent": "SALE", "payment_method": "CASH",
        "items": [ { "raw_text": "pisang goreng", "product_id": "uuid", "product_name": "Pisang Goreng",
                     "quantity": 5, "unit_price": 12000, "confidence": 1.0 } ],
        "unmatched": [] },
      { "intent": "EXPENSE",
        "expense": { "category": "Transportasi", "description": "parkir", "amount": 5000, "confidence": 0.9 } }
    ],
    "warnings": []
  }
}
```

**`GET /api/morning-briefing`**
```json
{
  "data": {
    "report_date": "2026-11-03",
    "scope": "ALL",
    "generated_at": "2026-11-04T01:12:00Z",
    "q1_profit": {
      "status": "WASPADA",
      "revenue": 0, "cogs": 0, "expenses": 0, "net_profit": 0, "net_margin_pct": 0,
      "vs_prev_day_pct": 0,
      "leaderboard": [
        { "rank": 1, "branch_id": "uuid", "branch_name": "Malioboro", "revenue": 0,
          "net_profit": 0, "target_achievement_pct": 0, "status": "SEHAT" }
      ]
    },
    "q2_attention": { "items": [ /* baris ml_recommendations: ANOMALY_EXPENSE, REVENUE_DROP, STOCK_CRITICAL */ ] },
    "q3_actions": {
      "forecast": {
        "model": "holt_winters_7",
        "wape_pct": 12.4,
        "next_7_days": [ { "date": "2026-11-04", "predicted_revenue": 0, "lower": 0, "upper": 0 } ]
      },
      "todo": [ /* baris ml_recommendations: TRANSFER, RESTOCK */ ]
    }
  }
}
```
(`report_date` adalah "kemarin" WIB; nilai uang integer rupiah.)

---

## 13. UX, Halaman, dan Komponen

### 13.1 Peta halaman

| Rute | Halaman | Role |
|---|---|---|
| `/` | Landing | publik |
| `/login`, `/register` | Auth + tombol demo | publik |
| `/dashboard` | 3 Pertanyaan Pagi | owner |
| `/pos` | Kasir (grid, keranjang, mic, sampel suara) | owner, cashier |
| `/transactions` | Riwayat transaksi | semua |
| `/expenses` | Pengeluaran | semua |
| `/products` | Produk dan stok (restock, penyesuaian) | semua (edit: owner) |
| `/stock` | Mutasi antar cabang dan riwayat pergerakan | owner (lihat: semua) |
| `/reports` | Laba-rugi dan ekspor PDF | owner |
| `/import` | Impor CSV/Excel | owner |
| `/branches` | Kelola cabang | owner |
| `/staff` | Kelola kasir | owner |
| `/demo-guide` | Panduan uji juri | semua |

### 13.2 Prinsip UX
- **Mobile-first untuk `/pos`** (target sentuh minimal 44 px, tombol mic besar). Dashboard owner dirancang untuk dibuka di HP pada pagi hari: tiga kartu bertumpuk vertikal.
- **Dashboard "3 Pertanyaan Pagi":** tiga kartu, masing-masing berisi pertanyaan sebagai judul, chip status (warna + ikon + teks, jangan hanya warna), maksimal 3 poin utama, dan tombol aksi. Detail dibuka lewat "Lihat semua".
- Format: rupiah `Rp 1.250.000`; tanggal `3 Nov 2026`, zona WIB.
- Setiap aksi destruktif (void, nonaktifkan, reset demo) memakai dialog konfirmasi.
- Kontras warna cukup, label form eksplisit, fokus keyboard terlihat.

### 13.3 Komponen kunci
`VoiceRecorder`, `VoiceConfirmModal`, `JudgeAudioTester`, `ProductGrid`, `CartPanel`, `QrisSimDialog`, `MorningCard`, `BranchLeaderboard`, `ForecastChart` (Recharts: garis + area interval), `AnomalyBadge`, `RecommendationItem` (dengan tombol Terapkan/Selesai), `ImportWizard`, `PnlTable`, `StockTransferDialog`, `DemoBanner`, `EmptyState`, `ErrorState`.

---

## 14. Kebutuhan Non-Fungsional

| Aspek | Kebutuhan |
|---|---|
| Responsif | 360 px, 768 px, 1280 px |
| Kompatibilitas | Diuji di Chrome, Firefox, Safari, Edge. Voice live: Chrome/Edge; lainnya memakai fallback ketik + sampel |
| Performa | Simpan transaksi < 1,5 dtk; briefing (cache) < 2 dtk; `run-forecast` < 5 dtk pada data seed; halaman awal < 3 dtk pada koneksi normal |
| Keamanan | RLS di semua tabel; service role hanya server; Zod di semua endpoint; tidak ada secret di repo; rate limit sederhana pada `/api/voice-parse` (30/menit/user) dan `/api/demo/seed`; batas ukuran body dan file impor |
| Privasi | Data hanya terlihat anggota org; catatan privasi untuk pengenalan suara browser |
| Integritas data | Stok hanya via RPC; idempotensi transaksi lewat `client_tx_id`; `CHECK` constraint di DB |
| Observabilitas | Log error server terstruktur (tanpa data sensitif); halaman error ramah |
| Ketersediaan | Live publik selama kompetisi (lihat risiko Supabase pause di bagian 19) |

### Variabel lingkungan (`.env.example`, tanpa nilai)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=            # server only, jangan pakai awalan NEXT_PUBLIC_
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_DEMO_OWNER_EMAIL=         # akun demo sengaja publik
NEXT_PUBLIC_DEMO_OWNER_PASSWORD=
NEXT_PUBLIC_DEMO_CASHIER_EMAIL=
NEXT_PUBLIC_DEMO_CASHIER_PASSWORD=
DEMO_SEED_ENABLED=true
```

---

## 15. Struktur Repository GitHub

```
bizpulse/
├── frontend/                          # Aplikasi Next.js (UI + API Route Handlers + ML + parser)
│   ├── public/
│   │   ├── audio-samples/             # 3 file audio sampel juri
│   │   └── templates/                 # template_penjualan.csv, template_produk.csv
│   ├── scripts/
│   │   └── create-demo-users.ts       # buat akun demo (service role)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/login, register
│   │   │   ├── (app)/dashboard, pos, transactions, expenses, products,
│   │   │   │         stock, reports, import, branches, staff, demo-guide
│   │   │   └── api/                   # semua Route Handlers (bagian 12)
│   │   ├── components/                # VoiceRecorder, MorningCard, Charts, dll.
│   │   ├── lib/
│   │   │   ├── supabase/              # client.ts, server.ts, admin.ts
│   │   │   ├── validators/            # skema Zod bersama
│   │   │   ├── voice-fixtures.ts      # transkrip sampel juri
│   │   │   ├── api-response.ts        # helper format sukses/error
│   │   │   └── format.ts, date.ts     # rupiah dan WIB
│   │   └── server/                    # kode server-only
│   │       ├── ml/                    # anomaly.ts, forecast.ts, stock-planner.ts, stats.ts, briefing.ts
│   │       ├── parsers/               # number-id.ts, voice-parser.ts, fuzzy.ts, expense-categories.ts, csv-import.ts
│   │       └── demo/                  # seed.ts
│   ├── tests/                         # Vitest (bagian 16)
│   ├── .env.example
│   └── package.json
├── database/
│   ├── schema.sql
│   ├── functions.sql
│   └── rls.sql
├── docs/
│   ├── prd.md                         # salinan dokumen ini
│   ├── assumptions.md                 # asumsi yang diambil agent
│   ├── api_documentation.md
│   ├── rls-test.md                    # hasil uji isolasi data
│   ├── evaluation.md                  # uji waktu input, WAPE, dll.
│   └── screenshots/
├── README.md
├── .gitignore                         # node_modules, .env*, .next, build
└── LICENSE                            # MIT
```

> **Catatan:** backend berada di Next.js Route Handlers dan Supabase (database, auth, RPC), bukan folder `backend/` terpisah. Jelaskan ini di README agar juri memahami arsitekturnya.

**README minimal:** deskripsi masalah dan solusi, fitur dan target pengguna, tech stack dan arsitektur, cara instalasi dan menjalankan, environment variables, cara menyiapkan Supabase (urutan SQL), cara membuat akun demo, link website live, screenshot, dan dokumentasi.
**Git:** commit kecil dan bermakna (`feat:`, `fix:`, `docs:`, `test:`), branch fitur, jangan satu commit besar di akhir. Jangan pernah commit `.env`, password, token, atau API key.

---

## 16. Rencana Pengujian

**Unit test (Vitest), wajib lulus:**

| Area | Kasus uji |
|---|---|
| `number-id.ts` | Semua contoh angka di 9.2 (kata, digit, singkatan `rb`/`k`/`jt`, "setengah") |
| `voice-parser.ts` | 3 sampel juri dan test tambahan di 9.3, plus `unmatched`, fuzzy match, dan segmentasi "lalu" |
| `anomaly.ts` | Deret normal + 1 lonjakan terdeteksi; data < 8 tidak dinilai; kasus `MAD = 0`; nilai turun tidak ditandai |
| `forecast.ts` | Deret sintetis musiman: WAPE < 20%; fallback pada data < 21 dan < 7 hari; hasil tidak negatif |
| `stock-planner.ts` | Skenario S2/S3: menghasilkan `TRANSFER` sebelum `RESTOCK`; qty = min(deficit, surplus); tanpa rekomendasi bila qty < 1 |
| Kalkulasi laporan | Laba bersih = pendapatan − HPP − beban; transaksi VOID dikecualikan |
| `date.ts` | "Kemarin" dan `business_date` benar di sekitar tengah malam WIB |

**Uji integrasi/manual:**
- RPC `create_sale`: stok tidak cukup ditolak; kirim ulang `client_tx_id` yang sama tidak menggandakan transaksi; dua transaksi paralel tidak membuat stok negatif.
- RLS: uji dua org dan dua cabang (`docs/rls-test.md`).
- Skenario penerimaan S1 sampai S6 (bagian 11.3) pada hasil seed.
- Lintas browser dan lintas ukuran layar.

**E2E (P2, Playwright):** login demo → POS simpan → dashboard menampilkan angka.

---

## 17. Urutan Pembangunan (untuk AI Agent) dan Jadwal

Kerjakan berurutan. Jangan lanjut ke tahap berikutnya sebelum kriteria tahap saat ini terpenuhi.

| Tahap | Waktu | Isi | Selesai bila |
|---|---|---|---|
| **A. Fondasi** | 19 sampai 22 Okt | Setup repo, Next.js + Tailwind + shadcn, Supabase, `schema.sql`, `functions.sql`, `rls.sql`, helper `api-response`, `date`, `format`, deploy awal ke Vercel | Halaman kosong live di URL publik; skema berhasil dijalankan; uji RLS awal lulus |
| **B. Auth dan master data** | 22 sampai 25 Okt | FR-1.1, 1.2, 1.3, tombol demo login, layout per role | Owner dan kasir bisa login dan melihat menu sesuai role; CRUD cabang/produk berfungsi |
| **C. Transaksi inti** | 25 sampai 28 Okt | FR-2.1, 2.5, 3.1, 3.2 (tanpa skor anomali dulu), FR-1.8 | Transaksi tersimpan, stok terpotong atomik, pengeluaran tercatat |
| **D. Parser, suara, impor** | 28 Okt sampai 31 Okt | `number-id`, `voice-parser` + test, FR-2.2 sampai 2.4, FR-1.6 | Semua unit test parser lulus; 3 sampel juri berfungsi; impor CSV berfungsi |
| **E. Ledger dan ML** | 31 Okt sampai 4 Nov | FR-3.3, 3.4, `anomaly`, `forecast`, `stock-planner`, `briefing`, FR-1.7 (seeder), FR-4.1 sampai 4.4 | Skenario S1 sampai S3, S5, S6 lulus pada data seed |
| **F. Penyempurnaan** | 4 sampai 8 Nov | P1 (FR-1.4, 1.5, 2.6, 3.5, 4.5, S4), FR-5.x, responsif, lintas browser, bug fix, `/demo-guide` | Semua P0 lulus; tidak ada error console pada alur utama |
| **G. Pengumpulan** | 8 sampai 10 Nov | **Code freeze 8 Nov.** README, screenshot, dokumen `docs/`, proposal PDF, rekam video, Surat Keaslian Karya, cek tautan publik | Semua berkas siap sebelum **10 Nov 23.59 WIB**; sebaiknya kirim 9 Nov |

**Jika waktu mepet, pangkas dengan urutan ini (dari yang pertama dikorbankan):** P2, lalu P1 FR-4.5, FR-3.5, FR-1.4, lalu S4/REVENUE_DROP, lalu FR-2.6 (void). **Jangan pernah dipangkas:** autentikasi, CRUD, POS, RPC stok atomik, voice dengan fallback, auto-ledger, anomali + forecast, seed demo, deployment live.

---

## 18. Pemetaan ke Kriteria Penilaian GTNIC

| Kriteria (bobot) | Bukti dari BizPulse |
|---|---|
| **Fungsionalitas dan kualitas implementasi (25%)** | Alur penuh: catat (manual/suara/impor), stok atomik, ledger, dashboard, tindakan. Validasi, feedback, dan state error di setiap halaman. Demo Mode. |
| **Relevansi masalah dan inovasi solusi (20%)** | Masalah nyata UMKM multi-cabang (pencatatan manual, tidak tahu untung/rugi). Inovasi: Smart Voice POS, 3 Pertanyaan Pagi, rekomendasi yang bisa langsung dieksekusi. |
| **Kualitas teknis dan arsitektur (20%)** | RLS multi-tenant, RPC atomik dengan idempotensi, ML murni dan teruji, struktur repo rapi, commit bertahap. |
| **UX dan interface design (15%)** | Dashboard tiga kartu, mobile-first untuk kasir, bahasa sederhana, fallback input suara. |
| **Dampak bisnis dan skalabilitas (10%)** | Laba-rugi siap lampiran pembiayaan, multi-cabang, rencana pengembangan (bagian 20). |
| **Dokumentasi, demo, dan presentasi (10%)** | README lengkap, `docs/`, proposal sesuai format, video mengikuti skenario 11.2. |

---

## 19. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Web Speech API tidak ada di Firefox/Safari tertentu atau salah mengenali ucapan | Voice gagal saat juri uji | Fallback kotak teks, sampel juri berbasis transkrip, modal konfirmasi yang bisa mengoreksi |
| **Proyek Supabase gratis di-pause karena tidak aktif** | Website live error saat penjurian | Buka aplikasi dan jalankan satu query beberapa hari sekali (atau jadwalkan ping); cek 1 hari sebelum deadline dan sebelum Grand Final |
| Seeder timeout di Vercel | Demo Mode gagal | Bulk insert bertahap atau fungsi SQL, `maxDuration = 30`, uji di produksi |
| Salah konfigurasi RLS | Data bocor antar org | Uji dua org dan dua cabang, dokumentasikan di `docs/rls-test.md` |
| Kebocoran kredensial di GitHub | Diskualifikasi atau akun disalahgunakan | `.gitignore`, `.env.example`, cek sebelum commit; service role hanya di server |
| Klaim ML berlebihan | Penilaian turun | Jelaskan jujur: statistik robust dan Holt-Winters, parser berbasis aturan |
| Data demo sintetis | Dikira data nyata | Banner "Mode Demo" dan catatan di proposal |
| Waktu 3 minggu | Fitur tidak matang | Pegang prioritas P0/P1/P2 dan urutan pemangkasan di bagian 17 |
| Pencatatan ganda biaya stok | Laba-rugi salah | Aturan D7 (stok lewat Restock, bukan expense) |

---

## 20. Batasan Sistem dan Rencana Pengembangan

**Batasan (tulis jujur di proposal):** QRIS hanya simulasi; pengenalan suara bergantung browser dan kualitas audio; ML memakai model statistik ringan dan butuh minimal beberapa minggu data; beban bulanan tidak diamortisasi harian; data demo adalah data sintetis; tidak ada mode offline; mutasi stok langsung selesai tanpa status pengiriman.

**Rencana pengembangan:** integrasi QRIS/payment gateway nyata, pengenalan suara server-side (mis. model speech-to-text) untuk semua browser, Isolation Forest dan model permintaan per produk berbasis fitur (cuaca, hari libur), mode offline (PWA), notifikasi briefing pagi lewat WhatsApp/email, amortisasi biaya bulanan, integrasi akuntansi dan e-Faktur, serta ekspor laporan format standar lembaga pembiayaan.

---

## 21. Checklist Standar Kualitas dan Pengumpulan (Deadline: 10 Nov 2026, 23.59 WIB)

**Kualitas minimum**
- [ ] Responsif di desktop, tablet, smartphone; diuji di Chrome, Firefox, Safari, Edge
- [ ] Tidak ada error pada alur utama; ada feedback, validasi, dan pesan status
- [ ] Validasi input, kredensial terlindungi, **tidak ada `.env` di GitHub**
- [ ] Website live (Vercel) dan repository GitHub **publik** hingga kompetisi berakhir
- [ ] Seluruh skenario di bagian 11.3 lulus pada data seed

**Berkas pengumpulan**
- [ ] Tautan website live (publik)
- [ ] Tautan repository GitHub (publik)
- [ ] Proposal PDF bernama `GTNIC2026_WebDev_NamaTim.pdf`
- [ ] Tautan video demo 3 sampai 5 menit (YouTube/Google Drive, akses publik, suara jelas)
- [ ] Surat Pernyataan Keaslian Karya
- [ ] Nama tim tercantum di Google Form pengumpulan

**Format proposal PDF (UX Case Study):** maksimal 15 halaman, A4, Times New Roman 12 pt, spasi 1,5, margin kiri 4 cm dan margin lain 3 cm, logo GTNIC 2026 di cover, Bahasa Indonesia atau Inggris yang baik dan benar.

| Bagian proposal | Sumber di PRD |
|---|---|
| Judul karya dan nama tim | Bagian judul |
| Latar belakang masalah bisnis/operasional UMKM | Bagian 2 |
| Tujuan, manfaat, solusi teknologi, target pengguna | Bagian 1, 2.1, 4 |
| Arsitektur sistem, diagram database, teknologi | Bagian 3, 7, 15 |
| Fitur utama dan keunikan dibanding sistem serupa | Bagian 2.2, 6 |
| Batasan sistem, screenshot implementasi, rencana pengembangan | Bagian 20 + screenshot |
| Dokumentasi library dan aset open-source beserta lisensi | Daftar dependensi |

**Skrip video demo (3 sampai 5 menit):** (1) Perkenalan tim, 20 dtk. (2) Masalah dan solusi, 40 dtk. (3) Demo mengikuti skenario 11.2: login demo, POS, suara, impor, dashboard, terapkan mutasi, unduh PDF, 2 sampai 3 menit. (4) Penutup dan dampak, 20 dtk. Uji seluruh alur demo sebelum merekam.

---

## 22. Riwayat Perubahan dari PRD Awal

| # | Perubahan | Alasan |
|---|---|---|
| 1 | Menambah tabel `organizations`, `profiles`, `stock_movements`, `stock_transfers`, `forecasts`, `import_jobs`, dan kolom `org_id` | Skema awal tidak punya multi-tenant, profil role, riwayat stok, dan tempat menyimpan forecast |
| 2 | Memakai `BIGINT` rupiah (bukan `NUMERIC(12,2)`) | Rupiah tidak berdesimal, menghindari error pembulatan |
| 3 | Stok diubah lewat RPC atomik dan idempotensi `client_tx_id` | Mencegah stok negatif dan transaksi ganda |
| 4 | Menghapus kategori pengeluaran "bahan baku" dan menambah fitur Restock | Menghindari double counting dengan HPP |
| 5 | Menjelaskan mekanisme Voice POS: Web Speech API, fallback ketik, dan sampel juri berbasis transkrip | Web Speech API tidak mendukung Firefox dan tidak bisa membaca file audio |
| 6 | Seed demo memakai tanggal relatif dan skenario yang disuntikkan secara eksplisit | `seed_umkm_demo.sql` bertanggal tetap membuat "kemarin" kosong |
| 7 | Memilih Z-Score robust (MAD) dan Holt-Winters dengan parameter dan ambang tetap; Isolation Forest dikeluarkan | Memberi spesifikasi yang tidak ambigu dan cukup untuk 3 minggu |
| 8 | Menambah fitur yang sebelumnya hilang: mutasi stok yang bisa dieksekusi, kelola kasir, riwayat transaksi, void, penyesuaian stok | Rekomendasi mutasi tidak ada artinya tanpa fitur eksekusi |
| 9 | Menyederhanakan struktur repo: ML dan parser dipindah ke `frontend/src/server/` | Folder `backend/` terpisah tidak bisa di-import oleh Next.js |
| 10 | Menambah kriteria penerimaan, kontrak API, kode error, RLS, rencana uji, prioritas P0/P1/P2, dan urutan pembangunan | Agar AI agent tidak perlu menebak |
| 11 | Memperbaiki typo ("berdurised") dan mengganti klaim "3x lebih cepat" menjadi klaim yang harus diukur | Klaim tanpa bukti melemahkan proposal |
