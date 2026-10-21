# Sistem Desain BizPulse (Redesign Visual SaaS Enterprise)

Dokumen ini adalah hasil analisis visual mendalam terhadap artefak desain referensi pada folder `redesign/` (`redesign/home/` untuk *landing page* dan `redesign/dashboard/` untuk area aplikasi internal). Dokumen ini menjadi pedoman baku (*design system & tokens*) untuk peremajaan visual BizPulse tanpa mengubah struktur informasi, alur bisnis, maupun keputusan arsitektur PRD.

---

## 1. Design Tokens

Berdasarkan pengamatan pada file referensi, desain terbagi menjadi dua ranah utama:
- **Area Landing Page (`redesign/home/`):** Mengadopsi estetika *Dark Mode* berenergi tinggi dengan latar belakang *obsidian/charcoal*, pola *dot matrix/halftone*, kontainer pahlawan (*hero*) bergradasi oranye menyala (*vivid flame/amber*), dan tipografi putih kontras tinggi.
- **Area Aplikasi / Dashboard (`redesign/dashboard/`):** Mengadopsi estetika *Light Mode* ala SaaS Enterprise modern berdensitas data tinggi, dengan kanvas putih bersih, garis tepi (*border*) 1px ultra-crisp, aksen biru interaktif untuk aksi primer, aksen oranye untuk penanda identitas merek, dan tipografi sans-serif netral.

### 1.1. Palet Warna (Color Palette)

#### A. Mode Terang (Aplikasi, Dashboard, Tabel, Form, Sidebar)
| Peran Token | Nilai Hex | Variabel CSS / Tailwind Class | Penggunaan & Konteks |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `#F9FAFB` | `bg-slate-50` / `bg-zinc-50` | Latar belakang keseluruhan aplikasi di balik kartu |
| **Surface / Card Background** | `#FFFFFF` | `bg-white` | Permukaan kartu metrik, sidebar, navbar, tabel, modal dialog |
| **Card Sub-Surface / Muted** | `#F4F4F5` | `bg-zinc-100` / `bg-slate-100` | Latar belakang input pencarian, tab kapsul pasif, baris hover tabel |
| **Border Utama (Crisp)** | `#E5E7EB` | `border-slate-200` / `border-zinc-200` | Garis tepi 1px di semua kartu, sidebar divider, tabel border |
| **Border Sekunder (Subtle)** | `#F3F4F6` | `border-slate-100` / `border-zinc-100` | Garis pemisah internal antar sub-elemen dalam kartu |
| **Border Input / Fokus** | `#D1D5DB` | `border-slate-300` (fokus: `#0051C7`) | Batas luar input teks, dropdown, tombol sekunder |
| **Teks Utama (Headings/Data)** | `#111827` | `text-slate-900` / `text-zinc-900` | Judul halaman, angka KPI, teks tabel utama, nama entitas |
| **Teks Sekunder (Body/Label)** | `#4B5563` | `text-slate-600` / `text-zinc-600` | Deskripsi penjelasan, label formulir, teks paragraf pendukung |
| **Teks Muted (Caption/Hint)** | `#9CA3AF` | `text-slate-400` / `text-zinc-400` | Placeholder, tanggal sekunder, shortcut keyboard `Ctrl K` |
| **Aksen Aksi Utama (Enterprise Blue)**| `#0051C7` | `bg-blue-600` / `hover:bg-blue-700` | Tombol CTA primer ("Tambah Produk", "Buat Transaksi", "Simpan") |
| **Aksen Identitas Merek (Brand Orange)**| `#F6821F` | `text-orange-500` / `bg-orange-500` | Logo BizPulse, badge status khusus, highlight rekomendasi cerdas |
| **Status Sukses (Laba/Selesai/Aktif)** | Bg: `#DCFCE7`<br>Border: `#BBF7D0`<br>Teks: `#166534` | `bg-emerald-100` `text-emerald-800` `border-emerald-200` | Badge transaksi sukses, margin laba positif, status cabang aktif |
| **Status Peringatan (Stok Tipis/Warning)**| Bg: `#FEF3C7`<br>Border: `#FDE68A`<br>Teks: `#92400E` | `bg-amber-100` `text-amber-800` `border-amber-200` | Peringatan stok mendekati batas minimum, anomali tingkat menengah |
| **Status Bahaya (Rugi/Void/Kritis)** | Bg: `#FEE2E2`<br>Border: `#FECACA`<br>Teks: `#991B1B` | `bg-rose-100` `text-rose-800` `border-rose-200` | Anomali lonjakan biaya kritis, stok habis (0), transaksi VOID |
| **Status Netral / Metadata Chip** | Bg: `#F3F4F6`<br>Border: `#E5E7EB`<br>Teks: `#374151` | `bg-slate-100` `text-slate-700` `border-slate-200` | Chip kategori produk, SKU, metode pembayaran (Tunai/QRIS) |

