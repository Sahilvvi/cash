import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  id: string;
  type: 'store' | 'deal';
  title: string;
  subtitle: string;
  image?: string;
  link: string;
  cashback?: string;
}

export const useGlobalSearch = (query: string) => {
  return useQuery({
    queryKey: ["search", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const searchTerm = `%${query}%`;
      const results: SearchResult[] = [];

      // Search stores
      const { data: stores } = await supabase
        .from("stores")
        .select("id, name, slug, logo_url, cashback_percent, category")
        .eq("is_active", true)
        .or(`name.ilike.${searchTerm},category.ilike.${searchTerm}`)
        .limit(5);

      if (stores) {
        stores.forEach(store => {
          results.push({
            id: store.id,
            type: 'store',
            title: store.name,
            subtitle: store.category || 'Store',
            image: store.logo_url || undefined,
            link: `/stores/${store.slug}`,
            cashback: store.cashback_percent ? `${store.cashback_percent}% Cashback` : undefined,
          });
        });
      }

      // Search deals
      const { data: deals } = await supabase
        .from("deals")
        .select(`
          id, 
          title, 
          coupon_code,
          cashback_percent,
          store:stores(name, slug, logo_url)
        `)
        .eq("is_active", true)
        .ilike("title", searchTerm)
        .limit(5);

      if (deals) {
        deals.forEach(deal => {
          results.push({
            id: deal.id,
            type: 'deal',
            title: deal.title,
            subtitle: deal.store?.name || 'Deal',
            image: deal.store?.logo_url || undefined,
            link: `/stores/${deal.store?.slug}`,
            cashback: deal.cashback_percent ? `${deal.cashback_percent}% Cashback` : deal.coupon_code || undefined,
          });
        });
      }

      return results;
    },
    enabled: query.length >= 2,
    staleTime: 30000,
  });
};
