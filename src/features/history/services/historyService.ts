// CropDiary AI — Phase 8 Multi-Season Farm History & Longitudinal Analytics Service
// Computes season-by-season performance metrics, yield-to-cost reconciliation, and exportable agricultural ledgers.

import { storageAdapter } from '@/services/storageAdapter';
import { convertToKg } from '@/features/finance/services/financialCalculationEngine';

export interface SeasonalPerformanceReport {
  id: string;
  seasonName: string;
  year: number;
  cropName: string;
  farmId: string;
  farmName: string;
  plotId?: string | null;
  plotName?: string;
  areaAcres: number;
  totalCostINR: number;
  yieldKg: number;
  yieldQuintals: number;
  grossRevenueINR: number;
  netProfitINR: number;
  costPerQuintalINR: number;
  profitPerAcreINR: number;
  sowingDate: string;
  harvestDate?: string;
  diseaseEventsCount: number;
  pestSummary: string[];
  dataCompleteness?: 'complete' | 'in_progress' | 'expenses_only' | 'partial_sales';
  completenessNotes?: string[];
}

export interface FarmHistorySummary {
  totalSeasonsTracked: number;
  totalHistoricalYieldKg: number;
  totalHistoricalRevenueINR: number;
  totalHistoricalExpensesINR: number;
  netHistoricalProfitINR: number;
  overallAverageProfitPerAcreINR: number;
  seasonalReports: SeasonalPerformanceReport[];
}

