import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Briefcase, Users, Heart, Zap, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const CareersPage = () => {
  const benefits = [
    {
      icon: Heart,
      title: "Health & Wellness",
      description: "Comprehensive health insurance for you and your family",
    },
    {
      icon: Zap,
      title: "Growth Opportunities",
      description: "Learning budget and career development programs",
    },
    {
      icon: Users,
      title: "Great Team",
      description: "Work with passionate and talented individuals",
    },
    {
      icon: Clock,
      title: "Flexible Hours",
      description: "Work-life balance with flexible working hours",
    },
  ];

  const openPositions = [
    {
      title: "Senior Frontend Developer",
      department: "Engineering",
      location: "New Delhi / Remote",
      type: "Full-time",
    },
    {
      title: "Product Manager",
      department: "Product",
      location: "New Delhi",
      type: "Full-time",
    },
    {
      title: "Digital Marketing Specialist",
      department: "Marketing",
      location: "Remote",
      type: "Full-time",
    },
    {
      title: "Customer Support Executive",
      department: "Support",
      location: "New Delhi",
      type: "Full-time",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-r from-secondary to-secondary/80 py-16">
          <div className="container mx-auto text-center">
            <Briefcase className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold font-heading text-secondary-foreground">
              Join Our Team
            </h1>
            <p className="text-secondary-foreground/80 mt-2 max-w-2xl mx-auto">
              Be part of India's fastest growing cashback platform and help millions save money
            </p>
          </div>
        </section>

        {/* Why Join Us */}
        <section className="py-12">
          <div className="container mx-auto">
            <h2 className="text-2xl font-bold font-heading text-center mb-8">
              Why Join Cashback?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="bg-card rounded-xl p-6 shadow-card text-center"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold font-heading mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Open Positions */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto">
            <h2 className="text-2xl font-bold font-heading text-center mb-8">
              Open Positions
            </h2>
            <div className="max-w-3xl mx-auto space-y-4">
              {openPositions.map((position, index) => (
                <div
                  key={index}
                  className="bg-card rounded-xl p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="font-semibold font-heading text-lg">
                      {position.title}
                    </h3>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                      <span>{position.department}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {position.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {position.type}
                      </span>
                    </div>
                  </div>
                  <Button>Apply Now</Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12">
          <div className="container mx-auto text-center">
            <h2 className="text-2xl font-bold font-heading mb-4">
              Don't See a Suitable Role?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              We're always looking for talented individuals. Send us your resume and we'll keep you in mind for future opportunities.
            </p>
            <Button size="lg">
              Send Your Resume
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CareersPage;
