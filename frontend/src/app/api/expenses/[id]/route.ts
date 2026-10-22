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

    // If amount or category is being updated, recalculate anomaly status
    if (parsed.data.amount !== undefined || parsed.data.category !== undefined) {
      // Get current expense for branch & org
      const { data: currentExp } = await supabase
        .from('expenses')
        .select('org_id, branch_id, category, amount')
        .eq('id', expenseId)
        .single();

      if (currentExp) {
        const cat = parsed.data.category || currentExp.category;
        const amt = parsed.data.amount || currentExp.amount;

        const { data: pastExpenses } = await supabase
          .from('expenses')
          .select('amount, category')
          .eq('org_id', currentExp.org_id)
          .neq('id', expenseId)
          .limit(100);

        const histList = pastExpenses || [];
        const sameCategory = histList.filter((e) => e.category === cat);
        const benchmarkList = sameCategory.length > 0 ? sameCategory : histList;

        let isAnomaly = false;
        let anomalyScore = 0;
        let anomalyReason: string | null = null;

        if (benchmarkList.length > 0) {
          const amounts = benchmarkList.map((e) => Number(e.amount));
          const benchmarkMean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
          const minThresholdFloor = 50000;
          const multiplier = 3.0;
          const threshold = Math.max(minThresholdFloor, benchmarkMean * multiplier);

          if (amt > threshold) {
            isAnomaly = true;
            const ratio = benchmarkMean > 0 ? (amt / benchmarkMean).toFixed(1) : '3.0';
            const sumSquares = amounts.reduce((acc, v) => acc + Math.pow(v - benchmarkMean, 2), 0);
            const stdDev = amounts.length > 1 ? Math.sqrt(sumSquares / (amounts.length - 1)) : benchmarkMean * 0.3;
            const zScore = stdDev > 0 ? (amt - benchmarkMean) / stdDev : 3.5;
            anomalyScore = Math.min(99.99, Math.round(zScore * 100) / 100);
            anomalyReason = `Rp ${Number(amt).toLocaleString('id-ID')}, sekitar ${ratio}x dari rata-rata biasanya (Rp ${Math.round(benchmarkMean).toLocaleString('id-ID')}) untuk kategori ${cat}.`;
          }
        }

        updatePayload.is_anomaly = isAnomaly;
        updatePayload.anomaly_score = anomalyScore;
        updatePayload.anomaly_reason = anomalyReason;
      }
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
