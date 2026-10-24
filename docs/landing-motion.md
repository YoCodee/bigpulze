# Audit & Rencana Animasi GSAP Landing Page BizPulse

Dokumen audit dan rencana implementasi gerak (*motion design*) berbasis **GSAP** dan `@gsap/react` (dengan plugin `ScrollTrigger`) khusus untuk halaman depan (*landing page* rute `/`) BizPulse.

---

## 1. Prinsip & Batasan Teknis Gerak (Motion Principles)

| Parameter | Ketentuan Baku | Alasan & Kepatuhan |
| :--- | :--- | :--- |
| **Tujuan Gerak** | *Purposeful Motion* — menjelaskan aliran data, komputasi, dan keandalan sistem | Menghindari ilusi kosmetik ("AI slop") dan memperkuat pemahaman juri terhadap produk. |
| **Durasi & Easing** | Durasi 0.4s – 0.8s, Easing `power2.out` atau `power3.out`, Stagger 0.06s – 0.12s | Tidak ada *bounce*, *elastic*, atau *overshoot* yang terasa kekanak-kanakan/tidak profesional. |
| **Properti Animasi** | **Hanya `transform` dan `opacity`** (`x`, `y`, `scale`, `rotation`, `opacity`) | Dilarang mengubah `width`, `height`, `top`, `left`, `margin`. **Nol layout shift (CLS = 0)**. |
| **Siklus Loop** | Hanya aktif saat card berada di viewport (`ScrollTrigger.onToggle` play/pause) | Hemat daya baterai, CPU 0% saat pengguna membaca section lain. |
| **Aksesibilitas** | Kepatuhan penuh `prefers-reduced-motion: reduce` via `gsap.matchMedia()` | Pengguna dengan sensitivitas vestibular mendapatkan tampilan statis final yang bersih dan lengkap. |
| **SEO & DOM** | Konten teks tetap 100% utuh di HTML server-rendered | Efek ketik/reveal menggunakan teknik *clip-path* atau *masking*, bukan manipulasi teks JS. |
| **Isolasi Bundle** | Hanya diimpor pada komponen landing page | Area aplikasi (`/dashboard`, `/pos`, dll.) tidak memuat bundle GSAP. |

---

## 2. Tabel Audit Animasi per Section & Card

Berikut rencana detail animasi di seluruh landing page (`frontend/src/app/page.tsx`):

