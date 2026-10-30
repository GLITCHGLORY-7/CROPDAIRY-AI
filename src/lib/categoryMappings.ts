// CropDiary AI — Canonical Category & Payment Status Mappings
// Strictly maps domain types between Farm Diary (agronomic) and Farm Finance (ledger accounting).

import type { ExpenseCategory as DiaryExpenseCategory, PaymentStatus as DiaryPaymentStatus } from '@/types/diary';
import type { ExpenseCategory as FinanceExpenseCategory, PaymentStatus as FinancePaymentStatus } from '@/types/finance';

/**
 * Shared expense categories that have identical name and semantics across both Diary and Finance domains.
 */
export type SharedExpenseCategory =
  | 'seeds'
  | 'fertilizer'
  | 'labor'
  | 'fuel'
  | 'other';

/**
 * Shared payment statuses that represent expense settlement across both domains.
 * Note: 'received' is intentionally excluded as it applies exclusively to income/sales revenue.
 */
export type BasePaymentStatus = 'paid' | 'pending' | 'partial';

/**
 * Converts a Diary ExpenseCategory into a Finance ExpenseCategory.
 * Explicitly preserves semantic meaning between agronomic and accounting terms:
 * - 'crop_protection' -> 'pesticide'
 * - 'equipment_rent' -> 'machinery'
 * - 'transportation' -> 'transport'
 * - 'packaging_storage' -> 'packaging'
 * - 'irrigation' -> 'irrigation_electricity'
 * - 'maintenance' -> 'machinery'
 * - 'land_preparation' -> 'machinery'
 * - 'harvesting' -> 'labor'
 */
export function diaryToFinanceExpenseCategory(category: DiaryExpenseCategory): FinanceExpenseCategory {
  switch (category) {
    case 'seeds':
    case 'fertilizer':
    case 'labor':
    case 'fuel':
    case 'other':
      return category;
    case 'crop_protection':
      return 'pesticide';
    case 'equipment_rent':
    case 'maintenance':
    case 'land_preparation':
      return 'machinery';
    case 'transportation':
      return 'transport';
    case 'packaging_storage':
      return 'packaging';
    case 'irrigation':
      return 'irrigation_electricity';
    case 'harvesting':
      return 'labor';
    default:
      return 'other';
  }
}

/**
 * Converts a Finance ExpenseCategory into a Diary ExpenseCategory.
 * Explicitly maps accounting categories back to agronomic field diary categories:
 * - 'pesticide' -> 'crop_protection'
 * - 'machinery' -> 'equipment_rent'
 * - 'transport' -> 'transportation'
 * - 'packaging' -> 'packaging_storage'
 * - 'irrigation_electricity' -> 'irrigation'
 * - 'lease_rent' -> 'equipment_rent'
 */
export function financeToDiaryExpenseCategory(category: FinanceExpenseCategory): DiaryExpenseCategory {
  switch (category) {
    case 'seeds':
    case 'fertilizer':
    case 'labor':
    case 'fuel':
    case 'other':
      return category;
    case 'pesticide':
      return 'crop_protection';
    case 'machinery':
      return 'equipment_rent';
    case 'transport':
      return 'transportation';
    case 'packaging':
      return 'packaging_storage';
    case 'irrigation_electricity':
      return 'irrigation';
    case 'lease_rent':
      return 'equipment_rent';
    default:
      return 'other';
  }
}

/**
 * Converts Diary PaymentStatus to Finance PaymentStatus.
 * Safe widening since DiaryPaymentStatus ('paid' | 'pending' | 'partial') is a strict subtype.
 */
export function diaryToFinancePaymentStatus(status: DiaryPaymentStatus): FinancePaymentStatus {
  return status;
}

/**
 * Converts Finance PaymentStatus to Diary PaymentStatus.
 * Handles income-specific 'received' status safely by translating to settled ('paid').
 */
export function financeToDiaryPaymentStatus(status: FinancePaymentStatus): DiaryPaymentStatus {
  if (status === 'received') {
    return 'paid';
  }
  return status;
}
