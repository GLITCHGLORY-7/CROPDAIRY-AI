// CropDiary AI — Phase 6 Farm Finance, Budgets, Harvest Sales & Mandi Prices Test Suite
import { describe, it, expect, beforeEach } from 'vitest';
import {
  toPaise,
  toINR,
  convertToKg,
  convertFromKg,
  calculateGrossSaleRevenue,
  reconcileHarvestBalance,
  calculateFinanceSummary,
  calculateBudgetUtilization,
  allocateOverheadByArea,
  calculateSellingDecision,
} from '@/features/finance/services/financialCalculationEngine';
import { financeService } from '@/features/finance/services/financeService';
import { marketPriceService } from '@/features/finance/services/marketPriceService';
import { storageAdapter } from '@/services/storageAdapter';
import {
  transactionFormSchema,
  harvestSaleFormSchema,
  farmBudgetFormSchema,
} from '@/lib/validation/financeSchemas';
import {
  FinancialTransaction,
  HarvestSale,
  FarmBudget,
} from '@/types/finance';
import { HarvestRecord } from '@/types/diary';

describe('Phase 6: Farm Finance, Profit & Loss, Budgets & Market Prices', () => {
  const userA = 'farmer-finance-user-a';
  const userB = 'farmer-finance-user-b';
  const farmIdA = 'farm-cauvery-01';
  const plotIdA = 'plot-paddy-01';

  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Exact Minor Unit Math & Currency Handling', () => {
    it('converts INR to integer paise and back without IEEE 754 floating drift', () => {
      // 0.1 + 0.2 in standard JS floating is 0.30000000000000004
      const p1 = toPaise(0.1);
      const p2 = toPaise(0.2);
      expect(p1 + p2).toBe(30);
      expect(toINR(p1 + p2)).toBe(0.3);

      const largeAmount = 245000.75;
      expect(toPaise(largeAmount)).toBe(24500075);
      expect(toINR(24500075)).toBe(245000.75);
    });

    it('enforces non-negative transaction amounts via Zod', () => {
      const validTx = transactionFormSchema.safeParse({
        farm_id: farmIdA,
        transaction_type: 'expense',
        category: 'fertilizer',
        amount: 1850.5,
        currency: 'INR',
        occurred_at: '2026-10-25T10:00:00Z',
        description: 'Potash and DAP fertilizer purchase',
      });
      expect(validTx.success).toBe(true);

      const negativeTx = transactionFormSchema.safeParse({
        farm_id: farmIdA,
        transaction_type: 'expense',
        category: 'fertilizer',
        amount: -100,
        occurred_at: '2026-10-25T10:00:00Z',
        description: 'Invalid negative test',
      });
      expect(negativeTx.success).toBe(false);
      if (!negativeTx.success) {
        expect(negativeTx.error.issues[0].message).toContain('cannot be negative');
      }
    });
  });

  describe('2. Agricultural Unit Conversion & Gross Revenue Calculations', () => {
    it('accurately converts across quintals, kg, tonnes, and bags', () => {
      expect(convertToKg(28.5, 'quintals')).toBe(2850);
      expect(convertToKg(3.2, 'tonnes')).toBe(3200);
      expect(convertToKg(10, 'bags')).toBe(500);
      expect(convertToKg(250, 'kg')).toBe(250);

      expect(convertFromKg(2850, 'quintals')).toBe(28.5);
      expect(convertFromKg(3200, 'tonnes')).toBe(3.2);
    });

    it('calculates gross revenue with unit-basis compatibility', () => {
      // 20 quintals sold at ₹2,250 per quintal = ₹45,000
      const revQuintals = calculateGrossSaleRevenue(20, 'quintals', 2250, 'per_quintal');
      expect(revQuintals).toBe(45000);

      // 2,000 kg sold at ₹2,250 per quintal (20 quintals) = ₹45,000
      const revKgWithQuintalRate = calculateGrossSaleRevenue(2000, 'kg', 2250, 'per_quintal');
      expect(revKgWithQuintalRate).toBe(45000);

      // 500 kg sold at ₹32 per kg = ₹16,000
      const revKgWithKgRate = calculateGrossSaleRevenue(500, 'kg', 32, 'per_kg');
      expect(revKgWithKgRate).toBe(16000);

      // 5 quintals sold at ₹32 per kg (500 kg) = ₹16,000
      const revQuintalWithKgRate = calculateGrossSaleRevenue(5, 'quintals', 32, 'per_kg');
      expect(revQuintalWithKgRate).toBe(16000);
    });
  });

  describe('3. Harvest-to-Sale Reconciliation & Unsold Inventory', () => {
    const mockHarvest: HarvestRecord = {
      id: 'harvest-001',
      entry_id: 'entry-001',
      crop_name: 'Paddy CR 1009',
      quantity_harvested: 30, // 30 quintals = 3000 kg
      unit: 'quintals',
      quantity_retained_household: 5, // 5 quintals retained = 500 kg -> 25 quintals available
      created_at: '2026-10-20T10:00:00Z',
    };

    it('reconciles partial sales and computes remaining unsold inventory', () => {
      const sales: HarvestSale[] = [
        {
          id: 'sale-001',
          owner_id: userA,
          farm_id: farmIdA,
          harvest_record_id: 'harvest-001',
          crop_name: 'Paddy CR 1009',
          quantity_sold: 10,
          quantity_unit: 'quintals',
          unit_price: 2280,
          price_unit: 'per_quintal',
          currency: 'INR',
          gross_revenue: 22800,
          selling_cost: 800,
          net_proceeds: 22000,
          sale_date: '2026-10-22',
          payment_status: 'received',
          created_at: '2026-10-22T12:00:00Z',
          updated_at: '2026-10-22T12:00:00Z',
        },
        {
          id: 'sale-002',
          owner_id: userA,
          farm_id: farmIdA,
          harvest_record_id: 'harvest-001',
          crop_name: 'Paddy CR 1009',
          quantity_sold: 8,
          quantity_unit: 'quintals',
          unit_price: 2320,
          price_unit: 'per_quintal',
          currency: 'INR',
          gross_revenue: 18560,
          selling_cost: 650,
          net_proceeds: 17910,
          sale_date: '2026-10-24',
          payment_status: 'received',
          created_at: '2026-10-24T12:00:00Z',
          updated_at: '2026-10-24T12:00:00Z',
        },
      ];

      const balance = reconcileHarvestBalance(mockHarvest, sales);
      expect(balance.totalQuantitySold).toBe(18); // 10 + 8
      expect(balance.remainingUnsoldQuantity).toBe(7); // 30 - 5 - 18 = 7 quintals
      expect(balance.totalGrossRevenue).toBe(41360); // 22800 + 18560
      expect(balance.totalSellingCosts).toBe(1450); // 800 + 650
      expect(balance.netProceeds).toBe(39910); // 41360 - 1450
      expect(balance.isOverSold).toBe(false);
    });

    it('detects when sales exceed available harvest balance', () => {
      const excessiveSales: HarvestSale[] = [
        {
          id: 'sale-003',
          owner_id: userA,
          farm_id: farmIdA,
          harvest_record_id: 'harvest-001',
          crop_name: 'Paddy CR 1009',
          quantity_sold: 28, // Available was 25 quintals (30 - 5)
          quantity_unit: 'quintals',
          unit_price: 2200,
          price_unit: 'per_quintal',
          currency: 'INR',
          gross_revenue: 61600,
          selling_cost: 0,
          net_proceeds: 61600,
          sale_date: '2026-10-25',
          payment_status: 'received',
          created_at: '2026-10-25T12:00:00Z',
          updated_at: '2026-10-25T12:00:00Z',
        },
      ];

      const balance = reconcileHarvestBalance(mockHarvest, excessiveSales);
      expect(balance.isOverSold).toBe(true);
      expect(balance.remainingUnsoldQuantity).toBe(0);
    });
  });

  describe('4. Farm Budget Management & Zero-Budget Safety', () => {
    it('computes budget utilization, remaining balance, and warning threshold', () => {
      const budget: FarmBudget = {
        id: 'budget-001',
        owner_id: userA,
        farm_id: farmIdA,
        name: 'Kharif Cultivation Budget',
        category: 'all',
        amount: 50000,
        currency: 'INR',
        period_start: '2026-10-01',
        period_end: '2026-10-31',
        alert_threshold_percent: 80,
        status: 'active',
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
      };

      const transactions: FinancialTransaction[] = [
        {
          id: 'tx-1',
          owner_id: userA,
          farm_id: farmIdA,
          transaction_type: 'expense',
          category: 'seeds',
          amount: 12000,
          currency: 'INR',
          occurred_at: '2026-10-05T10:00:00Z',
          description: 'Certified Seed purchase',
          payment_method: 'cash',
          payment_status: 'paid',
          created_at: '2026-10-05T10:00:00Z',
          updated_at: '2026-10-05T10:00:00Z',
        },
        {
          id: 'tx-2',
          owner_id: userA,
          farm_id: farmIdA,
          transaction_type: 'expense',
          category: 'fertilizer',
          amount: 30000,
          currency: 'INR',
          occurred_at: '2026-10-15T10:00:00Z',
          description: 'Complex fertilizers',
          payment_method: 'upi',
          payment_status: 'paid',
          created_at: '2026-10-15T10:00:00Z',
          updated_at: '2026-10-15T10:00:00Z',
        },
      ];

      const comparison = calculateBudgetUtilization(budget, transactions);
      expect(comparison.plannedAmount).toBe(50000);
      expect(comparison.actualSpent).toBe(42000); // 12000 + 30000
      expect(comparison.remainingBudget).toBe(8000);
      expect(comparison.percentUsed).toBe(84); // (42000/50000)*100
      expect(comparison.status).toBe('warning'); // >= 80% threshold
    });

    it('handles zero planned budget safely without division by zero', () => {
      const zeroBudget: FarmBudget = {
        id: 'budget-zero',
        owner_id: userA,
        farm_id: farmIdA,
        name: 'Zero Budget Test',
        category: 'all',
        amount: 0,
        currency: 'INR',
        period_start: '2026-10-01',
        period_end: '2026-10-31',
        alert_threshold_percent: 80,
        status: 'active',
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
      };

      const comparison = calculateBudgetUtilization(zeroBudget, []);
      expect(comparison.percentUsed).toBe(0);
      expect(Number.isFinite(comparison.percentUsed)).toBe(true);
      expect(comparison.status).toBe('under_budget');
    });
  });

  describe('5. Area-Based Overhead Allocation', () => {
    it('allocates whole-farm overhead proportionally to plot area', () => {
      const overhead = 10000; // ₹10,000 tractor laser leveling
      const plotArea = 2.5; // 2.5 acres
      const totalFarmArea = 10.0; // 10.0 acres total

      const allocation = allocateOverheadByArea(overhead, plotArea, totalFarmArea);
      expect(allocation.sharePercent).toBe(25); // 2.5 / 10 = 25%
      expect(allocation.allocatedAmount).toBe(2500); // 25% of 10,000
    });
  });

  describe('6. Selling Decision Calculator (Mandi vs Farmgate Trader)', () => {
    it('compares APMC Mandi net realization vs local village trader offer', () => {
      const result = calculateSellingDecision({
        cropName: 'Paddy',
        quantity: 20,
        unit: 'quintals',
        mandiModalPricePerQuintal: 2300,
        distanceKm: 30,
        transportRatePerKm: 20, // Freight = 30 * 20 = ₹600
        loadingUnloadingCost: 400,
        mandiCessPercent: 1.5, // 1.5% of (20 * 2300 = 46000) = ₹690
        localTraderOfferPerUnit: 2150, // Local offer = 20 * 2150 = ₹43,000
      });

      expect(result.grossMandiRevenue).toBe(46000);
      expect(result.transportCost).toBe(600);
      expect(result.loadingCost).toBe(400);
      expect(result.mandiCessCost).toBe(690);
      expect(result.totalSellingCost).toBe(1690); // 600 + 400 + 690
      expect(result.netMandiProceeds).toBe(44310); // 46000 - 1690
      expect(result.localTraderGrossRevenue).toBe(43000);
      expect(result.differenceVsLocalOffer).toBe(1310); // 44310 - 43000
      expect(result.recommendedAction).toBe('mandi');
    });
  });

  describe('7. Market Price Service & Agmarknet Feed', () => {
    it('retrieves published mandi benchmark prices with unit normalization and spread', async () => {
      const res = await marketPriceService.getMarketPrices({
        commodity: 'Paddy(Dhan)',
      });

      expect(res.data.length).toBeGreaterThan(0);
      expect(res.source).toContain('Agmarknet');
      expect(res.data[0].price_unit).toBe('Rs/Quintal');
      expect(res.data[0].modal_price).toBeGreaterThan(0);

      const metrics = marketPriceService.compareMandiRates(res.data);
      expect(metrics.highest).not.toBeNull();
      expect(metrics.lowest).not.toBeNull();
      expect(metrics.averageModal).toBeGreaterThan(0);
      expect(metrics.spread).toBeGreaterThanOrEqual(0);
    });
  });

  describe('8. Multi-Tenant Isolation & Relational Cascade', () => {
    it('prevents cross-tenant transaction visibility and mutation', async () => {
      const txA = await financeService.createTransaction(userA, {
        farm_id: farmIdA,
        transaction_type: 'expense',
        category: 'seeds',
        amount: 3500,
        occurred_at: '2026-10-26T10:00:00Z',
        description: 'Tenant A Paddy Seeds',
      });

      const txB = await financeService.createTransaction(userB, {
        farm_id: 'farm-user-b',
        transaction_type: 'expense',
        category: 'fertilizer',
        amount: 8000,
        occurred_at: '2026-10-26T10:00:00Z',
        description: 'Tenant B Fertilizer',
      });

      const listA = await financeService.getTransactions(userA);
      expect(listA.some((t) => t.id === txA.id)).toBe(true);
      expect(listA.some((t) => t.id === txB.id)).toBe(false);

      const listB = await financeService.getTransactions(userB);
      expect(listB.some((t) => t.id === txB.id)).toBe(true);
      expect(listB.some((t) => t.id === txA.id)).toBe(false);
    });

    it('synchronizes Phase 5 diary expenses with zero duplicate creation', async () => {
      // Simulate diary entry with expense
      await storageAdapter.createDiaryEntry(userA, {
        farm_id: farmIdA,
        entry_type: 'expense',
        title: 'Diesel for Submersible Pump',
        occurred_at: '2026-10-24T08:00:00Z',
        expense: {
          category: 'fuel',
          amount: 1400,
          currency: 'INR',
          payment_method: 'cash',
          payment_status: 'paid',
        },
      });

      const firstSyncCount = await financeService.syncDiaryExpenses(userA);
      expect(firstSyncCount).toBe(1);

      // Re-running sync must be idempotent (0 duplicate additions)
      const secondSyncCount = await financeService.syncDiaryExpenses(userA);
      expect(secondSyncCount).toBe(0);

      const txs = await financeService.getTransactions(userA);
      const dieselTxs = txs.filter((t) => t.description.includes('Diesel'));
      expect(dieselTxs.length).toBe(1);
    });
  });
});
