import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import StoreCard from "@/components/cards/StoreCard";
import { useStores } from "@/hooks/useStores";
import { useTrackAffiliateClick } from "@/hooks/useAffiliateTracking";
import { formatCashbackShort } from "@/lib/cashback";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Grid, List, TrendingUp, Star, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const StoresPage = () => {
  const { data: stores = [], isLoading } = useStores();
  const trackClick = useTrackAffiliateClick();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLetter, setSelectedLetter] = useState("all");

  const filters = [
    { id: "all", label: "All Stores", icon: Grid },
    { id: "trending", label: "Trending", icon: TrendingUp },
    { id: "top-cashback", label: "Top Cashback", icon: Star },
    { id: "new", label: "New Stores", icon: Clock },
  ];

  const categories = [
    "All Categories",
    "Fashion",
    "Electronics",
    "Travel",
    "Food & Dining",
    "Beauty",
    "Home & Living",
    "Health",
    "Entertainment",
    "Sports",
    "Books",
  ];

  const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const filteredStores = stores.filter((store) => {
    const matchesSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      activeFilter === "all" ? true :
        activeFilter === "trending" ? store.is_trending :
          activeFilter === "top-cashback" ? (store.cashback_percent || 0) >= 5 :
            activeFilter === "new" ? store.is_new :
              true;
    const matchesCategory =
      selectedCategory === "all" || selectedCategory === "all-categories" ? true :
        store.category?.toLowerCase().replace(/\s+/g, "-") === selectedCategory ||
        store.category?.toLowerCase() === selectedCategory.replace(/-/g, " ");
    const matchesLetter =
      selectedLetter === "all" ? true :
        store.name.toUpperCase().startsWith(selectedLetter);
    return matchesSearch && matchesFilter && matchesCategory && matchesLetter;
  });

  const handleShopNow = (store: { id: string; slug: string; affiliate_url: string | null; network_type?: string; api_config?: Record<string, string> }) => {
    const affiliateUrl = store.affiliate_url || `https://${store.slug}.com`;

    trackClick.mutate({
      storeId: store.id,
      affiliateUrl,
      networkType: store.network_type,
      apiConfig: store.api_config
    });

    toast.success("Redirecting to store...", {
      description: "Your visit is being tracked for cashback",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-heading text-foreground mb-2">
            All Stores
          </h1>
          <p className="text-muted-foreground">
            Shop from 300+ stores and earn cashback on every purchase
          </p>
        </div>

        {/* Search & Filters */}
        <div className="bg-card rounded-xl p-4 mb-6 shadow-card">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search stores..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-input rounded-md bg-background text-foreground"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat.toLowerCase().replace(/\s+/g, "-")}>
                  {cat}
                </option>
              ))}
            </select>

            {/* View Toggle */}
            <div className="flex gap-1 bg-muted p-1 rounded-md">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
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

        {/* Alphabet Filter */}
        <div className="bg-card rounded-xl p-4 mb-6 shadow-card">
          <div className="flex flex-wrap gap-1 justify-center">
            <Button
              variant={selectedLetter === "all" ? "default" : "ghost"}
              size="sm"
              className="w-8 h-8 p-0 font-semibold"
              onClick={() => setSelectedLetter("all")}
            >
              All
            </Button>
            {alphabets.map((letter) => (
              <Button
                key={letter}
                variant={selectedLetter === letter ? "default" : "ghost"}
                size="sm"
                className="w-8 h-8 p-0 font-semibold"
                onClick={() => setSelectedLetter(letter)}
              >
                {letter}
              </Button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <p className="text-muted-foreground text-sm mb-4">
          Showing {filteredStores.length} stores
        </p>

        {/* Stores Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className={
            viewMode === "grid"
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
              : "space-y-3"
          }>
            {filteredStores.map((store) => (
              viewMode === "grid" ? (
                <StoreCard
                  key={store.id}
                  id={store.slug}
                  name={store.name}
                  logo={store.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(store.name.substring(0, 2))}&background=1877F2&color=fff&size=128&bold=true`}
                  cashbackPercent={store.cashback_percent}
                  cashbackType={(store.cashback_type as "percent" | "flat" | "voucher") || "percent"}
                  offersCount={store.offers_count || 0}
                  isNew={store.is_new}
                  isTrending={store.is_trending}
                />
              ) : (
                <div key={store.id} className="bg-card rounded-lg p-4 flex items-center gap-4 shadow-card hover:shadow-hover transition-shadow">
                  <img
                    src={store.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(store.name.substring(0, 2))}&background=1877F2&color=fff&size=128&bold=true`}
                    alt={store.name}
                    className="w-16 h-16 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(store.name.substring(0, 2))}&background=1877F2&color=fff&size=128&bold=true`;
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold font-heading">{store.name}</h3>
                    <p className="text-primary text-sm font-medium">
                      {formatCashbackShort(store.cashback_percent, store.cashback_type)}
                    </p>
                    <p className="text-muted-foreground text-xs">{store.offers_count || 0} Offers</p>
                  </div>
                  <Button variant="default" size="sm" onClick={() => handleShopNow(store)}>
                    Shop Now
                  </Button>
                </div>
              )
            ))}
          </div>
        )}

        {!isLoading && filteredStores.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No stores found matching your search.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default StoresPage;
