import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createExpenseSchema } from '@/lib/validators/expenses';
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response';
import { getBusinessDate } from '@/lib/date';

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
    const category = searchParams.get('category');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const month = searchParams.get('month'); // format YYYY-MM
    const date = searchParams.get('date');

    let query = supabase
      .from('expenses')
      .select('id, org_id, branch_id, created_by, expense_date, category, description, amount, input_method, voice_transcript, is_anomaly, anomaly_score, anomaly_reason, created_at')
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (branchId && branchId !== 'ALL') {
      query = query.eq('branch_id', branchId);
    }

    if (category && category !== 'ALL') {
      query = query.eq('category', category);
    }

    if (date) {
      query = query.eq('expense_date', date);
    } else if (month) {
      const [year, m] = month.split('-');
      if (year && m) {
        const lastDay = new Date(parseInt(year, 10), parseInt(m, 10), 0).getDate();
        const start = `${month}-01`;
        const end = `${month}-${String(lastDay).padStart(2, '0')}`;
        query = query.gte('expense_date', start).lte('expense_date', end);
      }
    } else {
      if (startDate) {
        query = query.gte('expense_date', startDate);
      }
      if (endDate) {
        query = query.lte('expense_date', endDate);
      }
    }

    const { data: expenses, error } = await query;

    if (error) {
      return handleApiError(error);
    }

    return apiSuccess(expenses || []);
  } catch (error) {
    return handleApiError(error);
  }
}

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
    const parsed = createExpenseSchema.safeParse(json);

    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      return apiError('VALIDATION_ERROR', `Data pengeluaran tidak valid: ${issues}`, 400, parsed.error.flatten());
    }

    // Get user profile for org_id and branch verification
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('org_id, role, branch_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return apiError('NOT_FOUND', 'Profil pengguna tidak ditemukan.', 404);
    }

    // If Cashier, ensure branch matches
    if (profile.role !== 'OWNER' && profile.branch_id !== parsed.data.branch_id) {
      return apiError('FORBIDDEN', 'Kasir hanya dapat mencatat pengeluaran di cabang yang ditugaskan.', 403);
    }

    const expenseDate = parsed.data.expense_date || getBusinessDate();

    const { data: inserted, error: insertError } = await supabase
      .from('expenses')
      .insert({
        org_id: profile.org_id,
        branch_id: parsed.data.branch_id,
        created_by: user.id,
        expense_date: expenseDate,
        category: parsed.data.category,
        description: parsed.data.description,
        amount: parsed.data.amount,
        input_method: parsed.data.input_method || 'MANUAL',
        voice_transcript: parsed.data.voice_transcript ?? null,
      })
      .select()
      .single();

    if (insertError) {
      return handleApiError(insertError);
    }

    return apiSuccess(inserted, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
