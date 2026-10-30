import React, { useState } from 'react';
import { CandidateCropResult } from '@/types/crop';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { IndianRupee, TrendingUp, Info } from 'lucide-react';

export interface EstimateCalculatorProps {
  candidate: CandidateCropResult;
  onEconomicsUpdate?: (updatedEconomics: CandidateCropResult['economics_for_plot']) => void;
}

export const EstimateCalculator: React.FC<EstimateCalculatorProps> = ({ candidate }) => {
  const { crop, economics_for_plot } = candidate;
  const cost = economics_for_plot.cost_breakdown;

  // Selling price state initialized to modal market price benchmark
  const [customPrice, setCustomPrice] = useState<number>(
    crop.typical_selling_price_per_unit.modal
  );

  const plotAcres = economics_for_plot.plot_acres;
  const yieldMin = economics_for_plot.projected_yield.min;
  const yieldMax = economics_for_plot.projected_yield.max;
  const yieldAvg = Number(((yieldMin + yieldMax) / 2).toFixed(1));

  const grossRevenueEst = Math.round(yieldAvg * customPrice);
  const netProfitEst = grossRevenueEst - cost.total;
  const isProfitable = netProfitEst > 0;

  return (
    <Card className="border-slate-200 shadow-sm text-left">
      <CardHeader className="bg-slate-50/70 border-b border-slate-200/80 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-agri-700" />
              Cultivation Economics Calculator: {crop.name}
            </CardTitle>
            <p className="text-xs text-slate-500">
              Input investment and illustrative returns scaled for your {plotAcres} Acre plot.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 self-start sm:self-auto">
            {plotAcres} Acres
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-6">
        {/* Cost Breakdown Grid */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Estimated Cultivation Expenses Breakdown
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Seeds & Nursery</span>
              <span className="font-bold text-slate-800 text-sm">
                ₹{cost.seeds.toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Fertilizers & Manure</span>
              <span className="font-bold text-slate-800 text-sm">
                ₹{cost.fertilizers.toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Irrigation & Power</span>
              <span className="font-bold text-slate-800 text-sm">
                ₹{cost.irrigation.toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Hired Labor Wages</span>
              <span className="font-bold text-slate-800 text-sm">
                ₹{cost.labor.toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Crop Protection (IPM)</span>
              <span className="font-bold text-slate-800 text-sm">
                ₹{cost.protection.toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Machinery & Tillage</span>
              <span className="font-bold text-slate-800 text-sm">
                ₹{cost.machinery.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="mt-3 p-3.5 rounded-xl bg-earth-100 border border-earth-200 flex items-center justify-between">
            <span className="font-bold text-earth-900 text-sm">
              Total Estimated Plot Investment:
            </span>
            <span className="text-lg font-extrabold text-earth-950">
              ₹{cost.total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Illustrative Return Calculator */}
        <div className="pt-4 border-t border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Illustrative Revenue & Return Scenario
            </h4>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              Reference: {crop.typical_selling_price_per_unit.source}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <Input
                label={`Assumed Selling Price (₹ per ${crop.typical_selling_price_per_unit.unit})`}
                type="number"
                value={customPrice || ''}
                onChange={(e) => setCustomPrice(Number(e.target.value) || 0)}
                helperText={`Modal benchmark: ₹${crop.typical_selling_price_per_unit.modal} (Range: ₹${crop.typical_selling_price_per_unit.min} - ₹${crop.typical_selling_price_per_unit.max})`}
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-600">
                <span>Estimated Harvest (Avg):</span>
                <span className="font-bold text-slate-800">
                  {yieldAvg} {crop.expected_yield_per_acre.unit}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Gross Projected Revenue:</span>
                <span className="font-bold text-slate-800">
                  ₹{grossRevenueEst.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Net Profit Summary Card */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isProfitable
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-wider block">
                Illustrative Net Return (Profit / Loss)
              </span>
              <span className="text-2xl font-black mt-0.5 block">
                {isProfitable ? '+' : ''}₹{netProfitEst.toLocaleString()}
              </span>
              <span className="text-xs opacity-80 block">
                Gross Revenue (₹{grossRevenueEst.toLocaleString()}) − Total Cultivation Cost (₹{cost.total.toLocaleString()})
              </span>
            </div>

            <div className="text-xs sm:text-right">
              <span className="font-bold flex items-center sm:justify-end gap-1">
                <TrendingUp className="w-4 h-4" />
                Est. ROI: {cost.total > 0 ? Math.round((netProfitEst / cost.total) * 100) : 0}%
              </span>
              <span className="text-[11px] opacity-75">
                Across {crop.duration_days_min}–{crop.duration_days_max} day cycle
              </span>
            </div>
          </div>

          {/* Strict Agricultural Disclaimer */}
          <Alert variant="info" title="Agricultural Disclaimer & Assumptions">
            This calculation is an illustrative planning estimate based on published ICAR cultivation packages and historical wholesale APMC benchmarks. It does not represent guaranteed income, as actual outcomes vary with local rainfall, pest pressures, input prices, and harvest market fluctuations.
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};
