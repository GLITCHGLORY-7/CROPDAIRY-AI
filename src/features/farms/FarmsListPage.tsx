import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { farmService } from '@/services/farmService';
import { FarmWithPlots } from '@/types/database';
import { FarmFormData } from '@/lib/validation/farmSchemas';
import { useToast } from '@/context/ToastContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { FarmFormModal } from './FarmFormModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { formatArea, formatDate } from '@/lib/formatters';
import {
  Trees,
  Plus,
  MapPin,
  Compass,
  ArrowRight,
  Edit,
  Archive,
  Trash2,
  Layers,
} from 'lucide-react';

export const FarmsListPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState<FarmWithPlots | null>(null);
  const [farmToArchive, setFarmToArchive] = useState<FarmWithPlots | null>(null);
  const [farmToDelete, setFarmToDelete] = useState<FarmWithPlots | null>(null);

  // Query: Get Farms with Plots
  const { data: farms = [], isLoading } = useQuery({
    queryKey: ['farms', user?.id],
    queryFn: () => (user ? farmService.getFarmsWithPlots(user.id) : []),
    enabled: Boolean(user),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: FarmFormData) => {
      if (!user) throw new Error('Unauthorized');
      return farmService.createFarm(user.id, data);
    },
    onSuccess: (newFarm) => {
      queryClient.invalidateQueries({ queryKey: ['farms', user?.id] });
      showToast('success', 'Farm Registered', `"${newFarm.name}" is now ready for plot setup.`);
    },
    onError: (err: any) => {
      showToast('error', 'Registration Error', err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FarmFormData) => {
      if (!user || !editingFarm) throw new Error('Unauthorized');
      return farmService.updateFarm(user.id, editingFarm.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms', user?.id] });
      showToast('success', 'Farm Updated', 'Changes saved successfully.');
      setEditingFarm(null);
    },
    onError: (err: any) => {
      showToast('error', 'Update Error', err.message);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (farm: FarmWithPlots) => {
      if (!user) throw new Error('Unauthorized');
      return farmService.toggleFarmStatus(user.id, farm.id, farm.status);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['farms', user?.id] });
      showToast('success', 'Status Changed', `Farm is now ${updated.status}.`);
      setFarmToArchive(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (farmId: string) => {
      if (!user) throw new Error('Unauthorized');
      return farmService.deleteFarm(user.id, farmId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms', user?.id] });
      showToast('info', 'Farm Deleted', 'Farm record removed.');
      setFarmToDelete(null);
    },
    onError: (err: any) => {
      showToast('error', 'Delete Error', err.message);
    },
  });

  const filteredFarms = farms.filter((f) => {
    if (statusFilter === 'all') return true;
    return f.status === statusFilter;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Farms & Land Holdings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Register and manage your farming properties, soil profiles, and sub-plots.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={() => setIsCreateOpen(true)}
          className="gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Register New Farm
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {(['active', 'all', 'archived'] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setStatusFilter(filter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors min-h-[36px] ${
              statusFilter === filter
                ? 'bg-agri-700 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {filter} ({farms.filter((f) => (filter === 'all' ? true : f.status === filter)).length})
          </button>
        ))}
      </div>

      {/* Farms Grid / Loading / Empty */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : filteredFarms.length === 0 ? (
        <EmptyState
          icon={Trees}
          title={statusFilter === 'archived' ? 'No Archived Farms' : 'No Farms Registered Yet'}
          description={
            statusFilter === 'archived'
              ? 'Archived farms will be safely preserved here.'
              : 'Add your first farm to partition plots, monitor weather, and start crop planning.'
          }
          actionLabel={statusFilter !== 'archived' ? 'Register First Farm' : undefined}
          onAction={statusFilter !== 'archived' ? () => setIsCreateOpen(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFarms.map((farm) => {
            const isActive = farm.status === 'active';
            const plotCount = farm.plots?.length || 0;

            return (
              <Card key={farm.id} className="flex flex-col justify-between hover:border-slate-300 transition-all shadow-xs">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg font-bold text-slate-900">{farm.name}</CardTitle>
                        <Badge variant={isActive ? 'success' : 'neutral'}>
                          {isActive ? 'Active' : 'Archived'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                        <span>{[farm.district, farm.state].filter(Boolean).join(', ')}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold text-agri-700 bg-agri-50 px-2 py-1 rounded-lg border border-agri-200 block">
                        {formatArea(farm.area, farm.area_unit)}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 py-2 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50">
                      <Compass className="w-4 h-4 text-agri-600" aria-hidden="true" />
                      <span className="truncate">{farm.farming_type}</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50">
                      <Layers className="w-4 h-4 text-slate-400" aria-hidden="true" />
                      <span className="truncate">{farm.soil_type}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-earth-50 border border-earth-100 flex items-center justify-between text-slate-700 font-medium">
                    <span>Configured Plots</span>
                    <span className="font-bold text-agri-800 bg-white px-2 py-0.5 rounded border border-earth-200">
                      {plotCount} plot{plotCount === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 text-right">
                    Created {formatDate(farm.created_at)}
                  </div>
                </CardContent>

                <CardFooter className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link to={`/app/farms/${farm.id}`} className="flex-1 mr-2">
                    <Button variant="primary" size="sm" className="w-full text-xs gap-1.5">
                      <span>View & Manage Plots</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingFarm(farm)}
                      aria-label={`Edit ${farm.name}`}
                      className="text-slate-600 min-h-[36px] px-2"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFarmToArchive(farm)}
                      aria-label={isActive ? `Archive ${farm.name}` : `Activate ${farm.name}`}
                      className="text-slate-500 hover:text-slate-800 min-h-[36px] px-2"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFarmToDelete(farm)}
                      aria-label={`Delete ${farm.name}`}
                      className="text-rose-500 hover:text-rose-700 min-h-[36px] px-2"
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

      {/* Farm Create/Edit Modal */}
      <FarmFormModal
        isOpen={isCreateOpen || Boolean(editingFarm)}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingFarm(null);
        }}
        onSubmit={async (data) => {
          if (editingFarm) {
            await updateMutation.mutateAsync(data);
          } else {
            await createMutation.mutateAsync(data);
          }
        }}
        initialData={editingFarm}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Archive Modal */}
      {farmToArchive && (
        <ConfirmDialog
          isOpen={Boolean(farmToArchive)}
          onClose={() => setFarmToArchive(null)}
          onConfirm={() => toggleStatusMutation.mutate(farmToArchive)}
          title={farmToArchive.status === 'active' ? 'Archive Farm' : 'Restore Farm'}
          message={`Are you sure you want to ${farmToArchive.status === 'active' ? 'archive' : 'restore'} "${farmToArchive.name}"?`}
          confirmLabel={farmToArchive.status === 'active' ? 'Archive Farm' : 'Restore Farm'}
          variant={farmToArchive.status === 'active' ? 'destructive' : 'primary'}
        />
      )}

      {/* Delete Modal */}
      {farmToDelete && (
        <ConfirmDialog
          isOpen={Boolean(farmToDelete)}
          onClose={() => setFarmToDelete(null)}
          onConfirm={() => deleteMutation.mutate(farmToDelete.id)}
          title="Delete Farm Permanently"
          message={`Are you sure you want to permanently delete "${farmToDelete.name}" and all associated plots? This action cannot be undone.`}
          confirmLabel="Delete Permanently"
          variant="destructive"
        />
      )}
    </div>
  );
};
