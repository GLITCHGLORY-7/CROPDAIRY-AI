import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { saveCropPlanSchema, SaveCropPlanFormData } from '@/lib/validation/cropPlannerSchemas';

export interface SavePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SaveCropPlanFormData) => Promise<void>;
  defaultTitle: string;
  cropName: string;
  plotName: string;
  isLoading?: boolean;
}

export const SavePlanModal: React.FC<SavePlanModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultTitle,
  cropName,
  plotName,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SaveCropPlanFormData>({
    resolver: zodResolver(saveCropPlanSchema),
    defaultValues: {
      title: defaultTitle,
      status: 'Planned',
    },
  });

  const onSubmit = async (data: SaveCropPlanFormData) => {
    await onSave(data);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Save Crop Plan to Your Account"
      description={`Saving ${cropName} plan for plot "${plotName}".`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left" noValidate>
        <Input
          label="Plan Title"
          required
          placeholder="e.g. Samba 2025 - Plot 1 Paddy Plan"
          error={errors.title?.message}
          {...register('title')}
        />

        <Select
          label="Initial Plan Status"
          required
          error={errors.status?.message}
          {...register('status')}
        >
          <option value="Draft">Draft (Preliminary notes)</option>
          <option value="Ready for review">Ready for Review (Awaiting family/advisory input)</option>
          <option value="Planned">Planned (Confirmed schedule)</option>
          <option value="Active">Active (Field preparation started)</option>
        </Select>

        <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
          Saving preserves the full agronomic snapshot, suitability score, stage timeline, and cost estimate. You can update this plan or track its progress throughout the season.
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="md" onClick={onClose} disabled={isSubmitting || isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" isLoading={isSubmitting || isLoading}>
            Save Crop Plan
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
