import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export interface UserSpin {
  id: string;
  user_id: string;
  reward_id: string | null;
  reward_value: number | null;
  spun_at: string;
  reward?: {
    name: string;
    reward_type: string;
    color: string | null;
  };
}

export const useUserSpins = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-spins-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_spins',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["user_spins", user.id] });
          queryClient.invalidateQueries({ queryKey: ["spin_stats", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ["user_spins", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_spins")
        .select(`
          *,
          reward:spin_rewards(name, reward_type, color)
        `)
        .eq("user_id", user.id)
        .order("spun_at", { ascending: false });

      if (error) throw error;
      return data as UserSpin[];
    },
    enabled: !!user,
  });
};

export const useSpinStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["spin_stats", user?.id],
    queryFn: async () => {
      if (!user) return { totalSpins: 0, totalWinnings: 0 };

      const { data, error } = await supabase
        .from("user_spins")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      const totalSpins = data.length;
      const totalWinnings = data.reduce((sum, s) => sum + Number(s.reward_value || 0), 0);

      return { totalSpins, totalWinnings };
    },
    enabled: !!user,
  });
};
