import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { farmSchema, FarmFormData } from '@/lib/validation/farmSchemas';
import { Farm } from '@/types/database';
import { useAuth } from '@/context/AuthContext';

export interface FarmFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FarmFormData) => Promise<void>;
  initialData?: Farm | null;
  isLoading?: boolean;
}

export const FarmFormModal: React.FC<FarmFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const { profile } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FarmFormData>({
    resolver: zodResolver(farmSchema),
    defaultValues: {
      name: '',
      description: '',
      country: 'India',
      state: profile?.state || 'Tamil Nadu',
      district: profile?.district || 'Thanjavur',
      village: '',
      area: 2.0,
      area_unit: profile?.preferred_area_unit || 'Acres',
      farming_type: 'Open field',
      soil_type: 'Clay Loam',
      irrigation_method: 'Drip',
      water_availability: 'Adequate',
      status: 'active',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        description: initialData.description || '',
        country: initialData.country,
        state: initialData.state,
        district: initialData.district,
        village: initialData.village || '',
        area: initialData.area,
        area_unit: initialData.area_unit,
        farming_type: initialData.farming_type,
        soil_type: initialData.soil_type,
        irrigation_method: initialData.irrigation_method,
        water_availability: initialData.water_availability,
        latitude: initialData.latitude || '',
        longitude: initialData.longitude || '',
        status: initialData.status,
      });
    } else {
      reset({
        name: '',
        description: '',
        country: 'India',
        state: profile?.state || 'Tamil Nadu',
        district: profile?.district || 'Thanjavur',
        village: '',
        area: 2.0,
        area_unit: profile?.preferred_area_unit || 'Acres',
        farming_type: 'Open field',
        soil_type: 'Clay Loam',
        irrigation_method: 'Drip',
        water_availability: 'Adequate',
        latitude: '',
        longitude: '',
        status: 'active',
      });
    }
  }, [initialData, profile, reset, isOpen]);

  const handleFormSubmit = async (data: FarmFormData) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Farm Details' : 'Register New Farm'}
      description="Record key agricultural characteristics, location, and irrigation setup."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 text-left" noValidate>
        {/* Name & Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Farm Name"
            required
            placeholder="e.g. Kaveri Delta Farm"
            error={errors.name?.message}
            {...register('name')}
          />

          <Select
            label="Farming Type"
            required
            error={errors.farming_type?.message}
            {...register('farming_type')}
          >
            <option value="Open field">Open Field</option>
            <option value="Orchard">Orchard / Plantation</option>
            <option value="Greenhouse">Greenhouse / Polyhouse</option>
            <option value="Kitchen garden">Kitchen Garden</option>
            <option value="Mixed farming">Mixed Farming</option>
            <option value="Other">Other</option>
          </Select>
        </div>

        {/* Location Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="State"
            required
            placeholder="e.g. Tamil Nadu"
            error={errors.state?.message}
            {...register('state')}
          />

          <Input
            label="District"
            required
            placeholder="e.g. Thanjavur"
            error={errors.district?.message}
            {...register('district')}
          />

          <Input
            label="Village / Locality (Optional)"
            placeholder="e.g. Thiruvaiyaru"
            error={errors.village?.message}
            {...register('village')}
          />
        </div>

        {/* Land Area and Unit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Total Land Area"
            type="number"
            step="0.01"
            required
            placeholder="e.g. 3.5"
            error={errors.area?.message}
            {...register('area')}
          />

          <Select
            label="Measurement Unit"
            required
            error={errors.area_unit?.message}
            {...register('area_unit')}
          >
            <option value="Acres">Acres</option>
            <option value="Hectares">Hectares</option>
            <option value="Bigha">Bigha</option>
            <option value="Guntha">Guntha</option>
          </Select>
        </div>

        {/* Soil, Irrigation & Water Security */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="General Soil Type"
            required
            error={errors.soil_type?.message}
            {...register('soil_type')}
          >
            <option value="Clay">Clay</option>
            <option value="Clay Loam">Clay Loam</option>
            <option value="Sandy Loam">Sandy Loam</option>
            <option value="Red Soil">Red Soil</option>
            <option value="Black Soil">Black Soil</option>
            <option value="Alluvial">Alluvial</option>
            <option value="Silty Loam">Silty Loam</option>
            <option value="Other">Other</option>
          </Select>

          <Select
            label="Irrigation Method"
            required
            error={errors.irrigation_method?.message}
            {...register('irrigation_method')}
          >
            <option value="Drip">Drip Irrigation</option>
            <option value="Sprinkler">Sprinkler</option>
            <option value="Flood/Furrow">Flood / Furrow</option>
            <option value="Rainfed">Rainfed</option>
            <option value="Borewell Canal">Borewell + Canal</option>
            <option value="Manual">Manual</option>
          </Select>

          <Select
            label="Water Availability"
            required
            error={errors.water_availability?.message}
            {...register('water_availability')}
          >
            <option value="Adequate">Adequate Year-round</option>
            <option value="Seasonal">Seasonal</option>
            <option value="Scarce">Scarce / Limited</option>
            <option value="Rain-dependent">Rain-dependent</option>
          </Select>
        </div>

        {/* Optional GPS Coordinates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Latitude (Optional)"
            type="number"
            step="any"
            placeholder="e.g. 10.7870"
            helperText="Used for precise hyperlocal Open-Meteo weather"
            error={errors.latitude?.message}
            {...register('latitude')}
          />

          <Input
            label="Longitude (Optional)"
            type="number"
            step="any"
            placeholder="e.g. 79.1378"
            helperText="Used for precise hyperlocal Open-Meteo weather"
            error={errors.longitude?.message}
            {...register('longitude')}
          />
        </div>

        {/* Description / Notes */}
        <Textarea
          label="Farm Description / Notes (Optional)"
          rows={2}
          placeholder="Access roads, proximity to canal, or special notes..."
          error={errors.description?.message}
          {...register('description')}
        />

        {/* Active Status */}
        <div className="pt-1">
          <Select
            label="Record Status"
            error={errors.status?.message}
            {...register('status')}
          >
            <option value="active">Active (Default)</option>
            <option value="archived">Archived (Deactivated)</option>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" size="md" onClick={onClose} disabled={isSubmitting || isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" isLoading={isSubmitting || isLoading}>
            {initialData ? 'Save Farm Changes' : 'Create Farm'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
