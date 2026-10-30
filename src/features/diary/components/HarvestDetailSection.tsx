// CropDiary AI — Harvest Detail Form Section
// Captures harvested crop yields, quality grades, household retention, and market revenues.

import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { DiaryEntryFormData } from '@/lib/validation/diarySchemas';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Wheat } from 'lucide-react';

interface HarvestDetailSectionProps {
  register: UseFormRegister<DiaryEntryFormData>;
  errors: FieldErrors<DiaryEntryFormData>;
  defaultCropName?: string;
}

export const HarvestDetailSection: React.FC<HarvestDetailSectionProps> = ({
  register,
  errors,
  defaultCropName,
}) => {
  return (
    <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-4 text-left">
      <div className="border-b border-amber-200 pb-2">
        <h3 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
          <Wheat className="w-4 h-4 text-amber-700" />
          <span>Harvest Output & Production Details</span>
        </h3>
        <p className="text-[11px] text-amber-700">
          Record harvested weight, produce quality grades, household retention, and realized sales revenue.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Crop Harvested"
          required
          defaultValue={defaultCropName}
          placeholder="e.g. Paddy (CR 1009), Tomato (Shivam)"
          error={errors.harvest?.crop_name?.message}
          {...register('harvest.crop_name')}
        />

        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Quantity Harvested"
            type="number"
            step="0.1"
            required
            placeholder="e.g. 24"
            error={errors.harvest?.quantity_harvested?.message}
            {...register('harvest.quantity_harvested', { valueAsNumber: true })}
          />
          <Select
            label="Unit"
            required
            error={errors.harvest?.unit?.message}
            {...register('harvest.unit')}
          >
            <option value="quintals">quintals (100 kg)</option>
            <option value="kg">kg</option>
            <option value="tonnes">tonnes (1,000 kg)</option>
            <option value="bags">bags</option>
            <option value="crates">crates (25 kg)</option>
            <option value="pieces">pieces / bunches</option>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Harvested Area"
            type="number"
            step="0.1"
            placeholder="e.g. 1.5"
            error={errors.harvest?.harvested_area?.message}
            {...register('harvest.harvested_area', { valueAsNumber: true })}
          />
          <Select
            label="Unit"
            {...register('harvest.harvested_area_unit')}
          >
            <option value="Acres">Acres</option>
            <option value="Hectares">Hectares</option>
            <option value="Cents">Cents</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select
          label="Produce Quality Grade"
          error={errors.harvest?.quality_grade?.message}
          {...register('harvest.quality_grade')}
        >
          <option value="">Standard Quality</option>
          <option value="Grade A (Premium / Export)">Grade A (Premium / Export)</option>
          <option value="Grade B (Good Wholesale)">Grade B (Good Wholesale)</option>
          <option value="Grade C (Local Market)">Grade C (Local Market)</option>
          <option value="Processing Grade (Canning / Pulp)">Processing Grade (Canning / Pulp)</option>
          <option value="Mixed Commercial Grade">Mixed Commercial Grade</option>
        </Select>

        <Input
          label="Retained for Household"
          type="number"
          step="0.1"
          placeholder="e.g. 2 quintals"
          error={errors.harvest?.quantity_retained_household?.message}
          {...register('harvest.quantity_retained_household', { valueAsNumber: true })}
        />

        <Input
          label="Intended for Mandi / Sale"
          type="number"
          step="0.1"
          placeholder="e.g. 22 quintals"
          error={errors.harvest?.quantity_for_sale?.message}
          {...register('harvest.quantity_for_sale', { valueAsNumber: true })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Realized / Estimated Revenue (₹)"
          type="number"
          step="100"
          placeholder="e.g. 48000"
          error={errors.harvest?.actual_revenue?.message}
          {...register('harvest.actual_revenue', { valueAsNumber: true })}
        />

        <Input
          label="Mandi / Buyer / Market Name"
          placeholder="e.g. Uzhavar Sandhai, APMC Mandi, Direct Merchant"
          error={errors.harvest?.buyer_market?.message}
          {...register('harvest.buyer_market')}
        />
      </div>
    </div>
  );
};
