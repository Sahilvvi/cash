import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useReferrals, useReferralStats } from "@/hooks/useReferrals";
import { useNotifications, useMarkAllAsRead } from "@/hooks/useNotifications";
import { useCashbackTransactions, useCashbackStats } from "@/hooks/useCashback";
import { useAffiliateClicks } from "@/hooks/useAffiliateTracking";
import { useWithdrawals, useWithdrawalStats } from "@/hooks/useWithdrawals";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import WalletCard from "@/components/wallet/WalletCard";
import WithdrawalHistory from "@/components/wallet/WithdrawalHistory";
import {
  Wallet,
  Store,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Copy,
  Users,
  History,
  Settings,
  Bell,
  LogOut,
  ChevronRight,
  User,
  Mail,
  Phone,
  Save,
  ExternalLink,
  IndianRupee,
  CheckCircle,
  Timer,
  Banknote,
  Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const DashboardPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile, signOut, updateProfile, isLoading } = useAuth();
  const { data: referrals = [] } = useReferrals();
  const { data: referralStats } = useReferralStats();
  const { data: notifications = [] } = useNotifications();
  const { data: cashbackTransactions = [] } = useCashbackTransactions();
  const { data: affiliateClicks = [] } = useAffiliateClicks();
  const { data: cashbackStats } = useCashbackStats();
  const { data: withdrawals = [] } = useWithdrawals();
  const { data: withdrawalStats } = useWithdrawalStats();
  const markAllAsRead = useMarkAllAsRead();

  const [activeTab, setActiveTab] = useState("overview");
  const [isSaving, setIsSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
  });

  // Update form when profile changes
  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  // Set up realtime subscriptions for all user data
  useEffect(() => {
    if (!user) return;

    const channels = [
      // Referrals subscription
      supabase
        .channel('dashboard-referrals')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'referrals' }, () => {
          queryClient.invalidateQueries({ queryKey: ["referrals"] });
          queryClient.invalidateQueries({ queryKey: ["referral_stats"] });
        })
        .subscribe(),
      // Notifications subscription
      supabase
        .channel('dashboard-notifications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          queryClient.invalidateQueries({ queryKey: ["unread_count"] });
        })
        .subscribe(),
      // Profile subscription
      supabase
        .channel('dashboard-profile')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `user_id=eq.${user.id}` }, () => {
          queryClient.invalidateQueries({ queryKey: ["profile"] });
        })
        .subscribe(),
      // Cashback transactions subscription
      supabase
        .channel('dashboard-cashback')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cashback_transactions', filter: `user_id=eq.${user.id}` }, () => {
          queryClient.invalidateQueries({ queryKey: ["cashback_transactions"] });
          queryClient.invalidateQueries({ queryKey: ["cashback_stats"] });
        })
        .subscribe(),
      // Withdrawals subscription
      supabase
        .channel('dashboard-withdrawals')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals', filter: `user_id=eq.${user.id}` }, () => {
          queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
          queryClient.invalidateQueries({ queryKey: ["withdrawal_stats"] });
        })
        .subscribe(),
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user, queryClient]);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth?mode=login");
    }
  }, [isLoading, user, navigate]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const referralCode = profile?.referral_code || "LOADING";
  const referralLink = `${window.location.origin}/auth?mode=register&ref=${referralCode}`;

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    toast.success("Logged out successfully");
  };

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    const { error } = await updateProfile(profileForm);
    setIsSaving(false);

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated successfully");
    }
  };

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "wallet", label: "Wallet", icon: Wallet, badge: withdrawalStats?.pending ? `₹${withdrawalStats.pending}` : undefined },
    { id: "cashback", label: "Cashback", icon: IndianRupee, badge: cashbackStats?.pending ? `₹${cashbackStats.pending}` : undefined },
    { id: "referrals", label: "Refer & Earn", icon: Users },

    { id: "notifications", label: "Notifications", icon: Bell, badge: notifications.filter(n => !n.is_read).length || undefined },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const unreadNotifications = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto py-8 px-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-card rounded-xl shadow-card overflow-hidden sticky top-24">
              {/* User Info */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold font-heading">{profile?.full_name || "User"}</p>
                    <p className="text-sm text-muted-foreground truncate max-w-[150px]">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="p-2">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors ${activeTab === item.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-foreground"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-destructive/10 text-destructive mt-2"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-6 text-primary-foreground">
                    <div className="flex items-center gap-3 mb-3">
                      <IndianRupee className="w-8 h-8" />
                      <span className="text-sm font-medium opacity-90">Total Cashback</span>
                    </div>
                    <p className="text-3xl font-bold font-heading">₹{cashbackStats?.total || 0}</p>
                    <p className="text-sm opacity-80 mt-2">Lifetime earnings</p>
                  </div>

                  <div className="bg-card rounded-xl p-6 shadow-card">
                    <div className="flex items-center gap-3 mb-3">
                      <Timer className="w-8 h-8 text-warning" />
                      <span className="text-sm font-medium text-muted-foreground">Pending</span>
                    </div>
                    <p className="text-3xl font-bold font-heading text-foreground">₹{cashbackStats?.pending || 0}</p>
                    <p className="text-sm text-muted-foreground mt-2">Being processed</p>
                  </div>

                  <div className="bg-card rounded-xl p-6 shadow-card">
                    <div className="flex items-center gap-3 mb-3">
                      <Users className="w-8 h-8 text-success" />
                      <span className="text-sm font-medium text-muted-foreground">Referrals</span>
                    </div>
                    <p className="text-3xl font-bold font-heading text-foreground">{referralStats?.total || 0}</p>
                    <p className="text-sm text-muted-foreground mt-2">Friends invited</p>
                  </div>


                </div>

                {/* Referral Banner */}
                <div className="bg-gradient-to-r from-secondary to-secondary/80 rounded-xl p-6 text-secondary-foreground">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-secondary-foreground/10 flex items-center justify-center">
                        <Gift className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="font-bold font-heading text-lg">Refer & Earn ₹100</h3>
                        <p className="text-secondary-foreground/80 text-sm">
                          Get ₹100 for each friend who signs up and shops
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-secondary-foreground/10 rounded-lg px-4 py-2 font-mono text-sm">
                        {referralCode}
                      </div>
                      <Button variant="default" size="sm" onClick={handleCopyReferral}>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy Link
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-card rounded-xl p-6 shadow-card">
                  <h3 className="font-bold font-heading text-lg mb-4">Recent Activity</h3>
                  {cashbackTransactions.length === 0 && referrals.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No activity yet. Start shopping to earn cashback!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {cashbackTransactions.slice(0, 5).map((t, idx) => (
                          <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                                <IndianRupee className="w-5 h-5 text-success" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {(t as Record<string, unknown> & { store?: { name?: string } }).store?.name || 'Cashback'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(t.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <span className="font-semibold text-success">
                              +₹{t.amount}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link to="/stores" className="bg-card rounded-xl p-4 shadow-card hover:shadow-hover transition-shadow text-center">
                    <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="font-medium">Browse Stores</p>
                  </Link>
                  <Link to="/deals" className="bg-card rounded-xl p-4 shadow-card hover:shadow-hover transition-shadow text-center">
                    <Gift className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="font-medium">Today's Deals</p>
                  </Link>
                  <Link to="/missing-cashback" className="bg-card rounded-xl p-4 shadow-card hover:shadow-hover transition-shadow text-center">
                    <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="font-medium">Missing Cashback</p>
                  </Link>
                  <Link to="/profile" className="bg-card rounded-xl p-4 shadow-card hover:shadow-hover transition-shadow text-center">
                    <Wallet className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="font-medium">My Wallet</p>
                  </Link>
                </div>
              </div>
            )}

            {activeTab === "wallet" && (
              <div className="space-y-6">
                {/* Wallet Card */}
                <WalletCard />

                {/* Withdrawal Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-card rounded-xl p-6 shadow-card">
                    <div className="flex items-center gap-3 mb-3">
                      <Banknote className="w-8 h-8 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">Total Withdrawn</span>
                    </div>
                    <p className="text-3xl font-bold font-heading text-foreground">₹{withdrawalStats?.total || 0}</p>
                    <p className="text-sm text-muted-foreground mt-2">All time</p>
                  </div>

                  <div className="bg-card rounded-xl p-6 shadow-card">
                    <div className="flex items-center gap-3 mb-3">
                      <Timer className="w-8 h-8 text-warning" />
                      <span className="text-sm font-medium text-muted-foreground">Pending</span>
                    </div>
                    <p className="text-3xl font-bold font-heading text-foreground">₹{withdrawalStats?.pending || 0}</p>
                    <p className="text-sm text-muted-foreground mt-2">Being processed</p>
                  </div>

                  <div className="bg-card rounded-xl p-6 shadow-card">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle className="w-8 h-8 text-success" />
                      <span className="text-sm font-medium text-muted-foreground">Completed</span>
                    </div>
                    <p className="text-3xl font-bold font-heading text-foreground">₹{withdrawalStats?.completed || 0}</p>
                    <p className="text-sm text-muted-foreground mt-2">Successfully paid</p>
                  </div>
                </div>

                {/* Withdrawal History */}
                <div className="bg-card rounded-xl shadow-card overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-bold font-heading">Withdrawal History</h3>
                  </div>

                  {withdrawals.length === 0 ? (
                    <div className="p-8 text-center">
                      <Banknote className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h4 className="font-semibold text-lg mb-2">No Withdrawals Yet</h4>
                      <p className="text-muted-foreground">
                        Earn cashback and request withdrawals when you have ₹100+
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {withdrawals.map((withdrawal) => (
                        <div key={withdrawal.id} className="p-4 flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${withdrawal.status === 'completed'
                            ? 'bg-success/10'
                            : withdrawal.status === 'pending' || withdrawal.status === 'approved'
                              ? 'bg-warning/10'
                              : 'bg-destructive/10'
                            }`}>
                            <Banknote className={`w-6 h-6 ${withdrawal.status === 'completed'
                              ? 'text-success'
                              : withdrawal.status === 'pending' || withdrawal.status === 'approved'
                                ? 'text-warning'
                                : 'text-destructive'
                              }`} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">Withdrawal Request</p>
                            <p className="text-sm text-muted-foreground">
                              {withdrawal.payment_method.replace('_', ' ')} • {new Date(withdrawal.requested_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">₹{withdrawal.amount}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${withdrawal.status === 'completed'
                              ? 'bg-success/10 text-success'
                              : withdrawal.status === 'pending'
                                ? 'bg-warning/10 text-warning'
                                : withdrawal.status === 'approved'
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-destructive/10 text-destructive'
                              }`}>
                              {withdrawal.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "cashback" && (
              <div className="space-y-6">
                {/* Cashback Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-success to-success/80 rounded-xl p-6 text-white">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle className="w-8 h-8" />
                      <span className="text-sm font-medium opacity-90">Confirmed</span>
                    </div>
                    <p className="text-3xl font-bold font-heading">₹{cashbackStats?.confirmed || 0}</p>
                    <p className="text-sm opacity-80 mt-2">Ready to withdraw</p>
                  </div>

                  <div className="bg-card rounded-xl p-6 shadow-card">
                    <div className="flex items-center gap-3 mb-3">
                      <Timer className="w-8 h-8 text-warning" />
                      <span className="text-sm font-medium text-muted-foreground">Pending</span>
                    </div>
                    <p className="text-3xl font-bold font-heading text-foreground">₹{cashbackStats?.pending || 0}</p>
                    <p className="text-sm text-muted-foreground mt-2">Being verified</p>
                  </div>

                  <div className="bg-card rounded-xl p-6 shadow-card">
                    <div className="flex items-center gap-3 mb-3">
                      <IndianRupee className="w-8 h-8 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">Total Earned</span>
                    </div>
                    <p className="text-3xl font-bold font-heading text-foreground">₹{cashbackStats?.total || 0}</p>
                    <p className="text-sm text-muted-foreground mt-2">Lifetime cashback</p>
                  </div>
                </div>

                {/* Transactions List */}
                <div className="bg-card rounded-xl shadow-card overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-bold font-heading">Cashback History</h3>
                  </div>

                  {cashbackTransactions.length === 0 ? (
                    <div className="p-8 text-center">
                      <IndianRupee className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h4 className="font-semibold text-lg mb-2">No Cashback Yet</h4>
                      <p className="text-muted-foreground mb-4">
                        Shop through our partner stores to earn cashback
                      </p>
                      <Link to="/stores">
                        <Button>
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Browse Stores
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {cashbackTransactions.map((transaction) => (
                        <div key={transaction.id} className="p-4 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                            {transaction.store?.logo_url ? (
                              <img
                                src={transaction.store.logo_url}
                                alt={transaction.store.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <IndianRupee className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{transaction.store?.name || transaction.description || "Cashback"}</p>
                            <p className="text-sm text-muted-foreground">
                              {transaction.order_id && `Order: ${transaction.order_id} • `}
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${transaction.status === 'confirmed' ? 'text-success' : 'text-warning'}`}>
                              +₹{transaction.amount}
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${transaction.status === 'confirmed'
                              ? 'bg-success/10 text-success'
                              : transaction.status === 'pending'
                                ? 'bg-warning/10 text-warning'
                                : 'bg-muted text-muted-foreground'
                              }`}>
                              {transaction.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Clicks */}
                <div className="bg-card rounded-xl shadow-card overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-bold font-heading">Recent Clicks</h3>
                  </div>

                  {affiliateClicks.length === 0 ? (
                    <div className="p-8 text-center">
                      <ExternalLink className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h4 className="font-semibold text-lg mb-2">No Clicks Yet</h4>
                      <p className="text-muted-foreground">
                        Visit stores to start tracking your activity
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {affiliateClicks.map((click: any) => (
                        <div key={click.id} className="p-4 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                            {click.store?.logo_url ? (
                              <img
                                src={click.store.logo_url}
                                alt={click.store.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Store className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{click.store?.name || "Store"}</p>
                            <p className="text-sm text-muted-foreground">
                              Session: {click.session_id ? click.session_id.substring(0, 8) + '...' : 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(click.clicked_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              Tracked
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "referrals" && (
              <div className="space-y-6">
                <div className="bg-card rounded-xl p-6 shadow-card">
                  <h3 className="font-bold font-heading text-xl mb-4">Refer & Earn</h3>
                  <p className="text-muted-foreground mb-6">
                    Share with your friends and earn ₹100 for each successful referral!
                  </p>

                  <div className="bg-muted rounded-lg p-4 mb-6">
                    <p className="text-sm text-muted-foreground mb-2">Your Referral Link</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={referralLink}
                        readOnly
                        className="flex-1 bg-card border border-border rounded-lg px-4 py-2 text-sm"
                      />
                      <Button onClick={handleCopyReferral}>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center mb-6">
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-2xl font-bold text-primary">{referralStats?.total || 0}</p>
                      <p className="text-sm text-muted-foreground">Invited</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-2xl font-bold text-success">{referralStats?.completed || 0}</p>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-2xl font-bold text-primary">₹{referralStats?.earnings || 0}</p>
                      <p className="text-sm text-muted-foreground">Earned</p>
                    </div>
                  </div>

                  {referrals.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Your Referrals</h4>
                      <div className="divide-y divide-border">
                        {referrals.map((ref) => (
                          <div key={ref.id} className="py-3 flex items-center justify-between">
                            <div>
                              <p className="font-medium">{ref.referred_profile?.full_name || ref.referred_profile?.email || "User"}</p>
                              <p className="text-sm text-muted-foreground">{new Date(ref.created_at).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ref.status === "completed" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                              }`}>
                              {ref.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="bg-card rounded-xl shadow-card overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-bold font-heading">Notifications</h3>
                  {unreadNotifications > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => markAllAsRead.mutate()}>
                      Mark all as read
                    </Button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map((notif) => (
                      <div key={notif.id} className={`p-4 ${!notif.is_read ? "bg-primary/5" : ""}`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${!notif.is_read ? "bg-primary" : "bg-muted"}`} />
                          <div>
                            <p className="font-medium">{notif.title}</p>
                            <p className="text-sm text-muted-foreground">{notif.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notif.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "settings" && (
              <div className="bg-card rounded-xl p-6 shadow-card">
                <h3 className="font-bold font-heading text-xl mb-6">Profile Settings</h3>

                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="pl-10 bg-muted"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Enter your name"
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="Enter your phone number"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Referral Code</label>
                    <Input
                      type="text"
                      value={referralCode}
                      disabled
                      className="bg-muted font-mono"
                    />
                  </div>

                  <Button onClick={handleUpdateProfile} disabled={isSaving}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DashboardPage;