// CropDiary AI — Farm Expense Detail Form Section
// Captures financial transactions with strict non-negative decimal currency validation.

import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { DiaryEntryFormData } from '@/lib/validation/diarySchemas';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Receipt } from 'lucide-react';

interface ExpenseDetailSectionProps {
  register: UseFormRegister<DiaryEntryFormData>;
  errors: FieldErrors<DiaryEntryFormData>;
}

export const ExpenseDetailSection: React.FC<ExpenseDetailSectionProps> = ({
  register,
  errors,
}) => {
  return (
    <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-2xl space-y-4 text-left">
      <div className="border-b border-rose-200 pb-2 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-rose-950 flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-rose-700" />
            <span>Farm Financial Expense Details</span>
          </h3>
          <p className="text-[11px] text-rose-700">
            Record input purchases, labor wages, machinery rental, and operational expenditures.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select
          label="Expense Category"
          required
          error={errors.expense?.category?.message}
          {...register('expense.category')}
        >
          <option value="labor">Daily Labor Wages</option>
          <option value="seeds">Seeds & Planting Material</option>
          <option value="fertilizer">Fertilizers & Nutrients</option>
          <option value="crop_protection">Bio / Chemical Crop Protection</option>
          <option value="irrigation">Electricity / Diesel / Water Supply</option>
          <option value="equipment_rent">Tractor / Implement Rental</option>
          <option value="fuel">Fuel (Diesel / Petrol)</option>
          <option value="land_preparation">Land Tillage / Bund Formation</option>
          <option value="harvesting">Harvesting & Threshing Labor</option>
          <option value="transportation">Transport to Mandi / Market</option>
          <option value="packaging_storage">Gunny Bags / Crates / Cold Storage</option>
          <option value="maintenance">Motor / Pipe / Drip Repairs</option>
          <option value="other">Other Operational Expense</option>
        </Select>

        <Input
          label="Amount (₹)"
          type="number"
          step="0.01"
          required
          placeholder="e.g. 2400.00"
          error={errors.expense?.amount?.message}
          {...register('expense.amount', { valueAsNumber: true })}
        />

        <Select
          label="Currency"
          {...register('expense.currency')}
        >
          <option value="INR">INR (₹ - Indian Rupee)</option>
          <option value="USD">USD ($)</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select
          label="Payment Method"
          error={errors.expense?.payment_method?.message}
          {...register('expense.payment_method')}
        >
          <option value="cash">Cash in Hand</option>
          <option value="upi">UPI / GPay / PhonePe</option>
          <option value="bank_transfer">Bank NEFT / IMPS</option>
          <option value="credit">Store Credit / Khata</option>
          <option value="cheque">Cheque</option>
          <option value="other">Other</option>
        </Select>

        <Select
          label="Payment Status"
          error={errors.expense?.payment_status?.message}
          {...register('expense.payment_status')}
        >
          <option value="paid">Fully Paid</option>
          <option value="pending">Credit Due / Pending</option>
          <option value="partial">Partially Paid</option>
        </Select>

        <Input
          label="Vendor / Store / Payee Name"
          placeholder="e.g. Shanmugam Agro Service, Labor Team"
          error={errors.expense?.vendor_payee?.message}
          {...register('expense.vendor_payee')}
        />
      </div>
    </div>
  );
};
