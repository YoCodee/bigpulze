# Assumptions

Keputusan yang tidak diatur PRD secara eksplisit, dicatat agar bisa dilacak.

| Tanggal | Konteks | Keputusan |
|---|---|---|
| 2026-10-19 | **Ambiguitas #1 — Proteksi kolom `stock` pada tabel `products`.** RLS policy `products_write_owner FOR ALL` secara teknis memungkinkan owner mengubah kolom `stock` langsung tanpa melalui RPC, melanggar D6. | **Solusi:** Di `rls.sql`, hak `UPDATE` pada tabel `products` untuk role `authenticated` hanya diberikan pada kolom non-stok (`sku`, `name`, `category`, `cost_price`, `selling_price`, `min_stock_alert`, `aliases`, `is_active`, `updated_at`). Kolom `stock` tidak termasuk dalam `GRANT UPDATE`. RPC yang berjalan sebagai `SECURITY DEFINER` (pemilik fungsi = `postgres`) tetap bisa mengubah kolom `stock`. Stok awal produk baru = 0, diisi lewat RPC `restock_product`. Konsekuensi: policy `products_write_owner` dipecah menjadi `products_insert_owner` (INSERT) dan `products_delete_owner` (DELETE) terpisah; UPDATE dikontrol lewat column-level GRANT + RLS policy `products_update_owner`. |
| 2026-10-19 | **Fuzzy matching di voice parser (ambiguitas #3).** PRD §9.2 poin 6 menyebut "Dice coefficient pada trigram **atau** rasio Levenshtein" tanpa memilih. | Keputusan ditunda ke bagian D (Parser). Akan dipilih saat implementasi dan dicatat di sini. |
| 2026-10-19 | **Import produk dan stok awal.** PRD §8 template produk punya kolom `stok`. Keputusan ambiguitas #1 bilang stok awal = 0 diisi lewat restock. | RPC `import_products_batch` (SECURITY DEFINER) boleh menetapkan stok dari file CSV dan membuat `stock_movements` bertipe `IMPORT` karena ini operasi server terkontrol, bukan manipulasi klien ad-hoc. Untuk pembuatan produk manual (FR-1.3), stok tetap dimulai dari 0. |
