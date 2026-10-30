// CropDiary AI — Phase 8: Multi-Season Farm History & Longitudinal Analytics Page
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { storageAdapter } from '@/services/storageAdapter';
import { historyService, FarmHistorySummary } from './services/historyService';
import { Farm } from '@/types/database';
import {
  History,
  Download,
  Printer,
  Calendar,
  IndianRupee,
  Package,
  TrendingUp,
  TrendingDown,
  Sprout,
  Filter,
  CheckCircle2,
  Bug,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const FarmHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('all');
  const [summary, setSummary] = useState<FarmHistorySummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    async function loadHistoryData() {
      try {
        setIsLoading(true);
        const [userFarms, historyData] = await Promise.all([
          storageAdapter.getFarms(user!.id),
          historyService.getMultiSeasonHistory(user!.id, selectedFarmId !== 'all' ? selectedFarmId : undefined),
        ]);

        if (!isMounted) return;
        setFarms(userFarms);
        setSummary(historyData);
      } catch (err) {
        console.error('Failed to load multi-season history:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadHistoryData();
    return () => {
      isMounted = false;
    };
  }, [user, selectedFarmId]);

  const handleExportCSV = () => {
    if (!summary || summary.seasonalReports.length === 0) return;
    const csvContent = historyService.generateCSV(summary.seasonalReports);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cropdiary_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-left">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <History className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Longitudinal Performance Ledger
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Multi-Season Farm History & Analytics
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Compare season-by-season yields, cost-per-quintal economics, and pest occurrences across your agricultural timeline.
          </p>
        </div>

        {/* Action buttons & Farm Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Farm filter */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              aria-label="Filter historical data by farm"
              className="bg-transparent border-0 focus:outline-hidden text-slate-800 dark:text-slate-200 text-xs font-medium cursor-pointer"
            >
              <option value="all">All Farms Combined</option>
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={!summary || summary.seasonalReports.length === 0}
            className="gap-1.5 text-xs shadow-2xs"
            aria-label="Download CSV Report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs shadow-2xs"
            aria-label="Print historical records"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Reconciling multi-season harvest and financial ledgers...</p>
        </div>
      ) : !summary || summary.seasonalReports.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-slate-300 dark:border-slate-700 space-y-4">
          <History className="w-12 h-12 text-slate-400 mx-auto" />
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              No Multi-Season Records Available Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              To establish historical season comparisons, save crop plans in the Smart Crop Planner and record corresponding harvest yields and field expenses in the Farm Diary.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            <Card className="p-4 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[11px] font-semibold uppercase text-slate-500 block">
                Seasons Tracked
              </span>
              <div className="flex items-center gap-2 mt-1.5">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                  {summary.totalSeasonsTracked}
                </span>
              </div>
            </Card>

            <Card className="p-4 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[11px] font-semibold uppercase text-slate-500 block">
                Total Production
              </span>
              <div className="flex items-center gap-2 mt-1.5">
                <Package className="w-5 h-5 text-indigo-600" />
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                  {Math.round((summary.totalHistoricalYieldKg / 100) * 10) / 10} <span className="text-xs font-normal text-slate-500">Qtl</span>
                </span>
              </div>
            </Card>

            <Card className="p-4 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[11px] font-semibold uppercase text-slate-500 block">
                Historical Revenue
              </span>
              <div className="flex items-center gap-2 mt-1.5">
                <IndianRupee className="w-5 h-5 text-emerald-600" />
                <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  ₹{summary.totalHistoricalRevenueINR.toLocaleString('en-IN')}
                </span>
              </div>
            </Card>

            <Card className="p-4 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[11px] font-semibold uppercase text-slate-500 block">
                Net Cumulative Profit
              </span>
              <div className="flex items-center gap-2 mt-1.5">
                {summary.netHistoricalProfitINR >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-rose-600" />
                )}
                <span
                  className={`text-xl font-bold font-mono ${
                    summary.netHistoricalProfitINR >= 0
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  ₹{summary.netHistoricalProfitINR.toLocaleString('en-IN')}
                </span>
              </div>
            </Card>

            <Card className="p-4 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs col-span-2 lg:col-span-1">
              <span className="text-[11px] font-semibold uppercase text-slate-500 block">
                Avg Profit / Acre
              </span>
              <div className="flex items-center gap-2 mt-1.5">
                <Sprout className="w-5 h-5 text-teal-600" />
                <span className="text-xl font-bold font-mono text-teal-700 dark:text-teal-300">
                  ₹{summary.overallAverageProfitPerAcreINR.toLocaleString('en-IN')}
                </span>
              </div>
            </Card>
          </div>

          {/* Historical Seasons Comparison Table */}
          <Card className="overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/60 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Seasonal Cultivation & Financial Performance Breakdown
                </h3>
                <p className="text-xs text-slate-500">
                  Verified season records reconciled from crop plans, harvests, and expense ledgers.
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {summary.seasonalReports.length} records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Season & Year</th>
                    <th className="py-3 px-4">Crop & Plot</th>
                    <th className="py-3 px-4 text-right">Area</th>
                    <th className="py-3 px-4 text-right">Cost (₹)</th>
                    <th className="py-3 px-4 text-right">Yield (Qtl)</th>
                    <th className="py-3 px-4 text-right">Revenue (₹)</th>
                    <th className="py-3 px-4 text-right">Net Profit (₹)</th>
                    <th className="py-3 px-4 text-right">Cost / Qtl</th>
                    <th className="py-3 px-4 text-right">Profit / Acre</th>
                    <th className="py-3 px-4 text-center">Pest Incidents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {summary.seasonalReports.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                          {report.seasonName} {report.year}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                          Sown: {new Date(report.sowingDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{report.cropName}</div>
                        <div className="text-[11px] text-slate-500">{report.farmName} • {report.plotName || 'All'}</div>
                        {report.dataCompleteness === 'in_progress' && (
                          <span
                            title={report.completenessNotes?.join(' ')}
                            className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"
                          >
                            Active / In Progress
                          </span>
                        )}
                        {report.dataCompleteness === 'expenses_only' && (
                          <span
                            title={report.completenessNotes?.join(' ')}
                            className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-sky-50 text-sky-700 border border-sky-200"
                          >
                            Harvest Stored (Unsold)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-medium">
                        {report.areaAcres} Ac
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-medium text-rose-600 dark:text-rose-400">
                        ₹{report.totalCostINR.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {report.yieldQuintals > 0 ? `${report.yieldQuintals} Qtl` : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">
                        ₹{report.grossRevenueINR.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span
                          className={
                            report.netProfitINR >= 0
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }
                        >
                          ₹{report.netProfitINR.toLocaleString('en-IN')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                        {report.costPerQuintalINR > 0 ? `₹${report.costPerQuintalINR.toLocaleString('en-IN')}` : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-teal-700 dark:text-teal-300">
                        ₹{report.profitPerAcreINR.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {report.diseaseEventsCount > 0 ? (
                          <span
                            title={report.pestSummary.join(', ')}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200"
                          >
                            <Bug className="w-3 h-3 text-amber-600" />
                            <span>{report.diseaseEventsCount}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Audit & Integrity Transparency Notice */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                Deterministic Ledger Grounding
              </span>
              <span>
                All multi-season metrics, costs, and profits are strictly aggregated from your authenticated farm plans, diary entries, and financial ledgers. Zero fabricated historical averages or simulated yields are generated.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
