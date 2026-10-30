// CropDiary AI — Selling Insights & Net Return Calculator Component
import React, { useState } from 'react';
import {
  Calculator,
  Truck,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { SellingCalculatorInputs, SellingCalculatorResult } from '@/types/finance';
import { calculateSellingDecision } from '../services/financialCalculationEngine';

interface SellingCalculatorProps {
  initialCrop?: string;
  initialMandiRate?: number;
  className?: string;
}

export const SellingCalculator: React.FC<SellingCalculatorProps> = ({
  initialCrop = 'Paddy(Dhan)',
  initialMandiRate = 2280,
  className = '',
}) => {
  const [cropName, setCropName] = useState(initialCrop);
  const [quantity, setQuantity] = useState<number>(20);
  const [unit, setUnit] = useState<'quintals' | 'kg' | 'tonnes'>('quintals');
  const [mandiPrice, setMandiPrice] = useState<number>(initialMandiRate);
  const [distanceKm, setDistanceKm] = useState<number>(35);
  const [transportRatePerKm, setTransportRatePerKm] = useState<number>(25); // ₹25/km freight
  const [handlingCost, setHandlingCost] = useState<number>(450); // ₹450 loading/bagging
  const [cessPercent, setCessPercent] = useState<number>(1.5); // 1.5% APMC market fee
  const [localOffer, setLocalOffer] = useState<number>(2100); // local village trader offer per unit

  const inputs: SellingCalculatorInputs = {
    cropName,
    quantity,
    unit,
    mandiModalPricePerQuintal: mandiPrice,
    distanceKm,
    transportRatePerKm,
    loadingUnloadingCost: handlingCost,
    mandiCessPercent: cessPercent,
    localTraderOfferPerUnit: localOffer,
  };

  const result: SellingCalculatorResult = calculateSellingDecision(inputs);

  return (
    <div className={`bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs ${className}`}>
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-agri-50 text-agri-700 flex items-center justify-center font-bold">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Selling Net Proceeds Calculator
            </h3>
            <p className="text-xs text-slate-500">
              Compare APMC Mandi realization vs. Local Village Trader offers
            </p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 font-semibold text-slate-600">
          Decision Tool
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Inputs */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="calc-crop" className="block text-xs font-semibold text-slate-700 mb-1">
                Crop Name
              </label>
              <input
                id="calc-crop"
                type="text"
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="calc-qty" className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity
                </label>
                <input
                  id="calc-qty"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
                />
              </div>
              <div>
                <label htmlFor="calc-unit" className="block text-xs font-semibold text-slate-700 mb-1">
                  Unit
                </label>
                <select
                  id="calc-unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as any)}
                  className="w-full text-xs rounded-xl border border-slate-200 px-2 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
                >
                  <option value="quintals">Quintals</option>
                  <option value="kg">kg</option>
                  <option value="tonnes">Tonnes</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="calc-mandi-rate" className="block text-xs font-semibold text-slate-700 mb-1">
                Mandi Modal Rate (₹/Quintal)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">₹</span>
                <input
                  id="calc-mandi-rate"
                  type="number"
                  min="0"
                  value={mandiPrice}
                  onChange={(e) => setMandiPrice(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs rounded-xl border border-slate-200 pl-7 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600 font-semibold"
                />
              </div>
            </div>

            <div>
              <label htmlFor="calc-local-rate" className="block text-xs font-semibold text-slate-700 mb-1">
                Local Farmgate Offer (₹/{unit})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">₹</span>
                <input
                  id="calc-local-rate"
                  type="number"
                  min="0"
                  value={localOffer}
                  onChange={(e) => setLocalOffer(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs rounded-xl border border-slate-200 pl-7 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600 font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-slate-500" />
              Logistics & Selling Expenses to Mandi
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label htmlFor="calc-dist" className="text-[11px] text-slate-500 block mb-0.5">
                  Distance to Mandi (km)
                </label>
                <input
                  id="calc-dist"
                  type="number"
                  min="0"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-800"
                />
              </div>
              <div>
                <label htmlFor="calc-rate" className="text-[11px] text-slate-500 block mb-0.5">
                  Freight Rate (₹/km)
                </label>
                <input
                  id="calc-rate"
                  type="number"
                  min="0"
                  value={transportRatePerKm}
                  onChange={(e) => setTransportRatePerKm(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label htmlFor="calc-loading" className="text-[11px] text-slate-500 block mb-0.5">
                  Handling & Loading (₹)
                </label>
                <input
                  id="calc-loading"
                  type="number"
                  min="0"
                  value={handlingCost}
                  onChange={(e) => setHandlingCost(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-800"
                />
              </div>
              <div>
                <label htmlFor="calc-cess" className="text-[11px] text-slate-500 block mb-0.5">
                  APMC Cess / Market Fee (%)
                </label>
                <input
                  id="calc-cess"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={cessPercent}
                  onChange={(e) => setCessPercent(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Comparative Breakdown & Verdict */}
        <div className="flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Comparative Net Return
            </span>

            {/* Mandi Net Proceeds Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Mandi Gross Value ({result.quantityQuintals} Qtl @ ₹{mandiPrice})</span>
                <span className="font-semibold text-slate-900">
                  ₹{result.grossMandiRevenue.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-rose-600">
                <span>Deductions: Freight (₹{result.transportCost}) + Cess & Labor (₹{result.mandiCessCost + result.loadingCost})</span>
                <span className="font-semibold">
                  -₹{result.totalSellingCost.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold text-sm">
                <span className="text-slate-800">Mandi Net In-Hand Proceeds:</span>
                <span className="text-emerald-700 text-base">
                  ₹{result.netMandiProceeds.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Local Farmgate Offer Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block">Local Trader Farmgate Offer:</span>
                <span className="text-[11px] text-slate-400">Zero transport & loading deductions</span>
              </div>
              <span className="text-sm font-bold text-slate-800">
                ₹{result.localTraderGrossRevenue.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Verdict Recommendation Box */}
          <div
            className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
              result.recommendedAction === 'mandi'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-700" />
              <span>
                Recommended:{' '}
                {result.recommendedAction === 'mandi'
                  ? 'Sell at APMC Mandi'
                  : 'Sell to Local Farmgate Trader'}
              </span>
            </div>
            <p className="leading-relaxed">{result.justification}</p>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-300" />
            <span>
              Estimates do not account for daily price volatility, weight tare adjustments, or moisture penalties.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
