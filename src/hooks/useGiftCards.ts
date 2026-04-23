import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export interface GiftCard {
  id: string;
  name: string;
  brand: string;
  description: string | null;
  image_url: string | null;
  denominations: number[];
  discount_percent: number;
  category: string | null;
  is_active: boolean;
}

export interface UserGiftCard {
  id: string;
  user_id: string;
  gift_card_id: string;
  amount: number;
  code: string;
  pin: string | null;
  status: string;
  purchased_at: string;
  expires_at: string | null;
  gift_card?: GiftCard;
}

export const useGiftCards = () => {
  const queryClient = useQueryClient();

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('gift-cards-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gift_cards'
        },
        () => {
          // Invalidate and refetch gift cards when any change happens
          queryClient.invalidateQueries({ queryKey: ["gift_cards"] });
          queryClient.invalidateQueries({ queryKey: ["admin_gift_cards"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["gift_cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gift_cards")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as GiftCard[];
    },
  });
};

export const useUserGiftCards = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user_gift_cards", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_gift_cards")
        .select(`
          *,
          gift_card:gift_cards(*)
        `)
        .eq("user_id", user.id)
        .order("purchased_at", { ascending: false });

      if (error) throw error;
      return data as UserGiftCard[];
    },
    enabled: !!user,
  });
};

export const usePurchaseGiftCard = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ giftCardId, amount }: { giftCardId: string; amount: number }) => {
      if (!user) throw new Error("Not authenticated");

      // Server-side: validates balance, debits cashback, issues code+pin
      // atomically. Client never writes to user_gift_cards directly.
      // Cast avoids a stale-types issue until supabase types are regenerated.
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>
      ) => Promise<{ data: unknown; error: { message: string } | null }>)(
        "purchase_gift_card",
        { p_gift_card_id: giftCardId, p_amount: amount }
      );

      if (error) throw new Error(error.message);
      return data as UserGiftCard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_gift_cards"] });
      queryClient.invalidateQueries({ queryKey: ["cashback_transactions"] });
      queryClient.invalidateQueries({ queryKey: ["cashback_stats"] });
    },
  });
};
