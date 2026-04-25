-- Failed-postback log + admin dashboard helper view
--
-- Goal: every 4xx/5xx response from track-conversion lands in
-- public.postback_errors with the raw query string + reason, so admins
-- can debug missing cashback (e.g. Offer18 sending the wrong network_type
-- or attacking the endpoint with bogus session_ids). Until now those
-- errors only existed in the edge function logs, which most operators
-- can't easily search.
--
-- Also adds a public.admin_dashboard_metrics view that aggregates
-- today's clicks, today's conversions split by status, and a 24h
-- failed-postback count, so the Admin Dashboard can render a single
-- summary card without hitting six tables.

BEGIN;

CREATE TABLE IF NOT EXISTS public.postback_errors (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    occurred_at timestamptz NOT NULL DEFAULT now(),
    -- The HTTP status returned to the network (400, 401, 410, 500, …).
    status_code int  NOT NULL,
    -- Short reason code we control (e.g. invalid_session, network_mismatch,
    -- store_mismatch, click_expired, missing_session, bad_token, rpc_error).
    reason      text NOT NULL,
    -- Free-form human message lifted from the error response.
    message     text,
    -- Raw query string MINUS the secret token. Capped at 1KB.
    query       text,
    -- Echoed parameters that aid debugging without leaking secrets.
    session_id  text,
    order_id    text,
    network     text,
    -- Caller IP (X-Forwarded-For first hop) and User-Agent — useful for
    -- spotting hostile traffic.
    ip          text,
    user_agent  text
);

CREATE INDEX IF NOT EXISTS postback_errors_occurred_at_idx
    ON public.postback_errors (occurred_at DESC);

CREATE INDEX IF NOT EXISTS postback_errors_session_idx
    ON public.postback_errors (session_id);

ALTER TABLE public.postback_errors ENABLE ROW LEVEL SECURITY;

-- Service role does the writes (track-conversion is service-role).
-- Admins read via the standard is_admin() helper used elsewhere.
DROP POLICY IF EXISTS "Service role can manage postback errors"
    ON public.postback_errors;
CREATE POLICY "Service role can manage postback errors"
    ON public.postback_errors
    FOR ALL
    TO service_role
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read postback errors"
    ON public.postback_errors;
CREATE POLICY "Admins can read postback errors"
    ON public.postback_errors
    FOR SELECT
    TO authenticated
    USING (public.is_admin(auth.uid()));

-- Aggregation view for the Admin Dashboard. Reads are admin-only via
-- the underlying RLS policies on cashback_transactions and
-- affiliate_clicks (both have admin SELECT policies); the view itself
-- doesn't need its own RLS.
CREATE OR REPLACE VIEW public.admin_dashboard_metrics AS
WITH today AS (
    SELECT date_trunc('day', now()) AS start_ts
), conv AS (
    SELECT status, count(*)::int AS n
    FROM   public.cashback_transactions
    WHERE  created_at >= (SELECT start_ts FROM today)
    GROUP  BY status
), pending_total AS (
    SELECT
        coalesce(sum(amount) FILTER (WHERE status = 'pending'),   0)::numeric AS pending_amount,
        coalesce(sum(amount) FILTER (WHERE status = 'approved'),  0)::numeric AS approved_amount,
        coalesce(sum(amount) FILTER (WHERE status = 'confirmed'), 0)::numeric AS confirmed_amount,
        coalesce(sum(amount) FILTER (WHERE status = 'reversed'),  0)::numeric AS reversed_amount
    FROM public.cashback_transactions
)
SELECT
    -- Today
    (SELECT count(*)::int FROM public.affiliate_clicks
        WHERE clicked_at >= (SELECT start_ts FROM today))            AS clicks_today,
    (SELECT coalesce(sum(n), 0)::int FROM conv)                      AS conversions_today,
    coalesce((SELECT n FROM conv WHERE status = 'pending'),   0)::int AS pending_today,
    coalesce((SELECT n FROM conv WHERE status = 'approved'),  0)::int AS approved_today,
    coalesce((SELECT n FROM conv WHERE status = 'confirmed'), 0)::int AS confirmed_today,
    coalesce((SELECT n FROM conv WHERE status = 'reversed'),  0)::int AS reversed_today,
    -- Lifetime balance buckets (for the "are we about to pay out money
    -- we haven't actually received yet" widget)
    pt.pending_amount,
    pt.approved_amount,
    pt.confirmed_amount,
    pt.reversed_amount,
    -- 24h failed-postback count
    (SELECT count(*)::int FROM public.postback_errors
        WHERE occurred_at >= now() - interval '24 hours')            AS errors_24h
FROM pending_total pt;

GRANT SELECT ON public.admin_dashboard_metrics TO authenticated, service_role;

COMMIT;
