// CropDiary AI — Harvest-to-Sale Workflow Page
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  ArrowLeft,
  Wheat,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { storageAdapter } from '@/services/storageAdapter';
import { financeService } from './services/financeService';
import { Farm, Plot } from '@/types/database';
import { CropPlan } from '@/types/crop';
import { HarvestRecord, FarmDiaryEntry } from '@/types/diary';
import { HarvestSale, HarvestSaleFormData, HarvestBalance } from '@/types/finance';
import { HarvestSaleModal } from './components/HarvestSaleModal';

export const HarvestSalesPage: React.FC = () => {
  const { user } = useAuth();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [cropPlans, setCropPlans] = useState<CropPlan[]>([]);
  const [harvestBalances, setHarvestBalances] = useState<HarvestBalance[]>([]);
  const [sales, setSales] = useState<HarvestSale[]>([]);
  const [harvestRecords, setHarvestRecords] = useState<HarvestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHarvest, setSelectedHarvest] = useState<HarvestRecord | null>(null);
  const [saleToEdit, setSaleToEdit] = useState<HarvestSale | null>(null);

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

      const [balances, allSales, diaryHarvests] = await Promise.all([
        financeService.getHarvestBalances(user.id),
        financeService.getHarvestSales(user.id),
        storageAdapter.getDiaryEntries(user.id, { entryType: 'harvest' }),
      ]);

      setHarvestBalances(balances);
      setSales(allSales);

      const rawHarvests: HarvestRecord[] = diaryHarvests
        .map((e: FarmDiaryEntry) => e.harvest)
        .filter((h: HarvestRecord | null | undefined): h is HarvestRecord => Boolean(h));
      setHarvestRecords(rawHarvests);
    } catch (err) {
      console.error('Error loading harvest sales:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSaveSale = async (data: HarvestSaleFormData) => {
    if (!user) return;
    if (saleToEdit) {
      await financeService.updateHarvestSale(user.id, saleToEdit.id, data);
    } else {
      await financeService.createHarvestSale(user.id, data);
    }
    await loadData();
  };

  const handleDeleteSale = async (id: string) => {
    if (!user) return;
    if (window.confirm('Delete this produce sale record?')) {
      await financeService.deleteHarvestSale(user.id, id);
      await loadData();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
            Harvest-to-Sale Reconciliation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Connect physical harvested crop yields to commercial sales, track unsold storage balance, and account for freight deductions
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedHarvest(null);
            setSaleToEdit(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-agri-700 hover:bg-agri-800 shadow-xs transition-all min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>Record Produce Sale</span>
        </button>
      </div>

      {/* 1. Harvest Inventory & Balance Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wheat className="w-5 h-5 text-agri-700" />
            <h2 className="text-base font-bold text-slate-900">
              Harvested Produce Inventory & Sales Status
            </h2>
          </div>
          <Link
            to="/app/diary"
            className="text-xs font-semibold text-agri-700 hover:underline flex items-center gap-1"
          >
            <span>View Diary Harvests</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
          </div>
        ) : harvestBalances.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {harvestBalances.map((bal) => {
              const matchingHarvest = harvestRecords.find((h) => h.id === bal.harvestRecordId);

              return (
                <div
                  key={bal.harvestRecordId}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{bal.cropName}</h3>
                      <span className="text-xs text-slate-500">
                        {bal.quantityHarvested} {bal.unit} harvested
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        bal.remainingUnsoldQuantity > 0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {bal.remainingUnsoldQuantity > 0
                        ? `${bal.remainingUnsoldQuantity} ${bal.unit} In Stock`
                        : 'Fully Sold'}
                    </span>
                  </div>

                  {/* Quantities breakdown */}
                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between">
                      <span>Household Retained:</span>
                      <span className="font-semibold">{bal.quantityRetainedHousehold} {bal.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Sold:</span>
                      <span className="font-semibold text-slate-900">{bal.totalQuantitySold} {bal.unit}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200">
                      <span>Remaining Balance:</span>
                      <span>{bal.remainingUnsoldQuantity} {bal.unit}</span>
                    </div>
                  </div>

                  {/* Revenue metrics */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div>
                      <span className="text-slate-400 block">Gross Revenue:</span>
                      <span className="text-sm font-bold text-slate-900">
                        ₹{bal.totalGrossRevenue.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block">Net Proceeds:</span>
                      <span className="text-sm font-bold text-emerald-700">
                        ₹{bal.netProceeds.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Action button */}
                  {bal.remainingUnsoldQuantity > 0 && matchingHarvest && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedHarvest(matchingHarvest);
                        setSaleToEdit(null);
                        setIsModalOpen(true);
                      }}
                      className="w-full py-2 px-3 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all min-h-[36px]"
                    >
                      Sell From This Harvest
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-slate-500 text-sm">
            <Wheat className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No Harvest Records Recorded Yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              When you record a harvest in your Farm Diary, it will appear here so you can track sales and unsold storage inventory.
            </p>
          </div>
        )}
      </div>

      {/* 2. Completed Sales Ledger Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-agri-700" />
            <h2 className="text-lg font-bold text-slate-900">Recorded Produce Sales</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {sales.length} transactions recorded
          </span>
        </div>

        {sales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Crop Sold</th>
                  <th className="py-3 px-3">Quantity</th>
                  <th className="py-3 px-3">Rate</th>
                  <th className="py-3 px-3 text-right">Gross (₹)</th>
                  <th className="py-3 px-3 text-right">Selling Costs</th>
                  <th className="py-3 px-3 text-right">Net In-Hand (₹)</th>
                  <th className="py-3 px-3">Buyer / Mandi</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">
                      {sale.sale_date}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {sale.crop_name}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {sale.quantity_sold} {sale.quantity_unit}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      ₹{sale.unit_price}/{sale.price_unit.replace('per_', '')}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      ₹{sale.gross_revenue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right text-rose-600 font-medium">
                      {sale.selling_cost > 0 ? `-₹${sale.selling_cost.toLocaleString('en-IN')}` : '₹0'}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-700 text-sm">
                      ₹{sale.net_proceeds.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {sale.buyer_market || '—'}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          setSaleToEdit(sale);
                          setIsModalOpen(true);
                        }}
                        aria-label={`Edit sale of ${sale.crop_name}`}
                        className="text-agri-700 hover:text-agri-900 font-semibold hover:underline mr-3"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSale(sale.id)}
                        aria-label={`Delete sale of ${sale.crop_name}`}
                        className="text-rose-600 hover:text-rose-800 font-semibold hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-sm">
            <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p>No produce sales recorded yet.</p>
          </div>
        )}
      </div>

      <HarvestSaleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedHarvest(null);
          setSaleToEdit(null);
        }}
        onSave={handleSaveSale}
        harvestRecord={selectedHarvest}
        saleToEdit={saleToEdit}
        existingSales={sales}
        farms={farms}
        plots={plots}
        cropPlans={cropPlans}
      />
    </div>
  );
};
