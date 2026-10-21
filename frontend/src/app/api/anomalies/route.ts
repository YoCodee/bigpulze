import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response';
import {
  detectExpenseSpike,
  detectRevenueAnomalies,
  detectDuplicateTransactions,
  DetectedAnomaly,
  AnomalySeverity,
} from '@/lib/anomaly/anomaly-detector';
import { isLiveAnomalyResolved, resolvedLiveAnomalies } from '@/lib/anomaly/anomaly-cache';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('UNAUTHENTICATED', 'Silakan login terlebih dahulu.', 401);
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('org_id, role, branch_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return apiError('NOT_FOUND', 'Profil pengguna tidak ditemukan.', 404);
    }

    const { searchParams } = new URL(request.url);
    const filterBranchId = searchParams.get('branch_id') || 'ALL';
    const filterSeverity = searchParams.get('severity') || 'ALL';
    const filterStatus = (searchParams.get('status') || 'OPEN').toUpperCase(); // OPEN | RESOLVED | ALL

    // Cashier constraint
    const targetBranchId =
      profile.role !== 'OWNER' && profile.branch_id
        ? profile.branch_id
        : filterBranchId !== 'ALL'
        ? filterBranchId
        : null;

    // 1. Fetch branches for name mapping
    const { data: branches } = await supabase
      .from('branches')
      .select('id, name')
      .eq('org_id', profile.org_id);

    const branchNameMap = new Map<string, string>();
    (branches || []).forEach((b) => branchNameMap.set(b.id, b.name));

    const combinedAnomalies: (DetectedAnomaly & {
      is_resolved: boolean;
      resolved_at?: string | null;
      resolution_note?: string | null;
    })[] = [];

    // 2. Fetch stored recommendations from ml_recommendations
    let recQuery = supabase
      .from('ml_recommendations')
      .select('*')
      .eq('org_id', profile.org_id)
      .in('rec_type', ['ANOMALY_EXPENSE', 'REVENUE_DROP']);

    if (targetBranchId) {
      recQuery = recQuery.eq('branch_id', targetBranchId);
    }

    if (filterStatus === 'OPEN') {
      recQuery = recQuery.eq('is_resolved', false);
    } else if (filterStatus === 'RESOLVED') {
      recQuery = recQuery.eq('is_resolved', true);
    }

    const { data: storedRecs } = await recQuery;

    (storedRecs || []).forEach((rec) => {
      const payload = rec.payload || {};
      const severityMap: Record<string, AnomalySeverity> = {
        CRITICAL: 'CRITICAL',
        WARNING: 'HIGH',
        INFO: 'MEDIUM',
      };

      combinedAnomalies.push({
        id: rec.id,
        anomaly_type: rec.rec_type === 'ANOMALY_EXPENSE' ? 'EXPENSE_SPIKE' : 'REVENUE_DROP',
        severity: severityMap[rec.severity] || 'MEDIUM',
        title: rec.title,
        description: rec.description,
        branch_id: rec.branch_id || '',
        branch_name: rec.branch_id ? branchNameMap.get(rec.branch_id) || 'Cabang' : 'Semua Cabang',
        entity_id: payload.expense_id || rec.id,
        entity_type: rec.rec_type === 'ANOMALY_EXPENSE' ? 'expense' : 'daily_sales',
        metric_value: payload.metric_value || rec.predicted_value || 0,
        baseline_value: payload.baseline_value || 0,
        z_score: payload.z_score ?? null,
        suggested_action:
          payload.suggested_action ||
          'Periksa data transaksi dan koordinasikan dengan penanggung jawab cabang.',
        detected_at: rec.briefing_date || rec.created_at,
        is_resolved: rec.is_resolved,
        resolved_at: rec.resolved_at,
        resolution_note: payload.resolution_note || null,
      });
    });

    // 3. Live Detection: Check recent expenses (last 30 days)
    let expenseQuery = supabase
      .from('expenses')
      .select('id, branch_id, expense_date, category, description, amount, is_anomaly, anomaly_reason')
      .eq('org_id', profile.org_id)
      .order('expense_date', { ascending: false })
      .limit(200);

    if (targetBranchId) {
      expenseQuery = expenseQuery.eq('branch_id', targetBranchId);
    }

    const { data: recentExpenses } = await expenseQuery;
    const expensesList = recentExpenses || [];

    // Group expenses by category for baseline calculations
    const historicalByCategory = new Map<string, { amount: number; category: string }[]>();
    expensesList.forEach((e) => {
      const arr = historicalByCategory.get(e.category) || [];
      arr.push({ amount: e.amount, category: e.category });
      historicalByCategory.set(e.category, arr);
    });

    // Check each expense for live spike
    expensesList.forEach((exp) => {
      const history = historicalByCategory.get(exp.category) || [];
      const liveSpike = detectExpenseSpike(
        {
          id: exp.id,
          amount: exp.amount,
          category: exp.category,
          description: exp.description,
          branch_id: exp.branch_id,
          branch_name: branchNameMap.get(exp.branch_id),
          expense_date: exp.expense_date,
        },
        history
      );

      if (liveSpike || exp.is_anomaly) {
        const liveId = `live-exp-${exp.id}`;
        const isResolved = isLiveAnomalyResolved(liveId) || !exp.is_anomaly;

        // Skip if status filter doesn't match
        if (filterStatus === 'OPEN' && isResolved) return;
        if (filterStatus === 'RESOLVED' && !isResolved) return;

        // Avoid duplicate if already present in stored recs
        const exists = combinedAnomalies.some((a) => a.entity_id === exp.id);
        if (!exists) {
          combinedAnomalies.push({
            id: liveId,
            anomaly_type: 'EXPENSE_SPIKE',
            severity: liveSpike?.severity || 'HIGH',
            title:
              liveSpike?.title || `Anomali Biaya: ${exp.category} (${exp.description})`,
            description:
              liveSpike?.description ||
              exp.anomaly_reason ||
              `Pengeluaran sebesar Rp ${exp.amount.toLocaleString(
                'id-ID'
              )} terindikasi tidak biasa dibandingkan riwayat historis.`,
            branch_id: exp.branch_id,
            branch_name: branchNameMap.get(exp.branch_id) || 'Cabang',
            entity_id: exp.id,
            entity_type: 'expense',
            metric_value: exp.amount,
            baseline_value: liveSpike?.baseline_value || Math.round(exp.amount / 3),
            z_score: liveSpike?.z_score ?? null,
            suggested_action:
              liveSpike?.suggested_action ||
              'Periksa nota fisik dan verifikasi persetujuan pengeluaran dengan staf cabang.',
            detected_at: exp.expense_date,
            is_resolved: isResolved,
            resolved_at: resolvedLiveAnomalies.get(liveId)?.resolved_at || null,
            resolution_note: resolvedLiveAnomalies.get(liveId)?.note || null,
          });
        }
      }
    });

    // 4. Live Detection: Check recent duplicate transactions (last 24 hours)
    let txQuery = supabase
      .from('transactions')
      .select('id, branch_id, total_revenue, payment_method, created_at, status')
      .eq('org_id', profile.org_id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (targetBranchId) {
      txQuery = txQuery.eq('branch_id', targetBranchId);
    }

    const { data: recentTxs } = await txQuery;
    if (recentTxs && recentTxs.length > 1) {
      const duplicateAnomalies = detectDuplicateTransactions(
        recentTxs.map((t) => ({
          ...t,
          branch_name: branchNameMap.get(t.branch_id),
        })),
        60
      );

      duplicateAnomalies.forEach((dup) => {
        const liveId = `live-dup-${dup.entity_id}`;
        const isResolved = isLiveAnomalyResolved(liveId);

        if (filterStatus === 'OPEN' && isResolved) return;
        if (filterStatus === 'RESOLVED' && !isResolved) return;

        combinedAnomalies.push({
          ...dup,
          id: liveId,
          is_resolved: isResolved,
          resolved_at: resolvedLiveAnomalies.get(liveId)?.resolved_at || null,
          resolution_note: resolvedLiveAnomalies.get(liveId)?.note || null,
        });
      });
    }

    // 5. Live Detection: Check daily revenue drops
    let revQuery = supabase
      .from('transactions')
      .select('branch_id, business_date, total_revenue, status')
      .eq('org_id', profile.org_id)
      .eq('status', 'COMPLETED');

    if (targetBranchId) {
      revQuery = revQuery.eq('branch_id', targetBranchId);
    }

    const { data: txList } = await revQuery;
    if (txList && txList.length > 0) {
      // Aggregate revenue by branch and date
      const branchDateMap = new Map<string, number>();
      txList.forEach((t) => {
        const key = `${t.branch_id}_${t.business_date}`;
        branchDateMap.set(key, (branchDateMap.get(key) || 0) + Number(t.total_revenue));
      });

      // Group per branch
      const branchDaysMap = new Map<string, { date: string; revenue: number; branch_id: string }[]>();
      branchDateMap.forEach((rev, key) => {
        const [bId, date] = key.split('_');
        const list = branchDaysMap.get(bId) || [];
        list.push({ date, revenue: rev, branch_id: bId });
        branchDaysMap.set(bId, list);
      });

      branchDaysMap.forEach((days, bId) => {
        if (days.length >= 7) {
          const revAnomalies = detectRevenueAnomalies(
            days.map((d) => ({
              ...d,
              branch_name: branchNameMap.get(bId),
            })),
            { minDays: 7 }
          );

          revAnomalies.forEach((ra) => {
            const liveId = `live-rev-${ra.entity_id}`;
            const isResolved = isLiveAnomalyResolved(liveId);

            if (filterStatus === 'OPEN' && isResolved) return;
            if (filterStatus === 'RESOLVED' && !isResolved) return;

            // Avoid duplicate with stored
            const exists = combinedAnomalies.some((a) => a.entity_id === ra.entity_id);
            if (!exists) {
              combinedAnomalies.push({
                ...ra,
                id: liveId,
                is_resolved: isResolved,
                resolved_at: resolvedLiveAnomalies.get(liveId)?.resolved_at || null,
                resolution_note: resolvedLiveAnomalies.get(liveId)?.note || null,
              });
            }
          });
        }
      });
    }

    // 6. Filter by severity if specified
    const filteredAnomalies =
      filterSeverity !== 'ALL'
        ? combinedAnomalies.filter((a) => a.severity === filterSeverity)
        : combinedAnomalies;

    // 7. Sort: CRITICAL first, then HIGH, then MEDIUM, then LOW, then detected_at descending
    const severityWeight: Record<AnomalySeverity, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    filteredAnomalies.sort((a, b) => {
      const weightDiff = severityWeight[b.severity] - severityWeight[a.severity];
      if (weightDiff !== 0) return weightDiff;
      return new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime();
    });

    // 8. Compute summary metrics
    const openAnomalies = combinedAnomalies.filter((a) => !a.is_resolved);
    const summary = {
      total_open: openAnomalies.length,
      critical_count: openAnomalies.filter((a) => a.severity === 'CRITICAL').length,
      high_count: openAnomalies.filter((a) => a.severity === 'HIGH').length,
      medium_count: openAnomalies.filter((a) => a.severity === 'MEDIUM').length,
    };

    return apiSuccess({
      anomalies: filteredAnomalies,
      summary,
    });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
