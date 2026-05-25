import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Store,
  Tag,
  Users,
  Gift,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  RotateCw,
  Image,
  Grid,
  Settings,
  Share2,
  BarChart3,
  TrendingUp,
  Calendar,
  UserCheck,
  UserX,
  Clock,
  Wallet,
  FolderTree,
  Eye,
  Handshake,
  Network,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AdminWithdrawals from "@/components/admin/AdminWithdrawals";
import AdminTracking from "@/components/admin/AdminTracking";
import { AdminOffer18 } from "@/components/admin/AdminOffer18";
import AdminDashboardWidgets from "@/components/admin/AdminDashboardWidgets";
import ImageUpload from "@/components/admin/ImageUpload";
import CategoryDetailView from "@/components/admin/CategoryDetailView";

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, isAdminChecking, signOut } = useAuth();
  const queryClient = useQueryClient();

  const [activeSection, setActiveSection] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [showGiftCardModal, setShowGiftCardModal] = useState(false);
  const [showSpinRewardModal, setShowSpinRewardModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSponsorModal, setShowSponsorModal] = useState(false);

  // Editing states
  const [editingStore, setEditingStore] = useState<any>(null);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  const [editingGiftCard, setEditingGiftCard] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingSpinReward, setEditingSpinReward] = useState<any>(null);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<any>(null);
  const [viewingCategory, setViewingCategory] = useState<any>(null);
  const [editingSponsor, setEditingSponsor] = useState<any>(null);

  // Forms
  const [storeForm, setStoreForm] = useState({
    name: "", slug: "", logo_url: "", description: "", cashback_percent: "",
    cashback_type: "percent", category: "", category_id: "", subcategory_id: "", affiliate_url: "",
    is_active: true, is_trending: false, is_new: false,
  });

  const [dealForm, setDealForm] = useState({
    store_id: "", title: "", description: "", coupon_code: "",
    cashback_percent: "", discount_text: "", category_id: "", subcategory_id: "",
    is_exclusive: false, is_verified: false, is_active: true,
  });

  const [giftCardForm, setGiftCardForm] = useState({
    name: "", brand: "", description: "", image_url: "",
    category: "", category_id: "", subcategory_id: "", discount_percent: "", denominations: "", is_active: true,
  });

  const [spinRewardForm, setSpinRewardForm] = useState({
    name: "", reward_type: "cashback", reward_value: "",
    probability: "", color: "#F37022", is_active: true,
  });

  const [bannerForm, setBannerForm] = useState({
    title: "", image_url: "", mobile_image_url: "", link: "",
    display_order: "", is_active: true,
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "", slug: "", icon: "tag", color: "bg-primary/10 text-primary",
    display_order: "", is_active: true,
  });

  const [subcategoryForm, setSubcategoryForm] = useState({
    name: "", slug: "", category_id: "", icon: "tag",
    display_order: "", is_active: true,
  });

  const [sponsorForm, setSponsorForm] = useState({
    name: "", logo_url: "", website_url: "", display_order: "", is_active: true,
  });

  const [userForm, setUserForm] = useState({
    full_name: "", email: "", phone: "",
  });

  // Real-time subscriptions
  useEffect(() => {
    const channels = [
      supabase.channel('admin-stores').on('postgres_changes', { event: '*', schema: 'public', table: 'stores' }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin_stores"] });
        queryClient.invalidateQueries({ queryKey: ["admin_stats"] });
      }).subscribe(),
      supabase.channel('admin-deals').on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin_deals"] });
        queryClient.invalidateQueries({ queryKey: ["admin_stats"] });
      }).subscribe(),
      supabase.channel('admin-gift-cards').on('postgres_changes', { event: '*', schema: 'public', table: 'gift_cards' }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin_gift_cards"] });
        queryClient.invalidateQueries({ queryKey: ["admin_stats"] });
      }).subscribe(),
      supabase.channel('admin-spin-rewards').on('postgres_changes', { event: '*', schema: 'public', table: 'spin_rewards' }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin_spin_rewards"] });
      }).subscribe(),
      supabase.channel('admin-users').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin_users"] });
        queryClient.invalidateQueries({ queryKey: ["admin_stats"] });
      }).subscribe(),
      supabase.channel('admin-banners').on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin_banners"] });
      }).subscribe(),
      supabase.channel('admin-categories').on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin_categories"] });
      }).subscribe(),
      supabase.channel('admin-settings').on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin_site_settings"] });
      }).subscribe(),
      supabase.channel('admin-referrals').on('postgres_changes', { event: '*', schema: 'public', table: 'referrals' }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin_referrals"] });
        queryClient.invalidateQueries({ queryKey: ["admin_analytics"] });
      }).subscribe(),
      supabase.channel('admin-user-spins').on('postgres_changes', { event: '*', schema: 'public', table: 'user_spins' }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin_analytics"] });
      }).subscribe(),
      supabase.channel('admin-sponsors').on('postgres_changes', { event: '*', schema: 'public', table: 'sponsors' }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin_sponsors"] });
      }).subscribe(),
    ];

    return () => channels.forEach(c => supabase.removeChannel(c));
  }, [queryClient]);

  // Queries
  const { data: stores = [] } = useQuery({
    queryKey: ["admin_stores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("stores").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: deals = [] } = useQuery({
    queryKey: ["admin_deals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("deals").select("*, store:stores(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: giftCards = [] } = useQuery({
    queryKey: ["admin_gift_cards"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gift_cards").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: spinRewards = [] } = useQuery({
    queryKey: ["admin_spin_rewards"],
    queryFn: async () => {
      const { data, error } = await supabase.from("spin_rewards").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["admin_users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: banners = [] } = useQuery({
    queryKey: ["admin_banners"],
    queryFn: async () => {
      const { data, error } = await supabase.from("banners").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin_categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: ["admin_subcategories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subcategories").select("*, category:categories(name)").order("display_order");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: siteSettings = [] } = useQuery({
    queryKey: ["admin_site_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: sponsors = [] } = useQuery({
    queryKey: ["admin_sponsors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sponsors").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: stats } = useQuery({
    queryKey: ["admin_stats"],
    queryFn: async () => {
      const [storesRes, dealsRes, usersRes, giftCardsRes, referralsRes, spinsRes] = await Promise.all([
        supabase.from("stores").select("id", { count: "exact", head: true }),
        supabase.from("deals").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("gift_cards").select("id", { count: "exact", head: true }),
        supabase.from("referrals").select("id", { count: "exact", head: true }),
        supabase.from("user_spins").select("id", { count: "exact", head: true }),
      ]);
      return {
        stores: storesRes.count || 0,
        deals: dealsRes.count || 0,
        users: usersRes.count || 0,
        giftCards: giftCardsRes.count || 0,
        referrals: referralsRes.count || 0,
        spins: spinsRes.count || 0,
      };
    },
    enabled: isAdmin,
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ["admin_referrals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select(`
          *,
          referrer:profiles!referrals_referrer_id_fkey(full_name, email, referral_code),
          referred:profiles!referrals_referred_id_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: analytics } = useQuery({
    queryKey: ["admin_analytics"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [usersData, referralsData, spinsData] = await Promise.all([
        supabase.from("profiles").select("created_at").gte("created_at", thirtyDaysAgo.toISOString()),
        supabase.from("referrals").select("created_at, status, referrer_reward"),
        supabase.from("user_spins").select("spun_at, reward_value"),
      ]);

      // Group users by day
      const usersByDay: Record<string, number> = {};
      usersData.data?.forEach((u: any) => {
        const day = new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        usersByDay[day] = (usersByDay[day] || 0) + 1;
      });

      // Referral stats
      const referralStats = {
        total: referralsData.data?.length || 0,
        completed: referralsData.data?.filter((r: any) => r.status === 'completed').length || 0,
        pending: referralsData.data?.filter((r: any) => r.status === 'pending').length || 0,
        totalEarnings: referralsData.data?.filter((r: any) => r.status === 'completed').reduce((sum: number, r: any) => sum + Number(r.referrer_reward || 0), 0) || 0,
      };

      // Spins stats
      const spinStats = {
        total: spinsData.data?.length || 0,
        totalValue: spinsData.data?.reduce((sum: number, s: any) => sum + Number(s.reward_value || 0), 0) || 0,
      };

      // Generate chart data for last 7 days
      const chartData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        chartData.push({
          name: day,
          users: usersByDay[day] || 0,
        });
      }

      return { chartData, referralStats, spinStats };
    },
    enabled: isAdmin,
  });

  // Mutations
  const saveStore = useMutation({
    mutationFn: async (data: any) => {
      if (editingStore) {
        const { error } = await supabase.from("stores").update(data).eq("id", editingStore.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("stores").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_stores"] });
      setShowStoreModal(false);
      setEditingStore(null);
      toast.success(editingStore ? "Store updated!" : "Store created!");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteStore = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_stores"] });
      toast.success("Store deleted!");
    },
  });

  const saveDeal = useMutation({
    mutationFn: async (data: any) => {
      if (editingDeal) {
        const { error } = await supabase.from("deals").update(data).eq("id", editingDeal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("deals").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_deals"] });
      setShowDealModal(false);
      setEditingDeal(null);
      toast.success(editingDeal ? "Deal updated!" : "Deal created!");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteDeal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_deals"] });
      toast.success("Deal deleted!");
    },
  });

  const saveGiftCard = useMutation({
    mutationFn: async (data: any) => {
      if (editingGiftCard) {
        const { error } = await supabase.from("gift_cards").update(data).eq("id", editingGiftCard.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("gift_cards").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_gift_cards"] });
      setShowGiftCardModal(false);
      setEditingGiftCard(null);
      toast.success(editingGiftCard ? "Gift card updated!" : "Gift card created!");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteGiftCard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gift_cards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_gift_cards"] });
      toast.success("Gift card deleted!");
    },
  });

  const saveSpinReward = useMutation({
    mutationFn: async (data: any) => {
      if (editingSpinReward) {
        const { error } = await supabase.from("spin_rewards").update(data).eq("id", editingSpinReward.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("spin_rewards").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_spin_rewards"] });
      setShowSpinRewardModal(false);
      setEditingSpinReward(null);
      toast.success(editingSpinReward ? "Reward updated!" : "Reward created!");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteSpinReward = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("spin_rewards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_spin_rewards"] });
      toast.success("Reward deleted!");
    },
  });

  const saveBanner = useMutation({
    mutationFn: async (data: any) => {
      if (editingBanner) {
        const { error } = await supabase.from("banners").update(data).eq("id", editingBanner.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("banners").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_banners"] });
      setShowBannerModal(false);
      setEditingBanner(null);
      toast.success(editingBanner ? "Banner updated!" : "Banner created!");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteBanner = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_banners"] });
      toast.success("Banner deleted!");
    },
  });

  const saveCategory = useMutation({
    mutationFn: async (data: any) => {
      if (editingCategory) {
        const { error } = await supabase.from("categories").update(data).eq("id", editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_categories"] });
      setShowCategoryModal(false);
      setEditingCategory(null);
      toast.success(editingCategory ? "Category updated!" : "Category created!");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_categories"] });
      toast.success("Category deleted!");
    },
  });

  const saveSubcategory = useMutation({
    mutationFn: async (data: any) => {
      if (editingSubcategory) {
        const { error } = await supabase.from("subcategories").update(data).eq("id", editingSubcategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("subcategories").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_subcategories"] });
      setShowSubcategoryModal(false);
      setEditingSubcategory(null);
      toast.success(editingSubcategory ? "Subcategory updated!" : "Subcategory created!");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteSubcategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subcategories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_subcategories"] });
      toast.success("Subcategory deleted!");
    },
  });

  const saveSponsor = useMutation({
    mutationFn: async (data: any) => {
      if (editingSponsor) {
        const { error } = await supabase.from("sponsors").update(data).eq("id", editingSponsor.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sponsors").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_sponsors"] });
      setShowSponsorModal(false);
      setEditingSponsor(null);
      toast.success(editingSponsor ? "Sponsor updated!" : "Sponsor created!");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteSponsor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sponsors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_sponsors"] });
      toast.success("Sponsor deleted!");
    },
  });

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase.from("site_settings").update({ value }).eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_site_settings"] });
      toast.success("Setting updated!");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const updateUser = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("profiles").update(data).eq("id", editingUser.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
      setShowUserModal(false);
      setEditingUser(null);
      toast.success("User updated!");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const updateReferralStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: any = { status };
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
      const { error } = await supabase.from("referrals").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_referrals"] });
      toast.success("Referral status updated!");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

  // Redirect if not admin. IMPORTANT: wait for `isAdminChecking` to finish
  // before deciding — otherwise we bounce the user back to /admin/login
  // during the brief window between auth state change and the admin DB
  // check resolving.
  useEffect(() => {
    if (!isLoading && !isAdminChecking && (!user || !isAdmin)) {
      navigate("/admin/login");
    }
  }, [isLoading, isAdminChecking, user, isAdmin, navigate]);

  if (isLoading || isAdminChecking || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "banners", label: "Banners", icon: Image },
    { id: "sponsors", label: "Sponsors", icon: Handshake },
    { id: "categories", label: "Categories", icon: Grid },
    { id: "stores", label: "Stores", icon: Store },
    { id: "deals", label: "Deals", icon: Tag },
    { id: "tracking", label: "Tracking", icon: BarChart3 },
    { id: "offer18", label: "Offer18 Integration", icon: Network },

    { id: "withdrawals", label: "Withdrawals", icon: Wallet },
    { id: "users", label: "Users", icon: Users },
    { id: "referrals", label: "Referrals", icon: Share2 },
    { id: "settings", label: "Site Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex-shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-bold font-heading text-lg text-foreground">Cashback</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Admin Panel</p>
        </div>

        <nav className="p-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeSection === item.id ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
          <button
            onClick={() => signOut().then(() => navigate("/"))}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-destructive/10 text-destructive mt-4"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {/* Dashboard */}
        {activeSection === "dashboard" && (
          <div>
            <h1 className="text-2xl font-bold font-heading mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
              <div className="bg-card rounded-xl p-6 shadow-card">
                <Store className="w-8 h-8 text-primary mb-2" />
                <p className="text-3xl font-bold">{stats?.stores || 0}</p>
                <p className="text-muted-foreground">Stores</p>
              </div>
              <div className="bg-card rounded-xl p-6 shadow-card">
                <Tag className="w-8 h-8 text-primary mb-2" />
                <p className="text-3xl font-bold">{stats?.deals || 0}</p>
                <p className="text-muted-foreground">Deals</p>
              </div>
              <div className="bg-card rounded-xl p-6 shadow-card">
                <Users className="w-8 h-8 text-primary mb-2" />
                <p className="text-3xl font-bold">{stats?.users || 0}</p>
                <p className="text-muted-foreground">Users</p>
              </div>
              <div className="bg-card rounded-xl p-6 shadow-card">
                <Share2 className="w-8 h-8 text-primary mb-2" />
                <p className="text-3xl font-bold">{stats?.referrals || 0}</p>
                <p className="text-muted-foreground">Referrals</p>
              </div>
            </div>

            {/* Cashback / postback live widgets */}
            <div className="mb-8">
              <AdminDashboardWidgets />
            </div>

            {/* Quick Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-xl p-6 shadow-card">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  User Signups (Last 7 Days)
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics?.chartData || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                      <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-card rounded-xl p-6 shadow-card">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-primary" />
                  Referral Overview
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-2xl font-bold text-primary">{analytics?.referralStats?.total || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Referrals</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-2xl font-bold text-success">{analytics?.referralStats?.completed || 0}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-2xl font-bold text-warning">{analytics?.referralStats?.pending || 0}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-2xl font-bold">₹{analytics?.referralStats?.totalEarnings || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Rewards</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics */}
        {activeSection === "analytics" && (
          <div>
            <h1 className="text-2xl font-bold font-heading mb-6">Analytics Dashboard</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-card rounded-xl p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-3xl font-bold">{stats?.users || 0}</p>
                  </div>
                  <Users className="w-12 h-12 text-primary/20" />
                </div>
              </div>
              <div className="bg-card rounded-xl p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Referrals</p>
                    <p className="text-3xl font-bold">{analytics?.referralStats?.total || 0}</p>
                  </div>
                  <Share2 className="w-12 h-12 text-primary/20" />
                </div>
              </div>
              <div className="bg-card rounded-xl p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Referral Earnings</p>
                    <p className="text-3xl font-bold">₹{analytics?.referralStats?.totalEarnings || 0}</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-success/20" />
                </div>
              </div>
              <div className="bg-card rounded-xl p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Spins</p>
                    <p className="text-3xl font-bold">{analytics?.spinStats?.total || 0}</p>
                  </div>
                  <RotateCw className="w-12 h-12 text-primary/20" />
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-card rounded-xl p-6 shadow-card">
                <h3 className="text-lg font-semibold mb-4">User Growth (Last 7 Days)</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics?.chartData || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.3)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-card rounded-xl p-6 shadow-card">
                <h3 className="text-lg font-semibold mb-4">Referral Status Distribution</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Completed', value: analytics?.referralStats?.completed || 0 },
                          { name: 'Pending', value: analytics?.referralStats?.pending || 0 },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill="hsl(var(--success))" />
                        <Cell fill="hsl(var(--warning))" />
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card rounded-xl p-6 shadow-card">
              <h3 className="text-lg font-semibold mb-4">Recent Referrals</h3>
              <div className="divide-y divide-border">
                {referrals.slice(0, 5).map((ref: any) => (
                  <div key={ref.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ref.status === 'completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                        {ref.status === 'completed' ? <UserCheck className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-medium">{ref.referrer?.full_name || ref.referrer?.email || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">referred {ref.referred?.full_name || ref.referred?.email || 'Unknown'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs ${ref.status === 'completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                        {ref.status}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(ref.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Banners */}
        {activeSection === "banners" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold font-heading">Banners</h1>
              <Button onClick={() => { setBannerForm({ title: "", image_url: "", mobile_image_url: "", link: "", display_order: "", is_active: true }); setEditingBanner(null); setShowBannerModal(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Add Banner
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.map((banner: any) => (
                <div key={banner.id} className="bg-card rounded-xl shadow-card overflow-hidden">
                  <img src={banner.image_url} alt={banner.title} className="w-full h-40 object-cover" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/400x160'; }} />
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{banner.title}</p>
                        <p className="text-sm text-muted-foreground">Order: {banner.display_order}</p>
                        {banner.link && (
                          <a
                            href={banner.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1 mt-1 truncate"
                          >
                            <Share2 className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{banner.link}</span>
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <span className={`px-2 py-1 rounded-full text-xs ${banner.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                          {banner.is_active ? "Active" : "Inactive"}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => { setEditingBanner(banner); setBannerForm({ title: banner.title, image_url: banner.image_url, mobile_image_url: banner.mobile_image_url || "", link: banner.link || "", display_order: banner.display_order?.toString() || "", is_active: banner.is_active }); setShowBannerModal(true); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteBanner.mutate(banner.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sponsors */}
        {activeSection === "sponsors" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold font-heading">Sponsors</h1>
              <Button onClick={() => { setSponsorForm({ name: "", logo_url: "", website_url: "", display_order: "", is_active: true }); setEditingSponsor(null); setShowSponsorModal(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Add Sponsor
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sponsors.map((sponsor: any) => (
                <div key={sponsor.id} className="bg-card rounded-xl shadow-card overflow-hidden p-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={sponsor.logo_url}
                      alt={sponsor.name}
                      className="w-16 h-16 object-contain rounded-lg bg-muted p-2"
                      onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(sponsor.name)}&background=random`; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{sponsor.name}</p>
                      <p className="text-sm text-muted-foreground">Order: {sponsor.display_order}</p>
                      {sponsor.website_url && (
                        <a
                          href={sponsor.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline truncate block"
                        >
                          {sponsor.website_url}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <span className={`px-2 py-1 rounded-full text-xs ${sponsor.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                      {sponsor.is_active ? "Active" : "Inactive"}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingSponsor(sponsor); setSponsorForm({ name: sponsor.name, logo_url: sponsor.logo_url, website_url: sponsor.website_url || "", display_order: sponsor.display_order?.toString() || "", is_active: sponsor.is_active }); setShowSponsorModal(true); }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteSponsor.mutate(sponsor.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        {activeSection === "categories" && (
          viewingCategory ? (
            <CategoryDetailView category={viewingCategory} onBack={() => setViewingCategory(null)} />
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold font-heading">Categories & Subcategories</h1>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setSubcategoryForm({ name: "", slug: "", category_id: "", icon: "tag", display_order: "", is_active: true }); setEditingSubcategory(null); setShowSubcategoryModal(true); }}>
                    <Plus className="w-4 h-4 mr-2" /> Add Subcategory
                  </Button>
                  <Button onClick={() => { setCategoryForm({ name: "", slug: "", icon: "tag", color: "bg-primary/10 text-primary", display_order: "", is_active: true }); setEditingCategory(null); setShowCategoryModal(true); }}>
                    <Plus className="w-4 h-4 mr-2" /> Add Category
                  </Button>
                </div>
              </div>

              {/* Categories */}
              <h2 className="text-lg font-semibold mb-3">Categories</h2>
              <div className="bg-card rounded-xl shadow-card overflow-hidden mb-6">
                <div className="divide-y divide-border">
                  {categories.map((cat: any) => (
                    <div key={cat.id} className="p-4 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full ${cat.color} flex items-center justify-center`}>
                        <Grid className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{cat.name}</p>
                        <p className="text-sm text-muted-foreground">/{cat.slug} | Order: {cat.display_order}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${cat.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                        {cat.is_active ? "Active" : "Inactive"}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => setViewingCategory(cat)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setEditingCategory(cat); setCategoryForm({ name: cat.name, slug: cat.slug, icon: cat.icon, color: cat.color, display_order: cat.display_order?.toString() || "", is_active: cat.is_active }); setShowCategoryModal(true); }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteCategory.mutate(cat.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subcategories */}
              <h2 className="text-lg font-semibold mb-3">Subcategories</h2>
              <div className="bg-card rounded-xl shadow-card overflow-hidden">
                <div className="divide-y divide-border">
                  {subcategories.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No subcategories yet</div>
                  ) : (
                    subcategories.map((sub: any) => (
                      <div key={sub.id} className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <FolderTree className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{sub.name}</p>
                          <p className="text-sm text-muted-foreground">Parent: {sub.category?.name || "Unknown"} | /{sub.slug}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${sub.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                          {sub.is_active ? "Active" : "Inactive"}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => { setEditingSubcategory(sub); setSubcategoryForm({ name: sub.name, slug: sub.slug, category_id: sub.category_id, icon: sub.icon || "tag", display_order: sub.display_order?.toString() || "", is_active: sub.is_active }); setShowSubcategoryModal(true); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteSubcategory.mutate(sub.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )
        )}

        {/* Stores */}
        {activeSection === "stores" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold font-heading">Stores</h1>
              <Button onClick={() => { setStoreForm({ name: "", slug: "", logo_url: "", description: "", cashback_percent: "", cashback_type: "percent", category: "", category_id: "", subcategory_id: "", affiliate_url: "", is_active: true, is_trending: false, is_new: false }); setEditingStore(null); setShowStoreModal(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Add Store
              </Button>
            </div>
            <div className="bg-card rounded-xl shadow-card overflow-hidden">
              <div className="p-4 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search stores..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="divide-y divide-border">
                {stores.filter((s: any) => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map((store: any) => (
                  <div key={store.id} className="p-4 flex items-center gap-4">
                    <img src={store.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(store.name)}&background=random`} alt={store.name} className="w-12 h-12 rounded-lg object-contain bg-muted" />
                    <div className="flex-1">
                      <p className="font-semibold">{store.name}</p>
                      <p className="text-sm text-muted-foreground">{store.cashback_percent}% | {store.category || "Uncategorized"}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${store.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                      {store.is_active ? "Active" : "Inactive"}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => { setEditingStore(store); setStoreForm({ name: store.name, slug: store.slug, logo_url: store.logo_url || "", description: store.description || "", cashback_percent: store.cashback_percent?.toString() || "", cashback_type: store.cashback_type || "percent", category: store.category || "", category_id: store.category_id || "", subcategory_id: store.subcategory_id || "", affiliate_url: store.affiliate_url || "", is_active: store.is_active, is_trending: store.is_trending, is_new: store.is_new }); setShowStoreModal(true); }}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteStore.mutate(store.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Deals */}
        {activeSection === "deals" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold font-heading">Deals</h1>
              <Button onClick={() => { setDealForm({ store_id: "", title: "", description: "", coupon_code: "", cashback_percent: "", discount_text: "", category_id: "", subcategory_id: "", is_exclusive: false, is_verified: false, is_active: true }); setEditingDeal(null); setShowDealModal(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Add Deal
              </Button>
            </div>
            <div className="bg-card rounded-xl shadow-card overflow-hidden">
              <div className="divide-y divide-border">
                {deals.map((deal: any) => (
                  <div key={deal.id} className="p-4 flex items-center gap-4">
                    <div className="flex-1">
                      <p className="font-semibold">{deal.title}</p>
                      <p className="text-sm text-muted-foreground">{deal.store?.name} | {deal.coupon_code || "No code"}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${deal.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                      {deal.is_active ? "Active" : "Inactive"}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => { setEditingDeal(deal); setDealForm({ store_id: deal.store_id, title: deal.title, description: deal.description || "", coupon_code: deal.coupon_code || "", cashback_percent: deal.cashback_percent?.toString() || "", discount_text: deal.discount_text || "", category_id: deal.category_id || "", subcategory_id: deal.subcategory_id || "", is_exclusive: deal.is_exclusive, is_verified: deal.is_verified, is_active: deal.is_active }); setShowDealModal(true); }}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteDeal.mutate(deal.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === "tracking" && (
          <AdminTracking />
        )}

        {/* Offer18 Integration */}
        {activeSection === "offer18" && (
          <AdminOffer18 />
        )}

        {/* Users */}
        {activeSection === "users" && (
          <div>
            <h1 className="text-2xl font-bold font-heading mb-6">Users ({users.length})</h1>
            <div className="bg-card rounded-xl shadow-card overflow-hidden">
              <div className="p-4 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="divide-y divide-border">
                {users.filter((u: any) => (u.full_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || (u.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())).map((u: any) => (
                  <div key={u.id} className="p-4 flex items-center gap-4">
                    <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name || u.email || "U")}&background=random`} alt={u.full_name || "User"} className="w-12 h-12 rounded-full object-cover bg-muted" />
                    <div className="flex-1">
                      <p className="font-semibold">{u.full_name || "No name"}</p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                      {u.phone && <p className="text-xs text-muted-foreground">{u.phone}</p>}
                    </div>
                    <div className="text-center">
                      <p className="font-mono text-sm bg-primary/10 text-primary px-2 py-1 rounded">{u.referral_code || "N/A"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => {
                      setEditingUser(u);
                      setUserForm({ full_name: u.full_name || "", email: u.email || "", phone: u.phone || "" });
                      setShowUserModal(true);
                    }}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Withdrawals */}
        {activeSection === "withdrawals" && <AdminWithdrawals />}

        {/* Referrals */}
        {activeSection === "referrals" && (
          <div>
            <h1 className="text-2xl font-bold font-heading mb-6">Referrals ({referrals.length})</h1>

            {/* Referral Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-card rounded-xl p-4 shadow-card">
                <p className="text-2xl font-bold">{analytics?.referralStats?.total || 0}</p>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
              </div>
              <div className="bg-card rounded-xl p-4 shadow-card">
                <p className="text-2xl font-bold text-success">{analytics?.referralStats?.completed || 0}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <div className="bg-card rounded-xl p-4 shadow-card">
                <p className="text-2xl font-bold text-warning">{analytics?.referralStats?.pending || 0}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <div className="bg-card rounded-xl p-4 shadow-card">
                <p className="text-2xl font-bold">₹{analytics?.referralStats?.totalEarnings || 0}</p>
                <p className="text-sm text-muted-foreground">Total Rewards Paid</p>
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-card overflow-hidden">
              <div className="p-4 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search referrals..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="divide-y divide-border">
                {referrals.filter((r: any) =>
                  (r.referrer?.full_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
                  (r.referrer?.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
                  (r.referred?.full_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
                  (r.referred?.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
                ).map((ref: any) => (
                  <div key={ref.id} className="p-4 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${ref.status === 'completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                      {ref.status === 'completed' ? <UserCheck className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{ref.referrer?.full_name || ref.referrer?.email || 'Unknown'}</p>
                        <span className="text-muted-foreground">→</span>
                        <p className="font-semibold">{ref.referred?.full_name || ref.referred?.email || 'Unknown'}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Referrer Code: <span className="font-mono">{ref.referrer?.referral_code || 'N/A'}</span>
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">₹{ref.referrer_reward || 0} / ₹{ref.referred_reward || 0}</p>
                      <p className="text-xs text-muted-foreground">Referrer / Referred</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{new Date(ref.created_at).toLocaleDateString()}</p>
                      {ref.completed_at && (
                        <p className="text-xs text-success">Completed: {new Date(ref.completed_at).toLocaleDateString()}</p>
                      )}
                    </div>
                    <select
                      value={ref.status}
                      onChange={(e) => updateReferralStatus.mutate({ id: ref.id, status: e.target.value })}
                      className={`border rounded-md px-3 py-1 text-sm ${ref.status === 'completed' ? 'bg-success/10 border-success text-success' : 'bg-warning/10 border-warning text-warning'}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                ))}
                {referrals.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    No referrals yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Site Settings */}
        {activeSection === "settings" && (
          <div>
            <h1 className="text-2xl font-bold font-heading mb-6">Site Settings</h1>
            <div className="bg-card rounded-xl shadow-card overflow-hidden">
              <div className="divide-y divide-border">
                {siteSettings.map((setting: any) => (
                  <div key={setting.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold capitalize">{setting.key.replace(/_/g, " ")}</p>
                        <p className="text-xs text-muted-foreground">{setting.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        defaultValue={setting.value || ""}
                        onBlur={(e) => {
                          if (e.target.value !== setting.value) {
                            updateSetting.mutate({ key: setting.key, value: e.target.value });
                          }
                        }}
                        className="flex-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <Dialog open={showStoreModal} onOpenChange={setShowStoreModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStore ? "Edit Store" : "Add Store"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="Store Name" value={storeForm.name} onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })} />
            <Input placeholder="Slug" value={storeForm.slug} onChange={(e) => setStoreForm({ ...storeForm, slug: e.target.value })} />
            <div>
              <label className="text-sm font-medium mb-2 block">Store Logo</label>
              <ImageUpload
                value={storeForm.logo_url}
                onChange={(url) => setStoreForm({ ...storeForm, logo_url: url })}
                folder="stores"
                placeholder="Upload Store Logo"
              />
            </div>
            <Textarea placeholder="Description" value={storeForm.description} onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Cashback %" type="number" value={storeForm.cashback_percent} onChange={(e) => setStoreForm({ ...storeForm, cashback_percent: e.target.value })} />
              <select value={storeForm.cashback_type} onChange={(e) => setStoreForm({ ...storeForm, cashback_type: e.target.value })} className="border border-input rounded-md px-3 py-2 bg-background">
                <option value="percent">Percent</option>
                <option value="flat">Flat</option>
                <option value="voucher">Voucher</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <select value={storeForm.category_id} onChange={(e) => { setStoreForm({ ...storeForm, category_id: e.target.value, subcategory_id: "" }); }} className="border border-input rounded-md px-3 py-2 bg-background">
                <option value="">Select Category</option>
                {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              <select value={storeForm.subcategory_id} onChange={(e) => setStoreForm({ ...storeForm, subcategory_id: e.target.value })} className="border border-input rounded-md px-3 py-2 bg-background">
                <option value="">Select Subcategory</option>
                {subcategories.filter((sub: any) => sub.category_id === storeForm.category_id).map((sub: any) => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
              </select>
            </div>
            <Input placeholder="Affiliate URL" value={storeForm.affiliate_url} onChange={(e) => setStoreForm({ ...storeForm, affiliate_url: e.target.value })} />
            <div className="flex gap-4">
              <label className="flex items-center gap-2"><input type="checkbox" checked={storeForm.is_active} onChange={(e) => setStoreForm({ ...storeForm, is_active: e.target.checked })} /> Active</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={storeForm.is_trending} onChange={(e) => setStoreForm({ ...storeForm, is_trending: e.target.checked })} /> Trending</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={storeForm.is_new} onChange={(e) => setStoreForm({ ...storeForm, is_new: e.target.checked })} /> New</label>
            </div>
            <Button onClick={() => saveStore.mutate({
              ...storeForm,
              cashback_percent: parseFloat(storeForm.cashback_percent) || 0,
              slug: storeForm.slug || storeForm.name.toLowerCase().replace(/\s+/g, "-"),
              category_id: storeForm.category_id || null,
              subcategory_id: storeForm.subcategory_id || null,
              category: categories.find((c: any) => c.id === storeForm.category_id)?.name || storeForm.category
            })} className="w-full" disabled={saveStore.isPending}>
              {saveStore.isPending ? "Saving..." : "Save Store"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="Full Name" value={userForm.full_name} onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })} />
            <Input placeholder="Email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} disabled />
            <Input placeholder="Phone" value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} />
            <Button onClick={() => updateUser.mutate({ full_name: userForm.full_name, phone: userForm.phone })} className="w-full" disabled={updateUser.isPending}>
              {updateUser.isPending ? "Saving..." : "Save User"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDealModal} onOpenChange={setShowDealModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDeal ? "Edit Deal" : "Add Deal"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <select value={dealForm.store_id} onChange={(e) => setDealForm({ ...dealForm, store_id: e.target.value })} className="w-full border border-input rounded-md px-3 py-2 bg-background">
              <option value="">Select Store</option>
              {stores.map((store: any) => <option key={store.id} value={store.id}>{store.name}</option>)}
            </select>
            <Input placeholder="Deal Title" value={dealForm.title} onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })} />
            <Textarea placeholder="Description" value={dealForm.description} onChange={(e) => setDealForm({ ...dealForm, description: e.target.value })} />
            <Input placeholder="Coupon Code" value={dealForm.coupon_code} onChange={(e) => setDealForm({ ...dealForm, coupon_code: e.target.value })} />
            <Input placeholder="Cashback %" type="number" value={dealForm.cashback_percent} onChange={(e) => setDealForm({ ...dealForm, cashback_percent: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <select value={dealForm.category_id} onChange={(e) => { setDealForm({ ...dealForm, category_id: e.target.value, subcategory_id: "" }); }} className="border border-input rounded-md px-3 py-2 bg-background">
                <option value="">Select Category</option>
                {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              <select value={dealForm.subcategory_id} onChange={(e) => setDealForm({ ...dealForm, subcategory_id: e.target.value })} className="border border-input rounded-md px-3 py-2 bg-background">
                <option value="">Select Subcategory</option>
                {subcategories.filter((sub: any) => sub.category_id === dealForm.category_id).map((sub: any) => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
              </select>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2"><input type="checkbox" checked={dealForm.is_active} onChange={(e) => setDealForm({ ...dealForm, is_active: e.target.checked })} /> Active</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={dealForm.is_exclusive} onChange={(e) => setDealForm({ ...dealForm, is_exclusive: e.target.checked })} /> Exclusive</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={dealForm.is_verified} onChange={(e) => setDealForm({ ...dealForm, is_verified: e.target.checked })} /> Verified</label>
            </div>
            <Button onClick={() => saveDeal.mutate({
              ...dealForm,
              cashback_percent: parseFloat(dealForm.cashback_percent) || null,
              category_id: dealForm.category_id || null,
              subcategory_id: dealForm.subcategory_id || null
            })} className="w-full" disabled={saveDeal.isPending}>
              {saveDeal.isPending ? "Saving..." : "Save Deal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBannerModal} onOpenChange={setShowBannerModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBanner ? "Edit Banner" : "Add Banner"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="Banner Title" value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} />
            <div>
              <label className="text-sm font-medium mb-2 block">Desktop Image</label>
              <ImageUpload
                value={bannerForm.image_url}
                onChange={(url) => setBannerForm({ ...bannerForm, image_url: url })}
                folder="banners"
                placeholder="Upload Desktop Banner"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Mobile Image (optional)</label>
              <ImageUpload
                value={bannerForm.mobile_image_url}
                onChange={(url) => setBannerForm({ ...bannerForm, mobile_image_url: url })}
                folder="banners"
                placeholder="Upload Mobile Banner"
              />
            </div>
            <Input placeholder="Link URL" value={bannerForm.link} onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })} />
            <Input placeholder="Display Order" type="number" value={bannerForm.display_order} onChange={(e) => setBannerForm({ ...bannerForm, display_order: e.target.value })} />
            <label className="flex items-center gap-2"><input type="checkbox" checked={bannerForm.is_active} onChange={(e) => setBannerForm({ ...bannerForm, is_active: e.target.checked })} /> Active</label>
            <Button onClick={() => saveBanner.mutate({ ...bannerForm, display_order: parseInt(bannerForm.display_order) || 0 })} className="w-full" disabled={saveBanner.isPending}>
              {saveBanner.isPending ? "Saving..." : "Save Banner"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSponsorModal} onOpenChange={setShowSponsorModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSponsor ? "Edit Sponsor" : "Add Sponsor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="Sponsor Name" value={sponsorForm.name} onChange={(e) => setSponsorForm({ ...sponsorForm, name: e.target.value })} />
            <div>
              <label className="text-sm font-medium mb-2 block">Sponsor Logo</label>
              <ImageUpload
                value={sponsorForm.logo_url}
                onChange={(url) => setSponsorForm({ ...sponsorForm, logo_url: url })}
                folder="sponsors"
                placeholder="Upload Sponsor Logo"
              />
            </div>
            <Input placeholder="Website URL (optional)" value={sponsorForm.website_url} onChange={(e) => setSponsorForm({ ...sponsorForm, website_url: e.target.value })} />
            <Input placeholder="Display Order" type="number" value={sponsorForm.display_order} onChange={(e) => setSponsorForm({ ...sponsorForm, display_order: e.target.value })} />
            <label className="flex items-center gap-2"><input type="checkbox" checked={sponsorForm.is_active} onChange={(e) => setSponsorForm({ ...sponsorForm, is_active: e.target.checked })} /> Active</label>
            <Button onClick={() => saveSponsor.mutate({ ...sponsorForm, display_order: parseInt(sponsorForm.display_order) || 0, website_url: sponsorForm.website_url || null })} className="w-full" disabled={saveSponsor.isPending}>
              {saveSponsor.isPending ? "Saving..." : "Save Sponsor"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="Category Name" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} />
            <Input placeholder="Slug" value={categoryForm.slug} onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })} />
            <select value={categoryForm.icon} onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })} className="w-full border border-input rounded-md px-3 py-2 bg-background">
              <option value="tag">Tag</option>
              <option value="shirt">Fashion</option>
              <option value="laptop">Electronics</option>
              <option value="plane">Travel</option>
              <option value="utensils">Food</option>
              <option value="heart">Health</option>
              <option value="wallet">Finance</option>
              <option value="home">Home</option>
              <option value="baby">Baby</option>
              <option value="dumbbell">Sports</option>
              <option value="book-open">Books</option>
            </select>
            <Input placeholder="Color Classes (e.g., bg-pink-100 text-pink-600)" value={categoryForm.color} onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })} />
            <Input placeholder="Display Order" type="number" value={categoryForm.display_order} onChange={(e) => setCategoryForm({ ...categoryForm, display_order: e.target.value })} />
            <label className="flex items-center gap-2"><input type="checkbox" checked={categoryForm.is_active} onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })} /> Active</label>
            <Button onClick={() => saveCategory.mutate({ ...categoryForm, display_order: parseInt(categoryForm.display_order) || 0, slug: categoryForm.slug || categoryForm.name.toLowerCase().replace(/\s+/g, "-") })} className="w-full" disabled={saveCategory.isPending}>
              {saveCategory.isPending ? "Saving..." : "Save Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSubcategoryModal} onOpenChange={setShowSubcategoryModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSubcategory ? "Edit Subcategory" : "Add Subcategory"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <select value={subcategoryForm.category_id} onChange={(e) => setSubcategoryForm({ ...subcategoryForm, category_id: e.target.value })} className="w-full border border-input rounded-md px-3 py-2 bg-background">
              <option value="">Select Parent Category</option>
              {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
            <Input placeholder="Subcategory Name" value={subcategoryForm.name} onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })} />
            <Input placeholder="Slug" value={subcategoryForm.slug} onChange={(e) => setSubcategoryForm({ ...subcategoryForm, slug: e.target.value })} />
            <Input placeholder="Display Order" type="number" value={subcategoryForm.display_order} onChange={(e) => setSubcategoryForm({ ...subcategoryForm, display_order: e.target.value })} />
            <label className="flex items-center gap-2"><input type="checkbox" checked={subcategoryForm.is_active} onChange={(e) => setSubcategoryForm({ ...subcategoryForm, is_active: e.target.checked })} /> Active</label>
            <Button onClick={() => saveSubcategory.mutate({ ...subcategoryForm, display_order: parseInt(subcategoryForm.display_order) || 0, slug: subcategoryForm.slug || subcategoryForm.name.toLowerCase().replace(/\s+/g, "-") })} className="w-full" disabled={saveSubcategory.isPending}>
              {saveSubcategory.isPending ? "Saving..." : "Save Subcategory"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;
