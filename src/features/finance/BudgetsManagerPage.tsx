// CropDiary AI — Budgets Manager Page
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  Plus,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { storageAdapter } from '@/services/storageAdapter';
import { financeService } from './services/financeService';
import { Farm, Plot } from '@/types/database';
import { CropPlan } from '@/types/crop';
import { FarmBudget, BudgetComparison, BudgetFormData } from '@/types/finance';
import { BudgetCard } from './components/BudgetCard';
import { BudgetModal } from './components/BudgetModal';

export const BudgetsManagerPage: React.FC = () => {
  const { user } = useAuth();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [cropPlans, setCropPlans] = useState<CropPlan[]>([]);
  const [comparisons, setComparisons] = useState<BudgetComparison[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<FarmBudget | null>(null);

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

      const list = await financeService.getBudgetComparisons(
        user.id,
        selectedFarmId !== 'all' ? selectedFarmId : undefined
      );
      setComparisons(list);
    } catch (err) {
      console.error('Error loading budgets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, selectedFarmId]);

  const handleSave = async (data: BudgetFormData) => {
    if (!user) return;
    if (budgetToEdit) {
      await financeService.updateBudget(user.id, budgetToEdit.id, data);
    } else {
      await financeService.createBudget(user.id, data);
    }
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (window.confirm('Delete this budget?')) {
      await financeService.deleteBudget(user.id, id);
      await loadData();
    }
  };

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
            Farm Budgets & Spending Limits
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Set target expenditure caps for seasons, plots, and input categories with automated threshold warnings
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setBudgetToEdit(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-agri-700 hover:bg-agri-800 shadow-xs transition-all min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Budget</span>
        </button>
      </div>

      {/* Filter by Farm */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3">
        <label htmlFor="budget-farm-filter" className="text-xs font-semibold text-slate-600">
          Filter by Farm:
        </label>
        <select
          id="budget-farm-filter"
          value={selectedFarmId}
          onChange={(e) => setSelectedFarmId(e.target.value)}
          className="text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-agri-600"
        >
          <option value="all">All Farms</option>
          {farms.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {/* Budgets Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
      ) : comparisons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {comparisons.map((comp) => (
            <BudgetCard
              key={comp.budget.id}
              comparison={comp}
              onEdit={() => {
                setBudgetToEdit(comp.budget);
                setIsModalOpen(true);
              }}
              onDelete={() => handleDelete(comp.budget.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-500 shadow-xs">
          <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800">No Farm Budgets Defined</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Budgets help you cap fertilizer, seed, and labor expenses during planting and weeding to safeguard seasonal profits.
          </p>
          <button
            type="button"
            onClick={() => {
              setBudgetToEdit(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-agri-700 hover:bg-agri-800 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Budget</span>
          </button>
        </div>
      )}

      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setBudgetToEdit(null);
        }}
        onSave={handleSave}
        budgetToEdit={budgetToEdit}
        farms={farms}
        plots={plots}
        cropPlans={cropPlans}
      />
    </div>
  );
};
