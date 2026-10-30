import { Farm, FarmWithPlots, RecordStatus } from '@/types/database';
import { storageAdapter } from './storageAdapter';
import { FarmFormData } from '@/lib/validation/farmSchemas';

export const farmService = {
  async getFarms(userId: string): Promise<Farm[]> {
    return storageAdapter.getFarms(userId);
  },

  async getFarmsWithPlots(userId: string): Promise<FarmWithPlots[]> {
    const farms = await storageAdapter.getFarms(userId);
    const plots = await storageAdapter.getPlots(userId);

    return farms.map((farm) => ({
      ...farm,
      plots: plots.filter((plot) => plot.farm_id === farm.id),
    }));
  },

  async getFarmById(userId: string, farmId: string): Promise<FarmWithPlots | null> {
    const farm = await storageAdapter.getFarmById(userId, farmId);
    if (!farm) return null;

    const plots = await storageAdapter.getPlots(userId, farmId);
    return { ...farm, plots };
  },

  async createFarm(userId: string, data: FarmFormData): Promise<Farm> {
    return storageAdapter.createFarm(userId, {
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      country: data.country,
      state: data.state.trim(),
      district: data.district.trim(),
      village: data.village?.trim() || undefined,
      area: Number(data.area),
      area_unit: data.area_unit,
      farming_type: data.farming_type,
      soil_type: data.soil_type,
      irrigation_method: data.irrigation_method,
      water_availability: data.water_availability,
      latitude: data.latitude ? Number(data.latitude) : undefined,
      longitude: data.longitude ? Number(data.longitude) : undefined,
      status: data.status,
    });
  },

  async updateFarm(userId: string, farmId: string, data: Partial<FarmFormData>): Promise<Farm> {
    const updates: Partial<Farm> = {};
    if (data.name !== undefined) updates.name = data.name.trim();
    if (data.description !== undefined) updates.description = data.description?.trim();
    if (data.country !== undefined) updates.country = data.country;
    if (data.state !== undefined) updates.state = data.state.trim();
    if (data.district !== undefined) updates.district = data.district.trim();
    if (data.village !== undefined) updates.village = data.village?.trim();
    if (data.area !== undefined) updates.area = Number(data.area);
    if (data.area_unit !== undefined) updates.area_unit = data.area_unit;
    if (data.farming_type !== undefined) updates.farming_type = data.farming_type;
    if (data.soil_type !== undefined) updates.soil_type = data.soil_type;
    if (data.irrigation_method !== undefined) updates.irrigation_method = data.irrigation_method;
    if (data.water_availability !== undefined) updates.water_availability = data.water_availability;
    if (data.latitude !== undefined) updates.latitude = data.latitude ? Number(data.latitude) : undefined;
    if (data.longitude !== undefined) updates.longitude = data.longitude ? Number(data.longitude) : undefined;
    if (data.status !== undefined) updates.status = data.status;

    return storageAdapter.updateFarm(userId, farmId, updates);
  },

  async toggleFarmStatus(userId: string, farmId: string, currentStatus: RecordStatus): Promise<Farm> {
    const nextStatus: RecordStatus = currentStatus === 'active' ? 'archived' : 'active';
    return storageAdapter.updateFarmStatus(userId, farmId, nextStatus);
  },

  async deleteFarm(userId: string, farmId: string): Promise<void> {
    return storageAdapter.deleteFarm(userId, farmId);
  },
};
