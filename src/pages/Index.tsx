import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroCarousel from "@/components/home/HeroCarousel";
import HowItWorksSteps from "@/components/home/HowItWorksSteps";
import SectionHeader from "@/components/home/SectionHeader";
import CategorySection from "@/components/home/CategorySection";
import PromotionalCarousel from "@/components/home/PromotionalCarousel";
import SponsorsSection from "@/components/home/SponsorsSection";
import StoreCard from "@/components/cards/StoreCard";
import DealCard from "@/components/cards/DealCard";
import { useStores } from "@/hooks/useStores";
import { useDeals } from "@/hooks/useDeals";
import { useBanners, useSiteSettings } from "@/hooks/useHomepage";
import { TrendingUp, Flame, Tag, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { data: stores = [], isLoading: storesLoading } = useStores();
  const { data: deals = [], isLoading: dealsLoading } = useDeals();
  const { data: banners = [], isLoading: bannersLoading } = useBanners();
  const { data: settings = {} } = useSiteSettings();

  const trendingStores = stores.filter(s => s.is_trending).slice(0, 12);
  const popularStores = stores.slice(0, 12);
  const topDeals = deals.slice(0, 6);
  const topCoupons = deals.filter(d => d.coupon_code).slice(0, 3);

  const bannerSlides = banners.map(b => ({
    id: b.id,
    image: b.image_url,
    mobileImage: b.mobile_image_url,
    alt: b.title,
    link: b.link || '#'
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Tagline */}
        <div className="bg-muted py-2 text-center">
          <p className="text-sm text-foreground font-medium">
            <span className="font-heading">Cashback:</span> {settings.tagline || "India's Top Cashback & Coupon Destination"}
          </p>
        </div>

        {/* Hero Carousel */}
        <section className="container mx-auto py-6">
          {bannersLoading ? (
            <Skeleton className="w-full h-48 md:h-64 lg:h-80 rounded-xl" />
          ) : bannerSlides.length > 0 ? (
            <HeroCarousel slides={bannerSlides} />
          ) : (
            <div className="w-full h-48 md:h-64 lg:h-80 bg-muted rounded-xl flex items-center justify-center">
              <p className="text-muted-foreground">No banners configured</p>
            </div>
          )}
        </section>

        {/* Shop by Categories - Right below banner */}
        <section className="container mx-auto py-6">
          <CategorySection />
        </section>

        {/* Promotional Offers Carousel */}
        <section className="container mx-auto py-4">
          <PromotionalCarousel />
        </section>

        {/* How It Works */}
        <section className="container mx-auto py-6">
          <HowItWorksSteps />
        </section>

        {/* Trending Stores */}
        <section className="container mx-auto py-8">
          <SectionHeader 
            title="Trending Stores" 
            viewAllLink="/stores"
            icon={<TrendingUp className="w-6 h-6 text-primary" />}
          />
          {storesLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : trendingStores.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {trendingStores.map((store) => (
                <StoreCard 
                  key={store.id} 
                  id={store.slug}
                  name={store.name}
                  logo={store.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(store.name)}&background=random`}
                  cashback={`${store.cashback_percent}%`}
                  cashbackType={store.cashback_type as any}
                  offersCount={store.offers_count || 0}
                  isNew={store.is_new}
                  isTrending={store.is_trending}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No trending stores yet</p>
          )}
        </section>

        {/* Today's Top Deals */}
        <section className="container mx-auto py-8">
          <SectionHeader 
            title="Today's Top Deals" 
            viewAllLink="/deals"
            icon={<Flame className="w-6 h-6 text-primary" />}
          />
          {dealsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : topDeals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topDeals.map((deal) => (
                <DealCard 
                  key={deal.id} 
                  id={deal.id}
                  store={{
                    name: deal.store?.name || 'Store',
                    logo: deal.store?.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(deal.store?.name || 'S')}&background=random`
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
            <p className="text-center text-muted-foreground py-8">No deals yet</p>
          )}
        </section>


        {/* Featured Offers Banner */}
        <section className="container mx-auto py-8">
          <div className="bg-gradient-to-r from-secondary to-secondary/80 rounded-xl p-8 text-secondary-foreground">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-primary fill-primary" />
                  <span className="text-sm font-semibold uppercase tracking-wide text-primary">Exclusive Offer</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold font-heading mb-2">
                  {settings.promo_title || "Earn Extra ₹100 on Your First Purchase"}
                </h3>
                <p className="text-secondary-foreground/80">
                  {settings.promo_description || "Sign up today and get bonus cashback on your first order from any store!"}
                </p>
              </div>
              <a 
                href="/auth?mode=register" 
                className="bg-primary hover:bg-primary-hover text-primary-foreground px-8 py-3 rounded-lg font-semibold transition-colors flex-shrink-0"
              >
                Sign Up Now
              </a>
            </div>
          </div>
        </section>

        {/* Top Coupons */}
        <section className="container mx-auto py-8">
          <SectionHeader 
            title="Top Coupons" 
            viewAllLink="/coupons"
            icon={<Tag className="w-6 h-6 text-primary" />}
          />
          {dealsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : topCoupons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topCoupons.map((deal) => (
                <DealCard 
                  key={deal.id} 
                  id={deal.id}
                  store={{
                    name: deal.store?.name || 'Store',
                    logo: deal.store?.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(deal.store?.name || 'S')}&background=random`
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
            <p className="text-center text-muted-foreground py-8">No coupons yet</p>
          )}
        </section>

        {/* More Stores */}
        <section className="container mx-auto py-8">
          <SectionHeader 
            title="Popular Stores" 
            viewAllLink="/stores"
          />
          {storesLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : popularStores.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {popularStores.map((store) => (
                <StoreCard 
                  key={store.id} 
                  id={store.slug}
                  name={store.name}
                  logo={store.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(store.name)}&background=random`}
                  cashback={`${store.cashback_percent}%`}
                  cashbackType={store.cashback_type as any}
                  offersCount={store.offers_count || 0}
                  isNew={store.is_new}
                  isTrending={store.is_trending}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No stores yet</p>
          )}
        </section>

        {/* Trust Indicators */}
        <section className="container mx-auto py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <p className="text-3xl md:text-4xl font-bold font-heading text-primary mb-1">
                {settings.partner_stores_count || "300+"}
              </p>
              <p className="text-muted-foreground text-sm">Partner Stores</p>
            </div>
            <div className="p-4">
              <p className="text-3xl md:text-4xl font-bold font-heading text-primary mb-1">
                {settings.cashback_paid || "₹50Cr+"}
              </p>
              <p className="text-muted-foreground text-sm">Cashback Paid</p>
            </div>
            <div className="p-4">
              <p className="text-3xl md:text-4xl font-bold font-heading text-primary mb-1">
                {settings.happy_users || "10L+"}
              </p>
              <p className="text-muted-foreground text-sm">Happy Users</p>
            </div>
            <div className="p-4">
              <p className="text-3xl md:text-4xl font-bold font-heading text-primary mb-1">
                {settings.user_rating || "4.8★"}
              </p>
              <p className="text-muted-foreground text-sm">User Rating</p>
            </div>
          </div>
        </section>

        {/* Sponsors Section */}
        <SponsorsSection />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
