// CropDiary AI — Diagnostic Assessment Detail Page
// Complete longitudinal view of an individual crop health assessment, photo specimen, and follow-ups.

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { cropDoctorService } from './services/cropDoctorService';
import { farmService } from '@/services/farmService';
import { AssessmentResultView } from './components/AssessmentResultView';
import { FollowupFormModal } from './components/FollowupFormModal';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useToast } from '@/context/ToastContext';
import {
  ArrowLeft,
  Calendar,
  Trash2,
  BookOpen,
} from 'lucide-react';
import { FollowupOutcome } from '@/types/cropDoctor';

export const CropAssessmentDetailPage: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [isFollowupOpen, setIsFollowupOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Fetch assessment
  const { data: assessment, isLoading, error } = useQuery({
    queryKey: ['crop_assessment', user?.id, assessmentId],
    queryFn: () => (user && assessmentId ? cropDoctorService.getAssessmentById(user.id, assessmentId) : null),
    enabled: Boolean(user && assessmentId),
  });

  // Fetch farm/plot name if attached
  const { data: farm } = useQuery({
    queryKey: ['farm', assessment?.farm_id],
    queryFn: () => (user && assessment?.farm_id ? farmService.getFarmById(user.id, assessment.farm_id) : null),
    enabled: Boolean(user && assessment?.farm_id),
  });

  // Add follow-up mutation
  const addFollowupMutation = useMutation({
    mutationFn: (data: {
      outcome: FollowupOutcome;
      days_after_assessment: number;
      remedies_applied: string[];
      notes?: string;
    }) => {
      if (!user || !assessmentId) throw new Error('Unauthorized');
      return cropDoctorService.addFollowup(user.id, {
        assessment_id: assessmentId,
        days_after_assessment: data.days_after_assessment,
        outcome: data.outcome,
        remedies_applied: data.remedies_applied,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crop_assessment', user?.id, assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['crop_assessments', user?.id] });
      showToast('success', 'Follow-Up Saved', 'New field observation recorded.');
      setIsFollowupOpen(false);
    },
    onError: (err: any) => {
      showToast('error', 'Error', err.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!user || !assessmentId) throw new Error('Unauthorized');
      return cropDoctorService.deleteAssessment(user.id, assessmentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crop_assessments', user?.id] });
      showToast('success', 'Scan Deleted', 'Crop assessment record removed.');
      navigate('/app/crop-doctor');
    },
    onError: (err: any) => {
      showToast('error', 'Error', err.message);
    },
  });

  const plot = farm?.plots.find((p: any) => p.id === assessment?.plot_id);

  const handleDiaryBridge = () => {
    if (!assessment) return;
    const draft = cropDoctorService.getFarmDiaryEntryDraft(assessment);
    showToast(
      'info',
      'Farm Diary Integration',
      `Assessment draft ready: "${draft.title}". You can review and save it in your Farm Diary.`
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto text-left">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Diagnostic Record Not Found</h2>
        <p className="text-sm text-slate-500">The requested crop health assessment does not exist or has been deleted.</p>
        <Link to="/app/crop-doctor">
          <Button variant="outline" size="sm">Back to Scans</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-left">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/app/crop-doctor"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Diagnoses</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDiaryBridge}
            className="text-xs gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-agri-600" />
            <span>Bridge to Diary</span>
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleteOpen(true)}
            className="text-xs gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Scan</span>
          </Button>
        </div>
      </div>

      {/* Main Diagnosis Report View */}
      <AssessmentResultView
        assessment={assessment}
        isSaved={true}
        onOpenFollowupModal={() => setIsFollowupOpen(true)}
      />

      {/* Specimen Photograph & Field Conditions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Photo View */}
        <div className="md:col-span-1">
          <Card className="overflow-hidden border-slate-200/90 shadow-xs h-full">
            <CardHeader className="p-3 bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-xs font-bold text-slate-700">
                Specimen Photograph
              </CardTitle>
            </CardHeader>
            <div className="relative aspect-square bg-slate-950">
              <img
                src={assessment.photo_url}
                alt={assessment.primary_diagnosis}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3 text-[11px] text-slate-500 bg-slate-50 border-t border-slate-100">
              Preserved in private storage with EXIF location stripped.
            </div>
          </Card>
        </div>

        {/* Observation Details */}
        <div className="md:col-span-2">
          <Card className="border-slate-200/90 shadow-xs h-full">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm">Field Intake Parameters</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Farm & Location</span>
                  <span className="font-semibold text-slate-800">
                    {farm ? `${farm.name} (${farm.district}, ${farm.state})` : 'Unassigned Farm'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Specific Plot</span>
                  <span className="font-semibold text-slate-800">
                    {plot ? `${plot.name} (${plot.soil_type})` : 'Unassigned Plot'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Affected Parts</span>
                  <span className="font-semibold text-slate-800">{assessment.affected_parts.join(', ')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Observable Symptoms</span>
                  <span className="font-semibold text-slate-800">{assessment.symptom_categories.join(', ')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Duration of Problem</span>
                  <span className="font-semibold text-slate-800">{assessment.problem_duration}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Spreading Status</span>
                  <span className="font-semibold text-slate-800">{assessment.is_spreading}</span>
                </div>
              </div>

              {assessment.recent_weather_or_irrigation && (
                <div className="pt-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Weather / Irrigation Notes</span>
                  <p className="text-slate-700 mt-0.5 leading-relaxed">{assessment.recent_weather_or_irrigation}</p>
                </div>
              )}

              {assessment.farmer_notes && (
                <div className="pt-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Farmer's Observation Notes</span>
                  <p className="text-slate-700 mt-0.5 leading-relaxed">{assessment.farmer_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Follow-Up Tracking History Timeline */}
      <Card className="border-slate-200/90 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-agri-600" />
              <span>Field Follow-Up Observations</span>
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Longitudinal tracking of plant recovery after cultural and biological intervention
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIsFollowupOpen(true)}
            className="text-xs gap-1.5"
          >
            <span>+ Add Observation</span>
          </Button>
        </CardHeader>

        <CardContent className="p-4">
          {!assessment.followups || assessment.followups.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 space-y-2">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No follow-up observations recorded yet.</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                After 5-7 days of applying cultural sanitation or IPM biocontrols, record whether symptoms stopped or improved.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {assessment.followups.map((f) => (
                <div
                  key={f.id}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {f.days_after_assessment} Days Post-Diagnosis
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">
                        {new Date(f.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </span>
                    </div>

                    <Badge
                      variant={
                        f.outcome === 'symptoms_improved' || f.outcome === 'crop_harvested_salvaged'
                          ? 'success'
                          : 'warning'
                      }
                    >
                      {f.outcome.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>

                  {f.remedies_applied.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Remedies Applied:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {f.remedies_applied.map((r, i) => (
                          <span
                            key={i}
                            className="text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-700"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {f.notes && (
                    <p className="text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/60 mt-1 leading-relaxed">
                      "{f.notes}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Follow-Up Form Modal */}
      <FollowupFormModal
        isOpen={isFollowupOpen}
        onClose={() => setIsFollowupOpen(false)}
        onSubmit={async (data) => {
          await addFollowupMutation.mutateAsync(data);
        }}
        isLoading={addFollowupMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete Diagnostic Record"
        message="Are you sure you want to permanently delete this crop assessment? Any associated photos and follow-up observations will be removed."
        confirmLabel="Delete Record"
        cancelLabel="Cancel"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={async () => {
          await deleteMutation.mutateAsync();
        }}
        onClose={() => setIsDeleteOpen(false)}
      />
    </div>
  );
};
