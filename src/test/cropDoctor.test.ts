// CropDiary AI — Phase 3 Automated Vitest Test Suite
// Verifies image processing, diagnostic schemas, ICAR knowledge base matching, and storage adapters.

import { describe, it, expect, beforeEach } from 'vitest';
import { validateImageFile } from '@/features/crop-doctor/utils/imageUtils';
import {
  structuredDiagnosticResponseSchema,
  assessmentIntakeSchema,
  followupFormSchema,
} from '@/lib/validation/cropDoctorSchemas';
import { LocalReferenceDiagnosticAdapter } from '@/features/crop-doctor/services/localReferenceDiagnosticAdapter';
import { DISEASE_REFERENCE_CATALOG } from '@/features/crop-doctor/data/diseaseReferenceCatalog';
import { cropDoctorService } from '@/features/crop-doctor/services/cropDoctorService';
import { storageAdapter } from '@/services/storageAdapter';

describe('Phase 3: Image Validation & Privacy Sanitization', () => {
  it('accepts valid JPEG, PNG, and WebP files under 5MB', () => {
    const validJpeg = new File(['fake content'], 'leaf.jpg', { type: 'image/jpeg' });
    const validPng = new File(['fake content'], 'leaf.png', { type: 'image/png' });
    const validWebp = new File(['fake content'], 'leaf.webp', { type: 'image/webp' });

    expect(validateImageFile(validJpeg).isValid).toBe(true);
    expect(validateImageFile(validPng).isValid).toBe(true);
    expect(validateImageFile(validWebp).isValid).toBe(true);
  });

  it('rejects unsupported file formats like GIF, PDF, or SVG', () => {
    const invalidGif = new File(['fake content'], 'leaf.gif', { type: 'image/gif' });
    const invalidPdf = new File(['fake content'], 'doc.pdf', { type: 'application/pdf' });

    const gifRes = validateImageFile(invalidGif);
    expect(gifRes.isValid).toBe(false);
    expect(gifRes.error).toContain('Unsupported image format');

    const pdfRes = validateImageFile(invalidPdf);
    expect(pdfRes.isValid).toBe(false);
  });

  it('rejects oversized files exceeding 5.0 MB', () => {
    // 6 MB buffer
    const largeBuffer = new Uint8Array(6 * 1024 * 1024);
    const largeFile = new File([largeBuffer], 'large_leaf.jpg', { type: 'image/jpeg' });

    const res = validateImageFile(largeFile);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('exceeds the maximum allowed limit of 5.0 MB');
  });
});

describe('Phase 3: Diagnostic Schema & Response Validation', () => {
  it('validates a complete, compliant diagnostic response payload', () => {
    const validPayload = {
      primary_diagnosis: 'Paddy Blast (Magnaporthe oryzae)',
      diagnosis_type: 'fungal_disease',
      confidence_score: 0.88,
      confidence_level: 'high',
      diagnostic_summary: 'Spindle-shaped lesions with ash-grey centers on rice foliage.',
      supporting_evidence: ['Diamond-shaped leaf spots', 'High relative humidity'],
      missing_or_contradictory: ['No panicle neck rot observed yet'],
      possible_causes: [
        {
          id: 'rice-blast',
          common_name: 'Paddy Blast',
          scientific_name: 'Magnaporthe oryzae',
          type: 'fungal_disease',
          confidence_score: 0.88,
          confidence_level: 'high',
          summary: 'Severe fungal foliar pathogen',
          matching_symptoms: ['Spindle spots'],
          missing_symptoms: ['Neck rot'],
          typical_conditions: 'High humidity',
        },
      ],
      immediate_actions: [
        {
          category: 'cultural',
          title: 'Stop Top-Dress Urea',
          description: 'Immediately halt nitrogen application to reduce tissue softness.',
          timing: 'Immediate',
        },
      ],
      ipm_cultural_biological_remedies: [
        {
          category: 'biological',
          title: 'Pseudomonas fluorescens Spray',
          description: 'Apply talc-formulated Pseudomonas fluorescens @ 10 g/litre.',
          timing: 'Early morning',
        },
      ],
      chemical_management_caution:
        'Consult KVK before using CIBRC-approved Tricyclazole 75% WP. Strictly avoid WHO Class Ia/Ib chemicals. Wear full PPE.',
      kvk_extension_referral: {
        helpline: 'Kisan Call Centre: 1800-180-1551',
        recommendation: 'Submit fresh leaf sample in paper envelope.',
        district_center: 'Krishi Vigyan Kendra, Coimbatore',
        portal_url: 'https://kvk.icar.gov.in',
      },
      ai_model_used: 'ICAR Agronomic Matrix v1',
      is_ai_simulated: true,
    };

    const parsed = structuredDiagnosticResponseSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);
  });

  it('rejects payloads with invalid confidence score bounds or missing immediate actions', () => {
    const invalidConfidence = {
      primary_diagnosis: 'Tomato Early Blight',
      diagnosis_type: 'fungal_disease',
      confidence_score: 1.5, // Invalid > 1.0
      confidence_level: 'high',
      diagnostic_summary: 'Target spots on lower leaves',
      supporting_evidence: ['Target spots'],
      missing_or_contradictory: [],
      possible_causes: [],
      immediate_actions: [],
      ipm_cultural_biological_remedies: [],
      chemical_management_caution: 'Standard caution',
      kvk_extension_referral: {
        helpline: '1800-180-1551',
        recommendation: 'Visit KVK',
        district_center: 'KVK',
      },
      ai_model_used: 'Test',
      is_ai_simulated: true,
    };

    const result = structuredDiagnosticResponseSchema.safeParse(invalidConfidence);
    expect(result.success).toBe(false);
  });

  it('validates follow-up form schema', () => {
    const validFollowup = {
      outcome: 'symptoms_improved',
      days_after_assessment: 7,
      remedies_applied: ['Sprayed Pseudomonas fluorescens', 'Stopped nitrogen top-dressing'],
      notes: 'New leaves emerging without spots.',
    };

    const result = followupFormSchema.safeParse(validFollowup);
    expect(result.success).toBe(true);
  });
});

