import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  mobile_image_url?: string;
  link?: string;
  display_order: number;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  display_order: number;
  is_active: boolean;
}

// Site settings are stored as key-value pairs in the DB
export type SiteSettings = Record<string, string>;

export const useHomepageData = () => {
  return useQuery({
    queryKey: ["homepage_data"],
    queryFn: async () => {
      const [bannersRes, settingsRes, categoriesRes] = await Promise.all([
        supabase.from("banners").select("*").eq("is_active", true).order("display_order"),
        supabase.from("site_settings").select("key, value"),
        supabase.from("categories").select("*").eq("is_active", true).order("display_order")
      ]);

      const settings: SiteSettings = {};
      (settingsRes.data || []).forEach(s => {
        if (s.key) settings[s.key] = s.value || "";
      });

      return {
        banners: (bannersRes.data || []) as Banner[],
        settings,
        categories: (categoriesRes.data || []) as Category[]
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useBanners = () => {
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
    staleTime: 5 * 60 * 1000,
  });
};

export const useSiteSettings = () => {
  return useQuery({
    queryKey: ["site_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value");

      if (error) throw error;
      
      const settings: SiteSettings = {};
      (data || []).forEach(s => {
        if (s.key) settings[s.key] = s.value || "";
      });
      return settings;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCategories = () => {
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
    staleTime: 5 * 60 * 1000,
  });
};
