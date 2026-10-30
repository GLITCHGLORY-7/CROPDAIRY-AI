import React from 'react';
import { CandidateCropResult } from '@/types/crop';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { X, Scale, Check, ShieldCheck } from 'lucide-react';

export interface CropComparisonTableProps {
  candidates: CandidateCropResult[];
  selectedCropId?: string;
  onSelect: (candidate: CandidateCropResult) => void;
  onRemoveFromCompare: (candidate: CandidateCropResult) => void;
}

export const CropComparisonTable: React.FC<CropComparisonTableProps> = ({
  candidates,
  selectedCropId,
  onSelect,
  onRemoveFromCompare,
}) => {
  if (candidates.length === 0) return null;

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden text-left">
      <CardHeader className="bg-slate-50/70 border-b border-slate-200/80 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
                Side-by-Side Crop Comparison ({candidates.length} Selected)
              </CardTitle>
              <p className="text-xs text-slate-500">
                Compare agronomic requirements, plot input investment, duration, and cultivation risks.
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/40 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <th className="p-4 w-44">Parameter</th>
              {candidates.map((c) => (
                <th key={c.crop.id} className="p-4 relative">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-slate-900 normal-case">
                        {c.crop.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono italic normal-case">
                        {c.crop.scientific_name}
                      </div>
                      <div className="text-xs font-semibold text-agri-700 normal-case mt-0.5">
                        {c.crop.local_names.ta}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveFromCompare(c)}
                      aria-label={`Remove ${c.crop.name} from comparison`}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {/* Match Score & Rank */}
            <tr className="bg-slate-50/20">
              <td className="p-3.5 font-bold text-slate-700">Suitability Index</td>
              {candidates.map((c) => (
                <td key={c.crop.id} className="p-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-agri-700">
                      {c.scoring.total_score} / 100
                    </span>
                    <Badge variant={c.scoring.total_score >= 80 ? 'success' : 'warning'}>
                      Rank #{c.rank}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {c.scoring.confidence}
                  </span>
                </td>
              ))}
            </tr>

            {/* Estimated Plot Investment */}
            <tr>
              <td className="p-3.5 font-bold text-slate-700">
                Est. Investment ({candidates[0]?.economics_for_plot.plot_acres} ac)
              </td>
              {candidates.map((c) => (
                <td key={c.crop.id} className="p-3.5">
                  <span className="text-sm font-extrabold text-slate-900 block">
                    ₹{c.economics_for_plot.cost_breakdown.total.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    (~₹{c.crop.typical_cost_per_acre.total.toLocaleString()} / acre)
                  </span>
                </td>
              ))}
            </tr>

            {/* Expected Yield */}
            <tr>
              <td className="p-3.5 font-bold text-slate-700">Projected Yield</td>
              {candidates.map((c) => (
                <td key={c.crop.id} className="p-3.5 font-semibold text-slate-800">
                  {c.economics_for_plot.projected_yield.min}–{c.economics_for_plot.projected_yield.max}{' '}
                  {c.crop.expected_yield_per_acre.unit}
                </td>
              ))}
            </tr>

            {/* Crop Duration */}
            <tr>
              <td className="p-3.5 font-bold text-slate-700">Growth Duration</td>
              {candidates.map((c) => (
                <td key={c.crop.id} className="p-3.5 text-slate-700">
                  {c.crop.duration_days_min} – {c.crop.duration_days_max} Days
                </td>
              ))}
            </tr>

            {/* Water Requirements */}
            <tr>
              <td className="p-3.5 font-bold text-slate-700">Water Demand</td>
              {candidates.map((c) => (
                <td key={c.crop.id} className="p-3.5 text-slate-700">
                  <span className="font-semibold">{c.crop.water_requirement_mm} mm</span>
                  <span className="text-[11px] text-slate-500 block">{c.crop.water_category}</span>
                </td>
              ))}
            </tr>

            {/* Suitable Soils */}
            <tr>
              <td className="p-3.5 font-bold text-slate-700">Suitable Soils</td>
              {candidates.map((c) => (
                <td key={c.crop.id} className="p-3.5 text-slate-700">
                  {c.crop.suitable_soils.join(', ')}
                </td>
              ))}
            </tr>

            {/* Primary Favorable Match */}
            <tr className="bg-emerald-50/20">
              <td className="p-3.5 font-bold text-emerald-950">Primary Advantage</td>
              {candidates.map((c) => (
                <td key={c.crop.id} className="p-3.5 text-emerald-900 font-medium">
                  {c.scoring.favorable_reasons[0] || 'Meets baseline requirements'}
                </td>
              ))}
            </tr>

            {/* Known Risks */}
            <tr className="bg-amber-50/20">
              <td className="p-3.5 font-bold text-amber-950">Main Risks & Constraints</td>
              {candidates.map((c) => (
                <td key={c.crop.id} className="p-3.5 text-amber-900">
                  {c.crop.risks[0] || 'Standard weather sensitivity'}
                </td>
              ))}
            </tr>

            {/* Research Data Source */}
            <tr>
              <td className="p-3.5 font-bold text-slate-700">Scientific Reference</td>
              {candidates.map((c) => (
                <td key={c.crop.id} className="p-3.5 text-slate-500 text-[11px]">
                  <div className="flex items-center gap-1 text-agri-700 font-medium mb-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified ICAR / SAU
                  </div>
                  {c.crop.data_source} (Verified: {c.crop.last_verified})
                </td>
              ))}
            </tr>

            {/* Selection Action Row */}
            <tr className="bg-slate-50/50">
              <td className="p-3.5 font-bold text-slate-700">Decision</td>
              {candidates.map((c) => (
                <td key={c.crop.id} className="p-3.5">
                  <Button
                    type="button"
                    variant={selectedCropId === c.crop.id ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => onSelect(c)}
                    className="w-full text-xs gap-1.5"
                  >
                    {selectedCropId === c.crop.id ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Selected for Plan
                      </>
                    ) : (
                      'Choose This Crop'
                    )}
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};
