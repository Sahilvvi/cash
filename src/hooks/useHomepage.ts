import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  mobile_image_url: string | null;
  link: string | null;
  display_order: number;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  display_order: number;
  is_active: boolean;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
}

export const useBanners = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('banners-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, () => {
        queryClient.invalidateQueries({ queryKey: ["banners"] });
        queryClient.invalidateQueries({ queryKey: ["admin_banners"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      return data as Banner[];
    },
  });
};

export const useCategories = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('categories-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        queryClient.invalidateQueries({ queryKey: ["admin_categories"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      return data as Category[];
    },
  });
};

export const useSiteSettings = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('site-settings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, () => {
        queryClient.invalidateQueries({ queryKey: ["site_settings"] });
        queryClient.invalidateQueries({ queryKey: ["admin_site_settings"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["site_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*");

      if (error) throw error;
      
      // Convert to a key-value map for easy access
      const settings: Record<string, string> = {};
      (data as SiteSetting[]).forEach((s) => {
        if (s.key && s.value) {
          settings[s.key] = s.value;
        }
      });
      return settings;
    },
  });
};
