// CropDiary AI — Expense Category Breakdown Component
import React from 'react';
import { PieChart, DollarSign } from 'lucide-react';

interface ExpenseCategoryChartProps {
  expensesByCategory: Record<string, number>;
  totalExpenses: number;
  currency?: string;
  className?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  seeds: 'bg-emerald-500',
  fertilizer: 'bg-teal-500',
  pesticide: 'bg-amber-500',
  labor: 'bg-indigo-500',
  machinery: 'bg-blue-500',
  fuel: 'bg-orange-500',
  irrigation_electricity: 'bg-cyan-500',
  transport: 'bg-purple-500',
  packaging: 'bg-pink-500',
  lease_rent: 'bg-rose-500',
  other: 'bg-slate-400',
};

const CATEGORY_LABELS: Record<string, string> = {
  seeds: 'Seeds & Seedlings',
  fertilizer: 'Fertilizers & Nutrients',
  pesticide: 'Pest & Disease Control',
  labor: 'Field Labor',
  machinery: 'Tractor & Machinery',
  fuel: 'Fuel & Diesel',
  irrigation_electricity: 'Irrigation & Electricity',
  transport: 'Transport & Freight',
  packaging: 'Packaging & Sacks',
  lease_rent: 'Land Lease & Rent',
  other: 'Other Farm Costs',
};

export const ExpenseCategoryChart: React.FC<ExpenseCategoryChartProps> = ({
  expensesByCategory,
  totalExpenses,
  currency = '₹',
  className = '',
}) => {
  const categories = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]);

  if (categories.length === 0 || totalExpenses <= 0) {
    return (
      <div className={`bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-slate-400" />
          <h3 className="text-base font-semibold text-slate-900">Expenses by Category</h3>
        </div>
        <div className="py-8 text-center text-slate-500 text-sm">
          <DollarSign className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p>No categorized expenses recorded for this period.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PieChart className="w-5 h-5 text-agri-700" />
          <h3 className="text-base font-semibold text-slate-900">Expenses by Category</h3>
        </div>
        <span className="text-xs font-semibold text-slate-500">
          Total: {currency}{totalExpenses.toLocaleString('en-IN')}
        </span>
      </div>

      {/* Stacked Progress Bar */}
      <div className="h-4 w-full bg-slate-100 rounded-full flex overflow-hidden mb-6">
        {categories.map(([cat, amount]) => {
          const pct = (amount / totalExpenses) * 100;
          const colorClass = CATEGORY_COLORS[cat] || 'bg-slate-400';
          return (
            <div
              key={cat}
              style={{ width: `${pct}%` }}
              className={`${colorClass} transition-all hover:opacity-90`}
              title={`${CATEGORY_LABELS[cat] || cat}: ${currency}${amount.toLocaleString('en-IN')} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* Category List */}
      <div className="space-y-3">
        {categories.map(([cat, amount]) => {
          const pct = (amount / totalExpenses) * 100;
          const colorClass = CATEGORY_COLORS[cat] || 'bg-slate-400';
          const label = CATEGORY_LABELS[cat] || cat.replace(/_/g, ' ');

          return (
            <div key={cat} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-3 h-3 rounded-full flex-shrink-0 ${colorClass}`} />
                <span className="text-slate-700 font-medium truncate">{label}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 text-right">
                <span className="font-semibold text-slate-900">
                  {currency}{amount.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-400 w-12 text-right">
                  {pct.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
