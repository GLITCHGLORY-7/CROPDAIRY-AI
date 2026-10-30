// CropDiary AI — Government Scheme Card Component
import React from 'react';
import {
  ExternalLink,
  CheckCircle2,
  Landmark,
  FileText,
  Percent,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { GovernmentScheme } from '@/types/schemes';
import { Language } from '@/types/assistant';

interface SchemeCardProps {
  scheme: GovernmentScheme;
  language: Language;
  onSelectScheme: (scheme: GovernmentScheme) => void;
  onCheckEligibility?: (scheme: GovernmentScheme) => void;
}

const CATEGORY_LABELS: Record<string, { en: string; ta: string; color: string }> = {
  income_support: { en: 'Income Support', ta: 'வருமான ஆதரவு', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  crop_insurance: { en: 'Crop Insurance', ta: 'பயிர் காப்பீடு', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  irrigation: { en: 'Micro Irrigation', ta: 'நுண் பாசனம்', color: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800' },
  equipment_mechanization: { en: 'Mechanization & Solar', ta: 'இயந்திரமயமாக்கல் & சோலார்', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  credit_finance: { en: 'Credit & Loans', ta: 'கடன் & நிதி', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
  soil_health: { en: 'Soil Health', ta: 'மண் வளம்', color: 'bg-lime-50 text-lime-700 dark:bg-lime-950/60 dark:text-lime-300 border-lime-200 dark:border-lime-800' },
  organic_farming: { en: 'Organic Farming', ta: 'இயற்கை விவசாயம்', color: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800' },
  horticulture: { en: 'Horticulture', ta: 'தோட்டக்கலை', color: 'bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-300 border-green-200 dark:border-green-800' },
  inputs_seeds: { en: 'Inputs & Seeds', ta: 'விதைகள் & உரங்கள்', color: 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
};

export const SchemeCard: React.FC<SchemeCardProps> = ({
  scheme,
  language,
  onSelectScheme,
  onCheckEligibility,
}) => {
  const cat = CATEGORY_LABELS[scheme.category] || {
    en: scheme.category,
    ta: scheme.category,
    color: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const schemeTitle = language === 'ta' && scheme.name_ta ? scheme.name_ta : scheme.name;
  const benefits = language === 'ta' && scheme.benefits_summary_ta ? scheme.benefits_summary_ta : scheme.benefits_summary;
  const description = language === 'ta' && scheme.description_ta ? scheme.description_ta : scheme.description;
  const department = language === 'ta' && scheme.department_ta ? scheme.department_ta : scheme.department;

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        {/* Badges Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                scheme.scope === 'central'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
              }`}
            >
              {scheme.scope === 'central'
                ? language === 'ta'
                  ? 'மத்திய அரசு திட்டம்'
                  : 'Central Scheme'
                : language === 'ta'
                ? 'தமிழ்நாடு மாநில திட்டம்'
                : 'Tamil Nadu State Scheme'}
            </span>

            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${cat.color}`}>
              {language === 'ta' ? cat.ta : cat.en}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{language === 'ta' ? 'சரிபார்க்கப்பட்டது' : 'Verified'}</span>
          </div>
        </div>

        {/* Scheme Title & Code */}
        <div className="mb-2">
          <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
            {scheme.code}
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5 leading-snug">
            {schemeTitle}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
            <Landmark className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{department}</span>
          </p>
        </div>

        {/* Benefits Highlight Box */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-lg p-3 my-3">
          <div className="flex items-start gap-2">
            <Percent className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200 block">
                {language === 'ta' ? 'மானியம் & நிதி பலன்:' : 'Subsidy / Direct Benefit:'}
              </span>
              <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300 mt-0.5">
                {scheme.subsidy_amount_or_percent}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 pl-6">
            {benefits}
          </p>
        </div>

        {/* Short Description */}
        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
          {description}
        </p>

        {/* Required Documents Count */}
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {scheme.required_documents.length}{' '}
              {language === 'ta' ? 'தேவையான ஆவணங்கள்' : 'Required Docs'}
            </span>
          </span>
          <span className="flex items-center gap-1 font-mono text-[11px]">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>
              {language === 'ta' ? 'சரிபார்ப்பு' : 'Verified'}:{' '}
              {new Date(scheme.last_verified_date).toLocaleDateString('en-IN', {
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </span>
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-2">
        <a
          href={scheme.official_portal_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          aria-label={`${scheme.name} official government application portal`}
        >
          <span>{language === 'ta' ? 'அதிகாரப்பூர்வ தளம்' : 'Official Portal'}</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        <div className="flex items-center gap-2">
          {onCheckEligibility && (
            <button
              type="button"
              onClick={() => onCheckEligibility(scheme)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 dark:text-emerald-400 transition-colors"
              aria-label={`Check eligibility for ${scheme.name}`}
            >
              {language === 'ta' ? 'தகுதி காண்க' : 'Check Eligibility'}
            </button>
          )}

          <button
            type="button"
            onClick={() => onSelectScheme(scheme)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs"
            aria-label={`View full details for ${scheme.name}`}
          >
            <span>{language === 'ta' ? 'முழு விவரம்' : 'Details'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};