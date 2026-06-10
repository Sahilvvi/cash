import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  network_type?: string;
  api_config?: Record<string, string>;
}

export const useStores = () => {
  return useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("is_active", true)
        .order("is_trending", { ascending: false })
        .order("name");

      if (error) throw error;
      return data as Store[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useStore = (slug: string) => {
  return useQuery({
    queryKey: ["store", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data as Store | null;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
};
