# Audit Decluttering Dashboard Owner (`/dashboard`)

Dokumen ini berisi hasil audit komprehensif seluruh teks, elemen, dan informasi visual pada halaman `/dashboard` BizPulse. Tujuannya adalah menyederhanakan tampilan agar dapat dipahami oleh pemilik UMKM non-teknis dalam waktu 10 detik, terutama saat diakses lewat ponsel pintar di pagi hari.

---

## 1. Prinsip Utama Decluttering
1. **Satu kartu = satu jawaban**: Tiap kartu dari "3 Pertanyaan Pagi" memiliki:
   - Pertanyaan sebagai judul.
   - Satu angka/kesimpulan utama berukuran besar.
   - Chip status (ikon + teks jelas, bukan hanya warna).
   - Maksimal 3 poin ringkas.
   - Satu tombol aksi utama.
2. **Bahasa orang awam**: Nol istilah statistik (Z-score, MAD), ML (WAPE, model Holt-Winters), atau istilah teknis sistem/database di layar utama.
3. **Tampilkan jawaban, sembunyikan cara menghitungnya**: Detail perhitungan teknis dipindah ke panel "Detail analisis" (tersembunyi secara default) atau tooltip `?`.
4. **Hilangkan teks dekoratif dan berulang**: Tidak ada label eyebrow berulang, subjudul redundan, watermark, atau catatan kaki yang tidak fungsional.
5. **Ukuran font minimum 14 px (`text-sm`)**: Tidak ada teks berukuran di bawah 14 px pada layar utama dashboard (seperti `text-[10px]`, `text-[11px]`, atau `text-xs` 12 px). Teks kecil wajib dinaikkan atau dipindah ke panel detail.
6. **Satu hal penting per area**: Tata letak bernapas (banyak ruang kosong), mengurangi border dan aksen dekoratif berlebih.

---

## 2. Tabel Audit Lengkap Elemen `/dashboard`

