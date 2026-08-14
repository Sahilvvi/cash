-- Stop the same conversion being credited twice by the live postback and
-- the nightly reconciliation.
--
-- The problem
-- -----------
-- apply_postback_state de-dupes on (network_type, order_id). The two
-- things that call it disagree about what an order_id is:
--
--   track-conversion     uses the merchant's real order id from the
--                        postback (e.g. "ORD-99213").
--   reconcile-conversions cannot see that id at all — Offer18's affiliate
--                        reports API does not expose the merchant's
--                        transaction id — so it synthesises
--                        "o18:<click>:<timestamp>" instead.
--
-- One conversion therefore has two different idempotency keys, and a
-- conversion that arrives by postback AND gets picked up by reconciliation
-- lands as two rows. Both count toward the user's balance. That is a
-- straight double-credit of real money.
--
-- Why not just change the surrogate scheme: rows written under the old
-- scheme are already in the table, and rewriting their keys would break
-- idempotency against the network's own retries.
--
-- The fix
-- -------
-- Record which click each transaction came from, and let that be a second
-- correlation axis — but only where it cannot merge two genuinely
-- different orders:
--
--   * Incoming row has NO real order id (reconciliation, or a network that
--     omits one). Any existing row for the same click is the same
--     conversion — match it.
--   * Incoming row HAS a real order id and no row exists under it. Claim a
--     placeholder row previously written for that click without one, and
--     upgrade it to the real id. The first real order id to arrive wins the
--     placeholder; a second, genuinely different order gets its own row.
--
-- So one click → two real orders still produces two rows, while one order
-- seen twice through two different doors produces one.
--
-- Rollout safety
-- --------------
-- The new parameters are added WITHOUT defaults, and the original 8-argument
-- function is kept as a thin delegate. Postgres resolves an 8-named-argument
-- call unambiguously to the old signature, so edge functions still running
-- the previous deploy keep working while this migration is applied — no
-- ordering constraint between `db push` and `functions deploy`.

BEGIN;

-- 1. The correlation column, plus a flag recording whether order_id is a
--    real merchant id or a placeholder we invented.
ALTER TABLE public.cashback_transactions
    ADD COLUMN IF NOT EXISTS session_id text,
    ADD COLUMN IF NOT EXISTS order_id_synthetic boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.cashback_transactions.session_id IS
    'affiliate_clicks.session_id this conversion was attributed to. Lets '
    'the live postback and the reconciliation job recognise each other''s '
    'rows when they disagree about the order id.';

COMMENT ON COLUMN public.cashback_transactions.order_id_synthetic IS
    'True when order_id is a placeholder we derived (from the click id) '
    'rather than a real merchant order id. Placeholder rows can be claimed '
    'and upgraded by a later postback carrying the real id.';

-- Backfill: reconciliation is the only thing that ever wrote the
-- "o18:<click>:<stamp>" shape, and it is unambiguous.
UPDATE public.cashback_transactions
SET    order_id_synthetic = true
WHERE  order_id LIKE 'o18:%'
   AND order_id_synthetic = false;

-- Recover session_id for those rows — it is the middle segment of the
-- surrogate key. split_part on ':' is safe here because session ids are
-- UUIDs and contain no colons.
UPDATE public.cashback_transactions
SET    session_id = split_part(order_id, ':', 2)
WHERE  order_id LIKE 'o18:%'
   AND session_id IS NULL
   AND split_part(order_id, ':', 2) <> '';

CREATE INDEX IF NOT EXISTS cashback_transactions_session_idx
    ON public.cashback_transactions (network_type, session_id)
    WHERE session_id IS NOT NULL;

