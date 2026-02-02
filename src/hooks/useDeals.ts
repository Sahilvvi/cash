import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface Deal {
  id: string;
  store_id: string;
  title: string;
  description: string | null;
  coupon_code: string | null;
  cashback_percent: number | null;
  discount_text: string | null;
  expires_at: string | null;
  is_exclusive: boolean;
  is_verified: boolean;
  is_active: boolean;
  store?: {
    name: string;
    logo_url: string | null;
    slug: string;
  };
}

export const useDeals = () => {
  const queryClient = useQueryClient();

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('deals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deals'
        },
        () => {
          // Invalidate and refetch deals when any change happens
          queryClient.invalidateQueries({ queryKey: ["deals"] });
          queryClient.invalidateQueries({ queryKey: ["admin_deals"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select(`
          *,
          store:stores(name, logo_url, slug)
        `)
        .eq("is_active", true)
        .order("is_exclusive", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Deal[];
    },
  });
};

export const useDealsByStore = (storeId: string) => {
  return useQuery({
    queryKey: ["deals", "store", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select(`
          *,
          store:stores(name, logo_url, slug)
        `)
        .eq("store_id", storeId)
        .eq("is_active", true)
        .order("is_exclusive", { ascending: false });

      if (error) throw error;
      return data as Deal[];
    },
    enabled: !!storeId,
  });
};
