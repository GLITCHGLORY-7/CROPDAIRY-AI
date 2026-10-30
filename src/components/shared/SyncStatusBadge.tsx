// CropDiary AI — Sync Status Badge Component
import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { SyncStatus } from '@/types/offline';

interface SyncStatusBadgeProps {
  status?: SyncStatus;
  serverConfirmed?: boolean;
  className?: string;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  status = 'synced',
  serverConfirmed = true,
  className = '',
}) => {
  if (status === 'syncing') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 ${className}`}
        title="Syncing changes with cloud server"
      >
        <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
        <span>Syncing...</span>
      </span>
    );
  }

  if (status === 'pending' || !serverConfirmed) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 ${className}`}
        title="Saved locally on device; will sync when internet is connected"
      >
        <Clock className="w-3 h-3 text-amber-600" />
        <span>Saved Locally (Pending Sync)</span>
      </span>
    );
  }

  if (status === 'conflict' || status === 'failed') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800 ${className}`}
        title="Sync paused due to conflict or network error"
      >
        <AlertTriangle className="w-3 h-3 text-rose-600" />
        <span>Sync Conflict</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 ${className}`}
      title="Verified and synchronized with cloud server"
    >
      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
      <span>Cloud Synced</span>
    </span>
  );
};
