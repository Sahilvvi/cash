-- Add network type and API configuration to stores table
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS network_type text DEFAULT 'generic_postback' NOT NULL,
ADD COLUMN IF NOT EXISTS api_config jsonb DEFAULT '{}'::jsonb;

-- Add constraint for network_type
ALTER TABLE public.stores 
ADD CONSTRAINT stores_network_type_check 
CHECK (network_type IN ('generic_postback', 'amazon_direct', 'flipkart_direct', 'commission_junction', 'impact', 'other'));

-- Add index on session_id for faster lookups during API polling
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_session_id 
ON public.affiliate_clicks(session_id);

-- Add comment to document the columns
COMMENT ON COLUMN public.stores.network_type IS 'Type of affiliate network integration: generic_postback (default), amazon_direct, flipkart_direct, etc.';
COMMENT ON COLUMN public.stores.api_config IS 'JSON configuration for API integration including tag names, param names, API credentials references, etc.';
