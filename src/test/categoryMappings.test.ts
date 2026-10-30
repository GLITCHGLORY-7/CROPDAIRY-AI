// CropDiary AI — Category & Payment Status Mapping Verification Test Suite
import { describe, it, expect } from 'vitest';
import {
  diaryToFinanceExpenseCategory,
  financeToDiaryExpenseCategory,
  diaryToFinancePaymentStatus,
  financeToDiaryPaymentStatus,
} from '@/lib/categoryMappings';
import type { ExpenseCategory as DiaryExpenseCategory, PaymentStatus as DiaryPaymentStatus } from '@/types/diary';
import type { ExpenseCategory as FinanceExpenseCategory, PaymentStatus as FinancePaymentStatus } from '@/types/finance';

describe('Category & Payment Status Mappings (Diary <-> Finance)', () => {
  describe('1. Diary to Finance Expense Category Conversion', () => {
    it('preserves exact semantic matches without modification', () => {
      const sharedCategories: DiaryExpenseCategory[] = ['seeds', 'fertilizer', 'labor', 'fuel', 'other'];
      for (const cat of sharedCategories) {
        expect(diaryToFinanceExpenseCategory(cat)).toBe(cat);
      }
    });

    it('explicitly maps divergent agronomic categories to standard accounting equivalents', () => {
      expect(diaryToFinanceExpenseCategory('crop_protection')).toBe('pesticide');
      expect(diaryToFinanceExpenseCategory('equipment_rent')).toBe('machinery');
      expect(diaryToFinanceExpenseCategory('maintenance')).toBe('machinery');
      expect(diaryToFinanceExpenseCategory('land_preparation')).toBe('machinery');
      expect(diaryToFinanceExpenseCategory('harvesting')).toBe('labor');
      expect(diaryToFinanceExpenseCategory('transportation')).toBe('transport');
      expect(diaryToFinanceExpenseCategory('packaging_storage')).toBe('packaging');
      expect(diaryToFinanceExpenseCategory('irrigation')).toBe('irrigation_electricity');
    });

    it('handles unexpected categories safely with fallback to other', () => {
      expect(diaryToFinanceExpenseCategory('unknown_cat' as any)).toBe('other');
    });
  });

  describe('2. Finance to Diary Expense Category Conversion', () => {
    it('preserves exact semantic matches in reverse', () => {
      const sharedCategories: FinanceExpenseCategory[] = ['seeds', 'fertilizer', 'labor', 'fuel', 'other'];
      for (const cat of sharedCategories) {
        expect(financeToDiaryExpenseCategory(cat)).toBe(cat);
      }
    });

    it('explicitly maps accounting categories back to agronomic field categories', () => {
      expect(financeToDiaryExpenseCategory('pesticide')).toBe('crop_protection');
      expect(financeToDiaryExpenseCategory('machinery')).toBe('equipment_rent');
      expect(financeToDiaryExpenseCategory('transport')).toBe('transportation');
      expect(financeToDiaryExpenseCategory('packaging')).toBe('packaging_storage');
      expect(financeToDiaryExpenseCategory('irrigation_electricity')).toBe('irrigation');
      expect(financeToDiaryExpenseCategory('lease_rent')).toBe('equipment_rent');
    });

    it('handles unexpected categories safely with fallback to other', () => {
      expect(financeToDiaryExpenseCategory('unknown_finance_cat' as any)).toBe('other');
    });
  });

  describe('3. Payment Status Mappings & Income Status Isolation', () => {
    it('passes through common expense payment statuses accurately', () => {
      const statuses: DiaryPaymentStatus[] = ['paid', 'pending', 'partial'];
      for (const status of statuses) {
        expect(diaryToFinancePaymentStatus(status)).toBe(status);
        expect(financeToDiaryPaymentStatus(status)).toBe(status);
      }
    });

    it('safely handles income-specific received status in expense context without throwing', () => {
      const status: FinancePaymentStatus = 'received';
      expect(financeToDiaryPaymentStatus(status)).toBe('paid');
    });
  });
});
