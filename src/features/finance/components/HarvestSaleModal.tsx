// CropDiary AI — Harvest-to-Sale Workflow Modal Component
import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Save, AlertTriangle } from 'lucide-react';
import { Farm, Plot } from '@/types/database';
import { CropPlan } from '@/types/crop';
import { HarvestRecord } from '@/types/diary';
import { HarvestSale, HarvestSaleFormData } from '@/types/finance';
import {
  calculateGrossSaleRevenue,
  convertToKg,
  convertFromKg,
} from '../services/financialCalculationEngine';

interface HarvestSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: HarvestSaleFormData) => Promise<void>;
  harvestRecord?: HarvestRecord | null;
  saleToEdit?: HarvestSale | null;
  existingSales?: HarvestSale[];
  farms: Farm[];
  plots: Plot[];
  cropPlans: CropPlan[];
}

export const HarvestSaleModal: React.FC<HarvestSaleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  harvestRecord,
  saleToEdit,
  existingSales = [],
  farms,
  plots,
  cropPlans,
}) => {
  const [farmId, setFarmId] = useState('');
  const [plotId, setPlotId] = useState('');
  const [cropPlanId, setCropPlanId] = useState('');
  const [cropName, setCropName] = useState('');
  const [quantitySold, setQuantitySold] = useState<number | ''>('');
  const [quantityUnit, setQuantityUnit] = useState('quintals');
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [priceUnit, setPriceUnit] = useState('per_quintal');
  const [sellingCost, setSellingCost] = useState<number | ''>(0);
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [buyerMarket, setBuyerMarket] = useState('');
  const [buyerReference, setBuyerReference] = useState('');
  const [notes, setNotes] = useState('');
  const [allowExceed, setAllowExceed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Compute available harvest balance
  const harvestQty = harvestRecord ? Number(harvestRecord.quantity_harvested) : 0;
  const householdQty = harvestRecord ? Number(harvestRecord.quantity_retained_household || 0) : 0;
  const harvestUnit = harvestRecord ? harvestRecord.unit : 'quintals';

  const harvestTotalKg = convertToKg(harvestQty, harvestUnit);
  const householdKg = convertToKg(householdQty, harvestUnit);
  const netAvailableKg = Math.max(0, harvestTotalKg - householdKg);

  // Exclude current sale being edited from total sold
  const otherSales = existingSales.filter((s) => s.id !== saleToEdit?.id);
  const otherSoldKg = otherSales.reduce(
    (sum, s) => sum + convertToKg(s.quantity_sold, s.quantity_unit),
    0
  );
  const remainingAvailableKg = Math.max(0, netAvailableKg - otherSoldKg);
  const remainingAvailableInUnit = convertFromKg(remainingAvailableKg, quantityUnit);

  useEffect(() => {
    if (saleToEdit) {
      setFarmId(saleToEdit.farm_id);
      setPlotId(saleToEdit.plot_id || '');
      setCropPlanId(saleToEdit.crop_plan_id || '');
      setCropName(saleToEdit.crop_name);
      setQuantitySold(saleToEdit.quantity_sold);
      setQuantityUnit(saleToEdit.quantity_unit);
      setUnitPrice(saleToEdit.unit_price);
      setPriceUnit(saleToEdit.price_unit);
      setSellingCost(saleToEdit.selling_cost);
      setSaleDate(saleToEdit.sale_date);
      setBuyerMarket(saleToEdit.buyer_market || '');
      setBuyerReference(saleToEdit.buyer_reference || '');
      setNotes(saleToEdit.notes || '');
    } else if (harvestRecord) {
      setCropName(harvestRecord.crop_name);
      setQuantityUnit(harvestRecord.unit || 'quintals');
      setPriceUnit(
        harvestRecord.unit?.toLowerCase().includes('kg') ? 'per_kg' : 'per_quintal'
      );
      // Pre-fill remaining quantity
      const rem = convertFromKg(remainingAvailableKg, harvestRecord.unit || 'quintals');
      setQuantitySold(rem > 0 ? rem : '');
      setUnitPrice('');
      setSellingCost(0);
      setSaleDate(new Date().toISOString().slice(0, 10));
      setBuyerMarket('');
      setBuyerReference('');
      setNotes('');
    } else {
      setFarmId(farms[0]?.id || '');
      setPlotId('');
      setCropPlanId('');
      setCropName('');
      setQuantitySold('');
      setQuantityUnit('quintals');
      setUnitPrice('');
      setPriceUnit('per_quintal');
      setSellingCost(0);
      setSaleDate(new Date().toISOString().slice(0, 10));
      setBuyerMarket('');
      setBuyerReference('');
      setNotes('');
    }
    setAllowExceed(false);
    setErrorMsg(null);
  }, [saleToEdit, harvestRecord, isOpen]);

  if (!isOpen) return null;

  const currentSoldKg = convertToKg(Number(quantitySold || 0), quantityUnit);
  const exceedsBalance = harvestRecord && currentSoldKg > remainingAvailableKg + 0.05;

  const grossRevenue = calculateGrossSaleRevenue(
    Number(quantitySold || 0),
    quantityUnit,
    Number(unitPrice || 0),
    priceUnit
  );
  const netProceeds = Math.max(0, grossRevenue - Number(sellingCost || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!quantitySold || Number(quantitySold) <= 0) {
      setErrorMsg('Please enter a valid quantity sold');
      return;
    }
    if (!unitPrice || Number(unitPrice) <= 0) {
      setErrorMsg('Please enter a valid unit selling price');
      return;
    }

    if (exceedsBalance && !allowExceed) {
      setErrorMsg(
        `Quantity sold (${quantitySold} ${quantityUnit}) exceeds recorded available balance (${remainingAvailableInUnit} ${quantityUnit}). Please check the box to confirm override.`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        farm_id: farmId || farms[0]?.id || '',
        plot_id: plotId || null,
        crop_plan_id: cropPlanId || null,
        harvest_record_id: harvestRecord?.id || saleToEdit?.harvest_record_id || null,
        crop_name: cropName.trim(),
        quantity_sold: Number(quantitySold),
        quantity_unit: quantityUnit,
        unit_price: Number(unitPrice),
        price_unit: priceUnit,
        currency: 'INR',
        selling_cost: Number(sellingCost || 0),
        sale_date: saleDate,
        buyer_market: buyerMarket.trim() || null,
        buyer_reference: buyerReference.trim() || null,
        payment_status: 'received',
        notes: notes.trim() || null,
        allow_exceed_harvest: allowExceed,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save harvest sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-sale-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-sale-title" className="text-lg font-bold text-slate-900">
                {saleToEdit ? 'Edit Harvest Sale' : 'Record Crop Produce Sale'}
              </h2>
              <p className="text-xs text-slate-500">
                Links physical harvest yield directly to sales revenue & P&L
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close harvest sale modal"
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Harvest Balance Card */}
        {harvestRecord && (
          <div className="mb-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1.5">
            <div className="flex items-center justify-between font-semibold text-slate-900">
              <span>Linked Harvest: {harvestRecord.crop_name}</span>
              <span className="text-agri-700 font-bold">
                {harvestQty} {harvestUnit} harvested
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Household retained: {householdQty} {harvestUnit}</span>
              <span>Prior sales: {convertFromKg(otherSoldKg, harvestUnit)} {harvestUnit}</span>
            </div>
            <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between font-bold text-slate-900">
              <span>Remaining Available Produce:</span>
              <span className="text-emerald-700">
                {convertFromKg(remainingAvailableKg, harvestUnit)} {harvestUnit}
              </span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!harvestRecord && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="sale-farm" className="block text-xs font-semibold text-slate-700 mb-1">
                  Farm *
                </label>
                <select
                  id="sale-farm"
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
                <label htmlFor="sale-plot" className="block text-xs font-semibold text-slate-700 mb-1">
                  Plot (Optional)
                </label>
                <select
                  id="sale-plot"
                  value={plotId}
                  onChange={(e) => setPlotId(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
                >
                  <option value="">All Plots</option>
                  {plots.filter((p) => !farmId || p.farm_id === farmId).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="sale-plan" className="block text-xs font-semibold text-slate-700 mb-1">
                  Crop Plan (Optional)
                </label>
                <select
                  id="sale-plan"
                  value={cropPlanId}
                  onChange={(e) => setCropPlanId(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
                >
                  <option value="">No Plan Link</option>
                  {cropPlans.filter((cp) => !farmId || cp.farm_id === farmId).map((cp) => (
                    <option key={cp.id} value={cp.id}>
                      {cp.selected_crop_name} ({cp.season})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Crop Name & Sale Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="sale-crop" className="block text-xs font-semibold text-slate-700 mb-1">
                Crop Name *
              </label>
              <input
                id="sale-crop"
                type="text"
                required
                readOnly={Boolean(harvestRecord)}
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                placeholder="e.g. Paddy Samba Masuri"
                className={`w-full text-sm rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600 ${
                  harvestRecord ? 'bg-slate-50 text-slate-600' : ''
                }`}
              />
            </div>

            <div>
              <label htmlFor="sale-date" className="block text-xs font-semibold text-slate-700 mb-1">
                Sale Date *
              </label>
              <input
                id="sale-date"
                type="date"
                required
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
              />
            </div>
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="sale-qty" className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity Sold *
              </label>
              <input
                id="sale-qty"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="e.g. 15.0"
                value={quantitySold}
                onChange={(e) => setQuantitySold(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600 font-medium"
              />
            </div>

            <div>
              <label htmlFor="sale-unit" className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity Unit *
              </label>
              <select
                id="sale-unit"
                value={quantityUnit}
                onChange={(e) => setQuantityUnit(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
              >
                <option value="quintals">Quintals (100 kg)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="tonnes">Tonnes (1,000 kg)</option>
                <option value="bags">Bags (50 kg standard)</option>
                <option value="crates">Crates (25 kg standard)</option>
              </select>
            </div>
          </div>

          {/* Price & Price Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="sale-price" className="block text-xs font-semibold text-slate-700 mb-1">
                Selling Price (₹ INR) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  id="sale-price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="e.g. 2350.00"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full text-sm rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600 font-medium"
                />
              </div>
            </div>

            <div>
              <label htmlFor="sale-price-unit" className="block text-xs font-semibold text-slate-700 mb-1">
                Price Rate Basis *
              </label>
              <select
                id="sale-price-unit"
                value={priceUnit}
                onChange={(e) => setPriceUnit(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
              >
                <option value="per_quintal">per Quintal (₹/100kg)</option>
                <option value="per_kg">per Kilogram (₹/kg)</option>
                <option value="per_tonne">per Tonne (₹/1000kg)</option>
                <option value="per_bag">per Bag</option>
              </select>
            </div>
          </div>

          {/* Selling Costs & Buyer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="sale-cost" className="block text-xs font-semibold text-slate-700 mb-1">
                Selling Costs (Transport / Mandi Cess)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  id="sale-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={sellingCost}
                  onChange={(e) => setSellingCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="0.00"
                  className="w-full text-sm rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
                />
              </div>
            </div>

            <div>
              <label htmlFor="sale-buyer" className="block text-xs font-semibold text-slate-700 mb-1">
                Buyer / APMC Mandi
              </label>
              <input
                id="sale-buyer"
                type="text"
                placeholder="e.g. Thanjavur Regulated Market"
                value={buyerMarket}
                onChange={(e) => setBuyerMarket(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
              />
            </div>
          </div>

          {/* Revenue Calculation Live Preview */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block">Gross Sale Revenue:</span>
              <span className="text-base font-bold text-slate-900">
                ₹{grossRevenue.toLocaleString('en-IN')}
              </span>
            </div>
            {Number(sellingCost || 0) > 0 && (
              <div className="text-center">
                <span className="text-slate-500 block">Selling Costs:</span>
                <span className="text-sm font-semibold text-rose-600">
                  -₹{Number(sellingCost || 0).toLocaleString('en-IN')}
                </span>
              </div>
            )}
            <div className="text-right">
              <span className="text-slate-500 block">Net Proceeds:</span>
              <span className="text-base font-bold text-emerald-700">
                ₹{netProceeds.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Exceeds balance warning & override checkbox */}
          {exceedsBalance && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p>
                  This sale of <strong>{quantitySold} {quantityUnit}</strong> exceeds the recorded available balance (<strong>{remainingAvailableInUnit} {quantityUnit}</strong>).
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-900 pt-1">
                <input
                  type="checkbox"
                  checked={allowExceed}
                  onChange={(e) => setAllowExceed(e.target.checked)}
                  className="rounded border-slate-300 text-agri-700 focus:ring-agri-600 w-4 h-4"
                />
                <span>Confirm variance (weight differential, moisture correction, or record adjustment)</span>
              </label>
            </div>
          )}

          {/* Notes */}
          <div>
            <label htmlFor="sale-notes" className="block text-xs font-semibold text-slate-700 mb-1">
              Receipt / Bill Reference & Notes
            </label>
            <input
              id="sale-notes"
              type="text"
              placeholder="e.g. Weighbridge slip #402, paid via RTGS"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
            />
          </div>

          {/* Actions */}
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
              <span>{isSubmitting ? 'Saving...' : 'Save Produce Sale'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
