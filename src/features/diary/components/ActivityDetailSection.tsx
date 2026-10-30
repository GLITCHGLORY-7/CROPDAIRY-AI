// CropDiary AI — Activity Detail Form Section
// Captures specific field operations (sowing, weeding, spraying, labor count, machinery).

import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { DiaryEntryFormData } from '@/lib/validation/diarySchemas';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

interface ActivityDetailSectionProps {
  register: UseFormRegister<DiaryEntryFormData>;
  errors: FieldErrors<DiaryEntryFormData>;
}

export const ActivityDetailSection: React.FC<ActivityDetailSectionProps> = ({
  register,
  errors,
}) => {
  return (
    <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-4 text-left">
      <div className="border-b border-emerald-200 pb-2">
        <h3 className="text-sm font-bold text-emerald-950">
          Farm Activity Specific Details
        </h3>
        <p className="text-[11px] text-emerald-700">
          Record machinery used, labor requirements, duration, and operational costs.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Activity Type"
          required
          error={errors.activity_detail?.activity_type?.message}
          {...register('activity_detail.activity_type')}
        >
          <option value="land_preparation">Land Preparation / Tillage</option>
          <option value="sowing">Direct Sowing / Seed Drill</option>
          <option value="transplanting">Transplanting Seedlings</option>
          <option value="weeding">Manual / Mechanical Weeding</option>
          <option value="fertilizer_application">Fertilizer Application</option>
          <option value="soil_improvement">Soil Mulching / Liming</option>
          <option value="crop_inspection">Field Scouting & Inspection</option>
          <option value="crop_protection">Foliar Spraying / Crop Protection</option>
          <option value="pruning">Pruning / De-suckering</option>
          <option value="harvesting">Harvesting Activity</option>
          <option value="post_harvest">Drying / Threshing / Post-Harvest</option>
          <option value="equipment_maintenance">Equipment / Drip Maintenance</option>
          <option value="custom">Other Custom Operation</option>
        </Select>

        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Area Covered"
            type="number"
            step="0.05"
            placeholder="e.g. 2.0"
            error={errors.activity_detail?.area_covered?.message}
            {...register('activity_detail.area_covered', { valueAsNumber: true })}
          />
          <Select
            label="Unit"
            {...register('activity_detail.area_unit')}
          >
            <option value="Acres">Acres</option>
            <option value="Hectares">Hectares</option>
            <option value="Guntas">Guntas</option>
            <option value="Cents">Cents</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Duration (Hours)"
          type="number"
          step="0.5"
          placeholder="e.g. 4.5"
          error={errors.activity_detail?.duration_hours?.message}
          {...register('activity_detail.duration_hours', { valueAsNumber: true })}
        />

        <Input
          label="Laborers Engaged"
          type="number"
          step="1"
          placeholder="e.g. 3"
          error={errors.activity_detail?.labor_count?.message}
          {...register('activity_detail.labor_count', { valueAsNumber: true })}
        />

        <Input
          label="Total Labor Cost (₹)"
          type="number"
          step="10"
          placeholder="e.g. 1500"
          error={errors.activity_detail?.labor_cost?.message}
          {...register('activity_detail.labor_cost', { valueAsNumber: true })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Machinery / Implements Used"
          placeholder="e.g. 45 HP Tractor, Rotavator, Knapsack Sprayer"
          error={errors.activity_detail?.machinery_used?.message}
          {...register('activity_detail.machinery_used')}
        />

        <Input
          label="Materials / Consumables Used"
          placeholder="e.g. 2 rolls bio-mulch sheet, fuel diesel 10L"
          error={errors.activity_detail?.materials_used?.message}
          {...register('activity_detail.materials_used')}
        />
      </div>

      <Textarea
        label="Operational Notes & Observations"
        rows={2}
        placeholder="e.g. Field plowed to 15cm depth; soil tilth is fine; weed roots exposed for sun-drying."
        error={errors.activity_detail?.notes?.message}
        {...register('activity_detail.notes')}
      />
    </div>
  );
};
