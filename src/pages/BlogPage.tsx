import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { BookOpen, Calendar, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const BlogPage = () => {
  const featuredPost = {
    title: "How to Maximize Your Cashback Earnings in 2025",
    excerpt: "Discover the best strategies to earn more cashback on every online purchase. From stacking offers to timing your purchases right.",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop",
    author: "Cashback Team",
    date: "January 5, 2025",
    category: "Tips & Tricks",
  };

  const blogPosts = [
    {
      title: "Top 10 Stores with Best Cashback Rates This Month",
      excerpt: "Check out the stores offering the highest cashback percentages in January.",
      image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=250&fit=crop",
      author: "Priya Sharma",
      date: "January 3, 2025",
      category: "Deals",
    },
    {
      title: "Understanding Cashback: A Complete Guide for Beginners",
      excerpt: "New to cashback? Learn how it works and start saving money today.",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop",
      author: "Rahul Verma",
      date: "January 1, 2025",
      category: "Guides",
    },
    {
      title: "Republic Day Sale 2025: Best Cashback Offers",
      excerpt: "Get ready for massive savings with our exclusive cashback deals.",
      image: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&h=250&fit=crop",
      author: "Cashback Team",
      date: "December 28, 2024",
      category: "Sales",
    },
    {
      title: "Gift Cards vs Direct Cashback: Which is Better?",
      excerpt: "Compare the pros and cons of different cashback redemption options.",
      image: "https://images.unsplash.com/photo-1512909006721-3d6018887383?w=400&h=250&fit=crop",
      author: "Anita Desai",
      date: "December 25, 2024",
      category: "Guides",
    },
    {
      title: "How We Helped Users Save ₹10 Crores in 2024",
      excerpt: "A look back at our biggest year yet and the amazing savings our users achieved.",
      image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=250&fit=crop",
      author: "Cashback Team",
      date: "December 20, 2024",
      category: "News",
    },
    {
      title: "5 Common Mistakes That Cost You Cashback",
      excerpt: "Avoid these pitfalls to ensure you never miss out on your cashback rewards.",
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=250&fit=crop",
      author: "Vikram Singh",
      date: "December 15, 2024",
      category: "Tips & Tricks",
    },
  ];

  const categories = ["All", "Tips & Tricks", "Deals", "Guides", "Sales", "News"];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-r from-secondary to-secondary/80 py-12">
          <div className="container mx-auto text-center">
            <BookOpen className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold font-heading text-secondary-foreground">
              Cashback Blog
            </h1>
            <p className="text-secondary-foreground/80 mt-2">
              Tips, guides, and news to help you save more
            </p>
          </div>
        </section>

        {/* Featured Post */}
        <section className="py-12">
          <div className="container mx-auto">
            <div className="bg-card rounded-xl overflow-hidden shadow-card">
              <div className="grid md:grid-cols-2">
                <div className="aspect-video md:aspect-auto">
                  <img
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 md:p-8 flex flex-col justify-center">
                  <span className="text-primary text-sm font-semibold mb-2">
                    {featuredPost.category}
                  </span>
                  <h2 className="text-2xl font-bold font-heading mb-3">
                    {featuredPost.title}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {featuredPost.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {featuredPost.date}
                    </span>
                  </div>
                  <Button className="w-fit">
                    Read More <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-4">
          <div className="container mx-auto">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={category === "All" ? "default" : "outline"}
                  size="sm"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Grid */}
        <section className="py-12">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogPosts.map((post, index) => (
                <article
                  key={index}
                  className="bg-card rounded-xl overflow-hidden shadow-card hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-video">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <span className="text-primary text-xs font-semibold">
                      {post.category}
                    </span>
                    <h3 className="font-semibold font-heading mt-1 mb-2 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {post.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {post.date}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="text-center mt-8">
              <Button variant="outline" size="lg">
                Load More Articles
              </Button>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-12 bg-primary/5">
          <div className="container mx-auto text-center max-w-xl">
            <h2 className="text-2xl font-bold font-heading mb-3">
              Subscribe to Our Newsletter
            </h2>
            <p className="text-muted-foreground mb-6">
              Get the latest deals, tips, and cashback news delivered to your inbox
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 border rounded-lg bg-background"
              />
              <Button>Subscribe</Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPage;
