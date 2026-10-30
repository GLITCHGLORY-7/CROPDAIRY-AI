// CropDiary AI — Phase 6 Finance & Sales Zod Validation Schemas
import { z } from 'zod';

export const expenseCategories = [
  'seeds',
  'fertilizer',
  'pesticide',
  'labor',
  'machinery',
  'fuel',
  'irrigation_electricity',
  'transport',
  'packaging',
  'lease_rent',
  'other',
] as const;

export const saleCategories = ['crop_sale', 'byproduct_sale'] as const;

export const otherIncomeCategories = [
  'subsidy_grant',
  'insurance_payout',
  'lease_inflow',
  'other',
] as const;

export const refundCategories = [
  'input_refund',
  'advance_adjustment',
  'other',
] as const;

export const transactionTypeEnum = z.enum([
  'expense',
  'sale_revenue',
  'other_income',
  'refund_adjustment',
]);

export const paymentMethodEnum = z.enum([
  'cash',
  'upi',
  'bank_transfer',
  'credit',
  'cheque',
]);

export const paymentStatusEnum = z.enum([
  'paid',
  'pending',
  'partial',
  'received',
]);

// 1. Transaction Form Schema
export const transactionFormSchema = z.object({
  farm_id: z.string().min(1, 'Farm is required'),
  plot_id: z.string().optional().nullable(),
  crop_plan_id: z.string().optional().nullable(),
  transaction_type: transactionTypeEnum,
  category: z.string().min(1, 'Category is required'),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .min(0, 'Transaction amount cannot be negative'),
  currency: z.string().default('INR'),
  occurred_at: z.string().min(1, 'Date is required'),
  description: z.string().min(2, 'Description must be at least 2 characters'),
  source_diary_entry_id: z.string().optional().nullable(),
  source_harvest_sale_id: z.string().optional().nullable(),
  payment_method: paymentMethodEnum.default('cash'),
  payment_status: paymentStatusEnum.default('paid'),
  receipt_photo_url: z.string().optional().nullable(),
  invoice_number: z.string().max(100).optional().nullable(),
  vendor_buyer: z.string().max(150).optional().nullable(),
  notes: z.string().optional().nullable(),
});

// 2. Harvest Sale Form Schema
export const harvestSaleFormSchema = z
  .object({
    farm_id: z.string().min(1, 'Farm is required'),
    plot_id: z.string().optional().nullable(),
    crop_plan_id: z.string().optional().nullable(),
    harvest_record_id: z.string().optional().nullable(),
    crop_name: z.string().min(2, 'Crop name is required'),
    quantity_sold: z
      .number({ invalid_type_error: 'Quantity sold must be a number' })
      .positive('Quantity sold must be greater than zero'),
    quantity_unit: z.string().min(1, 'Quantity unit is required'),
    unit_price: z
      .number({ invalid_type_error: 'Unit price must be a number' })
      .min(0, 'Unit price cannot be negative'),
    price_unit: z.string().default('per_quintal'),
    currency: z.string().default('INR'),
    selling_cost: z
      .number({ invalid_type_error: 'Selling cost must be a number' })
      .min(0, 'Selling cost cannot be negative')
      .default(0),
    sale_date: z.string().min(1, 'Sale date is required'),
    buyer_market: z.string().max(150).optional().nullable(),
    buyer_reference: z.string().max(100).optional().nullable(),
    payment_status: z.enum(['received', 'pending', 'partial']).default('received'),
    notes: z.string().optional().nullable(),
    allow_exceed_harvest: z.boolean().default(false),
  });

// 3. Farm Budget Schema
export const farmBudgetFormSchema = z
  .object({
    farm_id: z.string().min(1, 'Farm is required'),
    plot_id: z.string().optional().nullable(),
    crop_plan_id: z.string().optional().nullable(),
    name: z.string().min(2, 'Budget name must be at least 2 characters'),
    category: z.string().default('all'),
    amount: z
      .number({ invalid_type_error: 'Budget amount must be a number' })
      .min(0, 'Budget amount cannot be negative'),
    currency: z.string().default('INR'),
    period_start: z.string().min(1, 'Start date is required'),
    period_end: z.string().min(1, 'End date is required'),
    alert_threshold_percent: z
      .number()
      .min(10, 'Threshold must be at least 10%')
      .max(100, 'Threshold cannot exceed 100%')
      .default(80),
    notes: z.string().optional().nullable(),
    status: z.enum(['active', 'completed', 'archived']).default('active'),
  })
  .refine(
    (data) => new Date(data.period_end) >= new Date(data.period_start),
    {
      message: 'End date cannot be earlier than start date',
      path: ['period_end'],
    }
  );

// 4. Selling Calculator Schema
export const sellingCalculatorSchema = z.object({
  cropName: z.string().min(1, 'Crop name is required'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  unit: z.enum(['quintals', 'kg', 'tonnes']),
  mandiModalPricePerQuintal: z.number().min(0, 'Modal price cannot be negative'),
  distanceKm: z.number().min(0, 'Distance cannot be negative'),
  transportRatePerKm: z.number().min(0, 'Transport rate cannot be negative'),
  loadingUnloadingCost: z.number().min(0, 'Handling cost cannot be negative'),
  mandiCessPercent: z.number().min(0).max(10, 'Cess percentage must be between 0 and 10%'),
  localTraderOfferPerUnit: z.number().min(0, 'Local trader offer cannot be negative'),
});
