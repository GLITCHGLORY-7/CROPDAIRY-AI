// CropDiary AI — Offline Sync Conflict Resolution Modal
import React from 'react';
import { X, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { SyncConflictRecord } from '@/types/offline';

interface OfflineConflictModalProps {
  conflict: SyncConflictRecord;
  onResolve: (conflictId: string, choice: 'keep_client' | 'keep_server') => Promise<void>;
  onClose: () => void;
}

export const OfflineConflictModal: React.FC<OfflineConflictModalProps> = ({
  conflict,
  onResolve,
  onClose,
}) => {
  const [isResolving, setIsResolving] = React.useState(false);

  const handleChoice = async (choice: 'keep_client' | 'keep_server') => {
    setIsResolving(true);
    try {
      await onResolve(conflict.id, choice);
      onClose();
    } catch (err) {
      console.error('Failed to resolve sync conflict:', err);
      setIsResolving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-amber-50 dark:bg-amber-950/40">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h3 id="conflict-modal-title" className="text-sm font-bold">
              Simultaneous Edit Conflict Detected
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Close conflict dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            This farm diary entry was edited on another device or session while you were working offline.
            Please choose which version to preserve.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Client Version */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 space-y-2">
              <span className="font-bold text-slate-900 dark:text-slate-100 block">
                📱 My Offline Version
              </span>
              <p className="text-[11px] text-slate-500">
                Edited: {new Date(conflict.client_timestamp).toLocaleTimeString('en-IN')}
              </p>
              <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 line-clamp-4">
                <strong>{conflict.client_payload?.title || 'Diary Entry'}</strong>
                <p className="mt-1 text-[11px]">{conflict.client_payload?.description || 'No description'}</p>
              </div>
              <button
                type="button"
                disabled={isResolving}
                onClick={() => handleChoice('keep_client')}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                {isResolving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Keep My Changes</span>
              </button>
            </div>

            {/* Server Version */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 space-y-2">
              <span className="font-bold text-slate-900 dark:text-slate-100 block">
                ☁️ Server / Other Device
              </span>
              <p className="text-[11px] text-slate-500">
                Modified: {new Date(conflict.server_timestamp).toLocaleTimeString('en-IN')}
              </p>
              <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 line-clamp-4">
                <strong>{conflict.server_payload?.title || 'Diary Entry'}</strong>
                <p className="mt-1 text-[11px]">{conflict.server_payload?.description || 'No description'}</p>
              </div>
              <button
                type="button"
                disabled={isResolving}
                onClick={() => handleChoice('keep_server')}
                className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                {isResolving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Keep Server Version</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
