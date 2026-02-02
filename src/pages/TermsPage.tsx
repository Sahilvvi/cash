import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FileText } from "lucide-react";

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-r from-secondary to-secondary/80 py-12">
          <div className="container mx-auto text-center">
            <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold font-heading text-secondary-foreground">
              Terms & Conditions
            </h1>
            <p className="text-secondary-foreground/80 mt-2">Last updated: December 2024</p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-card rounded-xl p-6 md:p-10 shadow-card prose prose-sm max-w-none">
              <h2>1. Introduction</h2>
              <p>
                Welcome to Cashback. These Terms and Conditions govern your use of our website and services. By accessing or using Cashback, you agree to be bound by these Terms.
              </p>

              <h2>2. Definitions</h2>
              <p>
                <strong>"Cashback"</strong> refers to our cashback and coupon platform available at cashback.com.
              </p>
              <p>
                <strong>"User"</strong> refers to any person who accesses or uses our services.
              </p>
              <p>
                <strong>"Cashback"</strong> refers to the monetary reward credited to users for qualifying purchases made through our platform.
              </p>

              <h2>3. User Registration</h2>
              <p>
                To use certain features of Cashback, you must register for an account. You agree to:
              </p>
              <ul>
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Be responsible for all activities under your account</li>
              </ul>

              <h2>4. Cashback Terms</h2>
              <p>
                Cashback is subject to the following conditions:
              </p>
              <ul>
                <li>Cashback rates may vary by store and are subject to change</li>
                <li>Cashback is tracked within 24-48 hours of a qualifying purchase</li>
                <li>Confirmation times vary between 30-90 days depending on the store</li>
                <li>Returned or cancelled orders will not earn cashback</li>
                <li>Using certain coupon codes may affect cashback eligibility</li>
              </ul>

              <h2>5. Withdrawal Policy</h2>
              <p>
                Minimum withdrawal amount is ₹99. Withdrawals can be made to:
              </p>
              <ul>
                <li>Bank accounts (NEFT/IMPS)</li>
                <li>UPI</li>
                <li>Digital wallets (Paytm, PhonePe)</li>
                <li>Gift vouchers</li>
              </ul>
              <p>
                Processing time is typically 24-48 hours for approved withdrawals.
              </p>

              <h2>6. Prohibited Activities</h2>
              <p>
                Users are prohibited from:
              </p>
              <ul>
                <li>Creating multiple accounts</li>
                <li>Using automated tools to access our services</li>
                <li>Manipulating cashback through fraudulent means</li>
                <li>Sharing account credentials with others</li>
                <li>Engaging in any activity that violates applicable laws</li>
              </ul>

              <h2>7. Intellectual Property</h2>
              <p>
                All content on Cashback, including logos, text, and graphics, is our property and protected by copyright laws.
              </p>

              <h2>8. Limitation of Liability</h2>
              <p>
                Cashback is not liable for any indirect, incidental, or consequential damages arising from your use of our services.
              </p>

              <h2>9. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. Continued use of our services constitutes acceptance of modified Terms.
              </p>

              <h2>10. Contact Information</h2>
              <p>
                For questions about these Terms, contact us at support@cashback.com.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default TermsPage;
