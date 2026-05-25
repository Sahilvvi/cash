import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useGiftCards, useUserGiftCards, usePurchaseGiftCard, GiftCard } from "@/hooks/useGiftCards";
import { Button } from "@/components/ui/button";
import { Gift, CreditCard, Copy, Eye, EyeOff, ShoppingBag, Check } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const GiftCardsPage = () => {
  const { user } = useAuth();
  const { data: giftCards = [], isLoading } = useGiftCards();
  const { data: userGiftCards = [] } = useUserGiftCards();
  const purchaseMutation = usePurchaseGiftCard();

  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showPinCard, setShowPinCard] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"buy" | "my-cards">("buy");

  const handleBuy = async () => {
    if (!selectedCard || !selectedAmount) return;

    try {
      await purchaseMutation.mutateAsync({
        giftCardId: selectedCard.id,
        amount: selectedAmount,
      });

      toast.success("Gift card purchased successfully!", {
        description: "Check your 'My Gift Cards' to view the code.",
      });

      setShowPurchaseModal(false);
      setSelectedCard(null);
      setSelectedAmount(null);
      setActiveTab("my-cards");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to purchase gift card");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };

  const categories = [...new Set(giftCards.map((gc) => gc.category).filter(Boolean))];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-r from-primary to-primary/80 py-12 md:py-16">
          <div className="container mx-auto text-center">
            <Gift className="w-16 h-16 text-primary-foreground mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold font-heading text-primary-foreground mb-4">
              Gift Cards
            </h1>
            <p className="text-primary-foreground/80 max-w-xl mx-auto">
              Buy discounted gift cards and save even more on your favorite brands!
            </p>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto">
            {/* Tabs */}
            <div className="flex gap-4 mb-8 justify-center">
              <Button
                variant={activeTab === "buy" ? "default" : "outline"}
                onClick={() => setActiveTab("buy")}
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Buy Gift Cards
              </Button>
              {user && (
                <Button
                  variant={activeTab === "my-cards" ? "default" : "outline"}
                  onClick={() => setActiveTab("my-cards")}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  My Gift Cards ({userGiftCards.length})
                </Button>
              )}
            </div>

            {activeTab === "buy" && (
              <>
                {/* Categories */}
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6 justify-center">
                    <Button variant="outline" size="sm">All</Button>
                    {categories.map((cat) => (
                      <Button key={cat} variant="ghost" size="sm">{cat}</Button>
                    ))}
                  </div>
                )}

                {/* Gift Cards Grid */}
                {isLoading ? (
                  <div className="text-center py-12">Loading gift cards...</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {giftCards.map((card) => (
                      <div key={card.id} className="bg-card rounded-xl shadow-card overflow-hidden group">
                        <div className="aspect-video bg-muted flex items-center justify-center p-6">
                          {card.image_url ? (
                            <img
                              src={card.image_url}
                              alt={card.name}
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <Gift className="w-16 h-16 text-muted-foreground" />
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold font-heading text-lg mb-1">{card.name}</h3>
                          <p className="text-sm text-muted-foreground mb-3">{card.brand}</p>
                          
                          {card.discount_percent > 0 && (
                            <span className="inline-block bg-success/10 text-success text-xs font-semibold px-2 py-1 rounded-full mb-3">
                              Save {card.discount_percent}%
                            </span>
                          )}

                          <Button
                            className="w-full"
                            onClick={() => {
                              if (!user) {
                                toast.error("Please login to purchase gift cards");
                                return;
                              }
                              setSelectedCard(card);
                              setShowPurchaseModal(true);
                            }}
                          >
                            Buy Now
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "my-cards" && (
              <>
                {!user ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">Please login to view your gift cards</p>
                    <Link to="/auth?mode=login">
                      <Button>Login</Button>
                    </Link>
                  </div>
                ) : userGiftCards.length === 0 ? (
                  <div className="text-center py-12">
                    <Gift className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">You haven't purchased any gift cards yet</p>
                    <Button onClick={() => setActiveTab("buy")}>Browse Gift Cards</Button>
                  </div>
                ) : (
                  <div className="grid gap-4 max-w-2xl mx-auto">
                    {userGiftCards.map((userCard) => (
                      <div key={userCard.id} className="bg-card rounded-xl p-6 shadow-card">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                            {userCard.gift_card?.image_url ? (
                              <img
                                src={userCard.gift_card.image_url}
                                alt={userCard.gift_card.name}
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <Gift className="w-8 h-8 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold font-heading">{userCard.gift_card?.name}</h3>
                            <p className="text-2xl font-bold text-primary">₹{userCard.amount}</p>
                            <p className="text-xs text-muted-foreground">
                              Purchased on {new Date(userCard.purchased_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            userCard.status === "active" ? "bg-success/10 text-success" :
                            userCard.status === "redeemed" ? "bg-muted text-muted-foreground" :
                            "bg-destructive/10 text-destructive"
                          }`}>
                            {userCard.status.charAt(0).toUpperCase() + userCard.status.slice(1)}
                          </span>
                        </div>

                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-muted-foreground">Code:</span>
                            <code className="bg-muted px-2 py-1 rounded font-mono text-sm flex-1">
                              {userCard.code}
                            </code>
                            <Button variant="ghost" size="sm" onClick={() => copyCode(userCard.code)}>
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                          {userCard.pin && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">PIN:</span>
                              <code className="bg-muted px-2 py-1 rounded font-mono text-sm flex-1">
                                {showPinCard === userCard.id ? userCard.pin : "••••"}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowPinCard(showPinCard === userCard.id ? null : userCard.id)}
                              >
                                {showPinCard === userCard.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      {/* Purchase Modal */}
      <Dialog open={showPurchaseModal} onOpenChange={setShowPurchaseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buy {selectedCard?.name}</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">Select amount:</p>
            <div className="grid grid-cols-3 gap-2">
              {(selectedCard?.denominations as number[] || []).map((amount) => (
                <Button
                  key={amount}
                  variant={selectedAmount === amount ? "default" : "outline"}
                  onClick={() => setSelectedAmount(amount)}
                  className="h-auto py-3"
                >
                  <div className="text-center">
                    <p className="font-bold">₹{amount}</p>
                    {selectedCard?.discount_percent && selectedCard.discount_percent > 0 && (
                      <p className="text-xs opacity-80">
                        Pay ₹{Math.round(amount * (1 - selectedCard.discount_percent / 100))}
                      </p>
                    )}
                  </div>
                </Button>
              ))}
            </div>

            {selectedAmount && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex justify-between mb-2">
                  <span>Gift Card Value</span>
                  <span>₹{selectedAmount}</span>
                </div>
                {selectedCard?.discount_percent && selectedCard.discount_percent > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Discount ({selectedCard.discount_percent}%)</span>
                    <span>-₹{Math.round(selectedAmount * selectedCard.discount_percent / 100)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-border">
                  <span>You Pay</span>
                  <span>₹{selectedCard?.discount_percent 
                    ? Math.round(selectedAmount * (1 - selectedCard.discount_percent / 100))
                    : selectedAmount
                  }</span>
                </div>
              </div>
            )}

            <Button
              className="w-full mt-6"
              disabled={!selectedAmount || purchaseMutation.isPending}
              onClick={handleBuy}
            >
              {purchaseMutation.isPending ? "Processing..." : "Buy Gift Card"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default GiftCardsPage;
