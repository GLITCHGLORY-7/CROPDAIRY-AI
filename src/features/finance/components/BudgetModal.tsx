// CropDiary AI — Budget Create/Edit Modal Component
import React, { useState, useEffect } from 'react';
import { X, Wallet, Save, AlertCircle } from 'lucide-react';
import { Farm, Plot } from '@/types/database';
import { CropPlan } from '@/types/crop';
import { FarmBudget, BudgetFormData, ExpenseCategory } from '@/types/finance';
import { expenseCategories, farmBudgetFormSchema } from '@/lib/validation/financeSchemas';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BudgetFormData) => Promise<void>;
  budgetToEdit?: FarmBudget | null;
  farms: Farm[];
  plots: Plot[];
  cropPlans: CropPlan[];
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  budgetToEdit,
  farms,
  plots,
  cropPlans,
}) => {
  const [farmId, setFarmId] = useState('');
  const [plotId, setPlotId] = useState('');
  const [cropPlanId, setCropPlanId] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExpenseCategory | 'all'>('all');
  const [amount, setAmount] = useState<number | ''>('');
  const [periodStart, setPeriodStart] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10)
  );
  const [periodEnd, setPeriodEnd] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() + 3, 0)
      .toISOString()
      .slice(0, 10)
  );
  const [alertThresholdPercent, setAlertThresholdPercent] = useState(80);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (budgetToEdit) {
      setFarmId(budgetToEdit.farm_id);
      setPlotId(budgetToEdit.plot_id || '');
      setCropPlanId(budgetToEdit.crop_plan_id || '');
      setName(budgetToEdit.name);
      setCategory(budgetToEdit.category);
      setAmount(budgetToEdit.amount);
      setPeriodStart(budgetToEdit.period_start);
      setPeriodEnd(budgetToEdit.period_end);
      setAlertThresholdPercent(budgetToEdit.alert_threshold_percent || 80);
      setNotes(budgetToEdit.notes || '');
    } else {
      setFarmId(farms[0]?.id || '');
      setPlotId('');
      setCropPlanId('');
      setName('');
      setCategory('all');
      setAmount('');
      setAlertThresholdPercent(80);
      setNotes('');
    }
    setErrorMsg(null);
  }, [budgetToEdit, isOpen, farms]);

  if (!isOpen) return null;

  const relevantPlots = farmId ? plots.filter((p) => p.farm_id === farmId) : plots;
  const relevantPlans = farmId ? cropPlans.filter((cp) => cp.farm_id === farmId) : cropPlans;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const formData: BudgetFormData = {
      farm_id: farmId || farms[0]?.id || '',
      plot_id: plotId || null,
      crop_plan_id: cropPlanId || null,
      name: name.trim(),
      category,
      amount: Number(amount),
      currency: 'INR',
      period_start: periodStart,
      period_end: periodEnd,
      alert_threshold_percent: alertThresholdPercent,
      notes: notes.trim() || null,
      status: 'active',
    };

    const validation = farmBudgetFormSchema.safeParse(formData);
    if (!validation.success) {
      setErrorMsg(validation.error.issues[0]?.message || 'Please check form inputs');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-budget-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-agri-50 text-agri-700 flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-budget-title" className="text-lg font-bold text-slate-900">
                {budgetToEdit ? 'Edit Farm Budget' : 'Create Farm Budget'}
              </h2>
              <p className="text-xs text-slate-500">
                Track seasonal spending limits and prevent cost overruns
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close budget modal"
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="budget-name" className="block text-xs font-semibold text-slate-700 mb-1">
              Budget Name *
            </label>
            <input
              id="budget-name"
              type="text"
              required
              placeholder="e.g. Samba Season Paddy Cultivation Budget"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="budget-amount" className="block text-xs font-semibold text-slate-700 mb-1">
                Budget Limit (₹ INR) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  id="budget-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="e.g. 50000.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full text-sm rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600 font-medium"
                />
              </div>
            </div>

            <div>
              <label htmlFor="budget-category" className="block text-xs font-semibold text-slate-700 mb-1">
                Target Category *
              </label>
              <select
                id="budget-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
              >
                <option value="all">All Farm Expenses (Overall)</option>
                {expenseCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="budget-start" className="block text-xs font-semibold text-slate-700 mb-1">
                Period Start Date *
              </label>
              <input
                id="budget-start"
                type="date"
                required
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
              />
            </div>

            <div>
              <label htmlFor="budget-end" className="block text-xs font-semibold text-slate-700 mb-1">
                Period End Date *
              </label>
              <input
                id="budget-end"
                type="date"
                required
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="budget-farm" className="block text-xs font-semibold text-slate-700 mb-1">
                Farm *
              </label>
              <select
                id="budget-farm"
                value={farmId}
                onChange={(e) => setFarmId(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="budget-plot" className="block text-xs font-semibold text-slate-700 mb-1">
                Plot (Optional)
              </label>
              <select
                id="budget-plot"
                value={plotId}
                onChange={(e) => setPlotId(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
              >
                <option value="">All Plots</option>
                {relevantPlots.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="budget-plan" className="block text-xs font-semibold text-slate-700 mb-1">
                Crop Plan (Optional)
              </label>
              <select
                id="budget-plan"
                value={cropPlanId}
                onChange={(e) => setCropPlanId(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
              >
                <option value="">All Crop Plans</option>
                {relevantPlans.map((cp) => (
                  <option key={cp.id} value={cp.id}>
                    {cp.selected_crop_name} ({cp.season})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="budget-threshold" className="block text-xs font-semibold text-slate-700 mb-1">
                Warning Alert Threshold (%)
              </label>
              <select
                id="budget-threshold"
                value={alertThresholdPercent}
                onChange={(e) => setAlertThresholdPercent(parseInt(e.target.value, 10))}
                className="w-full text-xs rounded-xl border border-slate-200 px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
              >
                <option value="50">At 50% used</option>
                <option value="75">At 75% used</option>
                <option value="80">At 80% used (Default)</option>
                <option value="90">At 90% used</option>
                <option value="100">At 100% used</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="budget-notes" className="block text-xs font-semibold text-slate-700 mb-1">
              Notes
            </label>
            <input
              id="budget-notes"
              type="text"
              placeholder="e.g. Subsidized inputs anticipated from Krishi Bhavan"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-agri-700 hover:bg-agri-800 rounded-xl shadow-xs transition-all disabled:opacity-50 min-h-[44px]"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Budget'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
