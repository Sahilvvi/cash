import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useTrackAffiliateClick = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ storeId, affiliateUrl, networkType, apiConfig }: {
      storeId: string;
      affiliateUrl: string;
      networkType?: string;
      apiConfig?: Record<string, string>;
    }) => {
      let finalUrl = affiliateUrl;

      // Track the click if user is logged in
      if (user) {
        const sessionId = crypto.randomUUID();

        // Build URL based on network type
        const separator = finalUrl.includes('?') ? '&' : '?';

        if (networkType === 'amazon_direct') {
          // Amazon uses 'tag' parameter for tracking ID
          // We append our session ID as a custom parameter that we'll track
          const trackingId = apiConfig?.tracking_id || 'default-20';

          // For Amazon, we need to ensure the tag is set and add our custom tracking
          if (!finalUrl.includes('tag=')) {
            finalUrl = `${finalUrl}${separator}tag=${trackingId}`;
          }
          // Add our session tracking parameter
          finalUrl = `${finalUrl}&linkCode=ll1&linkId=${sessionId}`;

        } else if (networkType === 'flipkart_direct') {
          // Flipkart uses affid and affExtParam
          const affiliateId = apiConfig?.affiliate_id || '';
          finalUrl = `${finalUrl}${separator}affid=${affiliateId}&affExtParam1=${sessionId}`;

        } else if (networkType === 'offer18') {
          // Offer18: pass the session id in BOTH params.
          //  - s1: available as the {s1} macro in live postback URLs
          //  - aff_click_id: the field the affiliate reports API returns,
          //    which reconcile-conversions matches against. Without it,
          //    reconciliation can never link a conversion to this click.
          finalUrl = `${finalUrl}${separator}s1=${sessionId}&aff_click_id=${sessionId}`;

        } else {
          // Generic postback network - use configurable param name or default to 'subid'
          const paramName = apiConfig?.tracking_param || 'subid';
          finalUrl = `${finalUrl}${separator}${paramName}=${sessionId}`;
        }

        // Record the click so postbacks can be matched to this session.
        const { error } = await supabase
          .from("affiliate_clicks")
          .insert({
            user_id: user.id,
            store_id: storeId,
            session_id: sessionId,
            network_type: networkType || null,
          });

        if (error) {
          console.error("Failed to record affiliate click:", error.message);
          // Open the URL before throwing so the redirect always happens.
          window.open(finalUrl, '_blank', 'noopener,noreferrer');
          throw new Error(error.message);
        }
      }

      window.open(finalUrl, '_blank', 'noopener,noreferrer');
    },
  });
};

export const useAffiliateClicks = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["affiliate_clicks", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("affiliate_clicks")
        .select(`
          *,
          store:stores(name, logo_url)
        `)
        .eq("user_id", user.id)
        .order("clicked_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};
