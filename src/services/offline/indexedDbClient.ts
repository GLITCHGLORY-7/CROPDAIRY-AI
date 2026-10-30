// CropDiary AI — IndexedDB Client Wrapper for Offline Diary Storage
// Implements transactional stores: offline_diary_entries, sync_queue, sync_conflicts.
// Fully isolated per user (owner_id) with fallback for non-browser/test environments.

import { FarmDiaryEntry } from '@/types/diary';
import { SyncQueueItem, SyncConflictRecord, SyncStatus, SyncOperation } from '@/types/offline';

const DB_NAME = 'cropdiary_offline_db';
const DB_VERSION = 1;

import { generateUUID } from '@/lib/utils';

const STORES = {
  ENTRIES: 'offline_diary_entries',
  QUEUE: 'sync_queue',
  CONFLICTS: 'sync_conflicts',
} as const;

class IndexedDbClient {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryEntries = new Map<string, FarmDiaryEntry>();
  private memoryQueue = new Map<string, SyncQueueItem>();
  private memoryConflicts = new Map<string, SyncConflictRecord>();

  private isIdbSupported(): boolean {
    return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
  }

  private async getDB(): Promise<IDBDatabase> {
    if (!this.isIdbSupported()) {
      throw new Error('IndexedDB is not supported in this environment');
    }

    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. Offline Diary Entries Store
        if (!db.objectStoreNames.contains(STORES.ENTRIES)) {
          const entryStore = db.createObjectStore(STORES.ENTRIES, { keyPath: 'id' });
          entryStore.createIndex('owner_id', 'owner_id', { unique: false });
          entryStore.createIndex('farm_id', 'farm_id', { unique: false });
          entryStore.createIndex('updated_at', 'updated_at', { unique: false });
        }

        // 2. Sync Queue Store
        if (!db.objectStoreNames.contains(STORES.QUEUE)) {
          const queueStore = db.createObjectStore(STORES.QUEUE, { keyPath: 'id' });
          queueStore.createIndex('owner_id', 'owner_id', { unique: false });
          queueStore.createIndex('entry_id', 'entry_id', { unique: false });
          queueStore.createIndex('status', 'status', { unique: false });
          queueStore.createIndex('created_at', 'created_at', { unique: false });
        }

        // 3. Sync Conflicts Store
        if (!db.objectStoreNames.contains(STORES.CONFLICTS)) {
          const conflictStore = db.createObjectStore(STORES.CONFLICTS, { keyPath: 'id' });
          conflictStore.createIndex('owner_id', 'owner_id', { unique: false });
          conflictStore.createIndex('entry_id', 'entry_id', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // --- Offline Diary Entries ---

  async saveOfflineEntry(entry: FarmDiaryEntry): Promise<void> {
    if (!this.isIdbSupported()) {
      this.memoryEntries.set(entry.id, { ...entry });
      return;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.ENTRIES, 'readwrite');
      const store = tx.objectStore(STORES.ENTRIES);
      const req = store.put(entry);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getOfflineEntries(userId: string): Promise<FarmDiaryEntry[]> {
    if (!this.isIdbSupported()) {
      return Array.from(this.memoryEntries.values()).filter((e) => e.owner_id === userId);
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.ENTRIES, 'readonly');
      const store = tx.objectStore(STORES.ENTRIES);
      const index = store.index('owner_id');
      const req = index.getAll(IDBKeyRange.only(userId));
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getOfflineEntryById(entryId: string): Promise<FarmDiaryEntry | null> {
    if (!this.isIdbSupported()) {
      return this.memoryEntries.get(entryId) || null;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.ENTRIES, 'readonly');
      const store = tx.objectStore(STORES.ENTRIES);
      const req = store.get(entryId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteOfflineEntry(entryId: string): Promise<void> {
    if (!this.isIdbSupported()) {
      this.memoryEntries.delete(entryId);
      return;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.ENTRIES, 'readwrite');
      const store = tx.objectStore(STORES.ENTRIES);
      const req = store.delete(entryId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- Synchronization Queue ---

  async enqueueSync(
    userId: string,
    entryId: string,
    operation: SyncOperation,
    payload: any
  ): Promise<SyncQueueItem> {
    const item: SyncQueueItem = {
      id: generateUUID(),
      entry_id: entryId,
      owner_id: userId,
      operation,
      payload,
      client_updated_at: new Date().toISOString(),
      retry_count: 0,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    if (!this.isIdbSupported()) {
      this.memoryQueue.set(item.id, item);
      return item;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.QUEUE);
      const req = store.put(item);
      req.onsuccess = () => resolve(item);
      req.onerror = () => reject(req.error);
    });
  }

  async getPendingQueue(userId: string): Promise<SyncQueueItem[]> {
    if (!this.isIdbSupported()) {
      return Array.from(this.memoryQueue.values()).filter(
        (q) => q.owner_id === userId && (q.status === 'pending' || q.status === 'failed')
      );
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.QUEUE, 'readonly');
      const store = tx.objectStore(STORES.QUEUE);
      const index = store.index('owner_id');
      const req = index.getAll(IDBKeyRange.only(userId));
      req.onsuccess = () => {
        const all: SyncQueueItem[] = req.result || [];
        resolve(all.filter((q) => q.status === 'pending' || q.status === 'failed'));
      };
      req.onerror = () => reject(req.error);
    });
  }

  async updateQueueStatus(
    queueId: string,
    status: SyncStatus,
    error?: string
  ): Promise<void> {
    if (!this.isIdbSupported()) {
      const item = this.memoryQueue.get(queueId);
      if (item) {
        item.status = status;
        if (error) item.error = error;
        if (status === 'failed') item.retry_count += 1;
        this.memoryQueue.set(queueId, item);
      }
      return;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.QUEUE);
      const getReq = store.get(queueId);

      getReq.onsuccess = () => {
        const item = getReq.result as SyncQueueItem | undefined;
        if (!item) {
          resolve();
          return;
        }
        item.status = status;
        if (error) item.error = error;
        if (status === 'failed') item.retry_count += 1;
        const putReq = store.put(item);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async removeQueueItem(queueId: string): Promise<void> {
    if (!this.isIdbSupported()) {
      this.memoryQueue.delete(queueId);
      return;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.QUEUE);
      const req = store.delete(queueId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- Conflict Tracking ---

  async logConflict(conflict: Omit<SyncConflictRecord, 'id' | 'detected_at'>): Promise<SyncConflictRecord> {
    const record: SyncConflictRecord = {
      ...conflict,
      id: generateUUID(),
      detected_at: new Date().toISOString(),
    };

    if (!this.isIdbSupported()) {
      this.memoryConflicts.set(record.id, record);
      return record;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CONFLICTS, 'readwrite');
      const store = tx.objectStore(STORES.CONFLICTS);
      const req = store.put(record);
      req.onsuccess = () => resolve(record);
      req.onerror = () => reject(req.error);
    });
  }

  async getConflicts(userId: string): Promise<SyncConflictRecord[]> {
    if (!this.isIdbSupported()) {
      return Array.from(this.memoryConflicts.values()).filter(
        (c) => c.owner_id === userId && !c.resolution
      );
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CONFLICTS, 'readonly');
      const store = tx.objectStore(STORES.CONFLICTS);
      const index = store.index('owner_id');
      const req = index.getAll(IDBKeyRange.only(userId));
      req.onsuccess = () => {
        const all: SyncConflictRecord[] = req.result || [];
        resolve(all.filter((c) => !c.resolution));
      };
      req.onerror = () => reject(req.error);
    });
  }

  async resolveConflict(
    conflictId: string,
    resolution: 'keep_client' | 'keep_server'
  ): Promise<void> {
    if (!this.isIdbSupported()) {
      const c = this.memoryConflicts.get(conflictId);
      if (c) {
        c.resolution = resolution;
        c.resolved_at = new Date().toISOString();
        this.memoryConflicts.set(conflictId, c);
      }
      return;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CONFLICTS, 'readwrite');
      const store = tx.objectStore(STORES.CONFLICTS);
      const getReq = store.get(conflictId);
      getReq.onsuccess = () => {
        const c = getReq.result as SyncConflictRecord | undefined;
        if (!c) {
          resolve();
          return;
        }
        c.resolution = resolution;
        c.resolved_at = new Date().toISOString();
        const putReq = store.put(c);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  // --- Sensitive Data Clearance upon Logout ---

  async clearUserData(userId: string): Promise<void> {
    if (!this.isIdbSupported()) {
      for (const [key, val] of this.memoryEntries.entries()) {
        if (val.owner_id === userId) this.memoryEntries.delete(key);
      }
      for (const [key, val] of this.memoryQueue.entries()) {
        if (val.owner_id === userId) this.memoryQueue.delete(key);
      }
      for (const [key, val] of this.memoryConflicts.entries()) {
        if (val.owner_id === userId) this.memoryConflicts.delete(key);
      }
      return;
    }

    const db = await this.getDB();
    const stores = [STORES.ENTRIES, STORES.QUEUE, STORES.CONFLICTS];

    for (const storeName of stores) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const index = store.index('owner_id');
        const req = index.getAllKeys(IDBKeyRange.only(userId));

        req.onsuccess = () => {
          const keys = req.result || [];
          let pending = keys.length;
          if (pending === 0) {
            resolve();
            return;
          }
          for (const key of keys) {
            const delReq = store.delete(key);
            delReq.onsuccess = () => {
              pending--;
              if (pending === 0) resolve();
            };
            delReq.onerror = () => reject(delReq.error);
          }
        };
        req.onerror = () => reject(req.error);
      });
    }
  }
}

export const indexedDbClient = new IndexedDbClient();
