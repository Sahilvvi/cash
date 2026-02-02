import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface Sponsor {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useSponsors = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('sponsors-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sponsors' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['sponsors'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['sponsors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as Sponsor[];
    },
  });
};

export const useSponsorMutations = () => {
  const queryClient = useQueryClient();

  const createSponsor = useMutation({
    mutationFn: async (sponsor: Omit<Sponsor, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('sponsors')
        .insert(sponsor)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsors'] });
    },
  });

  const updateSponsor = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Sponsor> & { id: string }) => {
      const { data, error } = await supabase
        .from('sponsors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsors'] });
    },
  });

  const deleteSponsor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sponsors')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsors'] });
    },
  });

  return { createSponsor, updateSponsor, deleteSponsor };
};
