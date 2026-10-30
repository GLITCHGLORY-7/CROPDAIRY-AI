// CropDiary AI — Phase 8 Offline Storage, Sync & Multi-Season History Vitest Suite
import { describe, it, expect, beforeEach } from 'vitest';
import { indexedDbClient } from '@/services/offline/indexedDbClient';
import { offlineSyncService } from '@/services/offline/offlineSyncService';
import { historyService } from '@/features/history/services/historyService';
import { storageAdapter } from '@/services/storageAdapter';
import { FarmDiaryEntry } from '@/types/diary';
import { DiaryEntryFormData } from '@/lib/validation/diarySchemas';

describe('Phase 8: Offline Sync, Conflict Resolution & Multi-Season History', () => {
  const userId = 'farmer-offline-test-user';
  const otherUserId = 'other-farmer-999';
  const farmId = 'farm-offline-01';

  beforeEach(async () => {
    localStorage.clear();
    offlineSyncService.setOnlineOverride(null);
    await indexedDbClient.clearUserData(userId);
    await indexedDbClient.clearUserData(otherUserId);
  });

  describe('1. Offline Farm Diary Creation & Local Queuing', () => {
    it('creates diary entry offline with stable client UUID and pending sync state', async () => {
      const entryData: DiaryEntryFormData = {
        farm_id: farmId,
        entry_type: 'activity',
        title: 'Offline Weeding in North Plot',
        description: 'Manual weeding completed while offline in remote field',
        occurred_at: '2026-10-26T10:00:00Z',
        status: 'active',
        tags: ['weeding', 'offline'],
        activity_detail: {
          activity_type: 'weeding',
          area_covered: 2.5,
          area_unit: 'Acres',
          duration_hours: 4,
          labor_count: 3,
          labor_cost: 1500,
        },
      };

      const entry = await offlineSyncService.createEntryOffline(userId, entryData, { autoSync: false });

      expect(entry.id).toBeDefined();
      expect(entry.title).toBe('Offline Weeding in North Plot');
      expect(entry.metadata?.sync_status).toBe('pending');
      expect(entry.metadata?.server_confirmed).toBe(false);

      // Verify saved in offline store
      const retrieved = await indexedDbClient.getOfflineEntryById(entry.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(entry.id);

      // Verify enqueued in sync queue
      const queue = await indexedDbClient.getPendingQueue(userId);
      expect(queue.length).toBe(1);
      expect(queue[0].entry_id).toBe(entry.id);
      expect(queue[0].operation).toBe('create');
    });

    it('isolates offline entries per user and prevents cross-tenant data bleed', async () => {
      const entryA: DiaryEntryFormData = {
        farm_id: 'farm-a',
        entry_type: 'general',
        title: 'Farmer A Observation',
        occurred_at: '2026-10-26T10:00:00Z',
        status: 'active',
        tags: [],
      };

      const entryB: DiaryEntryFormData = {
        farm_id: 'farm-b',
        entry_type: 'general',
        title: 'Farmer B Observation',
        occurred_at: '2026-10-26T10:00:00Z',
        status: 'active',
        tags: [],
      };

      await offlineSyncService.createEntryOffline(userId, entryA, { autoSync: false });
      await offlineSyncService.createEntryOffline(otherUserId, entryB, { autoSync: false });

      const userAEntries = await indexedDbClient.getOfflineEntries(userId);
      const userBEntries = await indexedDbClient.getOfflineEntries(otherUserId);

      expect(userAEntries.length).toBe(1);
      expect(userAEntries[0].title).toBe('Farmer A Observation');

      expect(userBEntries.length).toBe(1);
      expect(userBEntries[0].title).toBe('Farmer B Observation');
    });
  });

  describe('2. Idempotent Synchronization & Server Confirmation', () => {
    it('synchronizes pending queue to storage and marks server confirmed', async () => {
      const entryData: DiaryEntryFormData = {
        farm_id: farmId,
        entry_type: 'irrigation',
        title: 'Drip Irrigation Session',
        occurred_at: '2026-10-26T08:00:00Z',
        status: 'active',
        tags: ['drip'],
        irrigation_record: {
          irrigation_method: 'Drip',
          duration_hours: 2,
          water_quantity: 1200,
          water_quantity_unit: 'Liters',
        },
      };

      const entry = await offlineSyncService.createEntryOffline(userId, entryData, { autoSync: false });

      // Trigger sync
      const syncResult = await offlineSyncService.syncPendingQueue(userId);

      expect(syncResult.successCount).toBe(1);
      expect(syncResult.failureCount).toBe(0);

      // Verify confirmed on server
      const serverRecord = await storageAdapter.getDiaryEntryById(userId, entry.id);
      expect(serverRecord).not.toBeNull();
      expect(serverRecord?.title).toBe('Drip Irrigation Session');

      // Verify queue is now empty
      const queueAfter = await indexedDbClient.getPendingQueue(userId);
      expect(queueAfter.length).toBe(0);

      // Verify offline entry marked confirmed
      const localAfter = await indexedDbClient.getOfflineEntryById(entry.id);
      expect(localAfter?.metadata?.server_confirmed).toBe(true);
      expect(localAfter?.metadata?.sync_status).toBe('synced');
    });

    it('enforces idempotency: retrying sync does not duplicate records', async () => {
      const entryData: DiaryEntryFormData = {
        farm_id: farmId,
        entry_type: 'expense',
        title: 'Diesel for Tractor',
        occurred_at: '2026-10-26T07:30:00Z',
        status: 'active',
        tags: ['fuel'],
        expense: {
          category: 'fuel',
          amount: 1800,
          currency: 'INR',
          payment_status: 'paid',
        },
      };

      const entry = await offlineSyncService.createEntryOffline(userId, entryData, { autoSync: false });
      await offlineSyncService.syncPendingQueue(userId);

      // Simulate re-enqueue of same entry (e.g. retry after network blip)
      await indexedDbClient.enqueueSync(userId, entry.id, 'create', entryData);
      const retryResult = await offlineSyncService.syncPendingQueue(userId);

      // Should succeed idempotently without creating another duplicate
      expect(retryResult.successCount).toBe(1);

      const allEntries = await storageAdapter.getDiaryEntries(userId);
      const matching = allEntries.filter((e) => e.title === 'Diesel for Tractor');
      expect(matching.length).toBe(1); // Exact 1 record, zero duplicate!
    });
  });

  describe('3. Simultaneous Edit Conflict Detection & Resolution', () => {
    it('detects concurrent server updates and logs explicit conflict', async () => {
      // 1. Create entry on server
      const initial = await storageAdapter.createDiaryEntry(userId, {
        farm_id: farmId,
        entry_type: 'general',
        title: 'Initial Field Notes',
        occurred_at: '2026-10-26T06:00:00Z',
        status: 'active',
        tags: [],
      });

      // 2. Client is offline
      offlineSyncService.setOnlineOverride(false);

      // Client modifies offline with timestamp T1
      const clientEntry = await offlineSyncService.updateEntryOffline(userId, initial.id, {
        title: 'Client Edit: Added Weed Notes',
      });
      expect(clientEntry.title).toContain('Client Edit');

      // 3. Meanwhile, server entry is modified at T2 (T2 > T1)
      await new Promise((r) => setTimeout(r, 50));
      await storageAdapter.updateDiaryEntry(userId, initial.id, {
        title: 'Server Edit: Supervisor Note Added',
      });

      // 4. Client attempts sync -> Conflict detected!
      const syncResult = await offlineSyncService.syncPendingQueue(userId);
      expect(syncResult.conflictCount).toBe(1);

      // Verify conflict record was logged
      const conflicts = await indexedDbClient.getConflicts(userId);
      expect(conflicts.length).toBe(1);
      expect(conflicts[0].entry_id).toBe(initial.id);
      expect(conflicts[0].difference_summary).toContain('Simultaneous');
    });

    it('resolves conflict cleanly with keep_client or keep_server', async () => {
      const entry = await storageAdapter.createDiaryEntry(userId, {
        farm_id: farmId,
        entry_type: 'general',
        title: 'Base Title',
        occurred_at: '2026-10-26T06:00:00Z',
        status: 'active',
        tags: [],
      });

      const conflictRecord = await indexedDbClient.logConflict({
        entry_id: entry.id,
        owner_id: userId,
        client_payload: { title: 'Keep Client Title' },
        server_payload: { ...entry, title: 'Keep Server Title' },
        client_timestamp: '2026-10-26T06:05:00Z',
        server_timestamp: '2026-10-26T06:10:00Z',
        difference_summary: 'Test conflict',
      });

      // Resolve choosing 'keep_client'
      await offlineSyncService.resolveConflict(userId, conflictRecord.id, 'keep_client');

      const serverNow = await storageAdapter.getDiaryEntryById(userId, entry.id);
      expect(serverNow?.title).toBe('Keep Client Title');

      // Conflict should be marked resolved
      const remainingConflicts = await indexedDbClient.getConflicts(userId);
      expect(remainingConflicts.length).toBe(0);
    });
  });

  describe('4. Multi-Season Farm History & Longitudinal Analytics', () => {
    it('accurately computes season-by-season economics from real saved records', async () => {
      // Create Farm
      const farm = await storageAdapter.createFarm(userId, {
        name: 'Delta Heritage Farm',
        country: 'India',
        state: 'Tamil Nadu',
        district: 'Thanjavur',
        area: 5.0,
        area_unit: 'Acres',
        farming_type: 'Organic',
        soil_type: 'Clay Loam',
        irrigation_method: 'Drip',
        water_availability: 'Adequate',
        status: 'active',
      });

      // Create Plot for the farm
      const plot = await storageAdapter.createPlot(userId, {
        farm_id: farm.id,
        name: 'Plot North 1',
        area: 5.0,
        area_unit: 'Acres',
        soil_type: 'Clay Loam',
        irrigation_method: 'Drip',
        farming_environment: 'Open Field',
      });

      // Create Crop Plan for Samba 2025
      const sambaPlan = await storageAdapter.createCropPlan(userId, {
        farm_id: farm.id,
        plot_id: plot.id,
        selected_crop_id: 'paddy-01',
        selected_crop_name: 'Paddy (CR 1009 Sub 1)',
        season: 'Samba',
        sowing_date: '2025-08-15',
        expected_harvest_date: '2026-01-20',
        target_yield_per_acre: 6.0,
        target_yield_unit: 'tonnes',
        status: 'completed',
        notes: 'Monsoon season',
      });

      // Log Expense for Samba
      await storageAdapter.createFinancialTransaction(userId, {
        farm_id: farm.id,
        crop_plan_id: sambaPlan.id,
        transaction_type: 'expense',
        category: 'fertilizer',
        amount: 8500,
        currency: 'INR',
        occurred_at: '2025-09-01T10:00:00Z',
        description: 'Neem cake and bio-fertilizer',
      });

      // Log Harvest for Samba (25 Quintals)
      await storageAdapter.createDiaryEntry(userId, {
        farm_id: farm.id,
        crop_plan_id: sambaPlan.id,
        entry_type: 'harvest',
        title: 'Samba Harvest',
        occurred_at: '2026-01-20T12:00:00Z',
        status: 'active',
        tags: ['harvest'],
        harvest: {
          crop_name: 'Paddy',
          quantity_harvested: 25,
          unit: 'Quintals',
        },
      });

      // Log Sales Revenue (₹57,500)
      await storageAdapter.createFinancialTransaction(userId, {
        farm_id: farm.id,
        crop_plan_id: sambaPlan.id,
        transaction_type: 'sale_revenue',
        category: 'crop_sale',
        amount: 57500,
        currency: 'INR',
        occurred_at: '2026-01-25T14:00:00Z',
        description: 'Paddy wholesale sale',
      });

      // Compute Multi-Season Analytics
      const history = await historyService.getMultiSeasonHistory(userId, farm.id);

      expect(history.totalSeasonsTracked).toBe(1);
      expect(history.totalHistoricalRevenueINR).toBe(57500);
      expect(history.totalHistoricalExpensesINR).toBe(8500);
      expect(history.netHistoricalProfitINR).toBe(49000); // 57500 - 8500
      expect(history.totalHistoricalYieldKg).toBe(2500); // 25 quintals * 100

      const report = history.seasonalReports[0];
      expect(report.seasonName).toBe('Samba');
      expect(report.year).toBe(2025);
      expect(report.yieldQuintals).toBe(25);
      expect(report.costPerQuintalINR).toBe(340); // 8500 / 25
      expect(report.profitPerAcreINR).toBe(9800); // 49000 / 5 acres
    });

    it('generates valid CSV export string with correct column headers and rows', () => {
      const mockReports = [
        {
          id: 'p-1',
          seasonName: 'Kuruvai',
          year: 2025,
          cropName: 'Paddy ADT 43',
          farmName: 'Cauvery Plots',
          plotName: 'Block A',
          areaAcres: 3,
          totalCostINR: 6000,
          yieldKg: 1800,
          yieldQuintals: 18,
          grossRevenueINR: 41400,
          netProfitINR: 35400,
          costPerQuintalINR: 333,
          profitPerAcreINR: 11800,
          sowingDate: '2025-06-15',
          diseaseEventsCount: 0,
          pestSummary: [],
        },
      ];

      const csv = historyService.generateCSV(mockReports);
      expect(csv).toContain('Season,Year,Crop,Farm,Plot,Area (Acres)');
      expect(csv).toContain('"Kuruvai",2025,"Paddy ADT 43"');
      expect(csv).toContain('41400,35400');
    });
  });
});
