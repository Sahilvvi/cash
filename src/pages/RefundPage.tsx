import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { RotateCcw } from "lucide-react";

const RefundPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-r from-secondary to-secondary/80 py-12">
          <div className="container mx-auto text-center">
            <RotateCcw className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold font-heading text-secondary-foreground">
              Refund Policy
            </h1>
            <p className="text-secondary-foreground/80 mt-2">Last updated: January 2025</p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-card rounded-xl p-6 md:p-10 shadow-card prose prose-sm max-w-none">
              <h2>1. Cashback Refunds</h2>
              <p>
                Cashback is provided based on successful purchases made through our platform. The following conditions apply to cashback refunds:
              </p>
              <ul>
                <li>If you return a product or cancel an order, the associated cashback will be reversed</li>
                <li>Partial returns will result in proportional cashback adjustments</li>
                <li>Cashback reversals are processed automatically when we receive information from partner stores</li>
              </ul>

              <h2>2. Gift Card Refunds</h2>
              <p>
                Gift cards purchased through our platform are subject to the following refund policy:
              </p>
              <ul>
                <li>Unused gift cards may be refunded within 7 days of purchase</li>
                <li>Partially used gift cards are not eligible for refunds</li>
                <li>Refunds will be credited to your Cashback wallet</li>
              </ul>

              <h2>3. Withdrawal Reversals</h2>
              <p>
                In certain circumstances, withdrawals may be reversed:
              </p>
              <ul>
                <li>If cashback used for withdrawal is later invalidated</li>
                <li>If fraudulent activity is detected</li>
                <li>If there was a technical error in processing</li>
              </ul>

              <h2>4. Processing Time</h2>
              <p>
                Refund processing times vary based on the type of refund:
              </p>
              <ul>
                <li><strong>Wallet Credits:</strong> Instant</li>
                <li><strong>Bank Transfers:</strong> 5-7 business days</li>
                <li><strong>UPI:</strong> 2-3 business days</li>
              </ul>

              <h2>5. Non-Refundable Items</h2>
              <p>
                The following are not eligible for refunds:
              </p>
              <ul>
                <li>Expired cashback or rewards</li>
                <li>Cashback earned through promotional offers that have ended</li>
                <li>Bonus credits given as part of referral programs</li>
              </ul>

              <h2>6. Dispute Resolution</h2>
              <p>
                If you believe you are entitled to a refund that has not been processed:
              </p>
              <ul>
                <li>Contact our support team with your order details</li>
                <li>Provide any relevant documentation (receipts, screenshots)</li>
                <li>Our team will investigate and respond within 48 hours</li>
              </ul>

              <h2>7. Contact Us</h2>
              <p>
                For refund-related queries, please contact us at refunds@cashback.com or through our Help Center.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default RefundPage;
