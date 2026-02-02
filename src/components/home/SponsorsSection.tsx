import { useSponsors } from "@/hooks/useSponsors";
import { Skeleton } from "@/components/ui/skeleton";

const SponsorsSection = () => {
  const { data: sponsors, isLoading } = useSponsors();

  if (isLoading) {
    return (
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-32" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!sponsors || sponsors.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-muted/30 border-t border-border/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-foreground mb-2">
            Our Trusted Partners
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
            We're proud to partner with leading brands to bring you the best deals
          </p>
        </div>

        {/* Sponsors Grid */}
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10 lg:gap-14">
          {sponsors.map((sponsor) => (
            <a
              key={sponsor.id}
              href={sponsor.website_url || "#"}
              target={sponsor.website_url ? "_blank" : undefined}
              rel={sponsor.website_url ? "noopener noreferrer" : undefined}
              className="group relative flex items-center justify-center p-4 rounded-xl bg-card hover:bg-card/80 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              title={sponsor.name}
            >
              <img
                src={sponsor.logo_url}
                alt={sponsor.name}
                className="h-10 md:h-12 lg:h-14 w-auto max-w-[120px] md:max-w-[140px] object-contain grayscale group-hover:grayscale-0 transition-all duration-300 opacity-70 group-hover:opacity-100"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(sponsor.name)}&background=random&size=128`;
                }}
              />
            </a>
          ))}
        </div>

        {/* Trust Badge */}
        <div className="mt-10 text-center">
          <p className="text-xs text-muted-foreground">
            🤝 Partnering with {sponsors.length}+ trusted brands for your savings
          </p>
        </div>
      </div>
    </section>
  );
};

export default SponsorsSection;
