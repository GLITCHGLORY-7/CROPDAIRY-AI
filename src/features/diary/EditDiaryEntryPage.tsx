// CropDiary AI — Edit Diary Entry Page
// Edit existing farm diary entries, sub-records, and media attachments.

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
import { FarmDiaryEntry, DiaryAttachment } from '@/types/diary';
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
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

export const EditDiaryEntryPage: React.FC = () => {
  const { entryId } = useParams<{ entryId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [entry, setEntry] = useState<FarmDiaryEntry | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [cropPlans, setCropPlans] = useState<CropPlan[]>([]);
  const [assessments, setAssessments] = useState<CropAssessment[]>([]);
  const [attachments, setAttachments] = useState<DiaryAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DiaryEntryFormData>({
    resolver: zodResolver(diaryEntryFormSchema),
  });

  const selectedFarmId = watch('farm_id');

  useEffect(() => {
    const loadEntryData = async () => {
      if (!user || !entryId) return;
      setIsLoading(true);

      try {
        const [data, userFarms, allPlans, userAssessments] = await Promise.all([
          diaryService.getEntryById(user.id, entryId),
          storageAdapter.getFarms(user.id),
          storageAdapter.getCropPlans(user.id),
          storageAdapter.getAssessments(user.id),
        ]);

        if (!data) {
          setErrorMessage('Diary entry not found.');
          return;
        }

        setEntry(data);
        setFarms(userFarms);
        setCropPlans(allPlans);
        setAssessments(userAssessments);
        setAttachments(data.attachments || []);

        const plotPromises = userFarms.map((f: Farm) => storageAdapter.getPlots(f.id));
        const plotsResults = await Promise.all(plotPromises);
        setPlots(plotsResults.flat());

        // Pre-fill form fields
        reset({
          farm_id: data.farm_id,
          plot_id: data.plot_id || null,
          crop_plan_id: data.crop_plan_id || null,
          entry_type: data.entry_type,
          title: data.title,
          description: data.description || '',
          occurred_at: data.occurred_at
            ? new Date(data.occurred_at).toISOString().slice(0, 16)
            : new Date().toISOString().slice(0, 16),
          status: data.status,
          tags: data.tags || [],
          activity_detail: data.activity_detail ? {
            activity_type: data.activity_detail.activity_type,
            area_covered: data.activity_detail.area_covered || null,
            area_unit: data.activity_detail.area_unit || 'Acres',
            duration_hours: data.activity_detail.duration_hours || null,
            labor_count: data.activity_detail.labor_count || null,
            labor_cost: data.activity_detail.labor_cost || null,
            machinery_used: data.activity_detail.machinery_used || null,
            materials_used: data.activity_detail.materials_used || null,
            notes: data.activity_detail.notes || null,
          } : null,
          irrigation_record: data.irrigation_record ? {
            irrigation_method: data.irrigation_record.irrigation_method,
            duration_hours: data.irrigation_record.duration_hours || null,
            water_quantity: data.irrigation_record.water_quantity || null,
            water_quantity_unit: data.irrigation_record.water_quantity_unit || 'liters',
            estimated_cost: data.irrigation_record.estimated_cost || null,
            soil_moisture_before: data.irrigation_record.soil_moisture_before || null,
            soil_moisture_after: data.irrigation_record.soil_moisture_after || null,
            water_source: data.irrigation_record.water_source || null,
            notes: data.irrigation_record.notes || null,
          } : null,
          input_record: data.input_record ? {
            input_name: data.input_record.input_name,
            input_category: data.input_record.input_category,
            quantity: data.input_record.quantity,
            unit: data.input_record.unit,
            area_treated: data.input_record.area_treated || null,
            area_unit: data.input_record.area_unit || 'Acres',
            cost: data.input_record.cost || 0,
            supplier: data.input_record.supplier || null,
            batch_number: data.input_record.batch_number || null,
            safety_precaution_notes: data.input_record.safety_precaution_notes || null,
          } : null,
          observation: data.observation ? {
            observation_category: data.observation.observation_category,
            severity: data.observation.severity || null,
            affected_area_pct: data.observation.affected_area_pct || null,
            crop_stage: data.observation.crop_stage || null,
            linked_assessment_id: data.observation.linked_assessment_id || null,
            follow_up_date: data.observation.follow_up_date || null,
            action_taken: data.observation.action_taken || null,
          } : null,
          expense: data.expense ? {
            category: data.expense.category,
            amount: data.expense.amount,
            currency: data.expense.currency || 'INR',
            payment_method: data.expense.payment_method || 'cash',
            payment_status: data.expense.payment_status || 'paid',
            vendor_payee: data.expense.vendor_payee || null,
          } : null,
          harvest: data.harvest ? {
            crop_name: data.harvest.crop_name,
            quantity_harvested: data.harvest.quantity_harvested,
            unit: data.harvest.unit,
            harvested_area: data.harvest.harvested_area || null,
            harvested_area_unit: data.harvest.harvested_area_unit || 'Acres',
            quality_grade: data.harvest.quality_grade || null,
            quantity_retained_household: data.harvest.quantity_retained_household || 0,
            quantity_for_sale: data.harvest.quantity_for_sale || 0,
            actual_revenue: data.harvest.actual_revenue || null,
            estimated_revenue: data.harvest.estimated_revenue || null,
            buyer_market: data.harvest.buyer_market || null,
          } : null,
        });
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to load entry.');
      } finally {
        setIsLoading(false);
      }
    };

    loadEntryData();
  }, [user, entryId, reset]);

  const availablePlots = plots.filter((p) => p.farm_id === selectedFarmId);
  const availablePlans = cropPlans.filter((p) => p.farm_id === selectedFarmId);

  const handleVoiceAppend = (text: string) => {
    const current = watch('description') || '';
    setValue('description', current ? `${current}\n${text}` : text);
  };

  const handleVoiceReplace = (text: string) => {
    setValue('description', text);
  };

  const handleFormSubmit = async (data: DiaryEntryFormData) => {
    if (!user || !entryId) return;
    setErrorMessage(null);

    try {
      if (offlineSyncService.isOnline()) {
        await diaryService.updateEntry(user.id, entryId, data);
      } else {
        await offlineSyncService.updateEntryOffline(user.id, entryId, data);
      }
      navigate(`/app/diary/${entryId}`);
    } catch {
      try {
        await offlineSyncService.updateEntryOffline(user.id, entryId, data);
        navigate(`/app/diary/${entryId}`);
      } catch (offlineErr: any) {
        setErrorMessage(offlineErr.message || 'Failed to update diary entry.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-agri-200 border-t-agri-700 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-600">Loading entry for editing...</p>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-xs text-rose-600">{errorMessage || 'Entry not found'}</p>
        <Link to="/app/diary" className="text-xs text-agri-700 font-bold hover:underline mt-2 inline-block">
          Return to Farm Diary
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-left">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/app/diary/${entryId}`}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Edit Diary Entry
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Update field notes, measurements, quantities, or attachments.
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

      {/* Main Edit Form */}
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-6"
        noValidate
      >
        {/* Farm & Plot Location */}
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
              label="Plot (Optional)"
              error={errors.plot_id?.message}
              {...register('plot_id')}
            >
              <option value="">Entire Farm</option>
              {availablePlots.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.area} {p.area_unit})
                </option>
              ))}
            </Select>

            <Select
              label="Linked Crop Plan"
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

        {/* Title, Date & Description with Voice Input */}
        <Card className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Entry Information
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
            label="Field Observations & Notes"
            rows={3}
            error={errors.description?.message}
            {...register('description')}
          />
        </Card>

        {/* Sub-Detail sections based on entry_type */}
        {entry.entry_type === 'activity' && (
          <ActivityDetailSection register={register} errors={errors} />
        )}

        {entry.entry_type === 'irrigation' && (
          <IrrigationDetailSection register={register} errors={errors} />
        )}

        {entry.entry_type === 'input_application' && (
          <InputDetailSection register={register} errors={errors} />
        )}

        {entry.entry_type === 'crop_observation' && (
          <ObservationDetailSection
            register={register}
            errors={errors}
            assessments={assessments}
          />
        )}

        {entry.entry_type === 'expense' && (
          <ExpenseDetailSection register={register} errors={errors} />
        )}

        {entry.entry_type === 'harvest' && (
          <HarvestDetailSection
            register={register}
            errors={errors}
            defaultCropName={entry.harvest?.crop_name}
          />
        )}

        {/* Attachments Section */}
        <Card className="p-4 sm:p-5">
          <AttachmentUploader
            attachments={attachments}
            onChange={setAttachments}
            disabled={isSubmitting}
          />
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/app/diary/${entryId}`)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
          >
            <Save className="w-4 h-4 mr-1.5" />
            <span>Save Changes</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
