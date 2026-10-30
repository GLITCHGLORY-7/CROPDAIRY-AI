// CropDiary AI — Phase 3: AI Crop Doctor TypeScript Models

export type PlantPart =
  | 'Leaves'
  | 'Stem / Stalk'
  | 'Roots / Crown'
  | 'Flowers'
  | 'Fruits / Grains / Pods'
  | 'Whole Plant';

export type SymptomCategory =
  | 'Spots / Lesions'
  | 'Wilting / Drooping'
  | 'Discoloration / Yellowing'
  | 'Curling / Deformed Foliage'
  | 'Pest / Insect Sighting'
  | 'Powdery / Mildew Growth'
  | 'Rotting / Decay'
  | 'Stunted Growth';

export type ProblemDuration =
  | '1-2 days'
  | '3-7 days'
  | '1-2 weeks'
  | 'More than 2 weeks';

export type SpreadingStatus =
  | 'Isolated to few leaves or plants'
  | 'Slowly spreading to adjacent rows'
  | 'Rapidly spreading across plot';

export type DiagnosisType =
  | 'fungal_disease'
  | 'bacterial_disease'
  | 'viral_disease'
  | 'pest_infestation'
  | 'nutrient_deficiency'
  | 'environmental_stress'
  | 'unknown';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type AssessmentStatus = 'active' | 'resolved' | 'archived';

export type FollowupOutcome =
  | 'symptoms_improved'
  | 'symptoms_worsened'
  | 'no_change'
  | 'crop_harvested_salvaged'
  | 'crop_cleared';

export interface PossibleCause {
  id: string;
  common_name: string;
  scientific_name: string;
  type: DiagnosisType;
  confidence_score: number; // 0.0 to 1.0
  confidence_level: ConfidenceLevel;
  summary: string;
  matching_symptoms: string[];
  missing_symptoms: string[];
  typical_conditions: string;
}

export interface DiagnosticAction {
  category: 'cultural' | 'biological' | 'chemical_caution' | 'monitoring';
  title: string;
  description: string;
  timing: string;
  safety_precaution?: string;
}

export interface KVKReferral {
  helpline: string;
  recommendation: string;
  district_center: string;
  portal_url?: string;
}

export interface CropAssessment {
  id: string;
  owner_id: string;
  farm_id?: string | null;
  plot_id?: string | null;
  crop_plan_id?: string | null;
  crop_name: string;
  growth_stage?: string;
  photo_url: string;
  photo_storage_path?: string;
  affected_parts: PlantPart[];
  symptom_categories: SymptomCategory[];
  problem_duration: ProblemDuration;
  is_spreading: SpreadingStatus;
  recent_weather_or_irrigation?: string;
  farmer_notes?: string;
  primary_diagnosis: string;
  diagnosis_type: DiagnosisType;
  diagnosis_status?: 'preliminary_possible' | 'field_verified' | 'unconfirmed_low_confidence';
  escalation_advice?: string;
  confidence_score: number;
  confidence_level: ConfidenceLevel;
  diagnostic_summary: string;
  supporting_evidence: string[];
  missing_or_contradictory: string[];
  possible_causes: PossibleCause[];
  immediate_actions: DiagnosticAction[];
  ipm_cultural_biological_remedies: DiagnosticAction[];
  chemical_management_caution: string;
  kvk_extension_referral: KVKReferral;
  ai_model_used: string;
  is_ai_simulated: boolean;
  status: AssessmentStatus;
  created_at: string;
  updated_at: string;
  followups?: CropAssessmentFollowup[];
}

export interface CropAssessmentFollowup {
  id: string;
  assessment_id: string;
  owner_id: string;
  days_after_assessment: number;
  outcome: FollowupOutcome;
  remedies_applied: string[];
  notes?: string;
  followup_photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DiagnosticEngineInput {
  crop_name: string;
  growth_stage?: string;
  affected_parts: PlantPart[];
  symptom_categories: SymptomCategory[];
  problem_duration: ProblemDuration;
  is_spreading: SpreadingStatus;
  recent_weather_or_irrigation?: string;
  farmer_notes?: string;
  farm_location?: {
    state?: string;
    district?: string;
  };
  photo_base64?: string;
  photo_mime_type?: string;
}

export interface DiagnosticEngineOutput {
  primary_diagnosis: string;
  diagnosis_type: DiagnosisType;
  diagnosis_status?: 'preliminary_possible' | 'field_verified' | 'unconfirmed_low_confidence';
  escalation_advice?: string;
  confidence_score: number;
  confidence_level: ConfidenceLevel;
  diagnostic_summary: string;
  supporting_evidence: string[];
  missing_or_contradictory: string[];
  possible_causes: PossibleCause[];
  immediate_actions: DiagnosticAction[];
  ipm_cultural_biological_remedies: DiagnosticAction[];
  chemical_management_caution: string;
  kvk_extension_referral: KVKReferral;
  ai_model_used: string;
  is_ai_simulated: boolean;
}
