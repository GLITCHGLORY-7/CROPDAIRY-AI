import { z } from 'zod';

export const cropPlanningInputSchema = z.object({
  farm_id: z.string().min(1, 'Please select a farm'),
  plot_id: z.string().min(1, 'Please select a plot'),
  planting_season: z.enum(['Kharif', 'Rabi', 'Zaid', 'Perennial', 'All-Season'], {
    required_error: 'Please select a planting season',
  }),
  intended_planting_date: z.string().min(1, 'Please select an intended planting date'),
  preferred_category: z
    .enum([
      'Any',
      'Cereals & Millets',
      'Pulses',
      'Oilseeds',
      'Cash Crops',
      'Vegetables',
      'Spices',
      'Fruits',
    ])
    .default('Any'),
  water_availability: z.enum(['Adequate', 'Seasonal', 'Scarce', 'Rain-dependent'], {
    required_error: 'Please verify water security',
  }),
  available_budget: z.coerce.number().min(0, 'Budget must be zero or positive').optional(),
  budget_enforcement: z.enum(['strict', 'flexible', 'none']).default('flexible'),
  risk_tolerance: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  intended_use: z.enum(['Commercial', 'Household / Subsistence', 'Mixed']).default('Commercial'),
  previous_crop: z.string().max(100).optional(),
  farmer_notes: z.string().max(500).optional(),
});

export const saveCropPlanSchema = z.object({
  title: z.string().min(3, 'Plan title must be at least 3 characters').max(150),
  status: z.enum(['Draft', 'Ready for review', 'Planned', 'Active', 'Completed', 'Archived']).default('Draft'),
});

export type CropPlanningInputFormData = z.infer<typeof cropPlanningInputSchema>;
export type SaveCropPlanFormData = z.infer<typeof saveCropPlanSchema>;
