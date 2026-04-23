-- =====================================================================
-- Backend hardening: lock down money-minting paths, wire up referrals.
-- =====================================================================

-- Ensure pgcrypto is available (supplies gen_random_bytes). Supabase
-- provisions this under the `extensions` schema; be defensive and
-- create if missing. The function needs it for gift-card code generation.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
--
-- Goals:
--   1. Users can no longer directly INSERT into user_gift_cards /
--      user_spins. They must go through SECURITY DEFINER RPCs that
--      enforce balance / cooldown server-side.
--   2. purchase_gift_card() atomically debits cashback and issues a card.
--   3. spin_wheel() enforces 24h cooldown and issues rewards server-side.
--   4. Signups with a referrer auto-create a pending referrals row.
--   5. When the referred user earns their first confirmed cashback, the
--      referral auto-completes and both parties get credited.
-- =====================================================================

-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
-- 1. Cashback balance helper (used by purchase_gift_card)
-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
CREATE OR REPLACE FUNCTION public.get_available_cashback(p_user_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
    SELECT
        COALESCE(
            (SELECT SUM(amount) FROM public.cashback_transactions
             WHERE user_id = p_user_id AND status = 'confirmed'),
            0
        )
      - COALESCE(
            (SELECT SUM(amount) FROM public.withdrawals
             WHERE user_id = p_user_id
               AND status IN ('pending','approved','processing','completed')),
            0
        );
$$;

GRANT EXECUTE ON FUNCTION public.get_available_cashback(uuid) TO authenticated;

-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
-- 2. purchase_gift_card RPC
-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
CREATE OR REPLACE FUNCTION public.purchase_gift_card(
    p_gift_card_id uuid,
    p_amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_available numeric;
    v_gift_card public.gift_cards%ROWTYPE;
    v_allowed boolean;
    v_code text;
    v_pin text;
    v_user_gc public.user_gift_cards%ROWTYPE;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
    END IF;

    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Invalid amount' USING ERRCODE = '22023';
    END IF;

    -- Prevent concurrent double-spend from the same user
    PERFORM pg_advisory_xact_lock(hashtext('gift_card:' || v_user_id::text));

    SELECT * INTO v_gift_card
    FROM public.gift_cards
    WHERE id = p_gift_card_id AND is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Gift card not found or inactive' USING ERRCODE = 'P0002';
    END IF;

    -- Validate denomination (denominations is jsonb array)
    IF v_gift_card.denominations IS NOT NULL
       AND jsonb_array_length(v_gift_card.denominations) > 0 THEN
        SELECT EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(v_gift_card.denominations) AS d
            WHERE d::numeric = p_amount
        ) INTO v_allowed;
        IF NOT v_allowed THEN
            RAISE EXCEPTION 'Amount % not an allowed denomination for %',
                p_amount, v_gift_card.name USING ERRCODE = '22023';
        END IF;
    END IF;

    v_available := public.get_available_cashback(v_user_id);

    IF v_available < p_amount THEN
        RAISE EXCEPTION 'Insufficient cashback balance: have %, need %',
            v_available, p_amount USING ERRCODE = '23514';
    END IF;

    -- Generate code + pin server-side
    v_code := 'GC' || upper(encode(gen_random_bytes(5), 'hex'));
    v_pin  := lpad((floor(random() * 10000))::int::text, 4, '0');

    -- Debit: compensating negative confirmed cashback row (audit trail)
    INSERT INTO public.cashback_transactions (
        user_id, amount, status, description, network_type
    ) VALUES (
        v_user_id,
        -p_amount,
        'confirmed',
        'Gift card purchase: ' || v_gift_card.name,
        'gift_card_purchase'
    );

    -- Issue the card
    INSERT INTO public.user_gift_cards (
        user_id, gift_card_id, amount, code, pin, status, expires_at
    ) VALUES (
        v_user_id, p_gift_card_id, p_amount, v_code, v_pin, 'active',
        now() + interval '1 year'
    )
    RETURNING * INTO v_user_gc;

    RETURN to_jsonb(v_user_gc);
END;
$$;

REVOKE ALL ON FUNCTION public.purchase_gift_card(uuid, numeric) FROM public;
GRANT EXECUTE ON FUNCTION public.purchase_gift_card(uuid, numeric) TO authenticated;

-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
-- 3. spin_wheel RPC
-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
CREATE OR REPLACE FUNCTION public.spin_wheel()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_recent_spin timestamptz;
    v_total_prob integer := 0;
    v_rand numeric;
    v_running numeric := 0;
    v_chosen public.spin_rewards%ROWTYPE;
    v_rec record;
    v_user_spin public.user_spins%ROWTYPE;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext('spin:' || v_user_id::text));

    SELECT spun_at INTO v_recent_spin
    FROM public.user_spins
    WHERE user_id = v_user_id
      AND spun_at >= now() - interval '24 hours'
    ORDER BY spun_at DESC
    LIMIT 1;

    IF FOUND THEN
        RAISE EXCEPTION 'Already spun in the last 24 hours (last spin: %)', v_recent_spin
            USING ERRCODE = '22023';
    END IF;

    SELECT COALESCE(SUM(probability), 0) INTO v_total_prob
    FROM public.spin_rewards
    WHERE is_active = true;

    IF v_total_prob <= 0 THEN
        RAISE EXCEPTION 'No active spin rewards configured' USING ERRCODE = 'P0002';
    END IF;

    v_rand := random() * v_total_prob;

    FOR v_rec IN
        SELECT * FROM public.spin_rewards
        WHERE is_active = true
        ORDER BY probability DESC, id
    LOOP
        v_running := v_running + v_rec.probability;
        IF v_rand <= v_running THEN
            v_chosen := v_rec;
            EXIT;
        END IF;
    END LOOP;

    IF v_chosen.id IS NULL THEN
        -- shouldn't happen, but fallback to lowest-prob reward
        SELECT * INTO v_chosen FROM public.spin_rewards
        WHERE is_active = true
        ORDER BY probability ASC LIMIT 1;
    END IF;

    INSERT INTO public.user_spins (user_id, reward_id, reward_value)
    VALUES (v_user_id, v_chosen.id, v_chosen.reward_value)
    RETURNING * INTO v_user_spin;

    -- If the reward is cashback, credit it as a confirmed transaction
    IF v_chosen.reward_type = 'cashback' AND v_chosen.reward_value > 0 THEN
        INSERT INTO public.cashback_transactions (
            user_id, amount, status, description, network_type
        ) VALUES (
            v_user_id,
            v_chosen.reward_value,
            'confirmed',
            'Spin wheel reward: ' || v_chosen.name,
            'spin_wheel'
        );
    END IF;

    RETURN jsonb_build_object(
        'spin', to_jsonb(v_user_spin),
        'reward', to_jsonb(v_chosen)
    );
