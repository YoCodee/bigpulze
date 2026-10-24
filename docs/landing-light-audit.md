# Audit Landing Page: Dark → Light Theme

**Dibuat:** 2026-10-24  
**Cakupan:** Rute `/` dan komponen landing-specific saja.  
**File utama:** `frontend/src/app/page.tsx` (1449 baris), `frontend/src/components/ui/blueprint-grid.tsx`, `frontend/src/app/layout.tsx`, `frontend/src/app/globals.css`

---

## 1. Catatan Kontras Aksen Oranye

Sebelum audit, perlu dipahami bahwa seluruh aksen oranye (`brand-*`) GAGAL WCAG AA untuk teks di atas latar putih:

| Warna | Hex | Kontras vs White | Keterangan |
|---|---|---|---|
| `brand-400` | `#F89E59` | **2.09:1** | ❌ Gagal semua (UI pun perlu 3:1) |
| `brand-500` | `#F6821F` | **2.58:1** | ❌ Gagal semua |
| `brand-600` | `#C2641A` | **4.09:1** | ❌ Gagal teks (butuh 4.5:1), lulus UI grafis (3:1) |
| `EA580C` | `#EA580C` | **3.56:1** | ❌ Gagal teks, lulus UI grafis |
| `orange-700` | `#C2410C` | **5.18:1** | ✅ Lulus WCAG AA untuk teks (4.5:1) |
| `orange-800` | `#9A3412` | **7.31:1** | ✅ Lulus WCAG AAA untuk teks |

**Keputusan:** Untuk teks oranye di atas putih, gunakan `#C2410C` (`orange-700`). Untuk elemen dekoratif/grafis, `#EA580C` atau `brand-500` tetap boleh dipakai karena ambang-nya hanya 3:1.

---

## 2. Tabel Audit Lengkap

### A. Root Layout & Global CSS

