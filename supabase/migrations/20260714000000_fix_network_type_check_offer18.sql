-- =====================================================================
-- Fix stores_network_type_check: allow 'offer18'
-- =====================================================================
--
-- The constraint added in 20260130063216_add_network_tracking_support.sql
-- did NOT include 'offer18', but the Offer18 sync (offer18-proxy
-- ?action=sync and the AdminOffer18 manual sync) upserts stores with
-- network_type = 'offer18'. On databases provisioned from the migration
-- chain, every synced row fails the CHECK and the sync silently loses
-- stores. supabase_complete_schema.sql already had the correct list —
-- this migration brings the migration chain in line with it.

ALTER TABLE public.stores
    DROP CONSTRAINT IF EXISTS stores_network_type_check;

ALTER TABLE public.stores
    ADD CONSTRAINT stores_network_type_check
    CHECK (network_type IN (
        'generic_postback',
        'offer18',
        'amazon_direct',
        'flipkart_direct',
        'commission_junction',
        'impact',
        'other'
    ));

COMMENT ON COLUMN public.stores.network_type IS
    'Type of affiliate network: generic_postback, offer18, amazon_direct, flipkart_direct, commission_junction, impact, other';