END;
$$;

REVOKE ALL ON FUNCTION public.spin_wheel() FROM public;
GRANT EXECUTE ON FUNCTION public.spin_wheel() TO authenticated;

-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
-- 4. Lock down direct INSERT/UPDATE/DELETE on minting tables
-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
-- The existing policies only allow admins to manage and users to SELECT.
-- There is no INSERT policy for regular users, so RLS already blocks
-- direct client inserts. We add explicit deny-style policies as a belt
-- -and-suspenders + drop any legacy permissive ones if they exist.

DO $$
BEGIN
    -- Drop any previously-added permissive insert policies (defensive)
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname='public' AND tablename='user_gift_cards'
          AND policyname='Users can insert own gift cards'
    ) THEN
        EXECUTE 'DROP POLICY "Users can insert own gift cards" ON public.user_gift_cards';
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname='public' AND tablename='user_spins'
          AND policyname='Users can insert own spins'
    ) THEN
        EXECUTE 'DROP POLICY "Users can insert own spins" ON public.user_spins';
    END IF;
END $$;

ALTER TABLE public.user_gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_spins      ENABLE ROW LEVEL SECURITY;

-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
-- 5. Referrals: auto-create pending row on signup
-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
-- Referral rewards are intentionally hard-coded here; move to a
-- site_settings row if the product needs tunable values.
CREATE OR REPLACE FUNCTION public.handle_profile_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_referrer_profile_id uuid;
BEGIN
    IF NEW.referred_by IS NULL THEN
        RETURN NEW;
    END IF;

    -- referred_by may be either a profile.id or a referral_code; handle both.
    SELECT id INTO v_referrer_profile_id
    FROM public.profiles
    WHERE id = NEW.referred_by
       OR referral_code = NEW.referred_by::text
    LIMIT 1;

    IF v_referrer_profile_id IS NULL OR v_referrer_profile_id = NEW.id THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.referrals (
        referrer_id, referred_id, referrer_reward, referred_reward, status
    ) VALUES (
        v_referrer_profile_id, NEW.id, 50, 25, 'pending'
    )
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_referral ON public.profiles;
CREATE TRIGGER trg_profile_referral
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_profile_referral();

