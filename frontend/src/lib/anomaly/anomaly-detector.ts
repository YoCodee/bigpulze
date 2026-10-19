export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AnomalyType =
  | 'EXPENSE_SPIKE'
  | 'REVENUE_DROP'
  | 'REVENUE_SURGE'
  | 'DUPLICATE_TRANSACTION'
  | 'CASH_DISCREPANCY';

export interface DetectedAnomaly {
  id?: string;
  anomaly_type: AnomalyType;
  severity: AnomalySeverity;
  title: string;
  description: string;
  branch_id: string;
  branch_name?: string;
  entity_id?: string;
  entity_type: 'expense' | 'transaction' | 'daily_sales' | 'stock';
  metric_value: number;
  baseline_value: number;
  z_score?: number | null;
  suggested_action: string;
  detected_at: string;
}

/**
 * Calculates arithmetic mean of a number array.
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

/**
 * Calculates standard deviation (Sample standard deviation by default with N-1, or population with N).
 */
export function calculateStdDev(values: number[], isSample = true): number {
  if (values.length <= 1) return 0;
  const mean = calculateMean(values);
  const sumSquareDiffs = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0);
  const divisor = isSample ? values.length - 1 : values.length;
  return Math.sqrt(sumSquareDiffs / divisor);
}

/**
 * Calculates standard Z-score: Z = (X - Mean) / StdDev.
 * Returns 0 if stdDev is 0.
 */
export function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

/**
 * Detects whether an expense constitutes an anomalous spike compared to historical average.
 * Heuristic: Expense > multiplier * categoryMean30Days, and above minimum nominal floor (default Rp 50.000).
 */
export function detectExpenseSpike(
  currentExpense: {
    id?: string;
    amount: number;
    category: string;
    description: string;
    branch_id: string;
    branch_name?: string;
    expense_date?: string;
  },
  historicalExpenses: { amount: number; category: string }[],
  options: {
    multiplier?: number;
    minThresholdFloor?: number;
  } = {}
): DetectedAnomaly | null {
  const multiplier = options.multiplier ?? 3.0;
  const minThresholdFloor = options.minThresholdFloor ?? 50000;

  // Filter historical expenses in the same category
  const sameCategoryExpenses = historicalExpenses.filter(
    (e) => e.category === currentExpense.category
  );

  // Need at least 3 historical expenses to establish a reliable baseline
  if (sameCategoryExpenses.length < 3) {
    return null;
  }

  const amounts = sameCategoryExpenses.map((e) => e.amount);
  const mean = calculateMean(amounts);
  const stdDev = calculateStdDev(amounts);

  // Baseline threshold
  const threshold = Math.max(minThresholdFloor, mean * multiplier);

  if (currentExpense.amount > threshold) {
    const zScore = calculateZScore(currentExpense.amount, mean, stdDev);
    const ratio = mean > 0 ? (currentExpense.amount / mean).toFixed(1) : 'inf';

    let severity: AnomalySeverity = 'MEDIUM';
    if (currentExpense.amount > mean * 5 || zScore > 4.0) {
      severity = 'CRITICAL';
    } else if (currentExpense.amount > mean * 3.5 || zScore > 3.0) {
      severity = 'HIGH';
    }

    return {
      anomaly_type: 'EXPENSE_SPIKE',
      severity,
      title: `Lonjakan Biaya ${currentExpense.category} (${ratio}x Rata-rata)`,
      description: `Pengeluaran "${currentExpense.description}" sebesar Rp ${currentExpense.amount.toLocaleString(
        'id-ID'
      )} melampaui rata-rata historis (Rp ${Math.round(mean).toLocaleString('id-ID')}).`,
      branch_id: currentExpense.branch_id,
      branch_name: currentExpense.branch_name,
      entity_id: currentExpense.id,
      entity_type: 'expense',
      metric_value: currentExpense.amount,
      baseline_value: Math.round(mean),
      z_score: Math.round(zScore * 100) / 100,
      suggested_action: 'Periksa nota fisik dan verifikasi persetujuan pengeluaran dengan staf cabang.',
      detected_at: currentExpense.expense_date || new Date().toISOString(),
    };
  }

  return null;
}

