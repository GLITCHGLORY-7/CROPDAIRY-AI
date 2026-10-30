// CropDiary AI — Farm Reminder Creation / Edit Modal
// Fully accessible modal dialog for farm reminders with recurrence and weather trigger conditions.

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import {
  reminderFormSchema,
  ReminderFormData,
} from '@/lib/validation/weatherSchemas';
import { FarmReminder } from '@/types/weather';
import { Farm, Plot } from '@/types/database';
import {
  Droplets,
  Eye,
  Trees,
  CloudRain,
  CloudLightning,
  Calendar,
} from 'lucide-react';

interface ReminderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ReminderFormData) => Promise<void>;
  initialData?: FarmReminder | null;
  farms: Farm[];
  plots?: Plot[];
  defaultFarmId?: string;
  isLoading?: boolean;
}

export const ReminderFormModal: React.FC<ReminderFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  farms,
  plots = [],
  defaultFarmId,
  isLoading = false,
}) => {
  const [enableWeatherTrigger, setEnableWeatherTrigger] = useState(false);

  // Format default due date to 24h from now in YYYY-MM-DDTHH:mm format for datetime-local
  const getDefaultDueDate = () => {
    const d = new Date();
    d.setHours(d.getHours() + 24, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReminderFormData>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: {
      farm_id: defaultFarmId || (farms[0]?.id ?? ''),
      plot_id: null,
      crop_plan_id: null,
      title: '',
      description: '',
      category: 'irrigation',
      due_date: getDefaultDueDate(),
      timezone: 'Asia/Kolkata',
      recurrence: 'none',
      weather_trigger_condition: null,
    },
  });

  const selectedFarmId = watch('farm_id');
  const availablePlots = plots.filter((p) => p.farm_id === selectedFarmId);

  useEffect(() => {
    if (initialData) {
      const formattedDate = initialData.due_date
        ? new Date(initialData.due_date).toISOString().slice(0, 16)
        : getDefaultDueDate();

      reset({
        farm_id: initialData.farm_id,
        plot_id: initialData.plot_id || null,
        crop_plan_id: initialData.crop_plan_id || null,
        title: initialData.title,
        description: initialData.description || '',
        category: initialData.category,
        due_date: formattedDate,
        timezone: initialData.timezone || 'Asia/Kolkata',
        recurrence: initialData.recurrence,
        weather_trigger_condition: initialData.weather_trigger_condition || null,
      });

      setEnableWeatherTrigger(Boolean(initialData.weather_trigger_condition));
    } else {
      reset({
        farm_id: defaultFarmId || (farms[0]?.id ?? ''),
        plot_id: null,
        crop_plan_id: null,
        title: '',
        description: '',
        category: 'irrigation',
        due_date: getDefaultDueDate(),
        timezone: 'Asia/Kolkata',
        recurrence: 'none',
        weather_trigger_condition: null,
      });
      setEnableWeatherTrigger(false);
    }
  }, [initialData, defaultFarmId, farms, reset, isOpen]);

  const handleFormSubmit = async (data: ReminderFormData) => {
    const payload = {
      ...data,
      plot_id: data.plot_id || null,
      weather_trigger_condition: enableWeatherTrigger
        ? data.weather_trigger_condition
        : null,
    };
    await onSubmit(payload);
    onClose();
  };

  const handleQuickTemplate = (
    title: string,
    category: ReminderFormData['category'],
    trigger?: {
      type: 'heavy_rain' | 'dry_spell' | 'high_wind' | 'high_temp';
      threshold_value: number;
      description: string;
    }
  ) => {
    setValue('title', title);
    setValue('category', category);
    if (trigger) {
      setEnableWeatherTrigger(true);
      setValue('weather_trigger_condition', trigger);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Farm Reminder' : 'Create Farm Reminder'}
      description="Plan farm activities with automatic calendar scheduling and weather condition triggers."
      maxWidth="lg"
    >
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-4 text-left"
        noValidate
      >
        {/* Quick agricultural templates for fast entry */}
        {!initialData && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-agri-600" />
              <span>Quick Agricultural Templates:</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() =>
                  handleQuickTemplate(
                    'Morning Drip Irrigation Schedule',
                    'irrigation'
                  )
                }
                className="text-xs bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 rounded-md px-2.5 py-1 transition flex items-center gap-1"
              >
                <Droplets className="w-3 h-3 text-sky-500" />
                <span>Drip Irrigation</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickTemplate(
                    'Pest & Disease Field Scouting Walk',
                    'scouting'
                  )
                }
                className="text-xs bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md px-2.5 py-1 transition flex items-center gap-1"
              >
                <Eye className="w-3 h-3 text-indigo-500" />
                <span>Field Scouting</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickTemplate(
                    'Foliar Micronutrient / Bio-spray Window',
                    'fieldwork',
                    {
                      type: 'high_wind',
                      threshold_value: 15,
                      description: 'Alert if wind exceeds 15 km/h during spray window',
                    }
                  )
                }
                className="text-xs bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md px-2.5 py-1 transition flex items-center gap-1"
              >
                <Trees className="w-3 h-3 text-emerald-500" />
                <span>Spray Window</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickTemplate(
                    'Check Drainage Channels before Monsoon Rain',
                    'weather_action',
                    {
                      type: 'heavy_rain',
                      threshold_value: 40,
                      description: 'Proactively alert if heavy rain > 40 mm is forecast',
                    }
                  )
                }
                className="text-xs bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-md px-2.5 py-1 transition flex items-center gap-1"
              >
                <CloudLightning className="w-3 h-3 text-blue-500" />
                <span>Monsoon Prep</span>
              </button>
            </div>
          </div>
        )}

        {/* Farm & Plot Association */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Associated Farm"
            required
            error={errors.farm_id?.message}
            {...register('farm_id')}
          >
            {farms.map((farm) => (
              <option key={farm.id} value={farm.id}>
                {farm.name} ({farm.district || farm.state || 'General'})
              </option>
            ))}
          </Select>

          <Select
            label="Specific Plot (Optional)"
            error={errors.plot_id?.message}
            {...register('plot_id')}
          >
            <option value="">Entire Farm (All Plots)</option>
            {availablePlots.map((plot) => (
              <option key={plot.id} value={plot.id}>
                {plot.name} ({plot.area} {plot.area_unit})
              </option>
            ))}
          </Select>
        </div>

        {/* Title & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Reminder Title"
              required
              placeholder="e.g. Apply neem oil bio-spray, check drip emitters"
              error={errors.title?.message}
              {...register('title')}
            />
          </div>

          <Select
            label="Category"
            required
            error={errors.category?.message}
            {...register('category')}
          >
            <option value="irrigation">💧 Irrigation</option>
            <option value="scouting">🔍 Crop Scouting</option>
            <option value="fieldwork">🌿 Fieldwork / Spray</option>
            <option value="fertilizer">🌱 Fertilizer / Nutrients</option>
            <option value="harvest">🌾 Harvesting</option>
            <option value="weather_action">⛈️ Weather Action</option>
            <option value="custom">📌 Custom / Other</option>
          </Select>
        </div>

        {/* Date, Time & Recurrence */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Due Date & Time"
            type="datetime-local"
            required
            error={errors.due_date?.message}
            {...register('due_date')}
          />

          <Select
            label="Recurrence Schedule"
            error={errors.recurrence?.message}
            {...register('recurrence')}
          >
            <option value="none">One-time (No recurrence)</option>
            <option value="daily">Daily repeat</option>
            <option value="weekly">Weekly repeat</option>
            <option value="biweekly">Every 2 weeks</option>
            <option value="monthly">Monthly repeat</option>
          </Select>
        </div>

        {/* Description / Notes */}
        <Textarea
          label="Notes & Advisory Instructions (Optional)"
          rows={3}
          placeholder="e.g. Ensure spray nozzle operates at 2.5 bar; avoid spraying if midday temp exceeds 35°C."
          error={errors.description?.message}
          {...register('description')}
        />

        {/* Weather Trigger Configuration */}
        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/70 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-sky-600" />
              <label
                htmlFor="weather-trigger-toggle"
                className="text-sm font-medium text-slate-800 cursor-pointer"
              >
                Proactive Weather Trigger Condition
              </label>
            </div>
            <input
              id="weather-trigger-toggle"
              type="checkbox"
              checked={enableWeatherTrigger}
              onChange={(e) => {
                setEnableWeatherTrigger(e.target.checked);
                if (e.target.checked && !watch('weather_trigger_condition')) {
                  setValue('weather_trigger_condition', {
                    type: 'heavy_rain',
                    threshold_value: 30,
                    description: 'Alert if precipitation exceeds 30 mm in 24 hours',
                  });
                }
              }}
              className="w-4 h-4 text-agri-600 rounded border-slate-300 focus:ring-agri-500 cursor-pointer"
            />
          </div>

          {enableWeatherTrigger && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                When the automated weather scheduler evaluates this farm, it will generate an immediate high-priority alert if the forecast matches this condition.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Condition Type"
                  value={watch('weather_trigger_condition.type') || 'heavy_rain'}
                  onChange={(e) => {
                    const type = e.target.value as any;
                    let defVal = 30;
                    let desc = 'Alert if precipitation exceeds 30 mm';
                    if (type === 'high_wind') {
                      defVal = 20;
                      desc = 'Alert if wind speed exceeds 20 km/h (spray drift)';
                    } else if (type === 'high_temp') {
                      defVal = 38;
                      desc = 'Alert if daytime temperature exceeds 38°C (heat stress)';
                    } else if (type === 'dry_spell') {
                      defVal = 10;
                      desc = 'Alert if dry spell reaches 10 consecutive days';
                    }
                    setValue('weather_trigger_condition', {
                      type,
                      threshold_value: defVal,
                      description: desc,
                    });
                  }}
                >
                  <option value="heavy_rain">Heavy Rainfall Expected (&gt; mm)</option>
                  <option value="high_wind">High Wind Speed (&gt; km/h)</option>
                  <option value="high_temp">Extreme Heat (&gt; °C)</option>
                  <option value="dry_spell">Dry Spell Duration (&gt; days)</option>
                </Select>

                <Input
                  label="Threshold Numeric Value"
                  type="number"
                  step="0.5"
                  value={watch('weather_trigger_condition.threshold_value') ?? 30}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setValue('weather_trigger_condition.threshold_value', val);
                  }}
                />
              </div>

              <Input
                label="Condition Reason / Guidance"
                value={watch('weather_trigger_condition.description') || ''}
                onChange={(e) => {
                  setValue(
                    'weather_trigger_condition.description',
                    e.target.value
                  );
                }}
                placeholder="e.g. Heavy rain will wash off foliar spray or flood field furrows"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting || isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting || isLoading}
          >
            {initialData ? 'Save Changes' : 'Create Reminder'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
