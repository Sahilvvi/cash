import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Cookie } from "lucide-react";

const CookiesPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-r from-secondary to-secondary/80 py-12">
          <div className="container mx-auto text-center">
            <Cookie className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold font-heading text-secondary-foreground">
              Cookie Policy
            </h1>
            <p className="text-secondary-foreground/80 mt-2">Last updated: January 2025</p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-card rounded-xl p-6 md:p-10 shadow-card prose prose-sm max-w-none">
              <h2>1. What Are Cookies?</h2>
              <p>
                Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience and allow certain features to work properly.
              </p>

              <h2>2. Types of Cookies We Use</h2>
              
              <h3>Essential Cookies</h3>
              <p>
                These cookies are necessary for the website to function properly. They enable core functionality such as:
              </p>
              <ul>
                <li>User authentication and session management</li>
                <li>Security features</li>
                <li>Remembering your preferences</li>
              </ul>

              <h3>Analytics Cookies</h3>
              <p>
                These cookies help us understand how visitors interact with our website:
              </p>
              <ul>
                <li>Pages visited and time spent</li>
                <li>Traffic sources and user behavior</li>
                <li>Error tracking and performance monitoring</li>
              </ul>

              <h3>Advertising Cookies</h3>
              <p>
                These cookies are used to deliver relevant advertisements:
              </p>
              <ul>
                <li>Tracking affiliate links and conversions</li>
                <li>Showing personalized offers based on your interests</li>
                <li>Measuring the effectiveness of advertising campaigns</li>
              </ul>

              <h3>Third-Party Cookies</h3>
              <p>
                We may use cookies from third-party services:
              </p>
              <ul>
                <li>Google Analytics for website analytics</li>
                <li>Partner store tracking for cashback attribution</li>
                <li>Social media integration</li>
              </ul>

              <h2>3. How We Use Cookies</h2>
              <p>We use cookies to:</p>
              <ul>
                <li>Track your purchases for cashback rewards</li>
                <li>Remember your login status</li>
                <li>Analyze website traffic and usage patterns</li>
                <li>Personalize your experience</li>
                <li>Prevent fraud and ensure security</li>
              </ul>

              <h2>4. Cookie Duration</h2>
              <p>
                Our cookies have varying durations:
              </p>
              <ul>
                <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
                <li><strong>Persistent Cookies:</strong> Remain for a set period (typically 30-365 days)</li>
                <li><strong>Tracking Cookies:</strong> Usually 30-90 days for cashback attribution</li>
              </ul>

              <h2>5. Managing Cookies</h2>
              <p>
                You can control and manage cookies through your browser settings. However, please note that disabling certain cookies may affect the functionality of our website, including:
              </p>
              <ul>
                <li>Inability to track your purchases for cashback</li>
                <li>Having to log in repeatedly</li>
                <li>Losing your preferences and settings</li>
              </ul>

              <h2>6. Browser Settings</h2>
              <p>
                Most browsers allow you to:
              </p>
              <ul>
                <li>View and delete cookies</li>
                <li>Block third-party cookies</li>
                <li>Block all cookies from specific sites</li>
                <li>Clear all cookies when closing the browser</li>
              </ul>

              <h2>7. Updates to This Policy</h2>
              <p>
                We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date.
              </p>

              <h2>8. Contact Us</h2>
              <p>
                If you have questions about our Cookie Policy, please contact us at privacy@cashback.com.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CookiesPage;
