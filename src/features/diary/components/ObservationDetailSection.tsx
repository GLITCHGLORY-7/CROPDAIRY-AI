// CropDiary AI — Crop Observation Form Section
// Captures physiological stage, pest/disease symptoms, and bridges to Phase 3 AI Crop Doctor.

import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { DiaryEntryFormData } from '@/lib/validation/diarySchemas';
import { CropAssessment } from '@/types/cropDoctor';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Stethoscope } from 'lucide-react';

interface ObservationDetailSectionProps {
  register: UseFormRegister<DiaryEntryFormData>;
  errors: FieldErrors<DiaryEntryFormData>;
  assessments?: CropAssessment[];
}

export const ObservationDetailSection: React.FC<ObservationDetailSectionProps> = ({
  register,
  errors,
  assessments = [],
}) => {
  return (
    <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl space-y-4 text-left">
      <div className="border-b border-indigo-200 pb-2">
        <h3 className="text-sm font-bold text-indigo-950">
          Crop Observation & Field Scouting Details
        </h3>
        <p className="text-[11px] text-indigo-700">
          Log visual crop symptoms, flowering stages, pest pressure, or link an AI Crop Doctor diagnosis.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select
          label="Observation Category"
          required
          error={errors.observation?.observation_category?.message}
          {...register('observation.observation_category')}
        >
          <option value="plant_growth">Vegetative Vigour & Growth</option>
          <option value="leaf_condition">Leaf Coloration / Yellowing</option>
          <option value="pest_signs">Insect Pest Signs / Feeding Damage</option>
          <option value="disease_symptoms">Fungal / Bacterial Disease Symptoms</option>
          <option value="flowering">Flowering / Pollination Phase</option>
          <option value="fruit_development">Fruit / Pod / Grain Development</option>
          <option value="water_stress">Moisture Stress / Wilting</option>
          <option value="soil_condition">Soil Crust / Salinity / Erosion</option>
          <option value="weather_damage">Hail / Wind / Sunburn Damage</option>
          <option value="harvest_readiness">Harvest Maturity & Ripeness</option>
          <option value="other">Other Field Observation</option>
        </Select>

        <Select
          label="Estimated Severity"
          error={errors.observation?.severity?.message}
          {...register('observation.severity')}
        >
          <option value="">Normal / Informational</option>
          <option value="low">Low (Minor isolated spotting)</option>
          <option value="medium">Medium (Noticeable across patches)</option>
          <option value="high">High (Spreading rapidly, economic risk)</option>
          <option value="critical">Critical (Severe defoliation / wilt)</option>
        </Select>

        <Input
          label="Affected Field Area (%)"
          type="number"
          step="1"
          min="0"
          max="100"
          placeholder="e.g. 15"
          error={errors.observation?.affected_area_pct?.message}
          {...register('observation.affected_area_pct', { valueAsNumber: true })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Current Growth Stage"
          error={errors.observation?.crop_stage?.message}
          {...register('observation.crop_stage')}
        >
          <option value="">Select Crop Stage (Optional)</option>
          <option value="Germination / Emergence">Germination / Emergence</option>
          <option value="Seedling / Nursery">Seedling / Nursery</option>
          <option value="Active Vegetative Tillering">Active Vegetative Tillering</option>
          <option value="Panicle Initiation / Branching">Panicle Initiation / Branching</option>
          <option value="Flowering / Anthesis">Flowering / Anthesis</option>
          <option value="Pod / Grain Filling">Pod / Grain Filling</option>
          <option value="Physiological Maturity">Physiological Maturity</option>
        </Select>

        <Input
          label="Follow-up Scouting Date"
          type="date"
          error={errors.observation?.follow_up_date?.message}
          {...register('observation.follow_up_date')}
        />
      </div>

      {/* Link to Phase 3 Crop Doctor Assessment */}
      {assessments.length > 0 && (
        <div className="p-3 bg-white border border-indigo-200 rounded-xl space-y-1.5">
          <label className="text-xs font-semibold text-indigo-900 flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
            <span>Link to AI Crop Doctor Diagnosis (Optional)</span>
          </label>
          <Select
            error={errors.observation?.linked_assessment_id?.message}
            {...register('observation.linked_assessment_id')}
          >
            <option value="">None (Standalone Observation)</option>
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.crop_name} — {a.primary_diagnosis} ({new Date(a.created_at).toLocaleDateString()})
              </option>
            ))}
          </Select>
        </div>
      )}

      <Textarea
        label="Immediate Corrective Action / Cultural Measures Taken"
        rows={2}
        placeholder="e.g. Rogue-out infected plants; installed yellow sticky traps; suspended overhead sprinkler."
        error={errors.observation?.action_taken?.message}
        {...register('observation.action_taken')}
      />
    </div>
  );
};
