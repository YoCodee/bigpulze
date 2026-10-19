import { describe, it, expect } from 'vitest';
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response';

describe('apiSuccess', () => {
  it('creates standardized success response with status 200 by default', async () => {
    const res = apiSuccess({ id: 'tx-1', total: 36000 });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toEqual({
      data: { id: 'tx-1', total: 36000 },
    });
  });

  it('includes pagination metadata when provided', async () => {
    const res = apiSuccess(
      [{ id: 1 }, { id: 2 }],
      { page: 1, page_size: 20, total: 2 },
      200
    );
    const json = await res.json();
    expect(json.meta).toEqual({
      page: 1,
      page_size: 20,
      total: 2,
    });
  });
});

describe('apiError', () => {
  it('creates standardized error response with specified status code', async () => {
    const res = apiError('VALIDATION_ERROR', 'Input tidak valid', 400, { field: 'name' });
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Input tidak valid',
        details: { field: 'name' },
      },
    });
  });
});

describe('handleApiError (RPC error mapping per PRD §12.1)', () => {
  it('maps UNAUTHENTICATED to 401', async () => {
    const res = handleApiError(new Error('UNAUTHENTICATED'));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error.code).toBe('UNAUTHENTICATED');
  });

  it('maps FORBIDDEN to 403', async () => {
    const res = handleApiError(new Error('FORBIDDEN'));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error.code).toBe('FORBIDDEN');
  });

  it('maps INSUFFICIENT_STOCK with product name detail to 409', async () => {
    const res = handleApiError(new Error('INSUFFICIENT_STOCK:Es Kopi Susu'));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error.code).toBe('INSUFFICIENT_STOCK');
    expect(json.error.message).toContain('Es Kopi Susu');
  });

  it('maps BRANCH_LIMIT_REACHED to 409', async () => {
    const res = handleApiError(new Error('BRANCH_LIMIT_REACHED'));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error.code).toBe('BRANCH_LIMIT_REACHED');
  });

  it('maps unknown errors to 500 INTERNAL_ERROR', async () => {
    const res = handleApiError(new Error('Database crash'));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error.code).toBe('INTERNAL_ERROR');
  });
});
