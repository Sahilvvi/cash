-- 20260417130000_rate_limiting.sql
--
-- Per-IP / per-user / per-session rate limiting on:
--
--   1. affiliate_clicks INSERT (the click handler)
--   2. track-conversion RPC entry  (the postback handler)
--
-- Why:
--   - One attacker spamming clicks from a single IP can inflate our
--     click counters and waste Offer18 budget.
--   - One attacker firing fake postbacks at high velocity (after
--     somehow learning a session_id + the postback secret) can
--     credit themselves before we notice.
--
-- Design:
--   - A single, narrow `rate_limit_hits` table records (bucket, key,
--     occurred_at) for everything we want to throttle. Buckets are:
--       'click_ip'        | IP -> affiliate_clicks
--       'click_user'      | user_id -> affiliate_clicks
--       'postback_ip'     | IP -> track-conversion
--       'postback_session'| session_id -> track-conversion
--
--   - `public.check_rate_limit(bucket, key, max_count, window)` is a
--     SECURITY DEFINER function that records the new hit AND returns
--     TRUE if the actor is now over the limit. Callers either raise
--     an EXCEPTION (insert trigger path) or return a 429 (HTTP path).
--
--   - For affiliate_clicks, a BEFORE INSERT trigger enforces both the
--     per-IP and per-user limits. It also auto-fills ip_address from
--     the request headers if the client didn't set it, so the IP is
--     server-observed and not spoofable.

BEGIN;

-- ---- Storage ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limit_hits (
    id          bigserial    PRIMARY KEY,
    bucket      text         NOT NULL,
    key         text         NOT NULL,
    occurred_at timestamptz  NOT NULL DEFAULT now()
);

-- Lookup pattern is always (bucket, key, occurred_at >= window_start).
CREATE INDEX IF NOT EXISTS rate_limit_hits_lookup
    ON public.rate_limit_hits (bucket, key, occurred_at DESC);

-- Garbage collection: anything older than 24h is uninteresting, the
-- biggest enforcement window we use is 1 hour. Trigger this from
-- `check_rate_limit` opportunistically (1% of calls) so we don't need
-- pg_cron just for cleanup.
CREATE OR REPLACE FUNCTION public._rate_limit_gc()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.rate_limit_hits
     WHERE occurred_at < now() - interval '24 hours';
END $$;


-- ---- Core helper ------------------------------------------------------------
-- Records one hit for (bucket, key) and returns TRUE if `key` has now
-- exceeded `max_count` hits in the last `window`. Returns FALSE if the
-- caller is still within budget. Always records the hit even when
-- exceeded so repeated abusive callers see strictly increasing counts.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_bucket text,
    p_key    text,
    p_max    int,
    p_window interval
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count int;
BEGIN
    -- A NULL/empty key means "no information to throttle on" — let it
    -- pass. Callers should still throttle on the *other* axis.
    IF p_key IS NULL OR p_key = '' THEN
        RETURN false;
    END IF;

    INSERT INTO public.rate_limit_hits (bucket, key)
        VALUES (p_bucket, p_key);

    SELECT count(*) INTO v_count
      FROM public.rate_limit_hits
     WHERE bucket = p_bucket
       AND key    = p_key
       AND occurred_at >= now() - p_window;

    -- Opportunistic GC: ~1% of calls.
    IF (random() < 0.01) THEN
        PERFORM public._rate_limit_gc();
    END IF;

    RETURN v_count > p_max;
END $$;