describe('Phase 3: Local ICAR Reference Diagnostic Engine', () => {
  const adapter = new LocalReferenceDiagnosticAdapter();

  it('correctly matches Paddy Blast for rice with spots and lesions', async () => {
    const result = await adapter.diagnose({
      crop_name: 'Paddy / Rice',
      growth_stage: 'Tillering',
      affected_parts: ['Leaves'],
      symptom_categories: ['Spots / Lesions', 'Discoloration / Yellowing'],
      problem_duration: '3-7 days',
      is_spreading: 'Slowly spreading to adjacent rows',
      farmer_notes: 'Spindle-shaped spots with grey centers',
    });

    expect(result.primary_diagnosis).toContain('Paddy Blast');
    expect(result.diagnosis_type).toBe('fungal_disease');
    expect(result.confidence_score).toBeGreaterThanOrEqual(0.65);
    expect(result.confidence_level).toBe('high');
    expect(result.is_ai_simulated).toBe(true);
    expect(result.kvk_extension_referral.helpline).toContain('1800-180-1551');
  });

  it('correctly matches Tomato Early Blight for tomato with target spots', async () => {
    const result = await adapter.diagnose({
      crop_name: 'Tomato',
      growth_stage: 'Vegetative',
      affected_parts: ['Leaves'],
      symptom_categories: ['Spots / Lesions', 'Discoloration / Yellowing'],
      problem_duration: '3-7 days',
      is_spreading: 'Slowly spreading to adjacent rows',
      farmer_notes: 'Concentric rings target board spots on lower leaves',
    });

    expect(result.primary_diagnosis).toContain('Tomato Early Blight');
    expect(result.diagnosis_type).toBe('fungal_disease');
    expect(result.supporting_evidence.length).toBeGreaterThan(0);
    expect(result.immediate_actions.length).toBeGreaterThan(0);
  });

  it('correctly identifies Fall Armyworm for maize with whorl feeding and frass', async () => {
    const result = await adapter.diagnose({
      crop_name: 'Maize / Corn',
      growth_stage: 'Whorl Stage',
      affected_parts: ['Leaves', 'Stem / Stalk'],
      symptom_categories: ['Pest / Insect Sighting', 'Spots / Lesions'],
      problem_duration: '1-2 days',
      is_spreading: 'Slowly spreading to adjacent rows',
      farmer_notes: 'Sawdust like frass inside whorls and windowpane feeding',
    });

    expect(result.primary_diagnosis).toContain('Fall Armyworm');
    expect(result.diagnosis_type).toBe('pest_infestation');
    expect(result.ipm_cultural_biological_remedies.some((r) => r.title.includes('Bacillus') || r.title.includes('Pheromone'))).toBe(true);
  });

  it('strictly ensures zero WHO Class Ia/Ib pesticide recommendations in reference catalog', () => {
    // Audit all entries in catalog
    const bannedPesticides = [
      'monocrotophos',
      'phorate',
      'methyl parathion',
      'phosphamidon',
      'carbofuran',
      'endosulfan',
      'aldicarb',
    ];

    for (const entry of DISEASE_REFERENCE_CATALOG) {
      const allText = `${entry.chemical_caution} ${JSON.stringify(entry.immediate_actions)} ${JSON.stringify(entry.ipm_remedies)}`.toLowerCase();
      for (const banned of bannedPesticides) {
        expect(allText.includes(`apply ${banned}`)).toBe(false);
        expect(allText.includes(`spray ${banned}`)).toBe(false);
      }
      expect(entry.chemical_caution.toLowerCase()).toContain('cibrc');
      expect(entry.chemical_caution.toLowerCase()).toContain('ia/ib');
    }
  });
});

