// CropDiary AI — Phase 6 Finance Service
import { storageAdapter } from '@/services/storageAdapter';
import {
  FarmBudget,
  BudgetFormData,
  BudgetComparison,
  FinancialTransaction,
  TransactionFormData,
  HarvestSale,
  HarvestSaleFormData,
  HarvestBalance,
  FinanceSummary,
  ProfitabilityReport,
} from '@/types/finance';
import {
  calculateFinanceSummary,
  calculateBudgetUtilization,
  reconcileHarvestBalance,
  generateProfitabilityReport,
} from './financialCalculationEngine';

export const financeService = {
  // 1. Transactions
  async getTransactions(
    userId: string,
    filters?: {
      farmId?: string;
      plotId?: string;
      cropPlanId?: string;
      transactionType?: string;
      category?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<FinancialTransaction[]> {
    return storageAdapter.getFinancialTransactions(userId, filters);
  },

  async getTransactionById(
    userId: string,
    transactionId: string
  ): Promise<FinancialTransaction | null> {
    return storageAdapter.getTransactionById(userId, transactionId);
  },

  async createTransaction(
    userId: string,
    data: TransactionFormData
  ): Promise<FinancialTransaction> {
    return storageAdapter.createFinancialTransaction(userId, data);
  },

  async updateTransaction(
    userId: string,
    transactionId: string,
    updates: Partial<TransactionFormData>
  ): Promise<FinancialTransaction> {
    return storageAdapter.updateFinancialTransaction(userId, transactionId, updates);
  },

  async deleteTransaction(userId: string, transactionId: string): Promise<void> {
    return storageAdapter.deleteFinancialTransaction(userId, transactionId);
  },

  // 2. Budgets
  async getBudgets(userId: string, farmId?: string): Promise<FarmBudget[]> {
    return storageAdapter.getBudgets(userId, farmId);
  },

  async getBudgetById(userId: string, budgetId: string): Promise<FarmBudget | null> {
    return storageAdapter.getBudgetById(userId, budgetId);
  },

  async createBudget(userId: string, data: BudgetFormData): Promise<FarmBudget> {
    return storageAdapter.createBudget(userId, data);
  },

  async updateBudget(
    userId: string,
    budgetId: string,
    updates: Partial<BudgetFormData>
  ): Promise<FarmBudget> {
    return storageAdapter.updateBudget(userId, budgetId, updates);
  },

  async deleteBudget(userId: string, budgetId: string): Promise<void> {
    return storageAdapter.deleteBudget(userId, budgetId);
  },

  async getBudgetComparisons(
    userId: string,
    farmId?: string
  ): Promise<BudgetComparison[]> {
    const budgets = await storageAdapter.getBudgets(userId, farmId);
    const transactions = await storageAdapter.getFinancialTransactions(userId, { farmId });
    return budgets.map((b) => calculateBudgetUtilization(b, transactions));
  },

  // 3. Harvest Sales
  async getHarvestSales(
    userId: string,
    filters?: { farmId?: string; harvestRecordId?: string }
  ): Promise<HarvestSale[]> {
    return storageAdapter.getHarvestSales(userId, filters);
  },

  async getHarvestSaleById(userId: string, saleId: string): Promise<HarvestSale | null> {
    return storageAdapter.getHarvestSaleById(userId, saleId);
  },

  async createHarvestSale(
    userId: string,
    data: HarvestSaleFormData
  ): Promise<HarvestSale> {
    return storageAdapter.createHarvestSale(userId, data);
  },

  async updateHarvestSale(
    userId: string,
    saleId: string,
    updates: Partial<HarvestSaleFormData>
  ): Promise<HarvestSale> {
    return storageAdapter.updateHarvestSale(userId, saleId, updates);
  },

  async deleteHarvestSale(userId: string, saleId: string): Promise<void> {
    return storageAdapter.deleteHarvestSale(userId, saleId);
  },

  // 4. Harvest Balances Reconciliation
  async getHarvestBalances(userId: string, farmId?: string): Promise<HarvestBalance[]> {
    const diaryEntries = await storageAdapter.getDiaryEntries(userId, {
      farmId,
      entryType: 'harvest',
    });
    const allSales = await storageAdapter.getHarvestSales(userId, { farmId });

    const balances: HarvestBalance[] = [];
    for (const entry of diaryEntries) {
      if (entry.harvest) {
        balances.push(reconcileHarvestBalance(entry.harvest, allSales));
      }
    }
    return balances;
  },

  // 5. Unified Finance Summary & P&L
  async getFinanceSummary(
    userId: string,
    filters?: {
      farmId?: string;
      plotId?: string;
      cropPlanId?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<FinanceSummary> {
    const transactions = await storageAdapter.getFinancialTransactions(userId, filters);
    const sales = await storageAdapter.getHarvestSales(userId, { farmId: filters?.farmId });
    return calculateFinanceSummary(transactions, sales);
  },

  // 6. Comprehensive Profitability Report
  async getProfitabilityReport(
    userId: string,
    params: {
      farmId?: string;
      plotId?: string;
      cropPlanId?: string;
      cropName?: string;
      season?: string;
      periodLabel?: string;
    }
  ): Promise<ProfitabilityReport> {
    const transactions = await storageAdapter.getFinancialTransactions(userId, {
      farmId: params.farmId,
      plotId: params.plotId,
      cropPlanId: params.cropPlanId,
    });
    const diaryEntries = await storageAdapter.getDiaryEntries(userId, {
      farmId: params.farmId,
      plotId: params.plotId,
      cropPlanId: params.cropPlanId,
      entryType: 'harvest',
    });
    const harvests = diaryEntries
      .map((e) => e.harvest)
      .filter((h): h is NonNullable<typeof h> => Boolean(h));

    const sales = await storageAdapter.getHarvestSales(userId, {
      farmId: params.farmId,
    });

    return generateProfitabilityReport({
      transactions,
      harvests,
      sales,
      ...params,
    });
  },

  // 7. Sync Phase 5 Expenses
  async syncDiaryExpenses(userId: string): Promise<number> {
    return storageAdapter.syncPhase5ExpensesToTransactions(userId);
  },
};
