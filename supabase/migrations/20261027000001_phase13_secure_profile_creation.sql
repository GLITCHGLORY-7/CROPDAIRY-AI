-- CropDiary AI — Phase 13: Secure User Profile Provisioning Trigger
-- Hardened SECURITY DEFINER function with explicit search_path, input sanitation, transactional failure safety, and least-privilege execute grants

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_display_name VARCHAR(100);
    v_language VARCHAR(10);
    v_state VARCHAR(100);
    v_district VARCHAR(100);
BEGIN
    -- 1. Sanitize and bound metadata inputs to guarantee constraint conformity
    v_display_name := SUBSTRING(
        TRIM(COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1), 'Farmer')),
        1, 100
    );
    IF v_display_name = '' THEN
        v_display_name := 'Farmer';
    END IF;

    -- Validate preferred_language against CHECK constraint ('en', 'ta', 'hi')
    IF NEW.raw_user_meta_data->>'preferred_language' IN ('en', 'ta', 'hi') THEN
        v_language := NEW.raw_user_meta_data->>'preferred_language';
    ELSE
        v_language := 'en';
    END IF;

    v_state := SUBSTRING(COALESCE(NEW.raw_user_meta_data->>'state', ''), 1, 100);
    v_district := SUBSTRING(COALESCE(NEW.raw_user_meta_data->>'district', ''), 1, 100);

    -- 2. Insert the profile.
    -- If a profile already exists for this ID, DO NOTHING to preserve all existing user data.
    -- If an unhandled database error occurs, let it raise to roll back the auth transaction,
    -- preventing orphaned auth accounts without an associated profile.
    INSERT INTO public.profiles (
        id,
        display_name,
        preferred_language,
        country,
        state,
        district,
        preferred_area_unit,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        v_display_name,
        v_language,
        'India',
        v_state,
        v_district,
        'Acres',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- Explicitly assign function ownership to postgres
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- Restrict function execution permissions to authorized database roles
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, supabase_auth_admin, service_role;

-- Recreate trigger on auth.users idempotently
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Maintain Row-Level Security on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Idempotently configure user-isolation policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);
