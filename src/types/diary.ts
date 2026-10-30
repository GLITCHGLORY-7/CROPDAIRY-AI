// CropDiary AI — Phase 5 Farm Diary & Activity Tracking Type Definitions

export type DiaryEntryType =
  | 'general'
  | 'activity'
  | 'irrigation'
  | 'input_application'
  | 'crop_observation'
  | 'expense'
  | 'harvest';

export type DiaryEntryStatus = 'active' | 'archived' | 'draft';

export type ActivityType =
  | 'land_preparation'
  | 'sowing'
  | 'transplanting'
  | 'weeding'
  | 'fertilizer_application'
  | 'soil_improvement'
  | 'crop_inspection'
  | 'crop_protection'
  | 'pruning'
  | 'harvesting'
  | 'post_harvest'
  | 'equipment_maintenance'
  | 'custom';

export type IrrigationMethodType =
  | 'Drip'
  | 'Sprinkler'
  | 'Furrow'
  | 'Flood'
  | 'Basin'
  | 'Manual'
  | 'Other';

export type InputCategory =
  | 'chemical_fertilizer'
  | 'organic_manure'
  | 'bio_fertilizer'
  | 'micronutrient'
  | 'seed'
  | 'crop_protection_pesticide'
  | 'bio_pesticide'
  | 'soil_conditioner'
  | 'growth_regulator'
  | 'other';

export type ObservationCategory =
  | 'plant_growth'
  | 'leaf_condition'
  | 'pest_signs'
  | 'disease_symptoms'
  | 'soil_condition'
  | 'water_stress'
  | 'flowering'
  | 'fruit_development'
  | 'weather_damage'
  | 'harvest_readiness'
  | 'other';

export type ObservationSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ExpenseCategory =
  | 'seeds'
  | 'fertilizer'
  | 'crop_protection'
  | 'irrigation'
  | 'labor'
  | 'equipment_rent'
  | 'fuel'
  | 'maintenance'
  | 'land_preparation'
  | 'harvesting'
  | 'transportation'
  | 'packaging_storage'
  | 'other';

export type BasePaymentStatus = 'paid' | 'pending' | 'partial';
export type PaymentStatus = BasePaymentStatus;

export interface FarmActivityDetail {
  id: string;
  entry_id: string;
  activity_type: ActivityType;
  area_covered?: number | null;
  area_unit?: string;
  duration_hours?: number | null;
  labor_count?: number | null;
  labor_cost?: number | null;
  machinery_used?: string | null;
  materials_used?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface IrrigationRecord {
  id: string;
  entry_id: string;
  irrigation_method: IrrigationMethodType;
  duration_hours?: number | null;
  water_quantity?: number | null;
  water_quantity_unit?: string;
  estimated_cost?: number | null;
  soil_moisture_before?: string | null;
  soil_moisture_after?: string | null;
  water_source?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface FarmInputRecord {
  id: string;
  entry_id: string;
  input_name: string;
  input_category: InputCategory;
  quantity: number;
  unit: string;
  area_treated?: number | null;
  area_unit?: string;
  cost: number;
  supplier?: string | null;
  batch_number?: string | null;
  safety_precaution_notes?: string | null;
  created_at: string;
}

export interface CropObservationRecord {
  id: string;
  entry_id: string;
  observation_category: ObservationCategory;
  severity?: ObservationSeverity | null;
  affected_area_pct?: number | null;
  crop_stage?: string | null;
  linked_assessment_id?: string | null;
  follow_up_date?: string | null;
  action_taken?: string | null;
  created_at: string;
}

export interface FarmExpenseRecord {
  id: string;
  entry_id: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  payment_method?: string;
  payment_status: PaymentStatus;
  receipt_photo_url?: string | null;
  vendor_payee?: string | null;
  created_at: string;
}

export interface HarvestRecord {
  id: string;
  entry_id: string;
  crop_name: string;
  quantity_harvested: number;
  unit: string;
  harvested_area?: number | null;
  harvested_area_unit?: string;
  quality_grade?: string | null;
  quantity_retained_household?: number;
  quantity_for_sale?: number;
  actual_revenue?: number | null;
  estimated_revenue?: number | null;
  buyer_market?: string | null;
  created_at: string;
}

export interface DiaryAttachment {
  id: string;
  entry_id: string;
  owner_id: string;
  file_name: string;
  file_url: string;
  storage_path: string;
  media_type: string;
  file_size_bytes: number;
  caption?: string | null;
  created_at: string;
}

export interface FarmDiaryEntry {
  id: string;
  owner_id: string;
  farm_id: string;
  plot_id?: string | null;
  crop_plan_id?: string | null;
  entry_type: DiaryEntryType;
  title: string;
  description?: string | null;
  occurred_at: string;
  status: DiaryEntryStatus;
  tags: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;

  // Joined typed details
  activity_detail?: FarmActivityDetail | null;
  irrigation_record?: IrrigationRecord | null;
  input_record?: FarmInputRecord | null;
  observation?: CropObservationRecord | null;
  expense?: FarmExpenseRecord | null;
  harvest?: HarvestRecord | null;
  attachments?: DiaryAttachment[];
}

export interface DiaryFilterParams {
  farmId?: string;
  plotId?: string;
  cropPlanId?: string;
  entryType?: DiaryEntryType | 'all';
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
  status?: DiaryEntryStatus;
  sortOrder?: 'newest' | 'oldest';
}

export interface DiarySummaryStats {
  totalEntries: number;
  todayActivities: number;
  totalExpensesAmount: number;
  totalHarvestKg: number;
  activeObservationsCount: number;
}
