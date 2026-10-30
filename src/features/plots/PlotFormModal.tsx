import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { plotSchema, PlotFormData } from '@/lib/validation/farmSchemas';
import { Farm, Plot } from '@/types/database';
import { convertToAcres, formatArea } from '@/lib/formatters';

export interface PlotFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PlotFormData) => Promise<void>;
  parentFarm: Farm;
  initialData?: Plot | null;
  isLoading?: boolean;
}

export const PlotFormModal: React.FC<PlotFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  parentFarm,
  initialData,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PlotFormData>({
    resolver: zodResolver(plotSchema),
    defaultValues: {
      name: '',
      farm_id: parentFarm.id,
      area: 1.0,
      area_unit: parentFarm.area_unit,
      soil_type: parentFarm.soil_type,
      irrigation_method: parentFarm.irrigation_method,
      farming_environment: parentFarm.farming_type,
      notes: '',
      status: 'active',
    },
  });

  const watchedArea = watch('area');
  const watchedUnit = watch('area_unit');

  // Check plot area vs parent farm area
  const plotAcres = convertToAcres(Number(watchedArea) || 0, watchedUnit || parentFarm.area_unit);
  const farmAcres = convertToAcres(parentFarm.area, parentFarm.area_unit);
  const isAreaExceeded = plotAcres > farmAcres * 1.05;

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        farm_id: initialData.farm_id,
        area: initialData.area,
        area_unit: initialData.area_unit,
        soil_type: initialData.soil_type,
        irrigation_method: initialData.irrigation_method,
        farming_environment: initialData.farming_environment,
        notes: initialData.notes || '',
        status: initialData.status,
      });
    } else {
      reset({
        name: '',
        farm_id: parentFarm.id,
        area: Math.min(1.0, parentFarm.area),
        area_unit: parentFarm.area_unit,
        soil_type: parentFarm.soil_type,
        irrigation_method: parentFarm.irrigation_method,
        farming_environment: parentFarm.farming_type,
        notes: '',
        status: 'active',
      });
    }
  }, [initialData, parentFarm, reset, isOpen]);

  const handleFormSubmit = async (data: PlotFormData) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? `Edit Plot: ${initialData.name}` : `Add Plot to ${parentFarm.name}`}
      description={`Parent farm total area: ${formatArea(parentFarm.area, parentFarm.area_unit)}.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 text-left" noValidate>
        {isAreaExceeded && (
          <Alert variant="warning" title="Large Plot Area Warning">
            The configured plot area ({watchedArea} {watchedUnit}) exceeds the parent farm&apos;s total recorded area ({formatArea(parentFarm.area, parentFarm.area_unit)}). Please verify measurements.
          </Alert>
        )}

        {/* Plot Name */}
        <Input
          label="Plot Name / Identification"
          required
          placeholder="e.g. North Acre - Paddy Block"
          error={errors.name?.message}
          {...register('name')}
        />

        {/* Land Area and Unit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Plot Area"
            type="number"
            step="0.01"
            required
            placeholder="e.g. 1.2"
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

        {/* Soil & Irrigation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Plot Soil Type"
            required
            helperText="Can differ from the main farm"
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
            helperText="Method used on this plot"
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
        </div>

        {/* Farming Environment */}
        <Select
          label="Farming Environment"
          required
          error={errors.farming_environment?.message}
          {...register('farming_environment')}
        >
          <option value="Open field">Open Field</option>
          <option value="Orchard">Orchard / Tree Crops</option>
          <option value="Greenhouse">Greenhouse / Polyhouse</option>
          <option value="Kitchen garden">Kitchen Garden</option>
          <option value="Mixed farming">Mixed Farming</option>
          <option value="Other">Other</option>
        </Select>

        {/* Notes */}
        <Textarea
          label="Plot Notes / Topography (Optional)"
          rows={2}
          placeholder="e.g. Sloped towards eastern drainage, shaded by coconut trees..."
          error={errors.notes?.message}
          {...register('notes')}
        />

        {/* Status */}
        <Select
          label="Plot Status"
          error={errors.status?.message}
          {...register('status')}
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </Select>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" size="md" onClick={onClose} disabled={isSubmitting || isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" isLoading={isSubmitting || isLoading}>
            {initialData ? 'Save Plot Changes' : 'Create Plot'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
