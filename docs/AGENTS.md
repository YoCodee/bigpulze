# AGENTS.md: Aturan Kerja Proyek BizPulse

Dokumen ini dibaca di awal setiap sesi. Ikuti tanpa perlu diingatkan.

## 1. Tentang proyek

BizPulse adalah aplikasi web POS multi-cabang untuk UMKM (Next.js + Supabase) dengan input suara, pembukuan otomatis, dan dashboard keputusan harian berbasis analitik ML (deteksi anomali + forecast). Dibuat untuk kompetisi GTNIC 2026 Web Development, deadline 10 November 2026 pukul 23.59 WIB.

## 2. Sumber kebenaran

- **Spesifikasi lengkap: `docs/prdBigPulze.md`.** Baca bagian 0 dan 3 sebelum mengerjakan apa pun, lalu bagian yang relevan dengan tugas.
- **Progres: `docs/progress.md`.** Baca di awal sesi, perbarui di akhir setiap tugas.
- **Asumsi: `docs/assumptions.md`.** Catat setiap keputusan yang tidak diatur PRD (tanggal, konteks, keputusan).
- Jika instruksi dari saya bertentangan dengan PRD, **tanyakan dulu**, jangan memilih sendiri.

## 3. Aturan utama (tidak boleh dilanggar)

1. Jangan mengubah keputusan teknis di PRD bagian 3 tanpa persetujuan saya.
2. Jangan menambah fitur di luar PRD. Fitur di bagian 5.2 (Non-Goals) dilarang.
3. Kerjakan sesuai urutan tahap di PRD bagian 17. Jangan mengerjakan tahap berikutnya sebelum kriteria tahap saat ini terpenuhi.
4. Prioritas fitur: P0 dulu, lalu P1, lalu P2.
5. Jika ada hal yang tidak diatur PRD: pilih opsi paling sederhana yang konsisten dengan bagian 3, lalu catat di `docs/assumptions.md`. Hanya berhenti dan bertanya jika menyangkut keamanan atau risiko kehilangan data.
6. Jangan menulis ulang atau merefaktor kode yang tidak terkait tugas saat ini.

## 4. Aturan keamanan dan data

- **Stok hanya boleh berubah lewat RPC database** (`create_sale`, `restock_product`, dan lainnya). Dilarang `UPDATE products SET stock` dari kode aplikasi.
- Semua uang bertipe `BIGINT` rupiah utuh. Jangan memakai float untuk uang.
- Semua tanggal bisnis memakai zona waktu `Asia/Jakarta` (WIB), bukan UTC.
- Semua tabel wajib Row Level Security. Setiap RPC `SECURITY DEFINER` wajib memeriksa org dan role sendiri.
- `SUPABASE_SERVICE_ROLE_KEY` hanya boleh dipakai di kode server dan tidak boleh berawalan `NEXT_PUBLIC_`.
- Semua input di server divalidasi dengan Zod.
- **Jangan pernah membuat, mengisi, atau meng-commit file `.env`, password, token, atau API key.** Jika butuh variabel lingkungan, beri tahu saya nama variabelnya dan saya isi sendiri.

## 5. Teknologi dan struktur

- Next.js 14 (App Router, React 18, TypeScript strict), Tailwind CSS, shadcn/ui, Recharts.
- Supabase (PostgreSQL, Auth, RLS, RPC). Deploy ke Vercel dengan Root Directory = `frontend`.
- Satu proyek Next.js di `frontend/` (UI + API Route Handlers). Tidak ada server Python.
- ML dan parser ditulis TypeScript di `frontend/src/server/ml/` dan `frontend/src/server/parsers/`, dalam bentuk fungsi murni yang bisa diuji.
- SQL ada di `database/` (`schema.sql`, `functions.sql`, `rls.sql`).

## 6. Konvensi kode

- Teks antarmuka: **Bahasa Indonesia**. Kode, nama variabel, nama tabel, dan komentar kode: **Bahasa Inggris**.
- Database `snake_case`, TypeScript `camelCase`, rute URL `kebab-case`, JSON API `snake_case`.
- Semua respons API memakai format di PRD bagian 12.1 (`{ data }` atau `{ error: { code, message } }`).
- Rupiah ditampilkan dengan `Intl.NumberFormat('id-ID')`, contoh `Rp 1.250.000`.
- Komponen kecil dan fokus. Hindari file di atas ±300 baris.
- Tidak ada `any` tanpa alasan yang ditulis di komentar.

## 7. Perintah (dijalankan dari folder `frontend/`)

```
npm run dev          # jalankan lokal
npm run typecheck    # pemeriksaan tipe
npm run lint         # linting
npm run test         # unit test (Vitest)
npm run build        # build produksi
```

## 8. Definisi selesai (Definition of Done)

Sebuah tugas baru boleh disebut selesai jika:

- [ ] Semua kriteria penerimaan fitur di PRD terpenuhi.
- [ ] `npm run typecheck`, `npm run lint`, dan `npm run test` lulus (tampilkan hasilnya).
- [ ] Ada state loading, error, dan kosong pada halaman data.
- [ ] Tampil baik di lebar 360 px, 768 px, dan 1280 px.
- [ ] Tidak ada error di console browser pada alur utama.
- [ ] Tidak ada secret atau `.env` di perubahan.
- [ ] `docs/progress.md` sudah diperbarui.

## 9. Cara bekerja

1. **Awal sesi:** baca `AGENTS.md`, `docs/progress.md`, dan bagian PRD yang relevan.
2. **Sebelum menulis kode** untuk tugas besar: sampaikan rencana singkat (file yang akan dibuat atau diubah) lalu tunggu persetujuan saya.
3. **Saat bekerja:** kerjakan satu tugas kecil sekali waktu. Satu tugas selesai = satu commit dengan pesan konvensional (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
4. **Bug:** cari akar masalah dulu dan jelaskan penyebabnya. Tambahkan test yang gagal sebelum perbaikan dan lulus sesudahnya. Jangan menambal gejala.
5. **Akhir tugas:** laporkan (a) apa yang dibuat atau diubah, (b) hasil typecheck, lint, dan test, (c) apa yang **belum** teruji atau belum selesai, (d) asumsi yang diambil.
6. Jangan mengklaim "sudah berfungsi" tanpa bukti (output test atau langkah verifikasi yang dijalankan). Jika sesuatu tidak bisa diuji di lingkungan kerja, katakan terus terang.

## 10. Hal yang dilarang

- Mengubah skema database tanpa memperbarui `database/*.sql` dan PRD bagian 7.
- Memakai library di luar daftar PRD bagian 3 (D13) tanpa izin.
- Menghapus atau menonaktifkan test agar build lulus.
- Menonaktifkan RLS atau memakai service role di sisi klien untuk "mempermudah".
- Menulis data demo atau data nyata ke repo selain lewat seeder.

## Aturan desain

- Sumber gaya visual: docs/design-system.md. Rujukan visual: folder redesign/.
- Tiru bahasa desain, bukan aset atau merek pihak referensi.
- Pakai tokens (CSS variables / Tailwind config), jangan hardcode warna atau ukuran.
- Perubahan tampilan tidak boleh mengubah logika, API, atau skema database.
