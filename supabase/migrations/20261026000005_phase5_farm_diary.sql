-- CropDiary AI — Phase 5 Database Migration
-- Smart Farm Diary, Activity Tracking, Input Usage, Observations, Expenses & Harvests

-- 1. Master Diary Entries Table
CREATE TABLE IF NOT EXISTS public.farm_diary_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    plot_id UUID REFERENCES public.plots(id) ON DELETE SET NULL,
    crop_plan_id UUID REFERENCES public.crop_plans(id) ON DELETE SET NULL,
    entry_type VARCHAR(50) NOT NULL CHECK (
        entry_type IN ('general', 'activity', 'irrigation', 'input_application', 'crop_observation', 'expense', 'harvest')
    ),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'archived', 'draft')),
    tags TEXT[] NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_farm_diary_entries_modtime
    BEFORE UPDATE ON public.farm_diary_entries
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. Typed Detail: Farm Activity Details
CREATE TABLE IF NOT EXISTS public.farm_activity_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID NOT NULL UNIQUE REFERENCES public.farm_diary_entries(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    area_covered NUMERIC(10,2),
    area_unit VARCHAR(20) DEFAULT 'Acres',
    duration_hours NUMERIC(6,2),
    labor_count INT DEFAULT 1,
    labor_cost NUMERIC(12,2) DEFAULT 0,
    machinery_used TEXT,
    materials_used TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Typed Detail: Irrigation Records
CREATE TABLE IF NOT EXISTS public.irrigation_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID NOT NULL UNIQUE REFERENCES public.farm_diary_entries(id) ON DELETE CASCADE,
    irrigation_method VARCHAR(50) NOT NULL,
    duration_hours NUMERIC(6,2),
    water_quantity NUMERIC(10,2),
    water_quantity_unit VARCHAR(20) DEFAULT 'liters',
    estimated_cost NUMERIC(12,2) DEFAULT 0,
    soil_moisture_before VARCHAR(50),
    soil_moisture_after VARCHAR(50),
    water_source VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Typed Detail: Fertilizer & Soil-Input Records
CREATE TABLE IF NOT EXISTS public.farm_input_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID NOT NULL UNIQUE REFERENCES public.farm_diary_entries(id) ON DELETE CASCADE,
    input_name VARCHAR(150) NOT NULL,
    input_category VARCHAR(50) NOT NULL,
    quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(30) NOT NULL,
    area_treated NUMERIC(10,2),
    area_unit VARCHAR(20) DEFAULT 'Acres',
    cost NUMERIC(12,2) DEFAULT 0,
    supplier VARCHAR(150),
    batch_number VARCHAR(50),
    safety_precaution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Typed Detail: Crop Observations
CREATE TABLE IF NOT EXISTS public.crop_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID NOT NULL UNIQUE REFERENCES public.farm_diary_entries(id) ON DELETE CASCADE,
    observation_category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    affected_area_pct NUMERIC(5,2),
    crop_stage VARCHAR(50),
    linked_assessment_id UUID REFERENCES public.crop_assessments(id) ON DELETE SET NULL,
    follow_up_date DATE,
    action_taken TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Typed Detail: Farm Expenses
CREATE TABLE IF NOT EXISTS public.farm_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID NOT NULL UNIQUE REFERENCES public.farm_diary_entries(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    payment_method VARCHAR(30) DEFAULT 'cash',
    payment_status VARCHAR(20) DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'partial')),
    receipt_photo_url TEXT,
    vendor_payee VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Typed Detail: Harvest Records
CREATE TABLE IF NOT EXISTS public.harvest_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID NOT NULL UNIQUE REFERENCES public.farm_diary_entries(id) ON DELETE CASCADE,
    crop_name VARCHAR(150) NOT NULL,
    quantity_harvested NUMERIC(10,2) NOT NULL CHECK (quantity_harvested >= 0),
    unit VARCHAR(30) NOT NULL,
    harvested_area NUMERIC(10,2),
    harvested_area_unit VARCHAR(20) DEFAULT 'Acres',
    quality_grade VARCHAR(50),
    quantity_retained_household NUMERIC(10,2) DEFAULT 0,
    quantity_for_sale NUMERIC(10,2) DEFAULT 0,
    actual_revenue NUMERIC(12,2),
    estimated_revenue NUMERIC(12,2),
    buyer_market VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Diary Media Attachments
CREATE TABLE IF NOT EXISTS public.farm_diary_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID NOT NULL REFERENCES public.farm_diary_entries(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    media_type VARCHAR(50) NOT NULL,
    file_size_bytes INT NOT NULL,
    caption TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_diary_entries_owner ON public.farm_diary_entries(owner_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_farm ON public.farm_diary_entries(farm_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_plot ON public.farm_diary_entries(plot_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_plan ON public.farm_diary_entries(crop_plan_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_occurred_at ON public.farm_diary_entries(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_diary_entries_type ON public.farm_diary_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_diary_attachments_entry ON public.farm_diary_attachments(entry_id);
CREATE INDEX IF NOT EXISTS idx_diary_expenses_category ON public.farm_expenses(category);
CREATE INDEX IF NOT EXISTS idx_diary_harvest_crop ON public.harvest_records(crop_name);

-- 10. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.farm_diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_activity_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.irrigation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_input_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.harvest_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_diary_attachments ENABLE ROW LEVEL SECURITY;

-- 11. Strict Row Level Security Policies
CREATE POLICY "Users can only access their own diary entries"
    ON public.farm_diary_entries FOR ALL
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can only access their own activity details"
    ON public.farm_activity_details FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.farm_diary_entries e
        WHERE e.id = farm_activity_details.entry_id AND e.owner_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.farm_diary_entries e
        WHERE e.id = farm_activity_details.entry_id AND e.owner_id = auth.uid()
    ));

CREATE POLICY "Users can only access their own irrigation records"
    ON public.irrigation_records FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.farm_diary_entries e
        WHERE e.id = irrigation_records.entry_id AND e.owner_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.farm_diary_entries e
        WHERE e.id = irrigation_records.entry_id AND e.owner_id = auth.uid()
    ));

CREATE POLICY "Users can only access their own input records"
    ON public.farm_input_records FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.farm_diary_entries e
        WHERE e.id = farm_input_records.entry_id AND e.owner_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.farm_diary_entries e
        WHERE e.id = farm_input_records.entry_id AND e.owner_id = auth.uid()
    ));

CREATE POLICY "Users can only access their own crop observations"
    ON public.crop_observations FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.farm_diary_entries e
        WHERE e.id = crop_observations.entry_id AND e.owner_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.farm_diary_entries e
        WHERE e.id = crop_observations.entry_id AND e.owner_id = auth.uid()
    ));

CREATE POLICY "Users can only access their own expenses"
    ON public.farm_expenses FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.farm_diary_entries e
        WHERE e.id = farm_expenses.entry_id AND e.owner_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.farm_diary_entries e
        WHERE e.id = farm_expenses.entry_id AND e.owner_id = auth.uid()
    ));

CREATE POLICY "Users can only access their own harvest records"
    ON public.harvest_records FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.farm_diary_entries e
        WHERE e.id = harvest_records.entry_id AND e.owner_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.farm_diary_entries e
        WHERE e.id = harvest_records.entry_id AND e.owner_id = auth.uid()
    ));

CREATE POLICY "Users can only access their own diary attachments"
    ON public.farm_diary_attachments FOR ALL
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);
