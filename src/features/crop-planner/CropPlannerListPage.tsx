import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { cropPlanService } from '@/services/cropPlanService';
import { farmService } from '@/services/farmService';
import { CropPlan, PlanStatus, Season } from '@/types/crop';
import { useToast } from '@/context/ToastContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DuplicatePlanModal } from './components/DuplicatePlanModal';
import { formatDate } from '@/lib/formatters';
import {
  Compass,
  Plus,
  Calendar,
  IndianRupee,
  Copy,
  Archive,
  Trash2,
  ArrowRight,
  Sprout,
  CheckCircle2,
} from 'lucide-react';

export const CropPlannerListPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [duplicatingPlan, setDuplicatingPlan] = useState<CropPlan | null>(null);
  const [planToArchive, setPlanToArchive] = useState<CropPlan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<CropPlan | null>(null);

  // Fetch saved crop plans
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['crop_plans', user?.id],
    queryFn: () => (user ? cropPlanService.getCropPlans(user.id) : []),
    enabled: Boolean(user),
  });

  // Fetch farms to display parent farm/plot names
  const { data: farms = [] } = useQuery({
    queryKey: ['farms', user?.id],
    queryFn: () => (user ? farmService.getFarmsWithPlots(user.id) : []),
    enabled: Boolean(user),
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ planId, status }: { planId: string; status: PlanStatus }) => {
      if (!user) throw new Error('Unauthorized');
      return cropPlanService.updatePlanStatus(user.id, planId, status);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['crop_plans', user?.id] });
      showToast('success', 'Plan Status Updated', `Status changed to ${updated.status}.`);
      setPlanToArchive(null);
    },
    onError: (err: any) => {
      showToast('error', 'Status Update Error', err.message);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: ({ planId, season, sowingDate }: { planId: string; season: Season; sowingDate: string }) => {
      if (!user) throw new Error('Unauthorized');
      return cropPlanService.duplicateCropPlan(user.id, planId, season, sowingDate);
    },
    onSuccess: (newPlan) => {
      queryClient.invalidateQueries({ queryKey: ['crop_plans', user?.id] });
      showToast('success', 'Plan Duplicated', `"${newPlan.title}" created for ${newPlan.season}.`);
      setDuplicatingPlan(null);
    },
    onError: (err: any) => {
      showToast('error', 'Duplication Error', err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (planId: string) => {
      if (!user) throw new Error('Unauthorized');
      return cropPlanService.deleteCropPlan(user.id, planId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crop_plans', user?.id] });
      showToast('info', 'Plan Deleted', 'The crop plan was removed.');
      setPlanToDelete(null);
    },
    onError: (err: any) => {
      showToast('error', 'Delete Error', err.message);
    },
  });

  const farmMap = new Map(farms.map((f) => [f.id, f]));
  const plotMap = new Map(farms.flatMap((f) => f.plots || []).map((p) => [p.id, p]));

  const filteredPlans = plans.filter((p) => {
    if (statusFilter === 'all') return p.status !== 'Archived';
    if (statusFilter === 'archived') return p.status === 'Archived';
    return p.status.toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Smart Crop Planner
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Explainable, data-backed crop planning based on your actual soil, season, and water security.
          </p>
        </div>

        <Link to="/app/crop-planner/new">
          <Button variant="primary" size="md" className="gap-2">
            <Plus className="w-4 h-4" />
            Plan New Crop
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { key: 'all', label: 'All Active Plans' },
          { key: 'active', label: 'In Progress (Active)' },
          { key: 'planned', label: 'Planned' },
          { key: 'draft', label: 'Drafts' },
          { key: 'completed', label: 'Completed' },
          { key: 'archived', label: 'Archived' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
              statusFilter === tab.key
                ? 'bg-agri-700 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Plan Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : filteredPlans.length === 0 ? (
        <EmptyState
          icon={Compass}
          title={statusFilter === 'archived' ? 'No Archived Plans' : 'No Crop Plans Created Yet'}
          description="Evaluate and identify suitable crops for your registered farm plots using verified agronomic recommendations."
          actionLabel="Create First Crop Plan"
          onAction={() => {
            window.location.href = '/app/crop-planner/new';
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => {
            const parentFarm = farmMap.get(plan.farm_id);
            const parentPlot = plotMap.get(plan.plot_id);

            const statusVariant = {
              Active: 'success',
              Planned: 'default',
              Draft: 'warning',
              'Ready for review': 'warning',
              Completed: 'success',
              Archived: 'neutral',
            }[plan.status] as 'success' | 'default' | 'warning' | 'neutral';

            return (
              <Card
                key={plan.id}
                className="flex flex-col justify-between hover:border-slate-300 transition-all shadow-xs"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusVariant}>{plan.status}</Badge>
                        <span className="text-xs font-bold text-slate-400">
                          {plan.season} Season
                        </span>
                      </div>
                      <CardTitle className="text-lg font-bold text-slate-900 mt-1.5">
                        {plan.title}
                      </CardTitle>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-agri-800 mt-0.5">
                        <Sprout className="w-3.5 h-3.5" />
                        <span>{plan.selected_crop_name}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Est. Cost</span>
                      <span className="text-sm font-extrabold text-slate-900">
                        ₹{plan.estimated_total_cost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 py-2 text-xs">
                  {/* Farm & Plot Binding */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Farm:</span>
                      <span className="font-bold text-slate-800 truncate max-w-[150px]">
                        {parentFarm?.name || 'Associated Farm'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Target Plot:</span>
                      <span className="font-bold text-slate-800 truncate max-w-[150px]">
                        {parentPlot?.name || 'Plot'} ({parentPlot?.area} {parentPlot?.area_unit})
                      </span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Sowing: {formatDate(plan.sowing_date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50">
                      <CheckCircle2 className="w-3.5 h-3.5 text-agri-600" />
                      <span>Harvest: {formatDate(plan.target_harvest_date)}</span>
                    </div>
                  </div>

                  {/* Profit estimate if available */}
                  {plan.illustrative_profit_estimate !== undefined && (
                    <div className="flex items-center justify-between text-[11px] text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                      <span>Illustrative Net Return:</span>
                      <span className="font-extrabold flex items-center">
                        <IndianRupee className="w-3 h-3" />
                        ₹{plan.illustrative_profit_estimate.toLocaleString()}
                      </span>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link to={`/app/crop-planner/${plan.id}`} className="flex-1 mr-2">
                    <Button variant="primary" size="sm" className="w-full text-xs gap-1.5">
                      <span>Open Plan Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>

                  <div className="flex items-center gap-1">
                    {/* Duplicate button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDuplicatingPlan(plan)}
                      aria-label={`Duplicate ${plan.title}`}
                      className="text-slate-600 min-h-[36px] px-2"
                      title="Duplicate for new season"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>

                    {/* Archive toggle */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPlanToArchive(plan)}
                      aria-label={plan.status === 'Archived' ? 'Restore plan' : 'Archive plan'}
                      className="text-slate-500 hover:text-slate-800 min-h-[36px] px-2"
                      title={plan.status === 'Archived' ? 'Restore plan' : 'Archive plan'}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </Button>

                    {/* Delete button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPlanToDelete(plan)}
                      aria-label={`Delete ${plan.title}`}
                      className="text-rose-500 hover:text-rose-700 min-h-[36px] px-2"
                      title="Delete permanently"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Duplicate Modal */}
      {duplicatingPlan && (
        <DuplicatePlanModal
          isOpen={Boolean(duplicatingPlan)}
          onClose={() => setDuplicatingPlan(null)}
          onDuplicate={async (newSeason, newSowingDate) => {
            await duplicateMutation.mutateAsync({
              planId: duplicatingPlan.id,
              season: newSeason,
              sowingDate: newSowingDate,
            });
          }}
          plan={duplicatingPlan}
          isLoading={duplicateMutation.isPending}
        />
      )}

      {/* Archive Modal */}
      {planToArchive && (
        <ConfirmDialog
          isOpen={Boolean(planToArchive)}
          onClose={() => setPlanToArchive(null)}
          onConfirm={() => {
            const nextStatus: PlanStatus = planToArchive.status === 'Archived' ? 'Planned' : 'Archived';
            updateStatusMutation.mutate({ planId: planToArchive.id, status: nextStatus });
          }}
          title={planToArchive.status === 'Archived' ? 'Restore Plan' : 'Archive Plan'}
          message={`Are you sure you want to ${planToArchive.status === 'Archived' ? 'restore' : 'archive'} "${planToArchive.title}"?`}
          confirmLabel={planToArchive.status === 'Archived' ? 'Restore Plan' : 'Archive Plan'}
          variant={planToArchive.status === 'Archived' ? 'primary' : 'destructive'}
        />
      )}

      {/* Delete Modal */}
      {planToDelete && (
        <ConfirmDialog
          isOpen={Boolean(planToDelete)}
          onClose={() => setPlanToDelete(null)}
          onConfirm={() => deleteMutation.mutate(planToDelete.id)}
          title="Delete Plan Permanently"
          message={`Are you sure you want to permanently delete "${planToDelete.title}"? This action cannot be reversed.`}
          confirmLabel="Delete Permanently"
          variant="destructive"
        />
      )}
    </div>
  );
};
