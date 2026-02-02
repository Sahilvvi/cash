import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import DealCard from "@/components/cards/DealCard";
import { useDeals } from "@/hooks/useDeals";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Flame, Tag, Clock, Percent, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const DealsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const { data: deals = [], isLoading } = useDeals();

  const filters = [
    { id: "all", label: "All Deals", icon: Flame },
    { id: "exclusive", label: "Exclusive", icon: Star },
    { id: "coupons", label: "With Coupon", icon: Tag },
    { id: "cashback", label: "High Cashback", icon: Percent },
    { id: "ending", label: "Ending Soon", icon: Clock },
  ];

  const filteredDeals = deals.filter((deal) => {
    const matchesSearch = 
      deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.store?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      activeFilter === "all" ? true :
      activeFilter === "exclusive" ? deal.is_exclusive :
      activeFilter === "coupons" ? deal.coupon_code :
      activeFilter === "cashback" ? (deal.cashback_percent || 0) >= 5 :
      activeFilter === "ending" ? deal.expires_at && new Date(deal.expires_at) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) :
      true;
    return matchesSearch && matchesFilter;
  });

  // Get featured deal (first exclusive deal or first deal)
  const featuredDeal = deals.find(d => d.is_exclusive) || deals[0];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-heading text-foreground mb-2 flex items-center gap-2">
            <Flame className="w-8 h-8 text-primary" />
            Today's Deals
          </h1>
          <p className="text-muted-foreground">
            Discover the hottest deals and exclusive offers from top stores
          </p>
        </div>

        {/* Search & Filters */}
        <div className="bg-card rounded-xl p-4 mb-6 shadow-card">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search deals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <Button
                key={filter.id}
                variant={activeFilter === filter.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter.id)}
              >
                <filter.icon className="w-4 h-4 mr-1" />
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Featured Deal Banner */}
        {featuredDeal && (
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-6 mb-8 text-primary-foreground">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <span className="bg-primary-foreground/20 text-xs px-2 py-1 rounded-full font-semibold mb-2 inline-block">
                  DEAL OF THE DAY
                </span>
                <h2 className="text-2xl font-bold font-heading mb-2">
                  {featuredDeal.title}
                </h2>
                <p className="text-primary-foreground/80">
                  {featuredDeal.description || `Shop from ${featuredDeal.store?.name} and save big!`}
                </p>
              </div>
              <Button variant="secondary" size="lg" className="flex-shrink-0">
                Shop Now
              </Button>
            </div>
          </div>
        )}

        {/* Results Count */}
        <p className="text-muted-foreground text-sm mb-4">
          Showing {filteredDeals.length} deals
        </p>

        {/* Deals Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDeals.map((deal) => (
              <DealCard 
                key={deal.id} 
                id={deal.id}
                title={deal.title}
                description={deal.description || ""}
                store={{
                  name: deal.store?.name || "Unknown Store",
                  logo: deal.store?.logo_url || ""
                }}
                couponCode={deal.coupon_code || undefined}
                cashback={deal.cashback_percent ? `${deal.cashback_percent}%` : deal.discount_text || ""}
                expiresAt={deal.expires_at ? new Date(deal.expires_at).toLocaleDateString() : undefined}
                isExclusive={deal.is_exclusive}
                isVerified={deal.is_verified}
              />
            ))}
          </div>
        )}

        {!isLoading && filteredDeals.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No deals found matching your search.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default DealsPage;
