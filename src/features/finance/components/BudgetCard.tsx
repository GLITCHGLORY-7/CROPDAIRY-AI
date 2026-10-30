// CropDiary AI — Farm Budget Card Component
import React from 'react';
import {
  Edit2,
  Trash2,
  Calendar,
} from 'lucide-react';
import { BudgetComparison } from '@/types/finance';

interface BudgetCardProps {
  comparison: BudgetComparison;
  onEdit: () => void;
  onDelete: () => void;
  currency?: string;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  comparison,
  onEdit,
  onDelete,
  currency = '₹',
}) => {
  const { budget, plannedAmount, actualSpent, remainingBudget, percentUsed, status } =
    comparison;

  const isOverBudget = status === 'over_budget';
  const isWarning = status === 'warning';

  let progressColor = 'bg-emerald-500';
  let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let statusText = 'On Track';

  if (isOverBudget) {
    progressColor = 'bg-rose-500';
    badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
    statusText = 'Over Budget';
  } else if (isWarning) {
    progressColor = 'bg-amber-500';
    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
    statusText = 'Near Limit';
  }

  const categoryLabel =
    budget.category === 'all'
      ? 'All Farm Expenses'
      : budget.category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 truncate">
              {budget.name}
            </h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}
            >
              {statusText}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Category: <strong className="text-slate-700">{categoryLabel}</strong>
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit budget ${budget.name}`}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete budget ${budget.name}`}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="my-3">
        <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1.5">
          <span>Spent: {currency}{actualSpent.toLocaleString('en-IN')}</span>
          <span className="font-bold text-slate-900">{percentUsed}% used</span>
        </div>
        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            style={{ width: `${Math.min(100, percentUsed)}%` }}
            className={`h-full ${progressColor} transition-all duration-300`}
          />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
        <div>
          <span className="text-slate-400 block">Allocated Budget</span>
          <span className="text-sm font-bold text-slate-900">
            {currency}{plannedAmount.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="text-right">
          <span className="text-slate-400 block">
            {isOverBudget ? 'Exceeded By' : 'Remaining Balance'}
          </span>
          <span
            className={`text-sm font-bold ${
              isOverBudget ? 'text-rose-600' : 'text-emerald-700'
            }`}
          >
            {currency}{Math.abs(remainingBudget).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Period & Threshold Footer */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            {budget.period_start} to {budget.period_end}
          </span>
        </div>
        <span>Alert threshold: {budget.alert_threshold_percent}%</span>
      </div>
    </div>
  );
};
