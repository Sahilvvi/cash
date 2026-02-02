CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: generate_referral_code(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_referral_code() RETURNS text
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


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
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


--
-- Name: is_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = _user_id
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role text DEFAULT 'admin'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT admin_users_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'moderator'::text])))
);


--
-- Name: affiliate_clicks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.affiliate_clicks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    store_id uuid NOT NULL,
    clicked_at timestamp with time zone DEFAULT now() NOT NULL,
    session_id text,
    ip_address text
);


--
-- Name: banners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.banners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    image_url text NOT NULL,
    mobile_image_url text,
    link text,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cashback_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cashback_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    store_id uuid,
    amount numeric DEFAULT 0 NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    order_amount numeric,
    order_id text,
    description text,
    confirmed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    icon text DEFAULT 'tag'::text NOT NULL,
    color text DEFAULT 'bg-primary/10 text-primary'::text,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: deals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
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


--
-- Name: gift_cards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gift_cards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info'::text,
    is_read boolean DEFAULT false,
    link text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT notifications_type_check CHECK ((type = ANY (ARRAY['info'::text, 'success'::text, 'warning'::text, 'cashback'::text, 'referral'::text, 'promo'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    full_name text,
    email text,
    phone text,
    avatar_url text,
    referral_code text,
    referred_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referrals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referrer_id uuid NOT NULL,
    referred_id uuid NOT NULL,
    referrer_reward numeric(10,2) DEFAULT 100,
    referred_reward numeric(10,2) DEFAULT 50,
    status text DEFAULT 'pending'::text,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT referrals_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'expired'::text])))
);


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value text,
    description text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: spin_rewards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.spin_rewards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    reward_type text NOT NULL,
    reward_value numeric(10,2) DEFAULT 0,
    probability integer DEFAULT 10,
    color text DEFAULT '#F37022'::text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT spin_rewards_reward_type_check CHECK ((reward_type = ANY (ARRAY['cashback'::text, 'coupon'::text, 'points'::text, 'gift_card'::text, 'nothing'::text])))
);


--
-- Name: stores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo_url text,
    description text,
    cashback_percent numeric(5,2) DEFAULT 0,
    cashback_type text DEFAULT 'percent'::text,
    offers_count integer DEFAULT 0,
    category text,
    affiliate_url text,
    is_active boolean DEFAULT true,
    is_trending boolean DEFAULT false,
    is_new boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT stores_cashback_type_check CHECK ((cashback_type = ANY (ARRAY['percent'::text, 'flat'::text, 'voucher'::text])))
);


--
-- Name: user_gift_cards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_gift_cards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    gift_card_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    code text NOT NULL,
    pin text,
    status text DEFAULT 'active'::text,
    purchased_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    CONSTRAINT user_gift_cards_status_check CHECK ((status = ANY (ARRAY['active'::text, 'redeemed'::text, 'expired'::text])))
);


--
-- Name: user_spins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_spins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    reward_id uuid,
    reward_value numeric(10,2),
    spun_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: withdrawals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.withdrawals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    amount numeric NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    payment_method text DEFAULT 'bank_transfer'::text NOT NULL,
    payment_details jsonb,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    processed_at timestamp with time zone,
    admin_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT withdrawals_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT withdrawals_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'completed'::text])))
);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_user_id_key UNIQUE (user_id);


--
-- Name: affiliate_clicks affiliate_clicks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliate_clicks
    ADD CONSTRAINT affiliate_clicks_pkey PRIMARY KEY (id);


--
-- Name: banners banners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_pkey PRIMARY KEY (id);


--
-- Name: cashback_transactions cashback_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cashback_transactions
    ADD CONSTRAINT cashback_transactions_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: deals deals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_pkey PRIMARY KEY (id);


--
-- Name: gift_cards gift_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_cards
    ADD CONSTRAINT gift_cards_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_referral_code_key UNIQUE (referral_code);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_referrer_id_referred_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referrer_id_referred_id_key UNIQUE (referrer_id, referred_id);


--
-- Name: site_settings site_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_key_key UNIQUE (key);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: spin_rewards spin_rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spin_rewards
    ADD CONSTRAINT spin_rewards_pkey PRIMARY KEY (id);


--
-- Name: stores stores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_pkey PRIMARY KEY (id);


--
-- Name: stores stores_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_slug_key UNIQUE (slug);


--
-- Name: user_gift_cards user_gift_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_gift_cards
    ADD CONSTRAINT user_gift_cards_pkey PRIMARY KEY (id);


--
-- Name: user_spins user_spins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_spins
    ADD CONSTRAINT user_spins_pkey PRIMARY KEY (id);


--
-- Name: withdrawals withdrawals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_pkey PRIMARY KEY (id);


--
-- Name: idx_affiliate_clicks_store_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_affiliate_clicks_store_id ON public.affiliate_clicks USING btree (store_id);


--
-- Name: idx_affiliate_clicks_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_affiliate_clicks_user_id ON public.affiliate_clicks USING btree (user_id);


--
-- Name: idx_withdrawals_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_withdrawals_status ON public.withdrawals USING btree (status);


--
-- Name: idx_withdrawals_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_withdrawals_user_id ON public.withdrawals USING btree (user_id);


--
-- Name: deals update_deals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: stores update_stores_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: admin_users admin_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: affiliate_clicks affiliate_clicks_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliate_clicks
    ADD CONSTRAINT affiliate_clicks_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: cashback_transactions cashback_transactions_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cashback_transactions
    ADD CONSTRAINT cashback_transactions_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE SET NULL;