| Section / Komponen | File / Target DOM | Jenis Animasi | Durasi, Easing & Trigger | Risiko & Mitigasi |
| :--- | :--- | :--- | :--- | :--- |
| **A. Blueprint Grid & Guides** | `blueprint-grid.tsx`<br>`BlueprintCanvas`, `DashedRule`, `CornerMarks` | - Garis vertikal: `scaleY: 0 → 1` (origin top)<br>- DashedRule: `scaleX: 0 → 1` (origin center)<br>- CornerMarks: `scale: 0 → 1` stagger<br>- Dot gutter: `opacity: 0 → 1` | Durasi 0.6s – 0.8s<br>`power2.out`<br>Trigger: ScrollTrigger saat section masuk viewport (sekali) | **Risiko:** Garis bergeser saat scrolling.<br>**Mitigasi:** Gunakan `transform-origin` tepat, `will-change: transform` dilepas setelah selesai. |
| **B. Section Header (Semua)** | `page.tsx`<br>Badge, H2, Subtitle paragraf | Reveal per elemen: `y: 16 → 0`, `opacity: 0 → 1` dengan stagger 0.08s | Durasi 0.5s<br>`power2.out`<br>Trigger: ScrollTrigger `start: "top 85%"` (sekali) | **Risiko:** Teks berkedip saat fast-scroll.<br>**Mitigasi:** `once: true`, initial hidden state via CSS scoped `.gsap-reveal`. |
| **C. Card Daftar Transaksi (Pilot Card 1)** | `page.tsx:884`<br>Bento Card 1 ("Cocok dengan Kebiasaan Kasir") | - Reveal container & rows.<br>- **Loop Demo Transaksi (±3.5s):** Baris baru masuk dari atas (`y: -12 → 0`, fade), baris lain bergeser turun, baris bawah fade out.<br>- Status berganti: *Sinkronisasi* (spin) → *Selesai* (check draw).<br>- Ikon Receipt berdenyut halus. | Durasi transisi baris: 0.4s<br>Interval loop: 3.5s<br>`power2.out`<br>Trigger: Loop berjalan HANYA saat card in-view. | **Risiko:** Hydration mismatch pada data transaksi.<br>**Mitigasi:** Gunakan array data statis berurutan (tanpa `Math.random()` atau tanggal acak). |
| **D. Card Oranye (Pilot Card 2)** | `page.tsx:941`<br>Bento Card 2 ("Satu Platform POS, Stok, Keuangan") | - Reveal teks berurutan.<br>- Titik sinkronisasi bergerak di garis pembatas kiri → kanan, nilai `< 100ms` fade in.<br>- Ikon Globe2 melayang sangat pelan (`y: -3px → 0`, yoyo).<br>- Soft ambient gradient sweep. | Durasi reveal: 0.6s<br>Ambient float: 3.0s `sine.inOut`<br>Trigger: ScrollTrigger + Loop pelan saat in-view. | **Risiko:** Efek terlalu ramai pada latar oranye cerah.<br>**Mitigasi:** Batasi perpindahan maksimal 3px, kilau opasitas maksimal 15%. |
| **E. Card Keamanan (Pilot Card 3)** | `page.tsx:963`<br>Bento Card 3 ("Aman & Tervalidasi Standar Bank") | - Stroke draw ikon ShieldCheck.<br>- 2 baris fitur RLS & Audit VOID masuk dari kiri (`x: -12 → 0`, opacity `0 → 1`).<br>- Titik status hijau/oranye berdenyut sekali. | Durasi 0.5s<br>`power2.out`<br>Stagger 0.1s<br>Trigger: ScrollTrigger `top 80%` (sekali). | **Risiko:** Ikon SVG tidak merespons dashoffset.<br>**Mitigasi:** Gunakan path terukur atau fallback scale-in tajam. |
| **F. Card Terminal Anomali (Pilot Card 4)** | `page.tsx:991`<br>Bento Card 4 ("Deteksi Dini Masalah Operasional") | **Timeline GSAP berulang (9–10s):**<br>1. "Menjalankan mesin anomali..." mengetik visual (clip-path).<br>2. "3 modul pengawasan aktif" fade in + dot pulse.<br>3. 3 sub-baris masuk stagger.<br>4. Perintah `kirim_rekomendasi_mutasi` mengetik, tombol Eksekusi tertekan (`scale: 1 → 0.96 → 1`).<br>5. Konfirmasi "2 mutasi dikirim" muncul (hold 2.5s).<br>6. Fade out, loop kembali. | Total timeline 9.5s<br>Looping otomatis.<br>Trigger: Play saat in-view, Pause saat out-of-view. | **Risiko:** Teks hilang dari screen reader/SEO jika dihapus lewat JS.<br>**Mitigasi:** Teks tetap 100% ada di DOM, animasi hanya menganimasikan `clip-path` mask atau `opacity`. |
| **G. Hero Section** | `page.tsx:331`<br>Hero container, headline, CTA, metric ticker | Staggered fade-up: Badge → Headline display → Subtitle → Tombol aksi → 4 metrik bawah hero. | Durasi 0.6s per grup<br>`power3.out`<br>Trigger: On mount (initial load). | **Risiko:** Flash of Unstyled Content (FOUC).<br>**Mitigasi:** CSS hide state pada `.hero-anim-init`, dipicu via `useGSAP`. |
| **H. Cerita UMKM (Testimonial)** | `page.tsx:405`<br>Tabs kapsul, quote card, 3 KPI stats | - Tab klik: transisi konten halus (`opacity: 0 → 1`, `y: 4 → 0`, durasi 0.25s).<br>- 3 Angka KPI muncul berurutan (stagger 0.08s). | Durasi 0.35s<br>`power2.out`<br>Trigger: ScrollTrigger & Tab state change. | **Risiko:** Delay respon saat user mengklik tab.<br>**Mitigasi:** Durasi tab switch dibuat sangat singkat (≤ 0.25s). |
| **I. Fondasi Enterprise (FeatureGrid)** | `page.tsx:524`<br>FeatureGrid 3 kolom | 3 Cell fitur muncul stagger dari bawah (`y: 16 → 0`, `opacity: 0 → 1`). Garis pembatas vertikal tergambar dari atas. | Durasi 0.5s<br>`power2.out`<br>Trigger: ScrollTrigger `top 85%`. | **Risiko:** Overflow horizontal.<br>**Mitigasi:** Gerak murni sumbu Y, container `overflow-visible`. |
| **J. Komparasi Masalah vs Solusi** | `page.tsx:587`<br>2 Kartu komparasi | - Kartu masalah & kartu oranye masuk bersamaan.<br>- 4 poin perbandingan masuk berurutan kiri → kanan (memperlihatkan transformasi). | Durasi 0.5s<br>Stagger 0.1s<br>Trigger: ScrollTrigger `top 80%`. | **Risiko:** Tumpukan gerak terlalu ramai.<br>**Mitigasi:** Animasi hanya berjalan sekali, tidak ada loop. |
| **K. Paket & Harga** | `page.tsx:688`<br>4 Kartu tier harga | 4 Kartu masuk stagger dari kiri ke kanan (`y: 20 → 0`, `opacity: 0 → 1`, stagger 0.08s). | Durasi 0.5s<br>`power2.out`<br>Trigger: ScrollTrigger `top 80%`. | **Risiko:** Mengganggu keterbacaan angka harga.<br>**Mitigasi:** Animasi berhenti total di state akhir statis. |
| **L. Visualizer Radar Jaringan** | `page.tsx:1058`<br>Kanvas radar & 3 node cabang | - Cincin orbit radar membesar halus (`scale: 0.94 → 1`).<br>- Busur kurva SVG tergambar dari pusat ke cabang.<br>- 3 Badge kota muncul berurutan. | Durasi 0.8s<br>`power2.out`<br>Trigger: ScrollTrigger `top 75%`. | **Risiko:** Beban SVG redraw.<br>**Mitigasi:** Stroke dashoffset dihitung otomatis, tidak ada redraw loop. |
| **M. Alur Kerja (Workflow Steps)** | `page.tsx:1187`<br>Diagram 5 langkah alur | 5 Node langkah transaksi menyala berurutan dari kiri ke kanan dengan indikator garis penghubung. | Durasi 0.7s total<br>Stagger 0.1s<br>Trigger: ScrollTrigger `top 80%`. | **Risiko:** Membingungkan arah baca.<br>**Mitigasi:** Arah stagger persis mengikuti urutan nomor 1 s.d. 5. |
| **N. Hover Interaktif (Semua Card)** | Seluruh kartu bento, fitur, dan paket | Card naik 2px (`y: -2px`), border bertransisi halus ke warna aksen token, bayangan mikro mengembang. | Durasi 0.2s<br>CSS transition GPU-accelerated. | **Risiko:** Lag pada mouse cepat.<br>**Mitigasi:** Dijalankan via CSS `transition: transform 0.2s, border-color 0.2s` murni. |