#### B. Mode Gelap (Khusus Landing Page `redesign/home/`)
| Peran Token | Nilai Hex | Variabel CSS / Tailwind Class | Penggunaan & Konteks |
| :--- | :--- | :--- | :--- |
| **Dark Canvas Background** | `#0A0A0C` | `bg-[#0a0a0c]` | Latar belakang penuh *landing page* |
| **Dark Card Surface** | `#121316` | `bg-[#121316]` | Kartu bento, kartu testimonial, kartu fitur sekunder |
| **Dark Card Border** | `#26282D` | `border-[#26282d]` | Batas tepi kartu bento dan pembatas footer |
| **Hero Gradient Background** | `linear-gradient(135deg, #F6821F 0%, #FA6400 45%, #E65A00 100%)` | Gradien oranye menyala | Kotak hero utama dan banner CTA penutup di footer |
| **Hero Dotted Texture** | `radial-gradient(#ffffff 1px, transparent 1px)` 16px 16px | Pola halftone dot-grid | Tekstur titik halus di dalam kontainer pahlawan oranye |
| **Teks Putih Kontras Tinggi** | `#FFFFFF` | `text-white` | Headline hero, teks tombol hero, judul kartu gelap |
| **Teks Sekunder Gelap** | `#9CA3AF` | `text-zinc-400` | Subtitle hero, deskripsi fitur, teks footer |
| **Tombol Putih Utama (Hero CTA)** | Bg: `#FFFFFF`<br>Teks: `#111827`<br>Hover: `#F3F4F6` | `bg-white text-slate-900 rounded-full` | Tombol "Mulai Demo 1-Klik", "Buka Dashboard" |

---

### 1.2. Tipografi (Typography)

Desain referensi memanfaatkan hierarki tipografi sans-serif modern bertipe neo-grotesque dengan bobot tegas (*clean, confident, and highly readable*):

| Kategori Elemen | Ukuran Font (px / rem) | Bobot (Weight) | Tinggi Baris (Line Height) | Letter Spacing (Tracking) | Kasus Penggunaan di BizPulse |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Title (Display)** | 48px – 56px (3.5rem) | 800 (Extra Bold) | 1.08 – 1.12 | `-0.03em` (Tight) | Headline pahlawan di *landing page* |
| **Section Heading (H1)** | 28px – 32px (2.0rem) | 700 (Bold) | 1.20 – 1.25 | `-0.025em` | Judul bagian besar ("3 Pertanyaan Pagi", "Klasemen Cabang") |
| **Page Title (H2)** | 22px – 24px (1.5rem) | 700 (Bold) | 1.30 | `-0.02em` | Header halaman aplikasi ("Dashboard", "Kasir POS", "Produk") |
| **Card Header (H3)** | 16px – 18px (1.125rem) | 600 (Semi Bold) | 1.35 | `-0.01em` | Judul kartu bento, header kartu anomali, judul produk |
| **Big Metric / KPI Value** | 28px – 34px (2.0rem) | 700 (Bold) | 1.15 | `-0.02em` (Tabular) | Angka Rupiah omzet, laba bersih, jumlah transaksi, Z-score |
| **Body Regular** | 14px (0.875rem) | 400 (Regular) | 1.50 | `normal` | Deskripsi penjelasan, isi paragraf, catatan rekomendasi |
| **Body Medium / Label** | 13px – 14px (0.875rem) | 500 (Medium) | 1.45 | `normal` | Label form input, navigasi sidebar, teks tombol, sel tabel |
| **Caption / Small** | 12px (0.75rem) | 500 (Medium) | 1.40 | `+0.01em` | Label KPI di atas angka, waktu WIB, sub-info kasir |
| **Micro / Keyboard / Badge**| 10px – 11px (0.6875rem)| 600 (Semi Bold) | 1.20 | `+0.02em` (Uppercase) | Badge role (OWNER/KASIR), shortcut `Ctrl K`, chip status |

---

### 1.3. Spasi, Radius Sudut, Bentuk Border, dan Bayangan

#### Spasi (Spacing Scale)
- **Base Grid:** Kelipatan 4px (Tailwind: `1` = 4px, `2` = 8px, `3` = 12px, `4` = 16px, `6` = 24px, `8` = 32px).
- **Padding Halaman:** `px-6 py-6` s.d. `px-8 py-8` (24px s.d. 32px) pada desktop; `px-4 py-4` (16px) pada perangkat bergerak.
- **Padding Kartu:** `p-5` (20px) untuk kartu metrik ringkas; `p-6` (24px) untuk kartu bento dan tabel kontainer.
- **Celah Grid (*Gap*):** `gap-4` (16px) untuk toolbar filter dan deretan metrik; `gap-6` (24px) untuk pemisah section utama.

