import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("Message sent successfully!", {
      description: "We'll get back to you within 24 hours.",
    });
    
    setFormData({ name: "", email: "", subject: "", message: "" });
    setIsSubmitting(false);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email Us",
      value: "support@cashback.com",
      description: "We reply within 24 hours",
    },
    {
      icon: Phone,
      title: "Call Us",
      value: "+91 9999999999",
      description: "Mon-Sat, 10 AM - 7 PM",
    },
    {
      icon: MapPin,
      title: "Visit Us",
      value: "New Delhi, India",
      description: "Our headquarters",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-secondary to-secondary/80 py-12 md:py-16">
          <div className="container mx-auto text-center">
            <MessageSquare className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-4xl font-bold font-heading text-secondary-foreground mb-4">
              Contact Us
            </h1>
            <p className="text-secondary-foreground/80 max-w-xl mx-auto">
              Have questions or feedback? We'd love to hear from you. Get in touch with our support team.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Contact Info Cards */}
              <div className="lg:col-span-1 space-y-4">
                {contactInfo.map((info, index) => (
                  <div key={index} className="bg-card rounded-xl p-6 shadow-card">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <info.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold font-heading text-foreground mb-1">
                          {info.title}
                        </h3>
                        <p className="text-foreground font-medium">{info.value}</p>
                        <p className="text-sm text-muted-foreground">{info.description}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Response Time */}
                <div className="bg-primary/10 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-foreground">Quick Response</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We typically respond to all queries within 24 hours during business days.
                  </p>
                </div>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-2">
                <div className="bg-card rounded-xl p-6 md:p-8 shadow-card">
                  <h2 className="text-2xl font-bold font-heading text-foreground mb-6">
                    Send us a Message
                  </h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Your Name
                        </label>
                        <Input
                          type="text"
                          placeholder="Enter your name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Email Address
                        </label>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Subject
                      </label>
                      <Input
                        type="text"
                        placeholder="What is this about?"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Message
                      </label>
                      <Textarea
                        placeholder="Write your message here..."
                        rows={6}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                      />
                    </div>

                    <Button type="submit" size="lg" disabled={isSubmitting}>
                      {isSubmitting ? "Sending..." : "Send Message"}
                      <Send className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Map Section (Placeholder) */}
        <section className="py-12 bg-muted">
          <div className="container mx-auto">
            <div className="bg-card rounded-xl overflow-hidden shadow-card">
              <div className="aspect-[21/9] bg-secondary/10 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-primary mx-auto mb-2" />
                  <p className="text-muted-foreground">Map Placeholder</p>
                  <p className="text-sm text-muted-foreground">New Delhi, India</p>
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

export default ContactPage;
