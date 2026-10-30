// CropDiary AI — Finance Dashboard Page
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  ShoppingCart,
  Wallet,
  Receipt,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { storageAdapter } from '@/services/storageAdapter';
import { financeService } from './services/financeService';
import { Farm, Plot } from '@/types/database';
import { CropPlan } from '@/types/crop';
import {
  FinancialTransaction,
  FarmBudget,
  BudgetComparison,
  HarvestSale,
  FinanceSummary,
  TransactionFormData,
  BudgetFormData,
  HarvestSaleFormData,
} from '@/types/finance';
import { FinancialSummaryCards } from './components/FinancialSummaryCards';
import { ExpenseCategoryChart } from './components/ExpenseCategoryChart';
import { FinanceFilterToolbar } from './components/FinanceFilterToolbar';
import { TransactionModal } from './components/TransactionModal';
import { HarvestSaleModal } from './components/HarvestSaleModal';
import { BudgetModal } from './components/BudgetModal';
import { BudgetCard } from './components/BudgetCard';
import { AIFinanceAdvisorCard } from './components/AIFinanceAdvisorCard';

export const FinanceDashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [cropPlans, setCropPlans] = useState<CropPlan[]>([]);

  // Filter state
  const [selectedFarmId, setSelectedFarmId] = useState('all');
  const [selectedPlotId, setSelectedPlotId] = useState('all');
  const [selectedCropPlanId, setSelectedCropPlanId] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Data state
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [budgetComparisons, setBudgetComparisons] = useState<BudgetComparison[]>([]);
  const [sales, setSales] = useState<HarvestSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState<FinancialTransaction | null>(null);

  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleToEdit, setSaleToEdit] = useState<HarvestSale | null>(null);

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<FarmBudget | null>(null);

  const loadData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);

      // 1. Load farms, plots, and plans
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

      // 2. Fetch finance summary with filters
      const filterObj = {
        farmId: selectedFarmId !== 'all' ? selectedFarmId : undefined,
        plotId: selectedPlotId !== 'all' ? selectedPlotId : undefined,
        cropPlanId: selectedCropPlanId !== 'all' ? selectedCropPlanId : undefined,
        transactionType: selectedType !== 'all' ? selectedType : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const [summaryData, txList, budgetList, salesList] = await Promise.all([
        financeService.getFinanceSummary(user.id, filterObj),
        financeService.getTransactions(user.id, filterObj),
        financeService.getBudgetComparisons(user.id, selectedFarmId !== 'all' ? selectedFarmId : undefined),
        financeService.getHarvestSales(user.id, {
          farmId: selectedFarmId !== 'all' ? selectedFarmId : undefined,
        }),
      ]);

      setSummary(summaryData);
      setTransactions(txList);
      setBudgetComparisons(budgetList);
      setSales(salesList);
    } catch (err) {
      console.error('Error loading farm finance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [
    user,
    selectedFarmId,
    selectedPlotId,
    selectedCropPlanId,
    selectedType,
    selectedCategory,
    startDate,
    endDate,
  ]);

  const handleResetFilters = () => {
    setSelectedFarmId('all');
    setSelectedPlotId('all');
    setSelectedCropPlanId('all');
    setSelectedType('all');
    setSelectedCategory('all');
    setStartDate('');
    setEndDate('');
  };

  // Modal Handlers
  const handleSaveTransaction = async (data: TransactionFormData) => {
    if (!user) return;
    if (txToEdit) {
      await financeService.updateTransaction(user.id, txToEdit.id, data);
    } else {
      await financeService.createTransaction(user.id, data);
    }
    await loadData();
  };

  const handleDeleteTransaction = async (txId: string) => {
    if (!user) return;
    if (window.confirm('Are you sure you want to delete this financial record?')) {
      await financeService.deleteTransaction(user.id, txId);
      await loadData();
    }
  };

  const handleSaveSale = async (data: HarvestSaleFormData) => {
    if (!user) return;
    if (saleToEdit) {
      await financeService.updateHarvestSale(user.id, saleToEdit.id, data);
    } else {
      await financeService.createHarvestSale(user.id, data);
    }
    await loadData();
  };

  const handleSaveBudget = async (data: BudgetFormData) => {
    if (!user) return;
    if (budgetToEdit) {
      await financeService.updateBudget(user.id, budgetToEdit.id, data);
    } else {
      await financeService.createBudget(user.id, data);
    }
    await loadData();
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!user) return;
    if (window.confirm('Delete this farm budget?')) {
      await financeService.deleteBudget(user.id, budgetId);
      await loadData();
    }
  };

  const selectedFarmObj = farms.find((f) => f.id === selectedFarmId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header with Title & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Financial Ledger
            </span>
            <span className="text-xs text-slate-500">
              Single Source of Truth
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Farm Finance & Profit/Loss
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Track operational cultivation costs, record crop produce sales, review APMC mandi prices, and monitor seasonal margins.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setTxToEdit(null);
              setIsTxModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-agri-700 hover:bg-agri-800 shadow-xs transition-all min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSaleToEdit(null);
              setIsSaleModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all min-h-[44px]"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Record Produce Sale</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setBudgetToEdit(null);
              setIsBudgetModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-all min-h-[44px]"
          >
            <Wallet className="w-4 h-4 text-slate-500" />
            <span>New Budget</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none">
        <Link
          to="/app/finance"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-agri-700 text-white shadow-xs whitespace-nowrap min-h-[36px] flex items-center"
        >
          Finance Overview
        </Link>
        <Link
          to="/app/finance/transactions"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 whitespace-nowrap min-h-[36px] flex items-center"
        >
          Transaction Ledger
        </Link>
        <Link
          to="/app/finance/budgets"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 whitespace-nowrap min-h-[36px] flex items-center"
        >
          Budgets ({budgetComparisons.length})
        </Link>
        <Link
          to="/app/finance/sales"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 whitespace-nowrap min-h-[36px] flex items-center"
        >
          Harvest Sales ({sales.length})
        </Link>
        <Link
          to="/app/finance/reports"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 whitespace-nowrap min-h-[36px] flex items-center"
        >
          P&L Reports
        </Link>
        <Link
          to="/app/market-prices"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 whitespace-nowrap min-h-[36px] flex items-center gap-1.5"
        >
          <TrendingUp className="w-3.5 h-3.5 text-agri-600" />
          <span>Mandi Prices & Calculator</span>
        </Link>
      </div>

      {/* 3. Filter Toolbar */}
      <FinanceFilterToolbar
        farms={farms}
        plots={plots}
        cropPlans={cropPlans}
        selectedFarmId={selectedFarmId}
        selectedPlotId={selectedPlotId}
        selectedCropPlanId={selectedCropPlanId}
        selectedType={selectedType}
        selectedCategory={selectedCategory}
        startDate={startDate}
        endDate={endDate}
        onFarmChange={setSelectedFarmId}
        onPlotChange={setSelectedPlotId}
        onCropPlanChange={setSelectedCropPlanId}
        onTypeChange={setSelectedType}
        onCategoryChange={setSelectedCategory}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onResetFilters={handleResetFilters}
      />

      {/* 4. Financial KPI Summary Cards */}
      {!isLoading && summary ? (
        <FinancialSummaryCards summary={summary} />
      ) : (
        <div className="h-32 bg-slate-100 animate-pulse rounded-2xl" />
      )}

      {/* 5. Middle Grid: Expense Category Breakdown & AI Financial Advisor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {summary && (
          <ExpenseCategoryChart
            expensesByCategory={summary.expensesByCategory}
            totalExpenses={summary.totalExpenses}
          />
        )}

        {summary && (
          <AIFinanceAdvisorCard
            summary={summary}
            budgetComparisons={budgetComparisons}
            farmName={selectedFarmObj?.name || 'All Farms'}
          />
        )}
      </div>

      {/* 6. Active Budgets Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-agri-700" />
            <h2 className="text-lg font-bold text-slate-900">Active Farm Budgets</h2>
          </div>
          <Link
            to="/app/finance/budgets"
            className="text-xs font-semibold text-agri-700 hover:text-agri-800 flex items-center gap-1"
          >
            <span>Manage All Budgets</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {budgetComparisons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgetComparisons.slice(0, 3).map((comp) => (
              <BudgetCard
                key={comp.budget.id}
                comparison={comp}
                onEdit={() => {
                  setBudgetToEdit(comp.budget);
                  setIsBudgetModalOpen(true);
                }}
                onDelete={() => handleDeleteBudget(comp.budget.id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 text-center text-slate-500 text-sm">
            <p>No budgets created yet for this farm. Set a seasonal spending limit to avoid overruns.</p>
            <button
              type="button"
              onClick={() => {
                setBudgetToEdit(null);
                setIsBudgetModalOpen(true);
              }}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-agri-800 bg-agri-50 border border-agri-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Budget</span>
            </button>
          </div>
        )}
      </div>

      {/* 7. Recent Transactions Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-agri-700" />
            <h2 className="text-lg font-bold text-slate-900">Recent Financial Transactions</h2>
          </div>
          <Link
            to="/app/finance/transactions"
            className="text-xs font-semibold text-agri-700 hover:text-agri-800 flex items-center gap-1"
          >
            <span>View Full Ledger ({transactions.length})</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3 text-right">Amount (₹)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.slice(0, 8).map((tx) => {
                  const isExpense = tx.transaction_type === 'expense';
                  const isRevenue = tx.transaction_type === 'sale_revenue';
                  const isRefund = tx.transaction_type === 'refund_adjustment';

                  let badgeColor = 'bg-slate-100 text-slate-700';
                  if (isRevenue) badgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                  else if (isExpense) badgeColor = 'bg-rose-50 text-rose-700 border border-rose-200';
                  else if (isRefund) badgeColor = 'bg-blue-50 text-blue-700 border border-blue-200';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {tx.occurred_at.slice(0, 10)}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs truncate">
                        {tx.description}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {tx.category.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${badgeColor}`}>
                          {tx.transaction_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold">
                        <span
                          className={
                            isRevenue
                              ? 'text-emerald-700'
                              : isRefund
                              ? 'text-blue-700'
                              : 'text-slate-900'
                          }
                        >
                          {isRevenue ? '+' : isExpense ? '-' : ''}₹{tx.amount.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] bg-slate-100 text-slate-600 font-medium capitalize">
                          {tx.payment_status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setTxToEdit(tx);
                            setIsTxModalOpen(true);
                          }}
                          aria-label={`Edit transaction ${tx.description}`}
                          className="text-xs text-agri-700 hover:text-agri-900 font-medium hover:underline mr-2"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTransaction(tx.id)}
                          aria-label={`Delete transaction ${tx.description}`}
                          className="text-xs text-rose-600 hover:text-rose-800 font-medium hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-sm">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p>No financial transactions match the selected filters.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setTxToEdit(null);
        }}
        onSave={handleSaveTransaction}
        transactionToEdit={txToEdit}
        farms={farms}
        plots={plots}
        cropPlans={cropPlans}
      />

      <HarvestSaleModal
        isOpen={isSaleModalOpen}
        onClose={() => {
          setIsSaleModalOpen(false);
          setSaleToEdit(null);
        }}
        onSave={handleSaveSale}
        saleToEdit={saleToEdit}
        farms={farms}
        plots={plots}
        cropPlans={cropPlans}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => {
          setIsBudgetModalOpen(false);
          setBudgetToEdit(null);
        }}
        onSave={handleSaveBudget}
        budgetToEdit={budgetToEdit}
        farms={farms}
        plots={plots}
        cropPlans={cropPlans}
      />
    </div>
  );
};