#### Radius Sudut (Border Radius)
- **Hero & Banner Kontainer Besar:** `rounded-3xl` (24px) — digunakan pada kotak oranye utama landing page dan banner ajakan bertindak di footer.
- **Kartu Bento & Kontainer Halaman:** `rounded-xl` (12px) s.d. `rounded-2xl` (16px) — kartu anomali, kartu produk, wadah tabel.
- **Tombol & Input Form:** `rounded-lg` (8px) — tombol aksi, field teks, dropdown filter, search box.
- **Badge, Chip, Tab Kapsul & Tombol Hero:** `rounded-full` (9999px) — lencana status, tab navigasi aktif, tombol pill hero CTA.

#### Bentuk Border (Borders)
- **Border Standar:** `1px solid #E5E7EB` (Slate-200) untuk Light Mode; `1px solid #26282D` untuk Dark Mode.
- **Pemisah Antar-Kolom KPI:** Border vertikal solid 1px (`border-r border-slate-200`) yang menyatukan 4 metrik dalam 1 panel kontainer tunggal yang utuh (*segmented KPI strip*).

#### Bayangan (Shadows)
- Estetika referensi sangat *flat* dan mengutamakan ketajaman garis tepi 1px:
  - **Kartu Data & Tabel:** Tanpa bayangan (`shadow-none`) atau bayangan mikro (`shadow-[0_1px_2px_0_rgba(0,0,0,0.04)]`).
  - **Modal Dialog & Dropdown Menu:** Bayangan mengambang halus (`shadow-xl` / `shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)]`).
  - **Glow Aksen Landing Page:** Radial gradient oranye lembut di belakang kartu gelap (`rgba(246, 130, 31, 0.15)`).

---

## 2. Pola Layout (Layout Patterns)

### 2.1. Lebar Kontainer (Container Width)
- **Landing Page:** `max-w-7xl` (1280px) terpusat di tengah dengan margin otomatis (`mx-auto`).
- **Aplikasi & Dashboard:** Lebar fleksibel dengan batas maksimum `max-w-[1440px]` atau `w-full` dengan padding terukur `px-6 md:px-8`, memastikan densitas data tabel dan grafik dapat memanfaatkan layar lebar secara optimal.

### 2.2. Sistem Grid (Grid System)
1. **Pola 4-Kolom Strip Metrik Terpadu (`refrence1 (4).png`):**
   - Satu kartu panjang dengan 4 kolom metrik yang dipisahkan garis vertikal (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200`).
2. **Pola 3-Kolom Kartu Produk / Model (`refrence1 (1).png`):**
   - Grid 3 kolom responsif (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5`).
3. **Pola Asimetris 2-Kolom / Workspace + Right Rail (`refrence1 (3).png`):**
   - Kolom utama kiri (~68% lebar, `lg:col-span-8` atau `flex-1`) untuk data kerja aktif.
   - Kolom samping kanan (~32% lebar, `lg:col-span-4` atau `w-80`) untuk ringkasan pemakaian, target cabang, atau aksi cepat.
4. **Pola Bento Grid Landing Page (`info4.png`):**
   - Kombinasi kartu lebar ganda (`col-span-2`) dan kartu tunggal (`col-span-1`) yang menyusun visual fitur secara dinamis.

### 2.3. Dimensi Bar Navigasi & Sidebar
- **Tinggi Topbar:** Tepat 52px (`h-[52px]`), posisi *sticky top-0 z-30*, latar putih bersih dengan border bawah 1px (`border-b border-slate-200`).
- **Lebar Sidebar Desktop:** 256px (`w-64`), posisi *fixed left-0 inset-y-0*, latar putih dengan border kanan 1px (`border-r border-slate-200`).
- **Sidebar Header:** Dropdown pemilih akun/organisasi usaha (`Kopi Senja ↕`) setinggi 52px yang sejajar sempurna dengan topbar.

### 2.4. Kepadatan (Densitas) Tabel dan Kartu
- **Tabel Enterprise Berkepadatan Tinggi:**
  - Tinggi baris tabel: 44px – 48px (`py-3 px-4`).
  - Baris header: font ukuran 12px, bobot semi-bold, teks warna abu-abu netral (`text-slate-500 uppercase tracking-wider`).
  - Efek baris: transisi halus pada *hover* (`hover:bg-slate-50/80`), tanpa warna belang-belang berlebihan.
- **Kartu Data:**
  - Jarak antar elemen kartu terukur ketat (margin bawah judul 4px–8px, jarak antar badge 6px).

---

## 3. Pola Komponen (Component Patterns)

### 3.1. Tombol (Buttons)
- **Primary Button (Aksi Primer Aplikasi):**
  - Background `#0051C7` (Enterprise Blue), hover `#0041A3`, teks putih `#FFFFFF`, rounded-lg (8px), font-medium 14px, padding `px-4 py-2`.
