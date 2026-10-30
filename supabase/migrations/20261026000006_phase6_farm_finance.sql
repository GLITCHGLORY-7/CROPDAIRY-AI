-- ====================================================================
-- CropDiary AI — Phase 6 Database Migration
-- Farm Finance, Profit & Loss, Budgets, Harvest Sales & Mandi Prices
-- ====================================================================

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Farm Budgets Table
CREATE TABLE IF NOT EXISTS public.farm_budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    plot_id UUID REFERENCES public.plots(id) ON DELETE SET NULL,
    crop_plan_id UUID REFERENCES public.crop_plans(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) DEFAULT 'all', -- 'all' or specific expense category
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    alert_threshold_percent INT NOT NULL DEFAULT 80 CHECK (alert_threshold_percent BETWEEN 10 AND 100),
    notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Harvest Produce Sales Table (Explicit harvest-to-sale link)
CREATE TABLE IF NOT EXISTS public.harvest_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    plot_id UUID REFERENCES public.plots(id) ON DELETE SET NULL,
    crop_plan_id UUID REFERENCES public.crop_plans(id) ON DELETE SET NULL,
    harvest_record_id UUID REFERENCES public.harvest_records(id) ON DELETE SET NULL,
    crop_name VARCHAR(150) NOT NULL,
    quantity_sold NUMERIC(10,2) NOT NULL CHECK (quantity_sold > 0),
    quantity_unit VARCHAR(30) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    price_unit VARCHAR(30) NOT NULL DEFAULT 'per_quintal',
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    gross_revenue NUMERIC(12,2) NOT NULL CHECK (gross_revenue >= 0),
    selling_cost NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (selling_cost >= 0),
    net_proceeds NUMERIC(12,2) NOT NULL CHECK (net_proceeds >= 0),
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    buyer_market VARCHAR(150),
    buyer_reference VARCHAR(100),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'received' CHECK (payment_status IN ('received', 'pending', 'partial')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Unified Farm Financial Transactions Ledger
-- (Single source of truth with deduplication constraint on source_diary_entry_id)
CREATE TABLE IF NOT EXISTS public.farm_financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    plot_id UUID REFERENCES public.plots(id) ON DELETE SET NULL,
    crop_plan_id UUID REFERENCES public.crop_plans(id) ON DELETE SET NULL,
    transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN ('expense', 'sale_revenue', 'other_income', 'refund_adjustment')),
    category VARCHAR(50) NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    description VARCHAR(255) NOT NULL,
    source_diary_entry_id UUID REFERENCES public.farm_diary_entries(id) ON DELETE SET NULL UNIQUE,
    source_harvest_sale_id UUID REFERENCES public.harvest_sales(id) ON DELETE CASCADE UNIQUE,
    payment_method VARCHAR(30) DEFAULT 'cash',
    payment_status VARCHAR(20) DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'partial')),
    receipt_photo_url TEXT,
    invoice_number VARCHAR(100),
    vendor_buyer VARCHAR(150),
    notes TEXT,
    is_allocated BOOLEAN NOT NULL DEFAULT FALSE,
    allocation_method VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Mandi Market Prices Cache
CREATE TABLE IF NOT EXISTS public.mandi_market_prices_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commodity VARCHAR(100) NOT NULL,
    variety VARCHAR(100),
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    market_name VARCHAR(150) NOT NULL,
    min_price NUMERIC(10,2) NOT NULL CHECK (min_price >= 0),
    max_price NUMERIC(10,2) NOT NULL CHECK (max_price >= 0),
    modal_price NUMERIC(10,2) NOT NULL CHECK (modal_price >= 0),
    price_unit VARCHAR(30) NOT NULL DEFAULT 'Rs/Quintal',
    arrival_date DATE NOT NULL,
    source VARCHAR(150) NOT NULL DEFAULT 'Agmarknet / DMI',
    retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_budgets_owner ON public.farm_budgets(owner_id);
CREATE INDEX IF NOT EXISTS idx_budgets_farm ON public.farm_budgets(farm_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON public.farm_budgets(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_harvest_sales_owner ON public.harvest_sales(owner_id);
CREATE INDEX IF NOT EXISTS idx_harvest_sales_farm ON public.harvest_sales(farm_id);
CREATE INDEX IF NOT EXISTS idx_harvest_sales_harvest ON public.harvest_sales(harvest_record_id);
CREATE INDEX IF NOT EXISTS idx_harvest_sales_date ON public.harvest_sales(sale_date DESC);

CREATE INDEX IF NOT EXISTS idx_fin_trans_owner ON public.farm_financial_transactions(owner_id);
CREATE INDEX IF NOT EXISTS idx_fin_trans_farm ON public.farm_financial_transactions(farm_id);
CREATE INDEX IF NOT EXISTS idx_fin_trans_type ON public.farm_financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_fin_trans_category ON public.farm_financial_transactions(category);
CREATE INDEX IF NOT EXISTS idx_fin_trans_occurred_at ON public.farm_financial_transactions(occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_mandi_commodity ON public.mandi_market_prices_cache(commodity);
CREATE INDEX IF NOT EXISTS idx_mandi_state_dist ON public.mandi_market_prices_cache(state, district);
CREATE INDEX IF NOT EXISTS idx_mandi_arrival ON public.mandi_market_prices_cache(arrival_date DESC);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.farm_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.harvest_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mandi_market_prices_cache ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
-- Budgets
CREATE POLICY "Users can manage own farm budgets"
    ON public.farm_budgets FOR ALL
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- Harvest Sales
CREATE POLICY "Users can manage own harvest sales"
    ON public.harvest_sales FOR ALL
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- Financial Transactions
CREATE POLICY "Users can manage own financial transactions"
    ON public.farm_financial_transactions FOR ALL
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- Mandi Cache (Publicly readable by authenticated farmers, admin manageable)
CREATE POLICY "Authenticated users can read mandi market price cache"
    ON public.mandi_market_prices_cache FOR SELECT
    TO authenticated
    USING (true);

-- 8. Updated At Triggers
CREATE TRIGGER update_farm_budgets_modtime
    BEFORE UPDATE ON public.farm_budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_harvest_sales_modtime
    BEFORE UPDATE ON public.harvest_sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farm_financial_transactions_modtime
    BEFORE UPDATE ON public.farm_financial_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
