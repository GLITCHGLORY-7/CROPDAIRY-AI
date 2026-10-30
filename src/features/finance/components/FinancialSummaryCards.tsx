// CropDiary AI — Financial Summary KPI Cards Component
import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Receipt,
  Scale,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { FinanceSummary } from '@/types/finance';

interface FinancialSummaryCardsProps {
  summary: FinanceSummary;
  currency?: string;
  className?: string;
}

export const FinancialSummaryCards: React.FC<FinancialSummaryCardsProps> = ({
  summary,
  currency = '₹',
  className = '',
}) => {
  const isProfitable = summary.netProfitOrLoss >= 0;

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {/* 1. Total Revenue Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Revenue
          </span>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-900">
            {currency}
            {summary.totalRevenue.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>{summary.salesCount} crop sales recorded</span>
          {summary.otherIncome > 0 && (
            <span className="text-emerald-700 font-medium">
              +{currency}{summary.otherIncome.toLocaleString('en-IN')} grants
            </span>
          )}
        </div>
      </div>

      {/* 2. Total Recorded Expenses */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Expenses
          </span>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-900">
            {currency}
            {summary.totalExpenses.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>{summary.transactionCount} transactions</span>
          {summary.sellingExpenses > 0 && (
            <span className="text-amber-700 font-medium">
              {currency}{summary.sellingExpenses.toLocaleString('en-IN')} selling
            </span>
          )}
        </div>
      </div>

      {/* 3. Net Recorded Result (P&L) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Net Result (P&L)
          </span>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isProfitable ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}
          >
            {isProfitable ? (
              <Scale className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )}
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className={`text-2xl font-bold ${
              isProfitable ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {summary.netProfitOrLoss >= 0 ? '+' : ''}
            {currency}
            {summary.netProfitOrLoss.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          {summary.totalRevenue === 0 && summary.totalExpenses > 0 ? (
            <span className="text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Cultivation in progress
            </span>
          ) : (
            <span>
              {isProfitable
                ? 'Operating with positive net margin'
                : 'Deficit pending produce sales'}
            </span>
          )}
        </div>
      </div>

      {/* 4. Selling & Logistics Cost */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Selling & Freight
          </span>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-900">
            {currency}
            {summary.sellingExpenses.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>Transport & Mandi Cess</span>
          <span className="text-slate-600 font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-agri-600" /> Tracked
          </span>
        </div>
      </div>
    </div>
  );
};
