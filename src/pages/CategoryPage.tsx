import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import StoreCard from "@/components/cards/StoreCard";
import DealCard from "@/components/cards/DealCard";
import { useStores } from "@/hooks/useStores";
import { useDeals } from "@/hooks/useDeals";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// Map all category slugs to display names
const categoryNames: Record<string, string> = {
  // From homepage categories
  "most-popular": "Most Popular",
  "electronics": "Electronics",
  "fashion": "Fashion",
  "home-kitchen": "Home & Kitchen",
  "cashback-offers": "Min 50% Cashback Offers",
  "credit-cards": "Credit Cards",
  "mobiles": "Mobiles",
  "beauty-grooming": "Beauty & Grooming",
  "travel": "Travel",
  "food-grocery": "Food & Grocery",
  "pharmacy": "Pharmacy",
  "new-stores": "New on Cashback",
  "education": "Education",
  "loans": "Loans",
  "health-wellness": "Health & Wellness",
  "departmental": "Departmental Stores",
  "bonus-cashback": "Bonus Cashback Offers",
  // From footer categories
  "food": "Food & Dining",
  "health": "Health & Beauty",
  // Database categories
  "food-dining": "Food & Dining",
  "beauty": "Beauty",
  "home-living": "Home & Living",
  "entertainment": "Entertainment",
  "sports": "Sports & Fitness",
  "books": "Books & Education",
  "finance": "Finance",
  "baby": "Baby & Kids",
};

// Map special slugs to filter criteria
const categoryFilters: Record<string, (store: any) => boolean> = {
  "most-popular": (store) => store.is_trending || store.offers_count > 10,
  "cashback-offers": (store) => (store.cashback_percent || 0) >= 50,
  "new-stores": (store) => store.is_new === true,
  "bonus-cashback": (store) => (store.cashback_percent || 0) >= 10,
};

// Map homepage slugs to actual database category names
const slugToCategoryName: Record<string, string[]> = {
  "electronics": ["Electronics"],
  "fashion": ["Fashion"],
  "home-kitchen": ["Home & Living", "Home & Kitchen"],
  "mobiles": ["Electronics"], // Mobiles fall under Electronics
  "beauty-grooming": ["Beauty", "Beauty & Grooming"],
  "travel": ["Travel"],
  "food-grocery": ["Food & Dining", "Food & Grocery"],
  "pharmacy": ["Health", "Pharmacy"],
  "education": ["Books", "Education"],
  "loans": ["Finance", "Loans"],
  "health-wellness": ["Health", "Health & Wellness"],
  "departmental": ["Home & Living", "Departmental"],
  "credit-cards": ["Finance", "Credit Cards"],
  "food-dining": ["Food & Dining"],
  "beauty": ["Beauty"],
  "home-living": ["Home & Living"],
  "entertainment": ["Entertainment"],
  "sports": ["Sports", "Sports & Fitness"],
  "books": ["Books"],
  "health": ["Health"],
  "food": ["Food & Dining"],
};

const CategoryPage = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { data: stores, isLoading: storesLoading } = useStores();
  const { data: deals, isLoading: dealsLoading } = useDeals();

  const categoryName = categorySlug 
    ? categoryNames[categorySlug] || categorySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : "Category";

  // Filter stores by category with special handling for certain slugs
  const filteredStores = stores?.filter((store) => {
    // Check for special filter first
    if (categorySlug && categoryFilters[categorySlug]) {
      return categoryFilters[categorySlug](store);
    }
    
    // Get mapped category names for this slug
    const mappedCategories = categorySlug ? slugToCategoryName[categorySlug] : null;
    const storeCategory = store.category?.toLowerCase() || "";
    const slug = categorySlug?.toLowerCase() || "";
    
    // Check if store's category matches any of the mapped categories
    if (mappedCategories) {
      return mappedCategories.some(cat => storeCategory === cat.toLowerCase());
    }
    
    // Fallback: Direct match or contains
    return storeCategory === slug || 
           storeCategory.includes(slug) || 
           slug.includes(storeCategory.replace(/[^a-z]/g, '')) ||
           storeCategory.replace(/[^a-z]/g, '') === slug.replace(/-/g, '');
  }) || [];

  const filteredDeals = deals?.filter((deal) => {
    const store = stores?.find((s) => s.id === deal.store_id);
    
    // Check for special filter first
    if (categorySlug && categoryFilters[categorySlug]) {
      return store && categoryFilters[categorySlug](store);
    }
    
    // Get mapped category names for this slug
    const mappedCategories = categorySlug ? slugToCategoryName[categorySlug] : null;
    const storeCategory = store?.category?.toLowerCase() || "";
    const slug = categorySlug?.toLowerCase() || "";
    
    // Check if store's category matches any of the mapped categories
    if (mappedCategories) {
      return mappedCategories.some(cat => storeCategory === cat.toLowerCase());
    }
    
    // Fallback matching
    return storeCategory === slug || 
           storeCategory.includes(slug) ||
           slug.includes(storeCategory.replace(/[^a-z]/g, '')) ||
           storeCategory.replace(/[^a-z]/g, '') === slug.replace(/-/g, '');
  }) || [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-background py-8 md:py-12">
          <div className="container mx-auto px-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold font-heading text-foreground">
              {categoryName}
            </h1>
            <p className="text-muted-foreground mt-2">
              Discover the best cashback offers and deals in {categoryName}
            </p>
          </div>
        </section>

        {/* Stores Section */}
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-xl md:text-2xl font-bold font-heading text-foreground mb-6">
              {categoryName} Stores
            </h2>
            
            {storesLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-xl" />
                ))}
              </div>
            ) : filteredStores.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredStores.map((store) => (
                  <StoreCard
                    key={store.id}
                    id={store.id}
                    name={store.name}
                    logo={store.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(store.name.substring(0, 2))}&background=F37022&color=fff&size=128&bold=true`}
                    cashback={`${store.cashback_percent || 0}%`}
                    cashbackType={(store.cashback_type as "percent" | "flat" | "voucher") || "percent"}
                    isNew={store.is_new || false}
                    isTrending={store.is_trending || false}
                    offersCount={store.offers_count || 0}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-xl">
                <p className="text-muted-foreground">No stores found in this category yet.</p>
                <Link to="/stores">
                  <Button variant="link" className="mt-2">
                    Browse all stores
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Deals Section */}
        <section className="py-8 md:py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-xl md:text-2xl font-bold font-heading text-foreground mb-6">
              {categoryName} Deals & Coupons
            </h2>
            
            {dealsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
              </div>
            ) : filteredDeals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDeals.map((deal) => {
                  const store = stores?.find((s) => s.id === deal.store_id);
                  return (
                    <DealCard
                      key={deal.id}
                      id={deal.id}
                      title={deal.title}
                      description={deal.description || ""}
                      store={{
                        name: store?.name || "Store",
                        logo: store?.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent((store?.name || "S").substring(0, 2))}&background=F37022&color=fff&size=128&bold=true`,
                      }}
                      couponCode={deal.coupon_code || undefined}
                      cashback={deal.cashback_percent ? `${deal.cashback_percent}%` : undefined}
                      expiresAt={deal.expires_at ? `Expires ${new Date(deal.expires_at).toLocaleDateString()}` : undefined}
                      isExclusive={deal.is_exclusive || false}
                      isVerified={deal.is_verified || false}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-background rounded-xl">
                <p className="text-muted-foreground">No deals found in this category yet.</p>
                <Link to="/deals">
                  <Button variant="link" className="mt-2">
                    Browse all deals
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CategoryPage;
