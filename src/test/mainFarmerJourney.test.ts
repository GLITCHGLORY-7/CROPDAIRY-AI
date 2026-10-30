/**
 * CropDiary AI — Phase 9 Master Prompt: Main Farmer Journey Verification Suite
 * Tests the complete 12-step end-to-end farmer journey using an isolated test account.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from '@/services/authService';
import { storageAdapter } from '@/services/storageAdapter';
import { offlineSyncService } from '@/services/offline/offlineSyncService';
import { indexedDbClient } from '@/services/offline/indexedDbClient';
import { historyService } from '@/features/history/services/historyService';
import { calculateGrossSaleRevenue } from '@/features/finance/services/financialCalculationEngine';

describe('Phase 9: Main Farmer Journey (12-Step End-to-End Verification)', () => {
  const testEmail = `journey_test_${Date.now()}@cropdiary.ai`;
  const testPassword = 'StrongPassword123!';
  let userId = '';
  let farmId = '';
  let plotId = '';
  let planId = '';

  beforeEach(() => {
    offlineSyncService.setOnlineOverride(false);
  });

  it('Step 1: Creates an account and signs in with isolated test user', async () => {
    const signupResult = await authService.signUp(
      testEmail,
      testPassword,
      'Thanjavur Progressive Farmer',
      'ta'
    );
    expect(signupResult.error).toBeUndefined();
    expect(signupResult.user).not.toBeNull();
    expect(signupResult.user?.email).toBe(testEmail);
    userId = signupResult.user!.id;

    // Verify sign in
    const loginResult = await authService.signIn(testEmail, testPassword);
    expect(loginResult.error).toBeUndefined();
    expect(loginResult.user).not.toBeNull();
    expect(loginResult.user?.id).toBe(userId);
  });

  it('Step 2: Creates a farm and an associated plot', async () => {
    const farm = await storageAdapter.createFarm(userId, {
      name: 'Delta Green Farm',
      country: 'India',
      state: 'Tamil Nadu',
      district: 'Thanjavur',
      village: 'Kumbakonam',
      area: 5.0,
      area_unit: 'Acres',
      farming_type: 'Open field',
      soil_type: 'Clay Loam',
      irrigation_method: 'Borewell Canal',
      water_availability: 'Adequate',
      status: 'active',
    });

    expect(farm.id).toBeDefined();
    expect(farm.name).toBe('Delta Green Farm');
    farmId = farm.id;

    const plot = await storageAdapter.createPlot(userId, {
      farm_id: farmId,
      name: 'North Wet Plot A1',
      area: 2.5,
      area_unit: 'Acres',
      soil_type: 'Clay Loam',
      irrigation_method: 'Borewell Canal',
      farming_environment: 'Open field',
      status: 'active',
    });

    expect(plot.id).toBeDefined();
    expect(plot.farm_id).toBe(farmId);
    expect(plot.area).toBe(2.5);
    plotId = plot.id;
  });

  it('Step 3: Generates and saves a crop plan for the plot', async () => {
    const cropPlan = await storageAdapter.createCropPlan(userId, {
      farm_id: farmId,
      plot_id: plotId,
      title: 'Kharif 2026 Paddy Plan',
      selected_crop_id: 'crop-paddy-01',
      selected_crop_name: 'Paddy (Rice)',
      season: 'Kharif',
      sowing_date: '2026-06-15',
      target_harvest_date: '2026-10-20',
      estimated_total_cost: 35000,
      status: 'Active',
      inputs: {
        intended_planting_date: '2026-06-15',
        water_availability: 'Adequate',
      },
      selected_candidate_snapshot: {} as any,
      shortlist_snapshots: [],
      timeline_stages: [],
    } as any);

    expect(cropPlan.id).toBeDefined();
    expect(cropPlan.selected_crop_name).toBe('Paddy (Rice)');
    expect(cropPlan.plot_id).toBe(plotId);
    planId = cropPlan.id;
  });

  it('Step 4: Records planting and farm activity in the farm diary', async () => {
    const plantingEntry = await storageAdapter.createDiaryEntry(userId, {
      farm_id: farmId,
      plot_id: plotId,
      crop_plan_id: planId,
      entry_type: 'activity',
      title: 'Transplantation of 25-day Paddy Seedlings',
      description: 'System of Rice Intensification (SRI) 25x25cm spacing using organic nursery seedlings.',
      occurred_at: '2026-06-20T09:00:00Z',
      status: 'active',
      tags: ['planting', 'sri', 'transplantation'],
      activity_detail: {
        activity_type: 'sowing_planting',
        area_covered: 2.5,
        area_unit: 'Acres',
        labor_count: 6,
        labor_cost: 3600,
        machinery_used: 'None (Manual)',
      },
    });

    expect(plantingEntry.id).toBeDefined();
    expect(plantingEntry.entry_type).toBe('activity');
    expect(plantingEntry.activity_detail?.labor_count).toBe(6);
  });

  it('Step 5: Records cultivation expenses with exact financial ledger linking', async () => {
    // 1. Record Labor Expense in Farm Diary (auto-synchronizes to financial ledger)
    await storageAdapter.createDiaryEntry(userId, {
      farm_id: farmId,
      plot_id: plotId,
      crop_plan_id: planId,
      entry_type: 'expense',
      title: 'Transplantation Labor Wages',
      occurred_at: '2026-06-20T17:00:00Z',
      status: 'active',
      tags: ['labor', 'transplantation'],
      expense: {
        category: 'labor',
        amount: 3600,
        currency: 'INR',
        payment_status: 'paid',
        payment_method: 'cash',
        vendor_payee: 'Local Farm Labor Group',
      },
    });

    // 2. Record Direct Farm Input Expense in Financial Transactions
    await storageAdapter.createFinancialTransaction(userId, {
      farm_id: farmId,
      plot_id: plotId,
      crop_plan_id: planId,
      transaction_type: 'expense',
      category: 'fertilizer',
      amount: 2400,
      currency: 'INR',
      occurred_at: '2026-07-10T10:00:00Z',
      payment_status: 'paid',
      payment_method: 'upi',
      description: 'Azospirillum & Phosphobacteria biofertilizers',
    });

    // Verify both are present in unified transactions ledger (1 auto-synced from diary + 1 direct finance tx)
    const transactions = await storageAdapter.getFinancialTransactions(userId);
    const expenses = transactions.filter((t) => t.transaction_type === 'expense');
    const totalExpense = expenses.reduce((sum, t) => sum + Number(t.amount), 0);

    expect(expenses.length).toBe(2);
    expect(totalExpense).toBe(6000);
  });

  it('Step 6: Creates a crop health assessment via Crop Doctor', async () => {
    const assessment = await storageAdapter.createAssessment(userId, {
      farm_id: farmId,
      plot_id: plotId,
      crop_plan_id: planId,
      crop_name: 'Paddy (Rice)',
      symptoms: 'Spindle-shaped lesions with grey centres on leaf blades',
      photo_url: 'https://images.cropdiary.ai/demo/paddy-blast.jpg',
      primary_diagnosis: 'Rice Blast (Pyricularia oryzae)',
      confidence_score: 0.94,
      severity: 'moderate',
      recommendations: [
        'Maintain 2-3 cm shallow water level in field',
        'Avoid excessive split nitrogen top-dressing',
        'Spray Pseudomonas fluorescens biological culture @ 10g/L',
      ],
      ai_provider: 'gemini-1.5-flash',
    });

    expect(assessment.id).toBeDefined();
    expect(assessment.primary_diagnosis).toContain('Rice Blast');
    expect(assessment.confidence_score).toBeGreaterThanOrEqual(0.9);
  });

  it('Step 7: Records harvest yield in the farm diary', async () => {
    const harvestEntry = await storageAdapter.createDiaryEntry(userId, {
      farm_id: farmId,
      plot_id: plotId,
      crop_plan_id: planId,
      entry_type: 'harvest',
      title: 'Paddy Main Crop Harvest',
      occurred_at: '2026-10-22T16:00:00Z',
      status: 'active',
      tags: ['harvest', 'paddy'],
      harvest: {
        crop_name: 'Paddy (Rice)',
        quantity_harvested: 60,
        unit: 'Quintals',
        harvested_area: 2.5,
        harvested_area_unit: 'Acres',
        quality_grade: 'Grade A',
        quantity_retained_household: 5,
        quantity_for_sale: 55,
      },
    });

    expect(harvestEntry.id).toBeDefined();
    expect(harvestEntry.harvest?.quantity_harvested).toBe(60);
    expect(harvestEntry.harvest?.quantity_for_sale).toBe(55);
  });

  it('Step 8: Records harvest sales revenue with automatic transaction ledger mirroring', async () => {
    const grossAmount = calculateGrossSaleRevenue(55, 'Quintals', 2400, 'per_quintal');
    expect(grossAmount).toBe(132000);

    const saleRecord = await storageAdapter.createHarvestSale(userId, {
      farm_id: farmId,
      plot_id: plotId,
      crop_plan_id: planId,
      crop_name: 'Paddy (Rice)',
      quantity_sold: 55,
      quantity_unit: 'Quintals',
      unit_price: 2400,
      price_unit: 'per_quintal',
      gross_sale_amount: grossAmount,
      buyer_market: 'Tamil Nadu Civil Supplies Corporation (DPC)',
      sale_date: '2026-10-25',
      payment_status: 'received',
    });

    expect(saleRecord.id).toBeDefined();

    // Verify harvest sale was automatically mirrored into financial transactions
    const txs = await storageAdapter.getFinancialTransactions(userId);
    const sales = txs.filter((t) => t.transaction_type === 'sale_revenue');
    expect(sales.length).toBe(1);
    expect(Number(sales[0].amount)).toBe(132000);
  });

  it('Step 9: Verifies financial totals, net profit, and margin accuracy', async () => {
    const txs = await storageAdapter.getFinancialTransactions(userId);
    const totalExpenses = txs
      .filter((t) => t.transaction_type === 'expense')
      .reduce((s, t) => s + Number(t.amount), 0);
    const totalRevenue = txs
      .filter((t) => t.transaction_type === 'sale_revenue')
      .reduce((s, t) => s + Number(t.amount), 0);
    const netProfit = totalRevenue - totalExpenses;

    expect(totalExpenses).toBe(6000);
    expect(totalRevenue).toBe(132000);
    expect(netProfit).toBe(126000);
  });

  it('Step 10: Reviews farm history and multi-season unit economics', async () => {
    const history = await historyService.getMultiSeasonHistory(userId, farmId);

    expect(history.totalSeasonsTracked).toBe(1);
    expect(history.totalHistoricalRevenueINR).toBe(132000);
    expect(history.totalHistoricalExpensesINR).toBe(6000);
    expect(history.netHistoricalProfitINR).toBe(126000);

    const report = history.seasonalReports[0];
    expect(report.cropName).toBe('Paddy (Rice)');
    expect(report.yieldQuintals).toBe(60);
    expect(report.areaAcres).toBe(2.5);
    // Cost per quintal = Rs 6,000 / 60 = Rs 100 / Qtl
    expect(report.costPerQuintalINR).toBe(100);
    // Profit per acre = Rs 126,000 / 2.5 = Rs 50,400 / Acre
    expect(report.profitPerAcreINR).toBe(50400);
  });

  it('Step 11: Tests offline diary entry queueing and subsequent cloud sync', async () => {
    // 1. Offline Mode: Create observation while network is down
    offlineSyncService.setOnlineOverride(false);

    const offlineEntry = await offlineSyncService.createEntryOffline(
      userId,
      {
        farm_id: farmId,
        plot_id: plotId,
        entry_type: 'observation',
        title: 'Post-Harvest Field Cleaning and Stubble Decomposition',
        occurred_at: '2026-10-26T08:00:00Z',
        status: 'active',
        tags: ['stubble', 'decomposition', 'organic'],
        crop_observation: {
          observation_category: 'soil_health',
          action_taken: 'Sprayed bio-decomposer to avoid stubble burning',
        },
      },
      { autoSync: false }
    );

    expect(offlineEntry.id).toBeDefined();

    // Verify queued in offline storage
    const pendingQueue = await indexedDbClient.getPendingQueue(userId);
    expect(pendingQueue.length).toBe(1);
    expect(pendingQueue[0].entry_id).toBe(offlineEntry.id);

    // 2. Connectivity Restored: Online sync execution
    offlineSyncService.setOnlineOverride(true);
    const syncResult = await offlineSyncService.syncPendingQueue(userId);

    expect(syncResult.successCount).toBe(1);
    expect(syncResult.failureCount).toBe(0);

    // Verify queue is flushed
    const remainingQueue = await indexedDbClient.getPendingQueue(userId);
    expect(remainingQueue.length).toBe(0);

    // Verify entry exists in storageAdapter
    const syncedEntry = await storageAdapter.getDiaryEntryById(userId, offlineEntry.id);
    expect(syncedEntry).not.toBeNull();
    expect(syncedEntry?.title).toBe('Post-Harvest Field Cleaning and Stubble Decomposition');
  });

  it('Step 12: Signs out and verifies that session is terminated', async () => {
    await authService.signOut();

    const sessionData = await authService.getInitialSession();
    expect(sessionData.user).toBeNull();
    expect(sessionData.session).toBeNull();
  });
});
