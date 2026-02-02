import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { faqs } from "@/data/mockData";
import { Plus, Minus, Search, HelpCircle } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { id: "general", name: "General", count: 5 },
    { id: "cashback", name: "Cashback", count: 8 },
    { id: "withdrawal", name: "Withdrawal", count: 6 },
    { id: "account", name: "Account", count: 4 },
    { id: "referral", name: "Referral", count: 3 },
  ];

  const allFaqs = [
    ...faqs,
    {
      question: "How do I track my cashback?",
      answer: "You can track all your cashback in the 'My Cashback' section of your dashboard. You'll see pending, confirmed, and withdrawn amounts.",
    },
    {
      question: "What is the minimum withdrawal amount?",
      answer: "The minimum withdrawal amount is ₹99. Once you have ₹99 or more confirmed cashback, you can withdraw to your bank account, UPI, or as gift vouchers.",
    },
    {
      question: "How do I refer friends?",
      answer: "Go to your dashboard and click on 'Refer & Earn'. Share your unique referral link with friends. When they sign up and make their first purchase, both of you earn bonus cashback!",
    },
    {
      question: "Can I use multiple coupon codes?",
      answer: "Most stores allow only one coupon code per order. However, you can always earn Cashback on top of any discounts you get from coupon codes.",
    },
  ];

  const filteredFaqs = allFaqs.filter((faq) =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-secondary to-secondary/80 py-12 md:py-16">
          <div className="container mx-auto text-center">
            <HelpCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-4xl font-bold font-heading text-secondary-foreground mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-secondary-foreground/80 mb-8 max-w-xl mx-auto">
              Find answers to common questions about Cashback, withdrawals, and more.
            </p>
            
            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search your question..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-card"
              />
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Categories Sidebar */}
              <div className="lg:w-64 flex-shrink-0">
                <div className="bg-card rounded-xl p-4 shadow-card sticky top-24">
                  <h3 className="font-semibold font-heading mb-4">Categories</h3>
                  <ul className="space-y-1">
                    {categories.map((cat) => (
                      <li key={cat.id}>
                        <button className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted transition-colors text-left">
                          <span className="text-sm">{cat.name}</span>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {cat.count}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* FAQ List */}
              <div className="flex-1">
                <div className="space-y-3">
                  {filteredFaqs.map((faq, index) => (
                    <div
                      key={index}
                      className="bg-card rounded-xl shadow-card overflow-hidden"
                    >
                      <button
                        className="w-full flex items-center justify-between p-5 text-left"
                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                      >
                        <span className="font-semibold font-heading text-foreground pr-4">
                          {faq.question}
                        </span>
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          {openIndex === index ? (
                            <Minus className="w-4 h-4 text-primary" />
                          ) : (
                            <Plus className="w-4 h-4 text-muted-foreground" />
                          )}
                        </span>
                      </button>
                      {openIndex === index && (
                        <div className="px-5 pb-5 animate-fade-in">
                          <p className="text-muted-foreground leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {filteredFaqs.length === 0 && (
                  <div className="text-center py-12 bg-card rounded-xl">
                    <p className="text-muted-foreground">No questions found matching your search.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Still Have Questions */}
        <section className="py-12 bg-muted">
          <div className="container mx-auto text-center">
            <h2 className="text-2xl font-bold font-heading text-foreground mb-4">
              Still Have Questions?
            </h2>
            <p className="text-muted-foreground mb-6">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary-hover transition-colors"
            >
              Contact Support
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FAQPage;
