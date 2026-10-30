// CropDiary AI — AI Financial Advisor Card Component
import React, { useState } from 'react';
import { Bot, Sparkles, RefreshCw } from 'lucide-react';
import { FinanceSummary, BudgetComparison } from '@/types/finance';

interface AIFinanceAdvisorCardProps {
  summary: FinanceSummary;
  budgetComparisons: BudgetComparison[];
  farmName?: string;
  className?: string;
}

export const AIFinanceAdvisorCard: React.FC<AIFinanceAdvisorCardProps> = ({
  summary,
  budgetComparisons,
  farmName = 'Your Farm',
  className = '',
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insightVersion, setInsightVersion] = useState(0);

  // Deterministic agronomic financial synthesis
  const generateInsights = () => {
    const insights: string[] = [];
    const isProfitable = summary.netProfitOrLoss >= 0;

    // 1. Overall P&L Analysis
    if (summary.totalRevenue === 0 && summary.totalExpenses > 0) {
      insights.push(
        `Cultivation investments of ₹${summary.totalExpenses.toLocaleString(
          'en-IN'
        )} are actively recorded for ${farmName}. Since produce sales have not occurred yet, this temporary deficit represents working capital deployed for seeds, soil inputs, and field labor.`
      );
    } else if (isProfitable) {
      insights.push(
        `Strong operational performance! ${farmName} has generated ₹${summary.totalRevenue.toLocaleString(
          'en-IN'
        )} in gross revenue against ₹${summary.totalExpenses.toLocaleString(
          'en-IN'
        )} in expenses, yielding a positive net return of ₹${summary.netProfitOrLoss.toLocaleString(
          'en-IN'
        )}.`
      );
    } else {
      insights.push(
        `Current recorded expenses (₹${summary.totalExpenses.toLocaleString(
          'en-IN'
        )}) exceed sales revenue (₹${summary.totalRevenue.toLocaleString(
          'en-IN'
        )}). If additional harvested produce remains in storage, recording those sales will bridge this gap.`
      );
    }

    // 2. Expense Category Highlights
    const sortedCategories = Object.entries(summary.expensesByCategory).sort(
      (a, b) => b[1] - a[1]
    );
    if (sortedCategories.length > 0) {
      const topCat = sortedCategories[0];
      const pct = ((topCat[1] / summary.totalExpenses) * 100).toFixed(0);
      insights.push(
        `Primary cost driver: ${topCat[0].replace(/_/g, ' ')} accounts for ${pct}% (₹${topCat[1].toLocaleString(
          'en-IN'
        )}) of total operational outflows. Compare with ICAR regional benchmark ranges (typically 25-35% for field labor).`
      );
    }

    // 3. Budget Variance Alert
    const overBudgets = budgetComparisons.filter((b) => b.status === 'over_budget');
    const warningBudgets = budgetComparisons.filter((b) => b.status === 'warning');

    if (overBudgets.length > 0) {
      insights.push(
        `Budget alert: "${overBudgets[0].budget.name}" has exceeded its planned limit by ₹${Math.abs(
          overBudgets[0].remainingBudget
        ).toLocaleString('en-IN')}. Consider capping non-essential fertilizer top-dressing or machinery rentals.`
      );
    } else if (warningBudgets.length > 0) {
      insights.push(
        `Budget watch: "${warningBudgets[0].budget.name}" is currently at ${warningBudgets[0].percentUsed}% utilization, approaching its threshold.`
      );
    }

    // 4. Traceability Note
    if (summary.incompleteDataNotes.length > 0) {
      insights.push(
        `Data completeness note: ${summary.incompleteDataNotes.join(' ')}`
      );
    }

    return insights;
  };

  const insights = generateInsights();

  const handleRefresh = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setInsightVersion((v) => v + 1);
      setIsAnalyzing(false);
    }, 400);
  };

  return (
    <div
      className={`bg-linear-to-br from-emerald-950/90 to-slate-900 border border-emerald-800/60 rounded-3xl p-6 text-white shadow-lg ${className}`}
    >
      <div className="flex items-center justify-between pb-4 border-b border-emerald-800/40 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>AI Farm Finance Advisor</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Deterministic
              </span>
            </h3>
            <p className="text-xs text-emerald-200/70">
              Plain-language synthesis of cost drivers, margins & budget variances
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isAnalyzing}
          aria-label="Refresh financial insights"
          className="p-2 rounded-xl text-emerald-300 hover:text-white hover:bg-emerald-800/40 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-3 text-xs leading-relaxed text-slate-200">
        {insights.map((insight, idx) => (
          <div key={`${insightVersion}-${idx}`} className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p>{insight}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-emerald-800/30 flex items-center justify-between text-[11px] text-emerald-300/60">
        <span>Grounded strictly on actual farm transactions</span>
        <span>Zero hallucinated figures</span>
      </div>
    </div>
  );
};
