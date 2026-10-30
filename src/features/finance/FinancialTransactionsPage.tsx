// CropDiary AI — Financial Transactions Ledger Page
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Receipt,
  Plus,
  ArrowLeft,
  Search,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { storageAdapter } from '@/services/storageAdapter';
import { financeService } from './services/financeService';
import { Farm, Plot } from '@/types/database';
import { CropPlan } from '@/types/crop';
import { FinancialTransaction, TransactionFormData } from '@/types/finance';
import { TransactionModal } from './components/TransactionModal';

export const FinancialTransactionsPage: React.FC = () => {
  const { user } = useAuth();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [cropPlans, setCropPlans] = useState<CropPlan[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState<FinancialTransaction | null>(null);

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

      const list = await financeService.getTransactions(user.id, {
        transactionType: typeFilter !== 'all' ? typeFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
      });
      setTransactions(list);
    } catch (err) {
      console.error('Error loading transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, typeFilter, categoryFilter]);

  const handleSave = async (data: TransactionFormData) => {
    if (!user) return;
    if (txToEdit) {
      await financeService.updateTransaction(user.id, txToEdit.id, data);
    } else {
      await financeService.createTransaction(user.id, data);
    }
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (window.confirm('Delete this transaction?')) {
      await financeService.deleteTransaction(user.id, id);
      await loadData();
    }
  };

  const filtered = transactions.filter((tx) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      tx.description.toLowerCase().includes(q) ||
      tx.category.toLowerCase().includes(q) ||
      (tx.vendor_buyer && tx.vendor_buyer.toLowerCase().includes(q)) ||
      (tx.invoice_number && tx.invoice_number.toLowerCase().includes(q))
    );
  });

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
            Financial Transactions Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete audit trail of agricultural inputs, labor costs, produce sales, and subsidies
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setTxToEdit(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-agri-700 hover:bg-agri-800 shadow-xs transition-all min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>New Transaction</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by description, payee, vendor, or invoice #"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter by transaction type"
            className="text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600 flex-1 sm:flex-none"
          >
            <option value="all">All Types</option>
            <option value="expense">Expenses</option>
            <option value="sale_revenue">Sales Revenue</option>
            <option value="other_income">Subsidies/Grants</option>
            <option value="refund_adjustment">Refunds</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            <div className="h-8 bg-slate-100 rounded-lg animate-pulse" />
            <div className="h-8 bg-slate-100 rounded-lg animate-pulse" />
            <div className="h-8 bg-slate-100 rounded-lg animate-pulse" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Title & Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Vendor / Buyer</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((tx) => {
                  const isRevenue = tx.transaction_type === 'sale_revenue';
                  const isExpense = tx.transaction_type === 'expense';
                  const isRefund = tx.transaction_type === 'refund_adjustment';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-600 whitespace-nowrap">
                        {tx.occurred_at.slice(0, 10)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block truncate max-w-xs">
                          {tx.description}
                        </span>
                        {tx.invoice_number && (
                          <span className="text-[10px] text-slate-400">
                            Inv: {tx.invoice_number}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 capitalize">
                        {tx.category.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isRevenue
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isExpense
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {tx.transaction_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {tx.vendor_buyer || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-sm whitespace-nowrap">
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
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] bg-slate-100 text-slate-600 font-medium capitalize">
                          {tx.payment_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setTxToEdit(tx);
                            setIsModalOpen(true);
                          }}
                          aria-label={`Edit transaction ${tx.description}`}
                          className="text-agri-700 hover:text-agri-900 font-semibold hover:underline mr-3"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(tx.id)}
                          aria-label={`Delete transaction ${tx.description}`}
                          className="text-rose-600 hover:text-rose-800 font-semibold hover:underline"
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
          <div className="py-12 text-center text-slate-500 text-sm">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No transactions found</p>
            <p className="text-xs text-slate-400 mt-1">
              Add income or expenses, or adjust your search filters.
            </p>
          </div>
        )}
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTxToEdit(null);
        }}
        onSave={handleSave}
        transactionToEdit={txToEdit}
        farms={farms}
        plots={plots}
        cropPlans={cropPlans}
      />
    </div>
  );
};
