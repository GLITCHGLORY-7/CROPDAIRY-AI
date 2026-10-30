// CropDiary AI — Fertilizer & Farm Inputs Form Section
// Captures nutrients, organic amendments, crop protection chemicals, and CIBRC safety precautions.

import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { DiaryEntryFormData } from '@/lib/validation/diarySchemas';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ShieldAlert } from 'lucide-react';

interface InputDetailSectionProps {
  register: UseFormRegister<DiaryEntryFormData>;
  errors: FieldErrors<DiaryEntryFormData>;
}

export const InputDetailSection: React.FC<InputDetailSectionProps> = ({
  register,
  errors,
}) => {
  return (
    <div className="p-4 bg-agri-50/50 border border-agri-200 rounded-2xl space-y-4 text-left">
      <div className="border-b border-agri-200 pb-2">
        <h3 className="text-sm font-bold text-agri-950">
          Fertilizer & Soil-Input Usage Details
        </h3>
        <p className="text-[11px] text-agri-700">
          Record fertilizer applications, compost, seed batches, and foliar spray nutrients.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Product / Material Name"
          required
          placeholder="e.g. Neem Cake, Vermicompost, 19:19:19 NPK, Zinc Sulphate"
          error={errors.input_record?.input_name?.message}
          {...register('input_record.input_name')}
        />

        <Select
          label="Input Category"
          required
          error={errors.input_record?.input_category?.message}
          {...register('input_record.input_category')}
        >
          <option value="organic_manure">Organic Manure / FYM / Vermicompost</option>
          <option value="bio_fertilizer">Bio-Fertilizer (Azospirillum, PSB, Rhizobium)</option>
          <option value="chemical_fertilizer">Commercial Fertilizer (Urea, DAP, MOP, Complex)</option>
          <option value="micronutrient">Micronutrient (Zinc, Boron, Ferrous)</option>
          <option value="seed">Seeds / Seedlings / Planting Material</option>
          <option value="bio_pesticide">Botanical / Bio-Pesticide (Neem Oil, Beauveria)</option>
          <option value="crop_protection_pesticide">Registered Crop Protection Product</option>
          <option value="soil_conditioner">Soil Conditioner / Gypsum / Lime</option>
          <option value="growth_regulator">Plant Growth Regulator (PGR)</option>
          <option value="other">Other Agricultural Input</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Quantity Applied"
            type="number"
            step="0.1"
            required
            placeholder="e.g. 50"
            error={errors.input_record?.quantity?.message}
            {...register('input_record.quantity', { valueAsNumber: true })}
          />
          <Select
            label="Unit"
            required
            error={errors.input_record?.unit?.message}
            {...register('input_record.unit')}
          >
            <option value="kg">kg</option>
            <option value="liters">liters</option>
            <option value="grams">grams</option>
            <option value="ml">ml</option>
            <option value="bags">bags (50kg)</option>
            <option value="packets">packets</option>
            <option value="quintals">quintals</option>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Treated Area"
            type="number"
            step="0.1"
            placeholder="e.g. 2.0"
            error={errors.input_record?.area_treated?.message}
            {...register('input_record.area_treated', { valueAsNumber: true })}
          />
          <Select
            label="Unit"
            {...register('input_record.area_unit')}
          >
            <option value="Acres">Acres</option>
            <option value="Hectares">Hectares</option>
            <option value="Cents">Cents</option>
          </Select>
        </div>

        <Input
          label="Purchase Cost (₹)"
          type="number"
          step="10"
          placeholder="e.g. 1200"
          error={errors.input_record?.cost?.message}
          {...register('input_record.cost', { valueAsNumber: true })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Supplier / Agro-dealer Store (Optional)"
          placeholder="e.g. Farmers Cooperative Society, Thanjavur Agro"
          error={errors.input_record?.supplier?.message}
          {...register('input_record.supplier')}
        />

        <Input
          label="Lot / Batch Number (Optional)"
          placeholder="e.g. BATCH-2026-X9"
          error={errors.input_record?.batch_number?.message}
          {...register('input_record.batch_number')}
        />
      </div>

      <Textarea
        label="Application Notes & Dilution Ratio"
        rows={2}
        placeholder="e.g. 2.5ml per liter of water; sprayed with fine hollow cone nozzle in morning."
        error={errors.input_record?.safety_precaution_notes?.message}
        {...register('input_record.safety_precaution_notes')}
      />

      {/* CIBRC Safety Compliance Banner */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Agricultural Compliance & Safety:</span>
          <p className="mt-0.5 text-[11px] text-amber-800">
            For crop protection chemicals, strictly observe CIBRC label-claim recommendations, protective gear (PPE), and Pre-Harvest Intervals (PHI). WHO Class Ia/Ib extremely hazardous compounds are prohibited.
          </p>
        </div>
      </div>
    </div>
  );
};
