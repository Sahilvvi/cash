import { useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import DealCard from "@/components/cards/DealCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Star, Tag, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTrackAffiliateClick } from "@/hooks/useAffiliateTracking";
import { formatCashbackLong, formatCashbackRate } from "@/lib/cashback";
import { toast } from "sonner";

const StoreDetailPage = () => {
  const { slug } = useParams();
  const trackClick = useTrackAffiliateClick();

  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ['store', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug
  });

  const { data: storeDeals = [], isLoading: dealsLoading } = useQuery({
    queryKey: ['store-deals', store?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('*, store:stores(name, logo_url, slug)')
        .eq('store_id', store!.id)
        .eq('is_active', true)
        .order('is_exclusive', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!store?.id
  });

  const features = [
    "Cashback tracked within 24-48 hours",
    "Combine with store coupons",
    "No minimum order value",
    "Works on app & website purchases",
  ];

  const handleShopAndEarn = () => {
    if (!store) return;

    if (!store.affiliate_url) {
      toast.error("This store is not available for cashback yet", {
        description: "The affiliate link is not configured. Please try another store.",
      });
      return;
    }

    const affiliateUrl = store.affiliate_url;

    trackClick.mutate(
      {
        storeId: store.id,
        affiliateUrl,
        networkType: (store as Record<string, unknown>).network_type as string | undefined,
        apiConfig: (store as Record<string, unknown>).api_config as Record<string, string> | undefined,
      },
      {
        onSuccess: () => {
          toast.success("Redirecting to store...", {
            description: "Your visit is being tracked for cashback",
          });
        },
        onError: () => {
          toast.warning("Redirecting to store...", {
            description: "Could not record your visit — cashback may not be tracked",
          });
        },
      },
    );
  };

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <Skeleton className="w-32 h-32 rounded-2xl" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-20 w-80" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Store Not Found</h1>
          <p className="text-muted-foreground">The store you're looking for doesn't exist.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Store Header */}
        <section className="bg-card border-b border-border">
          <div className="container mx-auto py-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Store Logo */}
              <div className="w-32 h-32 bg-muted rounded-2xl flex items-center justify-center p-4">
                <img
                  src={store.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(store.name)}&background=F37022&color=fff&size=128&bold=true`}
                  alt={store.name}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(store.name.substring(0, 2))}&background=F37022&color=fff&size=128&bold=true`;
                  }}
                />
              </div>

              {/* Store Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold font-heading text-foreground">
                    {store.name}
                  </h1>
                  {store.is_trending && (
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-semibold">
                      TRENDING
                    </span>
                  )}
                  {store.is_new && (
                    <span className="bg-success/10 text-success px-2 py-1 rounded-full text-xs font-semibold">
                      NEW
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-warning fill-warning" />
                    <span className="text-sm font-medium">4.5</span>
                    <span className="text-sm text-muted-foreground">(2.3k reviews)</span>
                  </div>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">{store.offers_count || 0} Offers Available</span>
                </div>

                {store.description && (
                  <p className="text-muted-foreground mb-4">{store.description}</p>
                )}

                <div className="bg-primary/10 rounded-xl p-4 inline-flex items-center gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Cashback Reward</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCashbackLong(store.cashback_percent, store.cashback_type)}
                    </p>
                  </div>
                  <Button size="lg" className="flex-shrink-0" onClick={handleShopAndEarn}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Shop & Earn
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto py-6">
          <div className="bg-muted rounded-xl p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cashback Info */}
        <section className="container mx-auto py-6">
          <div className="bg-card rounded-xl p-6 shadow-card">
            <h2 className="text-xl font-bold font-heading mb-4">Cashback Details</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Category</th>
                    <th className="text-left py-3 px-4 font-semibold">Cashback Rate</th>
                    <th className="text-left py-3 px-4 font-semibold">Tracking Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4">{store.category || 'All Products'}</td>
                    <td className="py-3 px-4 text-primary font-semibold">{formatCashbackRate(store.cashback_percent, store.cashback_type)}</td>
                    <td className="py-3 px-4">24-48 hours</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Available Offers */}
        <section className="container mx-auto py-6">
          <h2 className="text-xl font-bold font-heading mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Available Offers & Coupons
          </h2>
          {dealsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : storeDeals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {storeDeals.map((deal) => (
                <DealCard
                  key={deal.id}
                  id={deal.id}
                  store={{
                    name: store.name,
                    logo: store.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(store.name)}&background=random`
                  }}
                  title={deal.title}
                  description={deal.description || ''}
                  couponCode={deal.coupon_code || undefined}
                  cashback={deal.cashback_percent ? `${deal.cashback_percent}%` : undefined}
                  isExclusive={deal.is_exclusive}
                  isVerified={deal.is_verified}
                  expiresAt={deal.expires_at || undefined}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No offers available for this store yet.</p>
          )}
        </section>

        {/* How to Earn */}
        <section className="container mx-auto py-6">
          <div className="bg-gradient-to-r from-secondary to-secondary/80 rounded-xl p-6 text-secondary-foreground">
            <h2 className="text-xl font-bold font-heading mb-4">How to Earn Cashback from {store.name}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">1</div>
                <div>
                  <p className="font-semibold">Click 'Shop & Earn'</p>
                  <p className="text-sm text-secondary-foreground/80">You'll be redirected to {store.name}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">2</div>
                <div>
                  <p className="font-semibold">Complete Your Purchase</p>
                  <p className="text-sm text-secondary-foreground/80">Shop as you normally would</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">3</div>
                <div>
                  <p className="font-semibold">Cashback Tracked!</p>
                  <p className="text-sm text-secondary-foreground/80">Check your dashboard for updates</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Terms */}
        <section className="container mx-auto py-6 mb-8">
          <div className="bg-card rounded-xl p-6 shadow-card">
            <h2 className="text-xl font-bold font-heading mb-4">Terms & Conditions</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Cashback is not applicable on cancelled, returned or exchanged orders
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Cashback may not be tracked if you visit other websites after clicking through Cashback
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Some coupon codes may affect cashback eligibility - check before applying
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Cashback confirmation typically takes 30-90 days after purchase
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Cashback rates are subject to change without prior notice
              </li>
            </ul>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default StoreDetailPage;