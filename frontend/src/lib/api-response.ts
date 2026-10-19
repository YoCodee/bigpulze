import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T> {
  data: T;
  meta?: {
    page?: number;
    page_size?: number;
    total?: number;
    [key: string]: unknown;
  };
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function apiSuccess<T>(data: T, meta?: ApiSuccessResponse<T>['meta'], status = 200) {
  const body: ApiSuccessResponse<T> = { data };
  if (meta) {
    body.meta = meta;
  }
  return NextResponse.json(body, { status });
}

export function apiError(code: string, message: string, status = 400, details?: unknown) {
  const body: ApiErrorResponse = {
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
  return NextResponse.json(body, { status });
}

/**
 * Maps known PostgreSQL / RPC errors to standardized HTTP responses.
 */
export function handleApiError(err: unknown) {
  if (err instanceof Error) {
    const msg = err.message;

    // Handle RPC exceptions formatted as "CODE" or "CODE:detail"
    if (msg.includes('UNAUTHENTICATED')) {
      return apiError('UNAUTHENTICATED', 'Silakan masuk terlebih dahulu.', 401);
    }
    if (msg.includes('FORBIDDEN')) {
      return apiError('FORBIDDEN', 'Anda tidak memiliki hak akses untuk tindakan ini.', 403);
    }
    if (msg.includes('BRANCH_LIMIT_REACHED')) {
      return apiError('BRANCH_LIMIT_REACHED', 'Batas maksimum 5 cabang aktif telah tercapai.', 409);
    }
    if (msg.includes('INSUFFICIENT_STOCK')) {
      const parts = msg.split(':');
      const detail = parts[1] ? ` untuk ${parts[1]}` : '';
      return apiError('INSUFFICIENT_STOCK', `Stok tidak mencukupi${detail}.`, 409);
    }
    if (msg.includes('EMPTY_CART')) {
      return apiError('VALIDATION_ERROR', 'Keranjang transaksi tidak boleh kosong.', 400);
    }
    if (msg.includes('NOT_FOUND')) {
      return apiError('NOT_FOUND', 'Data yang diminta tidak ditemukan.', 404);
    }
    if (msg.includes('BRANCH_NOT_FOUND')) {
      return apiError('NOT_FOUND', 'Cabang tidak ditemukan atau tidak aktif.', 404);
    }
    if (msg.includes('PRODUCT_NOT_FOUND')) {
      return apiError('NOT_FOUND', 'Produk tidak ditemukan atau tidak aktif.', 404);
    }
    if (msg.includes('CONFLICT')) {
      const parts = msg.split(':');
      return apiError('CONFLICT', parts[1] || 'Terjadi konflik data.', 409);
    }
    if (msg.includes('VALIDATION_ERROR')) {
      const parts = msg.split(':');
      return apiError('VALIDATION_ERROR', parts[1] || 'Data input tidak valid.', 400);
    }

    return apiError('INTERNAL_ERROR', msg || 'Terjadi kesalahan pada server.', 500);
  }

  return apiError('INTERNAL_ERROR', 'Terjadi kesalahan sistem yang tidak diketahui.', 500);
}
