import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referrer_reward: number;
  referred_reward: number;
  status: string;
  completed_at: string | null;
  created_at: string;
  referred_profile?: {
    full_name: string | null;
    email: string | null;
  };
}

export const useReferrals = () => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ["referrals", profile?.id],
    queryFn: async () => {
      if (!profile) return [];

      const { data, error } = await supabase
        .from("referrals")
        .select(`
          *,
          referred_profile:profiles!referrals_referred_id_fkey(full_name, email)
        `)
        .eq("referrer_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Referral[];
    },
    enabled: !!profile,
  });
};

export const useReferralStats = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["referral_stats", profile?.id],
    queryFn: async () => {
      if (!profile) return { total: 0, completed: 0, pending: 0, earnings: 0 };

      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", profile.id);

      if (error) throw error;

      const total = data.length;
      const completed = data.filter(r => r.status === "completed").length;
      const pending = data.filter(r => r.status === "pending").length;
      const earnings = data
        .filter(r => r.status === "completed")
        .reduce((sum, r) => sum + Number(r.referrer_reward), 0);

      return { total, completed, pending, earnings };
    },
    enabled: !!profile,
  });
};
