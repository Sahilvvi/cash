import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Users, Target, Award, TrendingUp, Heart, Shield } from "lucide-react";

const AboutPage = () => {
  const stats = [
    { value: "10L+", label: "Happy Users" },
    { value: "₹50Cr+", label: "Cashback Paid" },
    { value: "300+", label: "Partner Stores" },
    { value: "4.8★", label: "User Rating" },
  ];

  const values = [
    {
      icon: Heart,
      title: "Customer First",
      description: "Every decision we make starts with how it benefits our users. Your savings are our priority.",
    },
    {
      icon: Shield,
      title: "Trust & Transparency",
      description: "We're upfront about how we work, our earnings, and how we share it with you.",
    },
    {
      icon: TrendingUp,
      title: "Always Improving",
      description: "We constantly work to bring you better deals, more stores, and higher cashback rates.",
    },
  ];

  const team = [
    { name: "Rahul Sharma", role: "Founder & CEO", image: "https://i.pravatar.cc/150?img=33" },
    { name: "Priya Singh", role: "Head of Partnerships", image: "https://i.pravatar.cc/150?img=44" },
    { name: "Amit Kumar", role: "CTO", image: "https://i.pravatar.cc/150?img=52" },
    { name: "Neha Gupta", role: "Head of Marketing", image: "https://i.pravatar.cc/150?img=47" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-secondary to-secondary/80 py-16 md:py-24">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold font-heading text-secondary-foreground mb-4">
              About <span className="text-primary">Cashback</span>
            </h1>
            <p className="text-xl text-secondary-foreground/80 max-w-2xl mx-auto">
              India's leading cashback and coupon platform, helping millions save money on every online purchase.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 -mt-8">
          <div className="container mx-auto">
            <div className="bg-card rounded-2xl shadow-lg p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <p className="text-3xl md:text-4xl font-bold font-heading text-primary mb-1">
                      {stat.value}
                    </p>
                    <p className="text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16">
          <div className="container mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold font-heading text-foreground mb-6">
                  Our Story
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Cashback was founded in 2015 with a simple mission: to help Indian shoppers save money on every online purchase. What started as a small team with big dreams has grown into India's most trusted cashback platform.
                  </p>
                  <p>
                    We realized that online stores pay hefty commissions to affiliate marketers, and we thought - why not share this with the actual shoppers? That's how Cashback was born.
                  </p>
                  <p>
                    Today, we partner with over 300 stores across fashion, electronics, travel, food, and more. We've helped our users save over ₹50 crores and counting!
                  </p>
                </div>
              </div>
              <div className="bg-muted rounded-2xl p-8">
                <div className="aspect-square bg-secondary/10 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-6xl font-bold font-heading">
                      <span className="text-secondary">C</span>
                      <span className="text-primary">B</span>
                    </span>
                    <p className="text-muted-foreground mt-2">Since 2015</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-card rounded-2xl p-8 shadow-card">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold font-heading text-foreground mb-4">
                  Our Mission
                </h3>
                <p className="text-muted-foreground">
                  To become every Indian shopper's first stop before making any online purchase. We want to ensure that no one pays full price when they can save with Cashback.
                </p>
              </div>
              <div className="bg-card rounded-2xl p-8 shadow-card">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Award className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold font-heading text-foreground mb-4">
                  Our Vision
                </h3>
                <p className="text-muted-foreground">
                  To return ₹1000 crores back to Indian shoppers by 2030, making smart shopping accessible to everyone across the country.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold font-heading text-foreground text-center mb-12">
              Our Values
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold font-heading text-foreground mb-2">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold font-heading text-foreground text-center mb-4">
              Meet Our Team
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
              The passionate people behind Cashback who work tirelessly to bring you the best deals and cashback offers.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {team.map((member, index) => (
                <div key={index} className="bg-card rounded-xl p-6 text-center shadow-card">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h4 className="font-semibold font-heading text-foreground">
                    {member.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-r from-secondary to-secondary/80">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold font-heading text-secondary-foreground mb-4">
              Join the Savings Revolution
            </h2>
            <p className="text-secondary-foreground/80 mb-8 max-w-xl mx-auto">
              Be part of our growing community of smart shoppers who never miss out on cashback.
            </p>
            <a
              href="/auth?mode=register"
              className="inline-flex bg-primary hover:bg-primary-hover text-primary-foreground px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Start Saving Today
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
