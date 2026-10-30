import React from 'react';
import { CandidateScoreBreakdown, CropTemplate } from '@/types/crop';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, AlertTriangle, HelpCircle, ShieldCheck, Database } from 'lucide-react';

export interface SuitabilityBreakdownProps {
  crop: CropTemplate;
  scoring: CandidateScoreBreakdown;
}

export const SuitabilityBreakdown: React.FC<SuitabilityBreakdownProps> = ({ crop, scoring }) => {
  const confidenceBadgeVariant = {
    'High Confidence': 'success',
    'Moderate Confidence': 'warning',
    'Low Confidence': 'neutral',
    'Insufficient Data': 'neutral',
  }[scoring.confidence] as 'success' | 'warning' | 'neutral';

  return (
    <div className="space-y-4 text-left text-xs sm:text-sm">
      {/* Overall Score & Confidence Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-extrabold text-agri-700">
              {scoring.total_score} / 100
            </span>
            <Badge variant={confidenceBadgeVariant}>{scoring.confidence}</Badge>
          </div>
          <span className="text-xs text-slate-500 block mt-0.5">
            Transparent Agronomic Compatibility Index
          </span>
        </div>

        <div className="text-xs text-slate-500 sm:text-right">
          <div>Verified Source: <strong className="text-slate-800">{crop.data_source}</strong></div>
          <div>Last Verified: {crop.last_verified}</div>
        </div>
      </div>

      {/* Criteria Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
        <div className="p-2.5 rounded-lg bg-white border border-slate-200">
          <span className="text-[11px] text-slate-400 uppercase tracking-tight block">Soil</span>
          <span className="font-extrabold text-slate-800 text-sm">{scoring.soil_score} / 25</span>
        </div>
        <div className="p-2.5 rounded-lg bg-white border border-slate-200">
          <span className="text-[11px] text-slate-400 uppercase tracking-tight block">Season</span>
          <span className="font-extrabold text-slate-800 text-sm">{scoring.season_score} / 25</span>
        </div>
        <div className="p-2.5 rounded-lg bg-white border border-slate-200">
          <span className="text-[11px] text-slate-400 uppercase tracking-tight block">Water</span>
          <span className="font-extrabold text-slate-800 text-sm">{scoring.water_score} / 25</span>
        </div>
        <div className="p-2.5 rounded-lg bg-white border border-slate-200">
          <span className="text-[11px] text-slate-400 uppercase tracking-tight block">Budget</span>
          <span className="font-extrabold text-slate-800 text-sm">{scoring.budget_score} / 15</span>
        </div>
        <div className="p-2.5 rounded-lg bg-white border border-slate-200 col-span-2 sm:col-span-1">
          <span className="text-[11px] text-slate-400 uppercase tracking-tight block">Risk & Cat</span>
          <span className="font-extrabold text-slate-800 text-sm">{scoring.risk_score} / 10</span>
        </div>
      </div>

      {/* Favorable Reasons */}
      {scoring.favorable_reasons.length > 0 && (
        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
          <div className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Agronomic Match Factors:
          </div>
          <ul className="space-y-1 text-xs text-emerald-800 pl-5 list-disc">
            {scoring.favorable_reasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Identified Limiting Factors */}
      {scoring.limiting_factors && scoring.limiting_factors.length > 0 && (
        <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 space-y-1.5">
          <div className="font-bold text-rose-900 flex items-center gap-1.5 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            Identified Limiting Factors (Constraints Restricting Peak Yield):
          </div>
          <ul className="space-y-1 text-xs text-rose-800 pl-5 list-disc">
            {scoring.limiting_factors.map((factor, idx) => (
              <li key={idx}>{factor}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Cautions & Risks */}
      {scoring.cautions_and_risks.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
          <div className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Cultivation Cautions & Environmental Risks:
          </div>
          <ul className="space-y-1 text-xs text-amber-800 pl-5 list-disc">
            {scoring.cautions_and_risks.map((caution, idx) => (
              <li key={idx}>{caution}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing Information / Data Gaps */}
      {scoring.missing_data_warnings.length > 0 && (
        <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Missing Information: </strong>
            {scoring.missing_data_warnings.join(' ')}
          </div>
        </div>
      )}

      {/* Data Source & Scientific Citation Badge */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <Database className="w-3.5 h-3.5 text-slate-400" />
          ICAR / State Agricultural Universities Reference Data
        </span>
        <span className="flex items-center gap-1 text-agri-700 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          Verified Agricultural Science
        </span>
      </div>
    </div>
  );
};
