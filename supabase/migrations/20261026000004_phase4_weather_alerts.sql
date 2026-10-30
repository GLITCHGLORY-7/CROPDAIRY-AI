-- CropDiary AI — Phase 4 Migration: Weather Intelligence, Agricultural Alerts & Farm Reminders
-- Features: Weather Cache, Agricultural Weather Alerts, Farm Reminders, User Notifications with RLS

-- 1. Create weather_cache table (stores normalized forecast payloads to reduce API calls)
CREATE TABLE IF NOT EXISTS public.weather_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key VARCHAR(150) UNIQUE NOT NULL,
    latitude DECIMAL(9, 6) NOT NULL,
    longitude DECIMAL(9, 6) NOT NULL,
    provider VARCHAR(60) NOT NULL DEFAULT 'open-meteo',
    forecast_data JSONB NOT NULL,
    retrieved_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_weather_cache_key ON public.weather_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_weather_cache_expires ON public.weather_cache(expires_at);

-- 2. Create farm_weather_alerts table
CREATE TABLE IF NOT EXISTS public.farm_weather_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    plot_id UUID REFERENCES public.plots(id) ON DELETE SET NULL,
    crop_plan_id UUID REFERENCES public.crop_plans(id) ON DELETE SET NULL,
    alert_type VARCHAR(60) NOT NULL CHECK (alert_type IN ('heavy_rain', 'heat_stress', 'cold_stress', 'high_wind', 'dry_spell', 'spray_window', 'disease_favorable')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    title VARCHAR(150) NOT NULL,
    explanation TEXT NOT NULL,
    trigger_measurements JSONB NOT NULL DEFAULT '{}'::jsonb,
    practical_steps TEXT[] NOT NULL DEFAULT '{}',
    forecast_window_start TIMESTAMPTZ NOT NULL,
    forecast_window_end TIMESTAMPTZ NOT NULL,
    rule_version VARCHAR(60) NOT NULL DEFAULT 'ICAR-AgroMet-v1.0',
    is_crop_specific BOOLEAN DEFAULT FALSE NOT NULL,
    crop_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'dismissed', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_farm_weather_alerts_modtime
    BEFORE UPDATE ON public.farm_weather_alerts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. Create farm_reminders table
CREATE TABLE IF NOT EXISTS public.farm_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    plot_id UUID REFERENCES public.plots(id) ON DELETE SET NULL,
    crop_plan_id UUID REFERENCES public.crop_plans(id) ON DELETE SET NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('irrigation', 'scouting', 'fieldwork', 'fertilizer', 'harvest', 'weather_action', 'custom')),
    due_date TIMESTAMPTZ NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata' NOT NULL,
    recurrence VARCHAR(30) DEFAULT 'none' NOT NULL CHECK (recurrence IN ('none', 'daily', 'weekly', 'biweekly', 'monthly')),
    status VARCHAR(30) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'snoozed', 'cancelled')),
    snoozed_until TIMESTAMPTZ,
    weather_trigger_condition JSONB,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_farm_reminders_modtime
    BEFORE UPDATE ON public.farm_reminders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Create user_notifications table
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('weather_alert', 'reminder_due', 'system')),
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    resource_type VARCHAR(50) CHECK (resource_type IN ('weather_alert', 'reminder', 'farm', 'crop_plan')),
    resource_id UUID,
    read_at TIMESTAMPTZ,
    is_dismissed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Indexes for performant querying
CREATE INDEX IF NOT EXISTS idx_weather_alerts_owner ON public.farm_weather_alerts(owner_id);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_farm ON public.farm_weather_alerts(farm_id);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_status ON public.farm_weather_alerts(status);
CREATE INDEX IF NOT EXISTS idx_reminders_owner ON public.farm_reminders(owner_id);
CREATE INDEX IF NOT EXISTS idx_reminders_farm ON public.farm_reminders(farm_id);
CREATE INDEX IF NOT EXISTS idx_reminders_status_due ON public.farm_reminders(status, due_date);
CREATE INDEX IF NOT EXISTS idx_notifications_owner_unread ON public.user_notifications(owner_id, read_at);

-- 6. Enable Row-Level Security (RLS)
ALTER TABLE public.weather_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_weather_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- 7. Policies for weather_cache (shared cache readable by authenticated users, insertable/updatable)
CREATE POLICY "Authenticated users can read cached weather"
    ON public.weather_cache FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert/update cached weather"
    ON public.weather_cache FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 8. Strict Tenant Policies for farm_weather_alerts
CREATE POLICY "Users can view own weather alerts"
    ON public.farm_weather_alerts FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can create own weather alerts"
    ON public.farm_weather_alerts FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own weather alerts"
    ON public.farm_weather_alerts FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own weather alerts"
    ON public.farm_weather_alerts FOR DELETE
    USING (auth.uid() = owner_id);

-- 9. Strict Tenant Policies for farm_reminders
CREATE POLICY "Users can view own farm reminders"
    ON public.farm_reminders FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can create own farm reminders"
    ON public.farm_reminders FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own farm reminders"
    ON public.farm_reminders FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own farm reminders"
    ON public.farm_reminders FOR DELETE
    USING (auth.uid() = owner_id);

-- 10. Strict Tenant Policies for user_notifications
CREATE POLICY "Users can view own notifications"
    ON public.user_notifications FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can create own notifications"
    ON public.user_notifications FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own notifications"
    ON public.user_notifications FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own notifications"
    ON public.user_notifications FOR DELETE
    USING (auth.uid() = owner_id);
