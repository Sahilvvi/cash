import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { UserPlus, MousePointer, ShoppingBag, Wallet, IndianRupee, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HowItWorksPage = () => {
  const steps = [
    {
      icon: UserPlus,
      number: "01",
      title: "Sign Up for FREE",
      description: "Create your Cashback account in less than 30 seconds. It's completely free with no hidden charges.",
      details: [
        "Enter your email address",
        "Create a secure password",
        "Verify your email",
        "Start earning immediately",
      ],
    },
    {
      icon: MousePointer,
      number: "02",
      title: "Click Through Cashback",
      description: "Browse through 300+ partner stores and click on the store you want to shop from.",
      details: [
        "Search or browse stores",
        "Check cashback rates",
        "Click 'Shop Now' button",
        "You'll be redirected to the store",
      ],
    },
    {
      icon: ShoppingBag,
      number: "03",
      title: "Shop as Usual",
      description: "Complete your purchase on the store's website just like you normally would.",
      details: [
        "Add items to cart",
        "Apply any coupon codes",
        "Complete payment",
        "Cashback will be tracked automatically",
      ],
    },
    {
      icon: Wallet,
      number: "04",
      title: "Cashback Gets Tracked",
      description: "Your cashback is tracked within 24-48 hours and appears in your Cashback wallet.",
      details: [
        "Tracking happens automatically",
        "Check status in your dashboard",
        "Pending to Confirmed in 30-90 days",
        "Depends on store's return policy",
      ],
    },
    {
      icon: IndianRupee,
      number: "05",
      title: "Withdraw Your Money",
      description: "Once your cashback is confirmed and you have ₹99 or more, withdraw it instantly!",
      details: [
        "Transfer to bank account",
        "Send to UPI/Paytm",
        "Redeem as gift vouchers",
        "No processing fees",
      ],
    },
  ];

  const faqs = [
    {
      question: "Is Cashback really free?",
      answer: "Yes! Cashback is 100% free to use. We earn commission from stores and share it with you.",
    },
    {
      question: "How does Cashback make money?",
      answer: "When you shop through us, stores pay us a commission. We share the majority of this with you as cashback.",
    },
    {
      question: "Can I use coupons with cashback?",
      answer: "Yes, in most cases you can use store coupons along with earning cashback. Some specific codes may not be eligible.",
    },
    {
      question: "Why does cashback take time to confirm?",
      answer: "Stores confirm cashback after the return period ends. This ensures we only pay for successful purchases.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="steps-gradient py-16 md:py-24">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold font-heading text-secondary-foreground mb-4">
              How <span className="text-primary">Cashback</span> Works
            </h1>
            <p className="text-xl text-secondary-foreground/80 max-w-2xl mx-auto mb-8">
              Earn cashback on every online purchase in 5 simple steps. 
              It's free, easy, and you save money!
            </p>
            <Link to="/auth?mode=register">
              <Button size="xl" className="bg-primary hover:bg-primary-hover">
                Start Earning Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Steps Section */}
        <section className="py-16">
          <div className="container mx-auto">
            <div className="space-y-12">
              {steps.map((step, index) => (
                <div 
                  key={index}
                  className={`flex flex-col md:flex-row gap-8 items-center ${
                    index % 2 === 1 ? "md:flex-row-reverse" : ""
                  }`}
                >
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <step.icon className="w-8 h-8 text-primary" />
                      </div>
                      <span className="text-5xl font-bold font-heading text-muted-foreground/30">
                        {step.number}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold font-heading text-foreground mb-3">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {step.description}
                    </p>
                    <ul className="space-y-2">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-success" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Visual */}
                  <div className="flex-1">
                    <div className="bg-card rounded-2xl p-8 shadow-card">
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                        <step.icon className="w-24 h-24 text-primary/20" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Video Section */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold font-heading text-foreground mb-8">
              Watch How It Works
            </h2>
            <div className="max-w-3xl mx-auto bg-card rounded-2xl p-4 shadow-card">
              <div className="aspect-video bg-secondary/10 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mx-auto mb-4 cursor-pointer hover:scale-110 transition-transform">
                    <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-primary-foreground border-b-[12px] border-b-transparent ml-1" />
                  </div>
                  <p className="text-muted-foreground">2 minute explainer video</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick FAQs */}
        <section className="py-16">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold font-heading text-foreground mb-8 text-center">
              Quick Questions
            </h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-card rounded-xl p-6 shadow-card">
                  <h3 className="font-semibold font-heading text-foreground mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/faq" className="text-primary font-medium hover:underline">
                View all FAQs →
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-secondary to-secondary/80">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold font-heading text-secondary-foreground mb-4">
              Ready to Start Saving?
            </h2>
            <p className="text-secondary-foreground/80 mb-8 max-w-xl mx-auto">
              Join 10 Lakh+ smart shoppers who are already earning cashback on their purchases.
            </p>
            <Link to="/auth?mode=register">
              <Button size="xl" className="bg-primary hover:bg-primary-hover text-primary-foreground">
                Create Free Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorksPage;
