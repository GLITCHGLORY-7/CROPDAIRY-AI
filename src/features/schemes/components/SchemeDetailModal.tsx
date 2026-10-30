// CropDiary AI — Scheme Detail Modal
import React from 'react';
import {
  X,
  ExternalLink,
  CheckCircle2,
  FileText,
  Landmark,
  Percent,
  Clock,
  Bell,
  Check,
  Layers,
} from 'lucide-react';
import { GovernmentScheme, SchemeEligibilityAssessment } from '@/types/schemes';
import { Language } from '@/types/assistant';
import { EligibilityAssessmentCard } from './EligibilityAssessmentCard';

interface SchemeDetailModalProps {
  scheme: GovernmentScheme;
  language: Language;
  assessment?: SchemeEligibilityAssessment | null;
  onClose: () => void;
  onSetReminder: (scheme: GovernmentScheme) => void;
}

export const SchemeDetailModal: React.FC<SchemeDetailModalProps> = ({
  scheme,
  language,
  assessment,
  onClose,
  onSetReminder,
}) => {
  const schemeTitle = language === 'ta' && scheme.name_ta ? scheme.name_ta : scheme.name;
  const benefits = language === 'ta' && scheme.benefits_summary_ta ? scheme.benefits_summary_ta : scheme.benefits_summary;
  const description = language === 'ta' && scheme.description_ta ? scheme.description_ta : scheme.description;
  const department = language === 'ta' && scheme.department_ta ? scheme.department_ta : scheme.department;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="scheme-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50 dark:bg-slate-800/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {scheme.code}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {scheme.scope === 'central'
                  ? language === 'ta'
                    ? 'மத்திய அரசு'
                    : 'Central'
                  : language === 'ta'
                  ? 'தமிழ்நாடு மாநிலம்'
                  : 'Tamil Nadu'}
              </span>
            </div>
            <h3
              id="scheme-modal-title"
              className="text-lg font-bold text-slate-900 dark:text-slate-100"
            >
              {schemeTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Landmark className="w-3.5 h-3.5" />
              <span>{department}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
            aria-label={language === 'ta' ? 'மூடுக' : 'Close details'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Eligibility Assessment Card if context available */}
          {assessment && (
            <EligibilityAssessmentCard
              assessment={assessment}
              scheme={scheme}
              language={language}
              onSetReminder={onSetReminder}
            />
          )}

          {/* Benefits Box */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/80">
            <div className="flex items-start gap-2.5">
              <Percent className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider block">
                  {language === 'ta' ? 'மானிய விகிதம் / நிதி பலன்' : 'Financial Benefit & Subsidy'}
                </span>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mt-1">
                  {scheme.subsidy_amount_or_percent}
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                  {benefits}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              {language === 'ta' ? 'திட்டத்தின் நோக்கம் & விவரம்' : 'Scheme Overview & Objectives'}
            </h4>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {description}
            </p>
          </div>

          {/* Eligibility Criteria */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'ta' ? 'விண்ணப்பிக்க தகுதிகள்' : 'Eligibility Criteria'}</span>
            </h4>
            <ul className="space-y-2">
              {scheme.eligibility_criteria.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Required Documents */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>{language === 'ta' ? 'தேவையான ஆவணங்கள்' : 'Required Documents'}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {scheme.required_documents.map((doc, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2"
                >
                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-mono shrink-0">
                    {i + 1}
                  </span>
                  <span>{doc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scheme Meta & Eligible Crops */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {language === 'ta' ? 'பொருந்தும் பயிர்கள்:' : 'Eligible Crops:'}
              </span>
              <span>{scheme.eligible_crops.join(', ')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {language === 'ta' ? 'கடைசி சரிபார்ப்பு:' : 'Last Verified:'}
              </span>
              <span>
                {new Date(scheme.last_verified_date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onSetReminder(scheme)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Bell className="w-3.5 h-3.5 text-amber-500" />
            <span>{language === 'ta' ? 'நினைவூட்டல் அமை' : 'Set Deadline Reminder'}</span>
          </button>

          <a
            href={scheme.official_portal_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs"
          >
            <span>{language === 'ta' ? 'அதிகாரப்பூர்வ தளத்தில் விண்ணப்பிக்க' : 'Apply on Official Portal'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};