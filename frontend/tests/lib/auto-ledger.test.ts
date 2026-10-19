import { describe, it, expect } from 'vitest';
import {
  calculateFinancialReport,
  aggregateExpensesByCategory,
  aggregateRevenueByPaymentMethod,
  aggregateBranchPerformance,
  aggregateDailyFinancialTimeline,
  aggregateProductSalesPerformance,
  LedgerTransaction,
  LedgerExpense,
  LedgerBranch,
} from '@/lib/finance/auto-ledger';

describe('Auto-Ledger Calculation Engine (auto-ledger.ts)', () => {
  const mockBranches: LedgerBranch[] = [
    { id: 'b1', name: 'Cabang Pusat', daily_target: 5000000 },
    { id: 'b2', name: 'Cabang Sudirman', daily_target: 3000000 },
  ];

  const mockTransactions: LedgerTransaction[] = [
    {
      id: 'tx-1',
      branch_id: 'b1',
      business_date: '2026-10-15',
      payment_method: 'CASH',
      status: 'COMPLETED',
      total_revenue: 100000,
      total_cogs: 60000,
      items: [
        {
          product_id: 'p1',
          product_name: 'Kopi Susu Gula Aren',
          quantity: 5,
          unit_cost: 12000,
          unit_price: 20000,
          subtotal: 100000,
        },
      ],
    },
    {
      id: 'tx-2',
      branch_id: 'b1',
      business_date: '2026-10-15',
      payment_method: 'QRIS_SIM',
      status: 'COMPLETED',
      total_revenue: 50000,
      total_cogs: 30000,
      items: [
        {
          product_id: 'p2',
          product_name: 'Croissant Butter',
          quantity: 2,
          unit_cost: 15000,
          unit_price: 25000,
          subtotal: 50000,
        },
      ],
    },
    {
      id: 'tx-3',
      branch_id: 'b2',
      business_date: '2026-10-16',
      payment_method: 'CASH',
      status: 'COMPLETED',
      total_revenue: 200000,
      total_cogs: 120000,
      items: [
        {
          product_id: 'p1',
          product_name: 'Kopi Susu Gula Aren',
          quantity: 10,
          unit_cost: 12000,
          unit_price: 20000,
          subtotal: 200000,
        },
      ],
    },
    {
      id: 'tx-void',
      branch_id: 'b1',
      business_date: '2026-10-15',
      payment_method: 'CASH',
      status: 'VOID',
      total_revenue: 80000,
      total_cogs: 40000,
    },
  ];

  const mockExpenses: LedgerExpense[] = [
    {
      id: 'exp-1',
      branch_id: 'b1',
      expense_date: '2026-10-15',
      category: 'Utilitas',
      description: 'Listrik PLN',
      amount: 40000,
    },
    {
      id: 'exp-2',
      branch_id: 'b2',
      expense_date: '2026-10-16',
      category: 'Gaji',
      description: 'Uang Makan Barista',
      amount: 60000,
    },
  ];

  it('calculates core financial statement accurately excluding VOID transactions', () => {
    const report = calculateFinancialReport({
      transactions: mockTransactions,
      expenses: mockExpenses,
      branches: mockBranches,
      startDate: '2026-10-15',
      endDate: '2026-10-16',
    });

    // Completed: tx-1 (100k), tx-2 (50k), tx-3 (200k) = 350.000
    expect(report.metrics.total_revenue).toBe(350000);
    // COGS: 60k + 30k + 120k = 210.000
    expect(report.metrics.total_cogs).toBe(210000);
    // Gross Profit: 350.000 - 210.000 = 140.000
    expect(report.metrics.gross_profit).toBe(140000);
    // Gross Margin: (140.000 / 350.000) * 100 = 40.00%
    expect(report.metrics.gross_margin_pct).toBe(40);

    // Expenses: 40k + 60k = 100.000
    expect(report.metrics.total_expenses).toBe(100000);
    // Net Profit: 140.000 - 100.000 = 40.000
    expect(report.metrics.net_profit).toBe(40000);
    // Net Margin: (40.000 / 350.000) * 100 = 11.43%
    expect(report.metrics.net_margin_pct).toBe(11.43);

    // Void metrics
    expect(report.metrics.void_count).toBe(1);
    expect(report.metrics.void_total_revenue).toBe(80000);

    // Transaction & ticket size
    expect(report.metrics.total_transactions).toBe(3);
    expect(report.metrics.average_ticket_size).toBe(Math.round(350000 / 3));

    // Cashflow
    expect(report.cashflow.cash_in).toBe(350000);
    expect(report.cashflow.cash_out).toBe(100000);
    expect(report.cashflow.net_cashflow).toBe(250000);
  });

  it('handles zero revenue and empty data safely without division by zero', () => {
    const report = calculateFinancialReport({
      transactions: [],
      expenses: [],
      branches: [],
    });

    expect(report.metrics.total_revenue).toBe(0);
    expect(report.metrics.total_cogs).toBe(0);
    expect(report.metrics.gross_profit).toBe(0);
    expect(report.metrics.gross_margin_pct).toBe(0);
    expect(report.metrics.net_profit).toBe(0);
    expect(report.metrics.net_margin_pct).toBe(0);
    expect(report.metrics.total_transactions).toBe(0);
    expect(report.metrics.average_ticket_size).toBe(0);
    expect(report.metrics.void_count).toBe(0);
  });

  it('aggregates expenses by category with exact percentages sorted descending', () => {
    const expenses: LedgerExpense[] = [
      { id: '1', branch_id: 'b1', expense_date: '2026-10-15', category: 'Utilitas', description: 'PLN', amount: 30000 },
      { id: '2', branch_id: 'b1', expense_date: '2026-10-15', category: 'Gaji', description: 'Staff', amount: 70000 },
    ];

    const breakdown = aggregateExpensesByCategory(expenses, 100000);
    expect(breakdown).toHaveLength(2);
    expect(breakdown[0].category).toBe('Gaji');
    expect(breakdown[0].total_amount).toBe(70000);
    expect(breakdown[0].percentage_of_expenses).toBe(70);

    expect(breakdown[1].category).toBe('Utilitas');
    expect(breakdown[1].total_amount).toBe(30000);
    expect(breakdown[1].percentage_of_expenses).toBe(30);
  });

  it('aggregates revenue by payment method excluding void sales', () => {
    const breakdown = aggregateRevenueByPaymentMethod(mockTransactions);
    // CASH: tx-1 (100k) + tx-3 (200k) = 300k (tx-void ignored)
    // QRIS_SIM: tx-2 (50k)
    expect(breakdown).toHaveLength(2);
    expect(breakdown[0].payment_method).toBe('CASH');
    expect(breakdown[0].total_amount).toBe(300000);
    expect(breakdown[0].percentage_of_revenue).toBe(85.71);

    expect(breakdown[1].payment_method).toBe('QRIS_SIM');
    expect(breakdown[1].total_amount).toBe(50000);
    expect(breakdown[1].percentage_of_revenue).toBe(14.29);
  });

  it('aggregates multi-branch performance with targets and margins', () => {
    const branchPerf = aggregateBranchPerformance(mockTransactions, mockExpenses, mockBranches, 2);

    // Sorted by revenue descending: b2 (200k) vs b1 (150k)
    expect(branchPerf[0].branch_id).toBe('b2');
    expect(branchPerf[0].revenue).toBe(200000);
    expect(branchPerf[0].cogs).toBe(120000);
    expect(branchPerf[0].gross_profit).toBe(80000);
    expect(branchPerf[0].expenses).toBe(60000);
    expect(branchPerf[0].net_profit).toBe(20000);
    // Target b2: 3.000.000 * 2 days = 6.000.000 -> (200k / 6M) * 100 = 3.33%
    expect(branchPerf[0].target_achievement_pct).toBe(3.33);

    expect(branchPerf[1].branch_id).toBe('b1');
    expect(branchPerf[1].revenue).toBe(150000);
    expect(branchPerf[1].gross_profit).toBe(60000);
    expect(branchPerf[1].expenses).toBe(40000);
    expect(branchPerf[1].net_profit).toBe(20000);
  });

  it('aggregates continuous daily financial timeline between start and end date', () => {
    const timeline = aggregateDailyFinancialTimeline(
      mockTransactions,
      mockExpenses,
      '2026-10-15',
      '2026-10-17'
    );

    expect(timeline).toHaveLength(3);
    // 2026-10-15: tx-1 + tx-2 = 150.000 rev, 90.000 cogs, 40.000 exp
    expect(timeline[0].date).toBe('2026-10-15');
    expect(timeline[0].revenue).toBe(150000);
    expect(timeline[0].cogs).toBe(90000);
    expect(timeline[0].gross_profit).toBe(60000);
    expect(timeline[0].expenses).toBe(40000);
    expect(timeline[0].net_profit).toBe(20000);
    expect(timeline[0].tx_count).toBe(2);

    // 2026-10-16: tx-3 = 200.000 rev, 120.000 cogs, 60.000 exp
    expect(timeline[1].date).toBe('2026-10-16');
    expect(timeline[1].revenue).toBe(200000);
    expect(timeline[1].expenses).toBe(60000);
    expect(timeline[1].net_profit).toBe(20000);

    // 2026-10-17: empty day
    expect(timeline[2].date).toBe('2026-10-17');
    expect(timeline[2].revenue).toBe(0);
    expect(timeline[2].expenses).toBe(0);
    expect(timeline[2].net_profit).toBe(0);
  });

  it('ranks top products by sales volume and revenue accurately', () => {
    const products = aggregateProductSalesPerformance(mockTransactions);

    // p1: tx-1 (5 @ 20k = 100k) + tx-3 (10 @ 20k = 200k) = 15 qty, 300.000 rev
    // p2: tx-2 (2 @ 25k = 50k) = 2 qty, 50.000 rev
    expect(products).toHaveLength(2);
    expect(products[0].product_id).toBe('p1');
    expect(products[0].product_name).toBe('Kopi Susu Gula Aren');
    expect(products[0].quantity_sold).toBe(15);
    expect(products[0].revenue).toBe(300000);
    expect(products[0].cogs).toBe(180000);
    expect(products[0].gross_profit).toBe(120000);
    expect(products[0].gross_margin_pct).toBe(40);

    expect(products[1].product_id).toBe('p2');
    expect(products[1].quantity_sold).toBe(2);
    expect(products[1].revenue).toBe(50000);
  });
});
