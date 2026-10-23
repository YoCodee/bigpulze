/**
 * Paginasi query Supabase.
 *
 * Proyek ini dibatasi PostgREST `db-max-rows = 1000`: setiap permintaan SELECT
 * maksimal mengembalikan 1000 baris, dan `limit` di atas itu ikut diredam tanpa
 * error. Query besar (mis. seluruh transaksi 30 hari pada data seed) karena itu
 * terpotong diam-diam. Helper ini mengulang query per halaman sampai habis.
 */

/** Batas baris per permintaan PostgREST pada proyek ini. */
export const PAGE_SIZE = 1000;

/** Pengaman agar loop paginasi tidak pernah berjalan tak terbatas. */
const MAX_ROWS = 500_000;

/** Bentuk hasil query Supabase (`{ data, error }`) yang juga dapat di-await. */
type QueryResult<T> = PromiseLike<{
  data: T[] | null;
  error: { message: string } | null;
}>;

/**
 * Menjalankan query yang sudah diberi filter/pemilihan kolom dan mengulangnya
 * per halaman (`.range`) sampai seluruh baris terambil.
 *
 * @param buildQuery callback yang menerima rentang `from..to` dan mengembalikan query
 * @throws Error berisi pesan dari PostgREST bila query gagal
 */
export async function fetchAllRows<T>(
  buildQuery: (from: number, to: number) => QueryResult<T>
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;

  for (;;) {
    const { data, error } = await buildQuery(from, from + PAGE_SIZE - 1);
    if (error) {
      throw new Error(`Gagal mengambil data: ${error.message}`);
    }

    const page = data ?? [];
    rows.push(...page);

    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
    if (rows.length >= MAX_ROWS) break;
  }

  return rows;
}