-- ---- Click rate limit -------------------------------------------------------
-- Wrapper that enforces both per-IP and per-user budgets and
-- returns the FIRST exceeded bucket name (or NULL if neither is
-- exceeded). We always record both hits even if one exceeds — this
-- keeps the per-IP and per-user windows honest under attack.
CREATE OR REPLACE FUNCTION public.check_click_rate_limit(
    p_ip      text,
    p_user_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ip_blocked   boolean := false;
    v_user_blocked boolean := false;
BEGIN
    -- 30 clicks per IP per minute.
    v_ip_blocked := public.check_rate_limit(
        'click_ip', p_ip, 30, interval '1 minute'
    );

    -- 200 clicks per user per hour.
    v_user_blocked := public.check_rate_limit(
        'click_user', p_user_id::text, 200, interval '1 hour'
    );

    IF v_ip_blocked   THEN RETURN 'click_ip';   END IF;
    IF v_user_blocked THEN RETURN 'click_user'; END IF;
    RETURN NULL;
END $$;


-- ---- Postback rate limit ----------------------------------------------------
-- Same pattern. Postbacks are server-to-server so a *real* network
-- (Offer18) firing 50 postbacks/sec for 50 different conversions is
-- legitimate — but a single session_id receiving 50 postbacks in a
-- minute is suspicious (probably an attacker trying state transitions).
CREATE OR REPLACE FUNCTION public.check_postback_rate_limit(
    p_ip         text,
    p_session_id text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ip_blocked      boolean := false;
    v_session_blocked boolean := false;
BEGIN
    -- 60 postbacks per IP per minute (allows legit network burst).
    v_ip_blocked := public.check_rate_limit(
        'postback_ip', p_ip, 60, interval '1 minute'
    );

    -- 10 postbacks per session_id per minute (state machine has only
    -- 4 forward states, so anything > 10 is abuse).
    v_session_blocked := public.check_rate_limit(
        'postback_session', p_session_id, 10, interval '1 minute'
    );

    IF v_ip_blocked      THEN RETURN 'postback_ip';      END IF;
    IF v_session_blocked THEN RETURN 'postback_session'; END IF;
    RETURN NULL;
END $$;


-- ---- Trigger that enforces click rate limit + observes IP -------------------
-- Reads the real client IP from request headers (set by PostgREST,
-- not spoofable from the JS client) and stamps it on the row. Then
-- runs both rate-limit checks and raises if either is exceeded.
CREATE OR REPLACE FUNCTION public.tg_affiliate_clicks_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_headers jsonb;
    v_ip      text;
    v_block   text;
BEGIN
    -- request.headers is populated by PostgREST on every request. It's
    -- NULL when called outside an HTTP context (e.g. SQL editor) — in
    -- that case we just keep whatever ip_address the caller passed.
    BEGIN
        v_headers := nullif(current_setting('request.headers', true), '')::jsonb;
    EXCEPTION WHEN OTHERS THEN
        v_headers := NULL;
    END;

    IF v_headers IS NOT NULL THEN
        -- x-forwarded-for is "client, proxy1, proxy2"; the leftmost is
        -- the original client. Supabase's edge sets this to the real
        -- caller IP and clobbers any value the JS client tries to set,
        -- so this value is trustworthy.
        v_ip := split_part(coalesce(v_headers->>'x-forwarded-for', ''), ',', 1);
        v_ip := nullif(btrim(v_ip), '');
        IF v_ip IS NOT NULL THEN
            NEW.ip_address := v_ip;
        END IF;
    END IF;

    v_block := public.check_click_rate_limit(NEW.ip_address, NEW.user_id);
    IF v_block IS NOT NULL THEN
        RAISE EXCEPTION 'rate_limit_exceeded: %', v_block
            USING ERRCODE = 'P0001',
                  HINT    = 'Too many clicks; try again in a minute';
    END IF;

    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tg_affiliate_clicks_rate_limit
    ON public.affiliate_clicks;
CREATE TRIGGER tg_affiliate_clicks_rate_limit
    BEFORE INSERT ON public.affiliate_clicks
    FOR EACH ROW EXECUTE FUNCTION public.tg_affiliate_clicks_rate_limit();


-- ---- RLS / grants -----------------------------------------------------------
-- Lock down rate_limit_hits: only service-role / SECURITY DEFINER funcs
-- should touch it. RLS on + zero permissive policies = effectively
-- service-role-only.
ALTER TABLE public.rate_limit_hits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.rate_limit_hits FROM anon, authenticated;
REVOKE ALL ON FUNCTION public._rate_limit_gc()                     FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.check_rate_limit(text,text,int,interval) FROM anon, authenticated;
-- check_click_rate_limit / check_postback_rate_limit aren't called
-- directly by clients either — keep them service-role-only too.
REVOKE ALL ON FUNCTION public.check_click_rate_limit(text,uuid)    FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.check_postback_rate_limit(text,text) FROM anon, authenticated;

COMMIT;
