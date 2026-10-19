import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateExpenseSchema } from '@/lib/validators/expenses';
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const expenseId = params.id;
    const json = await request.json();
    const parsed = updateExpenseSchema.safeParse(json);

    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      return apiError('VALIDATION_ERROR', `Data update tidak valid: ${issues}`, 400);
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('UNAUTHENTICATED', 'Silakan masuk terlebih dahulu.', 401);
    }

    const updatePayload: Record<string, unknown> = {};
    if (parsed.data.category !== undefined) updatePayload.category = parsed.data.category;
    if (parsed.data.description !== undefined) updatePayload.description = parsed.data.description;
    if (parsed.data.amount !== undefined) updatePayload.amount = parsed.data.amount;
    if (parsed.data.expense_date !== undefined) updatePayload.expense_date = parsed.data.expense_date;

    if (Object.keys(updatePayload).length === 0) {
      return apiError('VALIDATION_ERROR', 'Tidak ada data yang diubah.', 400);
    }

    const { data: updated, error } = await supabase
      .from('expenses')
      .update(updatePayload)
      .eq('id', expenseId)
      .select()
      .single();

    if (error) {
      return handleApiError(error);
    }

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const expenseId = params.id;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('UNAUTHENTICATED', 'Silakan masuk terlebih dahulu.', 401);
    }

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) {
      return handleApiError(error);
    }

    return apiSuccess({ id: expenseId, message: 'Pengeluaran berhasil dihapus' });
  } catch (error) {
    return handleApiError(error);
  }
}
