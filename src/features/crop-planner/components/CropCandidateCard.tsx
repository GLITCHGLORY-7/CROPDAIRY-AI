import React, { useState } from 'react';
import { CandidateCropResult } from '@/types/crop';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { SuitabilityBreakdown } from './SuitabilityBreakdown';
import { Clock, Droplet, Check, Info, Sparkles, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CropCandidateCardProps {
  candidate: CandidateCropResult;
  isSelected: boolean;
  isCompared: boolean;
  onSelect: (candidate: CandidateCropResult) => void;
  onToggleCompare: (candidate: CandidateCropResult) => void;
  disableCompareSelect?: boolean;
}

export const CropCandidateCard: React.FC<CropCandidateCardProps> = ({
  candidate,
  isSelected,
  isCompared,
  onSelect,
  onToggleCompare,
  disableCompareSelect = false,
}) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { crop, scoring, economics_for_plot } = candidate;

  const score = scoring.total_score;
  const scoreVariant = score >= 80 ? 'success' : score >= 60 ? 'warning' : 'neutral';

  return (
    <>
      <Card
        className={cn(
          'flex flex-col justify-between transition-all hover:border-slate-300 shadow-xs relative',
          isSelected && 'ring-2 ring-agri-600 border-agri-600 bg-agri-50/20'
        )}
      >
        {/* Top Badges */}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400">
                  #{candidate.rank} Recommended
                </span>
                <Badge variant={scoreVariant}>
                  {score}/100 Match
                </Badge>
              </div>

              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                {crop.name}
              </CardTitle>
              <div className="text-xs text-slate-500 font-mono italic">
                {crop.scientific_name}
              </div>
              <div className="text-xs font-semibold text-agri-800 mt-0.5">
                {crop.local_names.ta} • {crop.local_names.hi}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDetailOpen(true)}
              aria-label={`View suitability details for ${crop.name}`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-agri-700 hover:bg-slate-100 transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 py-2 text-xs text-left">
          {/* Key Agronomic Attributes Strip */}
          <div className="grid grid-cols-2 gap-2 text-slate-600">
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50">
              <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <span>{crop.duration_days_min}–{crop.duration_days_max} Days</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50">
              <Droplet className="w-3.5 h-3.5 text-sky-500" aria-hidden="true" />
              <span>{crop.water_requirement_mm} mm</span>
            </div>
          </div>

          {/* Plot Specific Economics Preview */}
          <div className="p-2.5 rounded-xl bg-earth-50/80 border border-earth-200/60 space-y-1">
            <div className="flex items-center justify-between text-slate-600">
              <span>Est. Plot Investment ({economics_for_plot.plot_acres} ac):</span>
              <span className="font-extrabold text-slate-900">
                ₹{economics_for_plot.cost_breakdown.total.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Expected Harvest:</span>
              <span className="font-semibold text-slate-700">
                {economics_for_plot.projected_yield.min}–{economics_for_plot.projected_yield.max} {crop.expected_yield_per_acre.unit}
              </span>
            </div>
          </div>

          {/* Quick favorable factor */}
          {scoring.favorable_reasons.length > 0 && (
            <p className="text-[11px] text-emerald-800 line-clamp-2">
              ✓ {scoring.favorable_reasons[0]}
            </p>
          )}
        </CardContent>

        <CardFooter className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Compare toggle */}
          <button
            type="button"
            onClick={() => onToggleCompare(candidate)}
            disabled={!isCompared && disableCompareSelect}
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors min-h-[36px]',
              isCompared
                ? 'bg-sky-50 border-sky-300 text-sky-800'
                : 'border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed'
            )}
            aria-pressed={isCompared}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>{isCompared ? 'Comparing' : 'Compare'}</span>
          </button>

          {/* Select Button */}
          <Button
            type="button"
            variant={isSelected ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onSelect(candidate)}
            className="flex-1 text-xs gap-1.5"
          >
            {isSelected ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Selected Crop
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-agri-600" />
                Select Crop
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Suitability Explanation Dialog */}
      <Dialog
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`${crop.name} — Agronomic Analysis`}
        description={crop.scientific_name}
        maxWidth="lg"
      >
        <SuitabilityBreakdown crop={crop} scoring={scoring} />
      </Dialog>
    </>
  );
};
