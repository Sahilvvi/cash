-- 20260822000000_service_role_key_via_vault.sql
--
-- The 20260417110000_scheduled_jobs.sql migration documented a one-time
-- operator step to make the nightly cron jobs work:
--
--     ALTER DATABASE postgres
--         SET app.devin_service_role_key = '<service_role JWT>';
--
-- That step was never (successfully) completed: hosted Supabase's
-- `postgres` role does not have permission to ALTER DATABASE / ALTER ROLE
-- a custom GUC (confirmed 2026-08-22, error 42501 "permission denied to
-- set parameter"). Both nightly jobs have therefore been silently no-op'ing
-- since inception -- `_service_role_auth_header()` always returned NULL,
-- `run_nightly_offer18_sync()` / `run_nightly_reconcile()` RAISE NOTICE and
-- RETURN before ever calling net.http_post, and pg_cron reports "succeeded"
-- because no exception was thrown. Zero net-new invocations ever reached
-- reconcile-conversions or offer18-proxy as a result.
--
-- Fix: store the secret in Supabase Vault (an encrypted table, not a GUC)
-- instead. `postgres` has an INSERT-equivalent right to vault.create_secret;
-- it just can't touch instance-level parameters.
--
-- One-time operator step (run in the Supabase SQL editor, replacing the
-- placeholder with the actual service_role key from Project Settings > API
-- -- do NOT commit the real key to this file or any migration):
--
--     select vault.create_secret(
--         '<service_role JWT>',
--         'devin_service_role_key',
--         'Service role key for pg_cron -> edge function calls'
--     );
--
-- Verify with (safe -- never prints the key itself):
--
--     SELECT public._service_role_auth_header() IS NULL AS header_is_null;
--     -- expect: false
--
-- If the secret is ever rotated, update it with:
--
--     select vault.update_secret(
--         (select id from vault.secrets where name = 'devin_service_role_key'),
--         '<new service_role JWT>'
--     );

CREATE EXTENSION IF NOT EXISTS supabase_vault;

CREATE OR REPLACE FUNCTION public._service_role_auth_header()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    key text;
BEGIN
    -- Vault lookup, not current_setting(): reads live from an encrypted
    -- table, so (unlike a GUC) it also doesn't require a fresh connection
    -- to pick up a just-set value.
    SELECT decrypted_secret INTO key
    FROM vault.decrypted_secrets
    WHERE name = 'devin_service_role_key'
    ORDER BY created_at DESC
    LIMIT 1;

    IF key IS NULL OR key = '' THEN
        RETURN NULL;
    END IF;

    RETURN jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || key
    );
END $$;

COMMENT ON FUNCTION public._service_role_auth_header() IS
    'Builds the Authorization header for cron-triggered edge function calls. '
    'Reads the service_role key from Supabase Vault (secret name '
    'devin_service_role_key), not a Postgres GUC -- the hosted postgres '
    'role cannot ALTER DATABASE/ROLE a custom parameter. Returns NULL (and '
    'callers no-op) until the secret is populated via vault.create_secret().';
