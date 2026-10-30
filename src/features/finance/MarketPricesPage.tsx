// CropDiary AI — Mandi Market Prices & Selling Insights Page
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calculator,
  RefreshCw,
} from 'lucide-react';
import { marketPriceService } from './services/marketPriceService';
import { MarketPriceResponse } from './services/IMarketPriceProvider';
import { SellingCalculator } from './components/SellingCalculator';

export const MarketPricesPage: React.FC = () => {
  const { commodity: routeCommodity } = useParams<{ commodity?: string }>();

  const [activeTab, setActiveTab] = useState<'prices' | 'calculator'>('prices');
  const [commodities, setCommodities] = useState<string[]>([]);
  const [statesDistricts, setStatesDistricts] = useState<Record<string, string[]>>({});

  const [selectedCommodity, setSelectedCommodity] = useState<string>(
    routeCommodity || 'Paddy(Dhan)'
  );
  const [selectedState, setSelectedState] = useState<string>('Tamil Nadu');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');

  const [marketResponse, setMarketResponse] = useState<MarketPriceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // For passing into calculator
  const [calcCrop, setCalcCrop] = useState('Paddy(Dhan)');
  const [calcRate, setCalcRate] = useState(2280);

  useEffect(() => {
    const initCatalogs = async () => {
      const [comms, geo] = await Promise.all([
        marketPriceService.getCommodities(),
        marketPriceService.getStatesAndDistricts(),
      ]);
      setCommodities(comms);
      setStatesDistricts(geo);
    };
    initCatalogs();
  }, []);

  const fetchPrices = async () => {
    try {
      setIsLoading(true);
      const res = await marketPriceService.getMarketPrices({
        commodity: selectedCommodity,
        state: selectedState !== 'all' ? selectedState : undefined,
        district: selectedDistrict !== 'all' ? selectedDistrict : undefined,
      });
      setMarketResponse(res);
    } catch (err) {
      console.error('Error fetching mandi prices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, [selectedCommodity, selectedState, selectedDistrict]);

  const prices = marketResponse?.data || [];
  const metrics = marketPriceService.compareMandiRates(prices);

  const availableDistricts = selectedState && statesDistricts[selectedState]
    ? statesDistricts[selectedState]
    : [];

  const handleOpenCalculatorWithPrice = (commodity: string, modalPrice: number) => {
    setCalcCrop(commodity);
    setCalcRate(modalPrice);
    setActiveTab('calculator');
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
            Agricultural Market & Mandi Prices
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified APMC mandi rates from Agmarknet & the Directorate of Marketing & Inspection (DMI)
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('prices')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[36px] ${
              activeTab === 'prices'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mandi Price Feed
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('calculator')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[36px] flex items-center gap-1.5 ${
              activeTab === 'calculator'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-agri-600" />
            <span>Net Proceeds Calculator</span>
          </button>
        </div>
      </div>

      {/* Provider Status & Attribution Banner */}
      {marketResponse && (
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-900">
            <Building2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>
              <strong>Source:</strong> {marketResponse.source} •{' '}
              {marketResponse.statusMessage}
            </span>
          </div>
          <div className="flex items-center gap-3 text-emerald-800 font-medium flex-shrink-0">
            <span>Retrieved: {marketResponse.retrievedAt.slice(0, 10)}</span>
            <button
              type="button"
              onClick={fetchPrices}
              aria-label="Refresh mandi rates"
              className="p-1 hover:bg-emerald-100 rounded-md transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'calculator' ? (
        <SellingCalculator
          initialCrop={calcCrop}
          initialMandiRate={calcRate}
        />
      ) : (
        <>
          {/* Filters Bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="mandi-commodity" className="block text-xs font-semibold text-slate-600 mb-1">
                Commodity / Crop
              </label>
              <select
                id="mandi-commodity"
                value={selectedCommodity}
                onChange={(e) => setSelectedCommodity(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-medium"
              >
                <option value="all">All Commodities</option>
                {commodities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="mandi-state" className="block text-xs font-semibold text-slate-600 mb-1">
                State
              </label>
              <select
                id="mandi-state"
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedDistrict('all');
                }}
                className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800"
              >
                <option value="all">All States</option>
                {Object.keys(statesDistricts).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="mandi-district" className="block text-xs font-semibold text-slate-600 mb-1">
                District
              </label>
              <select
                id="mandi-district"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800"
              >
                <option value="all">All Districts</option>
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Spread Summary Cards */}
          {prices.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Average Modal Price
                </span>
                <span className="text-xl font-extrabold text-slate-900 mt-1 block">
                  ₹{metrics.averageModal.toLocaleString('en-IN')}/Qtl
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  ≈ ₹{(metrics.averageModal / 100).toFixed(2)}/kg
                </span>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Highest Mandi Rate
                </span>
                <span className="text-xl font-extrabold text-emerald-700 mt-1 block">
                  ₹{metrics.highest?.modal_price.toLocaleString('en-IN') || 0}/Qtl
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
                  {metrics.highest?.market_name || '—'}
                </span>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Lowest Mandi Rate
                </span>
                <span className="text-xl font-extrabold text-amber-700 mt-1 block">
                  ₹{metrics.lowest?.modal_price.toLocaleString('en-IN') || 0}/Qtl
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
                  {metrics.lowest?.market_name || '—'}
                </span>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Market Spread
                </span>
                <span className="text-xl font-extrabold text-slate-800 mt-1 block">
                  ₹{metrics.spread.toLocaleString('en-IN')}/Qtl
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Arbitrage gap across mandis
                </span>
              </div>
            </div>
          )}

          {/* Mandi Observations Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            {prices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Market / Mandi</th>
                      <th className="py-3 px-4">District & State</th>
                      <th className="py-3 px-4">Commodity & Variety</th>
                      <th className="py-3 px-4 text-right">Min Rate (₹/Qtl)</th>
                      <th className="py-3 px-4 text-right">Max Rate (₹/Qtl)</th>
                      <th className="py-3 px-4 text-right">Modal Rate (₹/Qtl)</th>
                      <th className="py-3 px-4 text-right">Rate / kg</th>
                      <th className="py-3 px-4 text-center">Arrival Date</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {prices.map((p) => {
                      const ratePerKg = (p.modal_price / 100).toFixed(2);

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {p.market_name}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {p.district}, {p.state}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-800 block">
                              {p.commodity}
                            </span>
                            {p.variety && (
                              <span className="text-[10px] text-slate-400">
                                {p.variety}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-600">
                            ₹{p.min_price.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-600">
                            ₹{p.max_price.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-extrabold text-sm text-emerald-700">
                            ₹{p.modal_price.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                            ₹{ratePerKg}
                          </td>
                          <td className="py-3.5 px-4 text-center text-slate-500 whitespace-nowrap">
                            {p.arrival_date}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenCalculatorWithPrice(p.commodity, p.modal_price)}
                              className="text-xs font-bold text-agri-700 hover:text-agri-900 hover:underline inline-flex items-center gap-1"
                            >
                              <span>Net Proceeds</span>
                              <Calculator className="w-3.5 h-3.5" />
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
                <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No Mandi Prices Available</p>
                <p className="text-xs text-slate-400 mt-1">
                  Try selecting a different commodity or state to review published APMC trading records.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