- **Primary Button (Hero CTA Landing Page):**
  - Kapsul putih solid `bg-white text-slate-900 hover:bg-slate-100 rounded-full font-semibold px-6 py-3 shadow-md`.
- **Secondary / Outlined Button:**
  - Background putih `#FFFFFF`, border 1px `#D1D5DB`, hover `bg-slate-50`, teks `#374151`, rounded-lg (8px), padding `px-3.5 py-2`. Contoh: tombol "Dokumentasi", "Filter", "Ekspor".
- **Ghost Button:**
  - Background transparan, hover `bg-slate-100`, teks `#4B5563`, rounded-lg, padding `px-2.5 py-1.5`. Contoh: tombol "Salin ID", aksi ikon.
- **Destructive Button:**
  - Varian lembut: `bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg`.
  - Varian tegas: `bg-rose-600 text-white hover:bg-rose-700 rounded-lg px-4 py-2`. Contoh: konfirmasi pembatalan nota (VOID).

### 3.2. Form Input & Pencarian (Inputs & Search)
- Wadah tinggi 38px–40px, latar `#FFFFFF` atau `#F4F4F5`, garis tepi `#E5E7EB`, rounded-lg (8px), padding horizontal `pl-9 pr-3`.
- Ikon kaca pembesar di sisi kiri (`w-4 h-4 text-slate-400`).
- Lencana jalan pintas keyboard di sisi kanan: kotak kecil `Ctrl K` (`bg-white border border-slate-200 text-[10px] font-semibold text-slate-500 rounded px-1.5 py-0.5`).

### 3.3. Dropdown & Pemilih Filter (Filter Dropdowns)
- Latar putih, border 1px `#E5E7EB`, rounded-lg, teks 13px font-medium, padding `px-3 py-1.5`.
- Ikon panah ganda naik-turun (`↕` / `ChevronsUpDown` dari Lucide) di sisi kanan.

### 3.4. Tab Navigasi & Segmented Controls
- Wadah abu-abu terang kapsul (`bg-zinc-100 p-1 rounded-lg inline-flex`).
- Tab aktif: kartu putih persegi bersudut tumpul (`bg-white text-slate-900 font-medium shadow-xs rounded-md px-3 py-1.5`).
- Tab tidak aktif: teks abu-abu netral (`text-slate-600 hover:text-slate-900 px-3 py-1.5 transition`).

### 3.5. Badge & Chip Status
- Bentuk kapsul utuh (`rounded-full px-2.5 py-0.5 text-xs font-semibold`).
- Indikator status dapat dilengkapi titik bundar kecil (*dot indicator*) berdiameter 6px di sisi kiri teks.

### 3.6. Kartu Metrik & Bento
- Sudut lengkung 12px s.d. 16px, garis tepi tipis 1px, latar belakang putih bersih, jarak dalam seragam.
- Pemisahan visual yang jelas antara:
  - Header kartu (ikon entitas, judul kartu, tombol aksi sekunder).
  - Badan kartu (isi data, grafik garis, badge metadata).
  - Footer kartu (tautan aksi detail, tombol eksekusi).

### 3.7. Modal Dialog
- Lapisan penutup (*backdrop*): `bg-slate-900/40 backdrop-blur-xs fixed inset-0 z-50`.
- Kontainer dialog: kartu putih `rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4`.
- Header dialog dengan judul tebal 18px dan tombol silang penutup (X) di pojok kanan atas.
- Footer dialog berjejer rata kanan: Tombol Batal (Secondary) dan Tombol Simpan/Konfirmasi (Primary).

### 3.8. Toast Notifikasi
- Kartu mengambang di pojok kanan bawah (`bottom-4 right-4 z-50`).
- Latar putih dengan border 1px berwarna sesuai status (hijau untuk sukses simpan transaksi, merah untuk galat).
- Dilengkapi ikon status Lucide dan tombol tutup cepat.

### 3.9. Status Kosong (Empty State) — Mengacu pada `refrence1 (3).png`
- Kontainer kartu besar bergaris tepi tipis dengan padding vertikal longgar (`py-16 px-6 text-center`).
- Ikon outline monolin terpusat (contoh: silinder database atau kotak stok) dengan garis halus 1.5px abu-abu netral.
- Judul status kosong tebal 18px (`font-bold text-slate-900 mt-4`).
- Teks penjelasan abu-abu lembut 14px (`text-slate-500 mt-1 max-w-sm mx-auto`).
- Tombol aksi primer di bawah penjelasan (contoh: "Tambah Produk Pertama" atau "Buat Transaksi").

---

## 4. Pemetaan Layar Referensi ke Halaman BizPulse

