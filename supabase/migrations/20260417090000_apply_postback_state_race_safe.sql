-- Make apply_postback_state safe under concurrent postbacks for the same
-- (network_type, order_id) pair.
--
-- The previous version (introduced in 20260417080000_cashback_state_machine.sql)
-- did SELECT-then-INSERT without a concurrency guard. Affiliate networks happily
-- fire the same postback twice in parallel — and our nightly reconciliation can
-- race with a live postback for the exact same conversion. With the old code
-- both transactions could see "no existing row", both attempt the INSERT, the
-- loser would hit unique_violation (23505) on uniq_cashback_network_order, and
-- the RPC would re-raise into a 400 response — making the network retry, often
-- creating a tight retry loop. In the reconciliation path the row was just
-- counted as an error and the user never got credited.
--
-- Fix: wrap the INSERT in a BEGIN ... EXCEPTION block that catches
-- unique_violation, re-reads the row that the concurrent transaction inserted,
-- and falls through into the same transition logic that a non-racing call
-- would have hit. The lookup uses FOR UPDATE so subsequent UPDATEs serialise
-- behind whichever transaction inserted first; this also closes the smaller
-- race where two transitions for the same row interleave.

BEGIN;

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

    v_target_status := COALESCE(NULLIF(p_status, ''), 'pending');
    IF v_target_status NOT IN ('pending', 'approved', 'confirmed', 'reversed') THEN
        RAISE EXCEPTION 'apply_postback_state: invalid status %', v_target_status;
    END IF;

    -- Idempotency lookup. The unique index covers (network_type, order_id)
    -- where order_id IS NOT NULL, so we only de-dupe when an order_id
    -- is supplied. Reconciliation always provides one; live postbacks
    -- almost always do. FOR UPDATE so concurrent transitions on the same
    -- row serialise rather than racing each other.
    IF p_order_id IS NOT NULL AND p_order_id <> '' THEN
        SELECT * INTO v_existing
        FROM public.cashback_transactions
        WHERE network_type = p_network_type
          AND order_id     = p_order_id
        LIMIT 1
        FOR UPDATE;
    END IF;

    IF v_existing.id IS NULL THEN
        -- Try to insert. If a concurrent postback for the same
        -- (network_type, order_id) inserted between our SELECT above and
        -- this INSERT, the unique index will fire 23505; catch it,
        -- re-read the row the winner inserted, and fall through into the
        -- same transition logic a serial caller would have used.
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

            -- Defensive: if we somehow still don't have it, surface the
            -- error rather than silently dropping the postback.
            IF v_existing.id IS NULL THEN
                RAISE EXCEPTION
                    'apply_postback_state: unique_violation but no row found for (%, %)',
                    p_network_type, p_order_id;
            END IF;
        END;
    END IF;

    -- Same status → no-op (this is the existing idempotent path).
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

COMMIT;
