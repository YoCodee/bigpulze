import { describe, it, expect } from 'vitest';
import {
  calculateMean,
  calculateStdDev,
  calculateZScore,
  detectExpenseSpike,
  detectRevenueAnomalies,
  detectDuplicateTransactions,
  detectCashDiscrepancy,
} from '@/lib/anomaly/anomaly-detector';

describe('Statistical Utility Functions', () => {
  it('calculates mean correctly', () => {
    expect(calculateMean([10, 20, 30, 40, 50])).toBe(30);
    expect(calculateMean([100])).toBe(100);
    expect(calculateMean([])).toBe(0);
  });

  it('calculates sample standard deviation correctly', () => {
    // Array: [2, 4, 4, 4, 5, 5, 7, 9], sum squares = 32, sample divisor = 7 -> sqrt(32/7) ≈ 2.138
    const std = calculateStdDev([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(std).toBeCloseTo(2.138, 2);

    expect(calculateStdDev([10])).toBe(0);
    expect(calculateStdDev([])).toBe(0);
  });

  it('calculates Z-Score correctly', () => {
    expect(calculateZScore(15, 10, 2.5)).toBe(2.0);
    expect(calculateZScore(5, 10, 2.5)).toBe(-2.0);
    expect(calculateZScore(10, 10, 2.5)).toBe(0);
    expect(calculateZScore(10, 10, 0)).toBe(0); // Zero division guard
  });
});

describe('detectExpenseSpike', () => {
  const historicalUtilitas = [
    { amount: 50000, category: 'Utilitas' },
    { amount: 45000, category: 'Utilitas' },
    { amount: 55000, category: 'Utilitas' },
    { amount: 50000, category: 'Utilitas' },
  ]; // Mean = 50.000

  it('returns null for normal expected expenses', () => {
    const anomaly = detectExpenseSpike(
      {
        id: 'exp-1',
        amount: 60000,
        category: 'Utilitas',
        description: 'Beli galon air',
        branch_id: 'branch-1',
      },
      historicalUtilitas
    );
    expect(anomaly).toBeNull();
  });

  it('detects anomalous expense spike > 3x historical mean', () => {
    const anomaly = detectExpenseSpike(
      {
        id: 'exp-2',
        amount: 300000, // 6x mean
        category: 'Utilitas',
        description: 'Tagihan listrik membengkak',
        branch_id: 'branch-1',
      },
      historicalUtilitas
    );

    expect(anomaly).not.toBeNull();
    expect(anomaly?.anomaly_type).toBe('EXPENSE_SPIKE');
    expect(anomaly?.metric_value).toBe(300000);
    expect(anomaly?.baseline_value).toBe(50000);
    expect(anomaly?.severity).toBe('CRITICAL');
  });

  it('suppresses false positives below minimum threshold floor (Rp 50.000)', () => {
    const cheapHistory = [
      { amount: 2000, category: 'Operasional' },
      { amount: 2500, category: 'Operasional' },
      { amount: 3000, category: 'Operasional' },
    ]; // Mean = 2.500, 3x mean = 7.500, but below Rp 50.000 floor

    const anomaly = detectExpenseSpike(
      {
        amount: 15000,
        category: 'Operasional',
        description: 'Beli pulpen 3 buah',
        branch_id: 'branch-1',
      },
      cheapHistory
    );
    expect(anomaly).toBeNull();
  });

  it('returns null when insufficient historical data (< 3 items)', () => {
    const sparseHistory = [{ amount: 50000, category: 'Sewa' }];
    const anomaly = detectExpenseSpike(
      {
        amount: 500000,
        category: 'Sewa',
        description: 'Sewa lapak',
        branch_id: 'branch-1',
      },
      sparseHistory
    );
    expect(anomaly).toBeNull();
  });
});

describe('detectRevenueAnomalies', () => {
  it('detects statistical revenue drop and surge', () => {
    // 10 days of stable revenue ~Rp 2.000.000 ± 100.000
    const history = [
      { date: '2026-10-01', revenue: 2000000, branch_id: 'b1' },
      { date: '2026-10-02', revenue: 1950000, branch_id: 'b1' },
      { date: '2026-10-03', revenue: 2050000, branch_id: 'b1' },
      { date: '2026-10-04', revenue: 2000000, branch_id: 'b1' },
      { date: '2026-10-05', revenue: 1980000, branch_id: 'b1' },
      { date: '2026-10-06', revenue: 2020000, branch_id: 'b1' },
      { date: '2026-10-07', revenue: 2010000, branch_id: 'b1' },
      { date: '2026-10-08', revenue: 2000000, branch_id: 'b1' },
      { date: '2026-10-09', revenue: 500000, branch_id: 'b1' }, // Extreme drop
      { date: '2026-10-10', revenue: 4500000, branch_id: 'b1' }, // Extreme surge
    ];

    const anomalies = detectRevenueAnomalies(history);

    expect(anomalies.length).toBeGreaterThanOrEqual(2);

    const drop = anomalies.find((a) => a.anomaly_type === 'REVENUE_DROP');
    expect(drop).toBeDefined();
    expect(drop?.metric_value).toBe(500000);
    expect(drop?.z_score).toBeLessThan(-2.0);

    const surge = anomalies.find((a) => a.anomaly_type === 'REVENUE_SURGE');
    expect(surge).toBeDefined();
    expect(surge?.metric_value).toBe(4500000);
    expect(surge?.z_score).toBeGreaterThan(2.5);
  });

  it('returns empty array if less than minDays', () => {
    const shortHistory = [
      { date: '2026-10-01', revenue: 2000000, branch_id: 'b1' },
      { date: '2026-10-02', revenue: 500000, branch_id: 'b1' },
    ];
    expect(detectRevenueAnomalies(shortHistory)).toEqual([]);
  });
});

describe('detectDuplicateTransactions', () => {
  it('detects duplicate transactions occurring within 60 seconds with same amount and payment', () => {
    const txs = [
      {
        id: 'tx-1',
        branch_id: 'b1',
        total_revenue: 55000,
        payment_method: 'CASH',
        created_at: '2026-10-19T10:00:00Z',
      },
      {
        id: 'tx-2',
        branch_id: 'b1',
        total_revenue: 55000,
        payment_method: 'CASH',
        created_at: '2026-10-19T10:00:25Z', // 25s later
      },
    ];

    const anomalies = detectDuplicateTransactions(txs, 60);
    expect(anomalies.length).toBe(1);
    expect(anomalies[0].anomaly_type).toBe('DUPLICATE_TRANSACTION');
    expect(anomalies[0].entity_id).toBe('tx-2');
  });

  it('ignores transactions outside the time window or with different amounts', () => {
    const txs = [
      {
        id: 'tx-1',
        branch_id: 'b1',
        total_revenue: 55000,
        payment_method: 'CASH',
        created_at: '2026-10-19T10:00:00Z',
      },
      {
        id: 'tx-2',
        branch_id: 'b1',
        total_revenue: 55000,
        payment_method: 'CASH',
        created_at: '2026-10-19T10:05:00Z', // 5 minutes later
      },
      {
        id: 'tx-3',
        branch_id: 'b1',
        total_revenue: 80000, // Different amount
        payment_method: 'CASH',
        created_at: '2026-10-19T10:05:10Z',
      },
    ];

    expect(detectDuplicateTransactions(txs, 60)).toEqual([]);
  });

  it('ignores voided transactions', () => {
    const txs = [
      {
        id: 'tx-1',
        branch_id: 'b1',
        total_revenue: 55000,
        payment_method: 'CASH',
        created_at: '2026-10-19T10:00:00Z',
        status: 'VOID',
      },
      {
        id: 'tx-2',
        branch_id: 'b1',
        total_revenue: 55000,
        payment_method: 'CASH',
        created_at: '2026-10-19T10:00:20Z',
        status: 'COMPLETED',
      },
    ];

    expect(detectDuplicateTransactions(txs, 60)).toEqual([]);
  });
});

describe('detectCashDiscrepancy', () => {
  it('detects cash shortage and surplus beyond tolerance', () => {
    // Expected: 1.000.000, Actual: 850.000 (Shortage of 150.000 > tolerance of 20.000)
    const shortage = detectCashDiscrepancy(1000000, 850000, 'b1');
    expect(shortage).not.toBeNull();
    expect(shortage?.anomaly_type).toBe('CASH_DISCREPANCY');
    expect(shortage?.severity).toBe('CRITICAL');
    expect(shortage?.title).toContain('Kurang');

    // Expected: 500.000, Actual: 540.000 (Surplus of 40.000 > tolerance of 10.000)
    const surplus = detectCashDiscrepancy(500000, 540000, 'b1');
    expect(surplus).not.toBeNull();
    expect(surplus?.title).toContain('Berlebih');
  });

  it('ignores minor variances within tolerance', () => {
    // Expected: 1.000.000, Actual: 1.005.000 (difference 5.000 <= 10.000 tolerance floor)
    const ok = detectCashDiscrepancy(1000000, 1005000, 'b1');
    expect(ok).toBeNull();
  });
});