---

## 3. Klaim yang Perlu Diperiksa (Audit terhadap PRD 5.2, PRD 20, & Angka Belum Terukur)

> [!WARNING]
> Sesuai instruksi: Klaim di bawah ini **HANYA DITANDAI** (tidak diubah dalam kode sekarang). Animasi GSAP yang akan dibangun **TIDAK BOLEH** memperkuat, menyoroti, atau membuat visual khusus untuk klaim yang bertentangan dengan PRD atau belum terukur.

| No | Teks Klaim di Landing Page | Lokasi File & Baris | Analisis & Pertentangan terhadap PRD | Rekomendasi Tindakan Lanjutan |
| :---: | :--- | :--- | :--- | :--- |
| **1** | `cetak struk Bluetooth thermal 58/80mm` | `frontend/src/app/page.tsx:935` | **Bertentangan dengan PRD 5.2 (Non-Goals):** PRD secara eksplisit melarang *"cetak struk fisik atau printer"*. Sistem BizPulse adalah web app cloud tanpa driver printer hardware Bluetooth. | Animasi Card C fokus pada *Live Transaction Stream* kasir digital, **bukan** simulasi cetak struk fisik. Teks ditandai untuk revisi ke *"struk digital QR & validasi kasir instan"*. |
| **2** | `kasir offline-first` & `Offline-First Resilien` | `frontend/src/app/page.tsx:935`<br>`frontend/src/app/page.tsx:1284`<br>`frontend/src/app/page.tsx:1433` | **Bertentangan dengan PRD 5.2 & PRD 20 (Batasan):** PRD 5.2 melarang *"mode offline atau PWA"*, dan PRD 20 secara tegas menulis: *"tidak ada mode offline"*. Arsitektur BizPulse mengandalkan Supabase PostgreSQL online. | Jangan membuat animasi "indikator offline". Teks ditandai untuk revisi ke *"arsitektur web kasir cepat & andal"*. |
| **3** | `Sinkronisasi Multi-Cabang Latensi 0ms` & `Latensi 0ms` | `frontend/src/app/page.tsx:134`<br>`frontend/src/app/page.tsx:391`<br>`frontend/src/app/page.tsx:574` | **Klaim teknis belum terukur & mustahil:** Latensi jaringan HTTP/WebSocket cloud ke database Supabase secara fisik membutuhkan puluhan s.d. ratusan milidetik. Klaim "0ms" melemahkan kredibilitas di depan dewan juri GTNIC. | Animasi tidak boleh menonjolkan angka "0ms". Teks ditandai untuk diganti menjadi *"sinkronisasi awan instan"* atau *"tanpa delay manual"*. |
| **4** | `Sinkronisasi instan < 100ms` | `frontend/src/app/page.tsx:958` | **Angka belum terukur secara empiris:** Round-trip API pada koneksi seluler 4G/5G UMKM Indonesia berkisar antara 120ms – 300ms. Belum ada pengujian benchmark resmi yang mencatat < 100ms. | Animasi Card D menganimasikan titik proses yang bergerak halus di garis pembatas, tanpa menyorot angka `< 100ms`. |
| **5** | `Smart Voice POS 2 detik` / `Voice POS 2 detik` | `frontend/src/app/page.tsx:111, 357, 646, 935, 1284, 1334` | **Angka empiris belum terukur:** PRD Bagian 22 (#11) menegaskan bahwa klaim durasi harus berbasis pengukuran riil agar tidak melemahkan proposal. Durasi 2 detik adalah estimasi ucapan kasir, belum diuji pada berbagai dialek/perangkat. | Animasi Voice POS fokus pada *alur deteksi kata kunci* (suara → teks → keranjang), bukan timer stopwatch 2 detik. |
| **6** | `3x lebih cepat di jam sibuk` | `frontend/src/app/page.tsx:51, 57` | **Bertentangan dengan catatan PRD 22 (#11):** PRD riwayat perubahan secara eksplisit menyatakan *"mengganti klaim '3x lebih cepat' menjadi klaim yang harus diukur \| Klaim tanpa bukti melemahkan proposal"*. | Animasi tidak membuat visual pembanding "3x lipat" artifisial. |
| **7** | `Akurasi 95%` (Klasifikasi Beban NLP) | `frontend/src/app/page.tsx:105, 111` | **Angka belum terukur:** `voice-parser.ts` menggunakan pencocokan regex berbasis aturan (*rule-based alias*). Belum ada pengujian statistik kuantitatif terhadap korpus audio UMKM yang membuktikan angka 95%. | Animasi fokus pada keberhasilan pemetaan kategori (misal: "beli gas" → "Utilitas"), bukan angka persentase. |
| **8** | `Ekspor Dokumen PDF Standar Bank KUR` & `100% Tingkat Persetujuan KUR Bank` | `frontend/src/app/page.tsx:87, 93, 214, 386, 974, 1429` | **Pertentangan PRD 20:** PRD menyatakan *"ekspor laporan format standar lembaga pembiayaan"* masih merupakan *Rencana Pengembangan*. Laporan saat ini adalah P&L internal SAK EMKM, dan software tidak dapat menjamin persetujuan kredit perbankan 100%. | Animasi fokus pada format rapi dokumen laporan laba-rugi SAK EMKM, bukan stempel persetujuan bank KUR. |

---

## 4. Arsitektur Teknis Implementasi Animasi

### 4.1 Struktur File yang Akan Dibuat
```
frontend/src/
├── lib/
│   ├── gsap.ts               # Inisialisasi GSAP & register ScrollTrigger aman di client
│   └── motion.config.ts      # Konstanta bersama (DURATIONS, EASINGS, STAGGERS, DISTANCES)
└── components/
    └── landing/
        └── motion/
            ├── reveal.tsx              # Komponen <Reveal> (fade-up sekali dengan scope ref)
            ├── stagger.tsx             # Komponen <Stagger> (container anak berurutan)
            ├── use-loop-when-visible.ts# Hook loop aman ScrollTrigger onToggle
            ├── transaction-feed.tsx    # Live demo stream transaksi (Bento Card C)
            ├── sync-meter.tsx          # Animasi penanda proses sinkronisasi (Bento Card D)
            ├── security-badge.tsx      # Animasi draw & pulse keamanan (Bento Card E)
            └── terminal-demo.tsx       # Animasi timeline konsol mesin anomali (Bento Card F)
```

### 4.2 Strategi Anti-Kedip (No FOUC) & Reduced Motion
1. **Fallback CSS Scoped:** Sebelum GSAP aktif, elemen memiliki opacity 1 jika JavaScript mati (`<noscript>`), dan disembunyikan secara visual hanya saat script animasi siap dieksekusi.
2. **Kepatuhan `prefers-reduced-motion`:**
   ```ts
   // Menggunakan gsap.matchMedia() resmi
   const mm = gsap.matchMedia();
   mm.add("(prefers-reduced-motion: reduce)", () => {
     // Matikan semua gerak, tampilkan elemen dalam posisi akhir statis sempurna
   });
   mm.add("(prefers-reduced-motion: no-preference)", () => {
     // Jalankan animasi transform dan opacity normal
   });
   ```
3. **Pembersihan Otomatis:** Menggunakan hook `useGSAP` resmi dari `@gsap/react` dengan `scope: containerRef` menjamin pembersihan memori (*revert/kill*) otomatis saat komponen unmount atau saat navigasi halaman.

---

## 5. Rencana Tahapan Eksekusi (Roadmap G1 – G8)

- **G1:** Fondasi: Instalasi `gsap` dan `@gsap/react`, pembuatan `src/lib/gsap.ts`, `motion.config.ts`, `<Reveal>`, `<Stagger>`, hook `useLoopWhenVisible`, penanganan reduced motion.
- **G2:** Animasi judul section dan garis Blueprint Grid (garis vertikal, `DashedRule`, `CornerMarks`, dot gutter fade-in).
- **G3:** Pilot Bento Card 1: Card daftar transaksi ("Cocok dengan Kebiasaan Kasir & Pemilik Usaha") dengan live feed loop aman in-view.
- **G4:** Pilot Bento Card 2: Card oranye ("Satu Platform untuk POS, Stok, dan Keuangan") dengan titik proses sinkronisasi dan ambient float.
- **G5:** Pilot Bento Card 3: Card keamanan ("Aman & Tervalidasi Standar Bank") dengan stroke draw shield & stagger items.
- **G6:** Pilot Bento Card 4: Card terminal anomali ("Deteksi Dini Masalah Operasional") dengan GSAP timeline 9.5s (mengetik tanpa merusak DOM).
- **G7:** Hover konsisten pada seluruh card dan section lain di landing page (Hero, Komparasi, Paket, Radar, Alur Kerja, Footer).
- **G8:** Verifikasi akhir: responsivitas 360px/768px/1280px, emulasi reduced motion, pemeriksaan console log, pengukuran bundle size, dan update progres.
