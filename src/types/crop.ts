import { FarmingType, IrrigationMethod, SoilType, WaterAvailability } from './database';

export type Season = 'Kharif' | 'Rabi' | 'Zaid' | 'Perennial' | 'All-Season';

export type CropCategory =
  | 'Cereals & Millets'
  | 'Pulses'
  | 'Oilseeds'
  | 'Cash Crops'
  | 'Vegetables'
  | 'Spices'
  | 'Fruits';

export type WaterNeedCategory =
  | 'Low (200-450mm)'
  | 'Moderate (450-800mm)'
  | 'High (800-1400mm)'
  | 'Very High (>1400mm)';

export type RiskLevel = 'Low' | 'Medium' | 'High';

export type PlanStatus =
  | 'Draft'
  | 'Ready for review'
  | 'Planned'
  | 'Active'
  | 'Completed'
  | 'Archived';

export interface TypicalCostPerAcre {
  seeds: number;
  fertilizers: number;
  irrigation: number;
  labor: number;
  protection: number;
  machinery: number;
  total: number;
}

export interface ExpectedYieldPerAcre {
  min: number;
  max: number;
  unit: string;
  benchmark_quintals: number;
}

export interface TypicalSellingPrice {
  min: number;
  max: number;
  modal: number;
  unit: string;
  source: string;
}

export interface CropTemplate {
  id: string;
  name: string;
  scientific_name: string;
  category: CropCategory;
  local_names: {
    en: string;
    ta: string;
    hi: string;
  };
  seasons: Season[];
  duration_days_min: number;
  duration_days_max: number;
  water_requirement_mm: number;
  water_category: WaterNeedCategory;
  suitable_soils: SoilType[];
  suitable_irrigation: IrrigationMethod[];
  suitable_environments: FarmingType[];
  min_temp_c?: number;
  max_temp_c?: number;
  typical_cost_per_acre: TypicalCostPerAcre;
  expected_yield_per_acre: ExpectedYieldPerAcre;
  typical_selling_price_per_unit: TypicalSellingPrice;
  key_pests_diseases: string[];
  cultivation_summary: string;
  risks: string[];
  data_source: string;
  last_verified: string;
  data_quality: 'Verified' | 'Experimental' | 'Provisional';
}

export interface CropPlanningInput {
  farm_id: string;
  plot_id: string;
  planting_season: Season;
  intended_planting_date: string;
  preferred_category?: CropCategory | 'Any';
  water_availability: WaterAvailability;
  available_budget?: number;
  budget_enforcement?: 'strict' | 'flexible' | 'none';
  risk_tolerance?: RiskLevel;
  intended_use?: 'Commercial' | 'Household / Subsistence' | 'Mixed';
  previous_crop?: string;
  soil_test_known?: boolean;
  soil_ph?: number;
  soil_nitrogen?: 'Low' | 'Medium' | 'High';
  farmer_notes?: string;
}

export interface CandidateScoreBreakdown {
  soil_score: number;       // 0-25
  season_score: number;     // 0-25
  water_score: number;      // 0-25
  budget_score: number;     // 0-15
  risk_score: number;       // 0-10
  total_score: number;      // 0-100
  is_eligible: boolean;
  rejection_reasons: string[];
  favorable_reasons: string[];
  limiting_factors?: string[];
  cautions_and_risks: string[];
  missing_data_warnings: string[];
  confidence: 'High Confidence' | 'Moderate Confidence' | 'Low Confidence' | 'Insufficient Data';
}

export interface CandidateCropResult {
  crop: CropTemplate;
  scoring: CandidateScoreBreakdown;
  rank: number;
  economics_for_plot: {
    plot_acres: number;
    cost_breakdown: TypicalCostPerAcre;
    projected_yield: {
      min: number;
      max: number;
      unit: string;
    };
    illustrative_revenue?: {
      price_per_unit: number;
      gross_revenue_min: number;
      gross_revenue_max: number;
      net_profit_min: number;
      net_profit_max: number;
      assumptions: string;
    };
  };
}

export interface TimelineStage {
  stage_name: string;
  start_day: number;
  end_day: number;
  approx_date: string;
  guidance: string;
}

export interface CropPlan {
  id: string;
  owner_id: string;
  farm_id: string;
  plot_id: string;
  title: string;
  status: PlanStatus;
  selected_crop_id: string;
  selected_crop_name: string;
  sowing_date: string;
  target_harvest_date: string;
  season: Season;
  inputs: CropPlanningInput;
  selected_candidate_snapshot: CandidateCropResult;
  shortlist_snapshots: Array<{
    crop_id: string;
    crop_name: string;
    total_score: number;
  }>;
  estimated_total_cost: number;
  illustrative_profit_estimate?: number;
  timeline_stages: TimelineStage[];
  created_at: string;
  updated_at: string;
}
