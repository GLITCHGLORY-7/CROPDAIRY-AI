// CropDiary AI — Phase 6 Deterministic Financial Calculation Engine
// Implements exact minor-unit currency arithmetic (paise), unit conversions,
// harvest reconciliation, budget utilization, and area-based cost allocations.

import {
  FinancialTransaction,
  HarvestSale,
  FarmBudget,
  BudgetComparison,
  HarvestBalance,
  FinanceSummary,
  ProfitabilityReport,
  SellingCalculatorInputs,
  SellingCalculatorResult,
} from '@/types/finance';
import { HarvestRecord } from '@/types/diary';

// --- 1. Integer Minor Unit Arithmetic (Paise) ---
export function toPaise(inr: number): number {
  if (isNaN(inr)) return 0;
  return Math.round(inr * 100);
}

export function toINR(paise: number): number {
  if (isNaN(paise)) return 0;
  return Number((paise / 100).toFixed(2));
}

// --- 2. Agricultural Unit Conversion to KG ---
export function convertToKg(quantity: number, unit: string): number {
  const q = Number(quantity);
  if (isNaN(q) || q <= 0) return 0;
  const u = (unit || '').toLowerCase().trim();

  if (u.includes('quintal') || u.includes('qtl')) return q * 100;
  if (u.includes('tonne') || u.includes('ton')) return q * 1000;
  if (u.includes('bag') || u.includes('sack')) return q * 50;
  if (u.includes('crate') || u.includes('box')) return q * 25;
  if (u.includes('kg') || u.includes('kilogram')) return q;
  if (u.includes('gram') || u.includes('g')) return q / 1000;

  // Fallback assuming unit is standard kg
  return q;
}

export function convertFromKg(kgQuantity: number, targetUnit: string): number {
  if (isNaN(kgQuantity) || kgQuantity <= 0) return 0;
  const u = (targetUnit || '').toLowerCase().trim();

  if (u.includes('quintal') || u.includes('qtl')) return Number((kgQuantity / 100).toFixed(2));
  if (u.includes('tonne') || u.includes('ton')) return Number((kgQuantity / 1000).toFixed(3));
  if (u.includes('bag') || u.includes('sack')) return Number((kgQuantity / 50).toFixed(1));
  if (u.includes('crate') || u.includes('box')) return Number((kgQuantity / 25).toFixed(1));

  return Number(kgQuantity.toFixed(2));
}

// --- 3. Harvest Sale Gross Revenue Calculation ---
export function calculateGrossSaleRevenue(
  quantitySold: number,
  quantityUnit: string,
  unitPrice: number,
  priceUnit: string = 'per_quintal'
): number {
  if (quantitySold <= 0 || unitPrice <= 0) return 0;

  const pu = priceUnit.toLowerCase().trim();
  const qu = quantityUnit.toLowerCase().trim();

  // Price is per quintal (100 kg)
  if (pu.includes('quintal')) {
    if (qu.includes('quintal')) return toINR(toPaise(quantitySold * unitPrice));
    if (qu.includes('kg')) return toINR(toPaise((quantitySold / 100) * unitPrice));
    if (qu.includes('tonne') || qu.includes('ton')) return toINR(toPaise(quantitySold * 10 * unitPrice));
    if (qu.includes('bag')) return toINR(toPaise((quantitySold * 50 / 100) * unitPrice));
  }

  // Price is per kg
  if (pu.includes('kg')) {
    if (qu.includes('kg')) return toINR(toPaise(quantitySold * unitPrice));
    if (qu.includes('quintal')) return toINR(toPaise(quantitySold * 100 * unitPrice));
    if (qu.includes('tonne') || qu.includes('ton')) return toINR(toPaise(quantitySold * 1000 * unitPrice));
    if (qu.includes('bag')) return toINR(toPaise(quantitySold * 50 * unitPrice));
  }

  // Price is per tonne (1000 kg)
  if (pu.includes('tonne') || pu.includes('ton')) {
    if (qu.includes('tonne') || qu.includes('ton')) return toINR(toPaise(quantitySold * unitPrice));
    if (qu.includes('quintal')) return toINR(toPaise((quantitySold / 10) * unitPrice));
    if (qu.includes('kg')) return toINR(toPaise((quantitySold / 1000) * unitPrice));
  }

  // Fallback: direct product
  return toINR(toPaise(quantitySold * unitPrice));
}

