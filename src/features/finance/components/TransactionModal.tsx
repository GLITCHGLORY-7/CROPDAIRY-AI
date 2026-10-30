// CropDiary AI — Transaction Create/Edit Modal Component
import React, { useState, useEffect } from 'react';
import { X, IndianRupee, Save, AlertCircle } from 'lucide-react';
import { Farm, Plot } from '@/types/database';
import { CropPlan } from '@/types/crop';
import {
  FinancialTransaction,
  TransactionFormData,
  TransactionType,
  PaymentMethod,
  PaymentStatus,
} from '@/types/finance';
import {
  expenseCategories,
  saleCategories,
  otherIncomeCategories,
  refundCategories,
  transactionFormSchema,
} from '@/lib/validation/financeSchemas';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TransactionFormData) => Promise<void>;
  transactionToEdit?: FinancialTransaction | null;
  farms: Farm[];
  plots: Plot[];
  cropPlans: CropPlan[];
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  transactionToEdit,
  farms,
  plots,
  cropPlans,
}) => {
  const [farmId, setFarmId] = useState('');
  const [plotId, setPlotId] = useState('');
  const [cropPlanId, setCropPlanId] = useState('');
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<string>('seeds');
  const [amount, setAmount] = useState<number | ''>('');
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [vendorBuyer, setVendorBuyer] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (transactionToEdit) {
      setFarmId(transactionToEdit.farm_id);
      setPlotId(transactionToEdit.plot_id || '');
      setCropPlanId(transactionToEdit.crop_plan_id || '');
      setTransactionType(transactionToEdit.transaction_type);
      setCategory(transactionToEdit.category);
      setAmount(transactionToEdit.amount);
      setOccurredAt(transactionToEdit.occurred_at.slice(0, 10));
      setDescription(transactionToEdit.description);
      setPaymentMethod(transactionToEdit.payment_method);
      setPaymentStatus(transactionToEdit.payment_status);
      setInvoiceNumber(transactionToEdit.invoice_number || '');
      setVendorBuyer(transactionToEdit.vendor_buyer || '');
      setNotes(transactionToEdit.notes || '');
    } else {
      setFarmId(farms[0]?.id || '');
      setPlotId('');
      setCropPlanId('');
      setTransactionType('expense');
      setCategory('seeds');
      setAmount('');
      setOccurredAt(new Date().toISOString().slice(0, 10));
      setDescription('');
      setPaymentMethod('cash');
      setPaymentStatus('paid');
      setInvoiceNumber('');
      setVendorBuyer('');
      setNotes('');
    }
    setErrorMsg(null);
  }, [transactionToEdit, isOpen, farms]);

  if (!isOpen) return null;

  const relevantPlots = farmId ? plots.filter((p) => p.farm_id === farmId) : plots;
  const relevantPlans = farmId ? cropPlans.filter((cp) => cp.farm_id === farmId) : cropPlans;

  const getAvailableCategories = () => {
    switch (transactionType) {
      case 'sale_revenue':
        return saleCategories;
      case 'other_income':
        return otherIncomeCategories;
      case 'refund_adjustment':
        return refundCategories;
      case 'expense':
      default:
        return expenseCategories;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const formData: TransactionFormData = {
      farm_id: farmId,
      plot_id: plotId || null,
      crop_plan_id: cropPlanId || null,
      transaction_type: transactionType,
      category,
      amount: Number(amount),
      currency: 'INR',
      occurred_at: `${occurredAt}T12:00:00Z`,
      description: description.trim(),
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      invoice_number: invoiceNumber.trim() || null,
      vendor_buyer: vendorBuyer.trim() || null,
      notes: notes.trim() || null,
    };

    const validation = transactionFormSchema.safeParse(formData);
    if (!validation.success) {
      setErrorMsg(validation.error.issues[0]?.message || 'Please check input fields');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-transaction-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-agri-50 text-agri-700 flex items-center justify-center font-bold">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-transaction-title" className="text-lg font-bold text-slate-900">
                {transactionToEdit ? 'Edit Financial Record' : 'Record Financial Transaction'}
              </h2>
              <p className="text-xs text-slate-500">
                Maintains single source of truth for farm expenses & earnings
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close transaction modal"
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
          {/* Transaction Type Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: 'expense', label: 'Expense' },
                { type: 'sale_revenue', label: 'Sale Revenue' },
                { type: 'other_income', label: 'Govt Subsidy' },
                { type: 'refund_adjustment', label: 'Refund' },
              ].map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => {
                    setTransactionType(opt.type as TransactionType);
                    // Reset category to first matching
                    if (opt.type === 'sale_revenue') setCategory('crop_sale');
                    else if (opt.type === 'other_income') setCategory('subsidy_grant');
                    else if (opt.type === 'refund_adjustment') setCategory('input_refund');
                    else setCategory('seeds');
                  }}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all text-center min-h-[44px] ${
                    transactionType === opt.type
                      ? 'border-agri-700 bg-agri-50 text-agri-800 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="tx-amount" className="block text-xs font-semibold text-slate-700 mb-1">
                Amount (₹ INR) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  id="tx-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full text-sm rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600 font-medium"
                />
              </div>
            </div>

            <div>
              <label htmlFor="tx-date" className="block text-xs font-semibold text-slate-700 mb-1">
                Date *
              </label>
              <input
                id="tx-date"
                type="date"
                required
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
              />
            </div>
          </div>

          {/* Category & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="tx-category" className="block text-xs font-semibold text-slate-700 mb-1">
                Category *
              </label>
              <select
                id="tx-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
              >
                {getAvailableCategories().map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tx-desc" className="block text-xs font-semibold text-slate-700 mb-1">
                Title / Description *
              </label>
              <input
                id="tx-desc"
                type="text"
                required
                placeholder="e.g. 5 bags of Urea purchase"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
              />
            </div>
          </div>

          {/* Farm, Plot & Crop Plan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="tx-farm" className="block text-xs font-semibold text-slate-700 mb-1">
                Farm *
              </label>
              <select
                id="tx-farm"
                required
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
              <label htmlFor="tx-plot" className="block text-xs font-semibold text-slate-700 mb-1">
                Plot (Optional)
              </label>
              <select
                id="tx-plot"
                value={plotId}
                onChange={(e) => setPlotId(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
              >
                <option value="">General (Whole Farm)</option>
                {relevantPlots.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tx-plan" className="block text-xs font-semibold text-slate-700 mb-1">
                Crop Plan (Optional)
              </label>
              <select
                id="tx-plan"
                value={cropPlanId}
                onChange={(e) => setCropPlanId(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
              >
                <option value="">No Crop Plan Link</option>
                {relevantPlans.map((cp) => (
                  <option key={cp.id} value={cp.id}>
                    {cp.selected_crop_name} ({cp.season})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Method & Payee */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="tx-paymethod" className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Method
              </label>
              <select
                id="tx-paymethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full text-xs rounded-xl border border-slate-200 px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI / GPay / PhonePe</option>
                <option value="bank_transfer">Bank NEFT/IMPS</option>
                <option value="credit">Kisan Credit / Dealer Credit</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label htmlFor="tx-paystatus" className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Status
              </label>
              <select
                id="tx-paystatus"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full text-xs rounded-xl border border-slate-200 px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
              >
                <option value="paid">Settled / Paid in Full</option>
                <option value="pending">Pending Payment</option>
                <option value="partial">Partially Paid</option>
              </select>
            </div>

            <div>
              <label htmlFor="tx-vendor" className="block text-xs font-semibold text-slate-700 mb-1">
                Vendor / Buyer Name
              </label>
              <input
                id="tx-vendor"
                type="text"
                placeholder="e.g. Cauvery Agro Agencies"
                value={vendorBuyer}
                onChange={(e) => setVendorBuyer(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
              />
            </div>
          </div>

          {/* Invoice & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="tx-invoice" className="block text-xs font-semibold text-slate-700 mb-1">
                Bill / Receipt Reference No.
              </label>
              <input
                id="tx-invoice"
                type="text"
                placeholder="Receipt / Voucher #"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
              />
            </div>

            <div>
              <label htmlFor="tx-notes" className="block text-xs font-semibold text-slate-700 mb-1">
                Notes
              </label>
              <input
                id="tx-notes"
                type="text"
                placeholder="Optional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
              />
            </div>
          </div>

          {/* Form Actions */}
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
              <span>{isSubmitting ? 'Saving...' : 'Save Transaction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
