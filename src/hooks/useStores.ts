import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface Store {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  cashback_percent: number;
  cashback_type: string;
  offers_count: number;
  category: string | null;
  affiliate_url: string | null;
  is_active: boolean;
  is_trending: boolean;
  is_new: boolean;
  // NEW: Network tracking fields
  network_type?: string;
  api_config?: {
    tracking_id?: string;
    affiliate_id?: string;
    affiliate_token?: string;
    tracking_param?: string;
    [key: string]: any;
  };
}

export const useStores = () => {
  const queryClient = useQueryClient();

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('stores-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stores'
        },
        () => {
          // Invalidate and refetch stores when any change happens
          queryClient.invalidateQueries({ queryKey: ["stores"] });
          queryClient.invalidateQueries({ queryKey: ["admin_stores"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")  // Includes network_type and api_config
        .eq("is_active", true)
        .order("is_trending", { ascending: false })
        .order("name");

      if (error) throw error;
      return data as Store[];
    },
  });
};

export const useStore = (slug: string) => {
  return useQuery({
    queryKey: ["store", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")  // Includes network_type and api_config
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data as Store | null;
    },
    enabled: !!slug,
  });
};