// --- 4. Harvest Reconciliation & Unsold Balance ---
export function reconcileHarvestBalance(
  harvest: HarvestRecord,
  sales: HarvestSale[]
): HarvestBalance {
  const harvestQtyKg = convertToKg(harvest.quantity_harvested, harvest.unit);
  const retainedKg = convertToKg(harvest.quantity_retained_household || 0, harvest.unit);
  const netAvailableKg = Math.max(0, harvestQtyKg - retainedKg);

  const linkedSales = sales.filter((s) => s.harvest_record_id === harvest.id);

  let totalSoldKg = 0;
  let totalGrossRevenuePaise = 0;
  let totalSellingCostsPaise = 0;

  for (const sale of linkedSales) {
    const saleKg = convertToKg(sale.quantity_sold, sale.quantity_unit);
    totalSoldKg += saleKg;
    totalGrossRevenuePaise += toPaise(sale.gross_revenue);
    totalSellingCostsPaise += toPaise(sale.selling_cost || 0);
  }

  const remainingKg = Math.max(0, netAvailableKg - totalSoldKg);
  const remainingInOriginalUnit = convertFromKg(remainingKg, harvest.unit);
  const isOverSold = totalSoldKg > netAvailableKg + 0.05; // 50g tolerance for floating precision

  return {
    harvestRecordId: harvest.id,
    cropName: harvest.crop_name,
    quantityHarvested: harvest.quantity_harvested,
    unit: harvest.unit,
    quantityRetainedHousehold: harvest.quantity_retained_household || 0,
    totalQuantitySold: convertFromKg(totalSoldKg, harvest.unit),
    remainingUnsoldQuantity: remainingInOriginalUnit,
    totalGrossRevenue: toINR(totalGrossRevenuePaise),
    totalSellingCosts: toINR(totalSellingCostsPaise),
    netProceeds: toINR(totalGrossRevenuePaise - totalSellingCostsPaise),
    salesCount: linkedSales.length,
    sales: linkedSales,
    isOverSold,
  };
}

// --- 5. Unified Finance Summary & P&L Aggregator ---
export function calculateFinanceSummary(
  transactions: FinancialTransaction[],
  sales: HarvestSale[] = []
): FinanceSummary {
  let totalRevenuePaise = 0;
  let totalExpensesPaise = 0;
  let otherIncomePaise = 0;
  let sellingExpensesPaise = 0;

  const expensesByCategory: Record<string, number> = {};
  const revenueByCategory: Record<string, number> = {};
  const incompleteNotes: string[] = [];

  // 1. Process Transactions
  for (const tx of transactions) {
    const amountPaise = toPaise(tx.amount);

    if (tx.transaction_type === 'expense') {
      totalExpensesPaise += amountPaise;
      expensesByCategory[tx.category] = (expensesByCategory[tx.category] || 0) + tx.amount;
    } else if (tx.transaction_type === 'refund_adjustment') {
      // Refunds reduce expenses
      totalExpensesPaise = Math.max(0, totalExpensesPaise - amountPaise);
      expensesByCategory[tx.category] = Math.max(0, (expensesByCategory[tx.category] || 0) - tx.amount);
    } else if (tx.transaction_type === 'sale_revenue') {
      totalRevenuePaise += amountPaise;
      revenueByCategory[tx.category] = (revenueByCategory[tx.category] || 0) + tx.amount;
    } else if (tx.transaction_type === 'other_income') {
      otherIncomePaise += amountPaise;
      revenueByCategory[tx.category] = (revenueByCategory[tx.category] || 0) + tx.amount;
    }
  }

  // 2. Track selling costs across sales
  for (const s of sales) {
    if (s.selling_cost && s.selling_cost > 0) {
      sellingExpensesPaise += toPaise(s.selling_cost);
    }
  }

  const netResultPaise = (totalRevenuePaise + otherIncomePaise) - totalExpensesPaise;

  if (transactions.length === 0 && sales.length === 0) {
    incompleteNotes.push('No financial transactions recorded yet.');
  }

  return {
    totalRevenue: toINR(totalRevenuePaise),
    totalExpenses: toINR(totalExpensesPaise),
    netProfitOrLoss: toINR(netResultPaise),
    sellingExpenses: toINR(sellingExpensesPaise),
    otherIncome: toINR(otherIncomePaise),
    expensesByCategory,
    revenueByCategory,
    transactionCount: transactions.length,
    salesCount: sales.length,
    incompleteDataNotes: incompleteNotes,
  };
}

