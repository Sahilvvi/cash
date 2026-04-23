-- =====================================================================
-- Withdrawals: align RPC naming with the existing UI
-- =====================================================================
--
-- PR #9 introduced `create_withdrawal` with strict names:
--   * payment_method ∈ {upi, bank, paytm}
--   * payment_details uses snake_case keys (upi_id, account_number, etc.)
--
-- But the existing frontend (WithdrawalDialog.tsx) has always sent:
--   * payment_method = "bank_transfer" (NOT "bank")
--   * payment_details with camelCase keys: upiId, accountNumber,
--     ifscCode, accountName, paytmNumber
--
-- Devin Review caught this: the UI cannot submit any withdrawal against
-- the RPC because every request is rejected with "Unsupported
-- payment_method: bank_transfer" or "<field> is required".
--
-- Fix: CREATE OR REPLACE the function to accept both conventions. This
-- keeps the strict-name tests in the verify script happy (they submit
-- snake_case) and also lets the untouched UI submit camelCase.

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

    -- Accept both `bank` and `bank_transfer`; the existing UI submits
    -- `bank_transfer`, but keep `bank` for scripts/tests.
    IF p_payment_method NOT IN ('upi', 'bank', 'bank_transfer', 'paytm') THEN
        RAISE EXCEPTION 'Unsupported payment_method: %', p_payment_method
            USING ERRCODE = '22023';
    END IF;

    -- Per-method required field validation. Each COALESCE falls back
    -- through every accepted key variant (camelCase first because
    -- that's what the production UI sends).
    IF p_payment_method = 'upi' THEN
        IF COALESCE(
            p_payment_details->>'upiId',
            p_payment_details->>'upi_id',
            ''
           ) = '' THEN
            RAISE EXCEPTION 'upi_id is required for UPI withdrawals'
                USING ERRCODE = '22023';
        END IF;
    ELSIF p_payment_method IN ('bank', 'bank_transfer') THEN
        IF COALESCE(
                p_payment_details->>'accountNumber',
                p_payment_details->>'account_number',
                ''
           ) = ''
           OR COALESCE(
                p_payment_details->>'ifscCode',
                p_payment_details->>'ifsc_code',
                ''
           ) = ''
           OR COALESCE(
                p_payment_details->>'accountName',
                p_payment_details->>'account_holder_name',
                p_payment_details->>'account_name',
                ''
           ) = '' THEN
            RAISE EXCEPTION 'account_number, ifsc_code, account_holder_name are required for bank withdrawals'
                USING ERRCODE = '22023';
        END IF;
    ELSIF p_payment_method = 'paytm' THEN
        IF COALESCE(
            p_payment_details->>'paytmNumber',
            p_payment_details->>'paytm_number',
            ''
           ) = '' THEN
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
