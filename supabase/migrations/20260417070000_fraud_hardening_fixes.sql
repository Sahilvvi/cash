-- =====================================================================
-- Fraud-hardening follow-up fixes
-- =====================================================================
--
-- Addresses three bugs found post-merge of 20260417060000:
--
--   1. `referrals_anti_abuse()` queried profiles by `user_id`, but
--      `referrals.referrer_id / referred_id` are FKs to `profiles.id`.
--      The resulting NULL lookups short-circuited the self-referral
--      check, making it a no-op. (Devin Review finding on PR #11.)
--
--   2. `affiliate_clicks.network_type` defaults to `'generic_postback'`,
--      which the frontend never overrides. When an Offer18 postback
--      arrives with `network_type=offer18`, the click-binding check in
--      `track-conversion` rejects it as a mismatch — blocking every
--      real conversion. The client code will be updated in the same
--      PR; here we also drop the default so a forgotten `network_type`
--      on a future insert surfaces as NULL (safer — binding check
--      skips when click's network_type is NULL) instead of a wrong
--      value.
--
--   3. No change needed for withdrawal cooldown; the issue flagged on
--      the verify script is in the JS test fixture, not the SQL.

-- ---------------------------------------------------------------------
-- 1. Fix referrals_anti_abuse to use profiles.id (not profiles.user_id)
-- ---------------------------------------------------------------------
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
    -- Look up normalized emails from profiles. referrals.referrer_id /
    -- referred_id are foreign keys to profiles.id (see FK
    -- referrals_referrer_id_fkey). The previous version queried
    -- profiles by user_id and always returned NULL, silently
    -- disabling the self-referral check.
    SELECT normalized_email INTO v_ref_norm
    FROM public.profiles
    WHERE id = NEW.referrer_id;

    SELECT normalized_email INTO v_refd_norm
    FROM public.profiles
    WHERE id = NEW.referred_id;

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

-- ---------------------------------------------------------------------
-- 2. Drop the misleading default on affiliate_clicks.network_type
-- ---------------------------------------------------------------------
--
-- Old default: 'generic_postback'. New default: NULL. The frontend is
-- updated in the same PR to always pass the real network. Existing
-- rows are left untouched — the binding check in track-conversion
-- already skips the comparison when the stored network is NULL, so
-- legacy rows remain usable.
ALTER TABLE public.affiliate_clicks
    ALTER COLUMN network_type DROP DEFAULT;
