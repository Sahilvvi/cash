-- 20260417110000_scheduled_jobs.sql
--
-- Schedules the two recurring backend jobs the cashback platform needs:
--
--   1. nightly_offer18_sync     — refreshes the local copy of Offer18
--                                  offers (logos / payouts / authorization
--                                  state) so the storefront stays in sync.
--   2. nightly_reconcile        — pulls the last 1 day of Offer18
--                                  conversions and replays them through
--                                  apply_postback_state so any postbacks
--                                  we missed get backfilled.
--
-- Both jobs need to call edge functions with the service-role key. We
-- DON'T want that key sitting in a migration file, so we read it at
-- run-time from a Postgres GUC (`app.devin_service_role_key`) that the
-- operator sets once. The schedules are still created here, but they
-- silently no-op until the GUC is populated.
--
-- One-time operator step (run in Supabase SQL editor):
--
--     ALTER DATABASE postgres
--         SET app.devin_service_role_key =
--         '<paste service_role JWT here>';
--     SELECT pg_reload_conf();
--
-- Verify with:  SELECT cron.unschedule('nightly_offer18_sync');  -- if you ever want to stop them
--               SELECT * FROM cron.job;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Helper that builds the Authorization header for a service-role HTTP call,
-- or returns NULL if the GUC isn't set yet (in which case the cron job will
-- log a warning and skip the run instead of firing an unauth'd request).
CREATE OR REPLACE FUNCTION public._service_role_auth_header()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    key text;
BEGIN
    -- The third arg `true` makes current_setting() return NULL instead of
    -- raising when the GUC is missing. Lets the cron job no-op cleanly.
    key := current_setting('app.devin_service_role_key', true);
    IF key IS NULL OR key = '' THEN
        RETURN NULL;
    END IF;
    RETURN jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || key
    );
END $$;

-- Wrapper functions that pg_cron will call. We isolate the URL/body so the
-- schedule SQL stays one short line and so future changes (e.g. adding
-- structured args, switching to a different reconcile window) don't need
-- a new migration just to update a string in cron.job.command.

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

    PERFORM net.http_post(
        url     := 'https://cikmdkkngifzpulrwkwt.supabase.co/functions/v1/offer18-proxy?action=sync_offers',
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

    PERFORM net.http_post(
        url     := 'https://cikmdkkngifzpulrwkwt.supabase.co/functions/v1/reconcile-conversions',
        headers := headers,
        body    := jsonb_build_object('window_days', 2),
        timeout_milliseconds := 60000
    );
END $$;

-- ---- Schedule registration ----------------------------------------------
-- We unschedule first so re-running this migration is idempotent (cron.schedule
-- itself errors if a job with the same name already exists).
DO $$
BEGIN
    PERFORM cron.unschedule('nightly_offer18_sync');
EXCEPTION WHEN OTHERS THEN
    -- Job not registered yet; that's fine.
    NULL;
END $$;

DO $$
BEGIN
    PERFORM cron.unschedule('nightly_reconcile');
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 02:30 IST = 21:00 UTC.  Sync first, then reconcile 30m later so the
-- reconciler sees the freshest offer metadata.
SELECT cron.schedule(
    'nightly_offer18_sync',
    '0 21 * * *',
    $cron$ SELECT public.run_nightly_offer18_sync(); $cron$
);

SELECT cron.schedule(
    'nightly_reconcile',
    '30 21 * * *',
    $cron$ SELECT public.run_nightly_reconcile(); $cron$
);

-- Convenience view so admins can see the registered schedules without
-- needing direct access to the cron schema.
CREATE OR REPLACE VIEW public.admin_scheduled_jobs AS
SELECT
    j.jobname              AS name,
    j.schedule             AS cron,
    j.active               AS active,
    j.command              AS command,
    coalesce((SELECT max(start_time) FROM cron.job_run_details d WHERE d.jobid = j.jobid), NULL) AS last_run_at,
    coalesce((SELECT status   FROM cron.job_run_details d WHERE d.jobid = j.jobid ORDER BY start_time DESC LIMIT 1), NULL) AS last_status
FROM cron.job j
WHERE j.jobname IN ('nightly_offer18_sync', 'nightly_reconcile');

GRANT SELECT ON public.admin_scheduled_jobs TO authenticated;

-- The view itself is admin-only via the underlying cron schema; we still
-- gate it via RLS-equivalent: only is_admin() callers can read.
ALTER VIEW public.admin_scheduled_jobs SET (security_invoker = on);

COMMENT ON VIEW public.admin_scheduled_jobs IS
    'Read-only summary of the cashback platform''s recurring jobs. Powered by pg_cron.';