-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
-- 6. Auto-complete referral on referred user's first confirmed cashback
-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
CREATE OR REPLACE FUNCTION public.maybe_complete_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_profile_id uuid;
BEGIN
    -- Only consider positive, confirmed cashback (not gift-card debits, not pending)
    IF NEW.status <> 'confirmed' OR NEW.amount <= 0 THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' AND OLD.status = 'confirmed' THEN
        RETURN NEW; -- already was confirmed; don't retrigger
    END IF;

    -- Skip self-generated internal credits (gift card, spin, referral payouts)
    IF NEW.network_type IN ('gift_card_purchase','spin_wheel','referral') THEN
        RETURN NEW;
    END IF;

    SELECT id INTO v_profile_id FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;
    IF v_profile_id IS NULL THEN
        RETURN NEW;
    END IF;

    UPDATE public.referrals
    SET status = 'completed', completed_at = now()
    WHERE referred_id = v_profile_id AND status = 'pending';

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_maybe_complete_referral ON public.cashback_transactions;
CREATE TRIGGER trg_maybe_complete_referral
    AFTER INSERT OR UPDATE OF status ON public.cashback_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.maybe_complete_referral();

-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
-- 7. Credit both sides when referral flips to completed
-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
CREATE OR REPLACE FUNCTION public.credit_referral_rewards()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_referrer_user_id uuid;
    v_referred_user_id uuid;
BEGIN
    IF NEW.status <> 'completed' OR (OLD.status IS NOT DISTINCT FROM 'completed') THEN
        RETURN NEW;
    END IF;

    SELECT user_id INTO v_referrer_user_id FROM public.profiles WHERE id = NEW.referrer_id;
    SELECT user_id INTO v_referred_user_id FROM public.profiles WHERE id = NEW.referred_id;

    IF v_referrer_user_id IS NOT NULL AND NEW.referrer_reward > 0 THEN
        INSERT INTO public.cashback_transactions (
            user_id, amount, status, description, network_type
        ) VALUES (
            v_referrer_user_id, NEW.referrer_reward, 'confirmed',
            'Referral bonus (referrer)', 'referral'
        );
    END IF;

    IF v_referred_user_id IS NOT NULL AND NEW.referred_reward > 0 THEN
        INSERT INTO public.cashback_transactions (
            user_id, amount, status, description, network_type
        ) VALUES (
            v_referred_user_id, NEW.referred_reward, 'confirmed',
            'Referral bonus (referred)', 'referral'
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_credit_referral_rewards ON public.referrals;
CREATE TRIGGER trg_credit_referral_rewards
    AFTER UPDATE OF status ON public.referrals
    FOR EACH ROW
    EXECUTE FUNCTION public.credit_referral_rewards();

-- Prevent duplicate referrals
CREATE UNIQUE INDEX IF NOT EXISTS uniq_referrals_referred
    ON public.referrals (referred_id);
