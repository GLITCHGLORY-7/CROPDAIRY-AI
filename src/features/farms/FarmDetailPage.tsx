import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { farmService } from '@/services/farmService';
import { plotService } from '@/services/plotService';
import { FarmFormData, PlotFormData } from '@/lib/validation/farmSchemas';
import { Plot } from '@/types/database';
import { useToast } from '@/context/ToastContext';
import { FarmFormModal } from './FarmFormModal';
import { PlotFormModal } from '@/features/plots/PlotFormModal';
import { PlotCard } from '@/features/plots/PlotCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { formatArea, convertToAcres } from '@/lib/formatters';
import {
  ArrowLeft,
  Plus,
  Edit,
  Archive,
  Trash2,
  MapPin,
  Layers,
  Droplet,
  Compass,
  AlertCircle,
  Trees,
} from 'lucide-react';

export const FarmDetailPage: React.FC = () => {
  const { farmId } = useParams<{ farmId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [isEditFarmOpen, setIsEditFarmOpen] = useState(false);
  const [isAddPlotOpen, setIsAddPlotOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null);
  const [isArchiveFarmOpen, setIsArchiveFarmOpen] = useState(false);
  const [isDeleteFarmOpen, setIsDeleteFarmOpen] = useState(false);

  // Fetch Farm with Plots
  const { data: farm, isLoading, isError, error } = useQuery({
    queryKey: ['farm', user?.id, farmId],
    queryFn: () => (user && farmId ? farmService.getFarmById(user.id, farmId) : null),
    enabled: Boolean(user && farmId),
  });

  // Mutations
  const updateFarmMutation = useMutation({
    mutationFn: (data: FarmFormData) => {
      if (!user || !farmId) throw new Error('Unauthorized');
      return farmService.updateFarm(user.id, farmId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farm', user?.id, farmId] });
      queryClient.invalidateQueries({ queryKey: ['farms', user?.id] });
      showToast('success', 'Farm Updated', 'Farm details saved successfully.');
    },
    onError: (err: any) => {
      showToast('error', 'Update Error', err.message || 'Could not update farm.');
    },
  });

  const toggleFarmStatusMutation = useMutation({
    mutationFn: () => {
      if (!user || !farm) throw new Error('Unauthorized');
      return farmService.toggleFarmStatus(user.id, farm.id, farm.status);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['farm', user?.id, farmId] });
      queryClient.invalidateQueries({ queryKey: ['farms', user?.id] });
      showToast('success', 'Status Updated', `Farm is now ${updated.status}.`);
    },
  });

  const deleteFarmMutation = useMutation({
    mutationFn: () => {
      if (!user || !farmId) throw new Error('Unauthorized');
      return farmService.deleteFarm(user.id, farmId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms', user?.id] });
      showToast('info', 'Farm Deleted', 'Farm and its associated plots were deleted.');
      navigate('/app/farms', { replace: true });
    },
    onError: (err: any) => {
      showToast('error', 'Delete Error', err.message);
    },
  });

  const createPlotMutation = useMutation({
    mutationFn: (data: PlotFormData) => {
      if (!user) throw new Error('Unauthorized');
      return plotService.createPlot(user.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farm', user?.id, farmId] });
      queryClient.invalidateQueries({ queryKey: ['plots', user?.id] });
      showToast('success', 'Plot Added', 'New plot registered to this farm.');
    },
    onError: (err: any) => {
      showToast('error', 'Plot Error', err.message);
    },
  });

  const updatePlotMutation = useMutation({
    mutationFn: (data: PlotFormData) => {
      if (!user || !editingPlot) throw new Error('Unauthorized');
      return plotService.updatePlot(user.id, editingPlot.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farm', user?.id, farmId] });
      queryClient.invalidateQueries({ queryKey: ['plots', user?.id] });
      showToast('success', 'Plot Updated', 'Plot details saved successfully.');
      setEditingPlot(null);
    },
    onError: (err: any) => {
      showToast('error', 'Update Error', err.message);
    },
  });

  const togglePlotStatusMutation = useMutation({
    mutationFn: (plot: Plot) => {
      if (!user) throw new Error('Unauthorized');
      return plotService.togglePlotStatus(user.id, plot.id, plot.status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farm', user?.id, farmId] });
      queryClient.invalidateQueries({ queryKey: ['plots', user?.id] });
      showToast('success', 'Plot Status Changed', 'Plot visibility updated.');
    },
  });

  const deletePlotMutation = useMutation({
    mutationFn: (plotId: string) => {
      if (!user) throw new Error('Unauthorized');
      return plotService.deletePlot(user.id, plotId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farm', user?.id, farmId] });
      queryClient.invalidateQueries({ queryKey: ['plots', user?.id] });
      showToast('info', 'Plot Deleted', 'Plot was removed.');
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !farm) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Farm Not Found</h2>
        <p className="text-sm text-slate-500">
          {(error as any)?.message || 'This farm does not exist or you do not have permission to view it.'}
        </p>
        <Link to="/app/farms">
          <Button variant="outline" size="md">
            Back to Farms List
          </Button>
        </Link>
      </div>
    );
  }

  const isFarmActive = farm.status === 'active';
  const plots = farm.plots || [];
  const activePlots = plots.filter((p) => p.status === 'active');

  // Compute total plot acreage vs farm acreage
  const totalPlotAcres = plots.reduce((acc, p) => acc + convertToAcres(p.area, p.area_unit), 0);
  const totalFarmAcres = convertToAcres(farm.area, farm.area_unit);
  const allocatedPercentage = totalFarmAcres > 0 ? Math.min(100, Math.round((totalPlotAcres / totalFarmAcres) * 100)) : 0;

  return (
    <div className="space-y-6 text-left">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/app/farms"
          className="inline-flex items-center text-xs sm:text-sm font-semibold text-slate-600 hover:text-agri-700 transition-colors gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Farms
        </Link>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditFarmOpen(true)}
            aria-label="Edit Farm Details"
          >
            <Edit className="w-3.5 h-3.5 mr-1.5" />
            Edit Farm
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsArchiveFarmOpen(true)}
            aria-label={isFarmActive ? 'Archive farm' : 'Restore farm'}
            className="text-xs text-slate-600"
          >
            <Archive className="w-3.5 h-3.5 mr-1" />
            {isFarmActive ? 'Archive' : 'Restore'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsDeleteFarmOpen(true)}
            aria-label="Delete farm"
            className="text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Farm Overview Card */}
      <Card className="border-slate-200/90 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-agri-50/50 via-white to-earth-50/50 border-b border-slate-100 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <CardTitle className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {farm.name}
                </CardTitle>
                <Badge variant={isFarmActive ? 'success' : 'neutral'}>
                  {isFarmActive ? 'Active Farm' : 'Archived'}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mt-1.5">
                <MapPin className="w-4 h-4 text-slate-400" aria-hidden="true" />
                <span>
                  {[farm.village, farm.district, farm.state, farm.country].filter(Boolean).join(', ')}
                </span>
                {farm.latitude && farm.longitude && (
                  <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-mono">
                    {farm.latitude.toFixed(4)}°N, {farm.longitude.toFixed(4)}°E
                  </span>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Total Land Holding
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-agri-700">
                {formatArea(farm.area, farm.area_unit)}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-4">
          {farm.description && (
            <p className="text-xs sm:text-sm text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
              {farm.description}
            </p>
          )}

          {/* Key Agricultural Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Farming Type</span>
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-agri-600" />
                {farm.farming_type}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-0.5">General Soil</span>
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-slate-500" />
                {farm.soil_type}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Irrigation Setup</span>
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-sky-500" />
                {farm.irrigation_method}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Water Availability</span>
              <span className="font-bold text-slate-800">
                {farm.water_availability}
              </span>
            </div>
          </div>

          {/* Partitioning progress bar */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs font-semibold mb-1 text-slate-700">
              <span>Plot Allocation: {activePlots.length} active plot{activePlots.length === 1 ? '' : 's'}</span>
              <span>{allocatedPercentage}% partitioned ({formatArea(totalPlotAcres, 'Acres')} in plots)</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
              <div
                className="bg-agri-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${allocatedPercentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sub-Plots Management Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Farm Plots ({plots.length})
            </h2>
            <p className="text-xs text-slate-500">
              Individual fields or blocks with custom soil, irrigation, and crop plans.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => setIsAddPlotOpen(true)}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add New Plot
          </Button>
        </div>

        {plots.length === 0 ? (
          <EmptyState
            icon={Trees}
            title="No Plots Added Yet"
            description={`Subdivide "${farm.name}" into dedicated plots for different crops, soil zones, or irrigation sectors.`}
            actionLabel="Create First Plot"
            onAction={() => setIsAddPlotOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plots.map((plot) => (
              <PlotCard
                key={plot.id}
                plot={plot}
                onEdit={(p) => setEditingPlot(p)}
                onToggleStatus={(p) => togglePlotStatusMutation.mutate(p)}
                onDelete={(id) => deletePlotMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <FarmFormModal
        isOpen={isEditFarmOpen}
        onClose={() => setIsEditFarmOpen(false)}
        onSubmit={async (data) => {
          await updateFarmMutation.mutateAsync(data);
        }}
        initialData={farm}
        isLoading={updateFarmMutation.isPending}
      />

      <PlotFormModal
        isOpen={isAddPlotOpen}
        onClose={() => setIsAddPlotOpen(false)}
        onSubmit={async (data) => {
          await createPlotMutation.mutateAsync(data);
        }}
        parentFarm={farm}
        isLoading={createPlotMutation.isPending}
      />

      {editingPlot && (
        <PlotFormModal
          isOpen={Boolean(editingPlot)}
          onClose={() => setEditingPlot(null)}
          onSubmit={async (data) => {
            await updatePlotMutation.mutateAsync(data);
          }}
          parentFarm={farm}
          initialData={editingPlot}
          isLoading={updatePlotMutation.isPending}
        />
      )}

      {/* Archive Farm Confirmation */}
      <ConfirmDialog
        isOpen={isArchiveFarmOpen}
        onClose={() => setIsArchiveFarmOpen(false)}
        onConfirm={() => {
          toggleFarmStatusMutation.mutate();
          setIsArchiveFarmOpen(false);
        }}
        title={isFarmActive ? 'Archive Farm' : 'Restore Farm'}
        message={
          isFarmActive
            ? `Archiving "${farm.name}" hides its plots from active planning while preserving all historical records.`
            : `Restoring "${farm.name}" will re-activate its plots for crop management.`
        }
        confirmLabel={isFarmActive ? 'Archive Farm' : 'Restore Farm'}
        variant={isFarmActive ? 'destructive' : 'primary'}
      />

      {/* Delete Farm Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteFarmOpen}
        onClose={() => setIsDeleteFarmOpen(false)}
        onConfirm={() => {
          deleteFarmMutation.mutate();
          setIsDeleteFarmOpen(false);
        }}
        title="Delete Farm Permanently"
        message={`Are you sure you want to permanently delete "${farm.name}" and all ${plots.length} associated plots? This action cannot be reversed.`}
        confirmLabel="Delete Farm and Plots"
        variant="destructive"
      />
    </div>
  );
};
