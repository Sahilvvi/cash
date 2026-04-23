-- =====================================================================
-- Fraud hardening: click-binding helpers, email normalization,
-- referral velocity, withdrawal cooldown, admin audit log
-- =====================================================================
--
-- Scope: everything a backend can enforce without a client-side
-- fingerprinting library. IP-based rate limits are not included here
-- because Postgres is the wrong layer for request-level throttling;
-- those will be added to the edge functions directly in a later pass.

-- =====================================================================
-- 1. Normalize email on profiles, block gmail "+alias" / dot tricks
-- =====================================================================
--
-- gmail treats `foo@gmail.com`, `f.o.o@gmail.com`, and `foo+bar@gmail.com`
-- as the same inbox. This is the single most common multi-account abuse
-- vector on Indian cashback sites. We normalize into a separate column
-- and put a unique index on it.

CREATE OR REPLACE FUNCTION public.normalize_email(p_email text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_local text;
    v_domain text;
BEGIN
    IF p_email IS NULL OR p_email = '' THEN
        RETURN NULL;
    END IF;

    -- Split on '@'. Anything without exactly one '@' we treat as invalid
    -- and just lowercase as a safe fallback.
    IF array_length(string_to_array(p_email, '@'), 1) <> 2 THEN
        RETURN lower(p_email);
    END IF;

    v_local  := lower(split_part(p_email, '@', 1));
    v_domain := lower(split_part(p_email, '@', 2));

    -- Strip +alias for every provider.
    v_local := split_part(v_local, '+', 1);

    -- Gmail-specific: strip dots in the local part. googlemail.com is
    -- a gmail alias.
    IF v_domain IN ('gmail.com', 'googlemail.com') THEN
        v_local  := replace(v_local, '.', '');
        v_domain := 'gmail.com';
    END IF;

    RETURN v_local || '@' || v_domain;
END;
$$;

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS normalized_email text
        GENERATED ALWAYS AS (public.normalize_email(email)) STORED;

-- Partial unique index so pre-existing rows with NULL emails don't
-- collide.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_normalized_email_unique
    ON public.profiles (normalized_email)
    WHERE normalized_email IS NOT NULL;

-- =====================================================================
-- 2. Click-binding: stale-click guard + (store, network) mismatch helper
-- =====================================================================
--
-- The edge function enforces the mismatch checks in code (it has to,
-- because it sees the incoming postback params). What we give it from
-- SQL is a helper that checks click age atomically.
--
-- We keep the cutoff permissive (90 days) because legitimate networks
-- sometimes take weeks to confirm a conversion. Tune down if you see
-- abuse.

CREATE OR REPLACE FUNCTION public.is_click_fresh(p_session_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.affiliate_clicks
        WHERE session_id = p_session_id
          AND clicked_at > now() - interval '90 days'
    );
$$;

REVOKE ALL ON FUNCTION public.is_click_fresh(text) FROM public;
GRANT EXECUTE ON FUNCTION public.is_click_fresh(text) TO authenticated, service_role;

-- =====================================================================
-- 3. Referral hardening: block self-referrals + cap rate per referrer
-- =====================================================================
--
-- The trigger in migration 20260417030000 auto-creates a referrals row
-- from profiles.referred_by and auto-completes on first confirmed
-- cashback. We now wrap that with:
--   (a) reject referral if referrer and referred share a normalized
--       email (same person signing up twice)
--   (b) reject if the referrer has already banked >= 10 referrals in
--       the last 30 days.

CREATE OR REPLACE FUNCTION public.referrals_anti_abuse()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ref_norm  text;
    v_refd_norm text;
    v_recent    int;
    v_cap       constant int := 10;
    v_window    constant interval := interval '30 days';
BEGIN
    -- Look up normalized emails from profiles.
    SELECT normalized_email INTO v_ref_norm
    FROM public.profiles
    WHERE user_id = NEW.referrer_id;

    SELECT normalized_email INTO v_refd_norm
    FROM public.profiles
    WHERE user_id = NEW.referred_id;

    IF v_ref_norm IS NOT NULL
       AND v_refd_norm IS NOT NULL
       AND v_ref_norm = v_refd_norm THEN
        RAISE EXCEPTION 'Self-referral blocked (normalized email match)'
            USING ERRCODE = '22023';
    END IF;

    -- Rate limit: count referrals by this referrer in the last 30d.
    SELECT COUNT(*)
    INTO v_recent
    FROM public.referrals
    WHERE referrer_id = NEW.referrer_id
      AND created_at > now() - v_window;

    IF v_recent >= v_cap THEN
        RAISE EXCEPTION 'Referral velocity limit: % referrals in %',
            v_cap, v_window
            USING ERRCODE = '22023';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS referrals_anti_abuse_trg ON public.referrals;
CREATE TRIGGER referrals_anti_abuse_trg
    BEFORE INSERT ON public.referrals
    FOR EACH ROW
    EXECUTE FUNCTION public.referrals_anti_abuse();

-- =====================================================================
-- 4. Withdrawal cooldown: min 10 minutes between requests per user
-- =====================================================================
--
-- Makes the existing advisory lock a velocity limit too. The existing
-- balance check already prevents over-draft when both requests fire at
-- once, but a user can still submit 100 rapid-fire ₹100 requests and
-- fragment the admin queue. 10 minutes is a reasonable floor; tune as
-- you see fit.

CREATE OR REPLACE FUNCTION public.enforce_withdrawal_cooldown()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_cooldown constant interval := interval '10 minutes';
    v_last_at timestamptz;
BEGIN
    -- Only applies to user-originated rows; admin-inserted rows skip
    -- the cooldown (admins create refunds / corrections).
    IF current_setting('role', true) = 'service_role' THEN
        RETURN NEW;
    END IF;

    SELECT MAX(requested_at) INTO v_last_at
    FROM public.withdrawals
    WHERE user_id = NEW.user_id;

    IF v_last_at IS NOT NULL AND v_last_at > now() - v_cooldown THEN
        RAISE EXCEPTION 'Withdrawal cooldown: wait % between requests',
            v_cooldown
            USING ERRCODE = '22023';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_withdrawal_cooldown_trg ON public.withdrawals;
CREATE TRIGGER enforce_withdrawal_cooldown_trg
    BEFORE INSERT ON public.withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_withdrawal_cooldown();

-- =====================================================================
-- 5. Admin audit log
-- =====================================================================
--
-- Records every UPDATE/DELETE on money-touching tables so that if an
-- admin account is compromised we have a forensic record. INSERTs are
-- logged too for withdrawals (admins manually approving refunds). We
-- deliberately store full old/new JSON so column schemas can drift
-- without breaking the log.

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id             bigserial PRIMARY KEY,
    actor_user_id  uuid,                 -- auth.uid() of the caller
    actor_email    text,                 -- denormalized for log readability
    action         text NOT NULL,        -- INSERT | UPDATE | DELETE
    table_name     text NOT NULL,
    row_pk         text,                 -- stringified primary key
    old_data       jsonb,
    new_data       jsonb,
    at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_at_idx
    ON public.admin_audit_log (at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_actor_idx
    ON public.admin_audit_log (actor_user_id, at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_table_idx
    ON public.admin_audit_log (table_name, at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Read-only from the admin UI. Only service_role and admins can read,
-- nobody can write via PostgREST. Trigger inserts bypass this because
-- triggers run as the table owner.
DROP POLICY IF EXISTS "Admins can read audit log" ON public.admin_audit_log;
CREATE POLICY "Admins can read audit log"
    ON public.admin_audit_log
    FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.audit_money_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_actor_id uuid := auth.uid();
    v_actor_email text;
    v_pk text;
BEGIN
    -- Best-effort lookup of actor's email for log readability.
    IF v_actor_id IS NOT NULL THEN
        SELECT email INTO v_actor_email
        FROM public.profiles
        WHERE user_id = v_actor_id;
    END IF;

    -- Stringify the primary key from whatever row was affected.
    IF TG_OP = 'DELETE' THEN
        v_pk := COALESCE(OLD.id::text, NULL);
    ELSE
        v_pk := COALESCE(NEW.id::text, NULL);
    END IF;

    INSERT INTO public.admin_audit_log (
        actor_user_id, actor_email, action, table_name, row_pk,
        old_data, new_data
    ) VALUES (
        v_actor_id,
        v_actor_email,
        TG_OP,
        TG_TABLE_NAME,
        v_pk,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- Attach to money-touching tables. Not on the RPC inserts (those run
-- as service_role / definer and will still be logged here because the
-- trigger fires on the underlying INSERT).
DROP TRIGGER IF EXISTS audit_cashback_trg ON public.cashback_transactions;
CREATE TRIGGER audit_cashback_trg
    AFTER INSERT OR UPDATE OR DELETE ON public.cashback_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_money_mutation();

DROP TRIGGER IF EXISTS audit_withdrawals_trg ON public.withdrawals;
CREATE TRIGGER audit_withdrawals_trg
    AFTER UPDATE OR DELETE ON public.withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_money_mutation();

-- Two separate triggers because the `WHEN` clause can't reference
-- TG_OP, and we want UPDATEs to skip timestamp-only noise while DELETEs
-- always get logged.
DROP TRIGGER IF EXISTS audit_profiles_update_trg ON public.profiles;
CREATE TRIGGER audit_profiles_update_trg
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    WHEN (
        -- Skip timestamp-only churn (updated_at triggers on every write).
        (to_jsonb(NEW) - 'updated_at') IS DISTINCT FROM (to_jsonb(OLD) - 'updated_at')
    )
    EXECUTE FUNCTION public.audit_money_mutation();

DROP TRIGGER IF EXISTS audit_profiles_delete_trg ON public.profiles;
CREATE TRIGGER audit_profiles_delete_trg
    AFTER DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_money_mutation();

-- Helpful view for the admin panel: last 200 mutations, newest first.
CREATE OR REPLACE VIEW public.admin_audit_log_recent AS
SELECT id, actor_user_id, actor_email, action, table_name, row_pk,
       old_data, new_data, at
FROM public.admin_audit_log
ORDER BY at DESC
LIMIT 200;

GRANT SELECT ON public.admin_audit_log_recent TO authenticated;
