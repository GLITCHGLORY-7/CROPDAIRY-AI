-- CropDiary AI — Phase 8 Migration: Offline Synchronization Logs & Multi-Season Performance Analytics
-- Ensures idempotent offline sync reconciliation and accelerated multi-season queries.

-- 1. Client Sync Logs Table (Idempotency & Conflict Tracking)
CREATE TABLE IF NOT EXISTS client_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_entry_id UUID NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
    status TEXT NOT NULL CHECK (status IN ('synced', 'conflict', 'failed', 'rejected')),
    client_timestamp TIMESTAMPTZ NOT NULL,
    server_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    error_message TEXT,
    conflict_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for Fast Sync Reconciliation & Multi-Season Analytics
CREATE INDEX IF NOT EXISTS idx_client_sync_logs_owner_client_entry 
    ON client_sync_logs (owner_id, client_entry_id);

CREATE INDEX IF NOT EXISTS idx_crop_plans_season_year 
    ON crop_plans (owner_id, season, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_diary_entries_harvest_stats 
    ON farm_diary_entries (owner_id, occurred_at DESC) 
    WHERE entry_type = 'harvest';

CREATE INDEX IF NOT EXISTS idx_financial_transactions_seasonal 
    ON farm_financial_transactions (owner_id, farm_id, occurred_at DESC);

-- 3. Row Level Security Policies
ALTER TABLE client_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can view their own sync logs"
    ON client_sync_logs FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Farmers can insert their own sync logs"
    ON client_sync_logs FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Farmers can update their own sync logs"
    ON client_sync_logs FOR UPDATE
    USING (auth.uid() = owner_id);
