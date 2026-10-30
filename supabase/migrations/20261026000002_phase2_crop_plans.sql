-- CropDiary AI — Phase 2 Migration: Crop Plans & Curated Agricultural Reference Schema

-- 1. Reference Crop Templates Table (Public read-only)
CREATE TABLE IF NOT EXISTS public.crop_templates (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    scientific_name VARCHAR(120),
    category VARCHAR(50) NOT NULL,
    local_names JSONB NOT NULL DEFAULT '{}'::jsonb,
    seasons JSONB NOT NULL DEFAULT '[]'::jsonb,
    duration_days_min INT NOT NULL CHECK (duration_days_min > 0),
    duration_days_max INT NOT NULL CHECK (duration_days_max >= duration_days_min),
    water_requirement_mm DECIMAL(7, 2) NOT NULL,
    water_category VARCHAR(50) NOT NULL,
    suitable_soils JSONB NOT NULL DEFAULT '[]'::jsonb,
    suitable_irrigation JSONB NOT NULL DEFAULT '[]'::jsonb,
    suitable_environments JSONB NOT NULL DEFAULT '[]'::jsonb,
    min_temp_c DECIMAL(4, 1),
    max_temp_c DECIMAL(4, 1),
    typical_cost_per_acre JSONB NOT NULL,
    expected_yield_per_acre JSONB NOT NULL,
    typical_selling_price_per_unit JSONB NOT NULL,
    key_pests_diseases JSONB NOT NULL DEFAULT '[]'::jsonb,
    cultivation_summary TEXT NOT NULL,
    risks JSONB NOT NULL DEFAULT '[]'::jsonb,
    data_source TEXT NOT NULL,
    last_verified DATE NOT NULL,
    data_quality VARCHAR(20) DEFAULT 'Verified' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.crop_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read crop templates"
    ON public.crop_templates FOR SELECT
    USING (true);

-- 2. Crop Plans Table
CREATE TABLE IF NOT EXISTS public.crop_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    plot_id UUID NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    status VARCHAR(30) DEFAULT 'Draft' NOT NULL CHECK (status IN ('Draft', 'Ready for review', 'Planned', 'Active', 'Completed', 'Archived')),
    selected_crop_id VARCHAR(50) NOT NULL,
    selected_crop_name VARCHAR(120) NOT NULL,
    sowing_date DATE NOT NULL,
    target_harvest_date DATE,
    season VARCHAR(30) NOT NULL,
    inputs JSONB NOT NULL,
    selected_candidate_snapshot JSONB NOT NULL,
    shortlist_snapshots JSONB NOT NULL DEFAULT '[]'::jsonb,
    estimated_total_cost DECIMAL(12, 2) DEFAULT 0.00,
    illustrative_profit_estimate DECIMAL(12, 2),
    timeline_stages JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crop_plans_owner ON public.crop_plans (owner_id);
CREATE INDEX IF NOT EXISTS idx_crop_plans_farm ON public.crop_plans (farm_id);
CREATE INDEX IF NOT EXISTS idx_crop_plans_plot ON public.crop_plans (plot_id);
CREATE INDEX IF NOT EXISTS idx_crop_plans_status ON public.crop_plans (status);

CREATE TRIGGER update_crop_plans_modtime
    BEFORE UPDATE ON public.crop_plans
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. Row Level Security Policies for Crop Plans
ALTER TABLE public.crop_plans ENABLE ROW LEVEL SECURITY;

-- Owner Isolation Policy with Parent Farm Ownership Verification
CREATE POLICY "Users can view own crop plans"
    ON public.crop_plans FOR SELECT
    USING (
        auth.uid() = owner_id AND
        EXISTS (
            SELECT 1 FROM public.farms
            WHERE farms.id = crop_plans.farm_id
            AND farms.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own crop plans"
    ON public.crop_plans FOR INSERT
    WITH CHECK (
        auth.uid() = owner_id AND
        EXISTS (
            SELECT 1 FROM public.farms
            WHERE farms.id = crop_plans.farm_id
            AND farms.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own crop plans"
    ON public.crop_plans FOR UPDATE
    USING (
        auth.uid() = owner_id AND
        EXISTS (
            SELECT 1 FROM public.farms
            WHERE farms.id = crop_plans.farm_id
            AND farms.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own crop plans"
    ON public.crop_plans FOR DELETE
    USING (
        auth.uid() = owner_id AND
        EXISTS (
            SELECT 1 FROM public.farms
            WHERE farms.id = crop_plans.farm_id
            AND farms.owner_id = auth.uid()
        )
    );