-- 2. The real implementation, now click-aware.
CREATE OR REPLACE FUNCTION public.apply_postback_state(
    p_user_id            uuid,
    p_store_id           uuid,
    p_amount             numeric,
    p_order_id           text,
    p_network_type       text,
    p_status             text,
    p_order_amount       numeric,
    p_description        text,
    p_session_id         text,     -- no DEFAULT: keeps the 8-arg call unambiguous
    p_order_id_synthetic boolean   -- no DEFAULT: ditto
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

    v_target_status := public.cashback_normalize_status(p_status);
    IF v_target_status IS NULL THEN
        RAISE EXCEPTION 'apply_postback_state: invalid status %', p_status;
    END IF;

    -- 2a. Primary idempotency: (network_type, order_id).
    IF p_order_id IS NOT NULL AND p_order_id <> '' THEN
        SELECT * INTO v_existing
        FROM public.cashback_transactions
        WHERE network_type = p_network_type
          AND order_id     = p_order_id
        LIMIT 1
        FOR UPDATE;
    END IF;

    -- 2b. Secondary idempotency: same click, seen through the other door.
    IF v_existing.id IS NULL
       AND p_session_id IS NOT NULL AND p_session_id <> '' THEN

        IF coalesce(p_order_id_synthetic, false) THEN
            -- We have no real order id, so we cannot be a *different*
            -- order than one already recorded for this click.
            SELECT * INTO v_existing
            FROM public.cashback_transactions
            WHERE network_type = p_network_type
              AND session_id   = p_session_id
            ORDER BY created_at
            LIMIT 1
            FOR UPDATE;
        ELSE
            -- We have a real order id and nothing is filed under it. Claim
            -- a placeholder for this click, if one is waiting, and upgrade
            -- it to the real id.
            SELECT * INTO v_existing
            FROM public.cashback_transactions
            WHERE network_type       = p_network_type
              AND session_id         = p_session_id
              AND order_id_synthetic
            ORDER BY created_at
            LIMIT 1
            FOR UPDATE;

            IF v_existing.id IS NOT NULL THEN
                BEGIN
                    UPDATE public.cashback_transactions
                    SET order_id           = p_order_id,
                        order_id_synthetic = false
                    WHERE id = v_existing.id;
                EXCEPTION WHEN unique_violation THEN
                    -- A concurrent call filed the real order id first.
                    -- Leave the placeholder alone and work against the
                    -- winner instead.
                    SELECT * INTO v_existing
                    FROM public.cashback_transactions
                    WHERE network_type = p_network_type
                      AND order_id     = p_order_id
                    LIMIT 1
                    FOR UPDATE;
                END;
            END IF;
        END IF;
    END IF;

    IF v_existing.id IS NULL THEN
        BEGIN
            INSERT INTO public.cashback_transactions
                (user_id, store_id, amount, status, order_id, network_type,
                 order_amount, description, confirmed_at,
                 session_id, order_id_synthetic)
            VALUES
                (p_user_id, p_store_id, COALESCE(p_amount, 0), v_target_status,
                 p_order_id, p_network_type,
                 p_order_amount, p_description,
                 CASE WHEN v_target_status = 'confirmed' THEN now() ELSE NULL END,
                 NULLIF(p_session_id, ''), coalesce(p_order_id_synthetic, false))
            RETURNING id INTO v_new_id;

            RETURN QUERY SELECT v_new_id, v_target_status, 'inserted'::text;
            RETURN;
        EXCEPTION WHEN unique_violation THEN
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

    -- Backfill the correlation id onto rows written before this migration,
    -- so a later call can find them by click.
    IF v_existing.session_id IS NULL
       AND p_session_id IS NOT NULL AND p_session_id <> '' THEN
        UPDATE public.cashback_transactions
        SET    session_id = p_session_id
        WHERE  id = v_existing.id;
    END IF;

    -- Same status → no-op.
    IF v_existing.status = v_target_status THEN
        RETURN QUERY SELECT v_existing.id, v_existing.status, 'noop'::text;
        RETURN;
    END IF;

    -- Forward-only transitions. reversed is reachable from anywhere.
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

-- 3. The original 8-argument signature, preserved as a delegate so any
--    edge function still running the previous deploy keeps working.
--    Behaviour is exactly what it was: no click correlation.
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
    action          text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_temp'
AS $$
    SELECT * FROM public.apply_postback_state(
        p_user_id, p_store_id, p_amount, p_order_id, p_network_type,
        p_status, p_order_amount, p_description,
        NULL::text, false
    );
$$;

COMMENT ON FUNCTION public.apply_postback_state(
    uuid, uuid, numeric, text, text, text, numeric, text
) IS
    'Backwards-compatible delegate for callers that predate click '
    'correlation. Prefer the 10-argument form, which can recognise the '
    'same conversion arriving via both a live postback and reconciliation.';

GRANT EXECUTE ON FUNCTION public.apply_postback_state(
    uuid, uuid, numeric, text, text, text, numeric, text
) TO service_role;

GRANT EXECUTE ON FUNCTION public.apply_postback_state(
    uuid, uuid, numeric, text, text, text, numeric, text, text, boolean
) TO service_role;

COMMIT;
