// CropDiary AI — Phase 7 Government Schemes Type Definitions

export type SchemeScope = 'central' | 'state';

export type SchemeCategory =
  | 'income_support'
  | 'crop_insurance'
  | 'irrigation'
  | 'equipment_mechanization'
  | 'credit_finance'
  | 'soil_health'
  | 'organic_farming'
  | 'horticulture'
  | 'inputs_seeds';

export type BeneficiaryType =
  | 'small_marginal'
  | 'all_farmers'
  | 'women_farmers'
  | 'sc_st'
  | 'fpo';

export interface GovernmentScheme {
  id: string;
  code: string;
  name: string;
  name_ta: string;
  department: string;
  department_ta?: string | null;
  scope: SchemeScope;
  state: string; // e.g. 'All India' or 'Tamil Nadu'
  category: SchemeCategory;
  beneficiary_type: BeneficiaryType;
  max_landholding_acres?: number | null;
  eligible_crops: string[];
  description: string;
  description_ta: string;
  benefits_summary: string;
  benefits_summary_ta: string;
  subsidy_amount_or_percent: string;
  eligibility_criteria: string[];
  required_documents: string[];
  application_mode: 'online' | 'offline_csc' | 'mixed';
  official_portal_url: string;
  last_verified_date: string;
  verification_status: 'verified' | 'revalidation_pending';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SchemeFilterParams {
  searchQuery?: string;
  category?: string;
  scope?: string;
  state?: string;
  beneficiaryType?: string;
}

export interface SchemeEligibilityAssessment {
  schemeId: string;
  schemeCode: string;
  schemeName: string;
  status: 'potentially_eligible' | 'more_info_needed' | 'criteria_not_met';
  matchedCriteria: string[];
  unmatchedCriteria: string[];
  pendingDetails: string[];
  explanation: string;
  recommendation: string;
}