export const historyService = {
  async getMultiSeasonHistory(
    userId: string,
    farmIdFilter?: string
  ): Promise<FarmHistorySummary> {
    const [farms, plots, plans, diaryEntries, transactions, assessments] =
      await Promise.all([
        storageAdapter.getFarms(userId),
        farmIdFilter && farmIdFilter !== 'all'
          ? storageAdapter.getPlots(userId, farmIdFilter)
          : storageAdapter.getFarms(userId).then(async (fms) => {
              const plotArrays = await Promise.all(fms.map((f) => storageAdapter.getPlots(userId, f.id)));
              return plotArrays.flat();
            }),
        storageAdapter.getCropPlans(userId),
        storageAdapter.getDiaryEntries(userId),
        storageAdapter.getFinancialTransactions(userId),
        storageAdapter.getAssessments(userId),
      ]);

    const farmMap = new Map(farms.map((f) => [f.id, f.name]));
    const plotMap = new Map(plots.map((p) => [p.id, p]));

    // Filter by farm if specified
    const filteredPlans = farmIdFilter && farmIdFilter !== 'all'
      ? plans.filter((p) => p.farm_id === farmIdFilter)
      : plans;

    const seasonalReports: SeasonalPerformanceReport[] = [];

    // Group performance by crop plan
    for (const plan of filteredPlans) {
      const farmName = farmMap.get(plan.farm_id) || 'Unknown Farm';
      const plot = plan.plot_id ? plotMap.get(plan.plot_id) : undefined;
      const plotName = plot ? plot.name : 'All Plots';
      const areaAcres = plot ? plot.area : (farms.find((f) => f.id === plan.farm_id)?.area || 1);

      // Reconcile expenses for this crop plan or farm during crop plan dates
      const planExpenses = transactions.filter(
        (t) =>
          t.transaction_type === 'expense' &&
          (t.crop_plan_id === plan.id ||
            (t.farm_id === plan.farm_id &&
              new Date(t.occurred_at) >= new Date(plan.sowing_date)))
      );
      const totalCostINR = planExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

      // Reconcile harvest yields for this plan
      const planHarvestEntries = diaryEntries.filter(
        (e) =>
          e.entry_type === 'harvest' &&
          (e.crop_plan_id === plan.id ||
            (e.farm_id === plan.farm_id &&
              new Date(e.occurred_at) >= new Date(plan.sowing_date)))
      );

      let yieldKg = 0;
      let lastHarvestDate: string | undefined = undefined;

      for (const hEntry of planHarvestEntries) {
        if (hEntry.harvest) {
          const qty = Number(hEntry.harvest.quantity_harvested) || 0;
          const unit = hEntry.harvest.unit || 'Quintals';
          yieldKg += convertToKg(qty, unit);
          lastHarvestDate = hEntry.occurred_at;
        }
      }

      // Reconcile sales revenue
      const planSales = transactions.filter(
        (t) =>
          (t.transaction_type === 'sale_revenue' || t.transaction_type === 'other_income') &&
          (t.crop_plan_id === plan.id ||
            (t.farm_id === plan.farm_id &&
              new Date(t.occurred_at) >= new Date(plan.sowing_date)))
      );
      const grossRevenueINR = planSales.reduce((sum, s) => sum + Number(s.amount), 0);
      const netProfitINR = grossRevenueINR - totalCostINR;

      const yieldQuintals = Math.round((yieldKg / 100) * 10) / 10;
      const costPerQuintalINR =
        yieldQuintals > 0 ? Math.round(totalCostINR / yieldQuintals) : 0;
      const profitPerAcreINR =
        areaAcres > 0 ? Math.round(netProfitINR / areaAcres) : 0;

      // Reconcile disease events from Crop Doctor
      const planAssessments = assessments.filter(
        (a) =>
          a.crop_plan_id === plan.id ||
          (a.farm_id === plan.farm_id &&
            new Date(a.created_at) >= new Date(plan.sowing_date))
      );
      const pestSummary = Array.from(
        new Set(planAssessments.map((a) => a.primary_diagnosis).filter(Boolean))
      );

      const year = new Date(plan.sowing_date).getFullYear() || new Date().getFullYear();

      // Assess data completeness to prevent misleading season-to-season comparisons
      let dataCompleteness: 'complete' | 'in_progress' | 'expenses_only' | 'partial_sales' = 'complete';
      const completenessNotes: string[] = [];

      if (!lastHarvestDate && new Date(plan.sowing_date) <= new Date()) {
        dataCompleteness = 'in_progress';
        completenessNotes.push('Cultivation in progress: Harvest not yet reached; realized revenues are pending.');
      } else if (totalCostINR > 0 && grossRevenueINR === 0 && yieldQuintals > 0) {
        dataCompleteness = 'expenses_only';
        completenessNotes.push('Harvest logged but zero sales recorded; harvest inventory is unsold or household-retained.');
      } else if (totalCostINR === 0 && grossRevenueINR === 0) {
        dataCompleteness = 'in_progress';
        completenessNotes.push('No financial records attached to this season.');
      } else if (grossRevenueINR > 0 && yieldQuintals > 0) {
        dataCompleteness = 'complete';
        completenessNotes.push('Full season recorded: expenses, yield, and sales reconciled.');
      }

      seasonalReports.push({
        id: plan.id,
        seasonName: plan.season,
        year,
        cropName: plan.selected_crop_name || (plan as any).crop_name || 'Crop',
        farmId: plan.farm_id,
        farmName,
        plotId: plan.plot_id,
        plotName,
        areaAcres,
        totalCostINR,
        yieldKg,
        yieldQuintals,
        grossRevenueINR,
        netProfitINR,
        costPerQuintalINR,
        profitPerAcreINR,
        sowingDate: plan.sowing_date,
        harvestDate: lastHarvestDate,
        diseaseEventsCount: planAssessments.length,
        pestSummary,
        dataCompleteness,
        completenessNotes,
      });
    }

    // Sort newest seasons first
    seasonalReports.sort((a, b) => new Date(b.sowingDate).getTime() - new Date(a.sowingDate).getTime());

    // Aggregate overall metrics
    const totalHistoricalYieldKg = seasonalReports.reduce((sum, r) => sum + r.yieldKg, 0);
    const totalHistoricalRevenueINR = seasonalReports.reduce((sum, r) => sum + r.grossRevenueINR, 0);
    const totalHistoricalExpensesINR = seasonalReports.reduce((sum, r) => sum + r.totalCostINR, 0);
    const netHistoricalProfitINR = totalHistoricalRevenueINR - totalHistoricalExpensesINR;

    const totalAcres = seasonalReports.reduce((sum, r) => sum + r.areaAcres, 0);
    const overallAverageProfitPerAcreINR =
      totalAcres > 0 ? Math.round(netHistoricalProfitINR / totalAcres) : 0;

    return {
      totalSeasonsTracked: seasonalReports.length,
      totalHistoricalYieldKg,
      totalHistoricalRevenueINR,
      totalHistoricalExpensesINR,
      netHistoricalProfitINR,
      overallAverageProfitPerAcreINR,
      seasonalReports,
    };
  },

  /**
   * Export seasonal performance data as standard CSV text format.
   */
  generateCSV(reports: SeasonalPerformanceReport[]): string {
    const headers = [
      'Season',
      'Year',
      'Crop',
      'Farm',
      'Plot',
      'Area (Acres)',
      'Total Cultivation Cost (INR)',
      'Yield (Quintals)',
      'Gross Revenue (INR)',
      'Net Profit (INR)',
      'Cost per Quintal (INR)',
      'Profit per Acre (INR)',
      'Pest/Disease Incidents',
    ];

    const rows = reports.map((r) => [
      `"${r.seasonName}"`,
      r.year,
      `"${r.cropName}"`,
      `"${r.farmName}"`,
      `"${r.plotName || 'All'}"`,
      r.areaAcres,
      r.totalCostINR,
      r.yieldQuintals,
      r.grossRevenueINR,
      r.netProfitINR,
      r.costPerQuintalINR,
      r.profitPerAcreINR,
      r.diseaseEventsCount,
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  },
};
