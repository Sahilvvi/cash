import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
    staleTime: 5 * 60 * 1000,
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
    staleTime: 5 * 60 * 1000,
  });
};
