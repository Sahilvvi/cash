-- ===================================================================
-- COMPLETE SUPABASE DATABASE SCHEMA FOR CASHBACK PLATFORM
-- Created: February 2, 2026
-- Purpose: Full database setup for new Supabase project
-- NOTE: Run this entire script in Supabase SQL Editor
-- ===================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================================================
-- TABLES (Created FIRST to avoid dependency errors)
-- ===================================================================

-- Admin Users Table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE,
    role text DEFAULT 'admin'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT admin_users_role_check CHECK (role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'moderator'::text]))
);

-- User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE,
    full_name text,
    email text,
    phone text,
    avatar_url text,
    referral_code text UNIQUE,
    referred_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Stores Table (includes Offer18 stores)
CREATE TABLE IF NOT EXISTS public.stores (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    logo_url text,
    description text,
    cashback_percent numeric(5,2) DEFAULT 0,
    cashback_type text DEFAULT 'percent'::text,
    offers_count integer DEFAULT 0,
    category text,
    affiliate_url text,
    tracking_url text,
    network_type text DEFAULT 'generic_postback'::text NOT NULL,
    api_config jsonb DEFAULT '{}'::jsonb,
    offer18_offer_id text,
    is_active boolean DEFAULT true,
    is_trending boolean DEFAULT false,
    is_new boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT stores_cashback_type_check CHECK (cashback_type = ANY (ARRAY['percent'::text, 'flat'::text, 'voucher'::text])),
    CONSTRAINT stores_network_type_check CHECK (network_type IN ('generic_postback', 'offer18', 'amazon_direct', 'flipkart_direct', 'commission_junction', 'impact', 'other'))
);

-- Affiliate Clicks Tracking
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL,
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    clicked_at timestamp with time zone DEFAULT now() NOT NULL,
    session_id text,
    ip_address text,
    network_type text DEFAULT 'generic_postback'::text,
    offer18_click_id text,
    conversion_status text DEFAULT 'pending'::text
);

-- Cashback Transactions
CREATE TABLE IF NOT EXISTS public.cashback_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL,
    store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
    amount numeric DEFAULT 0 NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    order_amount numeric,
    order_id text,
    description text,
    confirmed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    network_type text DEFAULT 'generic_postback'::text
);

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    icon text DEFAULT 'tag'::text NOT NULL,
    color text DEFAULT 'bg-primary/10 text-primary'::text,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Deals and Coupons
CREATE TABLE IF NOT EXISTS public.deals (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    coupon_code text,
    cashback_percent numeric(5,2),
    discount_text text,
    expires_at timestamp with time zone,
    is_exclusive boolean DEFAULT false,
    is_verified boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Banners
CREATE TABLE IF NOT EXISTS public.banners (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    image_url text NOT NULL,
    mobile_image_url text,
    link text,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info'::text,
    is_read boolean DEFAULT false,
    link text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT notifications_type_check CHECK (type = ANY (ARRAY['info'::text, 'success'::text, 'warning'::text, 'cashback'::text, 'referral'::text, 'promo'::text]))
);

-- Referrals
CREATE TABLE IF NOT EXISTS public.referrals (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    referrer_id uuid NOT NULL,
    referred_id uuid NOT NULL,
    referrer_reward numeric(10,2) DEFAULT 100,
    referred_reward numeric(10,2) DEFAULT 50,
    status text DEFAULT 'pending'::text,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT referrals_status_check CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'expired'::text])),
    UNIQUE(referrer_id, referred_id)
);

-- Withdrawals
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL,
    amount numeric NOT NULL CHECK (amount > 0),
    status text DEFAULT 'pending'::text NOT NULL,
    payment_method text DEFAULT 'bank_transfer'::text NOT NULL,
    payment_details jsonb,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    processed_at timestamp with time zone,
    admin_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT withdrawals_status_check CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'completed'::text]))
);

-- Spin Rewards
CREATE TABLE IF NOT EXISTS public.spin_rewards (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    reward_type text NOT NULL,
    reward_value numeric(10,2) DEFAULT 0,
    probability integer DEFAULT 10,
    color text DEFAULT '#F37022'::text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT spin_rewards_reward_type_check CHECK (reward_type = ANY (ARRAY['cashback'::text, 'coupon'::text, 'points'::text, 'gift_card'::text, 'nothing'::text]))
);