--
-- Name: deals deals_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_referred_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES public.profiles(id);


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: referrals referrals_referred_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referred_id_fkey FOREIGN KEY (referred_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: referrals referrals_referrer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_gift_cards user_gift_cards_gift_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_gift_cards
    ADD CONSTRAINT user_gift_cards_gift_card_id_fkey FOREIGN KEY (gift_card_id) REFERENCES public.gift_cards(id) ON DELETE CASCADE;


--
-- Name: user_gift_cards user_gift_cards_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_gift_cards
    ADD CONSTRAINT user_gift_cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_spins user_spins_reward_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_spins
    ADD CONSTRAINT user_spins_reward_id_fkey FOREIGN KEY (reward_id) REFERENCES public.spin_rewards(id);


--
-- Name: user_spins user_spins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_spins
    ADD CONSTRAINT user_spins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: withdrawals withdrawals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: deals Active deals are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active deals are viewable by everyone" ON public.deals FOR SELECT USING ((is_active = true));


--
-- Name: banners Admins can manage banners; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage banners" ON public.banners TO authenticated USING (public.is_admin(auth.uid()));


--
-- Name: cashback_transactions Admins can manage cashback transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage cashback transactions" ON public.cashback_transactions USING (public.is_admin(auth.uid()));


--
-- Name: categories Admins can manage categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage categories" ON public.categories TO authenticated USING (public.is_admin(auth.uid()));


--
-- Name: deals Admins can manage deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage deals" ON public.deals USING ((EXISTS ( SELECT 1
   FROM public.admin_users
  WHERE (admin_users.user_id = auth.uid()))));


--
-- Name: gift_cards Admins can manage gift cards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage gift cards" ON public.gift_cards USING ((EXISTS ( SELECT 1
   FROM public.admin_users
  WHERE (admin_users.user_id = auth.uid()))));


--
-- Name: site_settings Admins can manage site settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage site settings" ON public.site_settings TO authenticated USING (public.is_admin(auth.uid()));


--
-- Name: spin_rewards Admins can manage spin rewards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage spin rewards" ON public.spin_rewards USING ((EXISTS ( SELECT 1
   FROM public.admin_users
  WHERE (admin_users.user_id = auth.uid()))));


--
-- Name: stores Admins can manage stores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage stores" ON public.stores USING ((EXISTS ( SELECT 1
   FROM public.admin_users
  WHERE (admin_users.user_id = auth.uid()))));


--
-- Name: withdrawals Admins can manage withdrawals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage withdrawals" ON public.withdrawals USING (public.is_admin(auth.uid()));


--
-- Name: affiliate_clicks Admins can view all clicks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all clicks" ON public.affiliate_clicks FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: banners Banners are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Banners are viewable by everyone" ON public.banners FOR SELECT USING ((is_active = true));


--
-- Name: categories Categories are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING ((is_active = true));


--
-- Name: admin_users Check own admin status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Check own admin status" ON public.admin_users FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: gift_cards Gift cards are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gift cards are viewable by everyone" ON public.gift_cards FOR SELECT USING ((is_active = true));


--
-- Name: profiles Public profiles are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);


--
-- Name: site_settings Site settings are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Site settings are viewable by everyone" ON public.site_settings FOR SELECT USING (true);


--
-- Name: spin_rewards Spin rewards are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Spin rewards are viewable by everyone" ON public.spin_rewards FOR SELECT USING ((is_active = true));


--
-- Name: stores Stores are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Stores are viewable by everyone" ON public.stores FOR SELECT USING ((is_active = true));


--
-- Name: referrals Users can create referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create referrals" ON public.referrals FOR INSERT WITH CHECK (true);


--
-- Name: cashback_transactions Users can create their own cashback transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own cashback transactions" ON public.cashback_transactions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_gift_cards Users can purchase gift cards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can purchase gift cards" ON public.user_gift_cards FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: withdrawals Users can request withdrawals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can request withdrawals" ON public.withdrawals FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_spins Users can spin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can spin" ON public.user_spins FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: affiliate_clicks Users can track their clicks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can track their clicks" ON public.affiliate_clicks FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: notifications Users can update their notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: affiliate_clicks Users can view their clicks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their clicks" ON public.affiliate_clicks FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_gift_cards Users can view their gift cards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their gift cards" ON public.user_gift_cards FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: notifications Users can view their notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: cashback_transactions Users can view their own cashback transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own cashback transactions" ON public.cashback_transactions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: referrals Users can view their referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their referrals" ON public.referrals FOR SELECT USING ((auth.uid() IN ( SELECT profiles.user_id
   FROM public.profiles
  WHERE ((profiles.id = referrals.referrer_id) OR (profiles.id = referrals.referred_id)))));


--
-- Name: user_spins Users can view their spins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their spins" ON public.user_spins FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: withdrawals Users can view their withdrawals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their withdrawals" ON public.withdrawals FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: admin_users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

--
-- Name: affiliate_clicks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

--
-- Name: banners; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

--
-- Name: cashback_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cashback_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

--
-- Name: deals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

--
-- Name: gift_cards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: referrals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

--
-- Name: site_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: spin_rewards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.spin_rewards ENABLE ROW LEVEL SECURITY;

--
-- Name: stores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

--
-- Name: user_gift_cards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_gift_cards ENABLE ROW LEVEL SECURITY;

--
-- Name: user_spins; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_spins ENABLE ROW LEVEL SECURITY;

--
-- Name: withdrawals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;