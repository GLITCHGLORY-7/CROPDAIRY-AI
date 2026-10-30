// CropDiary AI — Network Status & Sync Activity Bar
import React, { useState } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { useOfflineSync } from '@/context/OfflineSyncContext';
import { OfflineConflictModal } from './OfflineConflictModal';

export const NetworkStatusBar: React.FC = () => {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    conflictCount,
    conflicts,
    syncNow,
    resolveConflict,
  } = useOfflineSync();

  const [activeConflictIndex, setActiveConflictIndex] = useState<number | null>(null);

  // If online, not syncing, 0 pending, and 0 conflicts, render a discreet online pill
  if (isOnline && !isSyncing && pendingCount === 0 && conflictCount === 0) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
        <Wifi className="w-3.5 h-3.5 text-emerald-600" />
        <span className="hidden sm:inline">Online • Synced</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Sync Conflict Warning */}
        {conflictCount > 0 && (
          <button
            type="button"
            onClick={() => setActiveConflictIndex(0)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-semibold animate-pulse hover:bg-rose-100"
            aria-label={`${conflictCount} synchronization conflict requiring attention`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>{conflictCount} Conflict{conflictCount > 1 ? 's' : ''}</span>
          </button>
        )}

        {/* Offline / Pending State */}
        {!isOnline ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-xs font-medium text-amber-800 dark:text-amber-200">
            <WifiOff className="w-3.5 h-3.5 text-amber-600" />
            <span>
              Offline
              {pendingCount > 0 ? ` • ${pendingCount} Saved Locally` : ''}
            </span>
          </div>
        ) : pendingCount > 0 ? (
          <button
            type="button"
            onClick={syncNow}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-800 text-xs font-medium text-blue-800 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
            aria-label="Synchronize local changes now"
          >
            {isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-blue-600" />
            )}
            <span>
              {isSyncing ? 'Syncing...' : `${pendingCount} Pending • Sync Now`}
            </span>
          </button>
        ) : null}
      </div>

      {/* Conflict Resolution Modal */}
      {activeConflictIndex !== null && conflicts[activeConflictIndex] && (
        <OfflineConflictModal
          conflict={conflicts[activeConflictIndex]}
          onResolve={resolveConflict}
          onClose={() => setActiveConflictIndex(null)}
        />
      )}
    </>
  );
};
