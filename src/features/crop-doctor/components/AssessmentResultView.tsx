// CropDiary AI — Diagnostic Assessment Result View Component
// Displays explainable diagnosis, confidence levels, IPM recommendations, safety cautions, and KVK referrals.

import React, { useState } from 'react';
import {
  CropAssessment,
  DiagnosticEngineOutput,
  DiagnosisType,
  ConfidenceLevel,
} from '@/types/cropDoctor';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Info,
  BookmarkCheck,
  PhoneCall,
  Sprout,
  ShieldCheck,
  Bug,
  HelpCircle,
  Copy,
  Check,
  FileText,
  Calendar,
} from 'lucide-react';
import { cropDoctorService } from '../services/cropDoctorService';
import { useToast } from '@/context/ToastContext';

interface AssessmentResultViewProps {
  assessment: CropAssessment | (DiagnosticEngineOutput & {
    id?: string;
    crop_name: string;
    growth_stage?: string;
    photo_url: string;
    affected_parts: any[];
    symptom_categories: any[];
    problem_duration: any;
    is_spreading: any;
    created_at?: string;
  });
  isSaved?: boolean;
  onSave?: () => void;
  isSaving?: boolean;
  onOpenFollowupModal?: () => void;
}

export const AssessmentResultView: React.FC<AssessmentResultViewProps> = ({
  assessment,
  isSaved = false,
  onSave,
  isSaving = false,
  onOpenFollowupModal,
}) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const getConfidenceBadge = (level: ConfidenceLevel, score: number) => {
    const pct = `${(score * 100).toFixed(0)}%`;
    switch (level) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>High Confidence ({pct})</span>
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Moderate Confidence ({pct})</span>
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Preliminary Assessment ({pct})</span>
          </span>
        );
    }
  };

  const getDiagnosisTypeBadge = (type: DiagnosisType) => {
    const formatted = type.replace('_', ' ').toUpperCase();
    switch (type) {
      case 'fungal_disease':
        return <Badge variant="warning">{formatted}</Badge>;
      case 'bacterial_disease':
        return <Badge variant="warning">{formatted}</Badge>;
      case 'viral_disease':
        return <Badge variant="outline">{formatted}</Badge>;
      case 'pest_infestation':
        return <Badge variant="neutral">{formatted}</Badge>;
      case 'nutrient_deficiency':
        return <Badge variant="outline">{formatted}</Badge>;
      default:
        return <Badge variant="neutral">{formatted}</Badge>;
    }
  };

  const handleShareOrCopy = () => {
    try {
      const fullText = cropDoctorService.exportAssessmentSummaryText(assessment as any);
      navigator.clipboard.writeText(fullText);
      setCopied(true);
      showToast('success', 'Advisory Copied', 'Diagnostic report copied to clipboard. Ready to paste into WhatsApp or notes.');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      showToast('info', 'Report Ready', 'Please select text to copy.');
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Primary Diagnosis Hero Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-agri-900 via-slate-900 to-agri-950 text-white shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-agri-300">
              Crop Doctor Diagnosis
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs text-agri-200 font-semibold">{assessment.crop_name}</span>
            {assessment.growth_stage && (
              <span className="text-xs text-slate-300">({assessment.growth_stage})</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {getDiagnosisTypeBadge(assessment.diagnosis_type)}
            {getConfidenceBadge(assessment.confidence_level, assessment.confidence_score)}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={assessment.diagnosis_status === 'field_verified' ? 'success' : 'warning'}>
              {assessment.diagnosis_status === 'field_verified'
                ? '✓ Field Verified Diagnosis'
                : 'Provisional AI Hypothesis (Field Unconfirmed)'}
            </Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {assessment.primary_diagnosis}
          </h2>
          <p className="text-sm text-agri-100 leading-relaxed mt-2 max-w-3xl">
            {assessment.diagnostic_summary}
          </p>
        </div>

        {/* Escalation Advisory Box */}
        {(assessment.escalation_advice || assessment.confidence_score < 0.7 || (assessment.is_spreading && String(assessment.is_spreading).includes('Rapidly'))) && (
          <div className="p-3.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-100 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Agronomic Escalation Advisory:</strong>
              {assessment.escalation_advice ||
                'Symptoms are spreading rapidly or diagnostic confidence is provisional. Do not apply broad-spectrum chemical sprays without field inspection. Contact Kisan Call Centre (1800-180-1551) or visit your nearest KVK.'}
            </div>
          </div>
        )}

        {/* Epistemic Transparency Banner */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/10 border border-white/15 text-xs text-slate-200">
          <Info className="w-4 h-4 text-agri-300 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-white">Diagnostic Engine Notice: </span>
            {assessment.is_ai_simulated ? (
              <span>
                Generated using the verified <strong>ICAR & TNAU Plant Pathology Agronomic Knowledge Base</strong>.
                AI Vision API key is not configured in this environment. All recommendations are derived from deterministic Indian agricultural research.
              </span>
            ) : (
              <span>
                Evaluated by <strong>{assessment.ai_model_used}</strong> multi-modal vision intelligence.
                AI recommendations should be cross-verified with field symptoms and local extension officers.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar (Save, Export, Diary) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <FileText className="w-4 h-4 text-agri-600" />
          <span>Report ID: <strong className="font-mono text-slate-800">{assessment.id ? assessment.id.slice(0, 8) : 'Unsaved Draft'}</strong></span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleShareOrCopy}
            className="text-xs gap-1.5 min-h-[38px]"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy / Share Report'}</span>
          </Button>

          {!isSaved && onSave && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onSave}
              disabled={isSaving}
              className="text-xs gap-1.5 min-h-[38px]"
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save to Farm Records'}</span>
            </Button>
          )}

          {isSaved && onOpenFollowupModal && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onOpenFollowupModal}
              className="text-xs gap-1.5 min-h-[38px]"
            >
              <Calendar className="w-4 h-4" />
              <span>Record Follow-up Observation</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2-Column Main Section: Evidence Breakdown & Alternative Causes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Supporting Evidence & Missing Symptoms */}
        <Card className="border-slate-200/90 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Observable Evidence & Diagnostic Rationale</span>
            </CardTitle>
            <CardDescription>
              Why this condition was identified based on your reported symptoms
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            {/* Supporting Evidence */}
            <div className="space-y-2">
              <span className="font-bold text-slate-800 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Supporting Indicators</span>
              </span>
              <ul className="space-y-1.5 pl-1">
                {assessment.supporting_evidence.map((ev, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-700 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <span>{ev}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Missing or Inconclusive Symptoms */}
            {assessment.missing_or_contradictory.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="font-bold text-amber-800 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Unconfirmed or Missing Indicators</span>
                </span>
                <ul className="space-y-1.5 pl-1">
                  {assessment.missing_or_contradictory.map((miss, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-600 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                      <span>{miss}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Alternative Causes (Differential Diagnosis) */}
        <Card className="border-slate-200/90 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bug className="w-4 h-4 text-agri-700" />
              <span>Differential Diagnosis (Alternative Possibilities)</span>
            </CardTitle>
            <CardDescription>
              Other potential causes with similar foliar or stem symptoms
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            {assessment.possible_causes.map((cause) => (
              <div
                key={cause.id}
                className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{cause.common_name}</span>
                  <span className="font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                    {(cause.confidence_score * 100).toFixed(0)}% Match
                  </span>
                </div>
                <div className="text-[11px] italic text-slate-500">{cause.scientific_name}</div>
                <p className="text-slate-600 leading-relaxed text-[11px] pt-1">
                  {cause.summary}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Action Plan: Immediate Sanitation & IPM Solutions */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Recommended Agronomic Action Plan
          </h3>
          <p className="text-xs text-slate-500">
            Step-by-step cultural sanitation, biological remedies, and safety advisories
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Immediate Sanitation Steps */}
          <Card className="border-slate-200/90 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 bg-amber-50/40">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Step 1: Immediate Field Sanitation</span>
              </CardTitle>
              <CardDescription>
                Urgent actions to arrest pathogen spread without chemicals
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              {assessment.immediate_actions.map((action, i) => (
                <div key={i} className="p-3 rounded-xl border border-slate-100 bg-white space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{action.title}</span>
                    <Badge variant="outline" className="text-[10px]">{action.timing}</Badge>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{action.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 2. IPM Biological & Cultural Solutions */}
          <Card className="border-slate-200/90 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 bg-emerald-50/40">
              <CardTitle className="text-sm flex items-center gap-2 text-emerald-900">
                <Sprout className="w-4 h-4 text-emerald-700" />
                <span>Step 2: Recommended Biological & Organic Controls</span>
              </CardTitle>
              <CardDescription>
                Safe biocontrol agents, botanicals, and long-term soil health
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              {assessment.ipm_cultural_biological_remedies.map((remedy, i) => (
                <div key={i} className="p-3 rounded-xl border border-slate-100 bg-white space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{remedy.title}</span>
                    <Badge variant="success" className="text-[10px]">{remedy.timing}</Badge>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{remedy.description}</p>
                  {remedy.safety_precaution && (
                    <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg mt-1 border border-emerald-200">
                      <strong>Precaution:</strong> {remedy.safety_precaution}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Safety Caution Notice & Chemical Advisory */}
      <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-300 text-amber-950 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0" />
          <h4 className="font-bold text-sm text-amber-950">
            Responsible Agrochemical & Safety Advisory
          </h4>
        </div>
        <p className="text-xs text-amber-900 leading-relaxed">
          {assessment.chemical_management_caution}
        </p>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-amber-900 bg-amber-100/60 p-2 rounded-lg border border-amber-200">
          <span>⚠️ <strong>Zero Tolerance Notice:</strong> Never apply unapproved or banned WHO Class Ia/Ib red-label chemical pesticides. Always wear full PPE (nitrile gloves, particulate mask, protective eye goggles) and follow pre-harvest intervals (PHI).</span>
        </div>
      </div>

      {/* Extension Support & KVK Referral */}
      <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-agri-400" />
            <h4 className="font-bold text-sm text-white">
              Official Extension & Laboratory Referral
            </h4>
          </div>
          <span className="text-xs font-mono font-bold text-agri-300 bg-agri-950/80 px-2.5 py-1 rounded-lg border border-agri-700">
            {assessment.kvk_extension_referral.helpline}
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {assessment.kvk_extension_referral.recommendation}
        </p>
        <div className="text-xs text-slate-400">
          Suggested Center: <strong className="text-white">{assessment.kvk_extension_referral.district_center}</strong>
        </div>
      </div>
    </div>
  );
};
