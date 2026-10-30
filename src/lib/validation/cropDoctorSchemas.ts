// CropDiary AI — Phase 3 Zod Validation Schemas
// Enforces schema integrity for assessment intake, follow-ups, and AI diagnostic responses.

import { z } from 'zod';

export const plantPartsEnum = z.enum([
  'Leaves',
  'Stem / Stalk',
  'Roots / Crown',
  'Flowers',
  'Fruits / Grains / Pods',
  'Whole Plant',
]);

export const symptomCategoriesEnum = z.enum([
  'Spots / Lesions',
  'Wilting / Drooping',
  'Discoloration / Yellowing',
  'Curling / Deformed Foliage',
  'Pest / Insect Sighting',
  'Powdery / Mildew Growth',
  'Rotting / Decay',
  'Stunted Growth',
]);

export const problemDurationEnum = z.enum([
  '1-2 days',
  '3-7 days',
  '1-2 weeks',
  'More than 2 weeks',
]);

export const spreadingStatusEnum = z.enum([
  'Isolated to few leaves or plants',
  'Slowly spreading to adjacent rows',
  'Rapidly spreading across plot',
]);

export const followupOutcomeEnum = z.enum([
  'symptoms_improved',
  'symptoms_worsened',
  'no_change',
  'crop_harvested_salvaged',
  'crop_cleared',
]);

export const diagnosisTypeEnum = z.enum([
  'fungal_disease',
  'bacterial_disease',
  'viral_disease',
  'pest_infestation',
  'nutrient_deficiency',
  'environmental_stress',
  'unknown',
]);

export const confidenceLevelEnum = z.enum(['high', 'medium', 'low']);

export const diagnosticActionSchema = z.object({
  category: z.enum(['cultural', 'biological', 'chemical_caution', 'monitoring']),
  title: z.string().min(2),
  description: z.string().min(5),
  timing: z.string().min(1),
  safety_precaution: z.string().optional(),
});

export const possibleCauseSchema = z.object({
  id: z.string(),
  common_name: z.string(),
  scientific_name: z.string(),
  type: diagnosisTypeEnum,
  confidence_score: z.number().min(0).max(1),
  confidence_level: confidenceLevelEnum,
  summary: z.string(),
  matching_symptoms: z.array(z.string()),
  missing_symptoms: z.array(z.string()),
  typical_conditions: z.string(),
});

export const kvkReferralSchema = z.object({
  helpline: z.string(),
  recommendation: z.string(),
  district_center: z.string(),
  portal_url: z.string().optional(),
});

// Intake Form Schema
export const assessmentIntakeSchema = z.object({
  farm_id: z.string().optional().nullable(),
  plot_id: z.string().optional().nullable(),
  crop_plan_id: z.string().optional().nullable(),
  crop_name: z.string().min(2, 'Please specify the crop name (e.g. Paddy, Tomato)'),
  growth_stage: z.string().optional().nullable(),
  affected_parts: z
    .array(plantPartsEnum)
    .min(1, 'Please select at least one affected plant part'),
  symptom_categories: z
    .array(symptomCategoriesEnum)
    .min(1, 'Please select at least one observable symptom category'),
  problem_duration: problemDurationEnum,
  is_spreading: spreadingStatusEnum,
  recent_weather_or_irrigation: z
    .string()
    .max(500, 'Notes must be within 500 characters')
    .optional()
    .nullable(),
  farmer_notes: z
    .string()
    .max(1000, 'Farmer notes must be within 1000 characters')
    .optional()
    .nullable(),
});

export type AssessmentIntakeFormData = z.infer<typeof assessmentIntakeSchema>;

// Follow-up Form Schema
export const followupFormSchema = z.object({
  outcome: followupOutcomeEnum,
  days_after_assessment: z
    .number()
    .min(0, 'Days must be at least 0')
    .max(365, 'Days must be reasonable'),
  remedies_applied: z.array(z.string()).default([]),
  notes: z
    .string()
    .max(1000, 'Notes must be within 1000 characters')
    .optional()
    .nullable(),
  followup_photo_url: z.string().optional().nullable(),
});

export type FollowupFormData = z.infer<typeof followupFormSchema>;

// Strict Schema for Validating AI Diagnostic Engine Output
export const structuredDiagnosticResponseSchema = z.object({
  primary_diagnosis: z.string().min(3),
  diagnosis_type: diagnosisTypeEnum,
  confidence_score: z.number().min(0).max(1),
  confidence_level: confidenceLevelEnum,
  diagnostic_summary: z.string().min(10),
  supporting_evidence: z.array(z.string()).min(1),
  missing_or_contradictory: z.array(z.string()).default([]),
  possible_causes: z.array(possibleCauseSchema).min(1),
  immediate_actions: z.array(diagnosticActionSchema).min(1),
  ipm_cultural_biological_remedies: z.array(diagnosticActionSchema).min(1),
  chemical_management_caution: z.string().min(10),
  kvk_extension_referral: kvkReferralSchema,
  ai_model_used: z.string(),
  is_ai_simulated: z.boolean(),
});