| Layar Referensi | Fitur & Karakteristik Kunci Referensi | Halaman BizPulse Target | Penerapan pada BizPulse |
| :--- | :--- | :--- | :--- |
| **`redesign/home/hero.png`** | Kotak hero oranye melengkung besar, dot-grid pattern, headline masif, pill badge, tombol putih CTA | `frontend/src/app/page.tsx` (Landing Page) | Hero banner BizPulse: judul pahlawan solusi 3 pertanyaan pagi, pill pengumuman GTNIC 2026, tombol "Mulai Demo 1-Klik". |
| **`redesign/home/info1.png`** | Window frame macOS (`○ ○ ○`), tab per kategori, kutipan testimoni pebisnis, logo partner | `frontend/src/app/page.tsx` (Bagian Testimoni UMKM) | Bukti sosial pemilik kedai kopi, toko retail, dan resto yang memangkas waktu tutup buku dari 2 jam jadi 5 menit. |
| **`redesign/home/info2.png`** | Komparasi 2 kolom: Masalah ruwet (kiri) vs Solusi rapi (kanan oranye cerah) | `frontend/src/app/page.tsx` (Bagian Masalah vs Solusi) | Komparasi pembukuan tradisional UMKM (nota hilang, stok selisih) vs BizPulse (Voice POS instan, deteksi anomali real-time). |
| **`redesign/home/info3.png`** | Tab switcher kapsul, diagram aliran data, tabel komparasi 4 paket transparan | `frontend/src/app/page.tsx` (Paket & Fleksibilitas UMKM) | Kartu paket BizPulse (Starter 1 Cabang Gratis, Pro Multi-Cabang, Enterprise Franchise). |
| **`redesign/home/info4.png`** | Bento grid asimetris 4 kartu: terminal view, status deployment, kartu oranye | `frontend/src/app/page.tsx` (Fitur Unggulan) | Bento 4 fitur unggulan: Voice POS NLP lokal, Rekomendasi Mutasi Stok Cerdas, Auto-Ledger, Deteksi Anomali Z-score. |
| **`redesign/home/about.png`** | Peta jaringan multi-titik terhubung, metrik kecepatan, 3 kolom pilar fondasi | `frontend/src/app/page.tsx` (Arsitektur Multi-Cabang) | Visualisasi sinkronisasi multi-cabang (Pusat, Cabang Timur, Cabang Barat) dengan latensi 0 ms berbasis Supabase RLS. |
| **`redesign/home/footer.png`** | Kontainer oranye bertekstur titik halus, ticker strip fitur, footer kolom gelap | `frontend/src/app/page.tsx` (Footer & CTA Akhir) | Banner penutup ajakan bertindak untuk juri GTNIC 2026, ticker keunggulan lokal, dan navigasi footer multi-kolom rapi. |
| **`redesign/dashboard/sidebar (1).png`** | Header switcher organisasi (`↕`), quick search `Ctrl K`, grup navigasi berkategori, ikon monolin, lencana status | `frontend/src/app/(app)/layout.tsx` (Sidebar Desktop & Mobile) | Sidebar navigasi BizPulse: Pemilih cabang aktif di header, search shortcut, kategori menu (Utama, Operasional, Keuangan, Pengaturan). |
| **`redesign/dashboard/topbar.png`** | Bar putih tipis 52px, tombol "Ask AI", tombol "Support", siluet avatar profil pengguna | `frontend/src/app/(app)/layout.tsx` (Topbar Navigasi) | Bar atas BizPulse: Tombol bantuan demo juri, status role (OWNER/KASIR), tombol keluar cepat, dan indikator mode demo. |
| **`redesign/dashboard/refrence1 (1).png`** | Toolbar pencarian + multi-filter dropdown (`↕`), grid 3-kolom kartu entitas, tag kategori | `frontend/src/app/(app)/products/page.tsx`<br>`frontend/src/app/(app)/branches/page.tsx`<br>`frontend/src/app/(app)/pos/page.tsx` | Katalog produk, manajemen cabang, dan etalase POS kasir: filter kategori, pencarian SKU, badge stok sisa, harga bold. |
| **`redesign/dashboard/refrence1 (2).png`** | Banner sambutan ("Let's get to work"), bar pencarian lebar tengah, 3 kartu aksi awal pahlawan | `frontend/src/app/(app)/dashboard/page.tsx` (Pusat Kendali Owner) | Tampilan atas dashboard: sambutan pemilik usaha, ringkasan status operasional harian, dan 3 kartu aksi cepat. |
| **`redesign/dashboard/refrence1 (3).png`** | Empty state elegan (ikon outline + judul + deskripsi), panel samping kanan (*Right Rail*) pemakaian & target | `frontend/src/app/(app)/dashboard/page.tsx` (Right Rail)<br>Semua tabel saat data kosong (`/transactions`, `/expenses`, dll.) | Right rail ringkasan performa cabang terhadap target omzet harian di dashboard; serta standarisasi seluruh empty-state aplikasi. |
| **`redesign/dashboard/refrence1 (4).png`** | Tab kapsul segmentasi (`Overview`, `Runs`), kartu terpadu 4 KPI terbelah garis vertikal, kontainer grafik | `frontend/src/app/(app)/dashboard/page.tsx`<br>`frontend/src/app/(app)/reports/page.tsx`<br>`frontend/src/app/(app)/stock/page.tsx` | Tab navigasi sub-menu, strip metrik 3 Pertanyaan Pagi (Omzet, HPP, Laba Bersih, Beban), dan grafik tren keuangan harian. |

