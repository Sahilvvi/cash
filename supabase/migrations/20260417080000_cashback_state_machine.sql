-- Cashback state machine + reconciliation support
--
-- Goal: real affiliate networks send a *sequence* of postbacks for the
-- same order — typically `pending` first, then `approved` after the
-- network's validation period, then `confirmed` once the merchant pays
-- out (or `reversed` on a refund/chargeback). Before this migration
-- track-conversion was idempotent on `(network_type, order_id)` and
-- silently dropped every postback after the first, so a user's cashback
-- could never move from pending → confirmed (or be reversed) without an
-- admin doing it by hand.
--
-- This migration:
--   1. Tightens `cashback_transactions` so future-looking code can rely
--      on `status` being one of {pending, approved, confirmed, reversed}
--      and `network_type` being non-null.
--   2. Backfills any pre-existing rows with non-conforming statuses /
--      null network_types so the new constraints can be added safely.
--   3. Adds an `apply_postback_state` RPC that performs an upsert with
--      forward-only state transitions, sets `confirmed_at` on the
--      transition into confirmed, and reports whether the call was an
--      insert / status change / no-op. Both `track-conversion` (live
--      postbacks) and the upcoming `reconcile-conversions` job route
--      through this single function.

BEGIN;

-- 1. Make network_type NOT NULL so the unique index on
--    (network_type, order_id) actually de-duplicates every row. Btree
--    treats NULLs as distinct, so without this two postbacks with
--    `network_type IS NULL` and the same order_id would both insert.
UPDATE public.cashback_transactions
SET network_type = 'generic_postback'
WHERE network_type IS NULL;

ALTER TABLE public.cashback_transactions
    ALTER COLUMN network_type SET NOT NULL;

-- 2. Constrain `status` to the four documented states. Backfill any
--    legacy values (defensive — production currently has zero rows).
UPDATE public.cashback_transactions
SET status = 'pending'
WHERE status NOT IN ('pending', 'approved', 'confirmed', 'reversed');

ALTER TABLE public.cashback_transactions
    DROP CONSTRAINT IF EXISTS cashback_transactions_status_check;

ALTER TABLE public.cashback_transactions
    ADD CONSTRAINT cashback_transactions_status_check
    CHECK (status IN ('pending', 'approved', 'confirmed', 'reversed'));

-- 3. Helper: rank statuses so we can reject backward transitions.
--    pending(0) → approved(1) → confirmed(2). reversed(3) is terminal
--    and reachable from any other state. We do NOT allow stepping
--    backwards (e.g. confirmed → pending) without explicit admin action.
CREATE OR REPLACE FUNCTION public.cashback_status_rank(p_status text)
RETURNS int
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE p_status
        WHEN 'pending'   THEN 0
        WHEN 'approved'  THEN 1
        WHEN 'confirmed' THEN 2
        WHEN 'reversed'  THEN 3
        ELSE -1
    END;
$$;

-- 4. The single entrypoint that mutates a postback row. Both
--    track-conversion and the reconciliation job call this. It owns the
--    forward-only transition rule, the confirmed_at stamp, and idempotency.
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
    v_action        text;
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
    -- almost always do.
    IF p_order_id IS NOT NULL AND p_order_id <> '' THEN
        SELECT * INTO v_existing
        FROM public.cashback_transactions
        WHERE network_type = p_network_type
          AND order_id     = p_order_id
        LIMIT 1;
    END IF;

    IF v_existing.id IS NULL THEN
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

-- 5. Enable the extensions used by the reconciliation cron. The actual
--    schedule is created out-of-band via Supabase Studio (or the SQL
--    snippet documented below) so that the URL/service-role secrets
--    don't have to be hard-coded into a migration that has to be safe
--    to run on a fresh project.
--
--    To wire up nightly reconciliation once per project:
--
--      SELECT cron.schedule(
--          'reconcile-conversions-daily',
--          '0 3 * * *',
--          $$
--          SELECT net.http_post(
--              url := 'https://<your-project>.supabase.co/functions/v1/reconcile-conversions',
--              headers := jsonb_build_object(
--                  'Content-Type',  'application/json',
--                  'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
--              ),
--              body := '{}'::jsonb
--          );
--          $$
--      );
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net  WITH SCHEMA extensions;

COMMIT;
