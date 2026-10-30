import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { cropPlanService } from '@/services/cropPlanService';
import { farmService } from '@/services/farmService';
import { PlanStatus, Season } from '@/types/crop';
import { useToast } from '@/context/ToastContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { PlanTimelineView } from './components/PlanTimelineView';
import { SuitabilityBreakdown } from './components/SuitabilityBreakdown';
import { DuplicatePlanModal } from './components/DuplicatePlanModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { formatDate } from '@/lib/formatters';
import {
  ArrowLeft,
  Calendar,
  IndianRupee,
  Copy,
  Archive,
  Trash2,
  AlertCircle,
  Trees,
  Layers,
  Sparkles,
} from 'lucide-react';

export const CropPlanDetailPage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Fetch plan
  const { data: plan, isLoading, isError, error } = useQuery({
    queryKey: ['crop_plan', user?.id, planId],
    queryFn: () => (user && planId ? cropPlanService.getCropPlanById(user.id, planId) : null),
    enabled: Boolean(user && planId),
  });

  // Fetch farm & plot metadata
  const { data: farm } = useQuery({
    queryKey: ['farm', user?.id, plan?.farm_id],
    queryFn: () => (user && plan ? farmService.getFarmById(user.id, plan.farm_id) : null),
    enabled: Boolean(user && plan?.farm_id),
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: PlanStatus) => {
      if (!user || !planId) throw new Error('Unauthorized');
      return cropPlanService.updatePlanStatus(user.id, planId, newStatus);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['crop_plan', user?.id, planId] });
      queryClient.invalidateQueries({ queryKey: ['crop_plans', user?.id] });
      showToast('success', 'Status Updated', `Plan status is now ${updated.status}.`);
    },
    onError: (err: any) => {
      showToast('error', 'Update Error', err.message);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: ({ season, sowingDate }: { season: Season; sowingDate: string }) => {
      if (!user || !planId) throw new Error('Unauthorized');
      return cropPlanService.duplicateCropPlan(user.id, planId, season, sowingDate);
    },
    onSuccess: (newPlan) => {
      queryClient.invalidateQueries({ queryKey: ['crop_plans', user?.id] });
      showToast('success', 'Plan Duplicated', `"${newPlan.title}" created.`);
      navigate(`/app/crop-planner/${newPlan.id}`);
    },
    onError: (err: any) => {
      showToast('error', 'Duplication Error', err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!user || !planId) throw new Error('Unauthorized');
      return cropPlanService.deleteCropPlan(user.id, planId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crop_plans', user?.id] });
      showToast('info', 'Plan Deleted', 'Crop plan was permanently removed.');
      navigate('/app/crop-planner', { replace: true });
    },
    onError: (err: any) => {
      showToast('error', 'Delete Error', err.message);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Plan Not Found</h2>
        <p className="text-sm text-slate-500">
          {(error as any)?.message || 'This crop plan does not exist or you do not have permission to view it.'}
        </p>
        <Link to="/app/crop-planner">
          <Button variant="outline" size="md">
            Back to Crop Plans
          </Button>
        </Link>
      </div>
    );
  }

  const snapshot = plan.selected_candidate_snapshot;
  const targetPlot = farm?.plots?.find((p) => p.id === plan.plot_id);

  const statusVariant = {
    Active: 'success',
    Planned: 'default',
    Draft: 'warning',
    'Ready for review': 'warning',
    Completed: 'success',
    Archived: 'neutral',
  }[plan.status] as 'success' | 'default' | 'warning' | 'neutral';

  return (
    <div className="space-y-6 text-left">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/app/crop-planner"
          className="inline-flex items-center text-xs sm:text-sm font-semibold text-slate-600 hover:text-agri-700 transition-colors gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Crop Plans
        </Link>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsDuplicateOpen(true)}
            aria-label="Duplicate Plan"
            className="text-xs gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            Duplicate
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsArchiveOpen(true)}
            aria-label={plan.status === 'Archived' ? 'Restore plan' : 'Archive plan'}
            className="text-xs text-slate-600"
          >
            <Archive className="w-3.5 h-3.5 mr-1" />
            {plan.status === 'Archived' ? 'Restore' : 'Archive'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsDeleteOpen(true)}
            aria-label="Delete plan"
            className="text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Plan Overview Card */}
      <Card className="border-slate-200/90 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-agri-50/60 via-white to-earth-50/60 border-b border-slate-100 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={statusVariant}>{plan.status}</Badge>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                  {plan.season} Season
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Created {formatDate(plan.created_at)}
                </span>
              </div>

              <CardTitle className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
                {plan.title}
              </CardTitle>

              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 mt-1">
                <span className="font-bold text-agri-800">{plan.selected_crop_name}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Trees className="w-3.5 h-3.5 text-slate-400" />
                  {farm?.name || 'Farm'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  {targetPlot?.name || 'Plot'} ({targetPlot?.area} {targetPlot?.area_unit})
                </span>
              </div>
            </div>

            {/* Quick Status Selector */}
            <div className="min-w-[180px]">
              <Select
                label="Current Lifecycle Status"
                value={plan.status}
                onChange={(e) => updateStatusMutation.mutate(e.target.value as PlanStatus)}
                disabled={updateStatusMutation.isPending}
              >
                <option value="Draft">Draft</option>
                <option value="Ready for review">Ready for Review</option>
                <option value="Planned">Planned</option>
                <option value="Active">Active (In Ground)</option>
                <option value="Completed">Completed</option>
                <option value="Archived">Archived</option>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-4">
          {/* Schedule & Economics Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Sowing Date</span>
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-agri-600" />
                {formatDate(plan.sowing_date)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Est. Harvest Window</span>
              <span className="font-bold text-slate-800">
                {formatDate(plan.target_harvest_date)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Total Estimated Investment</span>
              <span className="font-bold text-slate-900 text-sm flex items-center">
                <IndianRupee className="w-3.5 h-3.5" />
                ₹{plan.estimated_total_cost.toLocaleString()}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Suitability Score</span>
              <span className="font-bold text-agri-700 text-sm flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {snapshot?.scoring.total_score || 0} / 100
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Growth Stage Milestone Timeline */}
      <PlanTimelineView
        stages={plan.timeline_stages}
        sowingDate={plan.sowing_date}
        targetHarvestDate={plan.target_harvest_date}
        cropName={plan.selected_crop_name}
      />

      {/* Agronomic Suitability Snapshot */}
      {snapshot && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-bold text-slate-900">
              Saved Agronomic Compatibility Evidence
            </CardTitle>
            <p className="text-xs text-slate-500">
              The verified ICAR criteria and field assumptions recorded when this plan was created.
            </p>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            <SuitabilityBreakdown crop={snapshot.crop} scoring={snapshot.scoring} />
          </CardContent>
        </Card>
      )}

      {/* Duplicate Plan Modal */}
      <DuplicatePlanModal
        isOpen={isDuplicateOpen}
        onClose={() => setIsDuplicateOpen(false)}
        onDuplicate={async (newSeason, newSowingDate) => {
          await duplicateMutation.mutateAsync({
            season: newSeason,
            sowingDate: newSowingDate,
          });
        }}
        plan={plan}
        isLoading={duplicateMutation.isPending}
      />

      {/* Archive Plan Modal */}
      <ConfirmDialog
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        onConfirm={() => {
          const nextStatus: PlanStatus = plan.status === 'Archived' ? 'Planned' : 'Archived';
          updateStatusMutation.mutate(nextStatus);
          setIsArchiveOpen(false);
        }}
        title={plan.status === 'Archived' ? 'Restore Plan' : 'Archive Plan'}
        message={`Are you sure you want to ${plan.status === 'Archived' ? 'restore' : 'archive'} "${plan.title}"?`}
        confirmLabel={plan.status === 'Archived' ? 'Restore Plan' : 'Archive Plan'}
        variant={plan.status === 'Archived' ? 'primary' : 'destructive'}
      />

      {/* Delete Plan Modal */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => {
          deleteMutation.mutate();
          setIsDeleteOpen(false);
        }}
        title="Delete Plan Permanently"
        message={`Are you sure you want to permanently delete "${plan.title}"? This cannot be undone.`}
        confirmLabel="Delete Permanently"
        variant="destructive"
      />
    </div>
  );
};
