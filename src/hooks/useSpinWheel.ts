import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export interface SpinReward {
  id: string;
  name: string;
  reward_type: string;
  reward_value: number;
  probability: number;
  color: string;
  is_active: boolean;
}

export interface UserSpin {
  id: string;
  user_id: string;
  reward_id: string | null;
  reward_value: number | null;
  spun_at: string;
  reward?: SpinReward;
}

export const useSpinRewards = () => {
  const queryClient = useQueryClient();

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('spin-rewards-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'spin_rewards'
        },
        () => {
          // Invalidate and refetch spin rewards when any change happens
          queryClient.invalidateQueries({ queryKey: ["spin_rewards"] });
          queryClient.invalidateQueries({ queryKey: ["admin_spin_rewards"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["spin_rewards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spin_rewards")
        .select("*")
        .eq("is_active", true)
        .order("probability", { ascending: false });

      if (error) throw error;
      return data as SpinReward[];
    },
  });
};

export const useUserSpins = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user_spins", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_spins")
        .select(`
          *,
          reward:spin_rewards(*)
        `)
        .eq("user_id", user.id)
        .order("spun_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as UserSpin[];
    },
    enabled: !!user,
  });
};

export const useCanSpin = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["can_spin", user?.id],
    queryFn: async () => {
      if (!user) return false;

      // Check if user has spun in the last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("user_spins")
        .select("id")
        .eq("user_id", user.id)
        .gte("spun_at", twentyFourHoursAgo)
        .limit(1);

      if (error) throw error;
      return data.length === 0;
    },
    enabled: !!user,
  });
};

export const useSpin = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (rewards: SpinReward[]) => {
      if (!user) throw new Error("Not authenticated");

      // Calculate weighted random selection
      const totalProbability = rewards.reduce((sum, r) => sum + r.probability, 0);
      let random = Math.random() * totalProbability;
      
      let selectedReward: SpinReward | null = null;
      for (const reward of rewards) {
        random -= reward.probability;
        if (random <= 0) {
          selectedReward = reward;
          break;
        }
      }

      if (!selectedReward) {
        selectedReward = rewards[rewards.length - 1];
      }

      const { data, error } = await supabase
        .from("user_spins")
        .insert({
          user_id: user.id,
          reward_id: selectedReward.id,
          reward_value: selectedReward.reward_value,
        })
        .select(`
          *,
          reward:spin_rewards(*)
        `)
        .single();

      if (error) throw error;
      return data as UserSpin;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_spins"] });
      queryClient.invalidateQueries({ queryKey: ["can_spin"] });
    },
  });
};