// --- 6. Budget Utilization Engine ---
export function calculateBudgetUtilization(
  budget: FarmBudget,
  transactions: FinancialTransaction[]
): BudgetComparison {
  const bStart = new Date(budget.period_start).getTime();
  const bEnd = new Date(budget.period_end).getTime() + (24 * 60 * 60 * 1000 - 1); // end of day

  // Match transactions in budget scope
  const matchingExpenses = transactions.filter((tx) => {
    if (tx.transaction_type !== 'expense') return false;
    if (tx.farm_id !== budget.farm_id) return false;
    if (budget.plot_id && tx.plot_id && tx.plot_id !== budget.plot_id) return false;
    if (budget.crop_plan_id && tx.crop_plan_id && tx.crop_plan_id !== budget.crop_plan_id) return false;
    if (budget.category !== 'all' && tx.category !== budget.category) return false;

    const txTime = new Date(tx.occurred_at).getTime();
    return txTime >= bStart && txTime <= bEnd;
  });

  let spentPaise = 0;
  for (const e of matchingExpenses) {
    spentPaise += toPaise(e.amount);
  }

  const actualSpent = toINR(spentPaise);
  const plannedAmount = budget.amount;
  const remainingBudget = toINR(toPaise(plannedAmount) - spentPaise);

  let percentUsed = 0;
  if (plannedAmount > 0) {
    percentUsed = Number(((actualSpent / plannedAmount) * 100).toFixed(1));
  }

  let status: 'under_budget' | 'warning' | 'over_budget' = 'under_budget';
  if (percentUsed > 100) {
    status = 'over_budget';
  } else if (percentUsed >= budget.alert_threshold_percent) {
    status = 'warning';
  }

  const isIncompleteData = matchingExpenses.length === 0 && new Date() < new Date(budget.period_end);

  return {
    budget,
    plannedAmount,
    actualSpent,
    remainingBudget,
    percentUsed,
    status,
    isIncompleteData,
  };
}

// --- 7. Area-Based Overhead Allocation Engine ---
export function allocateOverheadByArea(
  overheadAmount: number,
  plotAreaAcres: number,
  totalFarmAreaAcres: number
): { allocatedAmount: number; sharePercent: number } {
  if (totalFarmAreaAcres <= 0 || plotAreaAcres <= 0 || overheadAmount <= 0) {
    return { allocatedAmount: 0, sharePercent: 0 };
  }

  const share = Math.min(1, plotAreaAcres / totalFarmAreaAcres);
  const allocatedPaise = Math.round(toPaise(overheadAmount) * share);

  return {
    allocatedAmount: toINR(allocatedPaise),
    sharePercent: Number((share * 100).toFixed(1)),
  };
}

// --- 8. Comprehensive Profitability Report Generator ---
export function generateProfitabilityReport(params: {
  transactions: FinancialTransaction[];
  harvests: HarvestRecord[];
  sales: HarvestSale[];
  farmId?: string;
  plotId?: string;
  cropPlanId?: string;
  cropName?: string;
  season?: string;
  periodLabel?: string;
}): ProfitabilityReport {
  const {
    transactions,
    harvests,
    sales,
    farmId,
    plotId,
    cropPlanId,
    cropName,
    season,
    periodLabel = 'All Time',
  } = params;

  let directCultivationPaise = 0;
  let sellingCostsPaise = 0;
  let cropSalesPaise = 0;
  let otherIncomePaise = 0;

  for (const tx of transactions) {
    const p = toPaise(tx.amount);
    if (tx.transaction_type === 'expense') {
      if (tx.category === 'transport' || tx.category === 'packaging') {
        sellingCostsPaise += p;
      } else {
        directCultivationPaise += p;
      }
    } else if (tx.transaction_type === 'refund_adjustment') {
      directCultivationPaise = Math.max(0, directCultivationPaise - p);
    } else if (tx.transaction_type === 'sale_revenue') {
      cropSalesPaise += p;
    } else if (tx.transaction_type === 'other_income') {
      otherIncomePaise += p;
    }
  }

  // Include explicit selling costs from harvest sales
  for (const s of sales) {
    if (s.selling_cost && s.selling_cost > 0) {
      sellingCostsPaise += toPaise(s.selling_cost);
    }
  }

  const totalExpensesPaise = directCultivationPaise + sellingCostsPaise;
  const totalRevenuePaise = cropSalesPaise + otherIncomePaise;
  const netProfitPaise = totalRevenuePaise - totalExpensesPaise;

  const totalRevenue = toINR(totalRevenuePaise);
  const totalExpenses = toINR(totalExpensesPaise);
  const netProfit = toINR(netProfitPaise);

  let profitMarginPercent = 0;
  if (totalRevenue > 0) {
    profitMarginPercent = Number(((netProfit / totalRevenue) * 100).toFixed(1));
  }

  // Calculate yield & unit economics
  let totalHarvestKg = 0;
  for (const h of harvests) {
    totalHarvestKg += convertToKg(h.quantity_harvested, h.unit);
  }

  let totalSoldKg = 0;
  for (const s of sales) {
    totalSoldKg += convertToKg(s.quantity_sold, s.quantity_unit);
  }

  const unsoldKg = Math.max(0, totalHarvestKg - totalSoldKg);

  let costPerKg: number | null = null;
  let revenuePerKg: number | null = null;
  let netMarginPerKg: number | null = null;

  if (totalHarvestKg > 0) {
    costPerKg = Number((totalExpenses / totalHarvestKg).toFixed(2));
  }

  if (totalSoldKg > 0) {
    revenuePerKg = Number((toINR(cropSalesPaise) / totalSoldKg).toFixed(2));
    if (costPerKg !== null) {
      netMarginPerKg = Number((revenuePerKg - costPerKg).toFixed(2));
    }
  }

  const disclaimers: string[] = [];
  let isCompleteSeason = true;

  if (harvests.length > 0 && sales.length === 0) {
    isCompleteSeason = false;
    disclaimers.push(
      'Harvest recorded with no sales yet. Net profit currently reflects negative investment until produce is sold.'
    );
  }

  if (directCultivationPaise > 0 && harvests.length === 0) {
    isCompleteSeason = false;
    disclaimers.push(
      'Crop season currently in cultivation. Yield and revenue have not yet been realized.'
    );
  }

  if (disclaimers.length === 0) {
    disclaimers.push(
      'Profitability based on actual recorded expenses and completed sales transactions.'
    );
  }

  return {
    farmId,
    plotId,
    cropPlanId,
    cropName,
    season,
    periodLabel,
    cultivationExpenses: toINR(directCultivationPaise),
    sellingExpenses: toINR(sellingCostsPaise),
    totalExpenses,
    cropSalesRevenue: toINR(cropSalesPaise),
    otherAgriculturalIncome: toINR(otherIncomePaise),
    totalRevenue,
    netProfit,
    profitMarginPercent,
    totalHarvestKg: Math.round(totalHarvestKg),
    totalSoldKg: Math.round(totalSoldKg),
    unsoldKg: Math.round(unsoldKg),
    costPerKg,
    revenuePerKg,
    netMarginPerKg,
    isCompleteSeason,
    disclaimers,
  };
}

