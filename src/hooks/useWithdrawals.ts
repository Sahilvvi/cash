import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_method: string;
  payment_details: Json | null;
  requested_at: string;
  processed_at: string | null;
  admin_notes: string | null;
  created_at: string;
}

export const useWithdrawals = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Set up realtime subscription for withdrawals
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('withdrawals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawals',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["withdrawals", user.id] });
          queryClient.invalidateQueries({ queryKey: ["withdrawal_stats", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ["withdrawals", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", user.id)
        .order("requested_at", { ascending: false });

      if (error) throw error;
      return data as Withdrawal[];
    },
    enabled: !!user,
  });
};

export const useRequestWithdrawal = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      amount,
      paymentMethod,
      paymentDetails,
    }: {
      amount: number;
      paymentMethod: string;
      paymentDetails: Json;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Server-side: validates amount >= 100, payment method/details,
      // available balance, and inserts the withdrawal atomically.
      // Client never writes to `withdrawals` directly (RLS blocks it).
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>
      ) => Promise<{ data: unknown; error: { message: string } | null }>)(
        "create_withdrawal",
        {
          p_amount: amount,
          p_payment_method: paymentMethod,
          p_payment_details: paymentDetails,
        }
      );

      if (error) throw new Error(error.message);
      return data as Withdrawal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["withdrawal_stats"] });
      queryClient.invalidateQueries({ queryKey: ["cashback_stats"] });
    },
  });
};

export const useWithdrawalStats = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Set up realtime subscription for withdrawal stats
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('withdrawal-stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawals',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["withdrawal_stats", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ["withdrawal_stats", user?.id],
    queryFn: async () => {
      if (!user) return { total: 0, pending: 0, completed: 0 };

      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      const total = data.reduce((sum, w) => sum + Number(w.amount), 0);
      const pending = data
        .filter(w => w.status === "pending" || w.status === "approved")
        .reduce((sum, w) => sum + Number(w.amount), 0);
      const completed = data
        .filter(w => w.status === "completed")
        .reduce((sum, w) => sum + Number(w.amount), 0);

      return { total, pending, completed };
    },
    enabled: !!user,
  });
};