/**
 * Detects statistical revenue anomalies across daily branch sales.
 * Rule: Z-Score < -2.0 (Revenue Drop) or Z-Score > 2.5 (Revenue Surge).
 */
export function detectRevenueAnomalies(
  dailyRevenues: {
    date: string;
    revenue: number;
    branch_id: string;
    branch_name?: string;
  }[],
  options: {
    minDays?: number;
    dropZThreshold?: number;
    surgeZThreshold?: number;
  } = {}
): DetectedAnomaly[] {
  const minDays = options.minDays ?? 7;
  const dropZThreshold = options.dropZThreshold ?? -2.0;
  const surgeZThreshold = options.surgeZThreshold ?? 2.5;

  if (dailyRevenues.length < minDays) {
    return [];
  }

  const anomalies: DetectedAnomaly[] = [];

  for (let i = 0; i < dailyRevenues.length; i++) {
    const item = dailyRevenues[i];
    // Baseline from the rest of the days (leave-one-out) to prevent outlier self-dilution
    const otherRevenues = dailyRevenues
      .filter((_, idx) => idx !== i)
      .map((d) => d.revenue);

    const mean = calculateMean(otherRevenues);
    const stdDev = calculateStdDev(otherRevenues);

    // If stdDev is zero or very small, use 5% of mean as lower bound
    const effectiveStdDev = Math.max(stdDev, mean * 0.05);
    const z = calculateZScore(item.revenue, mean, effectiveStdDev);

    if (z <= dropZThreshold) {
      const dropPct = mean > 0 ? Math.round(((mean - item.revenue) / mean) * 100) : 0;
      anomalies.push({
        anomaly_type: 'REVENUE_DROP',
        severity: z <= -3.0 ? 'CRITICAL' : 'HIGH',
        title: `Penurunan Omzet Signifikan (${dropPct}% di Bawah Normal)`,
        description: `Omzet tanggal ${item.date} tercatat Rp ${item.revenue.toLocaleString(
          'id-ID'
        )}, jauh di bawah rata-rata harian Rp ${Math.round(mean).toLocaleString('id-ID')} (Z: ${z.toFixed(2)}).`,
        branch_id: item.branch_id,
        branch_name: item.branch_name,
        entity_id: `${item.branch_id}-${item.date}`,
        entity_type: 'daily_sales',
        metric_value: item.revenue,
        baseline_value: Math.round(mean),
        z_score: Math.round(z * 100) / 100,
        suggested_action: 'Evaluasi operasional cabang: periksa kehadiran staf, stok habis, atau kendala cuaca/listrik.',
        detected_at: item.date,
      });
    } else if (z >= surgeZThreshold) {
      const surgePct = mean > 0 ? Math.round(((item.revenue - mean) / mean) * 100) : 0;
      anomalies.push({
        anomaly_type: 'REVENUE_SURGE',
        severity: z >= 3.5 ? 'HIGH' : 'MEDIUM',
        title: `Lonjakan Penjualan Tidak Biasa (+${surgePct}%)`,
        description: `Omzet tanggal ${item.date} melonjak mencapai Rp ${item.revenue.toLocaleString(
          'id-ID'
        )} (Rata-rata: Rp ${Math.round(mean).toLocaleString('id-ID')}).`,
        branch_id: item.branch_id,
        branch_name: item.branch_name,
        entity_id: `${item.branch_id}-${item.date}`,
        entity_type: 'daily_sales',
        metric_value: item.revenue,
        baseline_value: Math.round(mean),
        z_score: Math.round(z * 100) / 100,
        suggested_action: 'Pastikan pencatatan stok bahan baku sepadan dan amankan persediaan untuk hari berikutnya.',
        detected_at: item.date,
      });
    }
  }

  return anomalies;
}

