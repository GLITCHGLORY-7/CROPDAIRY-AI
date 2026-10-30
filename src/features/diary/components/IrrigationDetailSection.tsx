// CropDiary AI — Irrigation Detail Form Section
// Captures irrigation methods, water source, duration, water quantity, and soil moisture status.

import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { DiaryEntryFormData } from '@/lib/validation/diarySchemas';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

interface IrrigationDetailSectionProps {
  register: UseFormRegister<DiaryEntryFormData>;
  errors: FieldErrors<DiaryEntryFormData>;
}

export const IrrigationDetailSection: React.FC<IrrigationDetailSectionProps> = ({
  register,
  errors,
}) => {
  return (
    <div className="p-4 bg-sky-50/50 border border-sky-200 rounded-2xl space-y-4 text-left">
      <div className="border-b border-sky-200 pb-2">
        <h3 className="text-sm font-bold text-sky-950">
          Irrigation Specific Details
        </h3>
        <p className="text-[11px] text-sky-700">
          Log water applications, duration, energy/water costs, and soil moisture response.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select
          label="Irrigation Method"
          required
          error={errors.irrigation_record?.irrigation_method?.message}
          {...register('irrigation_record.irrigation_method')}
        >
          <option value="Drip">Drip Irrigation</option>
          <option value="Sprinkler">Micro Sprinkler</option>
          <option value="Furrow">Furrow Irrigation</option>
          <option value="Flood">Flood Irrigation</option>
          <option value="Basin">Ring Basin</option>
          <option value="Manual">Manual Hose / Pot</option>
          <option value="Other">Other Method</option>
        </Select>

        <Input
          label="Irrigation Duration (Hours)"
          type="number"
          step="0.25"
          placeholder="e.g. 2.5"
          error={errors.irrigation_record?.duration_hours?.message}
          {...register('irrigation_record.duration_hours', { valueAsNumber: true })}
        />

        <Select
          label="Water Source"
          error={errors.irrigation_record?.water_source?.message}
          {...register('irrigation_record.water_source')}
        >
          <option value="Borewell">Borewell / Tube-well</option>
          <option value="Canal">Government Canal</option>
          <option value="Open Well">Open Farm Well</option>
          <option value="Farm Pond">Farm Rainwater Pond</option>
          <option value="Tanker">Purchased Water Tanker</option>
          <option value="River / Stream">River / Stream</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Water Quantity (Optional)"
            type="number"
            step="100"
            placeholder="e.g. 5000"
            error={errors.irrigation_record?.water_quantity?.message}
            {...register('irrigation_record.water_quantity', { valueAsNumber: true })}
          />
          <Select
            label="Unit"
            {...register('irrigation_record.water_quantity_unit')}
          >
            <option value="liters">Liters</option>
            <option value="m3">Cubic Meters (m³)</option>
            <option value="tankers">Tankers</option>
            <option value="gallons">Gallons</option>
          </Select>
        </div>

        <Input
          label="Electricity / Fuel Cost (₹)"
          type="number"
          step="10"
          placeholder="e.g. 150"
          error={errors.irrigation_record?.estimated_cost?.message}
          {...register('irrigation_record.estimated_cost', { valueAsNumber: true })}
        />

        <Select
          label="Soil Moisture Before"
          error={errors.irrigation_record?.soil_moisture_before?.message}
          {...register('irrigation_record.soil_moisture_before')}
        >
          <option value="">Not Assessed</option>
          <option value="Cracked / Very Dry">Cracked / Very Dry</option>
          <option value="Dry Topsoil">Dry Topsoil (&lt;30%)</option>
          <option value="Moderate Moisture">Moderate Moisture</option>
          <option value="Moist">Adequately Moist</option>
        </Select>
      </div>

      <Textarea
        label="Irrigation Remarks & Emitter Notes"
        rows={2}
        placeholder="e.g. Flushed sub-mains before irrigation; checked pressure at 1.8 bar; uniform wetting around root zone."
        error={errors.irrigation_record?.notes?.message}
        {...register('irrigation_record.notes')}
      />
    </div>
  );
};
