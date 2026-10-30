// CropDiary AI — Phase 6 Farm Finance & Market Prices Type Definitions
import type { BasePaymentStatus } from './diary';

export type BudgetStatus = 'active' | 'completed' | 'archived';

export type ExpenseCategory =
  | 'seeds'
  | 'fertilizer'
  | 'pesticide'
  | 'labor'
  | 'machinery'
  | 'fuel'
  | 'irrigation_electricity'
  | 'transport'
  | 'packaging'
  | 'lease_rent'
  | 'other';

export type SaleCategory = 'crop_sale' | 'byproduct_sale';

export type OtherIncomeCategory =
  | 'subsidy_grant'
  | 'insurance_payout'
  | 'lease_inflow'
  | 'other';

export type RefundCategory = 'input_refund' | 'advance_adjustment' | 'other';

export type TransactionType =
  | 'expense'
  | 'sale_revenue'
  | 'other_income'
  | 'refund_adjustment';

export type PaymentMethod =
  | 'cash'
  | 'upi'
  | 'bank_transfer'
  | 'credit'
  | 'cheque';

export type PaymentStatus = BasePaymentStatus | 'received';

export interface FarmBudget {
  id: string;
  owner_id: string;
  farm_id: string;
  plot_id?: string | null;
  crop_plan_id?: string | null;
  name: string;
  category: ExpenseCategory | 'all';
  amount: number; // in INR
  currency: string;
  period_start: string; // YYYY-MM-DD
  period_end: string; // YYYY-MM-DD
  alert_threshold_percent: number; // default 80
  notes?: string | null;
  status: BudgetStatus;
  created_at: string;
  updated_at: string;
}

export interface BudgetFormData {
  farm_id: string;
  plot_id?: string | null;
  crop_plan_id?: string | null;
  name: string;
  category: ExpenseCategory | 'all';
  amount: number;
  currency?: string;
  period_start: string;
  period_end: string;
  alert_threshold_percent?: number;
  notes?: string | null;
  status?: BudgetStatus;
}

export interface BudgetComparison {
  budget: FarmBudget;
  plannedAmount: number;
  actualSpent: number;
  remainingBudget: number;
  percentUsed: number;
  status: 'under_budget' | 'warning' | 'over_budget';
  isIncompleteData: boolean;
}

export interface HarvestSale {
  id: string;
  owner_id: string;
  farm_id: string;
  plot_id?: string | null;
  crop_plan_id?: string | null;
  harvest_record_id?: string | null;
  crop_name: string;
  quantity_sold: number;
  quantity_unit: string;
  unit_price: number;
  price_unit: string;
  currency: string;
  gross_revenue: number;
  selling_cost: number;
  net_proceeds: number;
  sale_date: string; // YYYY-MM-DD
  buyer_market?: string | null;
  buyer_reference?: string | null;
  payment_status: 'received' | 'pending' | 'partial';
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface HarvestSaleFormData {
  farm_id: string;
  plot_id?: string | null;
  crop_plan_id?: string | null;
  harvest_record_id?: string | null;
  crop_name: string;
  quantity_sold: number;
  quantity_unit: string;
  unit_price: number;
  price_unit?: string;
  currency?: string;
  selling_cost?: number;
  sale_date: string;
  buyer_market?: string | null;
  buyer_reference?: string | null;
  payment_status?: 'received' | 'pending' | 'partial';
  notes?: string | null;
  allow_exceed_harvest?: boolean;
}

export interface HarvestBalance {
  harvestRecordId: string;
  cropName: string;
  quantityHarvested: number;
  unit: string;
  quantityRetainedHousehold: number;
  totalQuantitySold: number;
  remainingUnsoldQuantity: number;
  totalGrossRevenue: number;
  totalSellingCosts: number;
  netProceeds: number;
  salesCount: number;
  sales: HarvestSale[];
  isOverSold: boolean;
}

export interface FinancialTransaction {
  id: string;
  owner_id: string;
  farm_id: string;
  plot_id?: string | null;
  crop_plan_id?: string | null;
  transaction_type: TransactionType;
  category: string;
  amount: number;
  currency: string;
  occurred_at: string;
  description: string;
  source_diary_entry_id?: string | null;
  source_harvest_sale_id?: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  receipt_photo_url?: string | null;
  invoice_number?: string | null;
  vendor_buyer?: string | null;
  notes?: string | null;
  is_allocated?: boolean;
  allocation_method?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionFormData {
  farm_id: string;
  plot_id?: string | null;
  crop_plan_id?: string | null;
  transaction_type: TransactionType;
  category: string;
  amount: number;
  currency?: string;
  occurred_at: string;
  description: string;
  source_diary_entry_id?: string | null;
  source_harvest_sale_id?: string | null;
  payment_method?: PaymentMethod;
  payment_status?: PaymentStatus;
  receipt_photo_url?: string | null;
  invoice_number?: string | null;
  vendor_buyer?: string | null;
  notes?: string | null;
}

export interface FinanceSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfitOrLoss: number;
  sellingExpenses: number;
  otherIncome: number;
  expensesByCategory: Record<string, number>;
  revenueByCategory: Record<string, number>;
  transactionCount: number;
  salesCount: number;
  incompleteDataNotes: string[];
}

export interface ProfitabilityReport {
  farmId?: string;
  plotId?: string;
  cropPlanId?: string;
  cropName?: string;
  season?: string;
  periodLabel: string;
  cultivationExpenses: number;
  sellingExpenses: number;
  totalExpenses: number;
  cropSalesRevenue: number;
  otherAgriculturalIncome: number;
  totalRevenue: number;
  netProfit: number;
  profitMarginPercent: number;
  totalHarvestKg: number;
  totalSoldKg: number;
  unsoldKg: number;
  costPerKg: number | null;
  revenuePerKg: number | null;
  netMarginPerKg: number | null;
  isCompleteSeason: boolean;
  disclaimers: string[];
}

export interface MandiMarketPrice {
  id: string;
  commodity: string;
  variety?: string | null;
  state: string;
  district: string;
  market_name: string;
  min_price: number; // in Rs/Quintal
  max_price: number; // in Rs/Quintal
  modal_price: number; // in Rs/Quintal
  price_unit: string;
  arrival_date: string; // YYYY-MM-DD
  source: string;
  retrieved_at: string;
}

export interface MarketPriceQueryParams {
  commodity?: string;
  state?: string;
  district?: string;
  startDate?: string;
  endDate?: string;
}

export interface SellingCalculatorInputs {
  cropName: string;
  quantity: number;
  unit: 'quintals' | 'kg' | 'tonnes';
  mandiModalPricePerQuintal: number;
  distanceKm: number;
  transportRatePerKm: number; // flat or per km
  loadingUnloadingCost: number;
  mandiCessPercent: number; // typically 1-2%
  localTraderOfferPerUnit: number;
}

export interface SellingCalculatorResult {
  quantityQuintals: number;
  grossMandiRevenue: number;
  transportCost: number;
  mandiCessCost: number;
  loadingCost: number;
  totalSellingCost: number;
  netMandiProceeds: number;
  netMandiRatePerUnit: number;
  localTraderGrossRevenue: number;
  differenceVsLocalOffer: number;
  recommendedAction: 'mandi' | 'farmgate';
  justification: string;
}
