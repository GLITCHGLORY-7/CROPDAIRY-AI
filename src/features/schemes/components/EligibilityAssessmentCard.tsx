// CropDiary AI — Eligibility Assessment Card Component
import React from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Bell,
  ExternalLink,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { SchemeEligibilityAssessment, GovernmentScheme } from '@/types/schemes';
import { Language } from '@/types/assistant';

interface EligibilityAssessmentCardProps {
  assessment: SchemeEligibilityAssessment;
  scheme: GovernmentScheme;
  language: Language;
  onSetReminder: (scheme: GovernmentScheme) => void;
}

export const EligibilityAssessmentCard: React.FC<EligibilityAssessmentCardProps> = ({
  assessment,
  scheme,
  language,
  onSetReminder,
}) => {
  const isEligible = assessment.status === 'potentially_eligible';
  const isPartial = assessment.status === 'more_info_needed';

  const statusConfig = {
    potentially_eligible: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      badge: 'bg-emerald-600 text-white',
      text: language === 'ta' ? 'சாத்தியமான தகுதி உடையவர்' : 'Potentially Eligible',
      desc:
        language === 'ta'
          ? 'உங்கள் பதிவு செய்யப்பட்ட பண்ணை நிலப்பரப்பு, இருப்பிடம் மற்றும் பயிர்கள் இத்திட்டத்தின் முதன்மை அளவுகோல்களுடன் பொருந்துகின்றன.'
          : 'Your registered farm acreage, location, and crops align with the primary eligibility criteria of this scheme.',
    },
    more_info_needed: {
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      badge: 'bg-amber-600 text-white',
      text: language === 'ta' ? 'கூடுதல் விவரங்கள் தேவை' : 'Additional Information Needed',
      desc:
        language === 'ta'
          ? 'முழு தகுதியை மதிப்பிட மேலும் சில விவசாய விவரங்கள் (ஆதார் இணைப்பு, வங்கிக் கணக்கு நிலை) தேவைப்படுகிறது.'
          : 'Further verification required regarding your land title records, Aadhaar-bank seeding, or crop notification.',
    },
    criteria_not_met: {
      bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
      badge: 'bg-rose-600 text-white',
      text: language === 'ta' ? 'அளவுகோல்கள் பொருந்தவில்லை' : 'Criteria Not Met',
      desc:
        language === 'ta'
          ? 'உங்கள் பதிவு செய்யப்பட்ட பண்ணை அளவு அல்லது இடம் இத்திட்டத்தின் தேவைகளுடன் பொருந்தவில்லை.'
          : 'Your registered farm acreage or jurisdiction does not match the scheme parameters.',
    },
  }[assessment.status];

  return (
    <div className={`rounded-xl border p-5 shadow-xs transition-all ${statusConfig.bg}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {language === 'ta' ? 'தகுதி மதிப்பீடு அறிக்கை' : 'Eligibility Assessment'}
          </h4>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.badge}`}>
          {statusConfig.text}
        </span>
      </div>

      <p className="text-xs text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
        {statusConfig.desc}
      </p>

      {/* Matched Criteria */}
      {assessment.matchedCriteria.length > 0 && (
        <div className="mb-3 space-y-1.5">
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{language === 'ta' ? 'பொருந்திய தகுதிகள்:' : 'Matched Criteria:'}</span>
          </span>
          <ul className="space-y-1 pl-4">
            {assessment.matchedCriteria.map((c, i) => (
              <li key={i} className="text-xs text-slate-700 dark:text-slate-300 list-disc">
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Unmatched Criteria */}
      {assessment.unmatchedCriteria.length > 0 && (
        <div className="mb-3 space-y-1.5">
          <span className="text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>{language === 'ta' ? 'பொருந்தாத நிபந்தனைகள்:' : 'Unmatched Requirements:'}</span>
          </span>
          <ul className="space-y-1 pl-4">
            {assessment.unmatchedCriteria.map((c, i) => (
              <li key={i} className="text-xs text-slate-700 dark:text-slate-300 list-disc">
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pending Details */}
      {assessment.pendingDetails.length > 0 && (
        <div className="mb-4 space-y-1.5">
          <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{language === 'ta' ? 'சரிபார்க்க வேண்டியவை:' : 'Pending Verification:'}</span>
          </span>
          <ul className="space-y-1 pl-4">
            {assessment.pendingDetails.map((c, i) => (
              <li key={i} className="text-xs text-slate-700 dark:text-slate-300 list-disc">
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendation Box */}
      <div className="bg-white/80 dark:bg-slate-900/80 rounded-lg p-3 border border-slate-200 dark:border-slate-700 mb-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
              {language === 'ta' ? 'பரிந்துரைக்கப்பட்ட நடவடிக்கை:' : 'Recommended Action:'}
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
              {assessment.recommendation}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/80">
        <a
          href={scheme.official_portal_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs"
          aria-label={`Open official portal for ${scheme.name}`}
        >
          <span>{language === 'ta' ? 'அதிகாரப்பூர்வ இணையதளத்தில் விண்ணப்பிக்க' : 'Apply on Official Portal'}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {(isEligible || isPartial) && (
          <button
            type="button"
            onClick={() => onSetReminder(scheme)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            aria-label={`Set deadline reminder for ${scheme.name}`}
          >
            <Bell className="w-3.5 h-3.5 text-amber-500" />
            <span>{language === 'ta' ? 'விண்ணப்ப காலக்கெடு நினைவூட்டல்' : 'Set Deadline Reminder'}</span>
          </button>
        )}
      </div>
    </div>
  );
};