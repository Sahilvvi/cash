-- Make apply_postback_state tolerate real-world status vocabularies,
-- and stop duplicate session_ids from breaking click lookup.
--
-- Problem 1 — lost conversions on unknown status strings.
--
--   apply_postback_state validates `p_status` with a case-sensitive
--   `NOT IN ('pending','approved','confirmed','reversed')` and RAISEs on
--   anything else. track-conversion passed the network's `status` param
--   through verbatim. Affiliate networks do not use that exact
--   vocabulary: Offer18 merchants send `Approved`, `Sale`, `1`, `0`,
--   `Rejected` depending on how the postback template was written. Every
--   one of those raised, surfaced as a 500 `rpc_error`, and the
--   conversion was never recorded — while the affiliate_clicks row for
--   the same session sat there looking perfectly healthy.
--
--   The edge function now normalises before calling (see
--   supabase/functions/_shared/postback.ts). This migration adds the same
--   mapping in SQL so the fix holds for direct RPC callers, for the
--   reconciliation job, and for any deploy where the function lags the
--   database. Genuinely unmappable values still RAISE — that path is now
--   only reachable by a human typo, since both callers pre-normalise.
--
-- Problem 2 — duplicate session_ids.
--
--   track-conversion resolves a click with `.single()`, which errors when
--   the filter matches more than one row. Two affiliate_clicks rows
--   sharing a session_id would therefore reject every postback for that
--   session with `invalid_session`. session_id is a client-generated
--   crypto.randomUUID() so collisions are not expected in practice, but
--   nothing enforced it. Added as a unique index — non-destructively: if
--   duplicates already exist we warn and fall back to a plain index
--   rather than failing the migration and blocking the deploy.

BEGIN;

