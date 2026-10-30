-- ====================================================================
-- CropDiary AI — Phase 7 Database Migration
-- AI Farm Assistant, Regional Languages & Government Schemes Module
-- ====================================================================

-- 1. Assistant Conversations Table
CREATE TABLE IF NOT EXISTS public.assistant_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL DEFAULT 'New Agricultural Consultation',
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'ta')),
    farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
    plot_id UUID REFERENCES public.plots(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Assistant Messages Table
CREATE TABLE IF NOT EXISTS public.assistant_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.assistant_conversations(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    sources JSONB DEFAULT '[]'::jsonb,
    model_name VARCHAR(100) DEFAULT 'cropdiary-icar-local-assistant',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Government Schemes Table (Verified Central & Tamil Nadu Schemes)
CREATE TABLE IF NOT EXISTS public.government_schemes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_ta VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    department_ta VARCHAR(255),
    scope VARCHAR(30) NOT NULL DEFAULT 'central' CHECK (scope IN ('central', 'state')),
    state VARCHAR(100) DEFAULT 'All India',
    category VARCHAR(50) NOT NULL,
    beneficiary_type VARCHAR(100) NOT NULL DEFAULT 'all_farmers',
    max_landholding_acres NUMERIC(6,2),
    eligible_crops TEXT[] DEFAULT '{}',
    description TEXT NOT NULL,
    description_ta TEXT NOT NULL,
    benefits_summary TEXT NOT NULL,
    benefits_summary_ta TEXT NOT NULL,
    subsidy_amount_or_percent VARCHAR(100) NOT NULL,
    eligibility_criteria TEXT[] NOT NULL DEFAULT '{}',
    required_documents TEXT[] NOT NULL DEFAULT '{}',
    application_mode VARCHAR(50) NOT NULL DEFAULT 'online',
    official_portal_url TEXT NOT NULL,
    last_verified_date DATE NOT NULL,
    verification_status VARCHAR(30) NOT NULL DEFAULT 'verified' CHECK (verification_status IN ('verified', 'revalidation_pending')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_assistant_conv_owner ON public.assistant_conversations(owner_id);
CREATE INDEX IF NOT EXISTS idx_assistant_conv_updated ON public.assistant_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_assistant_msg_conv ON public.assistant_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_assistant_msg_owner ON public.assistant_messages(owner_id);
CREATE INDEX IF NOT EXISTS idx_assistant_msg_created ON public.assistant_messages(created_at ASC);

CREATE INDEX IF NOT EXISTS idx_schemes_code ON public.government_schemes(code);
CREATE INDEX IF NOT EXISTS idx_schemes_category ON public.government_schemes(category);
CREATE INDEX IF NOT EXISTS idx_schemes_scope_state ON public.government_schemes(scope, state);
CREATE INDEX IF NOT EXISTS idx_schemes_active ON public.government_schemes(is_active);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.assistant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_schemes ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- Assistant Conversations: Strict owner isolation
CREATE POLICY "Users can manage own assistant conversations"
    ON public.assistant_conversations FOR ALL
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- Assistant Messages: Strict owner isolation
CREATE POLICY "Users can manage own assistant messages"
    ON public.assistant_messages FOR ALL
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- Government Schemes: Publicly readable by all authenticated farmers
CREATE POLICY "Authenticated users can read verified government schemes"
    ON public.government_schemes FOR SELECT
    TO authenticated
    USING (is_active = true);

-- 7. Trigger for Updated At
CREATE TRIGGER update_assistant_conversations_modtime
    BEFORE UPDATE ON public.assistant_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_government_schemes_modtime
    BEFORE UPDATE ON public.government_schemes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
