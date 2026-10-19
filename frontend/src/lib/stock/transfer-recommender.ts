export interface BranchProductStock {
  product_id: string;
  branch_id: string;
  branch_name: string;
  sku: string;
  name: string;
  category: string;
  selling_price: number;
  cost_price: number;
  current_stock: number;
  min_stock_alert: number;
  daily_sales_velocity: number; // Units sold per day on average
}

export interface StockTransferRecommendation {
  id?: string;
  from_branch_id: string;
  from_branch_name: string;
  from_product_id: string;
  to_branch_id: string;
  to_branch_name: string;
  to_product_id: string;
  sku: string;
  product_name: string;
  transfer_qty: number;
  from_current_stock: number;
  from_stock_after: number;
  to_current_stock: number;
  to_stock_after: number;
  to_days_of_supply_before: number;
  to_days_of_supply_after: number;
  potential_saved_revenue: number;
  estimated_gross_profit: number;
  logistics_cost: number;
  net_benefit: number;
  urgency: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason: string;
}

export interface TransferRecommenderOptions {
  flatLogisticsCost?: number; // Default flat delivery cost: Rp 15.000
  minDaysOfSupplyThreshold?: number; // Days of supply below which branch is critical (default: 3)
  targetDaysOfSupplyBuffer?: number; // Target supply days after transfer (default: 7)
  donorBufferMultiplier?: number; // Multiplier of min_stock_alert donor must retain (default: 1.5)
}

/**
 * Calculates days of supply remaining for a given product at a branch.
 */
export function calculateDaysOfSupply(currentStock: number, dailyVelocity: number): number {
  if (dailyVelocity <= 0) {
    return currentStock > 0 ? 999 : 0;
  }
  return Math.round((currentStock / dailyVelocity) * 10) / 10;
}

/**
 * Generates smart stock transfer recommendations across branches.
 * Matches products with the identical SKU, prioritizing needy branches and donors with surplus stock.
 */