-- 1. Shared status mapping. Mirrors normalizeStatus() in
--    supabase/functions/_shared/postback.ts — keep the two in step.
--    Returns NULL for values it cannot map, so callers decide whether
--    that's fatal.
CREATE OR REPLACE FUNCTION public.cashback_normalize_status(p_status text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE lower(btrim(coalesce(p_status, '')))
        WHEN ''             THEN 'pending'
        WHEN 'pending'      THEN 'pending'
        WHEN 'unconfirmed'  THEN 'pending'
        WHEN 'processing'   THEN 'pending'
        WHEN 'onhold'       THEN 'pending'
        WHEN 'on_hold'      THEN 'pending'
        WHEN '0'            THEN 'pending'

        WHEN 'approved'     THEN 'approved'
        WHEN 'validated'    THEN 'approved'
        WHEN 'valid'        THEN 'approved'
        WHEN 'accepted'     THEN 'approved'
        WHEN 'sale'         THEN 'approved'
        WHEN 'lead'         THEN 'approved'
        WHEN 'conversion'   THEN 'approved'
        WHEN '1'            THEN 'approved'

        WHEN 'confirmed'    THEN 'confirmed'
        WHEN 'paid'         THEN 'confirmed'
        WHEN 'closed'       THEN 'confirmed'
        WHEN 'complete'     THEN 'confirmed'
        WHEN 'completed'    THEN 'confirmed'
        WHEN 'success'      THEN 'confirmed'
        WHEN 'successful'   THEN 'confirmed'

        WHEN 'reversed'     THEN 'reversed'
        WHEN 'rejected'     THEN 'reversed'
        WHEN 'reject'       THEN 'reversed'
        WHEN 'declined'     THEN 'reversed'
        WHEN 'refunded'     THEN 'reversed'
        WHEN 'cancelled'    THEN 'reversed'
        WHEN 'canceled'     THEN 'reversed'
        WHEN 'chargeback'   THEN 'reversed'
        WHEN 'invalid'      THEN 'reversed'
        WHEN '2'            THEN 'reversed'

        ELSE NULL
    END;
$$;

COMMENT ON FUNCTION public.cashback_normalize_status(text) IS
    'Maps an affiliate network status string onto the four-state cashback '
    'vocabulary. NULL when unmappable. Mirrors normalizeStatus() in '
    'supabase/functions/_shared/postback.ts.';

-- 2. Re-create apply_postback_state with the normalisation applied.
--    Body is otherwise identical to 20260417090000 (race-safe insert with
--    the unique_violation catch, forward-only transitions, confirmed_at
--    stamping) — only the status resolution at the top changes.
CREATE OR REPLACE FUNCTION public.apply_postback_state(
    p_user_id      uuid,
    p_store_id     uuid,
    p_amount       numeric,
    p_order_id     text,
    p_network_type text,
    p_status       text,
    p_order_amount numeric DEFAULT NULL,
    p_description  text    DEFAULT NULL
)
RETURNS TABLE (
    transaction_id  uuid,
    final_status    text,
    action          text  -- 'inserted' | 'transitioned' | 'noop' | 'rejected_backward'
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_temp'
AS $$
DECLARE
    v_existing      public.cashback_transactions%ROWTYPE;
    v_new_id        uuid;
    v_target_status text;
BEGIN
    IF p_network_type IS NULL OR p_network_type = '' THEN
        RAISE EXCEPTION 'apply_postback_state: network_type is required';
    END IF;

    -- Case-insensitive, synonym-aware. NULL back means the caller sent
    -- something we have no mapping for at all, which is still an error
    -- worth surfacing — both production callers normalise first.
    v_target_status := public.cashback_normalize_status(p_status);
    IF v_target_status IS NULL THEN
        RAISE EXCEPTION 'apply_postback_state: invalid status %', p_status;
    END IF;

    -- Idempotency lookup. The unique index covers (network_type, order_id)
    -- where order_id IS NOT NULL, so we only de-dupe when an order_id
    -- is supplied. FOR UPDATE so concurrent transitions on the same row
    -- serialise rather than racing each other.
    IF p_order_id IS NOT NULL AND p_order_id <> '' THEN
        SELECT * INTO v_existing
        FROM public.cashback_transactions
        WHERE network_type = p_network_type
          AND order_id     = p_order_id
        LIMIT 1
        FOR UPDATE;
    END IF;

    IF v_existing.id IS NULL THEN
        BEGIN
            INSERT INTO public.cashback_transactions
                (user_id, store_id, amount, status, order_id, network_type,
                 order_amount, description, confirmed_at)
            VALUES
                (p_user_id, p_store_id, COALESCE(p_amount, 0), v_target_status,
                 p_order_id, p_network_type,
                 p_order_amount, p_description,
                 CASE WHEN v_target_status = 'confirmed' THEN now() ELSE NULL END)
            RETURNING id INTO v_new_id;

            RETURN QUERY SELECT v_new_id, v_target_status, 'inserted'::text;
            RETURN;
        EXCEPTION WHEN unique_violation THEN
            -- Lost the insert race. Reload the winner's row and fall
            -- through into the transition path below.
            SELECT * INTO v_existing
            FROM public.cashback_transactions
            WHERE network_type = p_network_type
              AND order_id     = p_order_id
            LIMIT 1
            FOR UPDATE;

            IF v_existing.id IS NULL THEN
                RAISE EXCEPTION
                    'apply_postback_state: unique_violation but no row found for (%, %)',
                    p_network_type, p_order_id;
            END IF;
        END;
    END IF;

    -- Same status → no-op.
    IF v_existing.status = v_target_status THEN
        RETURN QUERY SELECT v_existing.id, v_existing.status, 'noop'::text;
        RETURN;
    END IF;

    -- Forward-only transitions. reversed is reachable from anywhere;
    -- otherwise we must be moving up the rank ladder.
    IF v_target_status <> 'reversed'
       AND public.cashback_status_rank(v_target_status)
           <= public.cashback_status_rank(v_existing.status) THEN
        RETURN QUERY SELECT v_existing.id, v_existing.status,
                            'rejected_backward'::text;
        RETURN;
    END IF;

    UPDATE public.cashback_transactions
    SET status       = v_target_status,
        amount       = COALESCE(p_amount, amount),
        order_amount = COALESCE(p_order_amount, order_amount),
        description  = COALESCE(p_description, description),
        confirmed_at = CASE
            WHEN v_target_status = 'confirmed' AND confirmed_at IS NULL
                THEN now()
            ELSE confirmed_at
        END
    WHERE id = v_existing.id;

    RETURN QUERY SELECT v_existing.id, v_target_status, 'transitioned'::text;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_postback_state(
    uuid, uuid, numeric, text, text, text, numeric, text
) TO service_role;

-- 3. Enforce one click per session_id, non-destructively.
DO $$
DECLARE
    v_dupes int;
BEGIN
    SELECT count(*) INTO v_dupes
    FROM (
        SELECT session_id
        FROM   public.affiliate_clicks
        WHERE  session_id IS NOT NULL
        GROUP  BY session_id
        HAVING count(*) > 1
    ) d;

    IF v_dupes > 0 THEN
        RAISE WARNING
            'affiliate_clicks has % duplicated session_id value(s); '
            'creating a NON-unique index instead. Postbacks for those '
            'sessions will keep failing with invalid_session until the '
            'duplicates are resolved.', v_dupes;
        CREATE INDEX IF NOT EXISTS affiliate_clicks_session_id_key
            ON public.affiliate_clicks (session_id)
            WHERE session_id IS NOT NULL;
    ELSE
        CREATE UNIQUE INDEX IF NOT EXISTS affiliate_clicks_session_id_key
            ON public.affiliate_clicks (session_id)
            WHERE session_id IS NOT NULL;
    END IF;
END $$;

COMMIT;
