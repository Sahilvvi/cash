-- =====================================================================
-- Withdrawals hardening
-- =====================================================================
--
-- Problem: `withdrawals` currently lets a logged-in user INSERT any row
-- with any amount (RLS policy "Users can create withdrawals" just checks
-- auth.uid() = user_id, no balance check). A user could request a
-- ₹100,000 withdrawal with ₹0 confirmed cashback, and an admin who
-- approves without double-checking is out that money.
--
-- Fix: mirror the gift-card / spin pattern. Users can no longer INSERT
-- into withdrawals directly; they go through a SECURITY DEFINER RPC
-- that validates amount / method / details and the available balance
-- atomically (using the same get_available_cashback() helper as the
-- gift-card purchase path).

-- 1. Drop the permissive user-INSERT policy. Admin-INSERT stays via the
--    existing "Admins can manage withdrawals" FOR ALL policy.
DROP POLICY IF EXISTS "Users can create withdrawals" ON public.withdrawals;

-- 2. RPC: create_withdrawal
CREATE OR REPLACE FUNCTION public.create_withdrawal(
    p_amount numeric,
    p_payment_method text,
    p_payment_details jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_available numeric;
    v_min_amount constant numeric := 100;
    v_row public.withdrawals%ROWTYPE;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
    END IF;

    -- Serialize per-user to block racing concurrent withdraws from
    -- spending the same balance twice.
    PERFORM pg_advisory_xact_lock(hashtext('withdraw:' || v_user_id::text));

    IF p_amount IS NULL OR p_amount < v_min_amount THEN
        RAISE EXCEPTION 'Minimum withdrawal amount is %', v_min_amount
            USING ERRCODE = '22023';
    END IF;

    IF p_payment_method NOT IN ('upi', 'bank', 'paytm') THEN
        RAISE EXCEPTION 'Unsupported payment_method: %', p_payment_method
            USING ERRCODE = '22023';
    END IF;

    -- Per-method required field validation.
    IF p_payment_method = 'upi' THEN
        IF COALESCE(p_payment_details->>'upi_id', '') = '' THEN
            RAISE EXCEPTION 'upi_id is required for UPI withdrawals'
                USING ERRCODE = '22023';
        END IF;
    ELSIF p_payment_method = 'bank' THEN
        IF COALESCE(p_payment_details->>'account_number', '') = ''
           OR COALESCE(p_payment_details->>'ifsc_code', '') = ''
           OR COALESCE(p_payment_details->>'account_holder_name', '') = '' THEN
            RAISE EXCEPTION 'account_number, ifsc_code, account_holder_name are required for bank withdrawals'
                USING ERRCODE = '22023';
        END IF;
    ELSIF p_payment_method = 'paytm' THEN
        IF COALESCE(p_payment_details->>'paytm_number', '') = '' THEN
            RAISE EXCEPTION 'paytm_number is required for paytm withdrawals'
                USING ERRCODE = '22023';
        END IF;
    END IF;

    v_available := public.get_available_cashback(v_user_id);

    IF v_available < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance (available: %, requested: %)',
            v_available, p_amount
            USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.withdrawals (
        user_id, amount, status, payment_method, payment_details
    )
    VALUES (
        v_user_id, p_amount, 'pending', p_payment_method, p_payment_details
    )
    RETURNING * INTO v_row;

    RETURN to_jsonb(v_row);
END;
$$;

REVOKE ALL ON FUNCTION public.create_withdrawal(numeric, text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.create_withdrawal(numeric, text, jsonb) TO authenticated;
