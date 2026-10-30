// CropDiary AI — AI Crop Doctor History & Management Page
// Displays diagnostic scans, plot-level filters, and access to new symptom analysis.

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { cropDoctorService } from './services/cropDoctorService';
import { farmService } from '@/services/farmService';
import { AssessmentHistoryCard } from './components/AssessmentHistoryCard';
import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useToast } from '@/context/ToastContext';
import {
  ScanEye,
  Plus,
  Filter,
  CheckCircle2,
  Calendar,
  Search,
} from 'lucide-react';

export const CropDoctorListPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [selectedFarmId, setSelectedFarmId] = useState<string>('all');
  const [selectedCrop, setSelectedCrop] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch farms for filter dropdown
  const { data: farms = [] } = useQuery({
    queryKey: ['farms', user?.id],
    queryFn: () => (user ? farmService.getFarmsWithPlots(user.id) : []),
    enabled: Boolean(user),
  });

  // Fetch all assessments for this tenant
  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['crop_assessments', user?.id],
    queryFn: () => (user ? cropDoctorService.getAssessments(user.id) : []),
    enabled: Boolean(user),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!user) throw new Error('Unauthorized');
      return cropDoctorService.deleteAssessment(user.id, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crop_assessments', user?.id] });
      showToast('success', 'Scan Deleted', 'Crop assessment record removed.');
      setDeletingId(null);
    },
    onError: (err: any) => {
      showToast('error', 'Error', err.message);
      setDeletingId(null);
    },
  });

  // Calculate statistics
  const totalScans = assessments.length;
  const highConfidenceCount = assessments.filter((a) => a.confidence_level === 'high').length;
  const followupsRecordedCount = assessments.filter(
    (a) => a.followups && a.followups.length > 0
  ).length;

  // Farm and Plot lookup maps
  const farmMap = new Map(farms.map((f) => [f.id, f]));
  const plotMap = new Map(
    farms.flatMap((f) => f.plots || []).map((p) => [p.id, p])
  );

  // Filter list
  const filteredAssessments = assessments.filter((a) => {
    if (selectedFarmId !== 'all' && a.farm_id !== selectedFarmId) return false;
    if (selectedCrop !== 'all' && a.crop_name !== selectedCrop) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDiag = a.primary_diagnosis.toLowerCase().includes(q);
      const matchCrop = a.crop_name.toLowerCase().includes(q);
      if (!matchDiag && !matchCrop) return false;
    }
    return true;
  });

  // Unique crops in history for filter
  const uniqueCrops = Array.from(new Set(assessments.map((a) => a.crop_name)));

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-950 via-agri-900 to-slate-900 text-white shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-agri-300">
              Crop Protection & Health Diagnostic Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            AI Crop Doctor
          </h1>
          <p className="text-xs sm:text-sm text-agri-100 max-w-2xl leading-relaxed">
            Diagnose foliar diseases, insect pests, and nutrient stress from photos with explainable Indian agricultural science and safe IPM guidance.
          </p>
        </div>

        <Link to="/app/crop-doctor/new">
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="text-xs gap-2 min-h-[44px] shadow-sm font-bold bg-white text-agri-950 hover:bg-slate-100"
          >
            <Plus className="w-4 h-4" />
            <span>New Crop Diagnosis</span>
          </Button>
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Diagnoses Recorded"
          value={totalScans.toString()}
          subtext="Saved to your farm history"
          icon={ScanEye}
          variant="neutral"
        />
        <StatCard
          label="High Confidence Matches"
          value={highConfidenceCount.toString()}
          subtext="Strong ICAR symptom correlation"
          icon={CheckCircle2}
          variant="agri"
        />
        <StatCard
          label="Field Follow-Ups Tracked"
          value={followupsRecordedCount.toString()}
          subtext="Post-treatment recovery monitored"
          icon={Calendar}
          variant="earth"
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex-1 relative">
          <label htmlFor="search-assessments-input" className="sr-only">
            Search diagnostic scans
          </label>
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="search-assessments-input"
            type="text"
            placeholder="Search by diagnosis or crop name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-agri-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Farm Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <label htmlFor="filter-farm-select" className="sr-only">Filter by farm</label>
            <select
              id="filter-farm-select"
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              className="rounded-lg border border-slate-200 p-2 text-xs bg-white text-slate-800 focus:outline-none focus:border-agri-600"
            >
              <option value="all">All Farms</option>
              {farms.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Crop Filter */}
          {uniqueCrops.length > 0 && (
            <div>
              <label htmlFor="filter-crop-select" className="sr-only">Filter by crop</label>
              <select
                id="filter-crop-select"
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="rounded-lg border border-slate-200 p-2 text-xs bg-white text-slate-800 focus:outline-none focus:border-agri-600"
              >
                <option value="all">All Crops</option>
                {uniqueCrops.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Assessments List / Content */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : filteredAssessments.length === 0 ? (
        <EmptyState
          icon={ScanEye}
          title={assessments.length === 0 ? 'No Crop Diagnoses Yet' : 'No Matching Diagnoses Found'}
          description={
            assessments.length === 0
              ? 'Notice strange leaf spots, wilting, or pests? Photograph the affected plant to receive an instant agronomic assessment with safe cultural and biological steps.'
              : 'Try clearing your search query or changing your farm and crop filters.'
          }
          actionLabel={assessments.length === 0 ? 'Start First Crop Diagnosis' : 'Clear Filters'}
          onAction={() => {
            if (assessments.length === 0) {
              window.location.href = '/app/crop-doctor/new';
            } else {
              setSelectedFarmId('all');
              setSelectedCrop('all');
              setSearchQuery('');
            }
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredAssessments.map((assessment) => {
            const farm = assessment.farm_id ? farmMap.get(assessment.farm_id) : undefined;
            const plot = assessment.plot_id ? plotMap.get(assessment.plot_id) : undefined;
            return (
              <AssessmentHistoryCard
                key={assessment.id}
                assessment={assessment}
                farmName={farm?.name}
                plotName={plot?.name}
                onDelete={(id) => setDeletingId(id)}
              />
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        title="Delete Diagnostic Record"
        message="Are you sure you want to delete this crop assessment? Any associated photos and follow-up observations will be permanently removed."
        confirmLabel="Delete Record"
        cancelLabel="Cancel"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={async () => {
          if (deletingId) await deleteMutation.mutateAsync(deletingId);
        }}
        onClose={() => setDeletingId(null)}
      />
    </div>
  );
};
