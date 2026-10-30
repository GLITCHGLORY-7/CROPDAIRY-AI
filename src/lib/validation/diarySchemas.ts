// CropDiary AI — Phase 5 Diary Zod Validation Schemas
// Enforces strict non-negative currency amounts, valid units, and typed sub-detail constraints.

import { z } from 'zod';

export const diaryEntryTypeEnum = z.enum([
  'general',
  'activity',
  'irrigation',
  'input_application',
  'crop_observation',
  'expense',
  'harvest',
]);

export const activityTypeEnum = z.enum([
  'land_preparation',
  'sowing',
  'transplanting',
  'weeding',
  'fertilizer_application',
  'soil_improvement',
  'crop_inspection',
  'crop_protection',
  'pruning',
  'harvesting',
  'post_harvest',
  'equipment_maintenance',
  'custom',
]);

export const irrigationMethodEnum = z.enum([
  'Drip',
  'Sprinkler',
  'Furrow',
  'Flood',
  'Basin',
  'Manual',
  'Other',
]);

export const inputCategoryEnum = z.enum([
  'chemical_fertilizer',
  'organic_manure',
  'bio_fertilizer',
  'micronutrient',
  'seed',
  'crop_protection_pesticide',
  'bio_pesticide',
  'soil_conditioner',
  'growth_regulator',
  'other',
]);

export const observationCategoryEnum = z.enum([
  'plant_growth',
  'leaf_condition',
  'pest_signs',
  'disease_symptoms',
  'soil_condition',
  'water_stress',
  'flowering',
  'fruit_development',
  'weather_damage',
  'harvest_readiness',
  'other',
]);

export const expenseCategoryEnum = z.enum([
  'seeds',
  'fertilizer',
  'crop_protection',
  'irrigation',
  'labor',
  'equipment_rent',
  'fuel',
  'maintenance',
  'land_preparation',
  'harvesting',
  'transportation',
  'packaging_storage',
  'other',
]);

export const activityDetailSchema = z.object({
  activity_type: activityTypeEnum,
  area_covered: z.number().min(0, 'Area covered must be non-negative').optional().nullable(),
  area_unit: z.string().default('Acres'),
  duration_hours: z.number().min(0, 'Duration must be non-negative').optional().nullable(),
  labor_count: z.number().int().min(0, 'Labor count must be at least 0').optional().nullable(),
  labor_cost: z.number().min(0, 'Labor cost must be non-negative').optional().nullable(),
  machinery_used: z.string().max(200).optional().nullable(),
  materials_used: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const irrigationRecordSchema = z.object({
  irrigation_method: irrigationMethodEnum,
  duration_hours: z.number().min(0, 'Duration must be non-negative').optional().nullable(),
  water_quantity: z.number().min(0, 'Water quantity must be non-negative').optional().nullable(),
  water_quantity_unit: z.string().default('liters'),
  estimated_cost: z.number().min(0, 'Cost must be non-negative').optional().nullable(),
  soil_moisture_before: z.string().max(50).optional().nullable(),
  soil_moisture_after: z.string().max(50).optional().nullable(),
  water_source: z.string().max(50).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const inputRecordSchema = z.object({
  input_name: z.string().min(2, 'Input name must be at least 2 characters').max(150),
  input_category: inputCategoryEnum,
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  area_treated: z.number().min(0).optional().nullable(),
  area_unit: z.string().default('Acres'),
  cost: z.number().min(0, 'Cost must be non-negative').default(0),
  supplier: z.string().max(150).optional().nullable(),
  batch_number: z.string().max(50).optional().nullable(),
  safety_precaution_notes: z.string().max(1000).optional().nullable(),
});

export const cropObservationSchema = z.object({
  observation_category: observationCategoryEnum,
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional().nullable(),
  affected_area_pct: z.number().min(0).max(100, 'Affected area cannot exceed 100%').optional().nullable(),
  crop_stage: z.string().max(50).optional().nullable(),
  linked_assessment_id: z.string().uuid().optional().nullable(),
  follow_up_date: z.string().optional().nullable(),
  action_taken: z.string().max(1000).optional().nullable(),
});

export const expenseRecordSchema = z.object({
  category: expenseCategoryEnum,
  amount: z.number().min(0, 'Expense amount cannot be negative'),
  currency: z.string().default('INR'),
  payment_method: z.string().default('cash'),
  payment_status: z.enum(['paid', 'pending', 'partial']).default('paid'),
  receipt_photo_url: z.string().url().optional().nullable().or(z.literal('')),
  vendor_payee: z.string().max(150).optional().nullable(),
});

export const harvestRecordSchema = z.object({
  crop_name: z.string().min(2, 'Crop name is required').max(150),
  quantity_harvested: z.number().min(0, 'Harvested quantity must be non-negative'),
  unit: z.string().min(1, 'Quantity unit is required'),
  harvested_area: z.number().min(0).optional().nullable(),
  harvested_area_unit: z.string().default('Acres'),
  quality_grade: z.string().max(50).optional().nullable(),
  quantity_retained_household: z.number().min(0).default(0),
  quantity_for_sale: z.number().min(0).default(0),
  actual_revenue: z.number().min(0).optional().nullable(),
  estimated_revenue: z.number().min(0).optional().nullable(),
  buyer_market: z.string().max(150).optional().nullable(),
});

export const diaryEntryFormSchema = z.object({
  farm_id: z.string().min(1, 'Please select an associated farm'),
  plot_id: z.string().optional().nullable(),
  crop_plan_id: z.string().optional().nullable(),
  entry_type: diaryEntryTypeEnum,
  title: z.string().min(2, 'Title must be at least 2 characters').max(200),
  description: z.string().max(2000).optional().nullable(),
  occurred_at: z.string().min(1, 'Please select date and time'),
  status: z.enum(['active', 'archived', 'draft']).default('active'),
  tags: z.array(z.string()).default([]),

  // Sub-detail records
  activity_detail: activityDetailSchema.optional().nullable(),
  irrigation_record: irrigationRecordSchema.optional().nullable(),
  input_record: z.preprocess((val: any) => (val && typeof val === 'object' && val.input_name ? val : undefined), inputRecordSchema.optional().nullable()),
  observation: cropObservationSchema.optional().nullable(),
  expense: expenseRecordSchema.optional().nullable(),
  harvest: z.preprocess((val: any) => (val && typeof val === 'object' && val.crop_name ? val : undefined), harvestRecordSchema.optional().nullable()),
});

export type DiaryEntryFormData = z.infer<typeof diaryEntryFormSchema>;