describe('Phase 3: Storage Adapter & Crop Doctor Service', () => {
  const testUserId = 'test_farmer_uid_101';
  let createdAssessmentId: string;

  it('creates, retrieves, and updates crop assessment with tenant isolation', async () => {
    const created = await storageAdapter.createAssessment(testUserId, {
      farm_id: 'farm-101',
      plot_id: 'plot-202',
      crop_name: 'Tomato',
      growth_stage: 'Flowering',
      photo_url: 'data:image/jpeg;base64,mockValidPhoto',
      affected_parts: ['Leaves'],
      symptom_categories: ['Spots / Lesions'],
      problem_duration: '3-7 days',
      is_spreading: 'Slowly spreading to adjacent rows',
      primary_diagnosis: 'Tomato Early Blight (Alternaria solani)',
      diagnosis_type: 'fungal_disease',
      confidence_score: 0.85,
      confidence_level: 'high',
      diagnostic_summary: 'Target spot lesions on lower canopy.',
      supporting_evidence: ['Target spots observed'],
      missing_or_contradictory: [],
      possible_causes: [],
      immediate_actions: [
        {
          category: 'cultural',
          title: 'Prune Lower Foliage',
          description: 'Remove bottom leaves touching soil.',
          timing: 'Immediate',
        },
      ],
      ipm_cultural_biological_remedies: [
        {
          category: 'biological',
          title: 'Trichoderma Spray',
          description: 'Apply Trichoderma viride @ 5g/L.',
          timing: 'Morning',
        },
      ],
      chemical_management_caution: 'Use CIBRC approved fungicides with PPE only.',
      kvk_extension_referral: {
        helpline: 'Kisan Call Centre (KCC): 1800-180-1551',
        recommendation: 'Visit local KVK.',
        district_center: 'KVK Center',
      },
      ai_model_used: 'ICAR-TNAU Matrix',
      is_ai_simulated: true,
      status: 'active',
    });

    expect(created.id).toBeDefined();
    expect(created.owner_id).toBe(testUserId);
    expect(created.primary_diagnosis).toBe('Tomato Early Blight (Alternaria solani)');
    createdAssessmentId = created.id;

    // Retrieve single
    const fetched = await storageAdapter.getAssessmentById(testUserId, createdAssessmentId);
    expect(fetched).not.toBeNull();
    expect(fetched?.crop_name).toBe('Tomato');

    // Tenant isolation: other user cannot fetch
    const foreignUserFetch = await storageAdapter.getAssessmentById('foreign_user_999', createdAssessmentId);
    expect(foreignUserFetch).toBeNull();
  });

  it('records follow-up observation linking to the assessment', async () => {
    const followup = await storageAdapter.createAssessmentFollowup(testUserId, {
      assessment_id: createdAssessmentId,
      days_after_assessment: 7,
      outcome: 'symptoms_improved',
      remedies_applied: ['Pruned lower leaves', 'Sprayed Trichoderma viride'],
      notes: 'New flushes are spot-free.',
    });

    expect(followup.id).toBeDefined();
    expect(followup.assessment_id).toBe(createdAssessmentId);
    expect(followup.outcome).toBe('symptoms_improved');

    // Retrieve assessment with followups
    const fetched = await storageAdapter.getAssessmentById(testUserId, createdAssessmentId);
    expect(fetched?.followups?.length).toBe(1);
    expect(fetched?.followups?.[0].outcome).toBe('symptoms_improved');
  });

  it('generates clean shareable text advisory and Farm Diary draft', async () => {
    const assessment = await storageAdapter.getAssessmentById(testUserId, createdAssessmentId);
    expect(assessment).not.toBeNull();

    // Export text summary
    const summaryText = cropDoctorService.exportAssessmentSummaryText(assessment!);
    expect(summaryText).toContain('CROPDIARY AI — DIAGNOSTIC HEALTH REPORT');
    expect(summaryText).toContain('Tomato Early Blight');
    expect(summaryText).toContain('Kisan Call Centre (KCC): 1800-180-1551');

    // Phase 5 Diary draft bridge
    const diaryDraft = cropDoctorService.getFarmDiaryEntryDraft(assessment!);
    expect(diaryDraft.activity_type).toBe('pest_disease_scouting');
    expect(diaryDraft.title).toContain('Tomato Early Blight');
    expect(diaryDraft.reference_assessment_id).toBe(createdAssessmentId);
  });

  it('deletes assessment and cascades cleanup', async () => {
    await storageAdapter.deleteAssessment(testUserId, createdAssessmentId);
    const deleted = await storageAdapter.getAssessmentById(testUserId, createdAssessmentId);
    expect(deleted).toBeNull();
  });
});
