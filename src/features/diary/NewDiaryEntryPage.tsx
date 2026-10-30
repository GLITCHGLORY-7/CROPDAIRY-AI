// CropDiary AI — Create New Diary Entry Page
// Mobile-optimized, adaptive quick-entry creation supporting voice notes, attachments, and typed sub-records.

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { storageAdapter } from '@/services/storageAdapter';
import { diaryService } from './services/diaryService';
import { offlineSyncService } from '@/services/offline/offlineSyncService';
import {
  diaryEntryFormSchema,
  DiaryEntryFormData,
} from '@/lib/validation/diarySchemas';
import { Farm, Plot } from '@/types/database';
import { CropPlan } from '@/types/crop';
import { CropAssessment } from '@/types/cropDoctor';
import { DiaryEntryType, DiaryAttachment } from '@/types/diary';
import { QuickEntryTypeSelector } from './components/QuickEntryTypeSelector';
import { VoiceInputButton } from '@/components/shared/VoiceInputButton';
import { AttachmentUploader } from './components/AttachmentUploader';
import { ActivityDetailSection } from './components/ActivityDetailSection';
import { IrrigationDetailSection } from './components/IrrigationDetailSection';
import { InputDetailSection } from './components/InputDetailSection';
import { ObservationDetailSection } from './components/ObservationDetailSection';
import { ExpenseDetailSection } from './components/ExpenseDetailSection';
import { HarvestDetailSection } from './components/HarvestDetailSection';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const NewDiaryEntryPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [cropPlans, setCropPlans] = useState<CropPlan[]>([]);
  const [assessments, setAssessments] = useState<CropAssessment[]>([]);
  const [attachments, setAttachments] = useState<DiaryAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Read possible navigation state from Phase 4 (Reminder) or Phase 3 (Crop Doctor)
  const navState = (location.state as any) || {};

  const getDefaultDateTime = () => {
    return new Date().toISOString().slice(0, 16);
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DiaryEntryFormData>({
    resolver: zodResolver(diaryEntryFormSchema),
    defaultValues: {
      farm_id: navState.farmId || '',
      plot_id: navState.plotId || null,
      crop_plan_id: navState.cropPlanId || null,
      entry_type: (navState.category === 'irrigation' ? 'irrigation' : navState.entryType) || 'activity',
      title: navState.title || '',
      description: navState.description || '',
      occurred_at: getDefaultDateTime(),
      status: 'active',
      tags: [],
      activity_detail: {
        activity_type: 'land_preparation',
        area_covered: 1.0,
        area_unit: 'Acres',
        duration_hours: 2.0,
        labor_count: 1,
        labor_cost: 0,
      },
      irrigation_record: undefined,
      input_record: undefined,
      observation: undefined,
      expense: undefined,
      harvest: undefined,
    },
  });

  const selectedEntryType = watch('entry_type');
  const selectedFarmId = watch('farm_id');

  // Load farms, plots, crop plans, and assessments
  useEffect(() => {
    const loadPrerequisites = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const [userFarms, allPlans, userAssessments] = await Promise.all([
          storageAdapter.getFarms(user.id),
          storageAdapter.getCropPlans(user.id),
          storageAdapter.getAssessments(user.id),
        ]);

        setFarms(userFarms);
        setCropPlans(allPlans);
        setAssessments(userAssessments);

        if (userFarms.length > 0 && !watch('farm_id')) {
          setValue('farm_id', userFarms[0].id);
        }

        // Load plots for all farms
        const plotPromises = userFarms.map((f: Farm) => storageAdapter.getPlots(f.id));
        const plotsResults = await Promise.all(plotPromises);
        setPlots(plotsResults.flat());
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to load farm details.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPrerequisites();
  }, [user, setValue]);

  const availablePlots = plots.filter((p) => p.farm_id === selectedFarmId);
  const availablePlans = cropPlans.filter((p) => p.farm_id === selectedFarmId);

  // Auto-set title template if title is empty when switching types
  const handleSelectType = (type: DiaryEntryType) => {
    setValue('entry_type', type);
    const currentTitle = watch('title');
    if (!currentTitle || currentTitle.startsWith('Record ') || currentTitle.startsWith('Completed: ')) {
      switch (type) {
        case 'activity':
          setValue('title', 'Field Operation Activity');
          break;
        case 'irrigation':
          setValue('title', 'Scheduled Field Irrigation');
          break;
        case 'input_application':
          setValue('title', 'Fertilizer / Nutrient Application');
          break;
        case 'crop_observation':
          setValue('title', 'Crop Health Scouting Walk');
          break;
        case 'expense':
          setValue('title', 'Farm Operational Expense');
          break;
        case 'harvest':
          setValue('title', 'Crop Harvest Output');
          break;
        case 'general':
          setValue('title', 'General Farm Field Note');
          break;
      }
    }
  };

  const handleVoiceAppend = (text: string) => {
    const current = watch('description') || '';
    setValue('description', current ? `${current}\n${text}` : text);
  };

  const handleVoiceReplace = (text: string) => {
    setValue('description', text);
  };

  const handleFormSubmit = async (data: DiaryEntryFormData) => {
    if (!user) return;
    setErrorMessage(null);

    try {
      if (offlineSyncService.isOnline()) {
        await diaryService.createEntry(user.id, {
          ...data,
          attachments,
        });
      } else {
        await offlineSyncService.createEntryOffline(user.id, {
          ...data,
          attachments,
        });
      }

      // If came from Phase 4 reminder, mark reminder completed
      if (navState.fromReminder && navState.reminderId) {
        await storageAdapter.updateReminder(user.id, navState.reminderId, {
          status: 'completed',
          completed_at: new Date().toISOString(),
        });
      }

      navigate('/app/diary');
    } catch {
      // Graceful offline fallback on network glitch
      try {
        await offlineSyncService.createEntryOffline(user.id, {
          ...data,
          attachments,
        });
        navigate('/app/diary');
      } catch (offlineErr: any) {
        setErrorMessage(offlineErr.message || 'Failed to save diary entry.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-agri-200 border-t-agri-700 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-600">
          Preparing entry creator...
        </p>
      </div>
    );
  }

  if (farms.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Card className="p-8 border-dashed border-2 border-slate-300">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">
            No Farm Registered Yet
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
            Diary entries must link to a valid farm and plot. Register your farm first to start logging activities.
          </p>
          <div className="mt-4">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => navigate('/app/farms')}
              className="bg-agri-800 hover:bg-agri-900 text-white font-bold shadow-sm px-5 py-2.5"
            >
              Register First Farm
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-left">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/app/diary"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              New Farm Diary Entry
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Select category, log field measurements, and attach photos or voice observations.
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Form */}
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-6"
        noValidate
      >
        {/* 1. Quick Category Selector */}
        <Card className="p-4 sm:p-5">
          <QuickEntryTypeSelector
            selectedType={selectedEntryType}
            onSelectType={handleSelectType}
            disabled={isSubmitting}
          />
        </Card>

        {/* 2. Farm, Plot, and Crop Plan Association */}
        <Card className="p-4 sm:p-5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Field Location & Crop Reference
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Farm"
              required
              error={errors.farm_id?.message}
              {...register('farm_id')}
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.district || f.state})
                </option>
              ))}
            </Select>

            <Select
              label="Specific Plot (Optional)"
              error={errors.plot_id?.message}
              {...register('plot_id')}
            >
              <option value="">Entire Farm (All Plots)</option>
              {availablePlots.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.area} {p.area_unit})
                </option>
              ))}
            </Select>

            <Select
              label="Saved Crop Plan (Optional)"
              error={errors.crop_plan_id?.message}
              {...register('crop_plan_id')}
            >
              <option value="">No Linked Crop Plan</option>
              {availablePlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.selected_crop_name} — {plan.title}
                </option>
              ))}
            </Select>
          </div>
        </Card>

        {/* 3. Common Entry Info: Title, Date, Description with Voice Input */}
        <Card className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Entry Information & Notes
            </h2>
            <VoiceInputButton
              onAppendText={handleVoiceAppend}
              onReplaceText={handleVoiceReplace}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Entry Title"
                required
                placeholder="e.g. Drip irrigation, Applied neem cake, Leaf scouting"
                error={errors.title?.message}
                {...register('title')}
              />
            </div>

            <Input
              label="Date & Time"
              type="datetime-local"
              required
              error={errors.occurred_at?.message}
              {...register('occurred_at')}
            />
          </div>

          <Textarea
            label="Field Observations & Detailed Notes"
            rows={3}
            placeholder="Describe what occurred in the field, soil texture conditions, weather, equipment performance, or labor instructions..."
            error={errors.description?.message}
            {...register('description')}
          />
        </Card>

        {/* 4. Adaptive Typed Detail Sub-Forms */}
        {selectedEntryType === 'activity' && (
          <ActivityDetailSection register={register} errors={errors} />
        )}

        {selectedEntryType === 'irrigation' && (
          <IrrigationDetailSection register={register} errors={errors} />
        )}

        {selectedEntryType === 'input_application' && (
          <InputDetailSection register={register} errors={errors} />
        )}

        {selectedEntryType === 'crop_observation' && (
          <ObservationDetailSection
            register={register}
            errors={errors}
            assessments={assessments}
          />
        )}

        {selectedEntryType === 'expense' && (
          <ExpenseDetailSection register={register} errors={errors} />
        )}

        {selectedEntryType === 'harvest' && (
          <HarvestDetailSection
            register={register}
            errors={errors}
            defaultCropName={availablePlans[0]?.selected_crop_name}
          />
        )}

        {/* 5. Photographs & Attachments */}
        <Card className="p-4 sm:p-5">
          <AttachmentUploader
            attachments={attachments}
            onChange={setAttachments}
            disabled={isSubmitting}
          />
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/app/diary')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => {
              setValue('status', 'draft');
              handleSubmit(handleFormSubmit)();
            }}
          >
            Save as Draft
          </Button>

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
          >
            <Save className="w-4 h-4 mr-1.5" />
            <span>Save Diary Entry</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