// --- 9. Selling Insights & Net Return Calculator Engine ---
export function calculateSellingDecision(
  inputs: SellingCalculatorInputs
): SellingCalculatorResult {
  const {
    quantity,
    unit,
    mandiModalPricePerQuintal,
    distanceKm,
    transportRatePerKm,
    loadingUnloadingCost,
    mandiCessPercent,
    localTraderOfferPerUnit,
  } = inputs;

  // 1. Normalize quantity to quintals
  let quantityQuintals = quantity;
  if (unit === 'kg') quantityQuintals = quantity / 100;
  if (unit === 'tonnes') quantityQuintals = quantity * 10;

  // 2. Mandi Gross Revenue
  const grossMandiPaise = toPaise(quantityQuintals * mandiModalPricePerQuintal);

  // 3. Logistics & Market Fees
  // Transport: flat or per-km basis
  const transportPaise = toPaise(distanceKm * transportRatePerKm);
  const loadingPaise = toPaise(loadingUnloadingCost);
  const mandiCessPaise = Math.round((grossMandiPaise * mandiCessPercent) / 100);
  const totalSellingPaise = transportPaise + loadingPaise + mandiCessPaise;

  const netMandiPaise = grossMandiPaise - totalSellingPaise;
  const netMandiProceeds = toINR(netMandiPaise);

  // Net rate per user unit
  let netMandiRatePerUnit = 0;
  if (quantity > 0) {
    netMandiRatePerUnit = Number((netMandiProceeds / quantity).toFixed(2));
  }

  // 4. Local Farmgate Buyer Revenue (Zero transport/cess)
  const localTraderPaise = toPaise(quantity * localTraderOfferPerUnit);
  const localTraderGrossRevenue = toINR(localTraderPaise);

  // 5. Differential analysis
  const diffPaise = netMandiPaise - localTraderPaise;
  const differenceVsLocalOffer = toINR(diffPaise);

  const recommendedAction: 'mandi' | 'farmgate' =
    diffPaise > 0 ? 'mandi' : 'farmgate';

  let justification = '';
  if (diffPaise > 0) {
    justification = `Selling at APMC Mandi yields ₹${Math.abs(
      differenceVsLocalOffer
    ).toLocaleString('en-IN')} higher net proceeds after deducting transport (₹${toINR(
      transportPaise
    )}) and market cess (₹${toINR(mandiCessPaise)}).`;
  } else {
    justification = `Selling to local farmgate trader saves ₹${Math.abs(
      differenceVsLocalOffer
    ).toLocaleString('en-IN')} in transport and handling overhead, yielding a better net return.`;
  }

  return {
    quantityQuintals: Number(quantityQuintals.toFixed(2)),
    grossMandiRevenue: toINR(grossMandiPaise),
    transportCost: toINR(transportPaise),
    mandiCessCost: toINR(mandiCessPaise),
    loadingCost: toINR(loadingPaise),
    totalSellingCost: toINR(totalSellingPaise),
    netMandiProceeds,
    netMandiRatePerUnit,
    localTraderGrossRevenue,
    differenceVsLocalOffer,
    recommendedAction,
    justification,
  };
}