/**
 * Detects potential duplicate transactions occurring within windowSeconds (default: 60s)
 * with the exact same total amount and payment method in the same branch.
 */
export function detectDuplicateTransactions(
  transactions: {
    id: string;
    branch_id: string;
    branch_name?: string;
    total_revenue: number;
    payment_method: string;
    created_at: string;
    status?: string;
  }[],
  windowSeconds = 60
): DetectedAnomaly[] {
  const anomalies: DetectedAnomaly[] = [];

  // Filter out voided transactions
  const activeTxs = transactions.filter((t) => t.status !== 'VOID');

  // Sort by created_at ascending
  const sorted = [...activeTxs].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    if (current.branch_id !== next.branch_id) continue;
    if (current.total_revenue !== next.total_revenue) continue;
    if (current.payment_method !== next.payment_method) continue;

    const currentTime = new Date(current.created_at).getTime();
    const nextTime = new Date(next.created_at).getTime();
    const diffSeconds = Math.abs(nextTime - currentTime) / 1000;

    if (diffSeconds <= windowSeconds) {
      anomalies.push({
        anomaly_type: 'DUPLICATE_TRANSACTION',
        severity: 'HIGH',
        title: `Indikasi Transaksi Ganda (${diffSeconds.toFixed(0)} detik selisih)`,
        description: `Dua transaksi identik sebesar Rp ${current.total_revenue.toLocaleString(
          'id-ID'
        )} (${current.payment_method}) tercatat hanya berjarak ${Math.round(diffSeconds)} detik.`,
        branch_id: next.branch_id,
        branch_name: next.branch_name,
        entity_id: next.id,
        entity_type: 'transaction',
        metric_value: next.total_revenue,
        baseline_value: current.total_revenue,
        z_score: null,
        suggested_action: 'Periksa riwayat kasir dan hubungi staf kasir untuk memastikan apakah pelanggan sengaja order dua kali atau terjadi double tap.',
        detected_at: next.created_at,
      });
    }
  }

  return anomalies;
}

/**
 * Detects cash reconciliation discrepancy between expected cash from register and counted physical cash.
 */
export function detectCashDiscrepancy(
  expectedCash: number,
  actualCash: number,
  branch_id: string,
  branch_name?: string,
  tolerancePercent = 0.02 // 2% tolerance
): DetectedAnomaly | null {
  const diff = actualCash - expectedCash;
  const absDiff = Math.abs(diff);

  const allowedVariance = Math.max(10000, expectedCash * tolerancePercent);

  if (absDiff > allowedVariance) {
    const isShortage = diff < 0;
    const severity: AnomalySeverity = absDiff > 100000 ? 'CRITICAL' : 'HIGH';

    return {
      anomaly_type: 'CASH_DISCREPANCY',
      severity,
      title: isShortage
        ? `Selisih Kas Fisik Kurang (-Rp ${absDiff.toLocaleString('id-ID')})`
        : `Selisih Kas Fisik Berlebih (+Rp ${absDiff.toLocaleString('id-ID')})`,
      description: `Kas fisik tercatat Rp ${actualCash.toLocaleString(
        'id-ID'
      )}, berbeda ${isShortage ? 'kurang' : 'lebih'} Rp ${absDiff.toLocaleString(
        'id-ID'
      )} dari ekspektasi sistem Rp ${expectedCash.toLocaleString('id-ID')}.`,
      branch_id,
      branch_name,
      entity_type: 'stock',
      metric_value: actualCash,
      baseline_value: expectedCash,
      z_score: null,
      suggested_action: 'Lakukan audit ulang uang receh kembalian dan minta berita acara serah terima kasir.',
      detected_at: new Date().toISOString(),
    };
  }

  return null;
}
