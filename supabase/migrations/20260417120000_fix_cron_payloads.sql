-- 20260417120000_fix_cron_payloads.sql
--
-- Follow-up to 20260417110000_scheduled_jobs.sql, fixing two bugs that
-- Devin Review caught on PR #17:
--
--   1. run_nightly_offer18_sync() pointed at
--        offer18-proxy?action=sync_offers
--      That action does not exist in offer18-proxy and the function would
--      have responded with a passthrough fetch of the Offer18 feed (whose
--      result we then discard). PLUS, the call uses the service-role key
--      as bearer, but offer18-proxy expects a *user* JWT and would have
--      401'd. Net effect: cron job ran every night and silently did
--      nothing useful.
--
--      Fix: the proxy now supports `?action=sync` (server-side full
--      offer-feed → stores upsert) and accepts the service-role key as
--      auth, so we just point the cron at the new action.
--
--   2. run_nightly_reconcile() sent `jsonb_build_object('window_days', 2)`,
--      but reconcile-conversions reads `body.days`. The override was
--      silently ignored and the reconciler always scanned a 7-day window.
--
--      Fix: rename the JSON key to `days` to match the function.
--
-- Both functions are recreated with CREATE OR REPLACE; the cron schedule
-- itself does not need re-registration because cron.job rows reference
-- the SQL command (`SELECT public.run_nightly_*()`), and CREATE OR REPLACE
-- updates the function body in place.

CREATE OR REPLACE FUNCTION public.run_nightly_offer18_sync()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    headers jsonb;
BEGIN
    headers := public._service_role_auth_header();
    IF headers IS NULL THEN
        RAISE NOTICE 'run_nightly_offer18_sync: app.devin_service_role_key not set; skipping';
        RETURN;
    END IF;

    -- offer18-proxy?action=sync now performs a server-side fetch +
    -- stores upsert and accepts the service-role key as bearer (added
    -- in the same PR as this migration).
    PERFORM net.http_post(
        url     := 'https://cikmdkkngifzpulrwkwt.supabase.co/functions/v1/offer18-proxy?action=sync',
        headers := headers,
        body    := '{}'::jsonb,
        timeout_milliseconds := 60000
    );
END $$;

CREATE OR REPLACE FUNCTION public.run_nightly_reconcile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    headers jsonb;
BEGIN
    headers := public._service_role_auth_header();
    IF headers IS NULL THEN
        RAISE NOTICE 'run_nightly_reconcile: app.devin_service_role_key not set; skipping';
        RETURN;
    END IF;

    -- reconcile-conversions reads `body.days` (NOT `window_days`); keep
    -- this key in sync with supabase/functions/reconcile-conversions/index.ts.
    PERFORM net.http_post(
        url     := 'https://cikmdkkngifzpulrwkwt.supabase.co/functions/v1/reconcile-conversions',
        headers := headers,
        body    := jsonb_build_object('days', 2),
        timeout_milliseconds := 60000
    );
END $$;
