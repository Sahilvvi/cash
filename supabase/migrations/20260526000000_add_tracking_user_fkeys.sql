-- Add foreign key constraints from affiliate_clicks and cashback_transactions
-- to profiles, enabling PostgREST joins in admin tracking queries.

-- affiliate_clicks.user_id -> profiles.user_id
-- (profiles.user_id has a UNIQUE constraint via profiles_user_id_key)
ALTER TABLE public.affiliate_clicks
  ADD CONSTRAINT affiliate_clicks_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- cashback_transactions.user_id -> profiles.user_id
ALTER TABLE public.cashback_transactions
  ADD CONSTRAINT cashback_transactions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
