import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Shield } from "lucide-react";

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-r from-secondary to-secondary/80 py-12">
          <div className="container mx-auto text-center">
            <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold font-heading text-secondary-foreground">
              Privacy Policy
            </h1>
            <p className="text-secondary-foreground/80 mt-2">Last updated: January 2025</p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-card rounded-xl p-6 md:p-10 shadow-card prose prose-sm max-w-none">
              <h2>1. Information We Collect</h2>
              <p>
                We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.
              </p>
              <ul>
                <li><strong>Personal Information:</strong> Name, email address, phone number, and payment details</li>
                <li><strong>Transaction Data:</strong> Purchase history, cashback earnings, and withdrawal information</li>
                <li><strong>Device Information:</strong> IP address, browser type, and device identifiers</li>
                <li><strong>Usage Data:</strong> How you interact with our platform and services</li>
              </ul>

              <h2>2. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul>
                <li>Process your transactions and provide cashback rewards</li>
                <li>Send you notifications about your account and transactions</li>
                <li>Improve our services and develop new features</li>
                <li>Detect and prevent fraud and abuse</li>
                <li>Comply with legal obligations</li>
              </ul>

              <h2>3. Information Sharing</h2>
              <p>We may share your information with:</p>
              <ul>
                <li><strong>Partner Stores:</strong> To track your purchases and provide cashback</li>
                <li><strong>Payment Processors:</strong> To process withdrawals and payments</li>
                <li><strong>Service Providers:</strong> Who assist us in operating our platform</li>
                <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
              </ul>

              <h2>4. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>

              <h2>5. Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Data portability</li>
              </ul>

              <h2>6. Cookies</h2>
              <p>
                We use cookies and similar technologies to enhance your experience, analyze usage, and assist in our marketing efforts. You can manage your cookie preferences through your browser settings.
              </p>

              <h2>7. Third-Party Links</h2>
              <p>
                Our platform may contain links to third-party websites. We are not responsible for the privacy practices of these external sites.
              </p>

              <h2>8. Children's Privacy</h2>
              <p>
                Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children.
              </p>

              <h2>9. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page.
              </p>

              <h2>10. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at privacy@cashback.com.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPage;
