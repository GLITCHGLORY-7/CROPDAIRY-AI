import { Plot, RecordStatus } from '@/types/database';
import { storageAdapter } from './storageAdapter';
import { PlotFormData } from '@/lib/validation/farmSchemas';
import { convertToAcres } from '@/lib/formatters';

export const plotService = {
  async getPlots(userId: string, farmId?: string): Promise<Plot[]> {
    return storageAdapter.getPlots(userId, farmId);
  },

  async getPlotById(userId: string, plotId: string): Promise<Plot | null> {
    return storageAdapter.getPlotById(userId, plotId);
  },

  async createPlot(userId: string, data: PlotFormData): Promise<Plot> {
    // 1. Verify parent farm exists and belongs to user
    const parentFarm = await storageAdapter.getFarmById(userId, data.farm_id);
    if (!parentFarm) {
      throw new Error('Parent farm not found or unauthorized');
    }

    // 2. Validate plot area relative to farm area
    const plotAcres = convertToAcres(Number(data.area), data.area_unit);
    const farmAcres = convertToAcres(parentFarm.area, parentFarm.area_unit);

    // If plot exceeds farm area with a 10% measurement buffer, reject
    if (plotAcres > farmAcres * 1.1) {
      throw new Error(
        `Plot area (${data.area} ${data.area_unit}) exceeds parent farm area (${parentFarm.area} ${parentFarm.area_unit}). Please adjust the plot area.`
      );
    }

    return storageAdapter.createPlot(userId, {
      farm_id: data.farm_id,
      name: data.name.trim(),
      area: Number(data.area),
      area_unit: data.area_unit,
      soil_type: data.soil_type,
      irrigation_method: data.irrigation_method,
      farming_environment: data.farming_environment,
      notes: data.notes?.trim() || undefined,
      status: data.status,
    });
  },

  async updatePlot(userId: string, plotId: string, data: Partial<PlotFormData>): Promise<Plot> {
    const existing = await storageAdapter.getPlotById(userId, plotId);
    if (!existing) {
      throw new Error('Plot not found or unauthorized');
    }

    if (data.area !== undefined && data.farm_id) {
      const parentFarm = await storageAdapter.getFarmById(userId, data.farm_id);
      if (parentFarm) {
        const plotAcres = convertToAcres(Number(data.area), data.area_unit || existing.area_unit);
        const farmAcres = convertToAcres(parentFarm.area, parentFarm.area_unit);
        if (plotAcres > farmAcres * 1.1) {
          throw new Error(
            `Plot area exceeds parent farm area (${parentFarm.area} ${parentFarm.area_unit}).`
          );
        }
      }
    }

    const updates: Partial<Plot> = {};
    if (data.name !== undefined) updates.name = data.name.trim();
    if (data.area !== undefined) updates.area = Number(data.area);
    if (data.area_unit !== undefined) updates.area_unit = data.area_unit;
    if (data.soil_type !== undefined) updates.soil_type = data.soil_type;
    if (data.irrigation_method !== undefined) updates.irrigation_method = data.irrigation_method;
    if (data.farming_environment !== undefined) updates.farming_environment = data.farming_environment;
    if (data.notes !== undefined) updates.notes = data.notes?.trim();
    if (data.status !== undefined) updates.status = data.status;

    return storageAdapter.updatePlot(userId, plotId, updates);
  },

  async togglePlotStatus(userId: string, plotId: string, currentStatus: RecordStatus): Promise<Plot> {
    const nextStatus: RecordStatus = currentStatus === 'active' ? 'archived' : 'active';
    return storageAdapter.updatePlotStatus(userId, plotId, nextStatus);
  },

  async deletePlot(userId: string, plotId: string): Promise<void> {
    return storageAdapter.deletePlot(userId, plotId);
  },
};
