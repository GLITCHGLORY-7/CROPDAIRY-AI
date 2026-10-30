// CropDiary AI — AI Crop Doctor Service Orchestrator
// Coordinates AI Vision multi-modal adapter, local ICAR reference engine, photo uploads, and persistence.

import { storageAdapter } from '@/services/storageAdapter';
import {
  CropAssessment,
  CropAssessmentFollowup,
  DiagnosticEngineInput,
  DiagnosticEngineOutput,
} from '@/types/cropDoctor';
import { IAICropDoctorAdapter } from './IAICropDoctorAdapter';
import { MetaLlamaVisionAdapter } from './metaLlamaVisionAdapter';
import { LocalReferenceDiagnosticAdapter } from './localReferenceDiagnosticAdapter';

export class CropDoctorService {
  private adapters: IAICropDoctorAdapter[];

  constructor() {
    this.adapters = [
      new MetaLlamaVisionAdapter(),
      new LocalReferenceDiagnosticAdapter(),
    ];
  }

  /**
   * Evaluates symptoms using the highest-priority available adapter.
   */
  async runDiagnosticAnalysis(input: DiagnosticEngineInput): Promise<DiagnosticEngineOutput> {
    for (const adapter of this.adapters) {
      if (adapter.isAvailable()) {
        try {
          return await adapter.diagnose(input);
        } catch (err: any) {
          console.warn(`Adapter "${adapter.name}" analysis failed, trying next adapter:`, err.message);
        }
      }
    }

    // Always ensure LocalReferenceDiagnosticAdapter runs as reliable fallback
    const fallback = new LocalReferenceDiagnosticAdapter();
    return await fallback.diagnose(input);
  }

  /**
   * Uploads the sanitized photo (if provided) and saves the complete assessment.
   */
  async saveAssessment(
    userId: string,
    params: {
      inputData: Omit<CropAssessment, 'id' | 'owner_id' | 'created_at' | 'updated_at' | 'photo_url' | 'photo_storage_path'>;
      photoFile?: File;
      photoPreviewUrl?: string;
    }
  ): Promise<CropAssessment> {
    const tempAssessmentId = crypto.randomUUID ? crypto.randomUUID() : `temp_${Date.now()}`;
    let photoUrl = params.photoPreviewUrl || 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=600&q=80';
    let photoStoragePath: string | undefined = undefined;

    if (params.photoFile) {
      try {
        const uploadResult = await storageAdapter.uploadAssessmentPhoto(
          userId,
          tempAssessmentId,
          params.photoFile
        );
        photoUrl = uploadResult.url;
        photoStoragePath = uploadResult.path;
      } catch (err) {
        console.warn('Photo storage upload encountered an issue, preserving client preview:', err);
      }
    }

    const assessmentToSave: Omit<CropAssessment, 'id' | 'owner_id' | 'created_at' | 'updated_at'> = {
      ...params.inputData,
      photo_url: photoUrl,
      photo_storage_path: photoStoragePath,
      status: 'active',
    };

    return await storageAdapter.createAssessment(userId, assessmentToSave);
  }

  async getAssessments(
    userId: string,
    filters?: { farmId?: string; plotId?: string; cropName?: string }
  ): Promise<CropAssessment[]> {
    return await storageAdapter.getAssessments(userId, filters);
  }

  async getAssessmentById(
    userId: string,
    assessmentId: string
  ): Promise<CropAssessment | null> {
    return await storageAdapter.getAssessmentById(userId, assessmentId);
  }

  async deleteAssessment(userId: string, assessmentId: string): Promise<void> {
    return await storageAdapter.deleteAssessment(userId, assessmentId);
  }

  async addFollowup(
    userId: string,
    followup: Omit<CropAssessmentFollowup, 'id' | 'owner_id' | 'created_at' | 'updated_at'>
  ): Promise<CropAssessmentFollowup> {
    return await storageAdapter.createAssessmentFollowup(userId, followup);
  }

  /**
   * Formats diagnosis as shareable/printable text for WhatsApp or printing.
   */
  exportAssessmentSummaryText(assessment: CropAssessment): string {
    const lines = [
      `🌱 CROPDIARY AI — DIAGNOSTIC HEALTH REPORT`,
      `=============================================`,
      `Date: ${new Date(assessment.created_at).toLocaleDateString('en-IN', { dateStyle: 'full' })}`,
      `Crop: ${assessment.crop_name} (${assessment.growth_stage || 'Stage unrecorded'})`,
      `Primary Diagnosis: ${assessment.primary_diagnosis}`,
      `Classification: ${assessment.diagnosis_type.replace('_', ' ').toUpperCase()}`,
      `Confidence: ${(assessment.confidence_score * 100).toFixed(0)}% (${assessment.confidence_level.toUpperCase()})`,
      `Diagnosis Engine: ${assessment.ai_model_used}`,
      ``,
      `--- SYMPTOM PROFILE ---`,
      `Affected Parts: ${assessment.affected_parts.join(', ')}`,
      `Symptoms: ${assessment.symptom_categories.join(', ')}`,
      `Duration: ${assessment.problem_duration} | Spread: ${assessment.is_spreading}`,
      ``,
      `--- DIAGNOSTIC SUMMARY ---`,
      assessment.diagnostic_summary,
      ``,
      `--- IMMEDIATE SANITATION STEPS ---`,
      ...assessment.immediate_actions.map(
        (a, i) => `${i + 1}. [${a.timing}] ${a.title}: ${a.description}`
      ),
      ``,
      `--- RECOMMENDED IPM (BIOLOGICAL / CULTURAL) ---`,
      ...assessment.ipm_cultural_biological_remedies.map(
        (r, i) => `${i + 1}. ${r.title}: ${r.description}`
      ),
      ``,
      `--- CHEMICAL MANAGEMENT SAFETY NOTICE ---`,
      assessment.chemical_management_caution,
      ``,
      `--- EXTENSION ADVISORY ---`,
      `Helpline: ${assessment.kvk_extension_referral.helpline}`,
      `Center: ${assessment.kvk_extension_referral.district_center}`,
      `Guidance: ${assessment.kvk_extension_referral.recommendation}`,
      `=============================================`,
      `Generated by CropDiary AI. Consult local KVK officers before applying restricted chemicals.`,
    ];

    return lines.join('\n');
  }

  /**
   * Phase 5 Extension Boundary: Converts an assessment into a pre-filled Farm Diary activity draft.
   */
  getFarmDiaryEntryDraft(assessment: CropAssessment) {
    return {
      farm_id: assessment.farm_id,
      plot_id: assessment.plot_id,
      crop_plan_id: assessment.crop_plan_id,
      activity_type: 'pest_disease_scouting',
      title: `Crop Doctor Scan: ${assessment.primary_diagnosis}`,
      description: `Detected ${assessment.primary_diagnosis} on ${assessment.crop_name} (${(assessment.confidence_score * 100).toFixed(0)}% confidence). Applied immediate sanitation: ${assessment.immediate_actions[0]?.title || 'field scouting'}.`,
      date: new Date().toISOString().split('T')[0],
      reference_assessment_id: assessment.id,
      tags: ['crop-doctor', assessment.diagnosis_type, assessment.crop_name],
    };
  }
}

export const cropDoctorService = new CropDoctorService();
