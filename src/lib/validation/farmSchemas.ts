import { z } from 'zod';

export const farmSchema = z.object({
  name: z.string().min(2, 'Farm name must be at least 2 characters').max(100),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional(),
  country: z.string().min(1, 'Country is required').default('India'),
  state: z.string().min(2, 'State is required'),
  district: z.string().min(2, 'District is required'),
  village: z.string().max(100).optional(),
  area: z.coerce.number().positive('Area must be greater than 0'),
  area_unit: z.enum(['Acres', 'Hectares', 'Bigha', 'Guntha']).default('Acres'),
  farming_type: z.enum([
    'Open field',
    'Orchard',
    'Greenhouse',
    'Kitchen garden',
    'Mixed farming',
    'Other'
  ]).default('Open field'),
  soil_type: z.enum([
    'Clay',
    'Clay Loam',
    'Sandy Loam',
    'Red Soil',
    'Black Soil',
    'Alluvial',
    'Silty Loam',
    'Other'
  ]).default('Clay Loam'),
  irrigation_method: z.enum([
    'Drip',
    'Sprinkler',
    'Flood/Furrow',
    'Rainfed',
    'Borewell Canal',
    'Manual'
  ]).default('Drip'),
  water_availability: z.enum([
    'Adequate',
    'Seasonal',
    'Scarce',
    'Rain-dependent'
  ]).default('Adequate'),
  latitude: z.coerce.number().min(-90).max(90).optional().or(z.literal('')),
  longitude: z.coerce.number().min(-180).max(180).optional().or(z.literal('')),
  status: z.enum(['active', 'archived']).default('active'),
});

export const plotSchema = z.object({
  name: z.string().min(2, 'Plot name must be at least 2 characters').max(100),
  farm_id: z.string().uuid('Parent farm must be selected'),
  area: z.coerce.number().positive('Area must be greater than 0'),
  area_unit: z.enum(['Acres', 'Hectares', 'Bigha', 'Guntha']).default('Acres'),
  soil_type: z.enum([
    'Clay',
    'Clay Loam',
    'Sandy Loam',
    'Red Soil',
    'Black Soil',
    'Alluvial',
    'Silty Loam',
    'Other'
  ]).default('Clay Loam'),
  irrigation_method: z.enum([
    'Drip',
    'Sprinkler',
    'Flood/Furrow',
    'Rainfed',
    'Borewell Canal',
    'Manual'
  ]).default('Drip'),
  farming_environment: z.enum([
    'Open field',
    'Orchard',
    'Greenhouse',
    'Kitchen garden',
    'Mixed farming',
    'Other'
  ]).default('Open field'),
  notes: z.string().max(500).optional(),
  status: z.enum(['active', 'archived']).default('active'),
});

export type FarmFormData = z.infer<typeof farmSchema>;
export type PlotFormData = z.infer<typeof plotSchema>;