-- User Spins
CREATE TABLE IF NOT EXISTS public.user_spins (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL,
    reward_id uuid REFERENCES public.spin_rewards(id),
    reward_value numeric(10,2),
    spun_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Gift Cards
CREATE TABLE IF NOT EXISTS public.gift_cards (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    brand text NOT NULL,
    description text,
    image_url text,
    denominations jsonb DEFAULT '[]'::jsonb,
    discount_percent numeric(5,2) DEFAULT 0,
    category text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- User Gift Cards
CREATE TABLE IF NOT EXISTS public.user_gift_cards (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL,
    gift_card_id uuid NOT NULL REFERENCES public.gift_cards(id) ON DELETE CASCADE,
    amount numeric(10,2) NOT NULL,
    code text NOT NULL,
    pin text,
    status text DEFAULT 'active'::text,
    purchased_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    CONSTRAINT user_gift_cards_status_check CHECK (status = ANY (ARRAY['active'::text, 'redeemed'::text, 'expired'::text]))
);

-- Site Settings
CREATE TABLE IF NOT EXISTS public.site_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    key text NOT NULL UNIQUE,
    value text,
    description text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ===================================================================
-- FUNCTIONS (Created AFTER tables)
-- ===================================================================

-- Function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code() RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := 'PW';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    generate_referral_code()
  );
  RETURN NEW;
END;
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(_user_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = _user_id
  )
$$;

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ===================================================================
-- FOREIGN KEY CONSTRAINTS
-- ===================================================================

ALTER TABLE public.admin_users
    ADD CONSTRAINT admin_users_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_referred_by_fkey 
    FOREIGN KEY (referred_by) REFERENCES public.profiles(id);

ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.referrals
    ADD CONSTRAINT referrals_referrer_id_fkey 
    FOREIGN KEY (referrer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.referrals
    ADD CONSTRAINT referrals_referred_id_fkey 
    FOREIGN KEY (referred_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_spins
    ADD CONSTRAINT user_spins_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_gift_cards
    ADD CONSTRAINT user_gift_cards_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.withdrawals
    ADD CONSTRAINT withdrawals_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ===================================================================
-- INDEXES FOR PERFORMANCE
-- ===================================================================

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_user_id ON public.affiliate_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_store_id ON public.affiliate_clicks(store_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_session_id ON public.affiliate_clicks(session_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_stores_network_type ON public.stores(network_type);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON public.stores(slug);

-- ===================================================================
-- TRIGGERS
-- ===================================================================

-- Auto-create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Auto-update timestamps
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at 
  BEFORE UPDATE ON public.stores 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at 
  BEFORE UPDATE ON public.deals 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashback_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spin_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Stores Policies (Public read, Admin write)
CREATE POLICY "Everyone can view active stores" ON public.stores
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage stores" ON public.stores
    USING (is_admin(auth.uid()));

-- Cashback Transactions Policies
CREATE POLICY "Users can view own cashback" ON public.cashback_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage cashback transactions" ON public.cashback_transactions
    USING (is_admin(auth.uid()));

-- Deals Policies
CREATE POLICY "Everyone can view active deals" ON public.deals
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage deals" ON public.deals
    USING (is_admin(auth.uid()));

-- Categories Policies
CREATE POLICY "Everyone can view categories" ON public.categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON public.categories
    USING (is_admin(auth.uid()));

-- Banners Policies
CREATE POLICY "Everyone can view active banners" ON public.banners
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage banners" ON public.banners
    USING (is_admin(auth.uid()));

-- Notifications Policies
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Withdrawals Policies
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawals" ON public.withdrawals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage withdrawals" ON public.withdrawals
    USING (is_admin(auth.uid()));

-- Gift Cards Policies
CREATE POLICY "Everyone can view active gift cards" ON public.gift_cards
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage gift cards" ON public.gift_cards
    USING (is_admin(auth.uid()));

-- User Gift Cards Policies
CREATE POLICY "Users can view own gift cards" ON public.user_gift_cards
    FOR SELECT USING (auth.uid() = user_id);

-- Spin Rewards Policies
CREATE POLICY "Everyone can view active spin rewards" ON public.spin_rewards
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage spin rewards" ON public.spin_rewards
    USING (is_admin(auth.uid()));

-- User Spins Policies
CREATE POLICY "Users can view own spins" ON public.user_spins
    FOR SELECT USING (auth.uid() = user_id);

-- Site Settings Policies
CREATE POLICY "Everyone can view site settings" ON public.site_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage site settings" ON public.site_settings
    USING (is_admin(auth.uid()));

-- ===================================================================
-- INITIAL DATA (Optional)
-- ===================================================================

-- Insert default site settings
INSERT INTO public.site_settings (key, value, description) VALUES
('site_name', 'Cashback Platform', 'Website name'),
('min_withdrawal', '500', 'Minimum withdrawal amount'),
('referral_reward', '100', 'Referral reward amount'),
('welcome_bonus', '50', 'Welcome bonus for new users')
ON CONFLICT (key) DO NOTHING;

-- ===================================================================
-- COMMENTS FOR DOCUMENTATION
-- ===================================================================

COMMENT ON TABLE public.stores IS 'Stores and merchants, including Offer18 synced offers';
COMMENT ON COLUMN public.stores.network_type IS 'Type of affiliate network: generic_postback, offer18, amazon_direct, etc.';
COMMENT ON COLUMN public.stores.api_config IS 'JSON configuration for API integration';
COMMENT ON COLUMN public.stores.offer18_offer_id IS 'Offer18 offer ID for synced offers';
COMMENT ON TABLE public.affiliate_clicks IS 'Tracks user clicks on affiliate links';
COMMENT ON COLUMN public.affiliate_clicks.network_type IS 'Which affiliate network this click is for';
COMMENT ON COLUMN public.affiliate_clicks.offer18_click_id IS 'Offer18 click tracking ID';

-- ===================================================================
-- COMPLETION MESSAGE
-- ===================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Database schema created successfully!';
    RAISE NOTICE '📊 Total tables: 16';
    RAISE NOTICE '🔧 Functions: 4';
    RAISE NOTICE '🔒 RLS enabled on all tables';
    RAISE NOTICE '⚡ Indexes created for performance';
    RAISE NOTICE '🎯 Ready for use!';
END $$;
