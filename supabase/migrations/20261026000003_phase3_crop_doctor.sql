-- CropDiary AI — Phase 3 Migration: AI Crop Doctor
-- Features: Disease & Pest Assessments, Diagnostic History, Follow-ups, Private Storage Bucket with RLS

-- 1. Create crop_assessments table
CREATE TABLE IF NOT EXISTS public.crop_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
    plot_id UUID REFERENCES public.plots(id) ON DELETE SET NULL,
    crop_plan_id UUID REFERENCES public.crop_plans(id) ON DELETE SET NULL,
    crop_name VARCHAR(100) NOT NULL,
    growth_stage VARCHAR(60),
    photo_url TEXT NOT NULL,
    photo_storage_path TEXT,
    affected_parts TEXT[] NOT NULL DEFAULT '{}',
    symptom_categories TEXT[] NOT NULL DEFAULT '{}',
    problem_duration VARCHAR(50) NOT NULL,
    is_spreading VARCHAR(80) NOT NULL,
    recent_weather_or_irrigation TEXT,
    farmer_notes TEXT,
    primary_diagnosis VARCHAR(150) NOT NULL,
    diagnosis_type VARCHAR(50) NOT NULL CHECK (diagnosis_type IN ('fungal_disease', 'bacterial_disease', 'viral_disease', 'pest_infestation', 'nutrient_deficiency', 'environmental_stress', 'unknown')),
    confidence_score DECIMAL(4, 3) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    confidence_level VARCHAR(20) NOT NULL CHECK (confidence_level IN ('high', 'medium', 'low')),
    diagnostic_summary TEXT NOT NULL,
    supporting_evidence TEXT[] NOT NULL DEFAULT '{}',
    missing_or_contradictory TEXT[] NOT NULL DEFAULT '{}',
    possible_causes JSONB NOT NULL DEFAULT '[]'::jsonb,
    immediate_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
    ipm_cultural_biological_remedies JSONB NOT NULL DEFAULT '[]'::jsonb,
    chemical_management_caution TEXT NOT NULL,
    kvk_extension_referral JSONB NOT NULL DEFAULT '{}'::jsonb,
    ai_model_used VARCHAR(100) NOT NULL,
    is_ai_simulated BOOLEAN DEFAULT FALSE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'resolved', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Crop Assessments Trigger for updated_at
CREATE TRIGGER update_crop_assessments_modtime
    BEFORE UPDATE ON public.crop_assessments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. Create crop_assessment_followups table
CREATE TABLE IF NOT EXISTS public.crop_assessment_followups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES public.crop_assessments(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    days_after_assessment INT DEFAULT 7 NOT NULL CHECK (days_after_assessment >= 0),
    outcome VARCHAR(50) NOT NULL CHECK (outcome IN ('symptoms_improved', 'symptoms_worsened', 'no_change', 'crop_harvested_salvaged', 'crop_cleared')),
    remedies_applied TEXT[] NOT NULL DEFAULT '{}',
    notes TEXT,
    followup_photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_crop_assessment_followups_modtime
    BEFORE UPDATE ON public.crop_assessment_followups
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. Indexes for fast tenant and relation lookups
CREATE INDEX IF NOT EXISTS idx_crop_assessments_owner ON public.crop_assessments(owner_id);
CREATE INDEX IF NOT EXISTS idx_crop_assessments_farm ON public.crop_assessments(farm_id);
CREATE INDEX IF NOT EXISTS idx_crop_assessments_plot ON public.crop_assessments(plot_id);
CREATE INDEX IF NOT EXISTS idx_crop_assessments_crop ON public.crop_assessments(crop_name);
CREATE INDEX IF NOT EXISTS idx_crop_assessments_created_at ON public.crop_assessments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crop_followups_assessment ON public.crop_assessment_followups(assessment_id);
CREATE INDEX IF NOT EXISTS idx_crop_followups_owner ON public.crop_assessment_followups(owner_id);

-- 4. Enable Row-Level Security (RLS)
ALTER TABLE public.crop_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_assessment_followups ENABLE ROW LEVEL SECURITY;

-- 5. Strict Tenant Policies for crop_assessments
CREATE POLICY "Users can view own crop assessments"
    ON public.crop_assessments FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can create own crop assessments"
    ON public.crop_assessments FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own crop assessments"
    ON public.crop_assessments FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own crop assessments"
    ON public.crop_assessments FOR DELETE
    USING (auth.uid() = owner_id);

-- 6. Strict Tenant Policies for crop_assessment_followups
CREATE POLICY "Users can view own crop followups"
    ON public.crop_assessment_followups FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can create own crop followups"
    ON public.crop_assessment_followups FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own crop followups"
    ON public.crop_assessment_followups FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own crop followups"
    ON public.crop_assessment_followups FOR DELETE
    USING (auth.uid() = owner_id);

-- 7. Supabase Storage Bucket Setup for Crop Photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'crop-assessment-photos',
    'crop-assessment-photos',
    false,
    5242880, -- 5 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage RLS: Tenant Isolation
CREATE POLICY "Tenants can upload their own crop photos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'crop-assessment-photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Tenants can read their own crop photos"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'crop-assessment-photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Tenants can delete their own crop photos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'crop-assessment-photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );
