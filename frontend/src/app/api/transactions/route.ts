import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSaleSchema } from '@/lib/validators/transactions';
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('UNAUTHENTICATED', 'Silakan login terlebih dahulu.', 401);
    }

    const json = await request.json();
    const parsed = createSaleSchema.safeParse(json);

    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      return apiError('VALIDATION_ERROR', `Data transaksi tidak valid: ${issues}`, 400, parsed.error.flatten());
    }

    const {
      branch_id,
      items,
      payment_method,
      input_method,
      client_tx_id,
      cash_tendered,
    } = parsed.data;

    // Call create_sale RPC
    const { data: txId, error: rpcError } = await supabase.rpc('create_sale', {
      p_branch_id: branch_id,
      p_items: items,
      p_payment_method: payment_method,
      p_input_method: input_method,
      p_client_tx_id: client_tx_id ?? null,
    });

    if (rpcError) {
      return handleApiError(rpcError);
    }

    // Retrieve created transaction details with items
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select(`
        id,
        org_id,
        branch_id,
        created_by,
        client_tx_id,
        transaction_date,
        business_date,
        input_method,
        payment_method,
        status,
        total_revenue,
        total_cogs,
        gross_profit,
        transaction_items (
          id,
          product_id,
          product_name,
          quantity,
          unit_cost,
          unit_price,
          subtotal
        )
      `)
      .eq('id', txId)
      .single();

    if (fetchError || !transaction) {
      // Fallback if detail fetch fails
      return apiSuccess({ id: txId, branch_id, cash_tendered: cash_tendered ?? null }, undefined, 201);
    }

    return apiSuccess({
      ...transaction,
      cash_tendered: cash_tendered ?? null,
      change_due: cash_tendered != null ? Math.max(0, cash_tendered - Number(transaction.total_revenue)) : null,
    }, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('UNAUTHENTICATED', 'Silakan login terlebih dahulu.', 401);
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branch_id');
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('payment_method');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('page_size') || '20', 10)));
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('transactions')
      .select(
        `
        id,
        org_id,
        branch_id,
        created_by,
        client_tx_id,
        transaction_date,
        business_date,
        input_method,
        payment_method,
        status,
        total_revenue,
        total_cogs,
        gross_profit,
        voided_at,
        void_reason,
        transaction_items (
          id,
          product_id,
          product_name,
          quantity,
          unit_cost,
          unit_price,
          subtotal
        )
      `,
        { count: 'exact' }
      )
      .order('transaction_date', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }
    if (date) {
      query = query.eq('business_date', date);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (paymentMethod) {
      query = query.eq('payment_method', paymentMethod);
    }

    const { data, count, error } = await query;

    if (error) {
      return handleApiError(error);
    }

    return apiSuccess(data || [], {
      page,
      page_size: pageSize,
      total: count ?? 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
