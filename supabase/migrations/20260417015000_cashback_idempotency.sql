-- Prevent double-credit on repeated postbacks.
--
-- Affiliate networks (Offer18 included) occasionally retry postbacks on
-- network failures. Without a uniqueness constraint the `track-conversion`
-- edge function would happily insert a second `cashback_transactions` row
-- for the same conversion, double-crediting the user.
--
-- We key the constraint on `(network_type, order_id)` so the same order_id
-- from two different networks stays allowed (networks do not share an
-- order_id namespace). order_id can be NULL for test/manual rows so we use
-- a partial unique index.

-- Make sure the columns the unique index (and the edge function) depend on
-- actually exist. In the live `cikmdkkngifzpulrwkwt` project these columns
-- were added by a side-loaded `supabase_complete_schema.sql` run, but they
-- are not in the migration chain, so a fresh `supabase db push` on a new
-- project wouldn't have them. Guarded with IF NOT EXISTS so this stays a
-- no-op everywhere they already exist.
ALTER TABLE public.cashback_transactions
    ADD COLUMN IF NOT EXISTS network_type text DEFAULT 'generic_postback';

ALTER TABLE public.affiliate_clicks
    ADD COLUMN IF NOT EXISTS network_type text,
    ADD COLUMN IF NOT EXISTS offer18_click_id text,
    ADD COLUMN IF NOT EXISTS conversion_status text;

-- Drop the non-unique index that existed before — the new unique index
-- supersedes it for lookups as well.
DROP INDEX IF EXISTS idx_cashback_transactions_order_id;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_cashback_network_order
    ON public.cashback_transactions (network_type, order_id)
    WHERE order_id IS NOT NULL;

COMMENT ON INDEX public.uniq_cashback_network_order IS
    'Blocks double-credit when an affiliate network retries a postback. '
    'Combined with network_type so the same order_id across different '
    'networks stays allowed.';