---

## 5. Daftar Komponen yang Perlu Dibuat / Di-restyle dan Berkas Terdampak

### 5.1. Komponen Baru / Restyle Reusable (`frontend/src/components/ui/`)
1. **`button.tsx`**: Standardisasi 4 varian tombol (primary solid enterprise blue, secondary crisp border, ghost, destructive) + ukuran (`sm`, `md`, `lg`, `pill`).
2. **`card.tsx`**: Restyle kartu dengan border 1px `#E5E7EB`, rounded-xl, padding seragam, serta sub-komponen `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
3. **`metric-strip.tsx`**: Komponen terpadu 4 KPI terbelah garis vertikal per pola `refrence1 (4).png`.
4. **`badge.tsx`**: Restyle badge pill rounded-full dengan 5 preset warna status (success, warning, danger, neutral, brand orange).
5. **`tabs.tsx`**: Segmented pill tabs switcher mengacu pada tab bar `refrence1 (4).png`.
6. **`input.tsx` & `search-input.tsx`**: Field input dengan ikon kaca pembesar dan badge shortcut keyboard `Ctrl K`.
7. **`empty-state.tsx`**: Standarisasi komponen tampilan data kosong mengacu pada `refrence1 (3).png`.
8. **`dropdown-filter.tsx`**: Tombol dropdown filter dengan panah ganda `↕`.
9. **`dialog.tsx`**: Restyle modal dialog konfirmasi (Voice order modal, void modal, restock modal, add expense modal) agar konsisten dengan card surface.

### 5.2. Berkas Halaman & Layout yang Terdampak
1. **`frontend/src/app/globals.css` & `frontend/tailwind.config.ts`**:
   - Pendaftaran tokens warna (`#0051C7`, `#F6821F`, `#0A0A0C`, `#121316`, `#E5E7EB`), konfigurasi font Plus Jakarta Sans / Inter, utilitas dot-grid halftone pattern.
2. **`frontend/src/app/(app)/layout.tsx`**:
   - Peremajaan total sidebar (pola `sidebar (1).png`), topbar 52px (pola `topbar.png`), drawer mobile, dan dropdown organisasi.
3. **`frontend/src/app/page.tsx` (Landing Page)**:
   - Transformasi visual mengadopsi tema gelap hero oranye, bento grid fitur, testimoni berbingkai, dan CTA footer.
4. **`frontend/src/app/(app)/dashboard/page.tsx`**:
   - Penerapan strip 4 metrik 3 Pertanyaan Pagi, tata letak dua kolom (area anomali + rekomendasi mutasi di kiri, right rail target cabang di kanan).
5. **`frontend/src/app/(app)/pos/page.tsx`**:
   - Toolbar filter produk ala `refrence1 (1).png`, grid kartu menu dengan badge stok cerdas, panel keranjang bersih di samping kanan.
6. **`frontend/src/app/(app)/transactions/page.tsx`**:
   - Strip metrik transaksi di bagian atas, tabel mutasi transaksi berdensitas tinggi, modal detail struk dan alasan void yang modern.
7. **`frontend/src/app/(app)/expenses/page.tsx`**:
   - Strip metrik beban pengeluaran, bilah filter bulan dan kategori, tabel pengeluaran dengan indikator anomali.
8. **`frontend/src/app/(app)/products/page.tsx`**:
   - Toolbar pencarian multi-kategori, katalog produk grid/tabel, kartu peringatan HPP.
9. **`frontend/src/app/(app)/stock/page.tsx`**:
   - Tab navigasi segmentasi (Inventaris, Rekomendasi Mutasi, Audit Log), banner rekomendasi transfer antarcabang cerdas.
10. **`frontend/src/app/(app)/reports/page.tsx`**:
    - Segmented tabs 4 sudut pandang laporan (Tren, Kategori Biaya, Klasemen Cabang, Margin Produk), strip 6 metrik laba rugi, tombol ekspor resmi PDF & Excel.
11. **`frontend/src/app/(app)/branches/page.tsx` & `staff/page.tsx`**:
    - Grid kartu cabang dengan indikator pemakaian kuota cabang (X/5 Cabang Aktif) dan target penjualan harian.