| Elemen / Lokasi | File | Masalah di Latar Putih | Solusi |
|---|---|---|---|
| `<html lang="id">` — tidak ada `class` | `layout.tsx:29` | Body mengikuti `:root` CSS vars (bg putih). Sudah oke untuk dark area aplikasi. Tidak ada masalah. | Tambahkan class `landing` pada `<html>` atau gunakan wrapper di `page.tsx`. |
| `body { @apply bg-background text-foreground }` | `globals.css:74-75` | `--background: 0 0% 100%` (putih) sudah benar. `--foreground: 222.2 84% 4.9%` (hitam gelap) sudah benar. | Tidak perlu diubah; `BlueprintCanvas` yang menimpa bg menjadi `#0A0A0C`. |
| `.bg-dot-grid` | `globals.css:88-91` | Dot warna putih (`rgba(255,255,255,0.22)`) — di latar putih tidak terlihat. | Buat kelas baru `.bg-dot-grid-light` dengan dot abu-abu gelap `rgba(0,0,0,0.08)`. |
| `.bg-dot-grid-dark` | `globals.css:94-97` | Dot warna putih — dipakai di latar gelap (BlueprintCanvas). Tidak bermasalah untuk landing gelap. | Tidak diubah (tetap untuk elemen hero & canvas gelap). |
| `.bg-dot-matrix` | `globals.css:116-119` | Dot `rgba(255,255,255,0.09)` — dipakai di `BlueprintCanvas` gutter. Di latar putih tak terlihat. | Buat kelas `.bg-dot-matrix-light` dengan `rgba(0,0,0,0.05)`. |
| `.border-blueprint` | `globals.css:122-124` | `border-color: #26282D` (gelap). Dipakai di komponen `DashedRule`, dsb. | Di latar terang, ubah ke `#E5E7EB` (slate-200). Tambah class `.border-blueprint-light`. |
| `--accent: 27 92% 54%` (= `#F6821F`) | `globals.css:27` | Kontras 2.58:1 vs putih — gagal WCAG AA. | Jangan ubah nilai global (dipakai app). Tentukan nilai khusus landing dengan CSS var yang di-scope ke wrapper `.landing`. |
| `selection:bg-brand-500 selection:text-white` | `page.tsx:238` | `brand-500` (#F6821F) kontras buruk di latar putih. | Ubah ke `selection:bg-orange-700 selection:text-white` di dalam wrapper landing. |

---

### B. BlueprintCanvas (Pembungkus Seluruh Landing)

| Elemen / Lokasi | File | Masalah di Latar Putih | Solusi |
|---|---|---|---|
| `bg-[#0A0A0C]` — latar gelap seluruh halaman | `blueprint-grid.tsx:211` | Ini yang membuat landing GELAP. Ini adalah elemen utama yang harus diubah. | Ganti dengan token: `bg-[var(--landing-canvas)]` = `#FFFFFF` |
| `border-[#26282D]` — garis guide vertikal dashed | `blueprint-grid.tsx:220,224` | Warna terlalu gelap untuk latar putih — akan tampak seperti garis hitam mencolok. | Ubah ke `border-slate-200` (`#E5E7EB`) atau token `var(--landing-grid-line)` |
| `bg-dot-matrix` — koridor gutter kiri/kanan | `blueprint-grid.tsx:222,235` | Dot putih tak terlihat di latar putih. | Ubah ke kelas baru `.bg-dot-matrix-light` |
| `className="min-h-screen text-white flex flex-col..."` | `page.tsx:238` | `text-white` menjadi default teks putih — akan hilang di latar putih. | Ubah ke `text-slate-900` dalam konteks landing |

---

### C. Navbar / Header

| Elemen / Lokasi | File | Masalah di Latar Putih | Solusi |
|---|---|---|---|
| `bg-[#0A0A0C]/90 backdrop-blur-md border-b border-[#26282D]` | `page.tsx:242` | Latar gelap navbar; border gelap. | Ganti ke `bg-white/95 border-b border-slate-200` |
| `text-white` pada `span>BizPulse` | `page.tsx:259` | Teks putih hilang di putih. | Ganti ke `text-slate-900` |
| `text-zinc-300` nav links | `page.tsx:263` | Warna abu-abu gelap tidak cukup kontras di putih (kontras ~1.7:1). | Ganti ke `text-slate-600 hover:text-slate-900` |
| `hover:text-white` nav links | `page.tsx:264,267,271,273` | Hover putih jadi tidak terlihat di latar putih. | Ganti ke `hover:text-slate-900` |
| Tombol "Masuk"/"Dashboard" — `bg-white text-slate-950` | `page.tsx:283,290` | Di latar putih, tombol putih hilang (tidak ada kontras border). | Ubah ke `bg-slate-900 text-white hover:bg-slate-700` (tombol dark pill) |
| Logo SVG icon di dalam `bg-brand-500` | `page.tsx:246` | `bg-brand-500` dengan `text-white` = kontras SVG OK. Tapi check apakah brand-500 (oranye) di latar putih navbar ok. | Pertahankan — oranye 30% latar SVG dengan icon putih masih kontras (garis putih di bg oranye ok). |

---

### D. Hero Section

| Elemen / Lokasi | File | Masalah di Latar Putih | Solusi |
|---|---|---|---|
| `bg-hero-gradient` pada container hero | `page.tsx:303` | Gradasi oranye menyala (`#F6821F → #E65A00`). Di latar putih, ini akan tampak berdiri sendiri sebagai kotak oranye — justru BAGUS dan dipertahankan. | **PERTAHANKAN** — hero tetap oranye. Ini adalah feature card, bukan background. |
| `bg-dot-grid opacity-35` di dalam hero | `page.tsx:305` | Dot putih di atas oranye = OK karena bg-hero-gradient sudah oranye. | **PERTAHANKAN** |
| `bg-white/20 blur-[100px]` glow hero bawah | `page.tsx:308` | Di latar putih di luar hero, glow ini mungkin tidak terlihat beda. | **PERTAHANKAN** — glow ini hanya di dalam div oranye hero, tidak bocor. |
| Pill badge `border-white/30 bg-white/10 text-white` | `page.tsx:313` | Sudah di dalam hero oranye — putih di atas oranye OK. | **PERTAHANKAN** |
| `GTNIC 2026 • Asisten Keputusan...` (teks pill) | `page.tsx:315` | Konten pertahankan untuk landing (bukan dashboard). | **PERTAHANKAN** di landing. |
| `h1 text-white` headline hero | `page.tsx:322` | Di dalam hero oranye, putih sudah ok. | **PERTAHANKAN** |
| Tombol CTA "Mulai Demo" — `bg-white text-slate-900` | `page.tsx:335` | Putih di atas oranye — kontras sangat baik (~8.6:1). | **PERTAHANKAN** |
| Tombol "Buka Dashboard" — `border-white/30 bg-white/10 text-white` | `page.tsx:342` | Di atas oranye — ok. | **PERTAHANKAN** |
| Trust ticker: `text-white/90`, `border-white/20` | `page.tsx:349` | Di dalam hero oranye — ok. | **PERTAHANKAN** |
| Teks ticker: `100% Client-Side Voice NLP (Rp 0 API)` | `page.tsx:352` | Sudah ok, di dalam hero oranye. | **PERTAHANKAN** |

---

### E. Section Testimoni

| Elemen / Lokasi | File | Masalah di Latar Putih | Solusi |
|---|---|---|---|
| `text-white` pada `h2` section header | `page.tsx:378` | Teks putih di atas latar putih canvas: tak terlihat. | Ganti ke `text-slate-900` |
| `text-zinc-400` pada subtitle | `page.tsx:381` | Kontras `#9CA3AF` vs putih = 2.85:1 — GAGAL WCAG AA. | Ganti ke `text-slate-600` (#4B5563, kontras ~7.0:1) |
| `Callout` — `border-brand-500/80 bg-brand-500/5 text-brand-400` | `blueprint-grid.tsx:125` | `text-brand-400` (#F89E59) kontras 2.09:1 vs putih. `bg-brand-500/5` ok (hampir transparan). | Teks ubah ke token `text-[var(--landing-callout-text)]` = `text-orange-700`. Border ok (elemen grafis). |
| `text-[11px] text-xs` di Callout | `blueprint-grid.tsx:130,134` | Callout title 12px, body 11px–12px. **Di bawah 14px** — melanggar aturan. | Ubah ukuran ke minimal `text-sm` (14px). |
| Callout title uppercase `tracking-wider` | `blueprint-grid.tsx:130` | Kontras juga buruk + teks kecil. | Ubah warna + ukuran font. |
| Card testimoni `bg-[#121316] border-[#26282D]` | `page.tsx:394` | Kartu gelap pekat di latar putih. | Ubah ke `bg-white border-slate-200 shadow-sm` |
| Window bar `bg-[#16171A] border-[#26282D]` | `page.tsx:398` | Gelap. | Ubah ke `bg-slate-50 border-b border-slate-200` |
| `bg-[#1F2024]` tab aktif | `page.tsx:418` | Gelap — kontras baik tapi di latar putih terlihat aneh. | Ubah ke `bg-white shadow-sm text-slate-900` (tab aktif). |
| `text-zinc-400 hover:text-white` tab pasif | `page.tsx:419` | `hover:text-white` di putih. | Ubah ke `text-slate-500 hover:text-slate-900` |
| Quote icon `text-zinc-700/50` | `page.tsx:435` | `#374151` 50% opasitas = sangat redup. Di putih hampir hilang. | Ubah ke `text-slate-200` (dekoratif) |
| Badge tag `bg-brand-500/15 text-brand-400 border-brand-500/30` | `page.tsx:440` | `text-brand-400` gagal kontras. | Ganti ke `bg-orange-50 text-orange-700 border-orange-200` |
| `blockquote text-zinc-100` | `page.tsx:444` | Hampir putih di latar putih. | Ganti ke `text-slate-800` |
| `h4 text-white` (nama author) | `page.tsx:449` | Putih tak terlihat. | Ganti ke `text-slate-900` |
| `text-zinc-400` (role) | `page.tsx:452` | Kontras gagal. | Ganti ke `text-slate-500` |
| Stat card `bg-[#16171A] border-[#26282D]` | `page.tsx:459` | Gelap. | Ganti ke `bg-orange-50 border-orange-100` |
| `text-zinc-400` — label "Dampak Nyata" | `page.tsx:463` | Kontras gagal. | Ganti ke `text-slate-500` |
| `text-brand-400` — stat text | `page.tsx:466` | Kontras 2.09:1 — gagal. | Ganti ke `text-orange-700` |
| Tech ticker: `text-zinc-500` label atas | `page.tsx:476` | `11px` + `#6B7280` vs putih = 4.6:1 — lulus tapi 11px di bawah 14px. | Perbesar ke 12px/13px, ganti ke `text-slate-500` |
| Tech ticker: `text-zinc-300` nama tech | `page.tsx:486` | `#D1D5DB` vs putih = 1.27:1 — GAGAL. | Ganti ke `text-slate-700` |
| Tech ticker: `text-zinc-600 font-mono` deskripsi | `page.tsx:487` | `#52525B` vs putih = 5.5:1 — OK. | Pertahankan atau ganti ke `text-slate-500` |

---

### F. Section Pilar Fondasi

| Elemen / Lokasi | File | Masalah di Latar Putih | Solusi |
|---|---|---|---|
| `text-white` h2 | `page.tsx:504` | Tak terlihat. | Ganti ke `text-slate-900` |
| `text-zinc-400` subtitle | `page.tsx:507` | Kontras gagal. | Ganti ke `text-slate-600` |
| `FeatureGrid: border-[#26282D] bg-[#0E0F12]` | `blueprint-grid.tsx:155` | Kartu gelap pekat. | Ubah ke `border-slate-200 bg-white` atau `bg-slate-50` |
| `FeatureCell: bg-[#0E0F12]` | `blueprint-grid.tsx:179` | Gelap. | Ubah ke `bg-white` |
| `FeatureCell: text-zinc-300` icon | `blueprint-grid.tsx:181` | Kontras ok vs putih? `#D1D5DB` vs putih = 1.27:1 — GAGAL. | Ganti ke `text-slate-500` |
| `FeatureCell: text-white` judul | `blueprint-grid.tsx:185` | Putih hilang. | Ganti ke `text-slate-900` |
| `FeatureCell: text-zinc-400` deskripsi | `blueprint-grid.tsx:188` | Kontras gagal. | Ganti ke `text-slate-600` |
| `divide-[#26282D]` garis divider | `blueprint-grid.tsx:160` | Terlalu gelap. | Ganti ke `divide-slate-200` |
| `CornerMarks: border-zinc-500 bg-[#0A0A0C]` | `blueprint-grid.tsx:17-18` | Kotak sudut gelap di latar putih menjadi kotak hitam pekat. | Props override ke `border-slate-400 bg-white` di landing. |

---

### G. Section Komparasi Masalah vs Solusi

| Elemen / Lokasi | File | Masalah di Latar Putih | Solusi |
|---|---|---|---|
| `text-white` h2 | `page.tsx:543` | Tak terlihat. | Ganti ke `text-slate-900` |
| `text-zinc-400` subtitle | `page.tsx:546` | Kontras gagal. | Ganti ke `text-slate-600` |
| Kartu kiri `border-[#26282D] bg-[#0E0F12]` | `page.tsx:554` | Gelap. | Ganti ke `border-slate-200 bg-slate-50` |
| Badge "STATUS: BELUM REKONSILIASI" — `bg-amber-500/10 text-amber-400 border-amber-500/30` | `page.tsx:559` | `text-amber-400` (#FBBF24) vs putih = 1.48:1 — GAGAL total. | Ganti ke `bg-amber-50 text-amber-700 border-amber-200` |
| Badge "P0: SELISIH KAS REGISTER" — `bg-rose-500/10 text-rose-400` | `page.tsx:563` | `text-rose-400` kontras rendah di putih. | Ganti ke `bg-rose-50 text-rose-700 border-rose-200` |
| `text-white` h3 | `page.tsx:568` | Tak terlihat. | Ganti ke `text-slate-900` |
| `text-zinc-400` list items | `page.tsx:572` | Kontras gagal. | Ganti ke `text-slate-600` |
| `border-[#26282D]` footer kartu kiri | `page.tsx:592` | Gelap. | Ganti ke `border-slate-200` |
| `text-zinc-500` footer kiri label | `page.tsx:593` | `#6B7280` vs putih = 4.6:1 — OK. | Pertahankan. |
| `text-rose-400` footer kiri nilai | `page.tsx:594` | Kontras rendah. | Ganti ke `text-rose-700` |
| Kartu kanan `bg-hero-gradient border-brand-500/40` | `page.tsx:599` | Kartu oranye — **PERTAHANKAN**. Ini adalah "solution card" yang memang berwarna oranye. | **PERTAHANKAN** — oranye berenergi di atas putih justru mencolok dengan cara yang benar. |
| Teks di dalam kartu oranye (putih) | `page.tsx:603-635` | Sudah di atas oranye — kontras putih vs oranye ok. | **PERTAHANKAN** |
| Heading transisi `text-white` | `page.tsx:641` | Tak terlihat. | Ganti ke `text-slate-900` |
| Subtitle transisi `text-zinc-400` | `page.tsx:644` | Kontras gagal. | Ganti ke `text-slate-600` |

---

### H. Section Paket & Fleksibilitas

| Elemen / Lokasi | File | Masalah di Latar Putih | Solusi |
|---|---|---|---|
| `text-white` h2 | `page.tsx:658` | Tak terlihat. | Ganti ke `text-slate-900` |
| `text-brand-400 underline decoration-brand-500/40` | `page.tsx:659` | `text-brand-400` kontras 2.09:1 — gagal. | Ganti ke `text-orange-700 decoration-orange-400/60` |
| `text-zinc-400` subtitle | `page.tsx:661` | Kontras gagal. | Ganti ke `text-slate-600` |
| Tab aktif capsule `bg-brand-500 text-white` | `page.tsx:678` | Brand-500 sebagai bg dengan teks putih — kontras ok (teks putih di atas oranye ~3.3:1 melewati WCAG AA untuk UI). | **PERTAHANKAN** — tombol aktif oranye dengan putih. |
| Tab pasif `bg-[#16171A] text-zinc-400 border-[#26282D]` | `page.tsx:679` | Gelap. | Ganti ke `bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200` |
| Arsitektur box `bg-[#0E0F12] border-[#26282D]` | `page.tsx:690` | Gelap. | Ganti ke `bg-slate-50 border-slate-200` |
| Label "Arsitektur Solusi" `text-brand-400` | `page.tsx:696` | Kontras gagal. | Ganti ke `text-orange-700` |
| `text-white` h4 flow title | `page.tsx:699` | Tak terlihat. | Ganti ke `text-slate-900` |
| `text-zinc-400` deskripsi | `page.tsx:702` | Kontras gagal. | Ganti ke `text-slate-600` |
| Flow box kanan `bg-[#141518] border-[#26282D]` | `page.tsx:708` | Gelap. | Ganti ke `bg-white border-slate-200` |
| `text-zinc-500` label "Aliran Data Real-Time" | `page.tsx:709` | 10px + kontras ok (4.6:1) tapi **10px di bawah 14px**. | Perbesar ke 12px. |
| Step boxes `border-dashed border-[#26282D] bg-[#0E0F12]` | `page.tsx:716` | Gelap. | Ganti ke `border-dashed border-slate-300 bg-white` |
| `text-zinc-200` step label | `page.tsx:718` | Kontras ~1.3:1 vs putih — GAGAL. | Ganti ke `text-slate-800` |
| `text-zinc-500 font-mono` step sub | `page.tsx:721` | `10px` + ok kontras tapi **di bawah 14px**. | Perbesar ke 11px minimum; idealnya 12px. |
| `text-zinc-500` pesan bawah | `page.tsx:727` | `11px` — di bawah 14px. | Perbesar ke 12px. |
| Pricing cards `bg-[#121316] border-brand-500/60` (popular) | `page.tsx:741` | Gelap. | Ganti ke `bg-white border-brand-600 shadow-md shadow-brand-500/10` |
| Pricing cards `bg-[#101524] border-enterprise-500/40` (juri) | `page.tsx:743` | Gelap. | Ganti ke `bg-blue-50 border-enterprise-500/40` |
| Pricing cards `bg-[#0E0F12] border-[#26282D]` (biasa) | `page.tsx:744` | Gelap. | Ganti ke `bg-white border-slate-200` |
| Badge tag `bg-brand-500/20 text-brand-400` (popular) | `page.tsx:762` | Kontras gagal. | Ganti ke `bg-orange-50 text-orange-700 border-orange-200` |
| Badge tag `bg-zinc-800 text-zinc-400` (biasa) | `page.tsx:765` | Gelap. | Ganti ke `bg-slate-100 text-slate-600 border-slate-200` |
| `text-white` nama paket | `page.tsx:773` | Tak terlihat. | Ganti ke `text-slate-900` |
| `text-zinc-400` deskripsi paket | `page.tsx:776` | Kontras gagal. | Ganti ke `text-slate-600` |
| Border divider price `border-[#26282D]` | `page.tsx:782` | Gelap. | Ganti ke `border-slate-200` |
| `text-white` harga | `page.tsx:784` | Tak terlihat. | Ganti ke `text-slate-900` |
| `text-zinc-400` unit harga | `page.tsx:788` | Kontras gagal. | Ganti ke `text-slate-500` |
| `text-zinc-500` period harga | `page.tsx:791` | OK kontras (4.6:1) tapi `11px` — di bawah 14px. | Perbesar ke 12px. |
| `text-zinc-300` feature list | `page.tsx:797` | Kontras `#D1D5DB` vs putih = 1.27:1 — GAGAL TOTAL. | Ganti ke `text-slate-700` |
| Tombol CTA popular `bg-brand-500 text-white` | `page.tsx:813` | Putih di atas oranye — ok untuk UI button. | **PERTAHANKAN** |
| Tombol CTA juri `bg-enterprise-600 text-white` | `page.tsx:815` | Biru dengan putih — kontras baik. | **PERTAHANKAN** |
| Tombol CTA biasa `border-zinc-700 text-zinc-200 hover:bg-white hover:text-slate-900` | `page.tsx:816` | `text-zinc-200` (#E4E4E7) vs putih = 1.06:1 — GAGAL. | Ganti ke `border-slate-300 text-slate-700 hover:bg-slate-900 hover:text-white` |

---

### I. Section Bento Grid Fitur Unggulan

| Elemen / Lokasi | File | Masalah di Latar Putih | Solusi |
|---|---|---|---|
| `text-white` h2 | `page.tsx:838` | Tak terlihat. | Ganti ke `text-slate-900` |
| `text-zinc-400` subtitle | `page.tsx:841` | Kontras gagal. | Ganti ke `text-slate-600` |
| Bento container `border-[#26282D] bg-[#0E0F12]` | `page.tsx:847` | Gelap. | Ganti ke `border-slate-200 bg-white` |
| Card 1 bottom border `border-[#26282D]` | `page.tsx:852` | Gelap. | Ganti ke `border-slate-200` |
| TRX log `bg-[#141518] border-[#26282D] divide-[#26282D]` | `page.tsx:861` | Gelap. | Ganti ke `bg-slate-50 border-slate-200 divide-slate-200` |
| `text-zinc-300` TRX ID | `page.tsx:862` | Kontras 1.27:1 — GAGAL. | Ganti ke `text-slate-600` |
| `text-zinc-500` TRX waktu | `page.tsx:867` | `10px` + kontras ok tapi di bawah 14px. | Perbesar ke 12px. |
| `text-zinc-400` produk TRX | `page.tsx:865,876,887` | Kontras gagal. | Ganti ke `text-slate-600` |
| `text-emerald-400` status Selesai | `page.tsx:868` | `#34D399` vs putih = 2.0:1 — GAGAL. | Ganti ke `text-emerald-700` |
| `text-brand-400` status Sinkronisasi | `page.tsx:890` | Kontras 2.09:1 — gagal. | Ganti ke `text-orange-700` |
| `text-white` h3 Card 1 | `page.tsx:900` | Tak terlihat. | Ganti ke `text-slate-900` |
| `text-zinc-400` desc Card 1 | `page.tsx:902` | Kontras gagal. | Ganti ke `text-slate-600` |
| Card 2 (oranye) `bg-hero-gradient border-[#26282D]` | `page.tsx:909` | **PERTAHANKAN** — kartu oranye aksen. Bagus di latar putih. | **PERTAHANKAN** |
| Semua teks putih di dalam Card 2 oranye | `page.tsx:910-928` | Sudah di atas oranye — ok. | **PERTAHANKAN** |
| Card 3 `border-[#26282D]` (default) | `page.tsx:931` | Gelap. | Ganti ke `border-slate-200` |
| Icon box Card 3 `bg-[#18191E] border-[#26282D]` | `page.tsx:933` | Gelap. | Ganti ke `bg-slate-100 border-slate-200` |
| `text-brand-400` icon | `page.tsx:933` | Kontras gagal untuk teks. | Ganti ke `text-orange-700` |
| `text-white` h3 Card 3 | `page.tsx:937` | Tak terlihat. | Ganti ke `text-slate-900` |
| `text-zinc-400` desc Card 3 | `page.tsx:941` | Kontras gagal. | Ganti ke `text-slate-600` |
| Detail list `text-zinc-400` | `page.tsx:947,951` | `11px` + kontras gagal. | Ganti ke `text-slate-600` dan perbesar ke 12px. |
| Card 4 `border-[#26282D]` | `page.tsx:959` | Gelap. | Ganti ke `border-slate-200` |
| `text-white` h3 Card 4 | `page.tsx:963` | Tak terlihat. | Ganti ke `text-slate-900` |
| `text-zinc-400` desc Card 4 | `page.tsx:966` | Kontras gagal. | Ganti ke `text-slate-600` |
| `text-brand-400` "Pengawasan non-stop" | `page.tsx:971` | Kontras gagal. | Ganti ke `text-orange-700` |
| Terminal box `bg-[#08090B] border-[#26282D]` | `page.tsx:978` | Gelap pekat. | Ganti ke `bg-slate-900 border-slate-700` (pertahankan sebagai dark terminal — ini adalah elemen visual yang tepat, seperti code block di tema terang). |
| `text-zinc-500` "Menjalankan mesin..." | `page.tsx:980` | Sudah di dalam terminal gelap — OK. | **PERTAHANKAN** (karena bg terminal tetap gelap). |
| `text-brand-400` "3 modul aktif" | `page.tsx:983` | Di dalam terminal gelap — ok. | **PERTAHANKAN** |
| `text-zinc-400`, `text-emerald-400`, `text-amber-400` terminal lines | `page.tsx:990-999` | Di dalam terminal gelap — ok. | **PERTAHANKAN** |
| Terminal command `text-zinc-400` | `page.tsx:1014` | Di dalam terminal gelap — ok. | **PERTAHANKAN** |

---

### J. Section Jaringan Multi-Cabang

| Elemen / Lokasi | File | Masalah di Latar Putih | Solusi |
|---|---|---|---|
| `text-white` h2 | `page.tsx:1048` | Tak terlihat. | Ganti ke `text-slate-900` |
| `text-zinc-400` subtitle | `page.tsx:1051` | Kontras gagal. | Ganti ke `text-slate-600` |
| Container network `bg-[#0A0A0C] border-[#26282D]` | `page.tsx:1057` | Gelap. Ini adalah visualisasi jaringan — idealnya dipertahankan gelap agar star/orbit terlihat. | Ubah ke `bg-slate-950 border-slate-800` (biarkan gelap sebagai "window" jaringan) |
| `bg-brand-500/10 blur-[90px]` glow orange | `page.tsx:1061` | Di atas bg gelap container — OK. | **PERTAHANKAN** |
| Orbit circles `border-zinc-800/80`, `border-zinc-800/60`, `border-zinc-800/40` | `page.tsx:1065-1067` | Di dalam container gelap — OK. | **PERTAHANKAN** |
| SVG arcs `stroke="#F6821F"` dan `stroke="#3F3F46"` | `page.tsx:1080,1087,1095` | Di dalam container gelap — OK. | **PERTAHANKAN** |
| Node hub `bg-hero-gradient border-white/20` | `page.tsx:1109` | Di dalam container gelap — OK. | **PERTAHANKAN** |
| Node label `bg-[#121316]/90 border-brand-500/40` | `page.tsx:1113` | Di dalam container gelap — OK. | **PERTAHANKAN** |
| Node cabang `bg-[#16171A] border-brand-500/60` | `page.tsx:1121,1132` | Di dalam container gelap — OK. | **PERTAHANKAN** |
| Callout di dalam network | `page.tsx:1142-1163` | Di dalam container gelap, Callout oranye — OK. | **PERTAHANKAN** |
| FeatureGrid bawah (`blueprint-grid.tsx`) | `page.tsx:1168` | Gelap (sama seperti audit section F). | Ganti ke `border-slate-200 bg-white` (sama seperti solusi F). |

---

### K. CTA Banner Penutup

| Elemen / Lokasi | File | Masalah di Latar Putih | Solusi |
|---|---|---|---|
| Container `bg-hero-gradient rounded-3xl` | `page.tsx:1195` | Kotak oranye melengkung — **PERTAHANKAN** (sama seperti hero). | **PERTAHANKAN** |
| `bg-dot-grid opacity-35` | `page.tsx:1197` | Di dalam oranye — ok. | **PERTAHANKAN** |
| Glow `bg-white/20 blur-[100px]` | `page.tsx:1200` | Di dalam oranye — ok. | **PERTAHANKAN** |
| Decorative boxes `border-white/20 bg-white/5` | `page.tsx:1203-1214` | Di dalam oranye — ok. | **PERTAHANKAN** |
| `text-white` h2 | `page.tsx:1217` | Di dalam oranye — ok. | **PERTAHANKAN** |
| `text-white/95` subtitle | `page.tsx:1222` | Di dalam oranye — ok. | **PERTAHANKAN** |
| Tombol `bg-white text-slate-950` | `page.tsx:1230` | Di dalam oranye — ok. | **PERTAHANKAN** |
| Tombol `bg-white/20 text-white border-white/30` | `page.tsx:1238` | Di dalam oranye — ok. | **PERTAHANKAN** |
| Ticker strip `bg-black/20 border-white/20 text-white/90` | `page.tsx:1245` | Di dalam oranye — ok. | **PERTAHANKAN** |

---

### L. Footer

| Elemen / Lokasi | File | Masalah di Latar Putih | Solusi |
|---|---|---|---|
| `bg-[#07080A] border-[#26282D]` footer | `page.tsx:1274` | Gelap pekat. Footer tetap bisa gelap sebagai "dark section" di halaman terang, ATAU ikut menjadi terang. Pilihan desain. | **Gunakan footer gelap** (`bg-slate-900 border-slate-800`) agar ada kontras antara content area putih dan footer — teknik umum di halaman terang. |
| Logo `text-white` BizPulse di footer | `page.tsx:1295` | Di dalam footer gelap — OK. | **PERTAHANKAN** |
| Badge GTNIC 2026 `bg-brand-500/20 text-brand-400 border-brand-500/30` | `page.tsx:1296-1299` | Di dalam footer gelap, `text-brand-400` vs dark bg ok. | **PERTAHANKAN** (landing page boleh punya referensi GTNIC di footer) |
| `text-zinc-400` body footer | `page.tsx:1302` | Di dalam footer gelap — `#9CA3AF` vs `#07080A` = kontras tinggi. | **PERTAHANKAN** |
| Stack badges `bg-[#121316] border-[#26282D]` | `page.tsx:1307` | Di dalam footer gelap — OK. | **PERTAHANKAN** |
| Nav links `text-zinc-400 hover:text-white` | `page.tsx:1319-1344` | Di dalam footer gelap — OK. | **PERTAHANKAN** |
| Footer bottom border `border-[#26282D]` | `page.tsx:1435` | Di dalam footer gelap — OK. | **PERTAHANKAN** |
| Copyright `text-zinc-500` | `page.tsx:1437` | Di dalam footer gelap — OK. | **PERTAHANKAN** |
| Status pill `bg-[#121316] border-[#26282D] text-zinc-400` | `page.tsx:1440` | Di dalam footer gelap — OK. | **PERTAHANKAN** |
| `text-[11px] font-mono` status pill | `page.tsx:1442` | 11px — di bawah 14px. | Perbesar ke 12px atau ubah ke `text-xs` (12px). |

---

### M. DashedRule (Pemisah Antar-Section)

| Elemen / Lokasi | File | Masalah di Latar Putih | Solusi |
|---|---|---|---|
| `border-[#26282D]` default | `blueprint-grid.tsx:82` | Di latar putih terlihat sebagai garis gelap mencolok. | Ubah ke `border-slate-200` di latar terang. Props `accent` tetap `border-brand-500/60`. |
| `border-brand-500/60` accent | `blueprint-grid.tsx:82` | `brand-500` 60% opasitas di atas putih = ok sebagai garis dekoratif (3:1 untuk UI). | **PERTAHANKAN** |

---

## 3. Ringkasan Keputusan

| Keputusan | Jumlah Elemen |
|---|---|
| ✅ PERTAHANKAN (sudah ok atau di dalam kontainer oranye/gelap) | ~55 elemen |
| 🔄 GANTI WARNA (hardcode atau class dark → class light) | ~70 elemen |
| 📐 PERBESAR FONT (teks di bawah 14px) | ~12 lokasi |
| 🔲 PERTAHANKAN GELAP (kontainer network, terminal, footer) | ~3 blok |

**Area yang SAMA SEKALI tidak diubah:**
- Hero section oranye melengkung (sudah berwarna, tidak bergantung latar)
- CTA banner penutup oranye
- Kartu solusi oranye di section komparasi
- Kartu Card 2 oranye di bento
- Container jaringan multi-cabang (tetap gelap sebagai "window")
- Terminal box di Card 4 (tetap gelap sebagai code terminal)
- Seluruh footer (tetap gelap)
- Semua komponen di dalam `(app)/` layout

---

## 4. Peta Token Terang Landing (Usulan)

Token-token ini di-scope ke wrapper `.landing` (class pada `<main>` atau pembungkus terluar di `page.tsx`), **tidak** mengubah CSS vars global.

```css
.landing {
  /* Canvas & Surface */
  --landing-canvas: #FFFFFF;
  --landing-surface: #FFFFFF;
  --landing-surface-muted: #F8FAFC;     /* slate-50 */

  /* Grid Blueprint Lines */
  --landing-grid-line: #E5E7EB;         /* slate-200 — garis vertikal & horizontal dashed */
  --landing-dot-matrix: rgba(0,0,0,0.05); /* titik gutter */

  /* Teks */
  --landing-text-primary: #0F172A;      /* slate-900 */
  --landing-text-secondary: #475569;   /* slate-600 */
  --landing-text-muted: #64748B;        /* slate-500 */

  /* Border */
  --landing-border: #E5E7EB;            /* slate-200 */
  --landing-border-strong: #CBD5E1;     /* slate-300 */

  /* Aksen oranye untuk TEKS (WCAG AA compliant) */
  --landing-accent-text: #C2410C;       /* orange-700, kontras 5.18:1 vs putih ✅ */
  --landing-accent-ui: #EA580C;         /* orange-600, kontras 3.56:1 (ok untuk UI/icon) ✅ */
  --landing-accent-bg: #FFF7ED;         /* orange-50 — latar badge oranye */
  --landing-accent-border: #FDBA74;     /* orange-300 — border badge */

  /* Status (sudah WCAG compliant di atas putih) */
  --landing-success-text: #15803D;      /* emerald-700 */
  --landing-warning-text: #B45309;      /* amber-700 */
  --landing-danger-text: #B91C1C;       /* rose-700 */

  /* Corner Marks */
  --landing-corner-border: #94A3B8;     /* slate-400 */
  --landing-corner-bg: #FFFFFF;

  /* Callout */
  --landing-callout-text: #C2410C;      /* orange-700 */
}
```

**Cara implementasi scoping:** Tambahkan `className="landing"` ke `<BlueprintCanvas>` di `page.tsx`. Lalu dalam `blueprint-grid.tsx`, ubah hardcoded values ke `var(--landing-*)` HANYA untuk properti yang perlu berbeda di tema terang.

Atau, **cara lebih sederhana (Opsi B):** Karena `blueprint-grid.tsx` dan `page.tsx` adalah milik landing saja, langsung ganti kelas Tailwind di kedua file tanpa CSS vars. Lebih mudah dibaca dan di-maintain untuk project ukuran ini.

---

## 5. Tombol Hero CTA — Usulan Versi Terang

Di dalam hero oranye, tombol sudah ok. Di **navbar**, tombol "Masuk"/"Dashboard" yang tadinya `bg-white text-slate-950` akan hilang di latar putih. Usul:

**Opsi A (Direkomendasikan):** `bg-slate-900 text-white hover:bg-slate-700 rounded-full` — gelap solid, kontras sangat baik.

**Opsi B:** `bg-brand-500 text-white hover:bg-orange-600 rounded-full` — oranye CTA, kontras putih vs oranye melewati WCAG AA untuk UI button (~3.3:1, ok untuk non-teks).

---

## 6. Satu Pertanyaan Paling Menentukan

**❓ Apakah `BlueprintCanvas` (background & grid) diimplementasikan via CSS vars yang di-scope (lebih bersih, future-proof) atau via penggantian langsung kelas Tailwind di file `page.tsx` dan `blueprint-grid.tsx` (lebih sederhana)?**

- **Opsi A (CSS Vars Scoped):** Tambah blok `.landing { --landing-canvas: white; ... }` ke `globals.css`, lalu komponen membaca `var(--landing-*)`. Butuh sedikit refactor di `blueprint-grid.tsx` untuk mengganti hardcode dengan CSS vars.
- **Opsi B (Tailwind Direct):** Karena landing page adalah halaman terpisah dan `blueprint-grid.tsx` hanya dipakai landing, langsung ganti kelas Tailwind di kedua file. Tidak ada CSS vars tambahan. Risiko: jika kelak ada halaman lain yang pakai `BlueprintCanvas` dengan tema gelap, perlu param baru.

> Saya merekomendasikan **Opsi B** — lebih sederhana, tidak ada overhead, dan sesuai prinsip YAGNI untuk project kompetisi. Tapi keputusan ada di tangan Anda.
