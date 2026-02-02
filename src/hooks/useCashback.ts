import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export interface CashbackTransaction {
  id: string;
  user_id: string;
  store_id: string | null;
  amount: number;
  status: string;
  order_amount: number | null;
  order_id: string | null;
  description: string | null;
  confirmed_at: string | null;
  created_at: string;
  store?: {
    name: string;
    logo_url: string | null;
  };
}

export const useCashbackTransactions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('cashback-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cashback_transactions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["cashback_transactions", user.id] });
          queryClient.invalidateQueries({ queryKey: ["cashback_stats", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ["cashback_transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("cashback_transactions")
        .select(`
          *,
          store:stores(name, logo_url)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CashbackTransaction[];
    },
    enabled: !!user,
  });
};

export const useCashbackStats = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('cashback-stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cashback_transactions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["cashback_stats", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ["cashback_stats", user?.id],
    queryFn: async () => {
      if (!user) return { total: 0, pending: 0, confirmed: 0, available: 0 };

      const { data, error } = await supabase
        .from("cashback_transactions")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      const total = data.reduce((sum, t) => sum + Number(t.amount), 0);
      const pending = data
        .filter(t => t.status === "pending")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const confirmed = data
        .filter(t => t.status === "confirmed")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const available = confirmed; // Available for withdrawal

      return { total, pending, confirmed, available };
    },
    enabled: !!user,
  });
};