12. **`frontend/src/app/(auth)/login/page.tsx` & `register/page.tsx`**:
    - Restyle kartu otentikasi minimalis bergaris tepi bersih, menjaga tombol cepat demo 1-klik bagi juri.
13. **`frontend/src/app/(app)/demo-guide/page.tsx`**:
    - Restyle tabbed tester suara interaktif dan panduan skenario kompetisi agar serasi dengan sistem desain baru.

---

## 6. Hal yang Tidak Bisa Ditentukan Persis dari Referensi & Usulan Solusi Bebas Lisensi

| Elemen Desain | Kondisi pada Referensi | Usulan Solusi Bebas Lisensi (Open Source / PRD Compliant) |
| :--- | :--- | :--- |
| **Keluarga Font Teks (Font Family)** | Referensi menggunakan font komersial kustom milik merek (*Roobert* / *Cloudflare Sans*). Font ini berbayar dan berhak cipta. | **`Plus Jakarta Sans`** atau **`Inter`** (via `next/font/google`). Keduanya berlisensi **SIL Open Font License (OFL)** 100% gratis, memiliki karakteristik geometri neo-grotesque modern, angka tabular yang sangat rapi untuk laporan keuangan, dan dapat di-*bundle* lokal oleh Next.js tanpa dependensi jaringan runtime. |
| **Font Angka & Monospace** | Referensi menampilkan font monospace untuk shortcut keyboard (`Ctrl K`) dan kode. | **`JetBrains Mono`** atau stack sistem font bawaan Tailwind (`font-mono` / `ui-monospace`) yang gratis dan tajam. |
| **Ikonografi (Icon Set)** | Referensi memakai paket ikon kustom internal SVG. | **`lucide-react`** (sudah terpasang di dependencies PRD). Ikon Lucide memiliki bobot garis 1.5px–2.0px yang identik secara visual dengan ikon referensi. |
| **Aset Ilustrasi & Globe 3D** | Referensi memakai gambar raster globe 3D oranye milik merek. | **CSS Pure Vector Dotted Grid / Node Network Canvas**: Menggunakan pola SVG murni dan titik-titik koneksi node multi-cabang (Pusat, Cabang 1, Cabang 2) yang melambangkan UMKM Indonesia tanpa memakai gambar pihak ketiga. |
| **Tekstur Halftone Dot Grid Hero** | Tersemat di dalam berkas gambar hero PNG. | Pola murni CSS `radial-gradient` dengan ukuran tile 16px × 16px, sehingga sangat ringan (0 KB ukuran file gambar), tajam di layar resolusi tinggi (Retina/4K), dan sepenuhnya milik proyek. |
| **Perilaku Mode Gelap di Area Dashboard** | Referensi folder `redesign/dashboard/` hanya menunjukkan tampilan *Light Mode*, sedangkan landing page menunjukkan *Dark Mode*. | Tetap prioritaskan **Light Mode** untuk seluruh antarmuka kerja aplikasi (`(app)/*`), sesuai screenshot referensi dashboard yang diberikan; dan **Dark Theme with Orange Hero** untuk landing page (`/`). |

---

## 7. Kesimpulan & Komitmen Integritas Proyek
1. **Bahasa Desain**: BizPulse mengadopsi ketajaman visual, kedisiplinan hierarki, kepadatan data enterprise, dan aksen oranye menyala dari referensi untuk memberikan kesan aplikasi kelas dunia.
2. **Kemandirian Merek**: Seluruh teks antarmuka tetap **100% Bahasa Indonesia**, identitas nama tetap **BizPulse**, target pasar tetap **UMKM multi-cabang**, dan hak cipta sepenuhnya bersih dari aset pihak ketiga.
3. **Integritas Fungsional**: Tidak ada satu pun fitur PRD yang dihilangkan atau diubah perilakunya. Seluruh aturan transaksi, proteksi stok via RPC, zona waktu WIB, format Rupiah utuh, dan logika 3 Pertanyaan Pagi tetap berjalan 100% utuh.

---

## 8. Pola "Blueprint Grid" (Detail Modernisme Landing Page & Card Grid)

Berdasarkan analisis presisi terhadap artefak visual `redesign/home/detail-blueprint-grid.png` (resolusi lebar 1889 px), gaya modern mutakhir referensi dibangun di atas sistem grid geometris arsitektural (*Blueprint Grid*) yang tegas, terukur, dan berorientasi presisi teknis.

