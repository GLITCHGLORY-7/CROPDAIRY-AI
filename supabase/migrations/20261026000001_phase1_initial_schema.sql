-- CropDiary AI — Phase 1 Initial Schema Migration
-- Features: Profiles, Multi-Farm Management, Multi-Plot Management, Row-Level Security (RLS)

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    preferred_language VARCHAR(10) DEFAULT 'en' CHECK (preferred_language IN ('en', 'ta', 'hi')),
    country VARCHAR(100) DEFAULT 'India',
    state VARCHAR(100),
    district VARCHAR(100),
    preferred_area_unit VARCHAR(20) DEFAULT 'Acres' CHECK (preferred_area_unit IN ('Acres', 'Hectares', 'Bigha', 'Guntha')),
    farming_experience VARCHAR(50),
    primary_farming_type VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Profiles Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. Farms Table
CREATE TABLE IF NOT EXISTS public.farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    country VARCHAR(100) DEFAULT 'India' NOT NULL,
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    village VARCHAR(100),
    area DECIMAL(10, 2) NOT NULL CHECK (area > 0),
    area_unit VARCHAR(20) DEFAULT 'Acres' NOT NULL CHECK (area_unit IN ('Acres', 'Hectares', 'Bigha', 'Guntha')),
    farming_type VARCHAR(50) DEFAULT 'Open field' NOT NULL CHECK (farming_type IN ('Open field', 'Orchard', 'Greenhouse', 'Kitchen garden', 'Mixed farming', 'Other')),
    soil_type VARCHAR(50) NOT NULL, -- Clay, Clay Loam, Sandy Loam, Red Soil, Black Soil, Alluvial
    irrigation_method VARCHAR(50) NOT NULL, -- Drip, Sprinkler, Flood/Furrow, Rainfed
    water_availability VARCHAR(50) DEFAULT 'Adequate' NOT NULL CHECK (water_availability IN ('Adequate', 'Seasonal', 'Scarce', 'Rain-dependent')),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    status VARCHAR(20) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_farms_owner ON public.farms (owner_id);
CREATE INDEX IF NOT EXISTS idx_farms_status ON public.farms (status);

CREATE TRIGGER update_farms_modtime
    BEFORE UPDATE ON public.farms
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Plots Table
CREATE TABLE IF NOT EXISTS public.plots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    area DECIMAL(10, 2) NOT NULL CHECK (area > 0),
    area_unit VARCHAR(20) DEFAULT 'Acres' NOT NULL CHECK (area_unit IN ('Acres', 'Hectares', 'Bigha', 'Guntha')),
    soil_type VARCHAR(50) NOT NULL,
    irrigation_method VARCHAR(50) NOT NULL,
    farming_environment VARCHAR(50) DEFAULT 'Open field' NOT NULL CHECK (farming_environment IN ('Open field', 'Orchard', 'Greenhouse', 'Kitchen garden', 'Mixed farming', 'Other')),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_plots_farm ON public.plots (farm_id);
CREATE INDEX IF NOT EXISTS idx_plots_owner ON public.plots (owner_id);
CREATE INDEX IF NOT EXISTS idx_plots_status ON public.plots (status);

CREATE TRIGGER update_plots_modtime
    BEFORE UPDATE ON public.plots
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. ROW LEVEL SECURITY (RLS)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plots ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Farms Policies (Owner isolation)
CREATE POLICY "Users can view own farms"
    ON public.farms FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can create own farms"
    ON public.farms FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own farms"
    ON public.farms FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own farms"
    ON public.farms FOR DELETE
    USING (auth.uid() = owner_id);

-- Plots Policies (Dual verification: must own plot AND parent farm)
CREATE POLICY "Users can view plots of own farms"
    ON public.plots FOR SELECT
    USING (
        auth.uid() = owner_id AND
        EXISTS (
            SELECT 1 FROM public.farms
            WHERE farms.id = plots.farm_id
            AND farms.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create plots in own farms"
    ON public.plots FOR INSERT
    WITH CHECK (
        auth.uid() = owner_id AND
        EXISTS (
            SELECT 1 FROM public.farms
            WHERE farms.id = plots.farm_id
            AND farms.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update plots in own farms"
    ON public.plots FOR UPDATE
    USING (
        auth.uid() = owner_id AND
        EXISTS (
            SELECT 1 FROM public.farms
            WHERE farms.id = plots.farm_id
            AND farms.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete plots in own farms"
    ON public.plots FOR DELETE
    USING (
        auth.uid() = owner_id AND
        EXISTS (
            SELECT 1 FROM public.farms
            WHERE farms.id = plots.farm_id
            AND farms.owner_id = auth.uid()
        )
    );

-- 6. New User Trigger: Automatically creates a public profile row upon auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, preferred_language, country)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1), 'Farmer'),
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en'),
        'India'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
