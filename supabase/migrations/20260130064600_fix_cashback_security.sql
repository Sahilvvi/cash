-- Fix 1: Add missing order_amount column to cashback_transactions
ALTER TABLE public.cashback_transactions 
ADD COLUMN IF NOT EXISTS order_amount numeric(10,2);

COMMENT ON COLUMN public.cashback_transactions.order_amount 
IS 'Total order value (before cashback)';

-- Fix 2: Remove dangerous RLS policy that allows users to create fake cashback
DROP POLICY IF EXISTS "Users can create their own cashback transactions" ON public.cashback_transactions;

-- Fix 3: Add proper policies for cashback creation
CREATE POLICY "Admins can create cashback transactions"
ON public.cashback_transactions
FOR INSERT
USING (public.is_admin(auth.uid()))
WITH CHECK (true);

-- Note: Service role bypasses RLS, so it can always insert
-- This is used by the track-conversion and fetch-conversions functions

-- Fix 4: Add index for faster order_id lookups (prevent duplicate conversions)
CREATE INDEX  IF NOT EXISTS idx_cashback_transactions_order_id 
ON public.cashback_transactions(order_id) 
WHERE order_id IS NOT NULL;