### 8.1. Pengukuran Presisi dari Referensi (`detail-blueprint-grid.png`)
| Elemen Grid | Nilai Terukur (px) | Token CSS Variable / Tailwind | Karakteristik Visual & Perilaku |
| :--- | :--- | :--- | :--- |
| **Lebar Kanvas Gambar** | `1889px` | Full viewport | Kanvas gelap utama (`#0A0A0C`) |
| **Lebar Kontainer Luar (Outer Guide)** | `1110px – 1120px` | `max-w-[1120px]` / `--grid-outer-width: 1120px` | Garis pandu vertikal luar putus-putus tembus dari atas ke bawah |
| **Lebar Kolom Konten Dalam (Inner Guide)** | `900px – 910px` | `max-w-[910px]` / `--grid-inner-width: 910px` | Garis pandu vertikal dalam pembatas teks & sel kartu |
| **Lebar Gutter (Koridor Titik)** | `105px` | `w-[105px]` / `--grid-gutter-width: 105px` | Koridor di antara garis luar dan garis dalam |
| **Tekstur Titik Gutter (Dot Matrix)** | Titik 1px, spasi 8px × 8px | `--gutter-dot-size: 8px`<br>`--gutter-dot-color: rgba(255,255,255,0.08)` | `radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)`. Hanya di area gutter, tidak bocor ke konten |
| **Garis Pandu Putus-Putus (Dashed Guides)** | Tebal 1px, dash 4px, gap 4px | `--grid-line-color: #26282D`<br>`--grid-line-dash: 4px 4px` | Warna abu-abu gelap kontras rendah (`#26282D`), garis vertikal utuh & horizontal selebar layar (*full bleed*) |
| **Kotak Sudut Grid (Corner Marks)** | `8px × 8px` persegi | `--handle-size: 8px`<br>`--handle-border: #4B5563`<br>`--handle-bg: #0A0A0C` | Kotak kecil mirip *selection handle* di Figma/CAD pada 4 sudut grid & titik persilangan kolom |
| **Bentuk Sudut Kartu Grid** | `0px` (Sudut Tajam) | `rounded-none` | Mengabaikan `rounded-xl`, memakai sudut persegi tajam presisi cetak biru |
| **Callout Keterangan Aksen** | Border 1px putus-putus oranye | `--callout-border: #F6821F`<br>`--callout-bg: rgba(246,130,31,0.04)` | Border dashed oranye `#F6821F`, teks 11px–12px oranye, padding ringkas `px-3 py-2`, sudut siku tajam |
| **Tipografi Judul Blueprint** | 32px – 36px | `font-normal` s.d. `font-medium` | Judul terpusat berbobot ringan/elegan (*light-to-medium*), tracking `-0.025em`, kontras tinggi terhadap teks sekunder |

### 8.2. Daftar Komponen Reusable yang Dibutuhkan
Komponen-komponen ini akan diintegrasikan ke dalam `frontend/src/components/ui/`:
1. **`<BlueprintSection>`**: Kontainer pembungkus section dengan garis vertikal luar dan dalam, gutter bertekstur titik, dan garis horizontal atas-bawah.
2. **`<DotGutter>`**: Koridor 105px berisi pola titik-titik halus murni CSS `radial-gradient` yang presisi.
3. **`<DashedRule>`**: Garis horizontal putus-putus selebar layar (*full bleed*) berpotongan dengan garis pandu vertikal.
4. **`<CornerMarks>`**: Handle sudut persegi 8px × 8px (`border border-zinc-600 bg-[#0A0A0C]`) di 4 sudut sel/grid.
5. **`<FeatureGrid>` & `<FeatureCell>`**: Wadah kartu sel bergaris tepi tipis 1px `#26282D` sudut tajam (`rounded-none`), dengan ikon garis tipis (stroke 1.25px), judul semi-bold 14px, dan deskripsi 12px redup.
6. **`<Callout>`**: Kotak anotasi berbingkai putus-putus aksen oranye `#F6821F` untuk metrik kunci.

### 8.3. Aturan Penerapan & Responsivitas
- **Landing Page (`/`):** Terapkan penuh pada section fitur, arsitektur multi-cabang, dan komparasi solusi untuk menghadirkan nuansa cetak biru modern yang autentik.
- **Area Aplikasi Internal (`/dashboard`, `/pos`, tabel data):** Gunakan versi **MINIMAL** (garis pemisah halus dan `CornerMarks` pada kartu utama/strip metrik). Dilarang menyematkan dot gutter atau garis pandu berlebih di dalam dashboard aplikasi agar tidak mengorbankan kepadatan data dan fokus kerja kasir/owner.
- **Responsivitas:**
  - **Desktop (>= 1280px):** Gutter penuh 105px, garis pandu ganda (luar & dalam) aktif.
  - **Tablet (768px – 1279px):** Gutter dikecilkan menjadi 48px – 64px, tekstur titik tetap halus.
  - **Mobile (< 768px):** Sembunyikan dot gutter dan garis vertikal dalam demi ruang baca maksimal; pertahankan garis horizontal putus-putus selebar layar.
  - **Bebas Horizontal Scroll:** Semua elemen dekoratif dibungkus dalam kontainer `overflow-x-clip` agar tidak menyebabkan scroll menyamping di perangkat apa pun.