| No | Teks / Elemen (Kutip Persis) | File Komponen | Keputusan | Teks Pengganti (Jika Disederhanakan) | Alasan Singkat |
|:---|:---|:---|:---|:---|:---|
| **Area 1: Header & Greeting** | | | | | |
| 1 | `GTNIC 2026 • Asisten Keputusan` (Badge) | `dashboard/page.tsx` | **HAPUS** | - | Identitas kompetisi lomba; tidak relevan untuk operasional harian pemilik UMKM. Cukup ada di landing page & README. |
| 2 | `{formatDateId(new Date(), 'EEEE, d MMMM yyyy')} • Zona WIB (Asia/Jakarta)` | `dashboard/page.tsx` | **SEDERHANAKAN** | `Jumat, 24 Oktober 2026` | "Zona WIB (Asia/Jakarta)" adalah keterangan teknis zona waktu yang berlebih. Tanggal lokal Indonesia sudah jelas. |
| 3 | `Pusat Kendali Eksekutif, Budi Santoso` (H1) | `dashboard/page.tsx` | **SEDERHANAKAN** | `Selamat Pagi, Pak Budi` | Frasa "Pusat Kendali Eksekutif" terlalu birokratis/korporat; sapaan personal lebih hangat dan ramah UMKM. |
| 4 | `Selamat pagi! Berikut adalah ikhtisar harian 3 Pertanyaan Pagi untuk 3 cabang Kopi Senja. Buku besar otomatis telah terkonsiliasi hingga fajar ini.` | `dashboard/page.tsx` | **HAPUS** | - | Kalimat panjang dekoratif dan berulang. Konteks 3 pertanyaan sudah langsung dijawab oleh 3 kartu di bawahnya. |
| 5 | Tombol `Dengarkan Briefing Pagi` / `Sedang Membacakan...` | `dashboard/page.tsx` | **PERTAHANKAN** | `Dengarkan Briefing Pagi` / `Sedang Membacakan...` | Fitur AI Voice Briefing yang sangat bermanfaat bagi pemilik usaha saat bersiap di pagi hari lewat HP. |
| 6 | Tombol `Segarkan` (Refresh) | `dashboard/page.tsx` | **PERTAHANKAN** | `Segarkan` | Aksi esensial untuk memicu pembaharuan data (FR-4.4). |
| 7 | Tombol `Panduan Juri` | `dashboard/page.tsx` | **HAPUS** | - | Tombol khusus juri tidak boleh ada di dashboard operasional pemilik usaha (sudah tersedia di sidebar navigasi). |
| **Area 2: AI Voice Morning Briefing Player** | | | | | |
| 8 | `AI Voice Morning Briefing` (Judul) | `morning-briefing-player.tsx` | **SEDERHANAKAN** | `Briefing Suara Pagi` | Menghilangkan istilah bahasa asing "AI Voice Morning Briefing". |
| 9 | Badge status (`Menyiapkan...`, `Sedang Berbicara`, `Dijeda`, `Selesai`, `Siap Diputar`) | `morning-briefing-player.tsx` | **PERTAHANKAN** | (Tetap) | Status kontrol audio yang jelas bagi pengguna. |
| 10 | `Ringkasan 3 Pertanyaan Pagi • Est. ~35 detik` / `Sintesis otomatis dari PnL kemarin...` | `morning-briefing-player.tsx` | **SEDERHANAKAN** | `Ringkasan kondisi usaha dalam ~35 detik` | Menghapus istilah "PnL kemarin, anomali terbuka & rekomendasi mutasi". |
| 11 | Tombol kontrol audio (`Mulai Briefing`, `Jeda`, `Lanjutkan`, `Putar Ulang`, `Tutup`) | `morning-briefing-player.tsx` | **PERTAHANKAN** | (Tetap) | Kontrol interaktif standar yang fungsional. |
| 12 | Stepper 5 pilar (`SALAM`, `LABA`, `PERHATIAN`, `TINDAKAN`, `PENUTUP`) | `morning-briefing-player.tsx` | **SEDERHANAKAN** | Indikator progres 3 langkah ringkas | 5 kotak sempit dengan teks 10 px menyebabkan tampilan sesak di HP mobile 360 px. |
| 13 | Subtitle narasi aktif (`"Selamat pagi Pak Budi..."`) & progress bar | `morning-briefing-player.tsx` | **PERTAHANKAN** | (Tetap) | Sangat membantu jika pengguna mematikan suara perangkat atau di lingkungan bising. |
| 14 | `Suara: Standar Bahasa Indonesia` & `Web Speech API (Zero API Cost)` | `morning-briefing-player.tsx` | **HAPUS** | - | "Web Speech API (Zero API Cost)" adalah jargon teknis/arsitektur developer, bukan untuk pengguna. |
| 15 | Pesan peringatan browser tidak mendukung audio / error | `morning-briefing-player.tsx` | **PERTAHANKAN** | (Tetap) | State error penting untuk aksesibilitas dan transparansi sistem. |
| **Area 3: 3 Kartu Shortcut Cepat (Quick Actions)** | | | | | |
| 16 | Kartu `Buka Kasir Voice POS` ("Input transaksi 2 detik & cetak struk") | `dashboard/page.tsx` | **HAPUS** | - | Menduplikasi menu navigasi sidebar/drawer; menyita ruang atas layar HP sebelum pemilik melihat jawaban bisnis. |
| 17 | Kartu `Catat Beban Operasional` ("Input biaya harian lisan atau manual") | `dashboard/page.tsx` | **HAPUS** | - | Menduplikasi navigasi menu; font 12 px melanggar prinsip teks minimum 14 px. |
| 18 | Kartu `Laporan Laba Rugi Auto-Ledger` ("Ekspor format resmi PDF siap bank/KUR") | `dashboard/page.tsx` | **HAPUS** | - | Menduplikasi navigasi menu; mengandung klaim promosi bank/KUR yang berulang. |
| **Area 4: Tab Switcher & Status Sistem** | | | | | |
| 19 | Tab Switcher (`Ikhtisar`, `Performa Cabang Aktif (3)`, `Deteksi Anomali Terbuka (X)`) | `dashboard/page.tsx` | **HAPUS** | - | Tab menyembunyikan informasi. Jawaban 3 pertanyaan harus langsung tersaji dalam 1 layar tanpa klik tab. Data cabang dan anomali disatukan ke Kartu 1 dan 2. |
| 20 | Teks `PostgreSQL RLS Multi-Tenant Aktif` | `dashboard/page.tsx` | **HAPUS** | - | Jargon teknis database murni yang tidak boleh muncul di hadapan pemilik UMKM. |
| **Area 5: Strip 4 Metrik (MetricStrip)** | | | | | |
| 21 | Judul strip `Indikator Kunci Keputusan 3 Pagi (D-1 s.d. Fajar Ini)` & link `Buka Buku Besar` | `dashboard/page.tsx` | **HAPUS** | - | Strip 4 metrik horizontal ini menduplikasi isi kartu di bawahnya dan sulit dibaca di layar HP 360 px. |
| 22 | Metrik 1: `Pertanyaan 1: Kemarin Untung / Rugi?` (`+Rp 2.730.000`, `Margin 70.9%`, `+12.4% vs target`) | `dashboard/page.tsx` | **PINDAH KE DETAIL** | Dipindah sebagai angka utama di **Kartu 1** | Angka laba dan perbandingan target menjadi inti dari Kartu 1, rumus margin dipindah ke detail. |
| 23 | Metrik 2: `Uang Fisik Kasir di Laci (Register)` (`Rp 2.140.000`, `Selisih Rp 0`, `Rekonsiliasi 100%`) | `dashboard/page.tsx` | **PINDAH KE DETAIL** | Poin ringkas di Kartu 1: `Uang fisik kasir klop (Rp 2.140.000)` | Detail rekonsiliasi dan transaksi dimasukkan ke panel detail kartu 1. |
| 24 | Metrik 3: `Pertanyaan 2: Deteksi Anomali Sistem` (`Modified Z-score > 2.5`) | `dashboard/page.tsx` | **PINDAH KE DETAIL** | Dipindah sebagai inti **Kartu 2** | Frasa "Modified Z-score > 2.5" dihapus total; jumlah item perlu dicek jadi status chip Kartu 2. |
| 25 | Metrik 4: `Pertanyaan 3: Rekomendasi Mutasi` (`Potensi Laba: +Rp X`, `Hemat Ongkir`) | `dashboard/page.tsx` | **PINDAH KE DETAIL** | Dipindah sebagai inti **Kartu 3** | Jumlah tindakan dipindah ke Kartu 3. |
| **Area 6: Kartu 1 — "Kemarin untung atau rugi?"** | | | | | |
| 26 | Judul Kartu 1: `Kemarin untung atau rugi?` | `dashboard/page.tsx` | **PERTAHANKAN** | `Kemarin untung atau rugi?` | Format pertanyaan langsung sesuai prinsip PRD dan aturan satu kartu = satu jawaban. |
| 27 | Angka utama: `Untung Rp 2.730.000` (atau `Rugi Rp ...`) font 32 px bold | `dashboard/page.tsx` | **PERTAHANKAN** | `Untung Rp 2.730.000` | Jawaban utama 10 detik. |
| 28 | Chip status: `Untung ✅` (Hijau) / `Rugi ⚠️` (Merah) | `dashboard/page.tsx` | **PERTAHANKAN** | (Ikon + teks jelas) | Memberikan sinyal visual instan. |
| 29 | Teks perbandingan: `Naik 12% dibanding hari sebelumnya` | `dashboard/page.tsx` | **PERTAHANKAN** | (Tetap) | Kalimat pendek dalam bahasa awam. |
| 30 | Istilah `HPP Rp 1.120.000`, `COGS`, `Margin 70.9%` | `dashboard/page.tsx` | **PINDAH KE DETAIL** | Di panel detail: `Modal barang: Rp 1.120.000 (Persentase untung: 71%)` | Menghilangkan singkatan akuntansi asing dari tampilan utama. |
| 31 | Poin ringkasan: `Total omzet kemarin: Rp 3.850.000` & `Uang kas di laci klop` | `dashboard/page.tsx` | **PERTAHANKAN** | (Maksimal 3 poin ringkas) | Poin pendukung yang mudah dipahami. |
| 32 | Leaderboard Cabang (Maksimal 3 baris teratas) | `dashboard/page.tsx` | **SEDERHANAKAN** | 3 baris: nama cabang, laba bersih, % target harian | Tampilan bersih 3 baris teratas untuk mengetahui cabang juara dan cabang yang butuh dorongan. |
| 33 | Tautan / tombol aksi: `Lihat Laporan Lengkap` | `dashboard/page.tsx` | **PERTAHANKAN** | `Lihat Laporan Lengkap` (Tautan ke `/reports`) | Satu tombol aksi utama per kartu. |
| **Area 7: Kartu 2 — "Apa yang harus diperhatikan?"** | | | | | |
| 34 | Judul: `Pertanyaan 2: Apa yang Harus Diperhatikan?` | `dashboard/page.tsx` | **SEDERHANAKAN** | `Apa yang harus diperhatikan?` | Menghilangkan embel-embel nomor "Pertanyaan 2:". |
| 35 | Deskripsi: `Algoritma Modified Z-Score mendeteksi lonjakan beban abnormal...` | `dashboard/page.tsx` | **HAPUS** | - | Jargon statistik "Modified Z-Score"; penjelasan teknis dipindah ke panel detail jika perlu. |
| 36 | Chip status / Badge: `${total_open} Anomali Terbuka` | `dashboard/page.tsx` | **SEDERHANAKAN** | `${total_open} Perlu Dicek` / `Semua Aman` | Mengganti kata "Anomali" dengan "Perlu dicek" sesuai pedoman istilah. |
| 37 | Badge keparahan bahasa Inggris: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` | `dashboard/page.tsx` | **SEDERHANAKAN** | `Mendesak`, `Perlu Dicek`, `Info` | Menghilangkan istilah bahasa Inggris. |
| 38 | Angka statistik teknis: `Modified Z-Score: 3.42` | `dashboard/page.tsx` | **PINDAH KE DETAIL** | Dipindah ke panel detail anomali | Pengguna awam tidak memahami arti angka Z-Score 3.42. |
| 39 | Kalimat penjelasan anomali (misal: "Lonjakan beban kategori Perawatan...") | `dashboard/page.tsx` | **SEDERHANAKAN** | `Pengeluaran Perawatan Rp 850.000, sekitar 8× dari biasanya.` | Kalimat awam bahasa Indonesia, 1 kalimat = 1 ide. |
| 40 | Metadata ID / Branch ID / UUID internal | `dashboard/page.tsx` | **HAPUS** | - | Kode internal dan ID dihapus total sesuai aturan. |
| 41 | Batasan item anomali (sebelumnya tak terbatas) | `dashboard/page.tsx` | **SEDERHANAKAN** | Maksimal 3 item terpenting + tombol `Lihat semua (X lainnya)` | Mencegah kartu memanjang tak terkontrol di HP. |
| 42 | Tombol aksi per item: `Tinjau` | `dashboard/page.tsx` | **PERTAHANKAN** | `Periksa` atau `Tinjau` | Membuka modal konfirmasi resolusi. |
| **Area 8: Kartu 3 — "Apa yang harus dilakukan?"** | | | | | |
| 43 | Judul: `Pertanyaan 3: Apa yang Harus Dilakukan?` | `dashboard/page.tsx` | **SEDERHANAKAN** | `Apa yang harus dilakukan?` | Menghilangkan embel-embel "Pertanyaan 3:". |
| 44 | Deskripsi: `Daftar tindakan eksekusi cerdas: resolusi audit anomali biaya cabang...` | `dashboard/page.tsx` | **HAPUS** | - | Subjudul dekoratif redundan. |
| 45 | Chip status: `${total} Tindakan Siap` | `dashboard/page.tsx` | **SEDERHANAKAN** | `${total} Tindakan Disarankan` | Bahasa lebih natural. |
| 46 | Grafik Perkiraan Omzet 7 Hari (Recharts) | `components/stock/stock-forecast-chart.tsx` & `dashboard/page.tsx` | **SEDERHANAKAN** | Grafik garis bersih 7 hari + area rentang tanpa angka teknis | Sesuai PRD FR-4.3: grafik perkiraan omzet 7 hari yang bersih dan mudah dibaca di mobile. |
| 47 | Istilah model: `Holt-Winters (musiman 7 hari)` / `Seasonal Naive` | `stock-forecast-chart.tsx` | **PINDAH KE DETAIL** | Di panel detail: `Metode: Holt-Winters (pola mingguan)` | Nama algoritma disembunyikan dari layar utama. |
| 48 | Metrik akurasi teknis: `WAPE 11.8%` | `stock-forecast-chart.tsx` | **SEDERHANAKAN** | `Akurasi perkiraan: Baik` (ambang WAPE) | Angka WAPE teknis dipindah ke panel detail. |
| 49 | Kode SKU produk: `(SKU-SRP-01)` | `dashboard/page.tsx` | **HAPUS** | - | Kode SKU internal dihapus dari tampilan utama; owner mengenali nama produk. |
| 50 | Label: `CABANG DONOR (SURPLUS)` dan `CABANG PENERIMA (DEFISIT)` | `dashboard/page.tsx` | **SEDERHANAKAN** | `Dari: Thamrin` & `Ke: Dago` | Istilah awam yang jauh lebih cepat dipahami. |
| 51 | Teks mutasi stok: `Mutasi Cerdas ->`, `12 -> 8 unit` | `dashboard/page.tsx` | **SEDERHANAKAN** | `Pindahkan 4 unit` | Langsung sebutkan intinya, tanpa teks perantara. |
| 52 | Label `Cadangan pasokan: 7 hari aman` / `days of cover` | `dashboard/page.tsx` | **SEDERHANAKAN** | `Stok cukup untuk ±7 hari` | Sesuai pedoman pengganti istilah PRD. |
| 53 | Teks benefit: `Keuntungan Bersih: +Rp 145.000 (Setelah ongkir Rp 15.000)` | `dashboard/page.tsx` | **SEDERHANAKAN** | `Potensi hemat: Rp 145.000` | Sederhana dan singkat. Rincian ongkir dipindah ke detail. |
| 54 | Tombol eksekusi: `Eksekusi Mutasi Stok 1-Klik (4 Unit)` / `Memproses Mutasi Stok Melalui RPC Database...` | `dashboard/page.tsx` | **SEDERHANAKAN** | `Terapkan (Pindahkan 4 Unit)` / `Memproses...` | Hapus kata "Eksekusi Mutasi Stok 1-Klik" dan "RPC Database". |
| 55 | Batasan item rekomendasi tindakan | `dashboard/page.tsx` | **SEDERHANAKAN** | Maksimal 3 item tindakan utama (mutasi / restock) + tautan `Lihat semua tindakan` | Memenuhi kriteria maksimal 3 poin per kartu. |
| **Area 9: Tren Finansial 7 Hari Terakhir & Right Rail** | | | | | |
| 56 | Kartu `Tren Finansial 7 Hari Terakhir` (Grafik batang omzet vs beban masa lalu) | `dashboard/page.tsx` | **HAPUS** | - | Grafik 7 hari masa lalu menduplikasi halaman `/reports` dan memakan layar vertikal. Digantikan oleh Grafik Perkiraan 7 Hari ke Depan di Kartu 3. |
| 57 | Kartu Right Rail: `Capaian Target Hari Ini` | `dashboard/page.tsx` | **HAPUS** | - | Menduplikasi Leaderboard Cabang yang sudah terintegrasi rapi di Kartu 1. |
| 58 | Kartu Right Rail: `Kapasitas & Integritas Akun` (`PostgreSQL RLS`, `Log Audit Anti-Fraud`, `Standar Pengajuan KUR`) | `dashboard/page.tsx` | **HAPUS** | - | Informasi teknis murni yang tidak relevan bagi owner UMKM di pagi hari. |
| 59 | Kartu Right Rail: `Panduan Pengujian Juri` (Kartu tema gelap GTNIC) | `dashboard/page.tsx` | **HAPUS** | - | Identitas lomba juri dihapus dari dashboard; akses panduan tetap ada di navigasi samping. |
| **Area 10: Modal Resolusi & Notifikasi Toast** | | | | | |
| 60 | Judul modal: `Resolusi Anomali Finansial` | `dashboard/page.tsx` | **SEDERHANAKAN** | `Pemeriksaan Pengeluaran` | Istilah lebih ramah dan tidak mengintimidasi. |
| 61 | Label modal: `Catatan Pemilik Usaha (Opsional):` | `dashboard/page.tsx` | **PERTAHANKAN** | (Tetap) | Label input formulir yang jelas. |
| 62 | Tombol modal: `Abaikan (Dismiss)` | `dashboard/page.tsx` | **SEDERHANAKAN** | `Abaikan` | Menghilangkan kata bahasa Inggris "(Dismiss)". |
| 63 | Tombol modal: `Tandai Selesai` | `dashboard/page.tsx` | **PERTAHANKAN** | (Tetap) | Aksi konfirmasi resolusi. |
| 64 | Toast notifikasi sukses mutasi & resolusi | `dashboard/page.tsx` | **PERTAHANKAN** | (Tetap, ukuran font disesuaikan ke minimal 14 px) | Umpan balik langsung kepada pemilik usaha bahwa aksi berhasil dieksekusi. |

---

## 3. Ringkasan Statistik Audit

Dari **64 elemen teks dan visual** yang diaudit di seluruh dashboard:

| Keputusan | Jumlah Elemen | Persentase | Tindak Lanjut Utama |
|:---|:---:|:---:|:---|
| **PERTAHANKAN** | 18 | 28.1% | Jawaban inti, angka besar, kontrol audio briefing, tombol aksi primer, dan status loading/error. |
| **SEDERHANAKAN** | 22 | 34.4% | Mengubah istilah teknis/ML/asing menjadi bahasa Indonesia awam yang ramah, membatasi item maks 3 poin. |
| **PINDAH KE DETAIL** | 8 | 12.5% | Istilah Z-score, akurasi WAPE matematis, nama model, rumus HPP/margin, dan selisih kas fisik. |
| **HAPUS** | 16 | 25.0% | Label lomba GTNIC, jargon database RLS, kartu dekoratif kapasitas akun, kartu pengujian juri, kartu shortcut menu berulang, dan deskripsi redundan. |
| **TOTAL** | **64** | **100%** | |

---

## 4. Kamus Penggantian Istilah Teknis

| Istilah Asli (Teknis / Asing) | Teks Pengganti di Tampilan Utama | Lokasi Angka / Detail Asli |
|:---|:---|:---|
| `Z-score`, `Modified Z-score`, `MAD`, `Skor anomali` | `Pengeluaran [Kategori] Rp X, sekitar Y× dari biasanya.` | Angka Z-score dipindah ke panel "Detail analisis". |
| `Anomali`, `Deteksi Anomali Sistem` | `Pengeluaran tidak biasa` atau `Perlu dicek` | Dicatat di riwayat pengeluaran. |
| `Forecast`, `Holt-Winters musiman 7 hari`, `Seasonal Naive` | `Perkiraan 7 hari ke depan` | Nama model dipindah ke panel "Detail analisis". |
| `WAPE`, `Confidence Interval`, `Upper/Lower bound` | `Akurasi perkiraan: Baik / Cukup / Rendah` | Persentase WAPE asli dipindah ke panel "Detail analisis". |
| `days of cover`, `days of supply`, `min_stock_alert` | `Stok cukup untuk ±X hari` atau `Stok menipis` | Angka laju harian di halaman Stok. |
| `Net margin`, `COGS`, `HPP` | `Untung bersih`, `Modal barang` | Detail perhitungan di Laporan Laba Rugi (`/reports`). |
| `SKU`, `Branch ID`, `UUID`, `Database table/column` | Dihapus total dari tampilan utama (cukup nama produk & cabang). | Tidak ditampilkan ke pemilik usaha. |
| `GTNIC 2026`, `Garda Tech`, `Panduan Juri` di dashboard | Dihapus dari dashboard (tetap ada di footer landing page & README). | Menu sidebar "Panduan Demo" untuk juri tetap ada. |
| `PostgreSQL RLS`, `Anti-Fraud Log`, `RPC Database` | Dihapus total dari dashboard. | Bekerja di balik layar secara aman tanpa dipamerkan. |
| `Abaikan (Dismiss)` | `Abaikan` | Menghilangkan serapan asing dalam kurung. |

---

## 5. Usulan Ambang Batas Akurasi Perkiraan (WAPE ke Bahasa Awam)

Untuk memenuhi PRD FR-4.3 tanpa membingungkan pemilik UMKM dengan istilah *Weighted Absolute Percentage Error (WAPE)*, kami mengusulkan konversi otomatis nilai WAPE ke status bahasa awam berikut:

| Ambang Batas WAPE | Label Status di Dashboard | Indikator Visual | Penjelasan bagi Pemilik Usaha | Teks di Panel "Detail Analisis" |
|:---|:---|:---|:---|:---|
| **WAPE $\le$ 15%** | **Akurasi Perkiraan: Baik** | Chip Hijau (`emerald`) | Perkiraan sangat dekat dengan pola penjualan asli. | `Tingkat error (WAPE): X.X% • Model: Holt-Winters (Musiman 7 Hari)` |
| **15% < WAPE $\le$ 30%** | **Akurasi Perkiraan: Cukup** | Chip Kuning (`amber`) | Perkiraan cukup dapat diandalkan sebagai panduan belanja. | `Tingkat error (WAPE): X.X% • Model: Seasonal Naive / Moving Average` |
| **WAPE > 30%** (atau data < 7 hari) | **Akurasi Perkiraan: Perlu Pemantauan** | Chip Netral (`slate`) | Riwayat transaksi masih sedikit; perkiraan bersifat sementara. | `Tingkat error (WAPE): X.X% • Data transaksi masih dalam fase pembelajaran` |

---

## 6. Arsitektur Tampilan Baru Dashboard Minimalis ("3 Pertanyaan Pagi")

Dengan eliminasi elemen dekoratif dan perintilan teknis, struktur dashboard menjadi sangat terarah:

```
+---------------------------------------------------------------------------------+
| HEADER: Sapaan Personal ("Selamat Pagi, Pak Budi") + Tanggal Lokal              |
| Aksi: [Dengarkan Briefing Suara Pagi]  [Segarkan]                               |
+---------------------------------------------------------------------------------+
| BRIEFING PLAYER (Opsional): Player audio ringkas 3 langkah (~35 detik)          |
+---------------------------------------------------------------------------------+
| KARTU 1: KEMARIN UNTUNG ATAU RUGI?                                             |
| * Angka Besar: Untung Rp 2.730.000  [Chip: Untung ✅]                           |
| * Perbandingan: "Naik 12% dibanding hari sebelumnya"                            |
| * Poin Ringkas (Maks 3): Omzet kemarin Rp 3,85jt | Kas di laci klop             |
| * Leaderboard Cabang (3 baris): Thamrin (92%), Dago (88%), Gubeng (76%)         |
| * Aksi: [Lihat Laporan Lengkap ->]                                              |
+---------------------------------------------------------------------------------+
| KARTU 2: APA YANG HARUS DIPERHATIKAN?                                           |
| * Status: 1 Pengeluaran Perlu Dicek  [Chip: Perlu Dicek ⚠️]                     |
| * Daftar Item (Maks 3 item awam):                                               |
|   - "Pengeluaran Perawatan di Dago Rp 850.000, sekitar 8× dari biasanya"        |
|     [Tombol: Periksa]                                                           |
| * Aksi: [Tautan: Lihat Semua Catatan (jika > 3)]                                |
+---------------------------------------------------------------------------------+
| KARTU 3: APA YANG HARUS DILAKUKAN?                                             |
| * Perkiraan 7 Hari: Grafik garis perkiraan bersih [Chip: Akurasi: Baik]         |
| * Tindakan Cerdas (Maks 3 item):                                                |
|   - Pindahkan 4 unit Sirup Karamel (dari Thamrin ke Dago) -> Hemat Rp 145.000   |
|     [Tombol: Terapkan]                                                          |
|   - Belanja Restock Biji Kopi Robusta 10 kg -> Stok cukup untuk 2 hari          |
|     [Tombol: Catat Belanja]                                                     |
| * Aksi: [Tautan: Buka Rencana Stok Lengkap ->]                                  |
+---------------------------------------------------------------------------------+
| PANEL COLLAPSIBLE (Bawah): "Lihat Detail Analisis & Catatan Teknis"             |
| * WAPE %, Z-score, nama model matematika, status database Supabase              |
+---------------------------------------------------------------------------------+
```
Semua teks berada pada ukuran $\ge$ 14 px (`text-sm`), nyaman dioperasikan satu jempol di HP 360 px, dan dapat dipahami secara tuntas dalam tempo 10 detik.
