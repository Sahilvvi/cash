import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AlertCircle, Search, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const MissingCashbackPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    orderNumber: "",
    storeName: "",
    orderAmount: "",
    orderDate: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Please Login",
        description: "You need to be logged in to submit a missing cashback claim.",
        variant: "destructive",
      });
      return;
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast({
      title: "Claim Submitted",
      description: "We'll review your claim and get back to you within 48 hours.",
    });
    
    setFormData({
      orderNumber: "",
      storeName: "",
      orderAmount: "",
      orderDate: "",
      description: "",
    });
  };

  const steps = [
    {
      icon: Search,
      title: "Submit Claim",
      description: "Fill out the form with your order details",
    },
    {
      icon: Clock,
      title: "We Investigate",
      description: "Our team reviews your claim with the partner store",
    },
    {
      icon: CheckCircle,
      title: "Get Your Cashback",
      description: "Cashback is credited once claim is approved",
    },
  ];

  const commonReasons = [
    "Ad-blocker was enabled during purchase",
    "Used a non-Cashback coupon code",
    "Visited other websites before completing purchase",
    "Order was cancelled or returned",
    "Cashback is still pending confirmation",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-r from-secondary to-secondary/80 py-12">
          <div className="container mx-auto text-center">
            <AlertCircle className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold font-heading text-secondary-foreground">
              Missing Cashback?
            </h1>
            <p className="text-secondary-foreground/80 mt-2 max-w-2xl mx-auto">
              Don't worry! Submit a claim and we'll help you recover your cashback
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-12">
          <div className="container mx-auto">
            <h2 className="text-2xl font-bold font-heading text-center mb-8">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {steps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold font-heading mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Claim Form */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Form */}
              <div className="bg-card rounded-xl p-6 shadow-card">
                <h2 className="text-xl font-bold font-heading mb-6">
                  Submit a Claim
                </h2>
                
                {!user ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Please login to submit a missing cashback claim
                    </p>
                    <Button asChild>
                      <Link to="/auth">Login to Continue</Link>
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Store Name</label>
                      <Input
                        required
                        value={formData.storeName}
                        onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                        placeholder="e.g., Amazon, Flipkart"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Order Number</label>
                      <Input
                        required
                        value={formData.orderNumber}
                        onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                        placeholder="Enter your order number"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Order Amount (₹)</label>
                        <Input
                          required
                          type="number"
                          value={formData.orderAmount}
                          onChange={(e) => setFormData({ ...formData, orderAmount: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Order Date</label>
                        <Input
                          required
                          type="date"
                          value={formData.orderDate}
                          onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Additional Details</label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Any additional information that might help us"
                        rows={3}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Submit Claim
                    </Button>
                  </form>
                )}
              </div>

              {/* Common Reasons */}
              <div>
                <div className="bg-card rounded-xl p-6 shadow-card">
                  <h2 className="text-xl font-bold font-heading mb-4">
                    Common Reasons for Missing Cashback
                  </h2>
                  <ul className="space-y-3">
                    {commonReasons.map((reason, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-semibold text-primary">{index + 1}</span>
                        </div>
                        <span className="text-muted-foreground text-sm">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-primary/10 rounded-xl p-6 mt-4">
                  <h3 className="font-semibold font-heading mb-2">Tips for Future Purchases</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Disable ad-blockers before shopping</li>
                    <li>• Complete your purchase in one session</li>
                    <li>• Use only Cashback-approved coupon codes</li>
                    <li>• Check if cashback is tracked within 24 hours</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default MissingCashbackPage;
