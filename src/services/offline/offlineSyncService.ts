// CropDiary AI — Offline Synchronization Orchestration Service
// Handles offline queuing, idempotent retries, conflict detection, and server confirmation.

import { indexedDbClient } from './indexedDbClient';
import { storageAdapter } from '@/services/storageAdapter';
import { FarmDiaryEntry } from '@/types/diary';
import { DiaryEntryFormData } from '@/lib/validation/diarySchemas';
import { SyncResult, SyncQueueItem } from '@/types/offline';
import { generateUUID } from '@/lib/utils';

let onlineOverride: boolean | null = null;

export const offlineSyncService = {
  setOnlineOverride(status: boolean | null): void {
    onlineOverride = status;
  },

  isOnline(): boolean {
    if (onlineOverride !== null) return onlineOverride;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },

  /**
   * Save a diary entry offline immediately with a stable client-generated UUID.
   * If online, attempts instant synchronization; if offline, stays queued safely.
   */
  async createEntryOffline(
    userId: string,
    data: DiaryEntryFormData & { attachments?: any[] },
    options?: { autoSync?: boolean }
  ): Promise<FarmDiaryEntry> {
    const now = new Date().toISOString();
    const entryId = generateUUID();

    const localEntry: FarmDiaryEntry = {
      id: entryId,
      owner_id: userId,
      farm_id: data.farm_id,
      plot_id: data.plot_id || null,
      crop_plan_id: data.crop_plan_id || null,
      entry_type: data.entry_type,
      title: data.title,
      description: data.description || null,
      occurred_at: data.occurred_at || now,
      status: 'active',
      tags: data.tags || [],
      metadata: {
        sync_status: 'pending',
        server_confirmed: false,
        client_created_at: now,
      },
      created_at: now,
      updated_at: now,
    };

    // Save to local IndexedDB store
    await indexedDbClient.saveOfflineEntry(localEntry);

    // Enqueue for synchronization
    await indexedDbClient.enqueueSync(userId, entryId, 'create', data);

    // If online and autoSync is enabled, attempt background sync
    if (options?.autoSync !== false && this.isOnline()) {
      this.syncPendingQueue(userId).catch((err) => {
        console.warn('Background sync attempt deferred:', err);
      });
    }

    return localEntry;
  },

  /**
   * Update a diary entry offline.
   */
  async updateEntryOffline(
    userId: string,
    entryId: string,
    updates: Partial<DiaryEntryFormData>
  ): Promise<FarmDiaryEntry> {
    const now = new Date().toISOString();
    let existing = await indexedDbClient.getOfflineEntryById(entryId);

    if (!existing) {
      // Pull from server storage if not already in IndexedDB
      const serverRecord = await storageAdapter.getDiaryEntryById(userId, entryId);
      if (!serverRecord) throw new Error('Diary entry not found');
      existing = serverRecord;
    }

    const updated = {
      ...existing,
      ...updates,
      updated_at: now,
      metadata: {
        ...(existing.metadata || {}),
        sync_status: 'pending',
        server_confirmed: false,
        client_updated_at: now,
      },
    } as FarmDiaryEntry;

    await indexedDbClient.saveOfflineEntry(updated);
    await indexedDbClient.enqueueSync(userId, entryId, 'update', updates);

    if (this.isOnline()) {
      this.syncPendingQueue(userId).catch((err) => {
        console.warn('Background sync attempt deferred:', err);
      });
    }

    return updated;
  },

  /**
   * Synchronize all pending items in the queue with the remote or local master storage.
   * Employs idempotency checks and explicit conflict detection.
   */
  async syncPendingQueue(userId: string): Promise<SyncResult> {
    const queue = await indexedDbClient.getPendingQueue(userId);

    const result: SyncResult = {
      totalProcessed: queue.length,
      successCount: 0,
      failureCount: 0,
      conflictCount: 0,
      errors: [],
    };

    if (queue.length === 0) return result;

    for (const item of queue) {
      await indexedDbClient.updateQueueStatus(item.id, 'syncing');

      try {
        if (item.operation === 'create') {
          await this.syncCreateItem(userId, item);
        } else if (item.operation === 'update') {
          await this.syncUpdateItem(userId, item);
        } else if (item.operation === 'delete') {
          await this.syncDeleteItem(userId, item);
        }

        // Successfully confirmed by server!
        await indexedDbClient.removeQueueItem(item.id);

        // Update local entry metadata
        const local = await indexedDbClient.getOfflineEntryById(item.entry_id);
        if (local) {
          local.metadata = {
            ...(local.metadata || {}),
            sync_status: 'synced',
            server_confirmed: true,
            synced_at: new Date().toISOString(),
          };
          await indexedDbClient.saveOfflineEntry(local);
        }

        result.successCount++;
      } catch (err: any) {
        if (err.message && err.message.includes('CONFLICT:')) {
          result.conflictCount++;
          await indexedDbClient.updateQueueStatus(item.id, 'failed', err.message);
        } else {
          result.failureCount++;
          result.errors.push({ entryId: item.entry_id, error: err.message || 'Sync error' });
          await indexedDbClient.updateQueueStatus(item.id, 'failed', err.message || 'Network error');
        }
      }
    }

    return result;
  },

  async syncCreateItem(userId: string, item: SyncQueueItem): Promise<void> {
    // Check if record already exists on server (idempotency check)
    const existing = await storageAdapter.getDiaryEntryById(userId, item.entry_id);
    if (existing) {
      // Already persisted, avoid duplicate insertion
      return;
    }

    await storageAdapter.createDiaryEntry(userId, {
      ...item.payload,
      id: item.entry_id, // Pass stable client UUID
    });
  },

  async syncUpdateItem(userId: string, item: SyncQueueItem): Promise<void> {
    const serverEntry = await storageAdapter.getDiaryEntryById(userId, item.entry_id);
    if (!serverEntry) {
      throw new Error('Server record missing for update');
    }

    // Explicit Conflict Detection:
    // If the server entry was updated after the client took this offline snapshot:
    const serverTime = new Date(serverEntry.updated_at).getTime();
    const clientSnapshotTime = new Date(item.client_updated_at).getTime();

    if (serverTime > clientSnapshotTime) {
      // Log conflict! Do not overwrite silently!
      await indexedDbClient.logConflict({
        entry_id: item.entry_id,
        owner_id: userId,
        client_payload: item.payload,
        server_payload: serverEntry,
        client_timestamp: item.client_updated_at,
        server_timestamp: serverEntry.updated_at,
        difference_summary: `Simultaneous edit conflict: Server modified on ${new Date(serverEntry.updated_at).toLocaleTimeString('en-IN')}; offline edits were made at ${new Date(item.client_updated_at).toLocaleTimeString('en-IN')}.`,
      });

      throw new Error(`CONFLICT: Simultaneous update detected for entry ${item.entry_id}`);
    }

    await storageAdapter.updateDiaryEntry(userId, item.entry_id, item.payload);
  },

  async syncDeleteItem(userId: string, item: SyncQueueItem): Promise<void> {
    await storageAdapter.deleteDiaryEntry(userId, item.entry_id);
    await indexedDbClient.deleteOfflineEntry(item.entry_id);
  },

  /**
   * Resolve an explicit sync conflict.
   */
  async resolveConflict(
    userId: string,
    conflictId: string,
    choice: 'keep_client' | 'keep_server'
  ): Promise<void> {
    const conflicts = await indexedDbClient.getConflicts(userId);
    const target = conflicts.find((c) => c.id === conflictId);
    if (!target) return;

    if (choice === 'keep_client') {
      // Force client payload to server
      await storageAdapter.updateDiaryEntry(userId, target.entry_id, target.client_payload);
    } else {
      // Revert local IndexedDB entry to server payload
      await indexedDbClient.saveOfflineEntry(target.server_payload);
    }

    await indexedDbClient.resolveConflict(conflictId, choice);
  },
};
