// CropDiary AI — TypeScript Database Models

export type AreaUnit = 'Acres' | 'Hectares' | 'Bigha' | 'Guntha';

export type FarmingType = 
  | 'Open field'
  | 'Orchard'
  | 'Greenhouse'
  | 'Kitchen garden'
  | 'Mixed farming'
  | 'Other';

export type SoilType =
  | 'Clay'
  | 'Clay Loam'
  | 'Sandy Loam'
  | 'Red Soil'
  | 'Black Soil'
  | 'Alluvial'
  | 'Silty Loam'
  | 'Other';

export type IrrigationMethod =
  | 'Drip'
  | 'Sprinkler'
  | 'Flood/Furrow'
  | 'Rainfed'
  | 'Borewell Canal'
  | 'Manual';

export type WaterAvailability =
  | 'Adequate'
  | 'Seasonal'
  | 'Scarce'
  | 'Rain-dependent';

export type RecordStatus = 'active' | 'archived';

export interface Profile {
  id: string;
  display_name: string;
  preferred_language: 'en' | 'ta' | 'hi';
  country: string;
  state: string;
  district: string;
  preferred_area_unit: AreaUnit;
  farming_experience?: string;
  primary_farming_type?: FarmingType;
  created_at: string;
  updated_at: string;
}

export interface Farm {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  country: string;
  state: string;
  district: string;
  village?: string;
  area: number;
  area_unit: AreaUnit;
  farming_type: FarmingType;
  soil_type: SoilType;
  irrigation_method: IrrigationMethod;
  water_availability: WaterAvailability;
  latitude?: number;
  longitude?: number;
  status: RecordStatus;
  created_at: string;
  updated_at: string;
}

export interface Plot {
  id: string;
  farm_id: string;
  owner_id: string;
  name: string;
  area: number;
  area_unit: AreaUnit;
  soil_type: SoilType;
  irrigation_method: IrrigationMethod;
  farming_environment: FarmingType;
  notes?: string;
  status: RecordStatus;
  created_at: string;
  updated_at: string;
}

export interface FarmWithPlots extends Farm {
  plots: Plot[];
}
