// CropDiary AI — Finance Filter Toolbar Component
import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { Farm, Plot } from '@/types/database';
import { CropPlan } from '@/types/crop';
import { expenseCategories } from '@/lib/validation/financeSchemas';

interface FinanceFilterToolbarProps {
  farms: Farm[];
  plots: Plot[];
  cropPlans: CropPlan[];
  selectedFarmId: string;
  selectedPlotId: string;
  selectedCropPlanId: string;
  selectedType: string;
  selectedCategory: string;
  startDate: string;
  endDate: string;
  onFarmChange: (farmId: string) => void;
  onPlotChange: (plotId: string) => void;
  onCropPlanChange: (planId: string) => void;
  onTypeChange: (type: string) => void;
  onCategoryChange: (category: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onResetFilters: () => void;
}

export const FinanceFilterToolbar: React.FC<FinanceFilterToolbarProps> = ({
  farms,
  plots,
  cropPlans,
  selectedFarmId,
  selectedPlotId,
  selectedCropPlanId,
  selectedType,
  selectedCategory,
  startDate,
  endDate,
  onFarmChange,
  onPlotChange,
  onCropPlanChange,
  onTypeChange,
  onCategoryChange,
  onStartDateChange,
  onEndDateChange,
  onResetFilters,
}) => {
  const filteredPlots = selectedFarmId && selectedFarmId !== 'all'
    ? plots.filter((p) => p.farm_id === selectedFarmId)
    : plots;

  const filteredPlans = selectedFarmId && selectedFarmId !== 'all'
    ? cropPlans.filter((cp) => cp.farm_id === selectedFarmId)
    : cropPlans;

  const hasActiveFilters =
    selectedFarmId !== 'all' ||
    selectedPlotId !== 'all' ||
    selectedCropPlanId !== 'all' ||
    selectedType !== 'all' ||
    selectedCategory !== 'all' ||
    Boolean(startDate) ||
    Boolean(endDate);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs mb-6">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Filter className="w-4 h-4 text-agri-700" />
          <span>Filter Financial Records</span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 hover:underline transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset filters</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Farm Select */}
        <div>
          <label htmlFor="finance-farm-filter" className="block text-xs font-medium text-slate-600 mb-1">
            Farm
          </label>
          <select
            id="finance-farm-filter"
            value={selectedFarmId}
            onChange={(e) => onFarmChange(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
          >
            <option value="all">All Farms</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Plot Select */}
        <div>
          <label htmlFor="finance-plot-filter" className="block text-xs font-medium text-slate-600 mb-1">
            Plot
          </label>
          <select
            id="finance-plot-filter"
            value={selectedPlotId}
            onChange={(e) => onPlotChange(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
          >
            <option value="all">All Plots</option>
            {filteredPlots.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.area} {p.area_unit})
              </option>
            ))}
          </select>
        </div>

        {/* Crop Plan Select */}
        <div>
          <label htmlFor="finance-plan-filter" className="block text-xs font-medium text-slate-600 mb-1">
            Crop Plan
          </label>
          <select
            id="finance-plan-filter"
            value={selectedCropPlanId}
            onChange={(e) => onCropPlanChange(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
          >
            <option value="all">All Plans</option>
            {filteredPlans.map((cp) => (
              <option key={cp.id} value={cp.id}>
                {cp.selected_crop_name} ({cp.season})
              </option>
            ))}
          </select>
        </div>

        {/* Type Select */}
        <div>
          <label htmlFor="finance-type-filter" className="block text-xs font-medium text-slate-600 mb-1">
            Type
          </label>
          <select
            id="finance-type-filter"
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
          >
            <option value="all">All Types</option>
            <option value="expense">Expenses Only</option>
            <option value="sale_revenue">Sales Revenue</option>
            <option value="other_income">Subsidies & Grants</option>
            <option value="refund_adjustment">Refunds</option>
          </select>
        </div>

        {/* Category Select */}
        <div>
          <label htmlFor="finance-cat-filter" className="block text-xs font-medium text-slate-600 mb-1">
            Category
          </label>
          <select
            id="finance-cat-filter"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
          >
            <option value="all">All Categories</option>
            {expenseCategories.map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label htmlFor="finance-start-date" className="block text-xs font-medium text-slate-600 mb-1">
            From Date
          </label>
          <div className="relative">
            <input
              id="finance-start-date"
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-2 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
            />
          </div>
        </div>

        {/* End Date */}
        <div>
          <label htmlFor="finance-end-date" className="block text-xs font-medium text-slate-600 mb-1">
            To Date
          </label>
          <div className="relative">
            <input
              id="finance-end-date"
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-2 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
