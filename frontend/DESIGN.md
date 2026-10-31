# Sistem Desain Alur

Dokumen ini adalah acuan untuk migrasi halaman berikutnya. Prinsipnya: **tenang, jelas, dan hanya satu hal yang berteriak di satu layar.**

## 1. Palet 60-30-10

| Porsi | Peran | Token | Nilai |
|---|---|---|---|
| 60% | Kanvas hangat | `bg-canvas` / `--canvas` | `#F7F6F3` |
| 60% | Permukaan kartu | `bg-white` / `--surface` | `#FFFFFF` |
| 30% | Aksi utama | `orange-500` / `--primary` | `#F6821F` |
| 30% | Aksi utama (hover) | `orange-600` | `#EA580C` |
| 30% | Teks aksi | `orange-700` | `#C2410C` |
| 10% | Inteligensi / analitik | `sage-600` / `--accent` | `#4E7A60` |
| 10% | Latar inteligensi | `sage-50` | `#F1F6F1` |
| Netral | Teks utama | `stone-900` | `#1C1917` |
| Netral | Teks sekunder | `stone-600` | `#57534E` |
| Netral | Teks metadata | `stone-500` / `stone-400` | `#78716C` / `#A8A29E` |
| Netral | Border | `stone-200` | `#E7E5E0` |

Aturan pemakaian:

- Oranye **hanya** untuk aksi utama, state aktif, dan progres. Jangan dipakai untuk badge dekoratif.
- Sage emerald **hanya** untuk hal yang bersifat cerdas/analitik: briefing suara, rekomendasi stok, target chart, asisten AI. Emerald tetap dipakai untuk status sukses/aman.
- Status memakai warna semantik: `emerald` (aman), `amber` (perlu perhatian), `rose` (mendesak); jangan samakan emerald status dengan sage inteligensi.
- Sage emerald menjadi aksen sekunder yang harmonis dengan oranye; gunakan terbatas pada insight/analitik. Jika butuh penekanan lain, pakai bobot font atau ruang.

## 2. Tipografi

| Peran | Kelas | Catatan |
|---|---|---|
| Judul halaman | `text-2xl sm:text-[28px] font-semibold tracking-[-0.02em]` | jangan `font-extrabold` |
| Judul kartu | `text-[15px] font-semibold tracking-[-0.01em]` | lewat `SectionHeader` |
| Body / deskripsi | `text-sm leading-relaxed` | minimal 14px |
| Metadata | `text-xs` | hanya untuk tanggal, SKU, keterangan |
| Angka besar | `text-[26px] font-semibold tabular-nums` | lewat `StatCard` |
| Badge | `text-[11px] font-medium` | bukan untuk body |

Aturan:

- Maksimal **3 bobot** per layar: 400, 500, 600.
- Jangan memakai `text-xs` untuk paragraf.
- Angka uang selalu `tabular-nums`.

## 3. Bentuk, ruang, dan bayangan

- Radius: `rounded-xl` (12px) untuk kartu, `rounded-lg` (8–10px) untuk kontrol.
- Spasi vertikal antar-section: `space-y-6` / `gap-6`.
- Padding kartu: `p-5 sm:p-6`.
- Shadow: `shadow-card` (sangat halus) atau `shadow-soft` untuk elemen mengambang. Jangan pakai `shadow-lg` untuk kartu biasa.
- Satu section = satu border. Hindari border + shadow tebal + background tint sekaligus.

## 4. Komponen

Semua ada di `src/components/ui/`.

| Komponen | Kapan dipakai |
|---|---|
| `Button` | Semua aksi. `variant="primary"` hanya untuk satu aksi utama per area. |
| `Badge` | Status/label singkat. Maksimal satu per baris. |
| `Card` + `SectionHeader` | Satu blok konten dengan judul, deskripsi, dan aksi. |
| `StatCard` | Satu angka ringkasan. Jangan menumpuk banyak badge di dalamnya. |
| `Tabs` | Navigasi antar-view. Berbasis Radix (arrow key, Home/End). |
| `Dialog` | Modal. Berbasis Radix (focus trap, Escape, scroll lock). |
| `EmptyState` | Kondisi kosong. Selalu beri penjelasan, bukan hanya "tidak ada data". |
| `Toaster` (sonner) | Notifikasi sukses/gagal. Jangan pakai `alert()`. |

### Varian tombol

- `primary` — aksi utama (oranye).
- `secondary` — aksi pendukung (putih + border).
- `outline` — aksi ketiga / di dalam baris data.
- `ghost` — aksi tersier, ikon, navigasi.
- `destructive` / `destructive-solid` — aksi merusak.

### Pola halaman

```
Header halaman (judul + 1 kalimat + maksimal 2 aksi)
Tabs (jika ada beberapa view)
StatCard grid (ringkasan angka)
Grid 8/4: konten utama + rail kanan (target, status, bantuan)
```

## 5. Copywriting

- Gunakan bahasa manusia, bukan label sistem: "Apa yang perlu diperhatikan?" bukan "Anomali Terdeteksi".
- Sebut angka konkret, bukan "beberapa".
- Setiap empty state menjelaskan **apa artinya** dan **apa langkah berikutnya**.
- Hapus dekorasi yang tidak mengubah keputusan: dot berdenyut, badge "Hemat Biaya", ikon sparkles berulang.

## 6. Status migrasi

| Area | Status |
|---|---|
| Token warna & tipografi | Selesai |
| Button, Badge, Card, Input, Table, Tabs, Dialog | Selesai (berbasis cva + Radix) |
| Shell: sidebar, topbar, kanvas | Selesai |
| Dashboard | Selesai (pilot) |
| POS, Transaksi, Produk, Stok, Laporan, Staf, Cabang, Auth, Landing | Belum — masih memakai warna `slate`/`enterprise` hardcoded |

Selama migrasi bertahap, halaman lama akan terlihat setengah lama (konten biru dingin) di dalam shell baru. Itu wajar; jangan menambah warna baru untuk menambal. Ganti `slate-*` → `stone-*`, `enterprise-*` → `orange-*` atau `sky-*` sesuai peran saat halaman tersebut disentuh.

## 7. Catatan teknis

- `components.json` sudah dikonfigurasi untuk shadcn, tetapi proyek masih Tailwind 3.4. Jangan upgrade Tailwind dulu; tambahkan komponen secara manual/kompatibel.
- `npm install` di repo ini memerlukan `--legacy-peer-deps` karena konflik peer `@vitejs/plugin-react@6` vs `vitest@2`.
- Recharts dipakai di dashboard (tambah ~100 kB first load). Jika tidak diperlukan di halaman lain, jangan import.
- Selector tour Driver.js (`id="tour-..."`) harus dipertahankan saat migrasi.