export function generateStockTransferRecommendations(
  catalog: BranchProductStock[],
  options: TransferRecommenderOptions = {}
): StockTransferRecommendation[] {
  const flatLogisticsCost = options.flatLogisticsCost ?? 15000;
  const minDaysOfSupplyThreshold = options.minDaysOfSupplyThreshold ?? 3.0;
  const targetDaysOfSupplyBuffer = options.targetDaysOfSupplyBuffer ?? 7.0;
  const donorBufferMultiplier = options.donorBufferMultiplier ?? 1.5;

  const recommendations: StockTransferRecommendation[] = [];

  // 1. Group products by SKU across branches
  const skuMap = new Map<string, BranchProductStock[]>();
  catalog.forEach((item) => {
    const list = skuMap.get(item.sku) || [];
    list.push(item);
    skuMap.set(item.sku, list);
  });

  // 2. Evaluate each SKU group
  skuMap.forEach((branchProducts, sku) => {
    // Need at least 2 branches with this SKU to perform inter-branch transfer
    if (branchProducts.length < 2) return;

    // Identify needy branches (Recipient)
    const needyBranches: BranchProductStock[] = [];
    const potentialDonors: BranchProductStock[] = [];

    branchProducts.forEach((bp) => {
      const daysOfSupply = calculateDaysOfSupply(bp.current_stock, bp.daily_sales_velocity);
      const isCriticalStock = bp.current_stock <= bp.min_stock_alert;
      const isLowDaysOfSupply = bp.daily_sales_velocity > 0 && daysOfSupply <= minDaysOfSupplyThreshold;

      if (isCriticalStock || isLowDaysOfSupply) {
        needyBranches.push(bp);
      } else {
        potentialDonors.push(bp);
      }
    });

    if (needyBranches.length === 0 || potentialDonors.length === 0) return;

    // Sort needy by urgency (lowest days of supply or lowest stock ratio first)
    needyBranches.sort((a, b) => {
      const daysA = calculateDaysOfSupply(a.current_stock, a.daily_sales_velocity);
      const daysB = calculateDaysOfSupply(b.current_stock, b.daily_sales_velocity);
      return daysA - daysB;
    });

    // Evaluate each needy recipient against best available donor
    needyBranches.forEach((recipient) => {
      // Find donors with available surplus
      const eligibleDonors = potentialDonors
        .map((donor) => {
          // Donor must keep at least donorBufferMultiplier * min_stock_alert or 5 days of its own velocity
          const safeReserve = Math.max(
            Math.ceil(donor.min_stock_alert * donorBufferMultiplier),
            Math.ceil(donor.daily_sales_velocity * 5)
          );
          const availableSurplus = Math.max(0, donor.current_stock - safeReserve);
          return { donor, availableSurplus };
        })
        .filter((d) => d.availableSurplus > 0)
        // Sort donors with highest surplus first
        .sort((a, b) => b.availableSurplus - a.availableSurplus);

      if (eligibleDonors.length === 0) return;

      const bestDonor = eligibleDonors[0];

      // Calculate deficit to reach target days of supply
      const targetStock = Math.max(
        recipient.min_stock_alert * 2,
        Math.ceil(recipient.daily_sales_velocity * targetDaysOfSupplyBuffer)
      );
      const deficit = Math.max(1, targetStock - recipient.current_stock);

      // Transfer quantity is capped by donor surplus and recipient deficit
      const transferQty = Math.min(bestDonor.availableSurplus, deficit);
      if (transferQty <= 0) return;

      // Financial feasibility check
      const unitGrossProfit = Math.max(0, recipient.selling_price - recipient.cost_price);
      const potentialSavedRevenue = transferQty * recipient.selling_price;
      const estimatedGrossProfit = transferQty * unitGrossProfit;
      const netBenefit = estimatedGrossProfit - flatLogisticsCost;

      // Only recommend if net financial benefit > 0 (profit covers logistics cost)
      if (netBenefit <= 0) return;

      const daysBefore = calculateDaysOfSupply(recipient.current_stock, recipient.daily_sales_velocity);
      const toStockAfter = recipient.current_stock + transferQty;
      const daysAfter = calculateDaysOfSupply(toStockAfter, recipient.daily_sales_velocity);
      const fromStockAfter = bestDonor.donor.current_stock - transferQty;

      let urgency: 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'HIGH';
      if (recipient.current_stock === 0 || daysBefore <= 1.0) {
        urgency = 'CRITICAL';
      } else if (daysBefore <= 2.5) {
        urgency = 'HIGH';
      } else {
        urgency = 'MEDIUM';
      }

      recommendations.push({
        id: `rec-transfer-${sku}-${bestDonor.donor.branch_id}-${recipient.branch_id}`,
        from_branch_id: bestDonor.donor.branch_id,
        from_branch_name: bestDonor.donor.branch_name,
        from_product_id: bestDonor.donor.product_id,
        to_branch_id: recipient.branch_id,
        to_branch_name: recipient.branch_name,
        to_product_id: recipient.product_id,
        sku,
        product_name: recipient.name,
        transfer_qty: transferQty,
        from_current_stock: bestDonor.donor.current_stock,
        from_stock_after: fromStockAfter,
        to_current_stock: recipient.current_stock,
        to_stock_after: toStockAfter,
        to_days_of_supply_before: daysBefore,
        to_days_of_supply_after: daysAfter,
        potential_saved_revenue: potentialSavedRevenue,
        estimated_gross_profit: estimatedGrossProfit,
        logistics_cost: flatLogisticsCost,
        net_benefit: netBenefit,
        urgency,
        reason: `Stok ${recipient.name} di ${recipient.branch_name} tersisa ${recipient.current_stock} unit (aman: ${daysBefore} hari). Cabang ${bestDonor.donor.branch_name} memiliki surplus ${bestDonor.availableSurplus} unit. Mutasi ${transferQty} unit menghasilkan keuntungan bersih Rp ${netBenefit.toLocaleString('id-ID')} setelah ongkir Rp ${flatLogisticsCost.toLocaleString('id-ID')}.`,
      });

      // Update donor's current stock in memory so subsequent recipients don't over-allocate
      bestDonor.donor.current_stock = fromStockAfter;
    });
  });

  // Sort recommendations by net_benefit descending
  return recommendations.sort((a, b) => b.net_benefit - a.net_benefit);
}
