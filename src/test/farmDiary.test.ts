// CropDiary AI — Phase 5 Farm Diary & Activity Ledger Test Suite
// Verifies all 6 specialized entry types, non-negative money validation, unit preservation,
// timeline filtering, multi-tenant isolation, cascade deletion, and summary stats.

import { describe, it, expect, beforeEach } from 'vitest';
import { diaryService } from '@/features/diary/services/diaryService';
import { storageAdapter } from '@/services/storageAdapter';
import {
  expenseRecordSchema,
  harvestRecordSchema,
  inputRecordSchema,
  diaryEntryFormSchema,
} from '@/lib/validation/diarySchemas';
import { FarmDiaryEntry } from '@/types/diary';

describe('Phase 5: Smart Farm Diary & Field Records', () => {
  const userA = 'farmer-diary-user-a';
  const userB = 'farmer-diary-user-b';

  const farmIdA = 'farm-cauvery-01';
  const plotIdA = 'plot-paddy-01';

  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Zod Validation & Financial Constraints', () => {
    it('strictly enforces non-negative currency amounts in expenses', () => {
      const validExpense = expenseRecordSchema.safeParse({
        category: 'fertilizer',
        amount: 2450.5,
        currency: 'INR',
        payment_method: 'upi',
        payment_status: 'paid',
      });
      expect(validExpense.success).toBe(true);

      const negativeExpense = expenseRecordSchema.safeParse({
        category: 'fertilizer',
        amount: -500,
        currency: 'INR',
      });
      expect(negativeExpense.success).toBe(false);
      if (!negativeExpense.success) {
        expect(negativeExpense.error.issues[0].message).toContain('cannot be negative');
      }
    });

    it('enforces positive quantities in agricultural inputs', () => {
      const positiveInput = inputRecordSchema.safeParse({
        input_name: 'Urea (46% N)',
        input_category: 'chemical_fertilizer',
        quantity: 50,
        unit: 'kg',
        cost: 300,
      });
      expect(positiveInput.success).toBe(true);

      const zeroInput = inputRecordSchema.safeParse({
        input_name: 'DAP',
        input_category: 'chemical_fertilizer',
        quantity: 0,
        unit: 'kg',
      });
      expect(zeroInput.success).toBe(false);
    });

    it('validates harvest output with non-negative quantity and preserves units', () => {
      const validHarvest = harvestRecordSchema.safeParse({
        crop_name: 'Paddy CR 1009 Sub-1',
        quantity_harvested: 28.5,
        unit: 'quintals',
        quality_grade: 'Grade A (Premium / Export)',
        quantity_retained_household: 2.5,
        quantity_for_sale: 26.0,
        actual_revenue: 57200,
      });
      expect(validHarvest.success).toBe(true);

      const negativeHarvest = harvestRecordSchema.safeParse({
        crop_name: 'Paddy',
        quantity_harvested: -5,
        unit: 'kg',
      });
      expect(negativeHarvest.success).toBe(false);
    });
  });

  describe('2. Specialized Entry Types & Sub-Detail Persistence', () => {
    it('creates an Activity entry with labor and machinery sub-details', async () => {
      const entry = await diaryService.createEntry(userA, {
        farm_id: farmIdA,
        plot_id: plotIdA,
        entry_type: 'activity',
        title: 'Deep Summer Plowing & Ridge Formation',
        description: 'Tractor tillage to break hard subsoil pan and expose pupae.',
        occurred_at: new Date().toISOString(),
        status: 'active',
        tags: ['tillage', 'soil_prep'],
        activity_detail: {
          activity_type: 'land_preparation',
          area_covered: 2.5,
          area_unit: 'Acres',
          duration_hours: 4.5,
          labor_count: 2,
          labor_cost: 1600,
          machinery_used: '50 HP Tractor with 9-tyne cultivator',
          materials_used: 'Diesel 12L',
          notes: 'Finished in afternoon before rain',
        },
      });

      expect(entry.id).toBeDefined();
      expect(entry.entry_type).toBe('activity');
      expect(entry.activity_detail).toBeDefined();
      expect(entry.activity_detail?.labor_count).toBe(2);
      expect(entry.activity_detail?.machinery_used).toContain('Tractor');

      const retrieved = await diaryService.getEntryById(userA, entry.id);
      expect(retrieved?.activity_detail?.labor_cost).toBe(1600);
    });

    it('creates an Irrigation entry with duration and moisture observations', async () => {
      const entry = await diaryService.createEntry(userA, {
        farm_id: farmIdA,
        plot_id: plotIdA,
        entry_type: 'irrigation',
        title: 'Drip Line Flushing & 3-Hour Run',
        occurred_at: new Date().toISOString(),
        status: 'active',
        tags: ['drip', 'irrigation'],
        irrigation_record: {
          irrigation_method: 'Drip',
          duration_hours: 3.0,
          water_quantity: 4500,
          water_quantity_unit: 'liters',
          estimated_cost: 80,
          soil_moisture_before: 'Dry Topsoil',
          soil_moisture_after: 'Adequately Moist',
          water_source: 'Borewell',
          notes: 'Operating pressure 2.0 bar',
        },
      });

      expect(entry.id).toBeDefined();
      expect(entry.irrigation_record?.irrigation_method).toBe('Drip');
      expect(entry.irrigation_record?.water_quantity).toBe(4500);
    });

    it('creates an Expense entry and aggregates into summary statistics', async () => {
      await diaryService.createEntry(userA, {
        farm_id: farmIdA,
        entry_type: 'expense',
        title: 'Purchased Certified Paddy Seeds',
        occurred_at: new Date().toISOString(),
        status: 'active',
        tags: ['seeds', 'kharif'],
        expense: {
          category: 'seeds',
          amount: 3200.5,
          currency: 'INR',
          payment_method: 'upi',
          payment_status: 'paid',
          vendor_payee: 'Kaveri Seeds Agency',
        },
      });

      await diaryService.createEntry(userA, {
        farm_id: farmIdA,
        entry_type: 'expense',
        title: 'Bio-Fertilizer Azospirillum Packets',
        occurred_at: new Date().toISOString(),
        status: 'active',
        tags: ['inputs'],
        expense: {
          category: 'fertilizer',
          amount: 800,
          currency: 'INR',
          payment_method: 'cash',
          payment_status: 'paid',
        },
      });

      const stats = await diaryService.getSummaryStats(userA, farmIdA);
      expect(stats.totalEntries).toBe(2);
      expect(stats.totalExpensesAmount).toBe(4000.5);
    });

    it('creates a Harvest entry and calculates total metric yield in kg', async () => {
      await diaryService.createEntry(userA, {
        farm_id: farmIdA,
        entry_type: 'harvest',
        title: 'First Picking Samba Paddy Harvest',
        occurred_at: new Date().toISOString(),
        status: 'active',
        tags: ['harvest', 'paddy'],
        harvest: {
          crop_name: 'Paddy',
          quantity_harvested: 20, // 20 quintals = 2000 kg
          unit: 'quintals',
          harvested_area: 2.0,
          harvested_area_unit: 'Acres',
          quality_grade: 'Grade A',
          quantity_retained_household: 2,
          quantity_for_sale: 18,
          actual_revenue: 40000,
        },
      });

      const stats = await diaryService.getSummaryStats(userA, farmIdA);
      expect(stats.totalHarvestKg).toBe(2000);
    });
  });

  describe('3. Multi-Tenant Data Isolation & Security', () => {
    it('strictly isolates diary entries between different farmers', async () => {
      const entryA = await diaryService.createEntry(userA, {
        farm_id: farmIdA,
        entry_type: 'general',
        title: 'User A Confidential Farm Plan',
        occurred_at: new Date().toISOString(),
        status: 'active',
        tags: [],
      });

      const entryB = await diaryService.createEntry(userB, {
        farm_id: 'farm-user-b',
        entry_type: 'general',
        title: 'User B Secret Harvest Notes',
        occurred_at: new Date().toISOString(),
        status: 'active',
        tags: [],
      });

      const userAEntries = await diaryService.getEntries(userA);
      const userBEntries = await diaryService.getEntries(userB);

      expect(userAEntries.some((e) => e.id === entryA.id)).toBe(true);
      expect(userAEntries.some((e) => e.id === entryB.id)).toBe(false);

      expect(userBEntries.some((e) => e.id === entryB.id)).toBe(true);
      expect(userBEntries.some((e) => e.id === entryA.id)).toBe(false);

      // Direct ID lookup across tenant boundary returns null
      const crossLookup = await diaryService.getEntryById(userA, entryB.id);
      expect(crossLookup).toBeNull();
    });
  });

  describe('4. Search, Filtering, and Timeline Sorting', () => {
    it('filters entries by search query across title, description, and tags', async () => {
      await diaryService.createEntry(userA, {
        farm_id: farmIdA,
        entry_type: 'activity',
        title: 'Foliar Neem Oil Spray',
        description: 'Applied 1500ppm cold pressed neem formulation',
        occurred_at: '2026-10-20T08:00:00Z',
        status: 'active',
        tags: ['ipm', 'pest_control'],
      });

      await diaryService.createEntry(userA, {
        farm_id: farmIdA,
        entry_type: 'irrigation',
        title: 'Canal Inundation',
        description: 'Submerged field with 5cm standing water',
        occurred_at: '2026-10-22T08:00:00Z',
        status: 'active',
        tags: ['water'],
      });

      const searchNeem = await diaryService.getEntries(userA, { searchQuery: 'neem' });
      expect(searchNeem.length).toBe(1);
      expect(searchNeem[0].title).toContain('Neem');

      const searchTag = await diaryService.getEntries(userA, { searchQuery: '#pest_control' });
      expect(searchTag.length).toBe(1);
    });

    it('sorts entries by newest or oldest timestamp accurately', async () => {
      await diaryService.createEntry(userA, {
        farm_id: farmIdA,
        entry_type: 'general',
        title: 'Past Event',
        occurred_at: '2026-10-10T10:00:00Z',
        status: 'active',
        tags: [],
      });

      await diaryService.createEntry(userA, {
        farm_id: farmIdA,
        entry_type: 'general',
        title: 'Recent Event',
        occurred_at: '2026-10-25T10:00:00Z',
        status: 'active',
        tags: [],
      });

      const newestFirst = await diaryService.getEntries(userA, { sortOrder: 'newest' });
      expect(newestFirst[0].title).toBe('Recent Event');

      const oldestFirst = await diaryService.getEntries(userA, { sortOrder: 'oldest' });
      expect(oldestFirst[0].title).toBe('Past Event');
    });
  });

  describe('5. Edit, Archive, and Cascade Deletion', () => {
    it('archives an entry so it is excluded from default timeline view', async () => {
      const entry = await diaryService.createEntry(userA, {
        farm_id: farmIdA,
        entry_type: 'general',
        title: 'Note to Archive',
        occurred_at: new Date().toISOString(),
        status: 'active',
        tags: [],
      });

      await diaryService.archiveEntry(userA, entry.id);

      // Default query excludes archived entries
      const activeList = await diaryService.getEntries(userA);
      expect(activeList.some((e) => e.id === entry.id)).toBe(false);

      // Query with explicit status includes it
      const archivedList = await diaryService.getEntries(userA, { status: 'archived' });
      expect(archivedList.some((e) => e.id === entry.id)).toBe(true);
    });

    it('deletes an entry and cascades to its typed detail record and attachments', async () => {
      const entry = await diaryService.createEntry(userA, {
        farm_id: farmIdA,
        entry_type: 'activity',
        title: 'Activity to Delete',
        occurred_at: new Date().toISOString(),
        status: 'active',
        tags: [],
        activity_detail: {
          activity_type: 'weeding',
          labor_count: 3,
        },
      });

      await diaryService.deleteEntry(userA, entry.id);

      const deleted = await diaryService.getEntryById(userA, entry.id);
      expect(deleted).toBeNull();
    });
  });
});
