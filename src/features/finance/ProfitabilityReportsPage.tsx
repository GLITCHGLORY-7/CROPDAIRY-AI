// CropDiary AI — Profitability Reports & P&L Page
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  HelpCircle,
  Wheat,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { storageAdapter } from '@/services/storageAdapter';
import { financeService } from './services/financeService';
import { Farm, Plot } from '@/types/database';
import { CropPlan } from '@/types/crop';
import { ProfitabilityReport } from '@/types/finance';

export const ProfitabilityReportsPage: React.FC = () => {
  const { user } = useAuth();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [cropPlans, setCropPlans] = useState<CropPlan[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState('all');
  const [selectedPlotId, setSelectedPlotId] = useState('all');
  const [selectedCropPlanId, setSelectedCropPlanId] = useState('all');

  const [report, setReport] = useState<ProfitabilityReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const userFarms = await storageAdapter.getFarms(user.id);
      setFarms(userFarms);

      let allPlots: Plot[] = [];
      for (const f of userFarms) {
        const pList = await storageAdapter.getPlots(f.id);
        allPlots = [...allPlots, ...pList];
      }
      setPlots(allPlots);

      const plans = await storageAdapter.getCropPlans(user.id);
      setCropPlans(plans);

      const planObj = plans.find((p) => p.id === selectedCropPlanId);

      const rep = await financeService.getProfitabilityReport(user.id, {
        farmId: selectedFarmId !== 'all' ? selectedFarmId : undefined,
        plotId: selectedPlotId !== 'all' ? selectedPlotId : undefined,
        cropPlanId: selectedCropPlanId !== 'all' ? selectedCropPlanId : undefined,
        cropName: planObj?.selected_crop_name,
        season: planObj?.season,
      });

      setReport(rep);
    } catch (err) {
      console.error('Error generating profitability report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, selectedFarmId, selectedPlotId, selectedCropPlanId]);

  const filteredPlots = selectedFarmId && selectedFarmId !== 'all'
    ? plots.filter((p) => p.farm_id === selectedFarmId)
    : plots;

  const filteredPlans = selectedFarmId && selectedFarmId !== 'all'
    ? cropPlans.filter((p) => p.farm_id === selectedFarmId)
    : cropPlans;

  const isProfitable = report && report.netProfit >= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link
            to="/app/finance"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Finance Overview</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Farm Profit & Loss Statement
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent breakdown of gross sales, cultivation inputs, selling costs, and net margin unit economics
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors min-h-[44px]"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor="pnl-farm" className="block text-xs font-semibold text-slate-600 mb-1">
            Scope: Farm
          </label>
          <select
            id="pnl-farm"
            value={selectedFarmId}
            onChange={(e) => {
              setSelectedFarmId(e.target.value);
              setSelectedPlotId('all');
              setSelectedCropPlanId('all');
            }}
            className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800"
          >
            <option value="all">Consolidated (All Farms)</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="pnl-plot" className="block text-xs font-semibold text-slate-600 mb-1">
            Scope: Plot
          </label>
          <select
            id="pnl-plot"
            value={selectedPlotId}
            onChange={(e) => setSelectedPlotId(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800"
          >
            <option value="all">All Plots Combined</option>
            {filteredPlots.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.area} {p.area_unit})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="pnl-plan" className="block text-xs font-semibold text-slate-600 mb-1">
            Scope: Crop Plan
          </label>
          <select
            id="pnl-plan"
            value={selectedCropPlanId}
            onChange={(e) => setSelectedCropPlanId(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800"
          >
            <option value="all">All Crop Plans</option>
            {filteredPlans.map((cp) => (
              <option key={cp.id} value={cp.id}>
                {cp.selected_crop_name} ({cp.season})
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
      ) : report && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main P&L Statement (2 cols) */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Profit & Loss Breakdown
                </h2>
                <span className="text-xs text-slate-500">
                  Currency: INR (₹) • Accounting Method: Cash Basis
                </span>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  isProfitable
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {isProfitable ? 'Net Profit' : 'Operating Deficit'}
              </span>
            </div>

            {/* Income Section */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                1. Operational Revenues (+)
              </span>

              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-700">
                  <span>Gross Crop Produce Sales:</span>
                  <span className="font-semibold text-slate-900 text-sm">
                    ₹{report.cropSalesRevenue.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-700">
                  <span>Government Subsidies & Agricultural Grants:</span>
                  <span className="font-semibold text-slate-900 text-sm">
                    ₹{report.otherAgriculturalIncome.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold text-sm text-emerald-800">
                  <span>Total Farm Revenue:</span>
                  <span className="text-base">
                    ₹{report.totalRevenue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Expenses Section */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                2. Operational Expenditures (-)
              </span>

              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-700">
                  <span>Direct Cultivation (Seeds, Fertilizer, Labor, Power, Fuel):</span>
                  <span className="font-semibold text-slate-900 text-sm">
                    ₹{report.cultivationExpenses.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-700">
                  <span>Selling Costs (Freight, Mandi Cess, Packaging):</span>
                  <span className="font-semibold text-slate-900 text-sm">
                    ₹{report.sellingExpenses.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold text-sm text-rose-800">
                  <span>Total Recorded Outflows:</span>
                  <span className="text-base">
                    -₹{report.totalExpenses.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Net Margin Line */}
            <div
              className={`p-5 rounded-2xl border flex items-center justify-between ${
                isProfitable
                  ? 'bg-emerald-50/80 border-emerald-200'
                  : 'bg-amber-50/80 border-amber-200'
              }`}
            >
              <div>
                <span className="text-xs font-semibold text-slate-600 block">
                  Net Realized Result
                </span>
                <span className="text-2xl font-extrabold text-slate-900">
                  {report.netProfit >= 0 ? '+' : ''}₹{report.netProfit.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-600 block">
                  Profit Margin
                </span>
                <span
                  className={`text-xl font-extrabold ${
                    isProfitable ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {report.profitMarginPercent}%
                </span>
              </div>
            </div>

            {/* Disclaimers & Traceability */}
            <div className="space-y-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                Accounting Disclosures:
              </span>
              <ul className="list-disc pl-5 space-y-1">
                {report.disclaimers.map((disc, idx) => (
                  <li key={idx}>{disc}</li>
                ))}
                <li>
                  Overhead costs logged without a plot assignment are evaluated as whole-farm operational expenditures.
                </li>
              </ul>
            </div>
          </div>

          {/* Unit Economics Side Card (1 col) */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Wheat className="w-5 h-5 text-agri-700" />
                <h3 className="text-base font-bold text-slate-900">
                  Unit Economics (per kg)
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 flex items-center justify-between">
                  <span className="text-slate-600">Total Harvest Yield:</span>
                  <span className="font-bold text-slate-900">
                    {report.totalHarvestKg.toLocaleString('en-IN')} kg
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 flex items-center justify-between">
                  <span className="text-slate-600">Total Produce Sold:</span>
                  <span className="font-bold text-slate-900">
                    {report.totalSoldKg.toLocaleString('en-IN')} kg
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 flex items-center justify-between">
                  <span className="text-slate-600">Unsold Balance:</span>
                  <span className="font-bold text-emerald-700">
                    {report.unsoldKg.toLocaleString('en-IN')} kg
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 flex items-center justify-between">
                  <span className="text-slate-600">Production Cost / kg:</span>
                  <span className="font-bold text-slate-900">
                    {report.costPerKg !== null ? `₹${report.costPerKg}/kg` : 'N/A'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 flex items-center justify-between">
                  <span className="text-slate-600">Realized Price / kg:</span>
                  <span className="font-bold text-slate-900">
                    {report.revenuePerKg !== null ? `₹${report.revenuePerKg}/kg` : 'N/A'}
                  </span>
                </div>

                {report.netMarginPerKg !== null && (
                  <div
                    className={`p-3 rounded-xl font-bold flex items-center justify-between ${
                      report.netMarginPerKg >= 0
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'bg-rose-50 text-rose-800'
                    }`}
                  >
                    <span>Net Margin / kg:</span>
                    <span>
                      {report.netMarginPerKg >= 0 ? '+' : ''}₹{report.netMarginPerKg}/kg
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-3xl p-5 text-xs text-emerald-900 space-y-2">
              <span className="font-bold block">Area-Based Allocation Rule:</span>
              <p className="leading-relaxed text-emerald-800">
                When a shared tractor or farm-wide irrigation bill is recorded without specifying a single plot, CropDiary AI divides the overhead proportionally based on each plot&apos;s registered acreage.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
