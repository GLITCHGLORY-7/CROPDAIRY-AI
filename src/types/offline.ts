// CropDiary AI — Phase 8 Offline Storage & Synchronization Type Definitions

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';

export type SyncOperation = 'create' | 'update' | 'delete';

export interface SyncQueueItem {
  id: string; // Queue event UUID
  entry_id: string; // Target diary entry UUID
  owner_id: string;
  operation: SyncOperation;
  payload: any;
  client_updated_at: string;
  retry_count: number;
  status: SyncStatus;
  error?: string;
  created_at: string;
}

export interface SyncConflictRecord {
  id: string;
  entry_id: string;
  owner_id: string;
  client_payload: any;
  server_payload: any;
  client_timestamp: string;
  server_timestamp: string;
  difference_summary: string;
  detected_at: string;
  resolution?: 'keep_client' | 'keep_server';
  resolved_at?: string;
}

export interface SyncResult {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  conflictCount: number;
  errors: Array<{ entryId: string; error: string }>;
}

export interface OfflineSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  conflictCount: number;
  lastSyncTime: string | null;
  conflicts: SyncConflictRecord[];
}
