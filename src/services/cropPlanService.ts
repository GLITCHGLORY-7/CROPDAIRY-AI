import { CropPlan, PlanStatus, Season } from '@/types/crop';
import { storageAdapter } from './storageAdapter';

export const cropPlanService = {
  async getCropPlans(userId: string, farmId?: string, plotId?: string): Promise<CropPlan[]> {
    return storageAdapter.getCropPlans(userId, farmId, plotId);
  },

  async getCropPlanById(userId: string, planId: string): Promise<CropPlan | null> {
    return storageAdapter.getCropPlanById(userId, planId);
  },

  async createCropPlan(
    userId: string,
    planData: Omit<CropPlan, 'id' | 'owner_id' | 'created_at' | 'updated_at'>
  ): Promise<CropPlan> {
    return storageAdapter.createCropPlan(userId, planData);
  },

  async updateCropPlan(
    userId: string,
    planId: string,
    updates: Partial<CropPlan>
  ): Promise<CropPlan> {
    return storageAdapter.updateCropPlan(userId, planId, updates);
  },

  async updatePlanStatus(
    userId: string,
    planId: string,
    status: PlanStatus
  ): Promise<CropPlan> {
    return storageAdapter.updateCropPlan(userId, planId, { status });
  },

  async duplicateCropPlan(
    userId: string,
    planId: string,
    newSeason: Season,
    newSowingDate: string
  ): Promise<CropPlan> {
    const original = await storageAdapter.getCropPlanById(userId, planId);
    if (!original) throw new Error('Original plan not found');

    const duplicatedTitle = `${original.title} (${newSeason} Duplicate)`;

    // Calculate updated target harvest date based on duration
    const originalSowing = new Date(original.sowing_date);
    const originalHarvest = new Date(original.target_harvest_date);
    const durationDays = Math.max(
      30,
      Math.round((originalHarvest.getTime() - originalSowing.getTime()) / (1000 * 3600 * 24))
    );

    const nextHarvest = new Date(newSowingDate);
    nextHarvest.setDate(nextHarvest.getDate() + durationDays);

    return storageAdapter.createCropPlan(userId, {
      farm_id: original.farm_id,
      plot_id: original.plot_id,
      title: duplicatedTitle,
      status: 'Draft',
      selected_crop_id: original.selected_crop_id,
      selected_crop_name: original.selected_crop_name,
      sowing_date: newSowingDate,
      target_harvest_date: nextHarvest.toISOString().split('T')[0],
      season: newSeason,
      inputs: {
        ...original.inputs,
        planting_season: newSeason,
        intended_planting_date: newSowingDate,
      },
      selected_candidate_snapshot: original.selected_candidate_snapshot,
      shortlist_snapshots: original.shortlist_snapshots,
      estimated_total_cost: original.estimated_total_cost,
      illustrative_profit_estimate: original.illustrative_profit_estimate,
      timeline_stages: original.timeline_stages,
    });
  },

  async deleteCropPlan(userId: string, planId: string): Promise<void> {
    return storageAdapter.deleteCropPlan(userId, planId);
  },
};
