// CropDiary AI — Diary Entry Detail View Page
// Displays complete typed field records, metrics, photo attachments, and audit actions.

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { storageAdapter } from '@/services/storageAdapter';
import { diaryService } from './services/diaryService';
import { FarmDiaryEntry } from '@/types/diary';
import { Farm, Plot } from '@/types/database';
import { CropPlan } from '@/types/crop';
import { getEntryTypeMeta } from './components/DiaryEntryCard';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Archive,
  Calendar,
  Clock,
  MapPin,
  Camera,
  Layers,
  Sprout,
  Receipt,
  Wheat,
  Droplets,
  Trees,
  Eye,
  AlertTriangle,
} from 'lucide-react';

export const DiaryEntryDetailPage: React.FC = () => {
  const { entryId } = useParams<{ entryId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [entry, setEntry] = useState<FarmDiaryEntry | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [plot, setPlot] = useState<Plot | null>(null);
  const [cropPlan, setCropPlan] = useState<CropPlan | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const loadEntry = useCallback(async () => {
    if (!user || !entryId) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await diaryService.getEntryById(user.id, entryId);
      if (!data) {
        setErrorMessage('Diary entry not found or you do not have permission to view it.');
        return;
      }
      setEntry(data);

      // Load linked farm, plot, and crop plan
      const [userFarms, farmPlots, allPlans] = await Promise.all([
        storageAdapter.getFarms(user.id),
        storageAdapter.getPlots(data.farm_id),
        storageAdapter.getCropPlans(user.id),
      ]);

      setFarm(userFarms.find((f) => f.id === data.farm_id) || null);
      if (data.plot_id) {
        setPlot(farmPlots.find((p) => p.id === data.plot_id) || null);
      }
      if (data.crop_plan_id) {
        setCropPlan(allPlans.find((p) => p.id === data.crop_plan_id) || null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load diary entry details.');
    } finally {
      setIsLoading(false);
    }
  }, [user, entryId]);

  useEffect(() => {
    loadEntry();
  }, [loadEntry]);

  const handleDeleteConfirm = async () => {
    if (!user || !entryId) return;
    setIsDeleting(true);
    try {
      await diaryService.deleteEntry(user.id, entryId);
      navigate('/app/diary');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete entry.');
      setIsDeleting(false);
    }
  };

  const handleArchiveToggle = async () => {
    if (!user || !entry) return;
    const nextStatus = entry.status === 'archived' ? 'active' : 'archived';
    await diaryService.updateEntry(user.id, entry.id, { status: nextStatus });
    setEntry((prev) => (prev ? { ...prev, status: nextStatus } : null));
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-agri-200 border-t-agri-700 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-600">
          Loading diary record details...
        </p>
      </div>
    );
  }

  if (errorMessage || !entry) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Card className="p-8 border-dashed border-2 border-slate-300">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">
            Entry Not Found
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {errorMessage || 'This record does not exist or may have been deleted.'}
          </p>
          <div className="mt-4">
            <Link to="/app/diary">
              <Button variant="primary" size="sm">
                Return to Farm Diary
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const meta = getEntryTypeMeta(entry.entry_type);
  const Icon = meta.icon;

  const dateObj = new Date(entry.occurred_at);
  const dateFormatted = dateObj.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timeFormatted = dateObj.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-left">
      {/* Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/app/diary"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${meta.headerBg}`}>
                <Icon className="w-3.5 h-3.5" />
                <span>{meta.label}</span>
              </span>
              {entry.status === 'archived' && (
                <Badge variant="neutral" className="text-[10px]">
                  Archived
                </Badge>
              )}
              {entry.status === 'draft' && (
                <Badge variant="warning" className="text-[10px]">
                  Draft
                </Badge>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {entry.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleArchiveToggle}
            className="text-xs"
          >
            <Archive className="w-3.5 h-3.5 mr-1 text-slate-500" />
            <span>{entry.status === 'archived' ? 'Unarchive' : 'Archive'}</span>
          </Button>

          <Link to={`/app/diary/${entry.id}/edit`}>
            <Button variant="outline" size="sm" className="text-xs">
              <Edit2 className="w-3.5 h-3.5 mr-1 text-agri-600" />
              <span>Edit Entry</span>
            </Button>
          </Link>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
            className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Field Location & Timestamp Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-agri-50 text-agri-700 shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Farm Location
            </p>
            <p className="text-xs font-bold text-slate-900 truncate">
              {farm ? farm.name : 'Unknown Farm'}
            </p>
            {farm?.district && (
              <p className="text-[11px] text-slate-500">{farm.district}, {farm.state}</p>
            )}
          </div>
        </Card>

        <Card className="p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-50 text-sky-700 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Plot Reference
            </p>
            <p className="text-xs font-bold text-slate-900 truncate">
              {plot ? `${plot.name} (${plot.area} ${plot.area_unit})` : 'Entire Farm'}
            </p>
            {plot?.soil_type && (
              <p className="text-[11px] text-slate-500">Soil: {plot.soil_type}</p>
            )}
          </div>
        </Card>

        <Card className="p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-700 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Occurred On
            </p>
            <p className="text-xs font-bold text-slate-900">
              {dateFormatted}
            </p>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{timeFormatted}</span>
            </p>
          </div>
        </Card>
      </div>

      {/* Linked Crop Plan Banner */}
      {cropPlan && (
        <div className="p-3 bg-agri-50 border border-agri-200 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sprout className="w-4 h-4 text-agri-700 shrink-0" />
            <div>
              <span className="font-bold text-agri-950">Linked Crop Plan:</span>{' '}
              <span className="text-agri-900">{cropPlan.selected_crop_name} — {cropPlan.title}</span>
            </div>
          </div>
          <Link
            to={`/app/crop-planner/${cropPlan.id}`}
            className="text-agri-700 font-semibold hover:underline shrink-0"
          >
            Open Plan
          </Link>
        </div>
      )}

      {/* Description & Detailed Notes */}
      <Card className="p-5 space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Field Observations & Notes
        </h2>
        {entry.description ? (
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
            {entry.description}
          </p>
        ) : (
          <p className="text-xs text-slate-400 italic">No notes recorded for this entry.</p>
        )}

        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {entry.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Typed Sub-Detail Sections */}
      {entry.activity_detail && (
        <Card className="p-5 space-y-3 bg-emerald-50/40 border-emerald-200">
          <div className="flex items-center gap-2 border-b border-emerald-200/80 pb-2">
            <Trees className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-emerald-950">
              Activity Specifications
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Operation:</span>
              <span className="font-bold text-slate-800 capitalize">
                {entry.activity_detail.activity_type.replace(/_/g, ' ')}
              </span>
            </div>
            {entry.activity_detail.area_covered && (
              <div>
                <span className="text-slate-500 block">Area Covered:</span>
                <span className="font-bold text-slate-800">
                  {entry.activity_detail.area_covered} {entry.activity_detail.area_unit}
                </span>
              </div>
            )}
            {entry.activity_detail.duration_hours && (
              <div>
                <span className="text-slate-500 block">Duration:</span>
                <span className="font-bold text-slate-800">
                  {entry.activity_detail.duration_hours} hours
                </span>
              </div>
            )}
            {entry.activity_detail.labor_count && (
              <div>
                <span className="text-slate-500 block">Labor Count:</span>
                <span className="font-bold text-slate-800">
                  {entry.activity_detail.labor_count} workers
                </span>
              </div>
            )}
            {entry.activity_detail.labor_cost && (
              <div>
                <span className="text-slate-500 block">Labor Cost:</span>
                <span className="font-bold text-slate-800">
                  ₹{Number(entry.activity_detail.labor_cost).toLocaleString('en-IN')}
                </span>
              </div>
            )}
            {entry.activity_detail.machinery_used && (
              <div className="col-span-2">
                <span className="text-slate-500 block">Machinery Used:</span>
                <span className="font-bold text-slate-800">
                  {entry.activity_detail.machinery_used}
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {entry.irrigation_record && (
        <Card className="p-5 space-y-3 bg-sky-50/40 border-sky-200">
          <div className="flex items-center gap-2 border-b border-sky-200/80 pb-2">
            <Droplets className="w-4 h-4 text-sky-700" />
            <h3 className="text-sm font-bold text-sky-950">
              Irrigation Run Metrics
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Method:</span>
              <span className="font-bold text-slate-800">
                {entry.irrigation_record.irrigation_method}
              </span>
            </div>
            {entry.irrigation_record.duration_hours && (
              <div>
                <span className="text-slate-500 block">Duration:</span>
                <span className="font-bold text-slate-800">
                  {entry.irrigation_record.duration_hours} hours
                </span>
              </div>
            )}
            {entry.irrigation_record.water_quantity && (
              <div>
                <span className="text-slate-500 block">Volume:</span>
                <span className="font-bold text-slate-800">
                  {entry.irrigation_record.water_quantity} {entry.irrigation_record.water_quantity_unit}
                </span>
              </div>
            )}
            {entry.irrigation_record.water_source && (
              <div>
                <span className="text-slate-500 block">Water Source:</span>
                <span className="font-bold text-slate-800">
                  {entry.irrigation_record.water_source}
                </span>
              </div>
            )}
            {entry.irrigation_record.estimated_cost && (
              <div>
                <span className="text-slate-500 block">Electricity / Fuel Cost:</span>
                <span className="font-bold text-slate-800">
                  ₹{Number(entry.irrigation_record.estimated_cost).toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {entry.input_record && (
        <Card className="p-5 space-y-3 bg-agri-50/40 border-agri-200">
          <div className="flex items-center gap-2 border-b border-agri-200/80 pb-2">
            <Sprout className="w-4 h-4 text-agri-700" />
            <h3 className="text-sm font-bold text-agri-950">
              Fertilizer / Soil Amendment Record
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Product:</span>
              <span className="font-bold text-slate-800">
                {entry.input_record.input_name}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Category:</span>
              <span className="font-bold text-slate-800 capitalize">
                {entry.input_record.input_category.replace(/_/g, ' ')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Applied Quantity:</span>
              <span className="font-bold text-slate-800">
                {entry.input_record.quantity} {entry.input_record.unit}
              </span>
            </div>
            {entry.input_record.cost && (
              <div>
                <span className="text-slate-500 block">Input Cost:</span>
                <span className="font-bold text-slate-800">
                  ₹{Number(entry.input_record.cost).toLocaleString('en-IN')}
                </span>
              </div>
            )}
            {entry.input_record.supplier && (
              <div>
                <span className="text-slate-500 block">Supplier:</span>
                <span className="font-bold text-slate-800">
                  {entry.input_record.supplier}
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {entry.observation && (
        <Card className="p-5 space-y-3 bg-indigo-50/40 border-indigo-200">
          <div className="flex items-center gap-2 border-b border-indigo-200/80 pb-2">
            <Eye className="w-4 h-4 text-indigo-700" />
            <h3 className="text-sm font-bold text-indigo-950">
              Field Scouting Observation
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Category:</span>
              <span className="font-bold text-slate-800 capitalize">
                {entry.observation.observation_category.replace(/_/g, ' ')}
              </span>
            </div>
            {entry.observation.severity && (
              <div>
                <span className="text-slate-500 block">Severity:</span>
                <span className="font-bold text-rose-700 uppercase">
                  {entry.observation.severity}
                </span>
              </div>
            )}
            {entry.observation.affected_area_pct && (
              <div>
                <span className="text-slate-500 block">Affected Area:</span>
                <span className="font-bold text-slate-800">
                  {entry.observation.affected_area_pct}%
                </span>
              </div>
            )}
            {entry.observation.crop_stage && (
              <div>
                <span className="text-slate-500 block">Growth Stage:</span>
                <span className="font-bold text-slate-800">
                  {entry.observation.crop_stage}
                </span>
              </div>
            )}
          </div>
          {entry.observation.action_taken && (
            <div className="pt-2 text-xs">
              <span className="text-slate-500 block font-semibold">Action Taken:</span>
              <p className="text-slate-800 mt-0.5">{entry.observation.action_taken}</p>
            </div>
          )}
        </Card>
      )}

      {entry.expense && (
        <Card className="p-5 space-y-3 bg-rose-50/40 border-rose-200">
          <div className="flex items-center gap-2 border-b border-rose-200/80 pb-2">
            <Receipt className="w-4 h-4 text-rose-700" />
            <h3 className="text-sm font-bold text-rose-950">
              Financial Expense Breakdown
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Total Amount:</span>
              <span className="text-lg font-extrabold text-rose-700">
                ₹{Number(entry.expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Category:</span>
              <span className="font-bold text-slate-800 capitalize">
                {entry.expense.category.replace(/_/g, ' ')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Payment Method:</span>
              <span className="font-bold text-slate-800 capitalize">
                {entry.expense.payment_method}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Status:</span>
              <span className="font-bold text-slate-800 capitalize">
                {entry.expense.payment_status}
              </span>
            </div>
            {entry.expense.vendor_payee && (
              <div className="col-span-2">
                <span className="text-slate-500 block">Payee / Vendor:</span>
                <span className="font-bold text-slate-800">
                  {entry.expense.vendor_payee}
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {entry.harvest && (
        <Card className="p-5 space-y-3 bg-amber-50/40 border-amber-200">
          <div className="flex items-center gap-2 border-b border-amber-200/80 pb-2">
            <Wheat className="w-4 h-4 text-amber-700" />
            <h3 className="text-sm font-bold text-amber-950">
              Harvest Production Output
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Harvested Yield:</span>
              <span className="text-lg font-extrabold text-amber-900">
                {entry.harvest.quantity_harvested} {entry.harvest.unit}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Crop Produce:</span>
              <span className="font-bold text-slate-800">
                {entry.harvest.crop_name}
              </span>
            </div>
            {entry.harvest.quality_grade && (
              <div>
                <span className="text-slate-500 block">Grade:</span>
                <span className="font-bold text-slate-800">
                  {entry.harvest.quality_grade}
                </span>
              </div>
            )}
            {entry.harvest.actual_revenue ? (
              <div>
                <span className="text-slate-500 block">Realized Revenue:</span>
                <span className="text-base font-bold text-emerald-700">
                  ₹{Number(entry.harvest.actual_revenue).toLocaleString('en-IN')}
                </span>
              </div>
            ) : null}
            {entry.harvest.quantity_retained_household ? (
              <div>
                <span className="text-slate-500 block">Retained for Home:</span>
                <span className="font-bold text-slate-800">
                  {entry.harvest.quantity_retained_household} {entry.harvest.unit}
                </span>
              </div>
            ) : null}
            {entry.harvest.quantity_for_sale ? (
              <div>
                <span className="text-slate-500 block">Sold in Mandi:</span>
                <span className="font-bold text-slate-800">
                  {entry.harvest.quantity_for_sale} {entry.harvest.unit}
                </span>
              </div>
            ) : null}
          </div>
        </Card>
      )}

      {/* Attachments & Photographs Gallery */}
      {entry.attachments && entry.attachments.length > 0 && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Camera className="w-4 h-4 text-slate-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Attached Photographs ({entry.attachments.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {entry.attachments.map((att) => (
              <div
                key={att.id}
                className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-2xs"
              >
                <div className="aspect-video w-full bg-slate-200 overflow-hidden">
                  <img
                    src={att.file_url}
                    alt={att.file_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 text-xs">
                  <p className="font-semibold text-slate-800">{att.file_name}</p>
                  {att.caption && (
                    <p className="text-slate-600 mt-1 italic">"{att.caption}"</p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    {(att.file_size_bytes / 1024).toFixed(0)} KB • {att.media_type}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Diary Entry"
        message="Are you sure you want to permanently delete this farm diary entry? All typed details and photos will be removed."
        confirmLabel="Delete Permanently"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
};
