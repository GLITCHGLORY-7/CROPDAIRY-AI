// CropDiary AI — Offline Synchronization Context & Provider
// Manages real-time network connectivity, pending sync queues, conflict states, and manual triggers.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { indexedDbClient } from '@/services/offline/indexedDbClient';
import { offlineSyncService } from '@/services/offline/offlineSyncService';
import { SyncConflictRecord, OfflineSyncState } from '@/types/offline';

interface OfflineSyncContextValue extends OfflineSyncState {
  syncNow: () => Promise<void>;
  resolveConflict: (conflictId: string, choice: 'keep_client' | 'keep_server') => Promise<void>;
  refreshQueueStatus: () => Promise<void>;
}

const OfflineSyncContext = createContext<OfflineSyncContextValue | undefined>(undefined);

export const OfflineSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [conflictCount, setConflictCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<SyncConflictRecord[]>([]);

  const refreshQueueStatus = useCallback(async () => {
    if (!user) {
      setPendingCount(0);
      setConflictCount(0);
      setConflicts([]);
      return;
    }

    try {
      const [queue, conflictList] = await Promise.all([
        indexedDbClient.getPendingQueue(user.id),
        indexedDbClient.getConflicts(user.id),
      ]);
      setPendingCount(queue.length);
      setConflictCount(conflictList.length);
      setConflicts(conflictList);
    } catch (err) {
      console.warn('Failed to refresh offline queue status:', err);
    }
  }, [user]);

  const syncNow = useCallback(async () => {
    if (!user || isSyncing || !isOnline) return;

    try {
      setIsSyncing(true);
      await offlineSyncService.syncPendingQueue(user.id);
      setLastSyncTime(new Date().toISOString());
      await refreshQueueStatus();
    } catch (err) {
      console.error('Manual sync failure:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [user, isSyncing, isOnline, refreshQueueStatus]);

  const handleResolveConflict = useCallback(
    async (conflictId: string, choice: 'keep_client' | 'keep_server') => {
      if (!user) return;
      try {
        await offlineSyncService.resolveConflict(user.id, conflictId, choice);
        await refreshQueueStatus();
      } catch (err) {
        console.error('Conflict resolution failed:', err);
      }
    },
    [user, refreshQueueStatus]
  );

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (user) {
        // Automatically sync upon reconnection
        syncNow();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, syncNow]);

  // Periodic polling of pending items
  useEffect(() => {
    refreshQueueStatus();
    const interval = setInterval(refreshQueueStatus, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, [refreshQueueStatus]);

  return (
    <OfflineSyncContext.Provider
      value={{
        isOnline,
        isSyncing,
        pendingCount,
        conflictCount,
        lastSyncTime,
        conflicts,
        syncNow,
        resolveConflict: handleResolveConflict,
        refreshQueueStatus,
      }}
    >
      {children}
    </OfflineSyncContext.Provider>
  );
};

export const useOfflineSync = (): OfflineSyncContextValue => {
  const context = useContext(OfflineSyncContext);
  if (!context) {
    throw new Error('useOfflineSync must be used within an OfflineSyncProvider');
  }
  return context;
};
