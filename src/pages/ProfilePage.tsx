import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import AvatarUpload from "@/components/profile/AvatarUpload";
import WalletCard from "@/components/wallet/WalletCard";
import WithdrawalHistory from "@/components/wallet/WithdrawalHistory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  User, 
  Mail, 
  Phone, 
  Save, 
  Loader2, 
  Wallet,
  ArrowLeft,
  Copy
} from "lucide-react";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile, isLoading } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        avatar_url: profile.avatar_url || "",
      });
    }
  }, [profile]);

  if (!isLoading && !user) {
    navigate("/auth?mode=login");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const { error } = await updateProfile(form);
    
    setIsSaving(false);
    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated successfully");
    }
  };

  const handleAvatarUpload = (url: string) => {
    setForm({ ...form, avatar_url: url });
    updateProfile({ avatar_url: url });
  };

  const handleCopyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(`${window.location.origin}/auth?ref=${profile.referral_code}`);
      toast.success("Referral link copied!");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto py-8 px-4 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Section */}
          <div className="flex-1">
            <div className="bg-card rounded-xl p-6 shadow-card">
              <h1 className="text-2xl font-bold font-heading mb-6">My Profile</h1>

              <div className="flex flex-col items-center mb-8">
                <AvatarUpload
                  avatarUrl={form.avatar_url}
                  onUpload={handleAvatarUpload}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Click to upload a new photo
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="pl-10 bg-muted"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="Enter your phone number"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                {profile?.referral_code && (
                  <div className="space-y-2">
                    <Label>Your Referral Code</Label>
                    <div className="flex gap-2">
                      <Input
                        value={profile.referral_code}
                        disabled
                        className="bg-muted font-mono"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCopyReferralCode}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Wallet Section */}
          <div className="flex-1">
            <Tabs defaultValue="wallet" className="w-full">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="wallet" className="flex-1">
                  <Wallet className="w-4 h-4 mr-2" />
                  Wallet
                </TabsTrigger>
                <TabsTrigger value="history" className="flex-1">
                  Withdrawals
                </TabsTrigger>
              </TabsList>

              <TabsContent value="wallet">
                <WalletCard />
              </TabsContent>

              <TabsContent value="history">
                <div className="bg-card rounded-xl p-6 shadow-card">
                  <h2 className="text-lg font-bold font-heading mb-4">
                    Withdrawal History
                  </h2>
                  <WithdrawalHistory />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
