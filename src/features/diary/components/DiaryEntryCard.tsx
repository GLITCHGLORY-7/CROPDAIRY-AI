// CropDiary AI — Diary Entry Timeline Card Component
// Displays specialized agricultural entry cards with type badges, key metrics, and photo thumbnails.

import React from 'react';
import { Link } from 'react-router-dom';
import { FarmDiaryEntry, DiaryEntryType } from '@/types/diary';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Trees,
  Droplets,
  Sprout,
  Eye,
  IndianRupee,
  Wheat,
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  Camera,
  Trash2,
  Edit2,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SyncStatusBadge } from '@/components/shared/SyncStatusBadge';

interface DiaryEntryCardProps {
  entry: FarmDiaryEntry;
  farmName?: string;
  plotName?: string;
  cropPlanTitle?: string;
  onDelete?: (entryId: string) => void;
  isProcessing?: boolean;
}

export function getEntryTypeMeta(type: DiaryEntryType) {
  switch (type) {
    case 'activity':
      return {
        label: 'Farm Activity',
        icon: Trees,
        badgeVariant: 'success' as const,
        headerBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      };
    case 'irrigation':
      return {
        label: 'Irrigation',
        icon: Droplets,
        badgeVariant: 'neutral' as const,
        headerBg: 'bg-sky-50 text-sky-800 border-sky-200',
      };
    case 'input_application':
      return {
        label: 'Fertilizer & Inputs',
        icon: Sprout,
        badgeVariant: 'agri' as const,
        headerBg: 'bg-agri-50 text-agri-800 border-agri-200',
      };
    case 'crop_observation':
      return {
        label: 'Crop Observation',
        icon: Eye,
        badgeVariant: 'warning' as const,
        headerBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      };
    case 'expense':
      return {
        label: 'Farm Expense',
        icon: IndianRupee,
        badgeVariant: 'destructive' as const,
        headerBg: 'bg-rose-50 text-rose-800 border-rose-200',
      };
    case 'harvest':
      return {
        label: 'Harvest Record',
        icon: Wheat,
        badgeVariant: 'warning' as const,
        headerBg: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    case 'general':
    default:
      return {
        label: 'General Note',
        icon: BookOpen,
        badgeVariant: 'neutral' as const,
        headerBg: 'bg-slate-50 text-slate-800 border-slate-200',
      };
  }
}

export const DiaryEntryCard: React.FC<DiaryEntryCardProps> = ({
  entry,
  farmName,
  plotName,
  cropPlanTitle,
  onDelete,
  isProcessing = false,
}) => {
  const meta = getEntryTypeMeta(entry.entry_type);
  const Icon = meta.icon;

  const dateObj = new Date(entry.occurred_at);
  const dateFormatted = dateObj.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeFormatted = dateObj.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card className="overflow-hidden border-slate-200/90 shadow-xs hover:border-agri-300 transition-all text-left">
      {/* Header bar with category badge & date */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border',
              meta.headerBg
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{meta.label}</span>
          </span>

          {entry.status === 'draft' && (
            <Badge variant="warning" className="text-[10px]">
              Draft
            </Badge>
          )}

          {/* Offline Sync State Badge */}
          <SyncStatusBadge
            status={entry.metadata?.sync_status || 'synced'}
            serverConfirmed={entry.metadata?.server_confirmed !== false}
          />
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{dateFormatted}</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{timeFormatted}</span>
          </span>
        </div>
      </div>

      {/* Body content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              <Link
                to={`/app/diary/${entry.id}`}
                className="hover:text-agri-700 hover:underline transition-colors"
              >
                {entry.title}
              </Link>
            </h3>

            {/* Farm & plot tag */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-slate-500">
              <span className="flex items-center gap-1 text-slate-700 font-medium">
                <MapPin className="w-3.5 h-3.5 text-agri-600" />
                <span>{farmName || 'Farm'}</span>
              </span>
              {plotName && (
                <>
                  <span>›</span>
                  <span className="text-slate-600">{plotName}</span>
                </>
              )}
              {cropPlanTitle && (
                <>
                  <span>•</span>
                  <span className="text-agri-700 font-medium">
                    {cropPlanTitle}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Key Metric Highlights Badge */}
          {entry.entry_type === 'expense' && entry.expense && (
            <div className="text-right shrink-0">
              <span className="text-sm font-extrabold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 block">
                ₹{Number(entry.expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-400 capitalize">
                {entry.expense.payment_status}
              </span>
            </div>
          )}

          {entry.entry_type === 'harvest' && entry.harvest && (
            <div className="text-right shrink-0">
              <span className="text-sm font-extrabold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 block">
                {entry.harvest.quantity_harvested} {entry.harvest.unit}
              </span>
              {entry.harvest.actual_revenue ? (
                <span className="text-[10px] text-emerald-700 font-semibold">
                  +₹{Number(entry.harvest.actual_revenue).toLocaleString('en-IN')}
                </span>
              ) : null}
            </div>
          )}

          {entry.entry_type === 'irrigation' && entry.irrigation_record && (
            <div className="text-right shrink-0">
              <span className="text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 block">
                {entry.irrigation_record.irrigation_method}
              </span>
              {entry.irrigation_record.duration_hours && (
                <span className="text-[10px] text-slate-500">
                  {entry.irrigation_record.duration_hours} hrs
                </span>
              )}
            </div>
          )}

          {entry.entry_type === 'input_application' && entry.input_record && (
            <div className="text-right shrink-0">
              <span className="text-xs font-bold text-agri-800 bg-agri-50 px-2 py-0.5 rounded-md border border-agri-200 block">
                {entry.input_record.quantity} {entry.input_record.unit}
              </span>
              <span className="text-[10px] text-slate-500 truncate max-w-[120px] block">
                {entry.input_record.input_name}
              </span>
            </div>
          )}
        </div>

        {/* Description preview */}
        {entry.description && (
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {entry.description}
          </p>
        )}

        {/* Specialized Sub-Detail Mini Summary */}
        {entry.activity_detail && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <span>
              Operation: <strong className="capitalize">{entry.activity_detail.activity_type.replace(/_/g, ' ')}</strong>
            </span>
            {entry.activity_detail.area_covered && (
              <span>• Area: <strong>{entry.activity_detail.area_covered} {entry.activity_detail.area_unit}</strong></span>
            )}
            {entry.activity_detail.labor_count && (
              <span>• Laborers: <strong>{entry.activity_detail.labor_count}</strong></span>
            )}
          </div>
        )}

        {entry.observation && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-indigo-900 bg-indigo-50/60 p-2 rounded-lg border border-indigo-100">
            <span>
              Category: <strong className="capitalize">{entry.observation.observation_category.replace(/_/g, ' ')}</strong>
            </span>
            {entry.observation.severity && (
              <span className="uppercase font-bold text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 border border-indigo-200">
                {entry.observation.severity} Severity
              </span>
            )}
            {entry.observation.crop_stage && (
              <span>• Stage: <strong>{entry.observation.crop_stage}</strong></span>
            )}
          </div>
        )}

        {/* Attachments preview & tags */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            {entry.attachments && entry.attachments.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                  <Camera className="w-3 h-3 text-slate-500" />
                  <span>{entry.attachments.length} {entry.attachments.length === 1 ? 'photo' : 'photos'}</span>
                </span>
                <div className="flex -space-x-1.5 overflow-hidden">
                  {entry.attachments.slice(0, 3).map((att, i) => (
                    <img
                      key={att.id || i}
                      src={att.file_url}
                      alt={att.file_name}
                      className="inline-block h-6 w-6 rounded-md object-cover ring-2 ring-white"
                    />
                  ))}
                </div>
              </div>
            )}

            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {entry.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action links */}
          <div className="flex items-center gap-2 ml-auto">
            <Link to={`/app/diary/${entry.id}/edit`}>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Edit diary entry ${entry.title}`}
                className="text-xs h-7 px-2 text-slate-600 hover:text-agri-700"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1" />
                <span>Edit</span>
              </Button>
            </Link>

            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                disabled={isProcessing}
                onClick={() => onDelete(entry.id)}
                aria-label={`Delete diary entry ${entry.title}`}
                className="text-xs h-7 px-2 text-slate-400 hover:text-rose-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}

            <Link to={`/app/diary/${entry.id}`}>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 px-2 text-agri-700 border-agri-200 hover:bg-agri-50"
              >
                <span>View Details</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
};
