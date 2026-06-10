import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Store, Tag, Gift, FolderTree } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { Database } from "@/integrations/supabase/types";

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type SubcategoryRow = Database["public"]["Tables"]["subcategories"]["Row"];
type StoreRow = Database["public"]["Tables"]["stores"]["Row"];
type GiftCardRow = Database["public"]["Tables"]["gift_cards"]["Row"];
type DealRow = Database["public"]["Tables"]["deals"]["Row"];

interface DealWithStore extends DealRow {
  store?: { name: string } | null;
}

interface CategoryDetailViewProps {
  category: CategoryRow;
  onBack: () => void;
}

const CategoryDetailView = ({ category, onBack }: CategoryDetailViewProps) => {
  // Fetch subcategories for this category
  const { data: subcategories = [] } = useQuery({
    queryKey: ["subcategories", category.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subcategories")
        .select("*")
        .eq("category_id", category.id)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  // Fetch stores for this category
  const { data: stores = [] } = useQuery({
    queryKey: ["category_stores", category.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .or(`category_id.eq.${category.id},category.eq.${category.name}`)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch deals for this category
  const { data: deals = [] } = useQuery({
    queryKey: ["category_deals", category.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*, store:stores(name)")
        .eq("category_id", category.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch gift cards for this category
  const { data: giftCards = [] } = useQuery({
    queryKey: ["category_giftcards", category.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gift_cards")
        .select("*")
        .eq("category", category.name)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-heading">{category.name}</h1>
          <p className="text-sm text-muted-foreground">Category Details</p>
        </div>
      </div>

      <Tabs defaultValue="subcategories">
        <TabsList className="mb-4">
          <TabsTrigger value="subcategories" className="flex items-center gap-2">
            <FolderTree className="w-4 h-4" />
            Subcategories ({subcategories.length})
          </TabsTrigger>
          <TabsTrigger value="stores" className="flex items-center gap-2">
            <Store className="w-4 h-4" />
            Stores ({stores.length})
          </TabsTrigger>
          <TabsTrigger value="deals" className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Deals ({deals.length})
          </TabsTrigger>
          <TabsTrigger value="giftcards" className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Gift Cards ({giftCards.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subcategories">
          <div className="bg-card rounded-xl shadow-card overflow-hidden">
            {subcategories.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No subcategories found for this category
              </div>
            ) : (
              <div className="divide-y divide-border">
                {(subcategories as SubcategoryRow[]).map((sub) => (
                  <div key={sub.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{sub.name}</p>
                      <p className="text-sm text-muted-foreground">{sub.slug}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${sub.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                      {sub.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="stores">
          <div className="bg-card rounded-xl shadow-card overflow-hidden">
            {stores.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No stores found for this category
              </div>
            ) : (
              <div className="divide-y divide-border">
                {(stores as StoreRow[]).map((store) => (
                  <div key={store.id} className="p-4 flex items-center gap-4">
                    <img
                      src={store.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(store.name)}&background=random`}
                      alt={store.name}
                      className="w-12 h-12 rounded-lg object-contain bg-muted"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{store.name}</p>
                      <p className="text-sm text-muted-foreground">{store.cashback_percent}% cashback</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${store.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                      {store.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="deals">
          <div className="bg-card rounded-xl shadow-card overflow-hidden">
            {deals.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No deals found for this category
              </div>
            ) : (
              <div className="divide-y divide-border">
                {(deals as DealWithStore[]).map((deal) => (
                  <div key={deal.id} className="p-4 flex items-center gap-4">
                    <div className="flex-1">
                      <p className="font-semibold">{deal.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {deal.store?.name} | {deal.coupon_code || "No code"}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${deal.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                      {deal.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="giftcards">
          <div className="bg-card rounded-xl shadow-card overflow-hidden">
            {giftCards.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No gift cards found for this category
              </div>
            ) : (
              <div className="divide-y divide-border">
                {(giftCards as GiftCardRow[]).map((gc) => (
                  <div key={gc.id} className="p-4 flex items-center gap-4">
                    <img
                      src={gc.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(gc.brand)}&background=random`}
                      alt={gc.name}
                      className="w-12 h-12 rounded-lg object-contain bg-muted"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{gc.name}</p>
                      <p className="text-sm text-muted-foreground">{gc.brand} | {gc.discount_percent}% off</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${gc.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                      {gc.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CategoryDetailView;
